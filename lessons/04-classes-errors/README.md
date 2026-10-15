**English** · [한국어](README.ko.md)

[← Previous: 03. Unions and Narrowing](../03-unions-narrowing/README.md) · [Contents](../../README.md) · [Next: 05. Generics →](../05-generics/README.md)

# 04. Classes and Errors — Word Size and Two-Number Math (DevCalc Lv3)

> Series: DH.Study.TypeScript · Lesson 04
> Environment: Node.js v24 · TypeScript 7 · VS Code

## Goals

After this lesson you can:

- [ ] Write a class with fields, a constructor, methods, getters and `static` members
- [ ] Choose between TS `private` and JS `#private`, and know why this repo has no parameter properties
- [ ] Use `abstract`, `extends`, `super`, `override` and `implements`, and narrow with `instanceof`
- [ ] Catch errors as `unknown`, write your own `Error` subclass with `cause`, and rethrow what you can't handle
- [ ] Wrap a value to 8/16/32/64 bits with `BigInt.asUintN` / `asIntN`
- [ ] Give DevCalc a word size (`--bits=8`) and two-number calculations (`"0xFF & 0x0F"`)

## Contents

1. [Classes](#1-classes)
2. [Inheritance and interfaces](#2-inheritance-and-interfaces)
3. [Errors — throw, try, catch](#3-errors--throw-try-catch)
4. [Word size and overflow](#4-word-size-and-overflow)
5. [Try it](#5-try-it)
6. [Build it — a two-number calculator](#6-build-it--a-two-number-calculator)
7. [DevCalc step — Lv3 word size and two-number math](#7-devcalc-step--lv3-word-size-and-two-number-math)
8. [Summary](#summary)

Example files for this lesson: [classes.ts](classes.ts) · [inheritance.ts](inheritance.ts) · [errors.ts](errors.ts) · [wordsize.ts](wordsize.ts) · [calc.ts](calc.ts)

> Each example has a Korean-comment twin (`x.ko.ts`) with the same code. The Korean lesson ([README.ko.md](README.ko.md)) uses those.

> Syntax tags: **[JS]** = JavaScript syntax (exists without TS) · **[TS]** = type syntax that TypeScript adds (erase it and you get JS) · details in [lesson 00, 7-3](../00-setup/README.md#7-3-ts-syntax--js-syntax--type-syntax)

---

## 1. Classes

### 1-1. Fields, constructor, methods

**[JS + TS]** — `class` is JS; the typed field declarations are TS

```ts
class CRegister {
	strName: string;
	biValue: bigint;

	constructor(strName: string, biValue = 0n) {
		this.strName = strName;   // "this." is required
		this.biValue = biValue;
	}

	ToString(): string {
		return `${this.strName} = 0x${this.biValue.toString(16).toUpperCase()}`;
	}
}
const oAx = new CRegister("AX", 255n);
```

| | C# | TS / JS |
|---|---|---|
| Member access inside the class | `strName` or `this.strName` | **always** `this.strName` |
| Constructor | `public CRegister(...)` | `constructor(...)` |
| Default visibility | `private` | `public` |
| Overloaded constructors | yes | one constructor (use optional / default parameters) |
| `typeof oAx` at runtime | — | `"object"` — a class is a function that builds objects |

- Naming: classes get the `C` prefix (`CRegister`), as in the [naming rules](../00-setup/README.md).
- With `strict` on, every field must be assigned in the constructor or have an initializer (TS2564 otherwise).

### 1-2. No parameter properties in this repo

**[TS]**

```ts
class CShort { constructor(private nBits: number) {} }   // ✕ TS1294: This syntax is not allowed when 'erasableSyntaxOnly' is enabled
```

TS has a shortcut: a modifier on a constructor parameter declares **and** assigns the field. It looks like C# 12 primary constructors. But it **generates code** (`this.nBits = nBits`), so it can't simply be erased — and Node's type stripping (lesson 00) only erases. This repo turns on `erasableSyntaxOnly`, which rejects it, just like `enum`. Declare the field and assign it, as in 1-1.

### 1-3. `private` vs `#private`

```ts
class CCounter {
	private nTsPrivate = 0;   // [TS] checked by the compiler only
	#nJsPrivate = 0;          // [JS] really private at runtime
}
oCounter.nTsPrivate;   // ✕ TS2341: Property 'nTsPrivate' is private and only accessible within class 'CCounter'
```

| | `private x` [TS] | `#x` [JS] |
|---|---|---|
| Who checks | the compiler | the JS engine |
| After type erasure | a normal property | still private |
| `Object.keys`, `JSON.stringify` | **visible** | hidden |
| Use when | — | real data hiding (this repo's choice) |

Run [classes.ts](classes.ts): `Object.keys(oCounter)` prints `[ 'nTsPrivate' ]` — the "private" field is right there. DevCalc uses `#` (`#oWord`, `#biBits`).

### 1-4. `readonly`, getters, `static`

**[JS + TS]** — `readonly` is TS; `get` and `static` are JS

```ts
class CWordSize {
	static readonly MAX_BITS = 64;   // one value for the class, not per object
	readonly nBits: number;           // set in the constructor, then fixed

	get nBytes(): number {            // read like a field: oWord.nBytes
		return this.nBits / 8;
	}
}
oWord.nBits = 32;   // ✕ TS2540: Cannot assign to 'nBits' because it is a read-only property
```

- A getter is C#'s `{ get; }` property. Naming follows the **returned value** (`nBytes`, `biMax`), not the function rule.
- Like `private`, `readonly` is checked by TS only.

### 1-5. `this` is decided by the call, not the class

**[JS]**

```ts
const fnToString = oAx.ToString;
fnToString();   // ✕ runtime: Cannot read properties of undefined (reading 'strName')

const fnBound = () => oAx.ToString();   // ○ arrow function keeps the object
```

In C# a method group remembers its object. In JS, `this` is whatever is **left of the dot at the call**. With no dot, `this` is `undefined`. This bites when you pass a method as a callback (lesson 02) — e.g. `addEventListener("click", oCalc.Run)` in lesson 07. Wrap it in an arrow function or use `.bind(oAx)`.

## 2. Inheritance and interfaces

### 2-1. `abstract`, `extends`, `super`, `override`

```ts
abstract class CFormatter {                          // [TS] abstract
	abstract Format(biValue: bigint): string;
	Show(biValue: bigint): string {
		return `${this.strLabel} : ${this.Format(biValue)}`;
	}
}

class CHexFormatter extends CFormatter {             // [JS] extends
	constructor() {
		super("HEX");                                 // [JS] before using this
	}
	override Format(biValue: bigint): string {        // [TS] override
		return "0x" + biValue.toString(16).toUpperCase();
	}
}

class CLowerHexFormatter extends CHexFormatter {
	override Format(biValue: bigint): string {
		return super.Format(biValue).toLowerCase();   // [JS] call the parent's version
	}
}
new CFormatter("X");   // ✕ TS2511: Cannot create an instance of an abstract class
```

- Every method is "virtual" in JS. There is no `virtual` keyword.
- `override` is optional in plain TS. This repo's `noImplicitOverride` makes it required (TS4114 without it), so renaming a parent method shows every child that no longer overrides anything.
- A class extends only one class. `abstract` and `override` are erased; `extends` and `super` are JS.

### 2-2. `implements`

**[TS]**

```ts
interface IResettable {
	Reset(): void;
}
class CAccumulator implements IResettable {
	#biTotal = 0n;
	Add(biValue: bigint): this {
		this.#biTotal += biValue;
		return this;   // chaining: new CAccumulator().Add(0xf0n).Add(0x0fn)
	}
	Reset(): void { this.#biTotal = 0n; }
}
```

`implements` is only a check: "this class has those members". It adds nothing at runtime. Unlike C#, a class doesn't **need** `implements` to be used as `IResettable` — any object with a matching `Reset()` fits (structural typing, lesson 02).

### 2-3. `instanceof` and its limits

**[JS + TS]**

```ts
function Describe(vItem: CFormatter | IResettable): string {
	if (vItem instanceof CFormatter) {
		return vItem.Show(10n);   // narrowed to CFormatter
	}
	return "something resettable";
}
// vItem instanceof IResettable   ← impossible: interfaces don't exist at runtime

const oFake: CHexFormatter = { strLabel: "FAKE", Format: () => "?", Show: () => "fake" };   // compiles
oFake instanceof CHexFormatter;   // false
```

- `instanceof` checks the **prototype chain** at runtime. It's the narrowing check left over from lesson 03's table.
- Because types are structural, a plain object with the same public members **is** a `CHexFormatter` to TS, but not to `instanceof`. Classes with `#private` fields avoid this: an object literal can't have them, so TS rejects the fake.

## 3. Errors — throw, try, catch

### 3-1. `try` / `catch` / `finally`

**[JS]**

```ts
try {
	Divide(10n, 0n);   // bigint / 0n throws RangeError
} catch (e) {
	...
} finally {
	console.log("finally runs either way");
}
```

Same as C#, with one difference: there is **one** `catch` and no `catch (RangeError e)` filter. You check the type inside.

### 3-2. `e` is `unknown`

**[TS]**

```ts
try {
	throw "just a string";            // JS allows throwing anything
} catch (e) {
	e.message;                         // ✕ TS18046: 'e' is of type 'unknown'
	const strMessage = e instanceof Error ? e.message : String(e);   // ○ narrow first
}
```

With `strict` on, `useUnknownInCatchVariables` makes `e` `unknown`, because nothing guarantees it is an `Error`. Narrow it with `instanceof` (lesson 03).

### 3-3. Built-in errors

| Error | Example | C# |
|---|---|---|
| `SyntaxError` | `BigInt("12a")`, `JSON.parse("{")` | `FormatException` |
| `RangeError` | `1n / 0n`, `(255).toString(99)` | `DivideByZeroException`, `ArgumentOutOfRangeException` |
| `TypeError` | `null.length`, `1n >>> 1n` | `NullReferenceException`, `InvalidCastException` |

`1n >>> 1n` is also a compile error (TS2365: bigint has no unsigned right shift). [errors.ts](errors.ts) silences it with `// @ts-expect-error` to show the runtime error.

### 3-4. Your own error class — with `cause`

**[JS + TS]**

```ts
class CCalcError extends Error {
	override readonly name = "CCalcError";   // shown in stack traces and e.name
	readonly strFix: string;                  // extra data: what the user can do

	constructor(strMessage: string, strFix: string, oOptions?: ErrorOptions) {
		super(strMessage, oOptions);
		this.strFix = strFix;
	}
}

try {
	return biA / biB;
} catch (e) {
	throw new CCalcError("division by zero", "use a non-zero divisor", { cause: e });
}
```

- `cause` (ES2022) is C#'s `InnerException`: the original error is kept as `e.cause`.
- `name` is a field on `Error`, so redefining it needs `override`.
- `instanceof CCalcError` works for subclasses of `Error` with today's targets (old ES5 output needed a workaround — not an issue here).

### 3-5. Catch only what you can handle

```ts
function TryCalc(fnCalc: () => bigint): string {
	try {
		return String(fnCalc());
	} catch (e) {
		if (e instanceof CCalcError) {
			return `error: ${e.message}`;   // expected: tell the user
		}
		throw e;                             // not ours: a bug — don't hide it
	}
}
```

| | Result union (lesson 03) | Exception |
|---|---|---|
| Use for | expected failures close to the caller (bad input) | failures deep inside, or that the caller can't fix |
| TS checks | yes — must check `bOk` | no — a function's type doesn't say what it throws |
| DevCalc | `ParseInteger` | `CCalculator` → `CCalcError` |

C# and TS both lack checked exceptions, so a `throws` list never appears in a type. A result union is a value that TS checks. Both styles are used in DevCalc.

## 4. Word size and overflow

**[JS]**

```ts
BigInt.asUintN(8, 256n)   // 0n      — keep the low 8 bits, unsigned
BigInt.asIntN(8, 255n)    // -1n     — keep the low 8 bits, read as two's complement
BigInt.asUintN(16, -1n)   // 65535n  — 0xFFFF
```

| Bits | C# | unsigned range | signed range | -1 as unsigned |
|---|---|---|---|---|
| 8 | `byte` / `sbyte` | 0..255 | -128..127 | `0xFF` |
| 16 | `ushort` / `short` | 0..65,535 | -32,768..32,767 | `0xFFFF` |
| 32 | `uint` / `int` | 0..4,294,967,295 | -2,147,483,648..2,147,483,647 | `0xFFFFFFFF` |
| 64 | `ulong` / `long` | 0..2⁶⁴-1 | -2⁶³..2⁶³-1 | `0xFFFFFFFFFFFFFFFF` |

- `bigint` never overflows, so a word size is something **we** apply: compute exactly, then keep N bits. That is C#'s default `unchecked` behavior (`(byte)(0xFF + 1)` is `0`).
- The same bits mean two numbers: `0xFF` is 255 unsigned and -1 signed. DevCalc Lv3 shows both.
- Why not `number`? Its bitwise operators convert to **32-bit signed** first: `0xFFFFFFFF | 0` is `-1`, `1 << 31` is `-2147483648`. With `bigint` the bits are what you wrote.

---

## 5. Try it

Open each file and press `F5`, or run it from the command line. If you can't run code, read the code alongside the output below.

### [classes.ts](classes.ts) — fields, private vs #private, readonly, getter, static, this

```
> node lessons/04-classes-errors/classes.ts
1) AX = 0xFF / typeof = object
2) declare fields, then assign them in the constructor
3) Object.keys = [ 'nTsPrivate' ] / JSON = {"nTsPrivate":1}
4) nBits = 16 / nBytes = 2 / biMax = 65535n / MAX_BITS = 64
5) Expected error: Cannot read properties of undefined (reading 'strName')
   Why : fnToString() is called without an object, so "this" is undefined.
   Fix : wrap it — () => oAx.ToString() — or use oAx.ToString.bind(oAx).
   arrow wrapper: AX = 0xFF
```

Things to try: uncomment `// class CShort ...`, `// oCounter.nTsPrivate;` and `// oWord.nBits = 32;` one at a time and read each red squiggle.

### [inheritance.ts](inheritance.ts) — abstract, extends, override, implements, instanceof

```
> node lessons/04-classes-errors/inheritance.ts
1) CFormatter is abstract : only its subclasses can be created
2) HEX : 0xFF (CHexFormatter)
2) HEX : 0xff (CLowerHexFormatter)
3) total = 255n
   after Reset = 0n
4) HEX : 0xA / something resettable
5) TS accepted oFake / instanceof CHexFormatter = false
```

Things to try: remove `override` from `CLowerHexFormatter.Format` (TS4114). Then add `#nId = 0;` to `CFormatter` and look at `oFake`.

### [errors.ts](errors.ts) — try/catch/finally, unknown, built-in errors, custom error, rethrow

```
> node lessons/04-classes-errors/errors.ts
1) caught: RangeError - Division by zero
   finally runs either way
2) thrown: just a string / typeof = string
3) BigInt("12a")  → SyntaxError: Cannot convert 12a to a BigInt
3) 1n / 0n        → RangeError: Division by zero
3) 1n >>> 1n      → TypeError: BigInts have no unsigned right shift, use >> instead
3) null.length    → TypeError: Cannot read properties of null (reading 'length')
4) CCalcError: division by zero / fix: use a non-zero divisor
   cause: RangeError: Division by zero
5) 3 / error: division by zero
   rethrown: TypeError: a bug, not a user error
```

### [wordsize.ts](wordsize.ts) — asUintN / asIntN, ranges, overflow, number vs bigint

```
> node lessons/04-classes-errors/wordsize.ts
1)  255 → 8-bit unsigned 255, signed -1
1)  256 → 8-bit unsigned 0, signed 0
1)   -1 → 8-bit unsigned 255, signed -1
1) -128 → 8-bit unsigned 128, signed -128
2) -1 as  8-bit = 0xFF
2) -1 as 16-bit = 0xFFFF
2) -1 as 32-bit = 0xFFFFFFFF
2) -1 as 64-bit = 0xFFFFFFFFFFFFFFFF
3) 8-bit : unsigned 0..255, signed -128..127
3) 16-bit : unsigned 0..65535, signed -32768..32767
3) 32-bit : unsigned 0..4294967295, signed -2147483648..2147483647
4) 0xFF + 1 = 256n → 8-bit 0n
5) number : 0xFFFFFFFF | 0 = -1 / 1 << 31 = -2147483648
   bigint : 0xFFFFFFFFn | 0n = 4294967295n / 1n << 31n = 2147483648n
```

Line 1: 255 and -1 print the same pair — in 8 bits they are the same bit pattern.

## 6. Build it — a two-number calculator

**[JS + TS]**

An 8-bit calculator that reads `"<number> <operator> <number>"`. It brings together a literal union from lesson 03, a class with `#private` fields, and an error class. Full code: [calc.ts](calc.ts).

### Operators and the error class

```ts
const OPERATORS = ["+", "-", "*", "/", "&", "|", "<<"] as const;
type TOperator = (typeof OPERATORS)[number];

function IsOperator(strText: string): strText is TOperator {
	return (OPERATORS as readonly string[]).includes(strText);
}

class CCalcError extends Error {
	override readonly name = "CCalcError";
	readonly strFix: string;
	constructor(strMessage: string, strFix: string, oOptions?: ErrorOptions) { ... }
}
```

### The calculator class

```ts
class CCalculator {
	readonly #oWord: CWordSize;

	constructor(oWord: CWordSize) {
		this.#oWord = oWord;
	}

	Run(strExpr: string): bigint {
		const [strA = "", strOp = "", strB = "", ...arrRest] = strExpr.trim().split(/\s+/);
		if (arrRest.length > 0 || strB === "") {
			throw new CCalcError("expected <number> <operator> <number>", 'write it like "0xFF + 1".');
		}
		if (!IsOperator(strOp)) {
			throw new CCalcError(`"${strOp}" is not an operator`, `use one of ${OPERATORS.join(" ")}`);
		}
		const biA = this.#Parse(strA);
		const biB = this.#Parse(strB);
		return this.#oWord.ToUnsigned(this.#Apply(biA, strOp, biB));   // strOp is TOperator here
	}

	#Parse(strText: string): bigint {
		try {
			return this.#oWord.ToUnsigned(BigInt(strText));
		} catch (e) {
			throw new CCalcError(`"${strText}" is not an integer`, "use 255, 0xFF, 0b1010 or 0o17.", { cause: e });
		}
	}

	#Apply(biA: bigint, strOp: TOperator, biB: bigint): bigint {
		switch (strOp) {
			case "+": return biA + biB;
			...
			case "/":
				if (biB === 0n) {
					throw new CCalcError("division by zero", "the right side of / must not be 0.");
				}
				return biA / biB;
			...
			default: return AssertNever(strOp);   // lesson 03: add an operator → red until handled
		}
	}
}
```

- `#Parse` and `#Apply` are private **methods** — `#` works on methods too.
- `#Parse` turns a `SyntaxError` into a `CCalcError` and keeps the original as `cause`. The caller deals with one error type.
- Destructuring with defaults (`strOp = ""`) turns `string | undefined` into `string` (`noUncheckedIndexedAccess`, lesson 03).

### Run it

```
> node lessons/04-classes-errors/calc.ts
8-bit calculator (0..255)
  0xF0 | 0x0F  = 0xFF (255, signed -1)
  0xFF + 1     = 0x00 (0, signed 0)
  0 - 1        = 0xFF (255, signed -1)
  1 << 7       = 0x80 (128, signed -128)
  200 * 2      = 0x90 (144, signed -112)
  10 / 0       → CCalcError: division by zero / Fix : the right side of / must not be 0.
  12a + 1      → CCalcError: "12a" is not an integer [cause: SyntaxError] / Fix : use 255, 0xFF, 0b1010 or 0o17.
  3 % 2        → CCalcError: "%" is not an operator / Fix : use one of + - * / & | <<
  1 +          → CCalcError: expected <number> <operator> <number> / Fix : write it like "0xFF + 1".
```

Things to try: add `"%"` to `OPERATORS`. `AssertNever(strOp)` turns red (TS2345) until you add the `case "%":`.

## 7. DevCalc step — Lv3 word size and two-number math

New files:

| File | Contents |
|---|---|
| [devcalc/src/core/WordSize.ts](../../devcalc/src/core/WordSize.ts) | `TWordBits`, `IsWordBits`, `class CWordSize` (`strName` BYTE/WORD/DWORD/QWORD, ranges, `ToUnsigned`, `ToSigned`, `Fits`) |
| [devcalc/src/core/Calculator.ts](../../devcalc/src/core/Calculator.ts) | `TOperator` (`+ - * / % & \| ^ << >>`), `class CCalcError`, `class CCalculator` |
| [devcalc/tests/Calculator.test.ts](../../devcalc/tests/Calculator.test.ts) | word size ranges, operators, overflow, errors |

[Format.ts](../../devcalc/src/core/Format.ts) gets `nBits` in `IFormatOptions` and pads with zeros to the word size (`0x00FF` for 16 bits).

`CCalculator` is section 6 with two additions. Without a word size it calculates without limits. With a word size it also reports overflow:

```ts
Calculate(biA: bigint, strOp: TOperator, biB: bigint): ICalcResult {
	...
	const biExact = this.#Apply(oWord.ToUnsigned(biA), strOp, oWord.ToUnsigned(biB));
	return { biValue: oWord.ToUnsigned(biExact), biExact, bOverflow: !oWord.Fits(biExact) };
}
```

[main.ts](../../devcalc/src/main.ts) catches only `CCalcError`:

```ts
try {
	const oResult = new CCalculator(oWord).Calculate(biA, strOp, biB);
	...
} catch (e) {
	if (e instanceof CCalcError) {
		console.log(`Cannot calculate: "${strExpr}"`);
		console.log(`Why : ${e.message}`);
		console.log(`Fix : ${e.strFix}`);
		return 1;
	}
	throw e;   // not ours : a bug, let it crash with its stack trace
}
```

### `process.exit()` → `process.exitCode`

Lesson 03 called `process.exit(1)` on bad input. Now the code is in a `Main()` function that **returns** the exit code:

```ts
process.exitCode = Main(strExpr);
```

`process.exit()` stops Node immediately, even while output is still being written. When the output goes into a pipe (another program, a test runner), lines can be lost — on Windows it can even crash Node. With `exitCode`, Node finishes writing and then exits with that code. Returning early from `Main()` also makes the control flow plain `if`/`return`.

Run it (quote the expression so it is one argument, with spaces around the operator):

```
> node devcalc/src/main.ts "0xFF & 0x0F"
HEX : 0xF
DEC : 15
BIN : 0b1111

> node devcalc/src/main.ts "0xFF + 1" --bits=8
HEX : 0x00
DEC : 0
BIN : 0b0000_0000
INT : 0 (8-bit signed)
Note: 256 does not fit in 8 bits (BYTE), so it wrapped to 0.

> node devcalc/src/main.ts -1 --bits=16
HEX : 0xFFFF
DEC : 65,535
BIN : 0b1111_1111_1111_1111
INT : -1 (16-bit signed)

> node devcalc/src/main.ts "1 << 31" --bits=32
HEX : 0x8000_0000
DEC : 2,147,483,648
BIN : 0b1000_0000_0000_0000_0000_0000_0000_0000
INT : -2,147,483,648 (32-bit signed)

> node devcalc/src/main.ts "1 / 0"
Cannot calculate: "1 / 0"
Why : division by zero
Fix : the right side of / must not be 0.

> node devcalc/src/main.ts "1 << 9" --bits=8
Cannot calculate: "1 << 9"
Why : shift count 9 is out of range
Fix : use a shift count from 0 to 8.
```

- `--bits=N` pads the output to the word size and adds `INT`, the same bits read as signed.
- `"1 << 31" --bits=32` is C#'s `1 << 31` for `int`: `-2,147,483,648`.
- Unknown options now list `--bits` too, so lesson 02's `--bad` example prints a longer `Why :` line.

Tests:

```
> npm test
check-pairs : 25 pairs, 0 failed
✔ Format: 255
✔ Format: zero and negative
✔ GroupDigits
✔ Format options
✔ Format padding (nBits)
✔ Parse: decimal and sign
✔ Parse: prefixes and case
✔ Parse: _ separators
✔ Parse: invalid input
✔ WordSize: ranges and wrapping
✔ Calculator: operators without a word size
✔ Calculator: word size wraps and reports overflow
✔ Calculator: errors
ℹ pass 13
```

`assert.throws(() => ..., CCalcError)` checks that the right error **class** is thrown — `instanceof` again.

## Summary

- `class` is JS: fields, `constructor`, methods, `get`, `static`. Always `this.` inside. Members are public by default.
- No parameter properties here (`erasableSyntaxOnly`, TS1294). Declare the field, assign it.
- `private` / `readonly` are compile-time only. `#private` is enforced at runtime.
- `this` depends on the call. A detached method loses it → wrap it in an arrow function or `bind`.
- `abstract`, `override` (required by `noImplicitOverride`), `implements` are TS. `extends`, `super`, `instanceof` are JS. Interfaces can't be checked with `instanceof`.
- `catch (e)` gives `unknown`. Narrow with `instanceof`, catch only your own errors, rethrow the rest. Keep the original with `{ cause: e }`.
- `bigint` + `BigInt.asUintN` / `asIntN` = exact math, then wrap to 8/16/32/64 bits.
- Exit with `process.exitCode`, not `process.exit()`.

**Next → [05. Generics](../05-generics/README.md)**: write `TResult<T, E>`, `Map<K, V>` and functions that work with any type. DevCalc gets a calculation history.

---

[← Previous: 03. Unions and Narrowing](../03-unions-narrowing/README.md) · [Contents](../../README.md) · [Next: 05. Generics →](../05-generics/README.md)
