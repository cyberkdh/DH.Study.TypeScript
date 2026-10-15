**English** · [한국어](README.ko.md)

[← Previous: 04. Classes and Errors](../04-classes-errors/README.md) · [Contents](../../README.md) · [Next: 06. Modules and Async →](../06-modules-async/README.md)

# 05. Generics — TResult, Containers and a Calculation History

> Series: DH.Study.TypeScript · Lesson 05
> Environment: Node.js v24 · TypeScript 7 · VS Code

## Goals

After this lesson you can:

- [ ] Write generic functions (`<T>`) and let TS infer the type arguments
- [ ] Limit a type parameter with `extends`, `keyof` and defaults (`<T = string>`)
- [ ] Write generic interfaces and classes, and use `Array<T>`, `Map<K, V>`, `Set<T>`, `Record<K, V>`
- [ ] Return `TResult<T, E>` instead of throwing, and know when to choose which
- [ ] Explain why TS generics disappear at run time, unlike C#'s
- [ ] Give DevCalc a result type, a calculation history and `ans` (`"0xFF + 1; ans * 2"`)

## Contents

1. [Generic functions](#1-generic-functions)
2. [Constraints](#2-constraints)
3. [Generic types and containers](#3-generic-types-and-containers)
4. [TResult — errors as values](#4-tresult--errors-as-values)
5. [Try it](#5-try-it)
6. [Build it — a calculation history](#6-build-it--a-calculation-history)
7. [DevCalc step — Evaluate, history and ans](#7-devcalc-step--evaluate-history-and-ans)
8. [Summary](#summary)

Example files for this lesson: [generics.ts](generics.ts) · [constraints.ts](constraints.ts) · [containers.ts](containers.ts) · [result.ts](result.ts) · [history.ts](history.ts)

> Each example has a Korean-comment twin (`x.ko.ts`) with the same code. The Korean lesson ([README.ko.md](README.ko.md)) uses those.

> Syntax tags: **[JS]** = JavaScript syntax (exists without TS) · **[TS]** = type syntax that TypeScript adds (erase it and you get JS) · details in [lesson 00, 7-3](../00-setup/README.md#7-3-ts-syntax--js-syntax--type-syntax)

---

## 1. Generic functions

### 1-1. The problem: `any` loses the type

**[TS]**

```ts
function FirstAny(arrItem: any[]): any {
	return arrItem[0];
}
const vFirst = FirstAny([255n, 16n]);   // any
vFirst.toUpperCase();                    // compiles — and fails at run time
```

One function for every element type is what we want, but `any` switches the checker off. The result could be anything, so every mistake compiles.

### 1-2. A type parameter `<T>`

**[TS]**

```ts
function First<T>(arrItem: readonly T[]): T | undefined {
	return arrItem[0];
}
const biFirst = First([255n, 16n]);      // T = bigint → bigint | undefined
const strFirst = First(["HEX", "DEC"]);  // T = string
```

- `<T>` is a placeholder: "whatever type the caller uses". TS **infers** it from the arguments, so you rarely write it.
- `T | undefined` because the array can be empty (`noUncheckedIndexedAccess`, lesson 03).
- `readonly T[]` accepts both normal and readonly arrays and promises not to change them.

### 1-3. Explicit type arguments

```ts
First<number>([1, 2, 3]);   // ○
First<number>(["1"]);       // ✕ TS2322: Type 'string' is not assignable to type 'number'
```

Write the type argument when inference can't see it (an empty array, a value that comes back later) or when you want TS to check the arguments against it.

### 1-4. Several parameters, arrow functions, function types

```ts
function MakePair<A, B>(vLeft: A, vRight: B): [A, B] { return [vLeft, vRight]; }
MakePair("AX", 0xffn);                                  // [string, bigint]

const Last = <T>(arrItem: readonly T[]): T | undefined => arrItem[arrItem.length - 1];

type TMapper<TIn, TOut> = (vItem: TIn) => TOut;         // a generic function type
function MapAll<TIn, TOut>(arrItem: readonly TIn[], fnMap: TMapper<TIn, TOut>): TOut[] { ... }
MapAll(["0xFF", "0b1010"], (strText) => strText.length); // TIn = string, TOut = number
```

| | C# | TS |
|---|---|---|
| Generic method | `T First<T>(IList<T> list)` | `function First<T>(arrItem: readonly T[]): T \| undefined` |
| Inference | yes | yes — also from callbacks (`TOut` from the return value) |
| Delegate type | `Func<TIn, TOut>` | `type TMapper<TIn, TOut> = (vItem: TIn) => TOut` |
| `default(T)` | yes | no — there is no `T` at run time, return `undefined` |

## 2. Constraints

### 2-1. `T extends ...`

**[TS]**

```ts
function LengthOf<T>(vItem: T) {
	return vItem.length;   // ✕ TS2339: Property 'length' does not exist on type 'T'
}

function Longest<T extends { length: number }>(vLeft: T, vRight: T): T {
	return vRight.length > vLeft.length ? vRight : vLeft;   // ○ every T has length
}
Longest("0xFF", "0b1111_1111");   // strings have length
Longest([1, 2], [3]);             // arrays too
Longest(10, 20);                  // ✕ TS2345: 'number' is not assignable to '{ length: number; }'
```

Without a constraint `T` could be anything, so TS lets you use nothing on it. `extends` is C#'s `where T : ...`, but it is **structural**: any type with a `length: number` fits — no interface needs to be declared.

### 2-2. `K extends keyof T` and `T[K]`

```ts
function GetProp<T, K extends keyof T>(oItem: T, strKey: K): T[K] {
	return oItem[strKey];
}
GetProp(oAx, "biValue");   // bigint
GetProp(oAx, "nBits");     // number
GetProp(oAx, "nBitz");     // ✕ TS2345: Argument of type '"nBitz"' is not assignable to parameter of type 'keyof IRegister'
```

`keyof T` is the union of T's key names (`"strName" | "biValue" | "nBits"`). `T[K]` is "the type of that key". A typo in a property name becomes a compile error. C# has no equivalent; you'd use reflection or `nameof`.

### 2-3. Defaults and `const T`

```ts
interface IBox<T = string> { readonly vValue: T; }
const oText: IBox = { vValue: "0xFF" };           // T = string

function Options<const T extends readonly string[]>(arrOption: T): T { return arrOption; }
Options(["HEX", "DEC", "BIN"]);                   // readonly ["HEX", "DEC", "BIN"], not string[]
```

`const T` (TS 5.0) infers the argument as if it had `as const` (lesson 03), so the literal types survive.

| | C# | TS |
|---|---|---|
| Base type / interface | `where T : IFoo` | `T extends IFoo` (structural) |
| `class` / `struct` / `new()` | yes | no — there are no value types, and `T` can't be constructed |
| Default type argument | no | `<T = string>` |
| Key of a type | — | `K extends keyof T` |

## 3. Generic types and containers

### 3-1. Generic interfaces and classes

**[JS + TS]** — `class` is JS; `<T>` is TS

```ts
interface IBox<T> {
	readonly vValue: T;
	readonly strLabel: string;
}

class CStack<T> {
	readonly #arrItem: T[] = [];
	Push(vItem: T): void { this.#arrItem.push(vItem); }
	Pop(): T | undefined { return this.#arrItem.pop(); }
}
const oStack = new CStack<bigint>();
oStack.Push("2");   // ✕ TS2345: Argument of type 'string' is not assignable to parameter of type 'bigint'
```

### 3-2. Built-in generics

**[JS + TS]**

```ts
const arrValue: Array<bigint> = [1n, 2n];          // same as bigint[]
const mapRegister = new Map<string, bigint>([["AX", 0x1234n]]);
const setSeen = new Set<string>(["HEX", "DEC", "HEX"]);   // size 2
mapRegister.get("AX");                              // bigint | undefined

type ERadixName = "HEX" | "DEC" | "BIN";
const RADIX_BASE: Record<ERadixName, number> = { HEX: 16, DEC: 10, BIN: 2 };
const oPartial: Record<ERadixName, number> = { HEX: 16 };   // ✕ TS2739: missing the following properties: BIN, DEC
```

| C# | TS / JS |
|---|---|
| `List<T>` | `T[]` / `Array<T>` |
| `Dictionary<K, V>` | `Map<K, V>` (any key type), or `Record<K, V>` for a plain object with string keys |
| `HashSet<T>` | `Set<T>` |
| `IReadOnlyList<T>` | `readonly T[]` / `ReadonlyArray<T>` |
| `IReadOnlyDictionary<K, V>` | `ReadonlyMap<K, V>` |
| `dict.TryGetValue(k, out v)` | `map.get(k)` returns `V \| undefined` |

- `Record<ERadixName, number>` requires **every** key of the union: add `"OCT"` to `ERadixName` and every table turns red until it gets an `OCT` entry.
- `ReadonlyArray` / `ReadonlyMap` have no `push` / `set` (TS2339). Like `readonly`, this is a compile-time check only.

### 3-3. Generics are erased

**[JS]**

```ts
new CStack<string>().constructor === new CStack<bigint>().constructor   // true
```

C# builds a separate type for `List<int>` and `List<string>`, and you can ask `typeof(T)` at run time. In TS, `<T>` is type syntax and is erased like every other type (lesson 00). At run time there is one `CStack`. So `T` can't be used as a value: no `new T()`, no `x instanceof T`, no `typeof T` check. If a function needs a run-time type, pass a value (a class, a guard function).

## 4. TResult — errors as values

**[TS]**

```ts
type TResult<T, E = string> = { bOk: true; vValue: T } | { bOk: false; vError: E };

function Ok<T>(vValue: T) { return { bOk: true, vValue } as const; }   // (simplified)
function Err<E>(vError: E) { return { bOk: false, vError } as const; }

function ParseHex(strText: string): TResult<bigint> {
	if (!/^0x[0-9a-f]+$/i.test(strText)) {
		return Err(`"${strText}" is not a hex number`);
	}
	return Ok(BigInt(strText));
}

const oResult = ParseHex("0xFF");
if (oResult.bOk) {
	oResult.vValue;   // bigint — narrowed
}
oResult.vValue;       // ✕ TS2339: vValue only exists when bOk is true
```

This is lesson 03's discriminated union with two type parameters. Lesson 03's `TParseResult` was one fixed version of it. The error can be any type: `TResult<bigint, IParseError>` carries a position, not only a message.

```ts
function MapResult<T, U, E>(oResult: TResult<T, E>, fnMap: (vValue: T) => U): TResult<U, E> {
	return oResult.bOk ? Ok(fnMap(oResult.vValue)) : oResult;   // an error passes through
}
```

| | `throw` (lesson 04) | `TResult<T, E>` |
|---|---|---|
| Shows in the function type | no | yes |
| Caller can forget it | yes | no — the value is behind `bOk` |
| Good for | bugs, rare failures deep inside | expected failures (user input) |
| C# | exceptions | `int.TryParse(s, out n)`, or a `Result<T>` class |

One trap: a `const` with a union type is **narrowed by its initializer**. `const oErr: TResult<number> = Err("bad")` makes `oErr` the error side only, and `MapResult(oErr, ...)` can't infer `T` any more (`unknown`). Results usually come from a function call, where this doesn't happen. DevCalc's test file has an example.

---

## 5. Try it

Open each file and press `F5`, or run it from the command line. If you can't run code, read the code alongside the output below.

### [generics.ts](generics.ts) — any vs T, inference, explicit arguments, several parameters

```
> node lessons/05-generics/generics.ts
1) FirstAny = 255n / but TS only knows: any
   Expected error: vFirst.toUpperCase is not a function
   Why : vFirst is a bigint, but any let us call a string method on it.
   Fix : a type parameter keeps the real type — see 2).
2) First = 255n / HEX
3) First<number> = 1
4) MakePair = [ 'AX', 255n ] / second + 1n = 256n
5) Last = 3n / mapped = 0xFF, 0x10
6) MapAll lengths = [ 4, 6 ]
```

Things to try: change `FirstAny` to `First` in 1) — `vFirst.toUpperCase()` turns red. Uncomment `// First<number>(["1"]);`.

### [constraints.ts](constraints.ts) — extends, keyof, defaults, const T

```
> node lessons/05-generics/constraints.ts
1) LengthOf = string
2) Longest = 0b1111_1111 / [ 1, 2 ]
3) GetProp = 255n 16
4) NameList = AX, BX
5) IBox = 0xFF / 255n
6) Options = HEX | DEC | BIN / count = 3
```

Things to try: uncomment the three commented lines one at a time (TS2339, TS2345, TS2345). Hover `arrRadix` with and without `const` in `Options<const T ...>`.

### [containers.ts](containers.ts) — generic interface and class, Map, Set, Record, readonly

```
> node lessons/05-generics/containers.ts
1) IBox = HEX 255n / flags [ true, false ]
2) CStack : count = 2 / peek = 255n / pop = 255n / count = 1
3) Array = 2 / Map AX = 4660n / Map CX = undefined / Set size = 2
4) Record = { HEX: 16, DEC: 10, BIN: 2 }
5) Total = 6n / ReadonlyMap has AX = true
6) same class at run time = true / C# would make two types
```

### [result.ts](result.ts) — TResult, Ok / Err, custom error type, MapResult

```
> node lessons/05-generics/result.ts
1) TResult sample = { bOk: false, vError: 'not ready' }
2) Ok = { bOk: true, vValue: 255n } / Err = { bOk: false, vError: 'bad input' }
3) 0xFF → value 255
3) 0xZZ → error: "0xZZ" is not a hex number
4) ParseBin = bad char at 2 in "10201"
5) MapResult = { bOk: true, vValue: '0xFF' } / { bOk: false, vError: '"hello" is not a hex number' }
6) 3 inputs, 1 error(s) — nothing was thrown
```

## 6. Build it — a calculation history

**[JS + TS]**

A history that keeps the last N items of **any** type. When it is full, the oldest item drops out (a ring buffer). DevCalc will store its results in it. Full code: [history.ts](history.ts).

```ts
class CHistory<T> {
	readonly nCapacity: number;
	readonly #arrItem: T[] = [];

	constructor(nCapacity: number) {
		if (!Number.isInteger(nCapacity) || nCapacity < 1) {
			throw new RangeError(`capacity must be a positive integer, got ${nCapacity}`);
		}
		this.nCapacity = nCapacity;
	}

	Add(vItem: T): void {
		if (this.#arrItem.length === this.nCapacity) {
			this.#arrItem.shift();   // drop the oldest
		}
		this.#arrItem.push(vItem);
	}

	At(nIndex: number): T | undefined {
		return this.#arrItem.at(nIndex);   // 0 = oldest, -1 = newest
	}

	Find(fnTest: (vItem: T) => boolean): T | undefined { ... }   // newest first

	*[Symbol.iterator](): IterableIterator<T> {
		yield* this.#arrItem;   // for...of and [...spread]
	}
}
```

- `*[Symbol.iterator]` is a **generator** method (`function*` + `yield`, like C#'s `yield return`). It makes the object work with `for...of` — C#'s `IEnumerable<T>`.
- The callback in `Find` gets a `T`, so `oHistory.Find((oEntry) => oEntry.biValue > 100n)` knows `oEntry` is an `IEntry` without a type annotation.
- A bad capacity is a programmer mistake, not user input, so it **throws** (section 4's table).

```
> node lessons/05-generics/history.ts
6) count = 3 / capacity = 3 (the first entry dropped out)
   ans * 2    = 512
   0b1010     = 10
   ans << 4   = 160
   oldest = ans * 2 / newest = ans << 4
   first value > 100 from newest = ans << 4
   spread values = [ 512n, 10n, 160n ]
   Expected error: capacity must be a positive integer, got 0
   Why : a history that holds nothing makes no sense.
   Fix : pass 1 or more, e.g. new CHistory<string>(20).
```

## 7. DevCalc step — Evaluate, history and ans

New files:

| File | Contents |
|---|---|
| [devcalc/src/core/Result.ts](../../devcalc/src/core/Result.ts) | `TResult<T, E>`, `Ok`, `Err`, `MapResult` |
| [devcalc/src/core/History.ts](../../devcalc/src/core/History.ts) | `CHistory<T>` (section 6, plus `Clear`) |
| [devcalc/src/core/Evaluate.ts](../../devcalc/src/core/Evaluate.ts) | `Evaluate(strExpr, oWord?, biAns?)` → `TResult<IEvaluation, IEvalError>` |
| [devcalc/tests/History.test.ts](../../devcalc/tests/History.test.ts) | history order, capacity, Find, Result helpers |
| [devcalc/tests/Evaluate.test.ts](../../devcalc/tests/Evaluate.test.ts) | expressions, word size, `ans`, every error kind |

### Calculation moves out of main.ts

Until lesson 04, [main.ts](../../devcalc/src/main.ts) parsed, calculated **and** printed. That code now lives in `Evaluate()`, which **prints nothing and throws nothing for bad input**. It returns a result:

```ts
export interface IEvalError {
	readonly strTitle: string;   // Invalid input: "12a"
	readonly strWhy: string;
	readonly strFix: string;
}

export function Evaluate(strExpr: string, oWord?: CWordSize, biAns?: bigint): TResult<IEvaluation, IEvalError> {
	...
	try {
		const oResult = new CCalculator(oWord).Calculate(oA.vValue, strOp, oB.vValue);
		return Ok({ strExpr: strTrim, ...oResult });
	} catch (e) {
		if (e instanceof CCalcError) {
			return Err({ strTitle: `Cannot calculate: "${strTrim}"`, strWhy: e.message, strFix: e.strFix });
		}
		throw e;   // not ours : a bug
	}
}
```

`CCalculator` still throws `CCalcError` inside, and `Evaluate` turns it into a value at the boundary. main.ts only prints. In lesson 07 the web page calls the same `Evaluate()` and shows the result in HTML instead of `console.log`.

### `;` and `ans`

```ts
const oHistory = new CHistory<IEvaluation>(20);
...
const oResult = Evaluate(strOne, oWord, oHistory.Latest()?.biValue);   // ans = the previous result
if (oResult.bOk) {
	oHistory.Add(oResult.vValue);
}
```

Several expressions separated by `;` run in order. `ans` is the previous result. The first error stops the run (later expressions may depend on `ans`).

```
> node devcalc/src/main.ts "0x7F + 1; ans * 2; ans - 1" --bits=8
[1] 0x7F + 1
HEX : 0x80
DEC : 128
BIN : 0b1000_0000
INT : -128 (8-bit signed)

[2] ans * 2
HEX : 0x00
DEC : 0
BIN : 0b0000_0000
INT : 0 (8-bit signed)
Note: 256 does not fit in 8 bits (BYTE), so it wrapped to 0.

[3] ans - 1
HEX : 0xFF
DEC : 255
BIN : 0b1111_1111
INT : -1 (8-bit signed)

> node devcalc/src/main.ts "0xFF; ans << 8; ans | 0xFF"
[1] 0xFF
HEX : 0xFF
DEC : 255
BIN : 0b1111_1111

[2] ans << 8
HEX : 0xFF00
DEC : 65,280
BIN : 0b1111_1111_0000_0000

[3] ans | 0xFF
HEX : 0xFFFF
DEC : 65,535
BIN : 0b1111_1111_1111_1111

> node devcalc/src/main.ts "ans + 1"
Invalid input: "ans"
Why : there is no previous result yet
Fix : calculate something first, e.g. "0xFF + 1; ans * 2".
```

A single expression prints exactly what it printed in lesson 04 (no `[1]` header).

Tests:

```
> npm test
check-pairs : 30 pairs, 0 failed
✔ WordSize: ranges and wrapping
✔ Calculator: operators without a word size
✔ Calculator: word size wraps and reports overflow
✔ Calculator: errors
✔ Evaluate: one number and two-number expressions
✔ Evaluate: word size wraps and reports overflow
✔ Evaluate: ans is the previous result
✔ Evaluate: errors are returned, not thrown
✔ Format: 255
✔ Format: zero and negative
✔ GroupDigits
✔ Format options
✔ Format padding (nBits)
✔ History: keeps the last N items in order
✔ History: Find searches from the newest, Clear empties it
✔ History: capacity must be a positive integer
✔ Result: Ok, Err and MapResult
✔ Parse: decimal and sign
✔ Parse: prefixes and case
✔ Parse: _ separators
✔ Parse: invalid input
ℹ pass 21
```

The tests call `Evaluate()` directly — no process, no captured output. That is the other reason to keep calculation and printing apart.

## Summary

- `<T>` = "the caller's type". TS infers it. Write it only when inference can't, or to check arguments.
- `T extends X` limits T (structural, like `where T : X`). `K extends keyof T` + `T[K]` type a property by name.
- Defaults: `<T = string>`. `const T` keeps literal types.
- `Array<T>`, `Map<K, V>`, `Set<T>`, `Record<K, V>`, `ReadonlyArray<T>`, `ReadonlyMap<K, V>` cover most of C#'s collections.
- Generics are erased: one class at run time, no `new T()`, no `typeof(T)`.
- `TResult<T, E>` makes failure part of the type. Throw for bugs, return results for user input.
- A generator `*[Symbol.iterator]` makes a class work with `for...of`.

**Next → [06. Modules and Async](../06-modules-async/README.md)**: split code into modules, `import` / `export`, `Promise` and `async` / `await`, files and the clipboard. DevCalc gets an interactive mode (`--repl`) and `--copy`.

---

[← Previous: 04. Classes and Errors](../04-classes-errors/README.md) · [Contents](../../README.md) · [Next: 06. Modules and Async →](../06-modules-async/README.md)
