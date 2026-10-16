**English** · [한국어](README.ko.md)

[← Previous: 02. Functions and Objects](../02-functions-objects/README.md) · [Contents](../../README.md) · [Next: 04. Classes and Errors →](../04-classes-errors/README.md)

# 03. Unions and Narrowing — Parsing 0xFF, 0b1010, 1_000 (DevCalc Lv2)

> Series: DH.Study.TypeScript · Lesson 03
> Environment: Node.js v24 · TypeScript 7 · VS Code

## Goals

After this lesson you can:

- [ ] Write union types (`string | number`) and literal unions (`"HEX" | "DEC" | "BIN"`)
- [ ] Use an `as const` object + a union instead of `enum`
- [ ] Narrow a union with `typeof`, `===`, `in`, `Array.isArray` and truthiness checks
- [ ] Write a type guard function (`strText is TRadixName`)
- [ ] Model "success or failure" with a discriminated union, and make `switch` check every case with `never`
- [ ] Handle values that may be missing with `?.`, `??` and early returns — and know why `!` is risky
- [ ] Give DevCalc its own input parser for `-0xFF`, `0b1010`, `0o17` and `1_000`

## Contents

1. [Union types — one of several types](#1-union-types--one-of-several-types)
2. [Narrowing — checks that make the type smaller](#2-narrowing--checks-that-make-the-type-smaller)
3. [Discriminated unions — a tag and a switch](#3-discriminated-unions--a-tag-and-a-switch)
4. [Values that may be missing](#4-values-that-may-be-missing)
5. [Try it](#5-try-it)
6. [Build it — an integer parser](#6-build-it--an-integer-parser)
7. [DevCalc step — Lv2 input parser](#7-devcalc-step--lv2-input-parser)
8. [Summary](#summary)

Example files for this lesson: [unions.ts](unions.ts) · [narrowing.ts](narrowing.ts) · [discriminated.ts](discriminated.ts) · [optional.ts](optional.ts) · [parse.ts](parse.ts)

> Each example has a Korean-comment twin (`x.ko.ts`) with the same code. The Korean lesson ([README.ko.md](README.ko.md)) uses those.

> Syntax tags: **[JS]** = JavaScript syntax (exists without TS) · **[TS]** = type syntax that TypeScript adds (erase it and you get JS) · details in [lesson 00, 7-3](../00-setup/README.md#7-3-ts-syntax--js-syntax--type-syntax)

---

## 1. Union types — one of several types

```
type TName = TypeA | TypeB | ...;
```

### 1-1. Union `|`

**[TS]**

```ts
let vInput: string | number = "255";
vInput = 255;     // OK
vInput = true;    // ✕ TS2322: Type 'boolean' is not assignable to type 'string | number'
```

- Reads as "a string **or** a number". The value is always exactly one of them at runtime.
- C# has no union types like this. You would use `object` and cast, write overloads, or build a base class. In TS a value from JSON or a command line often really is "this or that", so unions are everywhere.
- Naming: a value whose type varies gets the `v` prefix (`vInput`).

### 1-2. Literal unions

**[TS]**

```ts
type TRadixName = "HEX" | "DEC" | "BIN";
let strRadix: TRadixName = "HEX";
strRadix = "OCT";   // ✕ TS2322: Type '"OCT"' is not assignable to type 'TRadixName'
```

- A string literal can itself be a type: `"HEX"` is the type whose only value is `"HEX"`.
- A union of literals is a closed list of allowed values. The editor autocompletes them, and a typo is an error.
- At runtime it is just a string — nothing to convert, nothing generated.

### 1-3. Instead of enum — an `as const` object

**[JS + TS]**

```ts
const RADIX = { HEX: 16, DEC: 10, BIN: 2 } as const;
type TRadixKey = keyof typeof RADIX;      // "HEX" | "DEC" | "BIN"
type TRadix = (typeof RADIX)[TRadixKey];  // 16 | 10 | 2

function RadixOf(strKey: TRadixKey): TRadix {
	return RADIX[strKey];
}
```

| | C# `enum` | literal union | `as const` object + union |
|---|---|---|---|
| Runtime value | an integer | the string itself | a real object (`RADIX.HEX`) |
| List the members at runtime | `Enum.GetValues` | ✕ (types are erased) | `Object.keys(RADIX)` |
| Runs with `node` directly (lesson 00) | — | ○ | ○ |
| Use when | — | a small fixed set of names | names that map to values (`HEX → 16`) |

- `as const` makes every property `readonly` and keeps the literal values (`16`, not `number`).
- `typeof RADIX` takes the **type of a value**; `keyof` gives the union of its keys; `T[K]` looks up the property types.
- This repo doesn't use `enum` at all — see [lesson 00, enum-sample.ts](../00-setup/README.md).

### 1-4. `T | undefined` — the most common union

**[TS]**

```ts
const strFound = arrName.find((strName) => strName.startsWith("O"));   // TRadixName | undefined
strFound.length;   // ✕ TS18048: 'strFound' is possibly 'undefined'
```

You have already met it: optional parameters (`strTitle?: string`) in lesson 02 are `string | undefined`. `find`, `Map.get` and array indexing (section 4) return it too. With `strict` on, TS makes you check before use. Section 2 shows how.

## 2. Narrowing — checks that make the type smaller

**[JS + TS]** — the checks are plain JS; TS reads them and narrows the type

```ts
function ToBigInt(vValue: string | number | bigint): bigint {
	if (typeof vValue === "bigint") {
		return vValue;                       // bigint
	}
	if (typeof vValue === "number") {
		return BigInt(Math.trunc(vValue));   // number
	}
	return BigInt(vValue.trim());            // only string is left
}
```

Inside each `if`, TS knows the narrower type. After a `return`, the rest of the function knows that case is gone. Hover over `vValue` in each branch to see it change.

### 2-1. Checks TS understands

| Check | Narrows | Example |
|---|---|---|
| `typeof x === "string"` | primitives (`string`, `number`, `bigint`, `boolean`, `undefined`, `object`, `function`) | `typeof vValue === "bigint"` |
| `x === value` | literal unions, `undefined`, `null` | `strChar === "+" \|\| strChar === "-"` → `"+" \| "-"` |
| `"key" in x` | object unions by property | `"biValue" in oItem` → `IRegister` |
| `Array.isArray(x)` | one value or an array | `string \| string[]` → `string[]` |
| `if (x)` | removes `undefined` / `null` (and `""`, `0`!) | `if (strName)` |
| `x instanceof C` | class instances | lesson 04 |

- C# pattern matching `if (o is string s)` makes a **new** variable `s`. TS narrows the **same** variable — no new name, no cast.
- Truthiness is a trap with numbers and strings: `if (nSize)` treats `0` like "missing", and `if (strName)` treats `""` like "missing". When `0` or `""` is a valid value, compare with `=== undefined`.

### 2-2. Type guard functions — `x is T`

**[TS]**

```ts
const RADIX_NAMES = ["HEX", "DEC", "BIN"] as const;
type TRadixName = (typeof RADIX_NAMES)[number];   // "HEX" | "DEC" | "BIN"

function IsRadixName(strText: string): strText is TRadixName {
	return (RADIX_NAMES as readonly string[]).includes(strText);
}

if (IsRadixName(strText)) {
	const strName: TRadixName = strText;   // narrowed by the guard
}
```

- When a check is too long for one `if`, put it in a function whose return type is `strText is TRadixName`. The caller's `if` narrows as if it wrote the check itself.
- TS **trusts** the guard. If the function body is wrong, the narrowing is wrong too — keep guards short.
- `(typeof RADIX_NAMES)[number]` means "the type of any element of this array". With `as const` that is the union of the literals, so the list and the type never drift apart.

### 2-3. `unknown` — check step by step

**[JS + TS]**

```ts
const vData: unknown = JSON.parse('{"strName":"AX","nBits":16}');
vData.nBits;   // ✕ TS18046: 'vData' is of type 'unknown'

if (typeof vData === "object" && vData !== null && "nBits" in vData && typeof vData.nBits === "number") {
	vData.nBits;   // number
}
```

Lesson 01 said "prefer `unknown` over `any`". This is why: `unknown` forces exactly these checks. Each `&&` narrows a little more (`typeof null` is also `"object"`, hence `!== null`).

## 3. Discriminated unions — a tag and a switch

### 3-1. A common tag property

**[TS]**

```ts
type TToken =
	| { strKind: "number"; biValue: bigint }
	| { strKind: "op"; strOp: "+" | "-" | "*" | "/" }
	| { strKind: "paren"; bOpen: boolean };

function DescribeToken(oToken: TToken): string {
	switch (oToken.strKind) {
		case "number": return `number ${oToken.biValue}`;   // only this member has biValue
		case "op":     return `operator ${oToken.strOp}`;
		case "paren":  return oToken.bOpen ? "open paren" : "close paren";
		default:       return AssertNever(oToken);
	}
}
```

- Every member has the same property (`strKind`) with a **different literal value**. Checking that one property narrows to one member.
- This is how DevCalc's lexer will describe tokens in lesson 10.
- C# equivalent: an abstract `record Token` with sealed subclasses and a `switch` expression on the type. F# calls it a discriminated union.

### 3-2. Exhaustiveness check — `never`

**[TS]**

```ts
function AssertNever(oValue: never): never {
	throw new Error(`Unexpected value: ${JSON.stringify(oValue)}`);
}
```

- After all three cases, nothing is left: `oToken` is `never` in `default`.
- Add a fourth kind to `TToken` (or delete a case) and `AssertNever(oToken)` turns red (TS2345) — **the compiler lists the places you forgot to update**.
- `never` was in lesson 01 as "a function that never returns". Here it is also "a value that can't exist".

### 3-3. `as` checks nothing

**[TS]**

```ts
const oBad = JSON.parse('{"strKind":"space"}') as TToken;   // compiles
DescribeToken(oBad);   // runtime: falls into default → AssertNever throws
```

`as` is not C#'s cast — it doesn't convert or check anything, it only tells TS what to believe. Data from outside must be checked (2-3). `AssertNever` is a safety net for when that slips.

### 3-4. Success or failure without exceptions

**[TS]**

```ts
type TParseResult = { bOk: true; biValue: bigint } | { bOk: false; strError: string };

const oResult = ParseDecimal("12a");
if (oResult.bOk) {
	oResult.biValue;    // success member
} else {
	oResult.strError;   // failure member
}
oResult.biValue;   // ✕ TS2339: not checked yet
```

- Like C#'s `int.TryParse(s, out var n)`: bad input is an **expected** result, not an exception.
- Unlike `TryParse`, the failure carries a reason, and you **can't** read `biValue` without checking `bOk` first.
- Section 6 builds the parser on this. Lesson 05 makes it generic: `TResult<T, E>`.

## 4. Values that may be missing

**[JS]** for `?.` and `??`, **[TS]** for `!` and the checks

```ts
oConfig.oGrouping?.nSize          // undefined if oGrouping is missing — no exception
oConfig.oGrouping?.nSize ?? 4     // default only for null / undefined
arrDigit[2]                       // string | undefined (noUncheckedIndexedAccess)
arrDigit[0]!                      // "trust me" — no check at runtime
```

| | TS / JS | C# |
|---|---|---|
| Optional chaining | `o?.p`, `fn?.()` | `o?.P` — same |
| Default for missing | `x ?? y` | `x ?? y` — same |
| Default for any falsy | `x \|\| y` (also replaces `0`, `""`, `false`) | — |
| "Not null, trust me" | `x!` | `x!` (null-forgiving) — same |
| Index out of range | `undefined` | `IndexOutOfRangeException` |

- `??` vs `||`: with `{ nSize: 0 }` meaning "no grouping", `nSize || 4` silently turns `0` into `4`. Use `??` for defaults unless you really mean "any falsy value".
- `noUncheckedIndexedAccess` (on in this repo's tsconfig) makes `arr[i]` and `oRecord[key]` include `undefined`, because JS returns `undefined` instead of throwing.
- **Early return** is the cleanest check: `if (strChar === undefined) { return "(empty)"; }` — every line after it sees `string`.
- `!` removes `undefined` from the type and **nothing else**. A wrong `!` crashes exactly like having no TS at all. Use it only when you just proved the value exists and TS can't see it.

---

## 5. Try it

Open each file and press `F5`, or run it from the command line. If you can't run code, read the code alongside the output below.

### [unions.ts](unions.ts) — unions, literal unions, as const, T | undefined

```
> node lessons/03-unions-narrowing/unions.ts
1) vInput = 255 / typeof = string
   vInput = 255 / typeof = number
2) strRadix = BIN
3) Describe: FF 255
4) RADIX.HEX = 16 / RadixOf("BIN") = 2 / keys = HEX, DEC, BIN
5) find O* = undefined
6) Expected error: Cannot read properties of undefined (reading 'length')
   Why : find found nothing and returned undefined, which has no properties.
   Fix : TS flags it (TS18048). Check for undefined first — narrowing.ts.
```

Things to try: uncomment `// strRadix = "OCT";`. Then type `strRadix = "` and press `Ctrl+Space` — the editor lists the three allowed values.

### [narrowing.ts](narrowing.ts) — typeof, truthiness, ===, in, Array.isArray, type guards, unknown

```
> node lessons/03-unions-narrowing/narrowing.ts
1) ToBigInt: 255n 255n 255n
2) Label: HEX (none) (none)
3) SignOf: - undefined
4) Show: AX = 255 / ZF is on
5) CountInputs: 1 3
6) HEX is a TRadixName
6) OCT is just a string
7) nBits from JSON = 16
```

Line 2: `Label("")` printed `(none)` — the truthiness trap from 2-1. Things to try: hover over `vValue` on each `return` line in `ToBigInt`.

### [discriminated.ts](discriminated.ts) — tag + switch, never, as, success-or-failure

```
> node lessons/03-unions-narrowing/discriminated.ts
2) open paren / number 1 / operator + / number 2 / close paren
4) Expected error: Unexpected value: {"strKind":"space"}
   Why : as TToken only told TS what to believe; "space" is not in the union.
   Fix : check outside data before use (narrowing.ts 7). AssertNever caught it here.
5) ok    : 255n
5) error : not a decimal integer: "12a"
```

Things to try: delete the `case "paren":` lines and look at `AssertNever(oToken)`. Then add `| { strKind: "space" }` to `TToken` and see the same squiggle.

### [optional.ts](optional.ts) — ?., ?? vs ||, indexing, early return, !

```
> node lessons/03-unions-narrowing/optional.ts
1) full: 4 / empty: undefined
2) nSize 0 with ?? = 0 / with || = 4 (0 was lost)
   separator "" with ?? = "" / with || = "_"
3) arrDigit[2] = undefined / length = 0
4) FirstChar: H (empty)
5) arrDigit[0]! = 0
   Expected error: Cannot read properties of undefined (reading 'length')
   Why : ! only silences TS; the value was still undefined at runtime.
   Fix : check it (if / ?? / ?.) instead of using !.
```

## 6. Build it — an integer parser

**[JS + TS]**

Until now DevCalc handed the input to `BigInt()`, which rejects `1_000`, `0xFFFF_FFFF` and `-0xFF`, and says only `SyntaxError` when it fails. We write our own. Full code: [parse.ts](parse.ts).

### The result type and the prefix table

```ts
type TParseResult = { bOk: true; biValue: bigint } | { bOk: false; strError: string };

const PREFIX_RULES = {
	"0x": { nRadix: 16, strName: "hex" },
	"0o": { nRadix: 8, strName: "octal" },
	"0b": { nRadix: 2, strName: "binary" },
} as const;
type TPrefix = keyof typeof PREFIX_RULES;   // "0x" | "0o" | "0b"

function IsPrefix(strText: string): strText is TPrefix {
	return Object.hasOwn(PREFIX_RULES, strText);
}
```

`Object.hasOwn` instead of `in`: `"constructor" in {}` is `true` (inherited), `Object.hasOwn` checks only the object's own keys.

### Sign → prefix → `_` → digits

```ts
function ParseInteger(strInput: string): TParseResult {
	let strText = strInput.trim().toLowerCase();
	if (strText === "") {
		return Fail("empty input");
	}

	let bNegative = false;
	const strFirst = strText[0];                   // string | undefined
	if (strFirst === "-" || strFirst === "+") {    // narrowed to "-" | "+"
		bNegative = strFirst === "-";
		strText = strText.slice(1);
	}

	let oRule: IRadixRule = DECIMAL_RULE;
	const strHead = strText.slice(0, 2);
	if (IsPrefix(strHead)) {
		oRule = PREFIX_RULES[strHead];   // strHead is TPrefix, so this lookup is safe
		strText = strText.slice(2);
	}

	if (strText.startsWith("_") || strText.endsWith("_") || strText.includes("__")) {
		return Fail(`"_" must sit between digits`);
	}
	const strDigits = strText.replaceAll("_", "");
	if (strDigits === "") {
		return Fail(`no digits after the sign or prefix`);
	}

	const biRadix = BigInt(oRule.nRadix);
	let biValue = 0n;
	for (const strChar of strDigits) {
		const nDigit = DIGITS.indexOf(strChar);   // DIGITS = "0123456789abcdef"
		if (nDigit < 0 || nDigit >= oRule.nRadix) {
			return Fail(`"${strChar}" is not a valid ${oRule.strName} digit`);
		}
		biValue = biValue * biRadix + BigInt(nDigit);
	}
	return { bOk: true, biValue: bNegative ? -biValue : biValue };
}
```

- Every early `return Fail(...)` is a narrowing step: after it, the code knows that problem is gone.
- `value = value * radix + digit` reads digits from left to right: `"1A"` (hex) → `0×16+1 = 1` → `1×16+10 = 26`.
- Using `bigint` throughout means a 64-bit (or longer) input never loses precision (lesson 01).

### Run it

```
> node lessons/03-unions-narrowing/parse.ts
1) valid:
   "255"          → 255
   "-0xFF"        → -255
   "0b1010"       → 10
   "0o17"         → 15
   "1_000"        → 1000
   "0xFFFF_FFFF"  → 4294967295
   "+42"          → 42
   " 0XAB "       → 171
2) invalid:
   ""             → error: empty input
   "0x"           → error: no digits after the sign or prefix
   "12a"          → error: "a" is not a valid decimal digit
   "0b102"        → error: "2" is not a valid binary digit
   "1__0"         → error: "_" must sit between digits
   "_1"           → error: "_" must sit between digits
   "0xG"          → error: "g" is not a valid hex digit
```

Things to try: DevCalc prints decimals as `1,234,567`. Make the parser accept `,` in decimal input too, so the output can be pasted back.

## 7. DevCalc step — Lv2 input parser

[devcalc/src/core/Parse.ts](../../devcalc/src/core/Parse.ts) is the parser from section 6, exported:

```ts
export type TParseResult = { readonly bOk: true; readonly biValue: bigint } | { readonly bOk: false; readonly strError: string };
export function ParseInteger(strInput: string): TParseResult { ... }
```

[devcalc/src/main.ts](../../devcalc/src/main.ts) replaces the `BigInt()` try/catch:

```ts
const oParsed = ParseInteger(strInput);
if (!oParsed.bOk) {
	console.log(`Invalid input: "${strInput}"`);
	console.log(`Why : ${oParsed.strError}`);
	console.log("Fix : use an integer like 255, -0xFF, 0b1010, 0o17 or 1_000.");
	process.exit(1);
}
const biValue = oParsed.biValue;   // narrowed : bOk is true here
```

`process.exit` returns `never`, so after the `if` TS knows `oParsed` is the success member.

Run it:

```
> node devcalc/src/main.ts 0xFFFF_FFFF
HEX : 0xFFFF_FFFF
DEC : 4,294,967,295
BIN : 0b1111_1111_1111_1111_1111_1111_1111_1111

> node devcalc/src/main.ts 0o777
HEX : 0x1FF
DEC : 511
BIN : 0b1_1111_1111

> node devcalc/src/main.ts -0b1010 --no-group
HEX : -0xA
DEC : -10
BIN : -0b1010

> node devcalc/src/main.ts 0x1G
Invalid input: "0x1G"
Why : "g" is not a valid hex digit
Fix : use an integer like 255, -0xFF, 0b1010, 0o17 or 1_000.
```

> These are the outputs as of lesson 03. [Lesson 11](../11-regex-literal-types/README.md) adds `1'000`, `1Fh`, `4K` and `'A'`, so the "Fix" line lists those too.

The DevCalc output can now be fed back in: `0xFFFF_FFFF` was rejected in lesson 02.

Tests: [devcalc/tests/Parse.test.ts](../../devcalc/tests/Parse.test.ts) is new.

```ts
function ParseOk(strInput: string): bigint {
	const oResult = ParseInteger(strInput);
	assert.ok(oResult.bOk, `expected success: "${strInput}"`);
	return oResult.biValue;   // assert.ok is an assertion function → narrowed
}
```

`assert.ok` is declared as `asserts value`, so TS narrows after it just like after an `if`.

```
> npm test
check-pairs : 20 pairs, 0 failed
✔ Format: 255
✔ Format: zero and negative
✔ GroupDigits
✔ Format options
✔ Parse: decimal and sign
✔ Parse: prefixes and case
✔ Parse: _ separators
✔ Parse: invalid input
ℹ pass 8
```

## Summary

- `A | B` : a value that is one of several types. Literal unions (`"HEX" | "DEC"`) are closed lists of values.
- Instead of `enum`: an `as const` object + `keyof typeof` / `(typeof X)[K]`.
- Narrowing: `typeof`, `===`, `in`, `Array.isArray`, truthiness, and type guards (`x is T`). TS narrows the same variable — no cast.
- Truthiness also removes `0` and `""`. Use `=== undefined` or `??` when those are valid values.
- Discriminated union = a common tag + `switch`. `AssertNever` (`never`) makes the compiler find missing cases.
- `as` and `!` check nothing at runtime. Data from outside goes through `unknown` + checks.
- A result union (`{ bOk: true; ... } | { bOk: false; ... }`) instead of exceptions for expected failures.

**Next → [04. Classes and Errors](../04-classes-errors/README.md)**: `class`, `private` / `#private`, `instanceof`, custom `Error` classes and `try`/`catch` with `unknown`. DevCalc Lv3 gets a word size (8/16/32/64-bit) and two-number calculations.

---

[← Previous: 02. Functions and Objects](../02-functions-objects/README.md) · [Contents](../../README.md) · [Next: 04. Classes and Errors →](../04-classes-errors/README.md)
