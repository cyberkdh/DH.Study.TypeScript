**English** · [한국어](README.ko.md)

[← Previous: 00. Development Setup](../00-setup/README.md) · [Contents](../../README.md) · Next: 02. Functions and Objects (coming soon)

# 01. Basic Types and bigint — Building a Radix Converter (DevCalc Lv1)

> Series: DH.Study.TypeScript · Lesson 01
> Environment: Node.js v24 · TypeScript 7 · VS Code

## Goals

After this lesson you can:

- [ ] Annotate variables with types, and know when you can leave the annotation out (type inference)
- [ ] Explain the limit of `number` (2^53 - 1) and use `bigint` for large integers
- [ ] Tell `any` from `unknown`, and know what `void` and `never` are for
- [ ] Build radix conversion functions (ToHex/ToBin/ToDec/ToBigInt) with what you learned
- [ ] Add radix conversion (ToHex/ToBin/ToDec) to DevCalc

## Contents

1. [Type annotations and type inference](#1-type-annotations-and-type-inference)
2. [Basic types compared with C#](#2-basic-types-compared-with-c)
3. [The number trap](#3-the-number-trap)
4. [bigint](#4-bigint)
5. [any / unknown / void / never](#5-any--unknown--void--never)
6. [Try it](#6-try-it)
7. [Build it — radix conversion functions](#7-build-it--radix-conversion-functions)
8. [DevCalc step — Lv1 radix converter](#8-devcalc-step--lv1-radix-converter)
9. [Summary](#summary)

Example files for this lesson: [primitives.ts](primitives.ts) · [bigint.ts](bigint.ts) · [special-types.ts](special-types.ts) · [convert.ts](convert.ts)

> Comments in the example code are written in English first, followed by Korean.

---

## 1. Type annotations and type inference

```ts
const strName: string = "DevCalc";   // type annotation
const strVersion = "0.1.0";          // type inference → string
```

- Put `: type` after the name. The order is the reverse of C#'s `string strName = ...`.
- When there is a value, TS works out the type itself. Same idea as C#'s `var` — **you usually leave the annotation out.**
- Where annotations are required: function parameters, and return types of public functions.

## 2. Basic types compared with C#

| TypeScript | C# | Notes |
|---|---|---|
| `string` | `string` | `"..."`, `'...'`, template strings `` `value: ${n}` `` |
| `number` | `double` | **No integer/float split.** There is no separate `int`, `long` or `float` |
| `bigint` | `BigInteger` | Add `n`, as in `255n`. Integers of unlimited size |
| `boolean` | `bool` | |
| `null`, `undefined` | `null` | **Two** ways to say "no value" |
| `T[]`, `[T1, T2]` | `T[]`, `(T1, T2)` | Array, tuple |
| `any` | `dynamic` | Turns type checking off |
| `unknown` | `object` | Can't be used until you check what it is |
| `void` / `never` | `void` / — | `never` means "never finishes normally" |

## 3. The number trap

```ts
0.1 + 0.2        // 0.30000000000000004
7 / 2            // 3.5   ← unlike C# integer division (3)
2 ** 53 + 1      // 9007199254740992  ← the 1 is lost!
```

`number` is a 64-bit floating-point value (double), so it represents integers exactly only up to `Number.MAX_SAFE_INTEGER` (2^53 - 1).
A developer calculator must handle 64-bit values (`0xFFFFFFFFFFFFFFFF`), so `number` is not enough.

## 4. bigint

```ts
const biMax64 = 0xffff_ffff_ffff_ffffn;   // 18446744073709551615n
biMax64.toString(16);                      // "ffffffffffffffff"
biMax64.toString(2);                       // "1111...1111" (64 ones)
7n / 2n;                                   // 3n  (integer division)
```

- Literals end in `n`. Use `_` to group digits for readability.
- `toString(radix)` produces binary, octal or hex strings.
- **It can't be mixed with `number`**:

```ts
const biWrong = 1n + 1;    // TS: red squiggle as you type / JS: TypeError at runtime
const biRight = 1n + BigInt(1);
```

> This is a good example of why TypeScript is worth using. An error that JS only reveals when the code runs, TS reports **the moment you write it**.

## 5. any / unknown / void / never

```ts
const vAny: any = "hello";
vAny.toFixed;                    // compiles (no checking) → undefined at runtime

const vUnknown: unknown = JSON.parse("255");
vUnknown.toString(16);           // error: check what it is first
if (typeof vUnknown === "number") vUnknown.toString(16);   // OK
```

- Take values from outside (JSON, user input) as **`unknown`** rather than `any`, and check them before use.
- `void`: a function that returns nothing. `never`: a function that always throws or never ends.

> Naming: in Hungarian notation, `any`/`unknown` values use the `v` (variant) prefix.

---

## 6. Try it

Open each file and press `F5`, or run it from the command line. If you can't run code, read the code alongside the output below.

### [primitives.ts](primitives.ts) — annotations, inference, number, arrays and tuples

```
> node lessons/01-basic-types/primitives.ts
0.1 + 0.2 = 0.30000000000000004
7 / 2 = 3.5
Math.trunc(7 / 2) = 3
0xff = 255 / hex: ff / bin: 11111111
[ 8, 16, 32, 64 ] [ 'WORD', 16 ]
first bits x 2: 16
DevCalc 0.1.0 64 true 1
```

Things to try: uncomment `nCount = "1";` to see the red squiggle, and hover over variables to see the inferred types.

### [bigint.ts](bigint.ts) — bigint, and what happens if you mix it with number

```
> node lessons/01-basic-types/bigint.ts
MAX_SAFE_INTEGER = 9007199254740991
2^53 + 1 = 9007199254740992
64-bit max = 18446744073709551615n
hex = ffffffffffffffff
2^53 + 1 = 9007199254740993n
7n / 2n = 3n
TypeError: Cannot mix BigInt and other types, use explicit conversions
```

The final `TypeError` is **intentional**. Remove `// @ts-expect-error` and the editor flags it in advance with a red squiggle.

### [special-types.ts](special-types.ts) — any, unknown, null, void, never

```
> node lessons/01-basic-types/special-types.ts
undefined
hex: ff
now it has a value
void function called
caught: a never function always throws
```

## 7. Build it — radix conversion functions

Use the types you just learned to build DevCalc's first part. Full code: [convert.ts](convert.ts).

### ToHex : 255n → "0xFF"

```ts
function ToHex(biValue: bigint): string {
	const strSign = biValue < 0n ? "-" : "";            // keep the sign separate, at the front
	const biAbs = biValue < 0n ? -biValue : biValue;    // absolute value
	return `${strSign}0x${biAbs.toString(16).toUpperCase()}`;
}
```

- Parameter `biValue: bigint`, return `: string` — annotate functions.
- Compare **bigint with bigint**, as in `0n`. `biValue < 0` also works, but `0n` reads better in bigint code.
- Calling `toString(16)` on a negative value gives `"-ff"`, which puts the prefix in an awkward place, so the sign is handled separately.

### ToBin, ToDec

```ts
function ToBin(biValue: bigint): string { ... `${strSign}0b${biAbs.toString(2)}` ... }
function ToDec(biValue: bigint): string { return biValue.toString(10); }
```

`ToBin` differs from `ToHex` only in radix and prefix. We merge the duplication in the DevCalc step.

### ToBigInt : number → bigint

```ts
function ToBigInt(nValue: number): bigint {
	if (!Number.isSafeInteger(nValue)) {
		throw new RangeError(`Not a safe integer: ${nValue}`);
	}
	return BigInt(nValue);
}
```

- `1.5`, `NaN`, `Infinity` and `2 ** 53` are not exact integers, so they are rejected.
- This guards against "the number trap" from section 3 in code.

### Run it

```
> node lessons/01-basic-types/convert.ts
                 255 |                0xFF | 0b11111111
                   0 |                 0x0 | 0b0
                -255 |               -0xFF | -0b11111111
18446744073709551615 |  0xFFFFFFFFFFFFFFFF | 0b1111...1111
255n
RangeError: Not a safe integer: 1.5
```

> Set a breakpoint on the `ToBigInt(1.5)` line, press `F11` to step into the function, and look at `nValue`.

## 8. DevCalc step — Lv1 radix converter

The functions from section 7 move into [devcalc/src/core/Format.ts](../../devcalc/src/core/Format.ts). The duplicated sign handling is merged into a single `FormatRadix`.

```ts
function FormatRadix(biValue: bigint, nRadix: number, strPrefix: string): string {
	const strSign = biValue < 0n ? "-" : "";
	const biAbs = biValue < 0n ? -biValue : biValue;
	return `${strSign}${strPrefix}${biAbs.toString(nRadix).toUpperCase()}`;
}
export function ToHex(biValue: bigint): string { return FormatRadix(biValue, 16, "0x"); }
```

Run it:

```
> node devcalc/src/main.ts 255
HEX : 0xFF
DEC : 255
BIN : 0b11111111
```

> For now, input parsing is left to `BigInt("255")`. In lesson 03 we replace it with our own parser for `0xFF`, `0b1010` and `1_000`.

## Summary

- Types go after the name as `: type`. When there is a value, inference usually does the job.
- `number` is just a double; integers beyond 2^53 - 1 need `bigint`.
- `bigint` and `number` can't be mixed, and TS catches that mistake before the code runs.
- Take outside values as `unknown`. Avoid `any`.

**Next → 02. Functions and Objects (coming soon)**: function types, optional parameters, `interface` vs `type`. DevCalc gains digit grouping (`0xFFFF_FFFF`) and output options.

---

[← Previous: 00. Development Setup](../00-setup/README.md) · [Contents](../../README.md) · Next: 02. Functions and Objects (coming soon)
