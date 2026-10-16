**English** · [한국어](README.ko.md)

[← Previous: 10. Lexer and Parser](../10-lexer-parser/README.md) · [Contents](../../README.md) · [Next: 12. bigint and Fixed-Size Words →](../12-bigint-words/README.md)

# 11. Regular Expressions and Literal Types — Growing the Lexer

> Series: DH.Study.TypeScript · Lesson 11 (Part 2)
> Environment: Node.js v24 · TypeScript 7 · Vitest 5 · VS Code

## Goals

After this lesson you can:

- [ ] Read and write regular expressions: classes, quantifiers (greedy and lazy), anchors, groups, lookaround
- [ ] Choose the right flag (`g` `i` `y` `u`) and avoid the `lastIndex` trap
- [ ] Use named groups in TypeScript, where every capture is `string | undefined`
- [ ] Use literal types and unions of them, keep literals with `as const`, and check a table with `satisfies Record<EUnit, …>`
- [ ] Write template literal types (`` `0x${string}` ``), and check text from outside with a type guard
- [ ] Add right-associative `**`, `>>>` and unary `~` to a precedence-climbing parser

## Contents

1. [Regular expressions](#1-regular-expressions)
2. [Literal types](#2-literal-types)
3. [Template literal types](#3-template-literal-types)
4. [Try it](#4-try-it)
5. [Build it — new operators and literals](#5-build-it--new-operators-and-literals)
6. [DevCalc step — Lv6 programmer literals and operators](#6-devcalc-step--lv6-programmer-literals-and-operators)
7. [Summary](#summary)
8. [Where next](#where-next)

Example files for this lesson: [regex.ts](regex.ts) · [literal-types.ts](literal-types.ts) · [operators.ts](operators.ts)

> Each example has a Korean-comment twin (`x.ko.ts`) with the same code. The Korean lesson ([README.ko.md](README.ko.md)) uses those.

> Syntax tags: **[JS]** = JavaScript syntax (exists without TS) · **[TS]** = type syntax that TypeScript adds (erase it and you get JS) · details in [lesson 00, 7-3](../00-setup/README.md#7-3-ts-syntax--js-syntax--type-syntax)

Part 1 (lessons 00–10) ended with a calculator that reads whole expressions. Part 2 makes it a calculator a developer would actually keep open. This lesson grows the **lexer**: it learns the numbers developers type — `1Fh` (assembler hex), `1'000'000` (C++ separators), `4K` (a size), `'A'` (a character) — and three operators every C-family language has: `~`, `**` and `>>>`. Here is all of it in one line — an ASCII lower-case letter turned upper case:

```
> node devcalc/src/main.ts "'a' & ~0x20" --bits=8
HEX : 0x41
DEC : 65
BIN : 0b0100_0001
INT : 65 (8-bit signed)
```

The tools for that are **regular expressions** (what a token looks like) and **literal types** (which exact strings the code accepts).

---

## 1. Regular expressions

A regular expression (regex) describes what text looks like. Lesson 10 used a few (`/\d+/y`); this section covers the parts you will meet in real code.

### 1-1. Literal or constructor

**[JS]** Two ways to make one:

```ts
const RE_HEX = /^0x[0-9a-f]+$/i; // a literal : checked when the file is read
const reHexToo = new RegExp("^0x[0-9a-f]+$", "i"); // from a string : built at run time
```

- Use a **literal** when the pattern is fixed. TypeScript checks its syntax: `/(0x/` is a red squiggle (TS1005 `')' expected`).
- Use **`new RegExp`** only when the pattern is built at run time. Inside a string every backslash is doubled (`"\\d+"`), and a bad pattern is a run-time `SyntaxError` (section 1-6).

> **C#** : `new Regex(@"^0x[0-9a-f]+$", RegexOptions.IgnoreCase)`. C# has no regex literal, so a mistake is found only at run time — unless you use the `[GeneratedRegex]` source generator (.NET 7+), which checks it at build time like TS does.

### 1-2. The pieces

| Piece | Means | Example |
|---|---|---|
| `abc` | these characters | `/0x/` |
| `.` | any character except a line break | `/a.c/` matches `abc` |
| `[0-9a-f]` `[^0-9]` | one of (or none of) these | `/[kmgt]/i` |
| `\d` `\s` `\w` | digit, space, word character (`\D` `\S` `\W` = not) | `/\d+/` |
| `^` `$` | start, end of the text | `/^0x/` |
| `\b` `\B` | at (not at) a word boundary | |
| `*` `+` `?` `{2,4}` | 0+, 1+, 0 or 1, 2 to 4 times | `/\d{2,4}/` |
| `a\|b` | either | `/>>>\|>>/` |
| `( )` `(?: )` | group (captured), group (not captured) | |
| `\.` `\*` `\(` | the character itself | `/\*\*/` = `**` |

Quantifiers are **greedy** by default — they take as much as they can. Add `?` to make them **lazy**:

```ts
/<.+>/.exec("<b>bold</b>")?.[0]; // "<b>bold</b>" : greedy
/<.+?>/.exec("<b>bold</b>")?.[0]; // "<b>"         : lazy
```

**Order matters in `|`**: it tries left to right and takes the first alternative that works. `/>>|>>>/` on `>>>` matches `>>`. Put the longer one first.

### 1-3. Groups, and how TS types them

**[JS + TS]** `( )` captures by number, `(?<name> )` by name:

```ts
const RE_SIZE = /^(?<digits>[0-9]+)(?<unit>[KMGT])$/i;
const oSize = RE_SIZE.exec("16M"); // RegExpExecArray | null
if (oSize !== null) {
	oSize[0]; // "16M"  : the whole match
	oSize[1]; // "16"   : group 1
	oSize.groups?.unit; // "M" : by name
}
```

The types are worth a look:

- `exec` returns `RegExpExecArray | null` — no match is `null`, so TS makes you check.
- `oSize[1]` is `string | undefined` (with `noUncheckedIndexedAccess`): TS doesn't count the groups in the pattern.
- `oSize.groups` is `{ [key: string]: string } | undefined`, and `groups.unit` is `string | undefined`. TS doesn't read the names either, so a typo (`groups.unti`) is not an error — just `undefined`.

So reading a group is always `?.` and `??`:

```ts
const strUnit: string = oSize.groups?.unit ?? "?";
```

> **C#** : `match.Groups["unit"].Value` returns `""` for a missing group instead of `null`. TS makes the missing case visible in the type; C# makes you check `Success`.

### 1-4. Flags

| Flag | Meaning | Use for |
|---|---|---|
| `i` | ignore case | `1fh` = `1FH` |
| `g` | global : every match | `match`, `matchAll`, `replace` |
| `y` | sticky : only **at** `lastIndex` | a lexer (lesson 10) |
| `u` | Unicode : code points, `\p{…}` | text with emoji or non-Latin letters |
| `s` | `.` matches line breaks too | |
| `m` | `^` `$` at each line | |

With `g`, the string methods find every match:

```ts
"id=12 port=8080".match(/\d+/g); // ["12", "8080"]
for (const oPair of strLog.matchAll(/(?<key>[a-z]+)=(?<value>\d+)/g)) {
	console.log(oPair.groups?.key, oPair.groups?.value, oPair.index);
}
```

`match` with `g` returns only the texts; `matchAll` returns each match with its groups and index.

**The `lastIndex` trap.** A `g` or `y` regex is **stateful**: `exec` and `test` start at `lastIndex` and move it. Reuse one `g` regex with `test()` and it alternates:

```ts
const RE_DIGIT_G = /\d/g;
RE_DIGIT_G.test("7"); // true  (lastIndex → 1)
RE_DIGIT_G.test("7"); // false (starts at 1, finds nothing, lastIndex → 0)
RE_DIGIT_G.test("7"); // true
```

Rule: no `g` for `test()`. DevCalc's sticky regexes set `lastIndex` before every `exec` (`MatchAt` in `Lexer.ts`).

### 1-5. Lookaround

`(?= )` (lookahead) and `(?<= )` (lookbehind) check what is **around** a position without taking it. `(?! )` and `(?<! )` are the negative forms.

```ts
"1234567".replace(/\B(?=(\d{3})+(?!\d))/g, ","); // "1,234,567"
"cost $42".match(/(?<=\$)\d+/)?.[0]; // "42"
```

The first one matches **positions** (empty matches): not at a word boundary, and followed by groups of three digits up to the end. Clever — and hard to read. In DevCalc's code, digit grouping is a plain loop (`GroupDigits`, lesson 03). Use lookaround when it is short and obvious.

### 1-6. Unicode, and patterns from input

Strings are UTF-16: `"😀".length` is 2. Without `u`, `.` matches one UTF-16 unit, so `/^.$/` does **not** match `😀`; with `u` it does. `u` also enables Unicode classes:

```ts
"DevCalc 계산기".match(/\p{Script=Hangul}+/u)?.[0]; // "계산기"
```

TS checks this too: `/\p{L}/` without `u` is TS1530.

A pattern made from **user input** may be invalid, and it is code — `(`, `+`, `.` mean something:

```ts
new RegExp("(0x"); // SyntaxError: Invalid regular expression: /(0x/: Unterminated group

function EscapeRegExp(strText: string): string {
	return strText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& = the whole match
}
```

Escape it, or don't build regexes from input at all. ES2025 adds `RegExp.escape` (Node 24 has it; TS knows it with `"lib": ["es2025"]`).

> **C#** : `Regex.Escape(text)`. C# has `RegexOptions.NonBacktracking` against catastrophic patterns like `(a+)+$`; JavaScript has no such option, so never run a pattern you don't control on text you don't control.

---

## 2. Literal types

**[TS]** A **literal type** is a type with exactly one value: `"K"`, `10n`, `true`, `8`. On their own they are rarely useful; **unions** of them are everywhere in this series (`EKind`, `ECheck`, `EAssoc`).

### 2-1. When TS keeps the literal

```ts
const strConstUnit = "K"; // type "K"   : a const never changes
let strLetUnit = "K"; // type string : a let may change, so TS widens it
const arrBits = [8, 16, 32, 64] as const; // readonly [8, 16, 32, 64]
type TBits = (typeof arrBits)[number]; // 8 | 16 | 32 | 64
```

- `const` keeps the literal; `let` **widens** it to `string`.
- In an object or array even `const` widens (`[8, 16]` is `number[]`), because elements can change. `as const` makes everything `readonly` and keeps every literal.
- `(typeof arrBits)[number]` turns the array's element types into a union — one list, used as data **and** as a type.

### 2-2. A union, and a table that must match it

```ts
type EUnit = "K" | "M" | "G" | "T";

const UNIT_SHIFT = { K: 10n, M: 20n, G: 30n, T: 40n } as const satisfies Record<EUnit, bigint>;
```

`satisfies Record<EUnit, bigint>` checks the table against the union **in both directions**:

- remove the `T` row → TS2741 (`Property 'T' is missing`);
- add `P: 50n` → TS2353 (`'P' does not exist in type 'Record<EUnit, bigint>'`).

And because of `as const`, `UNIT_SHIFT.K` has type `10n`, not just `bigint`.

Lesson 08 went the other way: the table came first, and `keyof typeof OPERATOR_TABLE` **made** the union. Which one to choose:

| The union comes from... | When |
|---|---|
| the table (`keyof typeof TABLE`) | the table **is** the definition (DevCalc's operators) |
| a `type`, checked with `satisfies Record<E, …>` | the union is used elsewhere too, and every table must cover it (units, word sizes) |

### 2-3. Text from outside is never a literal type

Literal types are erased: at run time `EUnit` is gone. Text a user types — or `JSON.parse` returns — is a `string`, and `as EUnit` only silences the compiler:

```ts
const strUnit = JSON.parse('{ "unit": "X" }').unit as EUnit; // compiles. strUnit is "X"
```

Check it with a **type guard** (lesson 03):

```ts
function IsUnit(strText: string): strText is EUnit {
	return Object.hasOwn(UNIT_SHIFT, strText); // own keys only : "toString" is not a unit
}
```

`Object.hasOwn` and not `strText in UNIT_SHIFT`: `"toString" in {}` is `true` (it comes from the prototype).

> **C#** : the nearest thing is an `enum`, but an enum is a number underneath and `(EUnit)99` compiles. A TS literal union is a set of exact values the compiler checks — and it costs nothing at run time.

---

## 3. Template literal types

**[TS]** A template literal **type** uses template-string syntax at the type level:

```ts
type THexText = `0x${string}`; // any string starting with 0x
type TSizeText = `${number}${EUnit}`; // "16M", "4K", "1.5G"
const strBadHex: THexText = "FF"; // TS2322
```

A union inside makes **every combination**:

```ts
type EWordName = `${"U" | "I"}${8 | 16 | 32 | 64}`; // "U8" | "U16" | "U32" | "U64" | "I8" | ... : 8 members
```

Four built-in types change the letters: `Uppercase`, `Lowercase`, `Capitalize`, `Uncapitalize`.

```ts
type ELowerUnit = Lowercase<EUnit>; // "k" | "m" | "g" | "t"
```

A regex test can be the type guard for a template type — the run-time check and the type say the same thing:

```ts
function IsHexText(strText: string): strText is THexText {
	return /^0x[0-9a-f]+$/i.test(strText);
}
```

Strictly the type is wider than the regex (`"0xZZ"` is a `THexText`). The type says "starts with 0x"; the regex says what you really accept. That is fine: the guard is the gate, the type remembers that the gate was passed.

`infer` (lesson 08) works inside a template, to take a literal type apart:

```ts
type TUnitOf<T extends string> = T extends `${string}${infer EU extends EUnit}` ? EU : never;
type EUnitOf16M = TUnitOf<"16M">; // "M"
type EUnitOfBad = TUnitOf<"16X">; // never
```

This is type-level parsing. It is how libraries type route strings (`"/user/:id"` → `{ id: string }`). Use it in small doses: a type error inside a five-level template type is hard to read.

> **C#** : no equivalent. The closest is a source generator that reads a string at build time.

---

## 4. Try it

### [regex.ts](regex.ts) — literals and flags, groups, g and matchAll, lookaround, u, the lastIndex trap, escaping

```
> node lessons/11-regex-literal-types/regex.ts
1) true true false
1) source / flags : ^0x[0-9a-f]+$ i
2) greedy : <b>bold</b>
2) lazy   : <b>
2) \d{2,4} in 12345 : 1234 · [^0-9]+ in ab12 : ab
3) [0] [1] [2] : 16M 16 M · index : 0
3) groups.digits / unit : 16 M
3) no match → null : null
4) match + g : [ '12', '8080', '64' ]
4) id → 12 at 0
4) port → 8080 at 6
4) bits → 64 at 16
4) replace + g : a + b + c · split : [ '1', '2', '3', '4' ]
5) 1234567 → 1,234,567
5) after $ : 42
6) length : 2 · /^.$/ : false · /^.$/u : true
6) \p{Script=Hangul} : 계산기
7) Expected surprise : true false true
   Why : test() with g starts at lastIndex (1 after the first match), fails, and resets it to 0.
   Fix : no g flag for test(), or set lastIndex = 0 first. DevCalc's sticky (y) regexes always set it.
8) Expected error: SyntaxError: Invalid regular expression: /(0x/: Unterminated group
   Why : ( opens a group, and nothing closes it.
8) escaped : 1\+1=2 \(ok\) → true
```

Things to try:

- Remove the `//` in front of `const RE_BAD = /(0x/;` → TS1005 (`')' expected`). The same mistake in `new RegExp("(0x")` is only found when it runs (output 8).
- Change `oSize.groups?.unit ?? "?"` to `oSize.groups.unit` → TS18048 (`'oSize.groups' is possibly 'undefined'`), and TS2322 because the value may be `undefined`.
- Remove the `g` from `const RE_DIGIT_G = /\d/g` → output 7 becomes `true true true`.
- Remove the `u` from `/\p{Script=Hangul}+/u` → TS1530.

### [literal-types.ts](literal-types.ts) — widening and as const, satisfies Record, type guards, template types, infer

```
> node lessons/11-regex-literal-types/literal-types.ts
1) K anything 8,16,32,64 32
2) K shift : 10n · 4K = 4096n
3) "M" → 1M = 1048576
3) "m" → 1M = 1048576
3) "X" → not a unit
3) "toString" → not a unit
4) 0xFF 16M
4) word names : U8 I16 U32 I64
4) lower unit : k
5) "0x1F" → 31n
5) "1F" → not hex
6) TUnitOf<"16M"> : M · TUnitOf<"16X"> holds 0 values
7) Expected error (a type does not check input): X
   Why : as EUnit only tells the compiler, and JSON.parse returns any. Nothing checked it.
   Fix : check text from outside with a type guard like IsUnit (section 3) before using it as EUnit.
```

Things to try:

- Remove the `//` in front of `const nBad: TBits = 12;` → TS2322 (`Type '12' is not assignable to type '8 | 16 | 32 | 64'`).
- Remove `T: 40n` from `UNIT_SHIFT` → TS2741, and a second error where `UNIT_SHIFT[strUpper]` is used (TS7053) — the table no longer covers `EUnit`.
- Remove `as const` from `UNIT_SHIFT` → `const biShiftK: 10n = UNIT_SHIFT.K` is TS2322 (`bigint` is not `10n`).
- Hover over `EWordName` in VS Code to see all 8 members.

### [operators.ts](operators.ts) — see section 5

---

## 5. Build it — new operators and literals

Lesson 10's `precedence.ts` calculated `number`s with five operators. [operators.ts](operators.ts) is the same precedence-climbing parser grown to DevCalc's size: `bigint`, a fixed word size, ten binary operators, two unary ones, and the new literals. Every value is wrapped to an unsigned word with `BigInt.asUintN` (lesson 01), like DevCalc with `--bits`.

### Two tables

```ts
const BINARY = {
	"|": { nPrecedence: 1, eAssoc: "left", fnApply: (biA, biB) => biA | biB },
	// ... ^ & << + - *
	">>": { nPrecedence: 4, eAssoc: "left", fnApply: (biA, biB, nBits) => BigInt.asIntN(nBits, biA) >> biB }, // keeps the sign bit
	">>>": { nPrecedence: 4, eAssoc: "left", fnApply: (biA, biB) => biA >> biB }, // biA is unsigned : 0 comes in
	"**": { nPrecedence: 7, eAssoc: "right", fnApply: (biA, biB) => biA ** biB },
} satisfies Record<string, IBinarySpec>;

const UNARY = {
	"-": (biA: bigint) => -biA,
	"~": (biA: bigint) => ~biA,
} satisfies Record<string, (biA: bigint) => bigint>;

type EBinary = keyof typeof BINARY;
type EUnary = keyof typeof UNARY;
```

**`>>` and `>>>`.** A word is stored unsigned (`0x80` = 128 in 8 bits). Two ways to shift it right:

- `>>` (**arithmetic** shift) reads the word as **signed** first: `asIntN(8, 0x80)` = -128, and `-128 >> 1` = -64 = `0xC0`. The sign bit is copied in.
- `>>>` (**logical** shift) shifts the unsigned value: `128 >> 1` = 64 = `0x40`. Zeros come in.

That is what C# and JavaScript do: `>>` on `int` (signed) is arithmetic, `>>>` is logical. `bigint` has no `>>>` (a `bigint` has no fixed width), so the word size decides.

**`~`.** On a `bigint`, `~x` is `-x - 1`: `~0n` = `-1n`. In a word that is all ones: `asUintN(8, -1n)` = `0xFF`.

### Right-associative **

Lesson 10, section 6, already had the rule: after an operator with precedence `p`, the right side is read with `nMin = p + 1` (left) or `nMin = p` (right):

```ts
const nNextMin = oSpec.eAssoc === "left" ? oSpec.nPrecedence + 1 : oSpec.nPrecedence;
```

So `2 ** 3 ** 2` = `2 ** 9` = 512, not `8 ** 2` = 64.

### -2 ** 2

Is it `(-2) ** 2` = 4 or `-(2 ** 2)` = -4? Math says -4; some calculators say 4. JavaScript refuses: `-2 ** 2` is a `SyntaxError` ("Unary operator used immediately before exponentiation expression"). The parser does the same — if the left operand **started** with a unary operator (not in parentheses), `**` is an error:

```ts
if (strOp === "**" && bUnaryFirst) {
	throw new SyntaxError(`"${strFirst}x ** y" is ambiguous : write (${strFirst}x) ** y or ${strFirst}(x ** y)`);
}
```

`2 ** -1` is fine: the unary is on the right, there is only one reading.

### Literals with named groups

```ts
const RE_TOKEN = /\x27[^\x27]\x27|[0-9][0-9a-z]*|\*\*|>>>|>>|<<|\S/gi;
const RE_HEX_SUFFIX = /^(?<digits>[0-9][0-9a-f]*)h$/i;
const RE_SIZE = /^(?<digits>[0-9]+)(?<unit>[kmgt])$/i;
const RE_CHAR = /^\x27(?<char>.)\x27$/;
```

- One `g` regex splits the expression. `>>>` comes before `>>`, or `>>>` would be read as `>>` and `>`.
- `\x27` is `'` (a quote written as a hex escape).
- `1Fh` needs a leading **digit**: `Fh` would be a name. Assemblers have the same rule — that is why you see `0FFh`.

### Run it

```
> node lessons/11-regex-literal-types/operators.ts
4) ~0             = 0xFF (8-bit)
4) ~0 >>> 4       = 0x0F (8-bit)
4) 0x80 >> 1      = 0xC0 (8-bit)
4) 0x80 >>> 1     = 0x40 (8-bit)
4) -16 >> 2       = 0xFC (8-bit)
5) 2 ** 3 ** 2    = 0x0200 (16-bit)
5) (2 ** 3) ** 2  = 0x0040 (16-bit)
5) 3 * 2 ** 4     = 0x0030 (16-bit)
5) (-2) ** 3      = 0xFFF8 (16-bit)
6) 1Fh + 1        = 0x0020 (16-bit)
6) 4K - 1         = 0x0FFF (16-bit)
6) 'A' + 1        = 0x0042 (16-bit)
6) 'a' & ~0x20    = 0x41 (8-bit)
7) Expected error: SyntaxError: "-x ** y" is ambiguous : write (-x) ** y or -(x ** y)
   Why : -(2 ** 2) in math, (-2) ** 2 in some calculators. Either reading surprises someone.
   Fix : parentheses. JavaScript has the same rule : -2 ** 2 is a SyntaxError there too.
```

- `-16 >> 2` = `0xFC` = -4: the sign is kept. With `>>>` it would be `0x3C` = 60.
- `(-2) ** 3` = `0xFFF8` = -8 as a signed 16-bit word: wrapping keeps two's complement right for `**` too.
- `'a' & ~0x20`: ASCII lower and upper case differ only in bit 5 (`0x20`). Clearing it makes `'a'` (0x61) into `'A'` (0x41).

Things to try:

- Change `"**"` to `eAssoc: "left"` → `2 ** 3 ** 2` = `0x0040`. Associativity is one word in the table.
- Move `>>>` after `>>` in `RE_TOKEN` → the program stops at `~0 >>> 4` with `SyntaxError: expected a number, "(", "-" or "~", found ">"`: `>>>` was read as `>>` and `>`.
- Add `"%"` with precedence 6 — one row, as in lesson 10.

---

## 6. DevCalc step — Lv6 programmer literals and operators

### What changed

| File | Change |
|---|---|
| `devcalc/src/core/Literal.ts` | new: `ParseLiteral` (`1'000`, `1Fh`, `4K` on top of lesson 03's `ParseInteger`), `ParseChar` (`'A'`, `'AB'`, `'\n'`, `'\x41'`), `EUnit` |
| `devcalc/src/core/Calculator.ts` | `**` (precedence 7, `eAssoc: "right"`, `"power"` check), `>>>` (`"unsigned shift"` check); `>>` keeps the sign with a word size; `UNARY_TABLE` (`-` `~`), `CalculateUnary`, `OperatorAssoc`, `OperatorHelp` |
| `devcalc/src/core/Lexer.ts` | numbers via `ParseLiteral`, character literals, `~` stands alone; `SplitExpressions` (a `;` inside `';'` doesn't split) |
| `devcalc/src/core/Parser.ts` | `"negate"` node → `"unary"` node with `strOp`; right associativity; the `-2 ** 2` error |
| `devcalc/src/core/Evaluate.ts` | `Walk` calls `CalculateUnary` |
| `devcalc/src/main.ts`, `devcalc/web/App.ts` | `SplitExpressions`; help lists the new operators and literals; title `Lv6` |
| `devcalc/tests/Literal.test.ts` | new: 7 tests |
| `devcalc/tests/*.test.ts` | 3 + 4 + 2 new tests; `-1 >> 1` in 8 bits is now `0xFF` (was `0x7F`) |

### Precedence

| Precedence | Operators | Associativity |
|---|---|---|
| (tightest) | unary `-` `~` | |
| 7 | `**` | **right** |
| 6 | `*` `/` `%` | left |
| 5 | `+` `-` | left |
| 4 | `<<` `>>` `>>>` | left |
| 3 | `&` | left |
| 2 | `^` | left |
| 1 (loosest) | `\|` | left |

The same order as JavaScript and C# (C has no `**` and no `>>>`).

### New literals

| Literal | Value | From |
|---|---|---|
| `1'000'000` | 1000000 | C++14 digit separator (like `_`) |
| `1Fh`, `0FFh` | 31, 255 | assembler hex — must start with a digit |
| `4K` `16M` `1G` `2T` | × 1024, 1024², 1024³, 1024⁴ | sizes (decimal digits only) |
| `'A'`, `'한'` | 0x41, 0xD55C | one character = its code point |
| `'AB'`, `'MZ'` | 0x4142, 0x4D5A | several = bytes, first highest (max 8) — like C's multi-character constants |
| `'\n'` `'\x41'` | 10, 65 | escapes `\n \r \t \0 \\ \' \xHH` |

```
> node devcalc/src/main.ts "1Fh + 1"
HEX : 0x20
DEC : 32
BIN : 0b10_0000

> node devcalc/src/main.ts "4K - 1"
HEX : 0xFFF
DEC : 4,095
BIN : 0b1111_1111_1111

> node devcalc/src/main.ts "'AB'"
HEX : 0x4142
DEC : 16,706
BIN : 0b100_0001_0100_0010

> node devcalc/src/main.ts "';' + 1; ans * 2"
[1] ';' + 1
HEX : 0x3C
DEC : 60
BIN : 0b11_1100

[2] ans * 2
HEX : 0x78
DEC : 120
BIN : 0b111_1000
```

The last one: the command line splits on `;` — but not on the `;` inside `';'`. `SplitExpressions` uses one `g` regex that takes either a whole character literal or any character except `;`:

```ts
const RE_EXPRESSION_PART = /(?:'(?:\\.|[^'\\])*'?|[^;'])+/g;
```

### New operators

```
> node devcalc/src/main.ts "~0" --bits=8
HEX : 0xFF
DEC : 255
BIN : 0b1111_1111
INT : -1 (8-bit signed)

> node devcalc/src/main.ts "0x80 >> 1" --bits=8
HEX : 0xC0
DEC : 192
BIN : 0b1100_0000
INT : -64 (8-bit signed)

> node devcalc/src/main.ts "0x80 >>> 1" --bits=8
HEX : 0x40
DEC : 64
BIN : 0b0100_0000
INT : 64 (8-bit signed)

> node devcalc/src/main.ts "2 ** 3 ** 2"
HEX : 0x200
DEC : 512
BIN : 0b10_0000_0000
```

Without `--bits`, `~0` is `-1` (as for JavaScript's `~0n`), `>>` is the plain `bigint` shift, and `>>>` of a negative number is an error — without a width, "fill with zeros from the left" has no meaning.

**A changed answer.** Before this lesson, `-1 >> 1 --bits=8` was `0x7F`: the word was unsigned, so `>>` brought in a zero. Now `>>` is arithmetic like in C# and JavaScript, so the answer is `0xFF` (-1 >> 1 = -1), and `>>>` gives the old `0x7F`. One test changed with it — on purpose, and the test says so.

### Errors

```
> node devcalc/src/main.ts "-2 ** 2"
Invalid expression: "-2 ** 2"
Why : "-x ** y" is ambiguous ("**" at column 4) : write (-x) ** y or -(x ** y)
Fix : e.g. "(0xFF + 1) << 4". Operators: + - * / % ** & | ^ << >> >>>, unary - ~

> node devcalc/src/main.ts "2 ** -1"
Cannot calculate: "2 ** -1"
Why : negative exponent -1
Fix : DevCalc has integers only : use an exponent of 0 or more.

> node devcalc/src/main.ts "3 ** 5000"
Cannot calculate: "3 ** 5000"
Why : 3 ** 5000 has more than 4096 bits
Fix : keep the result under 4096 bits.

> node devcalc/src/main.ts "-1 >>> 4"
Cannot calculate: "-1 >>> 4"
Why : >>> of a negative number needs a word size
Fix : choose a word size (--bits=8|16|32|64|128), or use >>.

> node devcalc/src/main.ts "1''0"
Invalid input: "1''0"
Why : separators (_ or ') must sit between digits
Fix : use an integer like 255, -0xFF, 0b1010, 0o17, 1_000, 1'000, 1Fh, 4K or 'A'.

> node devcalc/src/main.ts "'ABCDEFGHI'"
Invalid input: "'ABCDEFGHI'"
Why : more than 8 characters (64 bits)
Fix : use an integer like 255, -0xFF, 0b1010, 0o17, 1_000, 1'000, 1Fh, 4K or 'A'.
```

`3 ** 5000` is refused **before** it is calculated: `bigint` could do it, but `3 ** 1_000_000` takes seconds and megabytes. The check estimates the size from the bit length of the base.

**Quote the expression.** In a shell, `*` is a wildcard: `node devcalc/src/main.ts 2 ** 3` passes the file names of the folder (`LICENSE` …) instead of `**`. Always put the expression in quotes — `"2 ** 3"` in bash and PowerShell. (`'A'` inside double quotes is fine.)

### The code

`ParseLiteral` tries the new forms in order, with named groups, and falls back to lesson 03's `ParseInteger`:

```ts
export function ParseLiteral(strText: string): TParseResult {
	if (RE_BAD_SEPARATOR.test(strText)) {
		return Fail(`separators (_ or ') must sit between digits`);
	}
	const strPlain = strText.replaceAll("'", "_"); // from here on, ' is the same as _
	const oHex = RE_HEX_SUFFIX.exec(strPlain);
	if (oHex?.groups?.digits !== undefined) {
		return ParseInteger(`0x${oHex.groups.digits}`);
	}
	const oSize = RE_SIZE.exec(strPlain);
	const strUnit = oSize?.groups?.unit?.toUpperCase() ?? "";
	if (oSize?.groups?.digits !== undefined && IsUnit(strUnit)) {
		const oDigits = ParseInteger(oSize.groups.digits);
		return oDigits.bOk ? { bOk: true, biValue: oDigits.biValue << UNIT_SHIFT[strUnit] } : oDigits;
	}
	return ParseInteger(strPlain);
}
```

- `UNIT_SHIFT` is section 2-2's table: `as const satisfies Record<EUnit, bigint>`, read only after `IsUnit` narrowed `strUnit`.
- `oHex?.groups?.digits !== undefined` narrows the whole chain: inside the `if`, `oHex.groups.digits` is a `string` without `?.`.
- Errors in the digits come from `ParseInteger`, so `0x1K` says `"k" is not a valid hex digit` — the messages from lesson 03.

The parser's change is two lines in `#Expression` (lesson 10's version plus `OperatorAssoc` and the ambiguity check):

```ts
if (strOp === "**" && oLeft.eKind === "unary" && oFirst.eKind === "operator") {
	throw new CParseError(`"${oFirst.strText}x ** y" is ambiguous ("**" at column ${oNext.nCol}) : ...`);
}
this.#nPos++;
const nPrecedence = OperatorPrecedence(strOp);
const nRightMin = OperatorAssoc(strOp) === "right" ? nPrecedence : nPrecedence + 1;
const oRight = this.#Nested(() => this.#Expression(nRightMin));
```

`#Nested` counts the depth: `2 ** 2 ** 2 ** …` 5,000 times is right-recursive like `-----1`, so it gets the same depth-limit error instead of a stack overflow.

The web page needs nothing new: it calls `Evaluate()`, so `'A' + 1` and `~0 >>> 4` work there too.

### Checked

```
> npm test
check-pairs : 54 pairs, 0 failed
check-names : 30 files, 0 problems

 Test Files  10 passed (10)
      Tests  57 passed (57)
```

```ts
test("** binds tightest and groups to the right", () => {
	expect(Grouped("2 ** 3 ** 2")).toBe("(2 ** (3 ** 2))");
	expect(Grouped("2 * 3 ** 2")).toBe("(2 * (3 ** 2))");
	expect(Grouped("(-2) ** 2")).toBe("(-2 ** 2)");
	expect(Grouped("~0 >>> 4")).toBe("(~0 >>> 4)");
});
```

Things to try:

- Add `P` (1024⁵) to `EUnit` in `Literal.ts` → TS2741 on `UNIT_SHIFT` until you add `P: 50n`. Then `RE_SIZE` needs `p` too — the type can't check a regex.
- Add `0d` as a decimal prefix (`0d255`) in `ParseLiteral`.
- Type `'A' + 1` in the web page (`npm run web`).

---

## Summary

- A regex literal is checked by TS; `new RegExp(text)` is checked only at run time and must be escaped when the text comes from input.
- Quantifiers are greedy unless followed by `?`. In `a|b` the first alternative that works wins — put `>>>` before `>>`.
- **[TS]** `exec` returns `… | null`, and every group (`[1]`, `groups.name`) is `string | undefined`: read groups with `?.` and `??`.
- `g` and `y` regexes keep `lastIndex` between calls. No `g` with `test()`.
- **[TS]** Literal types and unions of them describe exact values; `as const` keeps literals; `satisfies Record<EUnit, …>` checks a table covers the union exactly. Text from outside needs a type guard — `as` checks nothing.
- **[TS]** Template literal types describe string patterns, make every combination of unions, and can be taken apart with `infer`.
- DevCalc Lv6: `1'000` `1Fh` `4K` `'A'`, `~`, right-associative `**`, arithmetic `>>` and logical `>>>`, and the `-2 ** 2` error like JavaScript.

## Where next

[Lesson 12](../12-bigint-words/README.md) goes deeper into `bigint` — `asIntN`/`asUintN` for every word size up to 128 bits, byte order, and `satisfies` against annotations and `as` — and adds the octal and character outputs to DevCalc.

---

[← Previous: 10. Lexer and Parser](../10-lexer-parser/README.md) · [Contents](../../README.md) · [Next: 12. bigint and Fixed-Size Words →](../12-bigint-words/README.md)
