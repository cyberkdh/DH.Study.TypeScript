**English** · [한국어](README.ko.md)

[← Previous: 07. Browser and DOM](../07-browser-dom/README.md) · [Contents](../../README.md) · [Next: 09. Testing and Tooling →](../09-testing-tooling/README.md)

# 08. Advanced Types — Utility, Mapped, Conditional and Template Literal Types

> Series: DH.Study.TypeScript · Lesson 08
> Environment: Node.js v24 · TypeScript 7 · VS Code

## Goals

After this lesson you can:

- [ ] Use the built-in utility types : `Partial`, `Required`, `Readonly`, `Pick`, `Omit`, `Record`, `ReturnType`, `Parameters`, `Awaited`, `Exclude`, `Extract`, `NonNullable`
- [ ] Write a mapped type (`{ [K in keyof T]: ... }`), change its modifiers, and rename or drop keys with `as`
- [ ] Write a conditional type, explain why it splits a union, and take a part out of a type with `infer`
- [ ] Describe string shapes with template literal types, and choose between an annotation, `satisfies` and `as`
- [ ] Build a typed event emitter, and make DevCalc's operators one typed table

## Contents

1. [Utility types](#1-utility-types)
2. [Mapped types](#2-mapped-types)
3. [Conditional types](#3-conditional-types)
4. [Template literal types and satisfies](#4-template-literal-types-and-satisfies)
5. [Try it](#5-try-it)
6. [Build it — a typed event emitter](#6-build-it--a-typed-event-emitter)
7. [DevCalc step — the operator table](#7-devcalc-step--the-operator-table)
8. [Summary](#summary)

Example files for this lesson: [utility.ts](utility.ts) · [mapped.ts](mapped.ts) · [conditional.ts](conditional.ts) · [literal.ts](literal.ts) · [emitter.ts](emitter.ts)

> Each example has a Korean-comment twin (`x.ko.ts`) with the same code. The Korean lesson ([README.ko.md](README.ko.md)) uses those.

> Syntax tags: **[JS]** = JavaScript syntax (exists without TS) · **[TS]** = type syntax that TypeScript adds (erase it and you get JS) · details in [lesson 00, 7-3](../00-setup/README.md#7-3-ts-syntax--js-syntax--type-syntax)

This whole lesson is about **[TS]**: types made from other types. All of it is erased before the code runs, so nothing here costs anything at run time. It also cannot check anything at run time — section 4-2 and the `Expected error:` lines show where you still need a real check.

`keyof`, `typeof` (in a type) and `K extends keyof T` were already used in lessons 03 and 05. Here they become the building blocks.

---

## 1. Utility types

TypeScript ships generic types that turn one type into another. You don't import them; they are always there.

```ts
interface IRegister {
	readonly strName: string;
	nValue: number;
	strNote?: string;
}
```

### 1-1. Partial, Required, Readonly

| Type | Result | Typical use |
|---|---|---|
| `Partial<T>` | every property optional | "change only these fields" |
| `Required<T>` | every `?` removed | after defaults are filled in |
| `Readonly<T>` | every property `readonly` | values that must not change |

```ts
function UpdateRegister(oRegister: IRegister, oChange: Partial<IRegister>): IRegister {
	return { ...oRegister, ...oChange };
}
UpdateRegister(AX, { nValue: 0xff });   // OK
UpdateRegister(AX, { nValu: 1 });       // TS2561 : a typo is still caught
```

`Readonly<T>` is checked by TS only. `Object.freeze` stops the change at run time too — and a cast that hides `readonly` from TS then fails with a `TypeError` (ES modules run in strict mode):

```
3) Readonly : 1 / Expected error: TypeError
   Why : Object.freeze stops changes at run time. Readonly<T> alone only stops them in the editor.
   Fix : don't cast readonly away. Make a changed copy instead : { ...oFrozen, nValue: 3 }
```

> **C#** : `Readonly<T>` is close to a type with only `get` / `init` properties, but C# enforces it at run time too. C# has no `Partial<T>` — you write a separate DTO or use nullable fields.

### 1-2. Pick, Omit, Record

```ts
type TRegisterValue = Pick<IRegister, "strName" | "nValue">; // keep these keys
type TNewRegister = Omit<IRegister, "strName">;              // drop this key

type EWordName = "BYTE" | "WORD" | "DWORD" | "QWORD";
const WORD_BITS: Record<EWordName, number> = { BYTE: 8, WORD: 16, DWORD: 32, QWORD: 64 };
```

With a union as the key type, `Record` needs **every** key. Leave out two and you get TS2739. That is the difference from C#'s `Dictionary<TKey, TValue>`, where any key may be missing.

### 1-3. Types from functions

```ts
function ParseHex(strText: string, bStrict = true): { bOk: boolean; nValue: number } { ... }
async function LoadValue(): Promise<bigint> { ... }

type TParseResult = ReturnType<typeof ParseHex>;           // { bOk: boolean; nValue: number }
type TParseArgs = Parameters<typeof ParseHex>;             // [strText: string, bStrict?: boolean]
type TLoaded = Awaited<ReturnType<typeof LoadValue>>;      // bigint
```

`typeof ParseHex` (in a type position) is the function's type. These are useful when a library gives you a function but not a name for its result type.

### 1-4. Filtering unions

```ts
type EOperator = "+" | "-" | "&" | "|" | "<<" | ">>";
type EBitOperator = Extract<EOperator, "&" | "|" | "<<" | ">>">; // keep these
type EMathOperator = Exclude<EOperator, EBitOperator>;            // "+" | "-"
type TText = NonNullable<string | null | undefined>;              // string
```

---

## 2. Mapped types

A mapped type goes through a list of keys and makes one property for each. Every type in section 1-1 is a mapped type.

### 2-1. The syntax

```ts
type TMyPartial<T> = { [K in keyof T]?: T[K] };
//                     ─┬─────────── ┬  ──┬─
//                      │            │    └ the value type : T[K] = the same as before
//                      │            └ ? = make it optional
//                      └ for each key K of T
```

Read `[K in keyof T]` like a `for` loop over the keys, at the type level.

### 2-2. Modifiers: + and -

```ts
type TFrozen<T> = { readonly [K in keyof T]: T[K] };            // add readonly
type TComplete<T> = { -readonly [K in keyof T]-?: T[K] };       // remove readonly and ?
```

The value type can change too. Here every setting gets a check function **for its own type**:

```ts
type TValidators<T> = { [K in keyof T]: (vValue: T[K]) => string | undefined };

const VALIDATORS: TValidators<ISettings> = {
	nBits: (nValue) => ...,      // nValue : number
	bGroup: () => undefined,
	strPrefix: (strValue) => ..., // strValue : string
};
```

Add a setting to `ISettings` and `VALIDATORS` turns red (TS2741) until you write its check. The type keeps two places in step.

### 2-3. Renaming and dropping keys with as

```ts
// "nBits" → "GetNBits"
type TGetters<T> = { [K in keyof T as `Get${Capitalize<K & string>}`]: () => T[K] };

// keep only the keys whose value is V; "never" removes a key
type TOnlyOfType<T, V> = { [K in keyof T as T[K] extends V ? K : never]: T[K] };
type TFlagSettings = TOnlyOfType<ISettings, boolean>; // { bGroup: boolean }
```

`K & string` is needed because `keyof T` can also be `number` or `symbol`. The type shows names built at run time, but TS can't check the code that builds them, so `MakeGetters` has one `as` cast in one place.

> **C#** : C# has no mapped types. The same job is done with reflection (run time, no checks) or source generators (code is generated before the build). In TS it is just a type.

---

## 3. Conditional types

```ts
type TIsBig<T> = T extends bigint ? "bigint" : "not bigint";
```

Read it as "if `T` fits `bigint`, the type is `"bigint"`, otherwise `"not bigint"`". It looks like the `? :` operator, but it runs in the type checker.

### 3-1. The result follows the input

```ts
type TParsed<T extends string | number> = T extends string ? bigint : number;
function Widen<T extends string | number>(vValue: T): TParsed<T> { ... }

const biWide = Widen("0xff"); // bigint
const nWide = Widen(21);      // number
```

Inside the body TS can't check a conditional return type, so `Widen` needs one cast. The callers get exact types — that is the trade.

### 3-2. Unions are split

When `T` is a union, the condition runs once per member and the results are joined again (it is **distributive**):

```ts
type TNoBig<T> = T extends bigint ? never : T;
type TSmall = TNoBig<number | bigint | string>; // number | string
```

That is exactly how `Exclude<T, U>` is written. Put `T` in brackets to test the whole union at once: `[T] extends [string] ? ... : ...`.

### 3-3. infer: take a part out

```ts
type TElementOf<T> = T extends readonly (infer E)[] ? E : never;
type TUnwrap<T> = T extends Promise<infer V> ? TUnwrap<V> : T; // recursive

const WORDS = [8, 16, 32, 64] as const;
type TWord = TElementOf<typeof WORDS>;                // 8 | 16 | 32 | 64
type TDeep = TUnwrap<Promise<Promise<bigint>>>;       // bigint
```

`infer E` means "whatever is here, call it E". `ReturnType`, `Parameters` and `Awaited` from section 1-3 are all built this way.

> **C#** : there is nothing like this in C#. Generic constraints (`where T : struct`) only *limit* `T`; they can't compute a new type from it.

---

## 4. Template literal types and satisfies

### 4-1. String shapes

```ts
type THexText = `0x${string}`;               // any string that starts with "0x"
type EIntName = `${"i" | "u"}${8 | 16 | 32 | 64}`; // "i8" | "i16" | ... | "u64"
type EHandlerName = `On${Capitalize<"hex" | "dec">}`; // "OnHex" | "OnDec"
```

Unions inside a template make every combination. `Uppercase`, `Lowercase`, `Capitalize` and `Uncapitalize` are built in. `infer` works here too:

```ts
type TFlagName<T> = T extends `--${infer N}=${string}` ? N : never;
type TBits = TFlagName<"--bits=32">; // "bits"
```

Text from outside (a file, the command line, an input box) is just `string`. A type guard checks the shape at run time and narrows it:

```ts
function IsHexText(strText: string): strText is THexText {
	return /^0x[0-9a-f]+$/i.test(strText);
}
```

### 4-2. Annotation, satisfies, as

Three ways to give an object a type:

| | Checked? | The value's own type |
|---|---|---|
| `const X: T = { ... }` (annotation) | yes | lost : `X` is just `T` |
| `const X = { ... } satisfies T` | yes | kept : exact keys, literal values |
| `const X = { ... } as T` | **no** | `T`, whatever the value really is |

```ts
const SATISFIED = {
	"+": { strName: "add", nPrecedence: 4 },
	"-": { strName: "subtract", nPrecedence: 4 },
	"<<": { strName: "shift left", nPrecedence: 3 },
} as const satisfies Record<ECalcOperator, IOperatorInfo>;

const strExact: "shift left" = SATISFIED["<<"].strName; // OK : the literal is kept
```

`as` only refuses types that can't overlap at all (TS2352). A missing key passes, and you find out at run time:

```
6-2) as : Expected error: TypeError - Cannot read properties of undefined (reading 'strName')
     Why : 'as' tells TS to trust you, so the missing "<<" key was not checked.
     Fix : use satisfies (6-3) or an annotation (6-1); TS then reports the missing key.
```

> **C#** : a C# cast is checked at run time (`InvalidCastException`). A TS `as` is not checked at all — it is erased. Use it only where you checked the value yourself.

---

## 5. Try it

Open each file and press `F5`, or run it from the command line. If you can't run code, read the code alongside the output below.

### [utility.ts](utility.ts) — Partial, Required, Readonly, Pick / Omit, Record, ReturnType / Parameters / Awaited, Exclude / Extract

```
> node lessons/08-advanced-types/utility.ts
1) Partial  : {"strName":"AX","nValue":255}
2) Required : BASE REGISTER
3) Readonly : 1 / Expected error: TypeError
   Why : Object.freeze stops changes at run time. Readonly<T> alone only stops them in the editor.
   Fix : don't cast readonly away. Make a changed copy instead : { ...oFrozen, nValue: 3 }
4) Pick / Omit : strName,nValue / nValue
5) Record : BYTE=8 WORD=16 DWORD=32 QWORD=64
6) ReturnType / Parameters / Awaited : {"bOk":true,"nValue":255} 1 255n
7) Exclude / Extract / NonNullable : + - / never null
8) at run time oDocumented is just object with keys strName,nValue,strNote
```

Things to try: uncomment the five commented lines one at a time (TS2561, TS2741, TS2540, TS2739, TS2322). Hover `TParseArgs` and `TLoaded`.

### [mapped.ts](mapped.ts) — key loops, modifiers, typed validators, renaming and dropping keys

```
> node lessons/08-advanced-types/mapped.ts
1) TMyPartial : {"nBits":8,"bGroup":true,"strPrefix":"0x"}
2) modifiers : 32 3
3) DEFAULTS problems = 0
   Expected error: nBits : use 8, 16, 32 or 64
   Expected error: strPrefix : use at most 2 characters
   Why : each check got its own value type from TValidators<ISettings>, so the rules are typed.
   Fix : use one of the allowed values (nBits 8/16/32/64, strPrefix with 2 characters or less)
4) getters : GetNBits, GetBGroup, GetStrPrefix / GetNBits() = 32
5) only booleans : {"bGroup":false}
6) union keys : {"HEX":"ff","DEC":"255","BIN":"11111111"}
```

Things to try: add `bLower: boolean` to `ISettings` and watch `VALIDATORS` turn red (TS2741). Hover `oGetters.` to see the generated names.

### [conditional.ts](conditional.ts) — extends ? :, distributive unions, [T], infer

```
> node lessons/08-advanced-types/conditional.ts
1) TIsBig : bigint / not bigint
2) Widen : 255n bigint / 42 number
3) distributive : 1, one (this is how Exclude<T, U> is written)
4) [T] : boolean false
5) infer : 16 7n 65536n
6) TMyReturn : 16n
7) run time : bigint / not bigint
```

Things to try: hover `biWide` and `nWide`. Write `TLastOf<T>` with `T extends readonly [...unknown[], infer L] ? L : never`.

### [literal.ts](literal.ts) — `0x${string}`, combinations, Capitalize, type guard, annotation / as / satisfies

```
> node lessons/08-advanced-types/literal.ts
1) pattern : 0xFF 255n
2) combinations : i8 u16 i32 u64
3) built-in : HEX --show-bin OnDec
4) guard : 0x1F → 31n
4) guard : Expected error: "1F" is not a hex text
   Why : the type guard IsHexText checks the pattern at run time; the type alone can't.
   Fix : write the 0x prefix, e.g. 0x1F
5) infer in a template : bits
6-1) annotation : add
6-2) as : Expected error: TypeError - Cannot read properties of undefined (reading 'strName')
     Why : 'as' tells TS to trust you, so the missing "<<" key was not checked.
     Fix : use satisfies (6-3) or an annotation (6-1); TS then reports the missing key.
6-3) satisfies : shift left / keys : + - <<
```

Things to try: remove the `"<<"` row from `SATISFIED` (TS2741). Hover `ANNOTATED["<<"].strName` and `SATISFIED["<<"].strName` and compare.

---

## 6. Build it — a typed event emitter

[emitter.ts](emitter.ts): one type lists the events and their arguments. `On` and `Emit` accept only those names, and each listener gets typed parameters without any annotation.

```ts
type TEventMap = Record<string, unknown[]>;
type TListener<A extends unknown[]> = (...arrArg: A) => void;
type TListeners<TEvents extends TEventMap> = { [K in keyof TEvents]?: Set<TListener<TEvents[K]>> }; // mapped type

class CEmitter<TEvents extends TEventMap> {
	#oListeners: TListeners<TEvents> = {};

	On<K extends keyof TEvents>(eName: K, fnListener: TListener<TEvents[K]>): () => void { ... } // returns unsubscribe
	Emit<K extends keyof TEvents>(eName: K, ...arrArg: TEvents[K]): number { ... }
}

type TCalcEvents = {
	evaluated: [strExpr: string, biValue: bigint];
	error: [strTitle: string, strWhy: string, strFix: string];
	cleared: [];
};

const oEmitter = new CEmitter<TCalcEvents>();
oEmitter.On("evaluated", (strExpr, biValue) => { ... }); // strExpr : string, biValue : bigint
```

`...arrArg: TEvents[K]` turns a tuple into a parameter list, so a wrong count is TS2554 and a wrong type is TS2345:

```ts
oEmitter.Emit("evaluated", "1 + 1");    // TS2554 : Expected 3 arguments, but got 2
oEmitter.Emit("evaluated", "1 + 1", 2); // TS2345 : 'number' is not assignable to 'bigint'
oEmitter.On("evaluate", () => {});      // TS2345 : '"evaluate"' is not assignable to 'keyof TCalcEvents'
```

**Why `type`, not `interface`, for the event map?** `TEvents extends Record<string, unknown[]>` asks for an index signature. A type alias of an object literal gets one implicitly; an interface does not, because an interface can be extended later by declaration merging. So `CEmitter<ICalcEvents>` is TS2344. `Pick<ICalcEvents, keyof ICalcEvents>` turns it into a mapped type, which fits.

```
> node lessons/08-advanced-types/emitter.ts
1) two listeners on evaluated :
   0xFF + 1 = 256 (0x100)
   1 << 8 = 256 (0x100)
2) error event :
   Expected error: cannot read "0xFF * 2"
   Why : only 'a + b' and 'a << b' are supported
   Fix : write it like 0xFF + 1
   Expected error: SyntaxError
   Why : Cannot convert 0xZZ to a BigInt
   Fix : use numbers like 255, 0xFF or 0b1010
3) history : 0xFF + 1 | 1 << 8
4) after unsubscribe : nothing printed, history = 3
5) Emit(cleared) called 1 listener, history = 0
7) interface via Pick : 0 listeners
```

> **C#** : C# has `event EventHandler<TArgs>` — one field per event, and the compiler checks the arguments. `CEmitter<TEvents>` gets the same checking from one type, with no field per event. Node's own `EventEmitter` from `node:events` can be typed the same way: `new EventEmitter<TCalcEvents>()`.

Things to try: add `copied: [strText: string]` to `TCalcEvents` and listen to it. Make `Once(eName, fnListener)` that unsubscribes itself after the first call.

---

## 7. DevCalc step — the operator table

Until now an operator was in three places: the `OPERATORS` list, the `switch` in `#Apply`, and the zero / shift checks in the `case`s. Now one table describes each operator, and the type comes from the table.

Changed files:

| File | Change |
|---|---|
| [devcalc/src/core/Calculator.ts](../../devcalc/src/core/Calculator.ts) | `OPERATOR_TABLE` with `satisfies`, `TOperator = keyof typeof OPERATOR_TABLE`, `OperatorName` |
| [devcalc/src/core/index.ts](../../devcalc/src/core/index.ts) | exports `OperatorName` |
| [devcalc/src/main.ts](../../devcalc/src/main.ts) | typed switches : `TSwitch`, `` TBitsFlag = `--bits=${TWordBits}` ``, `HasSwitch` |
| [devcalc/tests/Calculator.test.ts](../../devcalc/tests/Calculator.test.ts) | operator table test |

### One row per operator

```ts
type ECheck = "none" | "divisor" | "shift";

interface IOperatorSpec {
	readonly strName: string;
	readonly eCheck: ECheck; // what to check on the right side before applying
	readonly fnApply: (biA: bigint, biB: bigint) => bigint;
}

const OPERATOR_TABLE = {
	"+": { strName: "add", eCheck: "none", fnApply: (biA, biB) => biA + biB },
	...
	"/": { strName: "divide", eCheck: "divisor", fnApply: (biA, biB) => biA / biB },
	...
	"<<": { strName: "shift left", eCheck: "shift", fnApply: (biA, biB) => biA << biB },
	">>": { strName: "shift right", eCheck: "shift", fnApply: (biA, biB) => biA >> biB },
} satisfies Record<string, IOperatorSpec>;

export type TOperator = keyof typeof OPERATOR_TABLE; // "+" | "-" | ... | ">>"
```

Why `satisfies` here:

- **Each row is checked**: a typo like `eCheck: "nothing"` is TS2322, and `biA` / `biB` get the type `bigint` from `IOperatorSpec` without annotations.
- **The keys are kept**: with an annotation `Record<string, IOperatorSpec>`, `keyof typeof OPERATOR_TABLE` would be just `string` and `TOperator` would be useless.

`#Apply` no longer lists operators. It switches on the *check*, and `AssertNever` (lesson 03) makes sure a new `ECheck` member is handled:

```ts
#Apply(biA: bigint, strOp: TOperator, biB: bigint): bigint {
	const oSpec: IOperatorSpec = OPERATOR_TABLE[strOp];
	switch (oSpec.eCheck) {
		case "none":
			break;
		case "divisor":
			if (biB === 0n) {
				throw new CCalcError("division by zero", `the right side of ${strOp} must not be 0.`);
			}
			break;
		case "shift":
			this.#CheckShift(biB);
			break;
		default:
			return AssertNever(oSpec.eCheck);
	}
	return oSpec.fnApply(biA, biB);
}
```

`IsOperator` uses `Object.hasOwn`, not `in`: `"toString" in OPERATOR_TABLE` is `true` because of the prototype.

### Typed command-line switches

```ts
const SWITCHES = ["--no-group", "--lower", "--no-prefix", "--copy", "--repl"] as const;
type TSwitch = (typeof SWITCHES)[number];
type TBitsFlag = `--bits=${TWordBits}`; // "--bits=8" | "--bits=16" | "--bits=32" | "--bits=64"

function HasSwitch(eSwitch: TSwitch): boolean {
	return arrFlag.includes(eSwitch);
}

HasSwitch("--no-grop"); // TS2345 : the typo can't reach run time
```

Before, `arrFlag.includes("--no-grop")` was just `false` — silently.

### Checked

- The output of the regression cases (lessons 01–06: numbers, `--bits`, operators, errors, unknown options, `;` and `ans`) is **byte-for-byte the same** as before the change. The web page (lesson 07) uses the same core and works as before.
- A new test checks the table:

```ts
test("Calculator: operator table", () => {
	assert.equal(OperatorList(), "+ - * / % & | ^ << >>"); // same order as before lesson 08
	assert.equal(IsOperator("toString"), false);
	assert.equal(OperatorName("^"), "xor");
	...
});
```

```
> npm test
check-pairs : 44 pairs, 0 failed
...
ℹ tests 28
ℹ pass 28
```

Things to try: add `"**"` (power) as one row: `{ strName: "power", eCheck: "none", fnApply: (biA, biB) => biA ** biB }`. Then try `node devcalc/src/main.ts "2 ** 10"` (= `0x400`) — nothing else needs to change, because `Evaluate` asks `IsOperator`, and the error text "supported operators are ..." comes from `OperatorList()`. Then try `"2 ** -1"`: DevCalc stops with an uncaught `RangeError`, because BigInt has no negative powers. The clean fix is a new `ECheck` member `"exponent"` that throws a `CCalcError` — and `AssertNever` shows you where to handle it.

---

## Summary

- Utility types turn one type into another : `Partial`, `Required`, `Readonly`, `Pick`, `Omit`, `Record`, `ReturnType`, `Parameters`, `Awaited`, `Exclude`, `Extract`, `NonNullable`. `Readonly` is not enforced at run time — `Object.freeze` is.
- A mapped type loops over keys : `{ [K in keyof T]: ... }`. `+` / `-` change `readonly` and `?`. `as` renames keys, `as never` drops them.
- A conditional type picks a type : `T extends U ? X : Y`. It splits unions (wrap in `[T]` to stop that). `infer` takes a part out.
- Template literal types describe string shapes (`` `0x${string}` ``). Text from outside still needs a type guard.
- `satisfies` checks a value and keeps its exact type. An annotation checks and widens. `as` doesn't check.
- DevCalc: one `OPERATOR_TABLE` with `satisfies`; `TOperator` comes from its keys; switches are a union type.

**Next → [09. Testing and Tooling](../09-testing-tooling/README.md)**: `node:test` in depth, Vitest, mocks, and a naming-rule checker for this project — and what to do about ESLint with TypeScript 7.

---

[← Previous: 07. Browser and DOM](../07-browser-dom/README.md) · [Contents](../../README.md) · [Next: 09. Testing and Tooling →](../09-testing-tooling/README.md)
