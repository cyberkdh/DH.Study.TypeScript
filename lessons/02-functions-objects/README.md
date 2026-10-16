**English** · [한국어](README.ko.md)

[← Previous: 01. Basic Types and bigint](../01-basic-types/README.md) · [Contents](../../README.md) · [Next: 03. Unions and Narrowing →](../03-unions-narrowing/README.md)

# 02. Functions and Objects — Digit Grouping and Output Options (DevCalc Lv1)

> Series: DH.Study.TypeScript · Lesson 02
> Environment: Node.js v24 · TypeScript 7 · VS Code

## Goals

After this lesson you can:

- [ ] Write functions as declarations and as arrow functions, and know how they differ
- [ ] Annotate parameters and return values, and write a function type (`(nA: number) => string`)
- [ ] Use optional (`?`), default (`=`) and rest (`...`) parameters, and pass options as one object
- [ ] Describe an object's shape with `interface` or `type`, using `?` and `readonly`
- [ ] Explain structural typing — the biggest difference from C#'s type system
- [ ] Pass functions as values (callbacks, closures, a table of functions)
- [ ] Add digit grouping (`0xFFFF_FFFF`) and output options to DevCalc

## Contents

1. [Functions — declarations and arrow functions](#1-functions--declarations-and-arrow-functions)
2. [Parameters — optional, default, rest, options object](#2-parameters--optional-default-rest-options-object)
3. [Object types — interface and type](#3-object-types--interface-and-type)
4. [Structural typing — different from C#](#4-structural-typing--different-from-c)
5. [Functions as values — callbacks and closures](#5-functions-as-values--callbacks-and-closures)
6. [Try it](#6-try-it)
7. [Build it — digit grouping and output options](#7-build-it--digit-grouping-and-output-options)
8. [DevCalc step — grouping, options, a table of functions](#8-devcalc-step--grouping-options-a-table-of-functions)
9. [Summary](#summary)

Example files for this lesson: [functions.ts](functions.ts) · [parameters.ts](parameters.ts) · [objects.ts](objects.ts) · [callbacks.ts](callbacks.ts) · [group.ts](group.ts)

> Each example has a Korean-comment twin (`x.ko.ts`) with the same code. The Korean lesson ([README.ko.md](README.ko.md)) uses those.

> Syntax tags: **[JS]** = JavaScript syntax (exists without TS) · **[TS]** = type syntax that TypeScript adds (erase it and you get JS) · details in [lesson 00, 7-3](../00-setup/README.md#7-3-ts-syntax--js-syntax--type-syntax)

---

## 1. Functions — declarations and arrow functions

```
function name(param: type, ...): returnType { ... }
const    name = (param: type, ...): returnType => expression;
```

### 1-1. Two ways to write a function

**[JS]**

```ts
function Add(nA: number, nB: number): number {   // function declaration
	return nA + nB;
}
const Multiply = (nA: number, nB: number): number => nA * nB;   // arrow function
```

| | Function declaration | Arrow function (in a `const`) |
|---|---|---|
| Looks like | C# method | C# lambda `(a, b) => a * b` |
| Call above its line | ○ (hoisting) | ✕ `Cannot access ... before initialization` |
| Body | `{ ... return ...; }` | one expression, or `{ ... }` |
| Use for | named, top-level functions | short functions, callbacks |

- There are no methods outside classes in C#, but in JS **a function can stand on its own** in a file.
- An arrow function is just a value stored in a `const`, so it follows the `const` rules from lesson 01.

### 1-2. Annotating parameters and return values

**[TS]**

```ts
function ToUpperHex(nValue: number): string { ... }
const Square = (nA: number) => nA * nA;     // return type inferred → number
```

- **Parameters need a type.** Without one they become `any` (and `strict` mode reports an error).
- The return type is inferred, so it can be left out. Writing it on public functions makes mistakes inside the function show up right there.
- TS also checks the **number of arguments**. Plain JS doesn't: `Add(1)` runs and gives `NaN`.

### 1-3. Function types

**[TS]**

```ts
type TBinaryOp = (nA: number, nB: number) => number;

const fnPlus: TBinaryOp = Add;
const fnTimes: TBinaryOp = (nA, nB) => nA * nB;   // nA, nB types come from TBinaryOp
```

- Reads as "a function that takes two numbers and returns a number". Same role as C#'s `Func<int, int, int>` or a `delegate`.
- The parameter **names** in a function type are just labels. Only the types and order matter.
- Naming: a function type is a type alias, so it gets the `T` prefix; a variable holding a function gets `fn`.

## 2. Parameters — optional, default, rest, options object

### 2-1. Optional parameter `?`

**[TS]**

```ts
function Greet(strName: string, strTitle?: string): string {
	return strTitle === undefined ? `Hello, ${strName}` : `Hello, ${strTitle} ${strName}`;
}
Greet("Hong");          // "Hello, Hong"
Greet("Hong", "Dr.");   // "Hello, Dr. Hong"
```

- Inside the function, `strTitle` is `string | undefined`. **Check it before use.** (That `|` is a union type — lesson 03.)
- Optional parameters must come **after** the required ones (TS1016).

### 2-2. Default value `=`

**[JS]**

```ts
function ToRadix(nValue: number, nRadix = 16): string { ... }   // nRadix: number (inferred)
```

Same as a C# optional parameter `int radix = 16`. The type is inferred from the default value.

### 2-3. Rest parameter `...` and spread

**[JS]** — the `: number[]` part is **[TS]**

```ts
function Sum(...arrNum: number[]): number { ... }
Sum(1, 2, 3);              // 6
Sum(...[8, 16, 32, 64]);   // spread an array into arguments → 120
```

The rest parameter is C#'s `params int[]`. The `...` that spreads an array into arguments is the **spread** syntax.

### 2-4. Options object

**[JS + TS]**

```ts
function FormatHex(nValue: number, { bPrefix = true, bUpperCase = true }: { bPrefix?: boolean; bUpperCase?: boolean } = {}): string { ... }

FormatHex(255);                          // "0xFF"
FormatHex(255, { bUpperCase: false });   // "0xff"
```

- When there are several optional settings, take them as **one object**. The call site shows what each value means, like C#'s named arguments `FormatHex(255, upperCase: false)`.
- `{ bPrefix = true, ... }` is lesson 01's destructuring, plus a default for each property.
- `= {}` at the end lets the caller leave out the whole object.
- The inline type `{ bPrefix?: boolean; ... }` is long. Section 3 gives it a name.

## 3. Object types — interface and type

### 3-1. Object literal

**[JS]**

```ts
const oWord = { strName: "WORD", nBits: 16 };   // inferred → { strName: string; nBits: number }
oWord.nBytes;   // ✕ TS2339: Property 'nBytes' does not exist
```

In C# you need a class or an anonymous type first. In JS, `{ key: value }` **is** the object.

### 3-2. interface

**[TS]**

```ts
interface IWordSize {
	readonly strName: string;   // can't be reassigned
	nBits: number;
	strNote?: string;           // optional property
}
const oDword: IWordSize = { strName: "DWORD", nBits: 32 };
```

- `?` : the property may be missing (`undefined`).
- `readonly` : assigning to it is an error (TS2540). It is **type-only** — at runtime the assignment still happens. Use `Object.freeze` when it must hold at runtime.
- A TS `interface` describes data shape. Unlike C#, there's no `class` that has to `implement` it — a plain object literal is enough.

### 3-3. type

**[TS]**

```ts
type TWordSize = {
	readonly strName: string;
	nBits: number;
	strNote?: string;
};
type TBits = number;   // interface can't name a primitive
```

### 3-4. interface or type?

| | `interface` | `type` |
|---|---|---|
| Object shape | ○ | ○ |
| Primitive, union, function type | ✕ | ○ (`type TBits = number`, `type TBinaryOp = (...) => ...`) |
| Extend | `interface IRegister extends IWordSize { ... }` | `type TRegister = TWordSize & { ... }` (intersection) |
| Declare twice | merged into one (declaration merging) | error |

- Rule of thumb in this series: **object shapes → `interface`, everything else → `type`.**
- Naming: `I` prefix for interfaces, `T` for other type aliases (see the naming table in the root README).

### 3-5. Methods in an object type

**[TS]**

```ts
interface IFormatter {
	strName: string;
	Format(biValue: bigint): string;
}
const oHexFormatter: IFormatter = {
	strName: "hex",
	Format(biValue) { return "0x" + biValue.toString(16).toUpperCase(); },   // biValue: bigint from IFormatter
};
```

## 4. Structural typing — different from C#

**[TS]**

```ts
const oFromType: IWordSize = oQword;    // TWordSize → IWordSize : OK, same shape

const oPlain = { strName: "BYTE", nBits: 8, bSigned: false };
const oByte: IWordSize = oPlain;        // OK : has everything IWordSize needs

const oTypo: IWordSize = { strName: "WORD", nBit: 16 };   // ✕ TS2561: did you mean 'nBits'?
```

- C# is **nominal**: types are compatible only if they share a name (inheritance, `implements`). Two classes with identical members are still different types.
- TS is **structural**: **if the shape fits, it is compatible**, whatever the name. Often called "duck typing, checked at compile time".
- Extra properties are fine when passed through a variable. But when you write an object literal **directly**, an unknown key is flagged (excess property check). That catches typos like `nBit`.

> Why: JS objects come from everywhere (JSON, libraries, literals) without a class, so TS checks shape, not ancestry.

## 5. Functions as values — callbacks and closures

**[JS]** — the function type annotations are **[TS]**

### 5-1. Callbacks

```ts
function PrintAll(arrValue: bigint[], fnFormat: (biValue: bigint) => string): void { ... }
PrintAll([10n, 255n], (biValue) => "0x" + biValue.toString(16).toUpperCase());
```

Array methods take callbacks too. They correspond to C# LINQ:

| JS | C# LINQ | Example |
|---|---|---|
| `map` | `Select` | `arrBits.map((nBits) => nBits / 8)` → `[1, 2, 4, 8]` |
| `filter` | `Where` | `arrBits.filter((nBits) => nBits >= 32)` → `[32, 64]` |
| `reduce` | `Aggregate` | `arrBits.reduce((nSum, nBits) => nSum + nBits, 0)` → `120` |
| `find` | `FirstOrDefault` | returns `undefined` when nothing matches |

### 5-2. Closures

```ts
function MakeFormatter(nRadix: number, strPrefix: string): (biValue: bigint) => string {
	return (biValue) => strPrefix + biValue.toString(nRadix).toUpperCase();
}
const fnHex = MakeFormatter(16, "0x");
fnHex(255n);   // "0xFF" — still remembers nRadix and strPrefix
```

The returned function **keeps the variables of the function that made it** (closure). Same as a C# lambda capturing a local variable.

### 5-3. A table of functions

```ts
type TFormatter = (biValue: bigint) => string;
const arrFormatter: [string, TFormatter][] = [["HEX", fnHex], ["DEC", (biValue) => biValue.toString(10)], ["BIN", fnBin]];
for (const [strLabel, fnFormat] of arrFormatter) { ... }
```

Instead of three `console.log` lines, loop over a table. Adding a radix becomes one more row. DevCalc's `main.ts` uses this.

---

## 6. Try it

Open each file and press `F5`, or run it from the command line. If you can't run code, read the code alongside the output below.

### [functions.ts](functions.ts) — declarations, arrow functions, function types

```
> node lessons/02-functions-objects/functions.ts
1) Add(1, 2) = 3 (called before the declaration)
2) Multiply(3, 4) = 12 / Square(5) = 25
3) Expected error: Cannot access 'Subtract' before initialization
   Why : an arrow function is a const value, so it exists only from its line down.
   Fix : define it first, or use a function declaration.
4) ToUpperHex(255) = FF
5) Without TS: Add(1) = NaN
   Why : JS fills a missing argument with undefined, and 1 + undefined = NaN.
   Fix : TS flags it while you type. Pass both arguments.
6) fnPlus(2, 3) = 5 / fnTimes(2, 3) = 6
7) void function done
```

Things to try: uncomment `// ToUpperHex("255");` to see the red squiggle. Hover over `fnTimes`'s `nA` to see that it is `number` without an annotation.

### [parameters.ts](parameters.ts) — optional, default, rest, options object

```
> node lessons/02-functions-objects/parameters.ts
1) Hello, Hong / Hello, Dr. Hong
2) ToRadix(255) = ff / ToRadix(255, 2) = 11111111
3) Sum() = 0 / Sum(1, 2, 3) = 6
4) Sum(...arrBits) = 120 / Math.max(...arrBits) = 64
5) 0xFF 0xff FF
6) Optional parameters go last (TS1016 otherwise).
```

Things to try: in `FormatHex(255, { bUpperCase: false })`, type `{ ` and press `Ctrl+Space` — the editor lists the options.

### [objects.ts](objects.ts) — interface, type, readonly, structural typing

```
> node lessons/02-functions-objects/objects.ts
1) { strName: 'WORD', nBits: 16 } / oWord.nBits = 16
2) DWORD 32 / strNote = undefined
3) QWORD 64
4) QWORD BYTE 8
5) Without TS: oTypo.nBits = undefined
   Why : the key was typed as nBit, so nBits does not exist.
   Fix : TS flags the typo while you type. Write nBits.
6) readonly at runtime: CHANGED (type erased, so the assignment ran)
   Expected error: Cannot assign to read only property 'strName' of object '#<Object>'
   Why : Object.freeze makes the object read-only at runtime.
   Fix : readonly for compile time, Object.freeze when it must hold at runtime.
7) AX 255n / EAX 4294967295n
8) hex 0xFF
```

Line 6 shows the point of section 3-2: `readonly` disappears at runtime, `Object.freeze` doesn't.

### [callbacks.ts](callbacks.ts) — callbacks, map/filter/reduce, closures

```
> node lessons/02-functions-objects/callbacks.ts
1) PrintAll with a hex callback:
   10 => 0xA
   255 => 0xFF
2) map: [ 1, 2, 4, 8 ] / filter: [ 32, 64 ] / reduce: 120
3) 0xFF 0b101
4) counter after 3 calls = 3
5) Function table for 10n:
   HEX : 0xA
   DEC : 10
   BIN : 0b1010
```

> Set a breakpoint inside the arrow function returned by `MakeCounter`, and look at `nCount` under **Closure** in the Variables panel.

## 7. Build it — digit grouping and output options

**[JS + TS]**

`0xFFFFFFFFFFFFFFFF` is hard to read. We want `0xFFFF_FFFF_FFFF_FFFF`. Full code: [group.ts](group.ts).

### GroupDigits : ("FFFFFFFF", 4, "_") → "FFFF_FFFF"

```ts
function GroupDigits(strDigits: string, nSize: number, strSeparator: string): string {
	if (nSize <= 0) {
		return strDigits;
	}
	const arrGroup: string[] = [];
	for (let nEnd = strDigits.length; nEnd > 0; nEnd -= nSize) {
		const nStart = Math.max(0, nEnd - nSize);
		arrGroup.unshift(strDigits.slice(nStart, nEnd));   // add to the front
	}
	return arrGroup.join(strSeparator);
}
```

- Group **from the right**, so the leftmost group may be shorter: `"1234567"` → `"1,234,567"`.
- `const arrGroup: string[] = []` — an empty array needs an annotation, otherwise TS can't tell what goes in it.

### Output options

```ts
interface IFormatOptions {
	bGroup?: boolean;       // default false
	bUpperCase?: boolean;   // default true
	bPrefix?: boolean;      // default true
}

function ToHex(biValue: bigint, { bGroup = false, bUpperCase = true, bPrefix = true }: IFormatOptions = {}): string { ... }
```

Section 2-4's options object, now with a named `interface`.

### Run it

```
> node lessons/02-functions-objects/group.ts
1) FFFF_FFFF 1,234,567 FF
2) default      : 0xFFFFFFFFFFFFFFFF
3) bGroup       : 0xFFFF_FFFF_FFFF_FFFF
4) lower, group : 0xffff_ffff_ffff_ffff
5) no prefix    : FF
6) negative     : -0x1_0000
```

## 8. DevCalc step — grouping, options, a table of functions

[devcalc/src/core/Format.ts](../../devcalc/src/core/Format.ts) now has:

```ts
export interface IFormatOptions { readonly bGroup?: boolean; readonly bUpperCase?: boolean; readonly bPrefix?: boolean; }
export type TFormatter = (biValue: bigint, oOptions?: IFormatOptions) => string;

interface IRadixSpec { readonly nRadix: number; readonly strPrefix: string; readonly nGroupSize: number; readonly strSeparator: string; }
const HEX_SPEC: IRadixSpec = { nRadix: 16, strPrefix: "0x", nGroupSize: 4, strSeparator: "_" };
const DEC_SPEC: IRadixSpec = { nRadix: 10, strPrefix: "",   nGroupSize: 3, strSeparator: "," };
const BIN_SPEC: IRadixSpec = { nRadix: 2,  strPrefix: "0b", nGroupSize: 4, strSeparator: "_" };

export const ToHex: TFormatter = (biValue, oOptions = {}) => FormatRadix(biValue, HEX_SPEC, oOptions);
```

- What lesson 01 passed as separate arguments (`nRadix`, `strPrefix`) is now **one object per radix** (`IRadixSpec`). Adding octal later is one more line.
- `ToHex` / `ToDec` / `ToBin` all have the type `TFormatter`, so they fit in one table.
- `ToDec` now also goes through `FormatRadix`, so it can group with `,`.
- The options default to the lesson 01 behavior, so the existing tests still pass unchanged.

[devcalc/src/main.ts](../../devcalc/src/main.ts) reads the flags and loops over a table of functions:

```ts
const arrRow: [string, TFormatter][] = [["HEX", ToHex], ["DEC", ToDec], ["BIN", ToBin]];
for (const [strLabel, fnFormat] of arrRow) {
	console.log(`${strLabel} : ${fnFormat(biValue, oOptions)}`);
}
```

Run it — on the command line, grouping is **on** by default:

```
> node devcalc/src/main.ts 18446744073709551615
HEX : 0xFFFF_FFFF_FFFF_FFFF
DEC : 18,446,744,073,709,551,615
BIN : 0b1111_1111_1111_1111_1111_1111_1111_1111_1111_1111_1111_1111_1111_1111_1111_1111

> node devcalc/src/main.ts 255 --lower --no-prefix
HEX : ff
DEC : 255
BIN : 1111_1111

> node devcalc/src/main.ts 1234567 --no-group
HEX : 0x12D687
DEC : 1234567
BIN : 0b100101101011010000111

> node devcalc/src/main.ts 255 --bad
Unknown option: "--bad" (ignored)
Why : only --no-group, --lower, --no-prefix are supported.
HEX : 0xFF
DEC : 255
BIN : 0b1111_1111
```

> These are the outputs as of lesson 02. Later lessons add more options (`--copy`, `--repl`, `--all`, `--bits=…`), so the "Why" line lists more of them there.

With npm, put the arguments after `--`: `npm run devcalc -- 255 --lower`.

Tests ([devcalc/tests/Format.test.ts](../../devcalc/tests/Format.test.ts)) gained `GroupDigits` and option cases:

```
> npm test
✔ Format: 255
✔ Format: zero and negative
✔ GroupDigits
✔ Format options
ℹ pass 4
```

> The input `0xFFFF_FFFF` (with `_`) is still rejected — `BigInt()` doesn't accept `_`. Our own parser in lesson 03 fixes that.

## Summary

- A function is a declaration (`function`, hoisted) or an arrow function in a `const` (not hoisted).
- Parameters need types; return types are usually inferred. A function type looks like `(nA: number) => string`.
- `?` optional, `=` default, `...` rest. Many options → one options object with destructuring defaults.
- Object shapes → `interface`; primitives, unions, function types → `type`. `readonly` is checked only at compile time.
- TS is **structural**: same shape = compatible. An object literal with an unknown key is still flagged.
- Functions are values: pass them (callbacks), return them (closures), keep them in tables.

**Next → [03. Unions and Narrowing](../03-unions-narrowing/README.md)**: `string | undefined`, `typeof` / `in` checks, literal unions instead of `enum`. DevCalc gets its own input parser for `0xFF`, `0b1010` and `1_000`.

---

[← Previous: 01. Basic Types and bigint](../01-basic-types/README.md) · [Contents](../../README.md) · [Next: 03. Unions and Narrowing →](../03-unions-narrowing/README.md)
