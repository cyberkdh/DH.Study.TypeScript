**English** · [한국어](README.ko.md)

[← Previous: 12. bigint and Fixed-Size Words](../12-bigint-words/README.md) · [Contents](../../README.md) · [Next: 14. DOM in Depth →](../14-events-accessibility/README.md)

# 13. Function Tables and Scope — Built-in Functions and Variables

> Series: DH.Study.TypeScript · Lesson 13 (Part 2)
> Environment: Node.js v24 · TypeScript 7 · Vitest 5 · VS Code

## Goals

After this lesson you can:

- [ ] Write overloads, and say what `.length`, "fewer parameters" and `void` callbacks mean for function types
- [ ] Type a table of functions with different numbers of arguments (a discriminated union under `satisfies`)
- [ ] Explain why a plain object is a risky dictionary (`toString`, `__proto__`, `in`) and when to use `Map`, `Object.hasOwn` or `ReadonlyMap`
- [ ] Predict block scope, hoisting, the temporal dead zone, closures in loops and shadowing
- [ ] Use DevCalc's built-in functions (`popcount(x)`, `rol(x, n)`, …) and variables (`mask = 0xFF00`)

## Contents

1. [Function types in depth](#1-function-types-in-depth)
2. [Map or object?](#2-map-or-object)
3. [Scope and closures](#3-scope-and-closures)
4. [Try it](#4-try-it)
5. [Build it — a tiny command runner](#5-build-it--a-tiny-command-runner)
6. [DevCalc step — Lv8 functions and variables](#6-devcalc-step--lv8-functions-and-variables)
7. [Summary](#summary)
8. [Where next](#where-next)

Example files for this lesson: [functions.ts](functions.ts) · [maps.ts](maps.ts) · [scope.ts](scope.ts) · [calls.ts](calls.ts)

> Each example has a Korean-comment twin (`x.ko.ts`) with the same code. The Korean lesson ([README.ko.md](README.ko.md)) uses those.

> Syntax tags: **[JS]** = JavaScript syntax (exists without TS) · **[TS]** = type syntax that TypeScript adds (erase it and you get JS) · details in [lesson 00, 7-3](../00-setup/README.md#7-3-ts-syntax--js-syntax--type-syntax)

Lesson 02 covered the basics of functions: declarations, arrow functions, optional and rest parameters, closures. A calculator that a developer keeps open all day needs a little more: functions with names (`popcount`, `rol`) that take different numbers of arguments, and variables that keep a mask or an address between lines. That is a table of functions, a place to keep names, and a clear idea of where each name lives. At the end:

```
> node devcalc/src/main.ts "mask = 0xFF00; 0x1234 & mask"
[1] mask = 0xFF00
HEX : 0xFF00
DEC : 65,280
BIN : 0b1111_1111_0000_0000

[2] 0x1234 & mask
HEX : 0x1200
DEC : 4,608
BIN : 0b1_0010_0000_0000
```

---

## 1. Function types in depth

### 1-1. Overloads

**[TS]** One function can offer several call shapes. List the shapes (no body), then write one body whose signature covers all of them:

```ts
function Describe(): string;                              // shape 1
function Describe(strName: string): string | undefined;  // shape 2
function Describe(strName?: string): string | undefined { // the body : callers don't see this line
	...
}
const strAll: string = Describe();   // shape 1 : string, no undefined check needed
const strOne = Describe("rol");      // shape 2 : string | undefined
```

The point is the return type: `Describe()` with no name always returns the list, so callers get `string`, not `string | undefined`. A single signature `(strName?: string): string | undefined` would make every caller check for `undefined` even when it can't happen.

For a call that matches no shape, TS reports against the closest one: `Describe(1, 2)` → TS2554 `Expected 0-1 arguments, but got 2`, and `Describe(42)` → TS2345 (42 is not a `string`).

> Overloads are erased like every type: JavaScript sees one function. Prefer a union or an optional parameter when the return type does not change; use overloads when it does.

### 1-2. Arity and `.length`

**[JS]** A function's `.length` is the number of parameters before the first default or rest parameter:

| Function | `.length` |
|---|---|
| `Rol(biX, biN)` | 2 |
| `Align(biX, biN = 16n)` | 1 |
| `Min(...arrValue)` | 0 |

So `.length` can't tell you "takes 2 or more". DevCalc's table writes the arity down instead: `nMinArgs` and `nMaxArgs` (`Infinity` for `min` and `max`).

### 1-3. Fewer parameters are fine

**[TS]** A function with fewer parameters can be used where more are passed. The extra arguments are ignored, which is why `arr.forEach((x) => …)` works although `forEach` passes three:

```ts
type TVisit = (biValue: bigint, nIndex: number, arrAll: readonly bigint[]) => void;
const fnPrint: TVisit = (biValue) => console.log(biValue); // OK
```

The other way round is an error: a function that needs two arguments can't be used where only one is passed (TS2322).

### 1-4. `void` callbacks

**[TS]** A callback typed `=> void` may still return something; the caller promises to ignore it. `[3n, 4n].forEach((biValue) => arrSeen.push(biValue))` compiles although `push` returns a number.

### 1-5. A table of functions with different arity

This is the shape of DevCalc's function table: one row per function, and each row's `fnApply` takes a different number of arguments. A discriminated union gives each row its parameter types:

```ts
interface IUnary  { readonly nArgs: 1; readonly fnApply: (biX: bigint) => bigint; }
interface IBinary { readonly nArgs: 2; readonly fnApply: (biX: bigint, biN: bigint) => bigint; }

const TABLE = {
	neg: { nArgs: 1, fnApply: (biX) => -biX },          // biX : bigint
	shl: { nArgs: 2, fnApply: (biX, biN) => biX << biN }, // biX, biN : bigint
} satisfies Record<string, IUnary | IBinary>;
```

`satisfies` (lesson 12) checks each row against the union, and `nArgs: 1` or `nArgs: 2` picks the member, so the arrow functions need no parameter types. Calling through the table, `oSpec.nArgs === 1` narrows `oSpec` to `IUnary`.

What TS can't check is the user: `shl(1)` typed into a calculator arrives as a list with one value. Check the count before calling. [functions.ts](functions.ts) section 6 shows what happens without the check: `1n << undefined` throws `TypeError: Cannot mix BigInt and other types`.

---

## 2. Map or object?

### 2-1. A plain object already has keys

**[JS]** `{}` inherits from `Object.prototype`, so it already "has" `toString`, `constructor`, `hasOwnProperty`, … Counting words with an object:

```ts
const oCount: Record<string, number> = {};
oCount[strWord] = (oCount[strWord] ?? 0) + 1;
```

For `"constructor"`, `oCount["constructor"]` is the `Object` function, not `undefined`, so `?? 0` does nothing and `function + 1` becomes the text `"function Object() { [native code] }1"`.

### 2-2. `in` and `Object.hasOwn`

**[JS]** `"toString" in oVar` is `true` for any object — `in` looks up the prototype chain. `Object.hasOwn(oVar, "toString")` looks at the object's own keys and says `false`. DevCalc's `IsFunction` uses `Object.hasOwn`, so `toString(1)` is "not a function".

### 2-3. `__proto__` and `Object.create(null)`

**[JS]** `oNames["__proto__"] = 5` does not add a key: `__proto__` is a setter that changes the prototype (and a number is silently ignored). `Object.create(null)` makes an object with no prototype, where `toString` and `__proto__` are ordinary keys — safer, but still string keys only, and easy to forget.

### 2-4. Map

**[JS]** A `Map` was made for this:

| | Object `{}` | `Map` |
|---|---|---|
| Keys | strings (and symbols) | anything |
| Built-in keys | `toString`, `constructor`, `__proto__`, … | none |
| Size | `Object.keys(o).length` | `map.size` |
| Order | integer-like keys first, then insertion order | insertion order |
| Missing key | `undefined` (unless the prototype has it) | `undefined` |
| JSON | `JSON.stringify` works | needs `[...map]` or `Object.fromEntries` |

Setting an existing key replaces the value and keeps its position — `vars` in DevCalc lists variables in the order they were first set.

### 2-5. `get()` may be `undefined`, and `ReadonlyMap`

**[TS]** `Map<string, bigint>.get()` returns `bigint | undefined`. Use it without a check and TS stops you (TS18048 `'biMask' is possibly 'undefined'`). The non-null assertion `!` turns the check off — and a misspelled name then fails at run time ([maps.ts](maps.ts) section 8).

`ReadonlyMap<K, V>` is a `Map` type without `set`, `delete` and `clear`. A function that takes a `ReadonlyMap` promises not to change it; `Evaluate` in DevCalc does exactly that.

Keys are compared with `===`, so `"Mask"` and `"mask"` are two keys. Normalize once where names come in (DevCalc: lower case in the parser).

---

## 3. Scope and closures

### 3-1. Block scope

**[JS]** `let` and `const` live in the `{ }` block that declares them. Outside, the name does not exist (TS2304 `Cannot find name`). Lesson 01 showed that `var` ignores blocks; section 3-4 shows where that hurts.

### 3-2. Hoisting and the temporal dead zone

**[JS]** A `function` declaration is hoisted: it can be called above its line. A `const` (or `let`) exists from the start of its block too, but has no value until its line runs. Reading it before that is a `ReferenceError` — the **temporal dead zone**.

```ts
console.log(Twice(21));        // OK : function declaration
console.log(Half(42));         // TS2448 : Block-scoped variable 'Half' used before its declaration
const Half = (nValue: number): number => nValue / 2;
```

TS catches this only in straight-line code. Inside a function, TS can't know when the function will be called:

```ts
function ReadMax(): number {
	return MAX_LEVEL;          // no error from TS
}
ReadMax();                     // ReferenceError: Cannot access 'MAX_LEVEL' before initialization
const MAX_LEVEL = 100;
```

Keep constants at the top of a file, above the code that runs.

### 3-3. Definite assignment

**[TS]** `let strMode: string;` without a value must be assigned on every path before it is read. If only an `if` assigns it, reading it is TS2454 `Variable 'strMode' is used before being assigned`.

### 3-4. Closures in a loop

**[JS]** A closure keeps the variable, not its value at the time. `var` makes one variable for the whole loop; `let` makes a new one for each round:

```ts
for (var nOld = 0; nOld < 3; nOld++) arrVar.push(() => nOld); // 3 3 3
for (let nNew = 0; nNew < 3; nNew++) arrLet.push(() => nNew); // 0 1 2
```

This classic bug shows up with event handlers made in a loop — lesson 14 makes one button per bit in a loop.

### 3-5. Private state

**[JS]** A closure is the oldest way to keep state private. Nothing outside `MakeCounter` can reach `nCount`; only `Next` and `Reset` can, and each call to `MakeCounter` gets its own:

```ts
function MakeCounter(nStart: number): { Next: () => number; Reset: () => void } {
	let nCount = nStart;
	return { Next: () => nCount++, Reset: () => { nCount = nStart; } };
}
```

Lesson 04's `#private` fields do the same inside a class.

### 3-6. Shadowing

**[JS]** An inner declaration with the same name hides the outer one inside its block. It is legal, and a common source of "but I changed it!" bugs. Prefer different names.

---

## 4. Try it

### [functions.ts](functions.ts) — overloads, .length, fewer parameters, void callbacks, a typed table

```
> node lessons/13-functions-scope/functions.ts
1) Describe() = "rol ror" · Describe("rol") = "rotate left" · Describe("xyz") = undefined
2) Rol.length = 2 · Align.length = 1 · Min.length = 0
3) visit 1
3) visit 2
4) seen = 3, 4
5) neg(5) = -5 · shl(1, 4) = 16
6) Expected error: TypeError: Cannot mix BigInt and other types, use explicit conversions
   Why : shl(1) was called with one argument, so biN is undefined, and 1n << undefined mixes a bigint with undefined.
   Fix : check the count first, the way Call() does above (DevCalc : CheckArgCount).
```

Things to try:

- Remove the `//` in front of `Describe(1, 2);` → TS2554, and in front of `Describe(42);` → TS2345.
- Remove the `//` in front of `Rol(1n);` → TS2554 `Expected 2 arguments, but got 1`.
- Remove the `//` in front of `const fnTooMany …` → TS2322: a function that needs two arguments doesn't fit a type that passes one.
- Delete the two overload lines above `Describe`'s body → `const strAll: string = Describe();` becomes TS2322, because the only signature left returns `string | undefined`.

### [maps.ts](maps.ts) — prototype keys, in vs hasOwn, __proto__, Map, get() and undefined

```
> node lessons/13-functions-scope/maps.ts
1) mask = 2 · constructor = string "function Object()…"
2) "toString" in oVar : true · Object.hasOwn(oVar, "toString") : false
3) after oNames["__proto__"] = 5 : keys = []
4) bare object keys = [toString, __proto__]
5) size = 3 · keys = [mask, toString, __proto__] · mask = 0xf0
6) mask + 1 = 0xf1 · x ?? 0 = 0
7) "Mask" → 255 · 3 names · ReadonlyMap blocks set : see below
7) mapRead has mask : true
8) Expected error: TypeError: Cannot read properties of undefined (reading 'toString')
   Why : "maks" is misspelled, so get() returned undefined, and ! hid that from TS.
   Fix : check for undefined (or use ?? with a default) and tell the user which name is missing.
```

Things to try:

- Remove the `//` in front of `const biBad: bigint = …` → TS2322, and in front of `console.log(biMask + 1n);` → TS18048.
- Remove the `//` in front of `mapRead.set("x", 1n);` → TS2339: a `ReadonlyMap` has no `set`.
- In section 1, replace `Record<string, number>` and `{}` with a `Map` and `get`/`set` → `constructor` is counted as 1 like any other word.

### [scope.ts](scope.ts) — block scope, hoisting, definite assignment, loop closures, private state, shadowing

```
> node lessons/13-functions-scope/scope.ts
1) only in this block
2) Twice(21) = 42
2) Half(42) = 21
3) mode = wide
4) var : 3 3 3 · let : 0 1 2
5) 1 2 3 · other 100
5) after Reset : 1
6) 7 <= 5 : false · the outer nLimit is still 10
7) Expected error: ReferenceError: Cannot access 'MAX_LEVEL' before initialization
   Why : ReadMax() ran before the line const MAX_LEVEL = 100; the name exists, but it has no value yet (temporal dead zone).
   Fix : declare constants at the top of the file, above the code that calls functions using them.
```

Things to try:

- Remove the `//` in front of `console.log(strInside);` → TS2304, in front of `console.log(Half(42));` → TS2448, and in front of `console.log(strMode);` → TS2454.
- Move `const MAX_LEVEL = 100;` above `function ReadMax` → section 7 prints 100.
- Change `var nOld` to `let nOld` → both lists print `0 1 2`.

---

## 5. Build it — a tiny command runner

[calls.ts](calls.ts) is DevCalc's new feature in 100 lines, without a parser: a function table with argument counts, variables in a `Map`, and an overloaded `Help`.

```ts
interface IFunctionSpec {
	readonly strUsage: string;
	readonly nMinArgs: number;
	readonly nMaxArgs: number; // Infinity : any number
	readonly fnApply: (...arrArg: bigint[]) => bigint;
}

const FUNCTIONS = {
	popcount: { strUsage: "popcount(x)", nMinArgs: 1, nMaxArgs: 1, fnApply: (biX) => … },
	rol8: { strUsage: "rol8(x, n)", nMinArgs: 2, nMaxArgs: 2, fnApply: (biX, biN) => … },
	max: { strUsage: "max(a, b, ...)", nMinArgs: 2, nMaxArgs: Infinity, fnApply: (...arrArg) => … },
} satisfies Record<string, IFunctionSpec>;

function IsFunction(strName: string): strName is TFunction {
	return Object.hasOwn(FUNCTIONS, strName); // not "in" : toString is not a function here
}
```

- One table holds everything a function needs: usage text for help and errors, the argument range, and the code.
- `IsFunction` is a type guard (lesson 03) that also avoids section 2's prototype trap.
- An assignment computes the right side first; if that throws, the variable is not set.

### Run it

```
> node lessons/13-functions-scope/calls.ts
help              → functions: popcount rol8 max
help rol8         → rol8(x, n)
x = 0xF0          → x = 0xf0
popcount(x)       → 0x4
rol8(X, 4)        → 0xf
max(x, 3, 0x100)  → 0x100
y = rol8(x, 1)    → y = 0xe1
rol8(1)           → error : rol8(x, n) takes 2 arguments, found 1
toString(1)       → error : "toString" is not a function (functions: popcount rol8 max)
z                 → error : "z" has no value yet (variables: x, y)
variables : x = 0xf0, y = 0xe1
```

Things to try:

- Add a row `bit: { strUsage: "bit(n)", nMinArgs: 1, nMaxArgs: 1, fnApply: (biN) => 1n << biN }` → `help` lists it, and `bit(4)` works without any other change.
- Remove the `//` in front of `Help(1);` → TS2345.
- Change `Object.hasOwn(FUNCTIONS, strName)` to `strName in FUNCTIONS` → `toString(1)` gets past the check and fails later with a less helpful message.

---

## 6. DevCalc step — Lv8 functions and variables

### What changed

| File | Change |
|---|---|
| `devcalc/src/core/Functions.ts` | new: `FUNCTION_TABLE` (12 functions), `IsFunction`, `CheckArgCount`, `FunctionUsage`, `CallFunction`, `FunctionHelp` (overloads) |
| `devcalc/src/core/Lexer.ts` | every name is a `name` token (not only `ans`); new `assign` (`=`) and `comma` (`,`) tokens |
| `devcalc/src/core/Parser.ts` | `statement = [ name "=" ] expression`; new nodes `variable`, `call`, `assign`; `CParseError` carries its own fix |
| `devcalc/src/core/Evaluate.ts` | `IWalkContext` (one object instead of many parameters); calls; variables from a `ReadonlyMap`; an assignment returns `strAssign` |
| `devcalc/src/core/index.ts` | exports the function helpers |
| `devcalc/src/main.ts` | `mapVar` keeps the variables; REPL `vars` and `help <function>`; usage and help list the functions |
| `devcalc/web/App.ts`, `index.html` | the page keeps variables too; title `Lv8` |
| `devcalc/tests/Functions.test.ts` | new |
| `devcalc/tests/Parser.test.ts`, `Evaluate.test.ts`, `Cli.test.ts` | calls, names, variables, the REPL |

### The function table

```
abs min max bit popcount clz ctz log2 bswap rol ror align
```

Each row is either an `IWordFunction` (`bNeedsWord: true`: `clz`, `bswap`, `rol`, `ror` only make sense in a fixed word) or an `IAnyFunction`. The rows are checked with `satisfies Record<string, TFunctionSpec>`, so `bNeedsWord: true` gives that row's `fnApply` an `oWord: CWordSize` that is never `undefined`:

```ts
rol: {
	strUsage: "rol(x, n)",
	strHelp: "rotate left by n bits",
	nMinArgs: 2,
	nMaxArgs: 2,
	bNeedsWord: true,
	fnApply: (oWord, biX, biN) => Rotate(oWord, biX, biN), // oWord : CWordSize
},
```

`CallFunction` checks the count, wraps the arguments to the word, and — for a `bNeedsWord` row without a word size — throws the error you saw at the start of this lesson. Narrowing on `oSpec.bNeedsWord` is what lets it call `fnApply(oWord, …)` with the right type.

`FunctionHelp` has two overloads, like section 1-1's `Describe`: `FunctionHelp()` returns every name (a `string`), `FunctionHelp("rol")` returns one line or `undefined`.

### Names : `ans`, variables and functions

The lexer no longer decides what a name is; it emits `name` tokens. The parser decides by what comes next:

| Text | Node |
|---|---|
| `ans` | `ans` (as before) |
| `popcount(` … `)` | `call` — the name must be in the table, and the argument count must fit |
| `mask` | `variable` |
| `mask =` at the start | `assign` |

Names ignore case (`POPCOUNT(MASK)` works); the parser stores them in lower case — section 2-5's "normalize at the door". `ans` and function names can't be assigned.

### Evaluate reads, the caller keeps

```ts
export function Evaluate(strExpr: string, oWord?: CWordSize, biAns?: bigint, mapVar: ReadonlyMap<string, bigint> = new Map()): TEvalResult
```

`Evaluate` takes the variables as a `ReadonlyMap` and never changes them. For `mask = 0xFF00` it returns the value with `strAssign: "mask"`, and `main.ts` (or the web page) does the `set`. One `Map` lives in each program for as long as it runs; tests pass their own small one.

Inside, every step of the tree walk needs the calculator, the word size, `ans` and the variables. Instead of four parameters on every recursive call, they travel in one `IWalkContext` object.

### New output

```
> node devcalc/src/main.ts "rol(0x81, 1)" --bits=8
HEX : 0x03
DEC : 3
BIN : 0b0000_0011
INT : 3 (8-bit signed)

> node devcalc/src/main.ts "max(3, 0x10, 7) + clz(1)" --bits=32
HEX : 0x0000_002F
DEC : 47
BIN : 0b0000_0000_0000_0000_0000_0000_0010_1111
INT : 47 (32-bit signed)

> node devcalc/src/main.ts "bswap(0x12345678)" --bits=32
HEX : 0x7856_3412
DEC : 2,018,915,346
BIN : 0b0111_1000_0101_0110_0011_0100_0001_0010
INT : 2,018,915,346 (32-bit signed)
```

A function result that does not fit is an overflow like any other:

```
> node devcalc/src/main.ts "align(250, 16)" --bits=8
HEX : 0x00
DEC : 0
BIN : 0b0000_0000
INT : 0 (8-bit signed)
Note: 256 does not fit in 8 bits (BYTE), so it wrapped to 0.
```

Every mistake still comes with Why and Fix:

```
> node devcalc/src/main.ts "rol(0x81, 1)"
Cannot calculate: "rol(0x81, 1)"
Why : rol(x, n) needs a word size
Fix : choose a word size (--bits=8|16|32|64|128).

> node devcalc/src/main.ts "rol(1)" --bits=8
Invalid expression: "rol(1)"
Why : rol(x, n) takes 2 arguments, found 1 (column 1)
Fix : e.g. rol(x, n).

> node devcalc/src/main.ts "toString(1)"
Invalid expression: "toString(1)"
Why : "toString" at column 1 is not a function
Fix : functions: abs min max bit popcount clz ctz log2 bswap rol ror align

> node devcalc/src/main.ts "x + 1"
Invalid input: "x"
Why : "x" is not a number, and no variable has that name yet
Fix : assign it first, e.g. "x = 0xFF; x + 1". Functions: abs min max bit popcount clz ctz log2 bswap rol ror align

> node devcalc/src/main.ts "ans = 5"
Invalid expression: "ans = 5"
Why : cannot assign to "ans" : ans is the previous result
Fix : choose another name, e.g. "mask = 0xFF00".
```

In the REPL, variables live until `exit`:

```
> node devcalc/src/main.ts --repl --bits=16
DevCalc REPL : type "help" for commands, "exit" to quit (16-bit)
devcalc> help rol
rol(x, n)      rotate left by n bits (needs a word size)
devcalc> vars
(no variables yet : "mask = 0xFF00")
devcalc> mask = 0xFF00
HEX : 0xFF00
DEC : 65,280
BIN : 0b1111_1111_0000_0000
INT : -256 (16-bit signed)
devcalc> low = mask >>> 8
HEX : 0x00FF
DEC : 255
BIN : 0b0000_0000_1111_1111
INT : 255 (16-bit signed)
devcalc> vars
mask = 0xFF00
low = 0x00FF
devcalc> POPCOUNT(MASK)
HEX : 0x0008
DEC : 8
BIN : 0b0000_0000_0000_1000
INT : 8 (16-bit signed)
devcalc> exit
```

> Why `>>>`? In a 16-bit word `0xFF00` is negative (INT -256), and `>>` keeps the sign (lesson 11): `mask >> 8` is `0xFFFF`. `>>>` shifts in zeros.

### Checked

```
> npm test
check-pairs : 62 pairs, 0 failed
check-names : 34 files, 0 problems

 Test Files  12 passed (12)
      Tests  77 passed (77)
```

```ts
test("Evaluate: functions and variables (lesson 13)", () => {
	const mapVar = new Map([["mask", 0xff00n]]);
	assert.equal(ValueOf(Evaluate("0x1234 & mask", undefined, undefined, mapVar)), 0x1200n);
	assert.equal(ValueOf(Evaluate("MASK >> 8", undefined, undefined, mapVar)), 0xffn); // names ignore case
	...
	// Evaluate only reads the map : the assignment comes back, and the caller keeps it
	const oResult = Evaluate("x = mask | 1", undefined, undefined, mapVar);
	assert.ok(oResult.bOk);
	assert.equal(oResult.vValue.strAssign, "x");
	assert.equal(mapVar.has("x"), false);
});
```

Things to try:

- Add a row to `FUNCTION_TABLE` (for example `parity(x)`: `popcount(x) & 1`) → the parser, `help` and the error messages know it at once.
- Change one row's `bNeedsWord` from `true` to `false` → its `fnApply` no longer compiles, because `oWord` may now be `undefined`.
- In the web page (`npm run web`), type `mask = 0xFF00`, then `mask >>> 4`.

---

## Summary

- **[TS]** Overloads give callers different return types for different call shapes. A function with fewer parameters fits a type that passes more; a `void` callback may return a value.
- **[TS]** A table of functions with different arity is a discriminated union under `satisfies`: each row's parameters get their types from the member it matches. The user's argument count still has to be checked at run time.
- **[JS]** A plain object inherits `toString`, `constructor` and `__proto__`; `in` sees them, `Object.hasOwn` doesn't. For names chosen by users, use a `Map`. **[TS]** `get()` is `T | undefined`; `ReadonlyMap` promises not to change it.
- **[JS]** `let`/`const` are block-scoped and in the temporal dead zone until their line runs; function declarations are hoisted. A closure keeps the variable: `var` in a loop is one variable, `let` is one per round.
- DevCalc Lv8: 12 built-in functions from one table, variables (`mask = 0xFF00`, `vars`), `help rol`. `Evaluate` reads a `ReadonlyMap` and returns `strAssign`; the caller keeps the variables.

## Where next

[Lesson 14](../14-events-accessibility/README.md) goes back to the web page: event delegation for a clickable bit grid, the keyboard (Enter, Esc, arrow keys), focus, and accessibility with `aria-*`.

---

[← Previous: 12. bigint and Fixed-Size Words](../12-bigint-words/README.md) · [Contents](../../README.md) · [Next: 14. DOM in Depth →](../14-events-accessibility/README.md)
