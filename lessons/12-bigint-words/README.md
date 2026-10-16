**English** · [한국어](README.ko.md)

[← Previous: 11. Regular Expressions and Literal Types](../11-regex-literal-types/README.md) · [Contents](../../README.md) · [Next: 13. Function Tables and Scope →](../13-functions-scope/README.md)

# 12. bigint and Fixed-Size Words — Every Output Format

> Series: DH.Study.TypeScript · Lesson 12 (Part 2)
> Environment: Node.js v24 · TypeScript 7 · Vitest 5 · VS Code

## Goals

After this lesson you can:

- [ ] Say where `number` stops being exact, and where `bigint` behaves differently (division, `Math`, `==`, `sort`, JSON)
- [ ] Cut a value to N bits with `BigInt.asUintN` / `BigInt.asIntN`, and explain two's complement, sign extension and byte order
- [ ] Choose between a type annotation, `as` and `satisfies` for a table — and know which one checks nothing
- [ ] Describe output rows with one table (`satisfies Record<ERow, …>`) and an order list (`as const satisfies readonly ERow[]`)
- [ ] Use DevCalc's new OCT and CHAR rows (`--all`) and 128-bit words

## Contents

1. [bigint in depth](#1-bigint-in-depth)
2. [Fixed-size words](#2-fixed-size-words)
3. [Annotation, as, satisfies](#3-annotation-as-satisfies)
4. [Try it](#4-try-it)
5. [Build it — one value in six forms](#5-build-it--one-value-in-six-forms)
6. [DevCalc step — Lv7 every output format, 128-bit](#6-devcalc-step--lv7-every-output-format-128-bit)
7. [Summary](#summary)
8. [Where next](#where-next)

Example files for this lesson: [bigint.ts](bigint.ts) · [words.ts](words.ts) · [satisfies.ts](satisfies.ts) · [formats.ts](formats.ts)

> Each example has a Korean-comment twin (`x.ko.ts`) with the same code. The Korean lesson ([README.ko.md](README.ko.md)) uses those.

> Syntax tags: **[JS]** = JavaScript syntax (exists without TS) · **[TS]** = type syntax that TypeScript adds (erase it and you get JS) · details in [lesson 00, 7-3](../00-setup/README.md#7-3-ts-syntax--js-syntax--type-syntax)

DevCalc has used `bigint` since lesson 01 and word sizes since lesson 04, but only as far as they were needed. This lesson looks at both properly, because a developer's calculator lives on them: a register dump is a 64-bit word, a UUID is 128 bits, and `0xC1` means 193 or -63 depending on who asks. At the end DevCalc shows one value in every form a developer reads — here the byte `'A' | 0x80` in all six:

```
> node devcalc/src/main.ts "'A' | 0x80" --bits=8 --all
HEX  : 0xC1
DEC  : 193
BIN  : 0b1100_0001
INT  : -63 (8-bit signed)
OCT  : 0o301
CHAR : '\xC1'
```

---

## 1. bigint in depth

### 1-1. Exact at any size

**[JS]** A `number` is a 64-bit floating-point value. It holds every integer only up to 2^53 (`Number.MAX_SAFE_INTEGER` + 1); after that it skips some. A `bigint` has no limit:

```ts
2 ** 53 + 1;    // 9007199254740992 — the + 1 is lost
2n ** 53n + 1n; // 9007199254740993n
2n ** 64n;      // 18446744073709551616n
```

That is why DevCalc's core is `bigint` from end to end: a 64-bit word does not fit in a `number`.

### 1-2. No mixing

**[JS + TS]** `bigint` and `number` never mix in arithmetic. JavaScript throws a `TypeError` at run time; TypeScript reports it first:

```ts
const nCount = 3;
const biBad = 10n * nCount;          // TS2365 : Operator '*' cannot be applied to types 'bigint' and 'number'
const biTimes = 10n * BigInt(nCount); // 30n
Number(2n ** 64n + 1n);               // 18446744073709552000 — too big for a number : the low digits are lost
```

`BigInt(text)` reads decimal, `0x`, `0o` and `0b` text and ignores spaces around it, but nothing else — no `_`, no `1Fh`. That is why lesson 03 wrote its own `ParseInteger`.

### 1-3. Division cuts toward zero

**[JS]** `/` on bigints drops the fraction toward zero, and `%` takes the sign of the left side — the C rule:

| Expression | Result | `Math.floor` would give |
|---|---|---|
| `7n / 2n` | `3n` | 3 |
| `-7n / 2n` | `-3n` | -4 |
| `-7n % 2n` | `-1n` | |

If you need floor division (Python's `//`), step down by one when the result was cut and the signs differ — `FloorDiv` in [bigint.ts](bigint.ts).

### 1-4. Math is for number only

**[TS]** `Math.max(1n, 2n)` is TS2345 (`Argument of type 'bigint' is not assignable to parameter of type 'number'`). Write the few helpers you need — they are short:

```ts
function MaxOf(...arrValue: bigint[]): bigint {
	return arrValue.reduce((biMax, biValue) => (biValue > biMax ? biValue : biMax));
}
function BitLength(biValue: bigint): number {
	return biValue === 0n ? 0 : (biValue < 0n ? -biValue : biValue).toString(2).length;
}
```

### 1-5. Comparing and sorting

- `<` `>` `<=` `>=` compare across the two types: `2n > 1` is `true`.
- `1n == 1` is `true` and `1n === 1` is `false` (different types). On literals, TS reports both as TS2367 (`… the types 'bigint' and 'number' have no overlap`) — it is almost always a mistake.
- `[10n, 9n, 100n].sort()` sorts **as text**: `10 100 9`. A compare function must return a `number`, so `(biA, biB) => biA - biB` is TS2345. Use `biA < biB ? -1 : biA > biB ? 1 : 0`.

### 1-6. JSON has no bigint

**[JS]** `JSON.stringify({ biValue: 1n })` throws `TypeError: Do not know how to serialize a BigInt`. Choose a text form yourself — a replacer function on the way out, `BigInt(text)` on the way in. Lesson 07's web history already does this with decimal text.

---

## 2. Fixed-size words

### 2-1. asUintN and asIntN

**[JS]** A word size is a number of bits. Two functions cut any bigint to N bits:

- `BigInt.asUintN(N, x)` — keep the low N bits, read them as **unsigned** (0 … 2^N − 1)
- `BigInt.asIntN(N, x)` — keep the low N bits, read them as **signed** (−2^(N−1) … 2^(N−1) − 1)

| x | asUintN(8, x) | asIntN(8, x) |
|---|---|---|
| 255 | 255 | -1 |
| 256 | 0 | 0 |
| -1 | 255 | -1 |
| 200 | 200 | -56 |

The bits are the same; only the reading differs. DevCalc's `CWordSize.ToUnsigned` / `ToSigned` (lesson 04) are these two calls.

### 2-2. Two's complement

Signed words use **two's complement**: −x is "invert every bit, add 1". So −1 is all ones in every size — `0xFF`, `0xFFFF`, … up to 32 F's at 128 bits — and the top bit says "negative". The ranges come from shifts:

```ts
const biMaxUnsigned = (1n << biBits) - 1n;  // 255 for 8 bits
const biMinSigned = -(1n << (biBits - 1n)); // -128 for 8 bits
```

### 2-3. Widening : zero or sign extension

Loading a byte into a wider register can mean two things. `0x80` as unsigned is 128 → `0x0080`. As signed it is −128 → `0xFF80` (the sign bit is copied into the new bits). In bigint terms: `asUintN(16, asUintN(8, x))` versus `asUintN(16, asIntN(8, x))`.

### 2-4. Byte order

**[JS]** A `DataView` reads and writes numbers in an `ArrayBuffer`, and lets you choose the byte order:

```ts
const oView = new DataView(new ArrayBuffer(8));
oView.setBigUint64(0, 0x0102030405060708n);       // big endian : 01 02 03 04 05 06 07 08
oView.setBigUint64(0, 0x0102030405060708n, true); // little endian (x86, ARM) : 08 07 06 05 04 03 02 01
```

There is no 128-bit call. A 128-bit value is two 64-bit halves: `biWide >> 64n` and `BigInt.asUintN(64, biWide)`.

---

## 3. Annotation, as, satisfies

Lessons 08 and 11 used `satisfies` for operator and unit tables. Here are the three ways to type a table side by side.

```ts
type EWord = "byte" | "word" | "dword";

const WORD_BITS_A: Record<EWord, number> = { byte: 8, word: 16, dword: 32 };                 // 1 annotation
const WORD_BITS_AS = { byte: 8, word: 16 } as Record<EWord, number>;                         // 2 as
const WORD_BITS = { byte: 8, word: 16, dword: 32 } as const satisfies Record<EWord, number>; // 3 satisfies
```

| | Missing row | Misspelled row | Type of `.byte` |
|---|---|---|---|
| **[TS]** annotation `: T` | TS2741 | TS2561 | `number` |
| **[TS]** `as T` | nothing — `undefined` at run time | nothing (TS2352 only if it can't be T at all) | `number` |
| **[TS]** `satisfies T` | TS2741 | TS2561 | `8` (with `as const`) |

- An annotation checks the table, then **forgets it**: the variable's type is the annotation. `TBitsA = typeof WORD_BITS_A["byte"]` is `number`, so `12` passes.
- `as` checks almost nothing. It says "trust me", and the missing `dword` shows up as `TypeError: Cannot read properties of undefined` later.
- `satisfies` checks the table and **keeps** the table's own type. `TBits = typeof WORD_BITS[EWord]` is `8 | 16 | 32`.

Two more things `satisfies` gives you:

- **Contextual types for functions in the table.** In `{ hex: { fnFormat: (biValue) => … } } satisfies Record<string, IRadixSpec>`, `biValue` is a `bigint` without writing it.
- **Exact keys.** `keyof typeof RADIX` is `"hex" | "oct" | "bin"`; with an annotation `Record<string, IRadixSpec>` it would be `string`.

An order list is a table too: `["bin", "oct", "hex"] as const satisfies readonly ERadix[]` only accepts real names (`"dec"` is TS2322), and its type is the tuple `readonly ["bin", "oct", "hex"]`.

---

## 4. Try it

### [bigint.ts](bigint.ts) — exact size, no mixing, division, Math, comparing, JSON

```
> node lessons/12-bigint-words/bigint.ts
1) number : 9007199254740992 · bigint : 9007199254740993n
1) safe? false · 2^64 = 18446744073709551616n
2) 10n * BigInt(3) = 30n · Number(2n ** 64n + 1n) = 18446744073709552000
2) BigInt("0xFF") = 255n · BigInt(" 42 ") = 42n
3) 7n / 2n = 3n · -7n / 2n = -3n · -7n % 2n = -1n
3) floor(-7 / 2) = -4n · Math.floor(-7 / 2) = -4
4) MaxOf(3n, 10n, 7n) = 10n · BitLength(255n) = 8 · BitLength(256n) = 9
5) 1n == 1 : true · 1n === 1 : false · 2n > 1 : true · typeof 1n : bigint
5) sort() : 10 100 9 (as text)
5) sort(compare) : 9 10 100
6) JSON with a replacer : {"biValue":"0xff"} → 255n
7) Expected error: SyntaxError: Cannot convert 12a to a BigInt
   Why : BigInt() takes whole integer text only ("255", "0xFF", "-7"). It has no 12a, 1Fh or 1_000.
   Fix : parse the text yourself (lesson 03's ParseInteger), or check it with a regex first.
```

Things to try:

- Remove the `//` in front of `const biBad = 10n * nCount;` → TS2365.
- Remove the `//` in front of `if (1n === 1) {}` → TS2367. Section 5 compares with `vOne: unknown` instead, the way a value from `JSON.parse` would arrive.
- Remove the `//` in front of `arrValue.sort((biA, biB) => biA - biB);` → TS2345.

### [words.ts](words.ts) — asUintN / asIntN, two's complement, ranges, extension, byte order

```
> node lessons/12-bigint-words/words.ts
1)  255 → asUintN(8) = 255 · asIntN(8) = -1
1)  256 → asUintN(8) =   0 · asIntN(8) = 0
1)   -1 → asUintN(8) = 255 · asIntN(8) = -1
1)  200 → asUintN(8) = 200 · asIntN(8) = -56
2) -1 in   8 bits = 0xFF
2) -1 in  16 bits = 0xFFFF
2) -1 in  32 bits = 0xFFFFFFFF
2) -1 in  64 bits = 0xFFFFFFFFFFFFFFFF
2) -1 in 128 bits = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF
3)   8 bits : 0 .. 255 · -128 .. 127
3)  16 bits : 0 .. 65535 · -32768 .. 32767
3)  32 bits : 0 .. 4294967295 · -2147483648 .. 2147483647
3)  64 bits : 0 .. 18446744073709551615 · -9223372036854775808 .. 9223372036854775807
3) 128 bits : 0 .. 340282366920938463463374607431768211455 · -170141183460469231731687303715884105728 .. 170141183460469231731687303715884105727
4) 0x80 → zero extend 0x0080 · sign extend 0xFF80
5) big endian    : 01 02 03 04 05 06 07 08
5) little endian : 08 07 06 05 04 03 02 01 → read back 0x0102030405060708
6) 0x0123456789ABCDEFFEDCBA9876543210 = high 0x0123456789ABCDEF + low 0xFEDCBA9876543210
6) joined again : true
7) Expected error: RangeError: Offset is outside the bounds of the DataView
   Why : 8 bytes from offset 4 need bytes 4..11, and the buffer has only 8 (0..7).
   Fix : check nOffset + 8 <= oView.byteLength first, or make the buffer larger.
```

Things to try:

- Read section 5's little-endian bytes with `getBigUint64(0)` (no `true`) → `0x0807060504030201`. Mixing up the byte order is a classic bug when reading files and network packets.
- Change both 8s in section 1 to 16 → 255 and 200 stay positive with `asIntN(16, …)`: their top bit is no longer the sign bit.

### [satisfies.ts](satisfies.ts) — annotation, satisfies, contextual types, order lists, as

```
> node lessons/12-bigint-words/satisfies.ts
1) annotation : 8 · a TBitsA can be 12
2) satisfies : 8 · a TBits can only be 8, 16 or 32 : 16
3) satisfies checks every key : byte, word, dword
4) hex : 0xC8
4) oct : 0o310
4) bin : 0b11001000
5) order : 0b101 0o5 0x5
6) Expected error: TypeError: Cannot read properties of undefined (reading 'toFixed')
   Why : as tells TS to trust you. The table has no dword, so WORD_BITS_AS.dword is undefined.
   Fix : write satisfies instead of as. Then TS2741 reports the missing row before the program runs.
```

Things to try:

- Remove the `//` in front of `const MISSING = …` → TS2741, and in front of `const TYPO = …` → TS2561 (with a "Did you mean 'dword'?").
- Remove the `//` in front of `const nBitsBad: TBits = 12;` → TS2322.
- In section 4, change `satisfies Record<string, IRadixSpec>` to an annotation `const RADIX: Record<string, IRadixSpec> = …` → section 5's `keyof typeof RADIX` becomes `string`, and `RADIX[eRadix]` may be `undefined` (TS2532 `Object is possibly 'undefined'`, because of `noUncheckedIndexedAccess`).

---

## 5. Build it — one value in six forms

[formats.ts](formats.ts) is DevCalc's new output in 70 lines: a table of rows, an order list, and one function that cuts the value once and lets every row read the same bits.

```ts
type ERow = "HEX" | "DEC" | "INT" | "OCT" | "BIN" | "CHAR";
type TBits = 8 | 16 | 32 | 64 | 128;

interface IRowSpec {
	readonly fnFormat: (biUnsigned: bigint, nBits: TBits) => string; // biUnsigned is already cut to nBits
}

const ROWS = {
	HEX: { fnFormat: (biUnsigned, nBits) => "0x" + Digits(biUnsigned, 16, 4, nBits) },
	DEC: { fnFormat: (biUnsigned) => String(biUnsigned) },
	INT: { fnFormat: (biUnsigned, nBits) => String(BigInt.asIntN(nBits, biUnsigned)) },
	OCT: { fnFormat: (biUnsigned, nBits) => "0o" + Digits(biUnsigned, 8, 3, nBits) },
	BIN: { fnFormat: (biUnsigned, nBits) => "0b" + Digits(biUnsigned, 2, 1, nBits) },
	CHAR: { fnFormat: (biUnsigned) => CharText(biUnsigned) },
} satisfies Record<ERow, IRowSpec>;

const ROW_ORDER = ["HEX", "DEC", "INT", "OCT", "BIN", "CHAR"] as const satisfies readonly ERow[];
```

- **Padding.** A hex digit holds 4 bits, an octal digit 3, a binary digit 1. The width is `Math.ceil(nBits / nBitsPerDigit)`: 8 bits → 2 hex, 3 octal, 8 binary digits. 128 bits → 43 octal digits (128 / 3 rounded up).
- **CHAR** turns the bytes into a character literal that DevCalc can read back (lesson 11's `'…'`): printable ASCII stays, `\0 \t \n \r \' \\` are escaped, everything else is `\xHH`. Leading zero bytes are dropped, so `0x41` is `'A'`, not `'\0\0\0A'`.
- `INT` needs no sign handling of its own: `asIntN` reads the same bits as signed.

### Run it

```
> node lessons/12-bigint-words/formats.ts
-1 in 8 bits
  HEX  : 0xFF
  DEC  : 255
  INT  : -1
  OCT  : 0o377
  BIN  : 0b11111111
  CHAR : '\xFF'
1214843392 in 32 bits
  HEX  : 0x48690A00
  DEC  : 1214843392
  INT  : 1214843392
  OCT  : 0o11032205000
  BIN  : 0b01001000011010010000101000000000
  CHAR : 'Hi\n\0'
-2 in 128 bits
  HEX  : 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFE
  INT  : -2
  OCT  : 0o3777777777777777777777777777777777777777776
Note: 4294967361 does not fit in 8 bits, so every row shows the low 8 bits (65).
4294967361 in 8 bits
  HEX  : 0x41
  CHAR : 'A'
```

Things to try:

- Remove the `//` in front of `Show(1n, 12);` → TS2345: 12 is not a `TBits`.
- Remove the `//` in front of `Show(1n, 8, ["HEX", "UDEC"]);` → TS2820, with "Did you mean '"DEC"'?".
- Add a `"UDEC"` row to `ERow` only → TS2741 on `ROWS` until the row is written. The order list does not have to list it — add `"UDEC"` there too to show it.

---

## 6. DevCalc step — Lv7 every output format, 128-bit

### What changed

| File | Change |
|---|---|
| `devcalc/src/core/WordSize.ts` | `TWordBits` adds `128` (`OWORD`); `WORD_BITS` and `WORD_NAMES` use `as const satisfies`; `WORD_BITS` is exported |
| `devcalc/src/core/Format.ts` | `ToOct` (`0o`, groups of 3, padded to `ceil(nBits / 3)` digits), `ToChar` (a character literal, or `undefined` for a negative number) |
| `devcalc/src/core/Output.ts` | new: `OUTPUT_ROWS` (`satisfies Record<ERow, IRowSpec>`), `ROW_ORDER`, `OutputRows()`, `OutputHelp()` |
| `devcalc/src/core/Calculator.ts` | the "needs a word size" hint lists 128 |
| `devcalc/src/main.ts` | rows from `OutputRows()`; `--all` adds OCT and CHAR; the `--bits=` list is made from `WORD_BITS`; `help` lists the rows |
| `devcalc/web/App.ts`, `index.html` | every row from `OutputRows(…, true)`; a 128-bit option; title `Lv7` |
| `devcalc/tests/Output.test.ts` | new: 5 tests |
| `devcalc/tests/Format.test.ts`, `Cli.test.ts` | `ToOct`, `ToChar` (and that every `ToChar` result reads back with `ParseChar`), `--all`, `--bits=128` |

### One table for both screens

Until now `main.ts` and `App.ts` each had their own list `[["HEX", ToHex], ["DEC", ToDec], ["BIN", ToBin]]` plus an `if` for INT. Now both ask the core:

```ts
const OUTPUT_ROWS = {
	HEX: { bExtra: false, strHelp: "hexadecimal", fnFormat: (biValue, oOptions) => ToHex(biValue, oOptions) },
	DEC: { bExtra: false, strHelp: "decimal (unsigned when a word size is set)", fnFormat: (biValue, oOptions) => ToDec(biValue, oOptions) },
	BIN: { bExtra: false, strHelp: "binary", fnFormat: (biValue, oOptions) => ToBin(biValue, oOptions) },
	INT: { bExtra: false, strHelp: "signed decimal (two's complement)", fnFormat: (biValue, oOptions, oWord) => (oWord === undefined ? undefined : ToDec(oWord.ToSigned(biValue), oOptions)) },
	OCT: { bExtra: true, strHelp: "octal", fnFormat: (biValue, oOptions) => ToOct(biValue, oOptions) },
	CHAR: { bExtra: true, strHelp: "the bytes as a character literal", fnFormat: (biValue) => ToChar(biValue) },
} as const satisfies Record<ERow, IRowSpec>;

export const ROW_ORDER = ["HEX", "DEC", "BIN", "INT", "OCT", "CHAR"] as const satisfies readonly ERow[];
```

- `fnFormat` returns `string | undefined`; `undefined` means "no row". INT has nothing to show without a word size, and CHAR has nothing for a negative number without one.
- `bExtra` rows come only when asked for. The command line keeps its four lines by default (so every earlier lesson's output is unchanged) and shows all six with `--all`. The web page always shows all six.
- The order is `HEX DEC BIN INT OCT CHAR` for the same reason: the first four are the old output.

`main.ts` prints whatever comes back:

```ts
for (const { eRow, strText } of OutputRows(oEval.biValue, oOptions, oWord, bAll)) {
	const strNote = eRow === "INT" && oWord !== undefined ? ` (${oWord.nBits}-bit signed)` : "";
	console.log(`${eRow.padEnd(bAll ? 4 : 3)} : ${strText}${strNote}`);
}
```

### New output

```
> node devcalc/src/main.ts "'Hi' << 8" --all
HEX  : 0x48_6900
DEC  : 4,745,472
BIN  : 0b100_1000_0110_1001_0000_0000
OCT  : 0o22_064_400
CHAR : 'Hi\0'
```

`'Hi\0'` can be typed back in: `node devcalc/src/main.ts "'Hi\0'"` gives `0x48_6900` again. Values up to 8 bytes read back — lesson 11's limit for a character literal.

```
> node devcalc/src/main.ts -1 --bits=128
HEX : 0xFFFF_FFFF_FFFF_FFFF_FFFF_FFFF_FFFF_FFFF
DEC : 340,282,366,920,938,463,463,374,607,431,768,211,455
BIN : 0b1111_1111_1111_1111_1111_1111_1111_1111_1111_1111_1111_1111_1111_1111_1111_1111_1111_1111_1111_1111_1111_1111_1111_1111_1111_1111_1111_1111_1111_1111_1111_1111
INT : -1 (128-bit signed)
```

Adding 128 was one word in `TWordBits` and one row in `WORD_NAMES` — `satisfies Record<TWordBits, string>` refused to compile until the `OWORD` row was there. The `--bits=` list in the usage line and in the "Unknown option" message is built from `WORD_BITS`, so it picked up 128 by itself:

```
> node devcalc/src/main.ts 255 --bits=12
Unknown option: "--bits=12" (ignored)
Why : only --no-group, --lower, --no-prefix, --copy, --repl, --all, --bits=8|16|32|64|128 are supported.
HEX : 0xFF
DEC : 255
BIN : 0b1111_1111
```

A negative number without a word size has no bytes, so CHAR is left out with a note:

```
> node devcalc/src/main.ts -5 --all
HEX  : -0x5
DEC  : -5
BIN  : -0b101
OCT  : -0o5
Note: a negative number has no bytes for CHAR until a word size is chosen (--bits=8|16|...).
```

### Checked

```
> npm test
check-pairs : 58 pairs, 0 failed
check-names : 32 files, 0 problems

 Test Files  11 passed (11)
      Tests  65 passed (65)
```

```ts
test("Format: ToChar writes a character literal that reads back", () => {
	...
	for (const biValue of [0n, 0x41n, 0x0a27n, 0x5cn, 0xff00n, 0x48690021n, 0x0102030405060708n]) {
		const strChar = ToChar(biValue) ?? "";
		const oBack = ParseChar(strChar.slice(1, -1)); // without the quotes
		assert.ok(oBack.bOk && oBack.biValue === biValue, `${strChar} does not read back as ${biValue}`);
	}
});
```

A round trip test like this one checks two functions against each other: whatever `ToChar` writes, `ParseChar` must read back as the same value.

Things to try:

- Add a `"UDEC"` row to `ERow` in `Output.ts` → TS2741 on `OUTPUT_ROWS`. Write the row, add it to `ROW_ORDER`, and both the command line and the web page show it.
- Change `bExtra` of `OCT` to `false` → OCT appears without `--all` (and some earlier lessons' outputs change: that is what `bExtra` protects).
- Choose 128-bit in the web page (`npm run web`) and type `-1`.

---

## Summary

- **[JS]** `number` is exact only up to 2^53; `bigint` is exact at any size. They never mix in arithmetic — convert with `BigInt()` / `Number()` on purpose.
- **[JS]** bigint `/` cuts toward zero, `%` takes the left sign, `Math` doesn't take bigints, `sort()` without a compare function sorts as text, and JSON needs a replacer.
- **[JS]** `BigInt.asUintN` / `asIntN` cut to N bits and read them unsigned or signed — the whole of two's complement in two calls. `DataView` chooses the byte order.
- **[TS]** An annotation checks and forgets, `as` checks nothing, `satisfies` checks and keeps the literal types, the exact keys and the contextual types of functions inside.
- DevCalc Lv7: OCT and CHAR rows (`--all`, always on the web page), 128-bit words, and one output table (`core/Output.ts`) shared by the command line and the page.

## Where next

[Lesson 13](../13-functions-scope/README.md) gives DevCalc functions and variables — `popcount(x)`, `rol(x, 4)`, `mask = 0xFF00` — which needs a function table, overloads, `Map`, and a closer look at scope and closures.

---

[← Previous: 11. Regular Expressions and Literal Types](../11-regex-literal-types/README.md) · [Contents](../../README.md) · [Next: 13. Function Tables and Scope →](../13-functions-scope/README.md)
