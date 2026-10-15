[English](README.md) · **한국어**

[← 이전: 07. 브라우저와 DOM](../07-browser-dom/README.ko.md) · [목차](../../README.ko.md) · [다음: 09. 테스트와 도구 →](../09-testing-tooling/README.ko.md)

# 08. 고급 타입 — 유틸리티, 매핑된, 조건부, 템플릿 리터럴 타입

> 시리즈: DH.Study.TypeScript · 08강
> 환경: Node.js v24 · TypeScript 7 · VS Code

## 목표

이 강의를 마치면 다음을 할 수 있다.

- [ ] 내장 유틸리티 타입(Utility type)을 쓴다 : `Partial`, `Required`, `Readonly`, `Pick`, `Omit`, `Record`, `ReturnType`, `Parameters`, `Awaited`, `Exclude`, `Extract`, `NonNullable`
- [ ] 매핑된 타입(Mapped type) `{ [K in keyof T]: ... }` 을 쓰고, 수정자(Modifier)를 바꾸고, `as` 로 키 이름을 바꾸거나 뺀다
- [ ] 조건부 타입(Conditional type)을 쓰고, 유니온을 나누는 이유를 설명하며, `infer` 로 타입의 일부를 꺼낸다
- [ ] 템플릿 리터럴 타입(Template literal type)으로 문자열 모양을 표현하고, 타입 표기(Annotation) / `satisfies` / `as` 중 알맞은 것을 고른다
- [ ] 타입이 지정된 이벤트 이미터(Event emitter)를 만들고, DevCalc 의 연산자를 타입이 지정된 표 하나로 만든다

## 이 강의의 목차

1. [유틸리티 타입](#1-유틸리티-타입)
2. [매핑된 타입](#2-매핑된-타입)
3. [조건부 타입](#3-조건부-타입)
4. [템플릿 리터럴 타입과 satisfies](#4-템플릿-리터럴-타입과-satisfies)
5. [따라하기](#5-따라하기)
6. [직접 만들기 — 타입이 지정된 이벤트 이미터](#6-직접-만들기--타입이-지정된-이벤트-이미터)
7. [DevCalc 스텝 — 연산자 표](#7-devcalc-스텝--연산자-표)
8. [정리](#정리)

이 강의의 예제 파일: [utility.ko.ts](utility.ko.ts) · [mapped.ko.ts](mapped.ko.ts) · [conditional.ko.ts](conditional.ko.ts) · [literal.ko.ts](literal.ko.ts) · [emitter.ko.ts](emitter.ko.ts)

> 예제는 한국어 주석판(`x.ko.ts`)을 링크한다. 같은 코드의 영어 주석판은 `x.ts` 다.

> 문법 표시: **[JS]** = JavaScript 문법 (TS 없이도 있음) · **[TS]** = TypeScript 가 더한 타입 문법 (지우면 JS) · 자세한 구분은 [00강 7-3](../00-setup/README.ko.md#7-3-ts-문법--js-문법--타입-문법)

이 강의는 전부 **[TS]** 이야기다: 다른 타입에서 만들어 내는 타입. 모두 실행 전에 지워지므로 실행 시점 비용이 전혀 없다. 대신 실행 시점에는 아무것도 검사하지 못한다 — 4-2 절과 `Expected error:` 줄이 여전히 실제 검사가 필요한 곳을 보여 준다.

`keyof`, (타입 자리의) `typeof`, `K extends keyof T` 는 03강과 05강에서 이미 썼다. 여기서는 이것들이 재료가 된다.

---

## 1. 유틸리티 타입

TypeScript 는 한 타입을 다른 타입으로 바꾸는 제네릭 타입을 기본으로 제공한다. import 할 필요 없이 항상 있다.

```ts
interface IRegister {
	readonly strName: string;
	nValue: number;
	strNote?: string;
}
```

### 1-1. Partial, Required, Readonly

| 타입 | 결과 | 주로 쓰는 곳 |
|---|---|---|
| `Partial<T>` | 모든 프로퍼티가 선택적 | "이 필드만 바꾸기" |
| `Required<T>` | 모든 `?` 가 빠짐 | 기본값을 채운 뒤 |
| `Readonly<T>` | 모든 프로퍼티가 `readonly` | 바뀌면 안 되는 값 |

```ts
function UpdateRegister(oRegister: IRegister, oChange: Partial<IRegister>): IRegister {
	return { ...oRegister, ...oChange };
}
UpdateRegister(AX, { nValue: 0xff });   // OK
UpdateRegister(AX, { nValu: 1 });       // TS2561 : 오타는 여전히 잡힘
```

`Readonly<T>` 는 TS 만 검사한다. `Object.freeze` 는 실행 시점에도 막는다 — 캐스트로 TS 에게서 `readonly` 를 숨기면 `TypeError` 로 실패한다 (ES 모듈은 strict 모드로 실행):

```
3) Readonly : 1 / Expected error: TypeError
   Why : Object.freeze stops changes at run time. Readonly<T> alone only stops them in the editor.
   Fix : don't cast readonly away. Make a changed copy instead : { ...oFrozen, nValue: 3 }
```

> **C#** : `Readonly<T>` 는 `get` / `init` 프로퍼티만 있는 타입과 비슷하지만, C# 은 실행 시점에도 막는다. C# 에는 `Partial<T>` 가 없다 — 별도 DTO 를 만들거나 nullable 필드를 쓴다.

### 1-2. Pick, Omit, Record

```ts
type TRegisterValue = Pick<IRegister, "strName" | "nValue">; // 이 키만 남김
type TNewRegister = Omit<IRegister, "strName">;              // 이 키를 뺌

type EWordName = "BYTE" | "WORD" | "DWORD" | "QWORD";
const WORD_BITS: Record<EWordName, number> = { BYTE: 8, WORD: 16, DWORD: 32, QWORD: 64 };
```

키 타입이 유니온이면 `Record` 는 **모든** 키가 필요하다. 두 개를 빼면 TS2739. 아무 키나 없어도 되는 C# 의 `Dictionary<TKey, TValue>` 와 다른 점이다.

### 1-3. 함수에서 타입 얻기

```ts
function ParseHex(strText: string, bStrict = true): { bOk: boolean; nValue: number } { ... }
async function LoadValue(): Promise<bigint> { ... }

type TParseResult = ReturnType<typeof ParseHex>;           // { bOk: boolean; nValue: number }
type TParseArgs = Parameters<typeof ParseHex>;             // [strText: string, bStrict?: boolean]
type TLoaded = Awaited<ReturnType<typeof LoadValue>>;      // bigint
```

(타입 자리의) `typeof ParseHex` 는 함수의 타입이다. 라이브러리가 함수는 주지만 결과 타입의 이름은 주지 않을 때 유용하다.

### 1-4. 유니온 거르기

```ts
type EOperator = "+" | "-" | "&" | "|" | "<<" | ">>";
type EBitOperator = Extract<EOperator, "&" | "|" | "<<" | ">>">; // 이것들만 남김
type EMathOperator = Exclude<EOperator, EBitOperator>;            // "+" | "-"
type TText = NonNullable<string | null | undefined>;              // string
```

---

## 2. 매핑된 타입

매핑된 타입은 키 목록을 순회하며 키마다 프로퍼티를 하나씩 만든다. 1-1 절의 타입은 모두 매핑된 타입이다.

### 2-1. 문법

```ts
type TMyPartial<T> = { [K in keyof T]?: T[K] };
//                     ─┬─────────── ┬  ──┬─
//                      │            │    └ 값 타입 : T[K] = 원래와 같음
//                      │            └ ? = 선택적으로
//                      └ T 의 각 키 K 에 대해
```

`[K in keyof T]` 는 타입 수준에서 키를 순회하는 `for` 문처럼 읽는다.

### 2-2. 수정자: + 와 -

```ts
type TFrozen<T> = { readonly [K in keyof T]: T[K] };            // readonly 추가
type TComplete<T> = { -readonly [K in keyof T]-?: T[K] };       // readonly 와 ? 제거
```

값 타입도 바꿀 수 있다. 여기서는 설정마다 **자기 타입에 맞는** 검사 함수를 갖는다:

```ts
type TValidators<T> = { [K in keyof T]: (vValue: T[K]) => string | undefined };

const VALIDATORS: TValidators<ISettings> = {
	nBits: (nValue) => ...,      // nValue : number
	bGroup: () => undefined,
	strPrefix: (strValue) => ..., // strValue : string
};
```

`ISettings` 에 설정을 더하면 그 검사를 쓸 때까지 `VALIDATORS` 가 빨개진다 (TS2741). 타입이 두 곳을 맞춰 준다.

### 2-3. as 로 키 이름 바꾸기와 빼기

```ts
// "nBits" → "GetNBits"
type TGetters<T> = { [K in keyof T as `Get${Capitalize<K & string>}`]: () => T[K] };

// 값이 V 인 키만 남김; "never" 는 키를 지움
type TOnlyOfType<T, V> = { [K in keyof T as T[K] extends V ? K : never]: T[K] };
type TFlagSettings = TOnlyOfType<ISettings, boolean>; // { bGroup: boolean }
```

`keyof T` 는 `number` 나 `symbol` 일 수도 있어서 `K & string` 이 필요하다. 타입은 실행 시점에 만든 이름을 보여 주지만 그 이름을 만드는 코드는 TS 가 검사하지 못하므로, `MakeGetters` 에는 `as` 캐스트가 한 곳에 한 번 있다.

> **C#** : C# 에는 매핑된 타입이 없다. 같은 일을 리플렉션(Reflection, 실행 시점, 검사 없음)이나 소스 생성기(Source generator, 빌드 전에 코드 생성)로 한다. TS 에서는 그냥 타입이다.

---

## 3. 조건부 타입

```ts
type TIsBig<T> = T extends bigint ? "bigint" : "not bigint";
```

"`T` 가 `bigint` 에 대입 가능하면 타입은 `"bigint"`, 아니면 `"not bigint"`" 로 읽는다. `? :` 연산자처럼 생겼지만 타입 검사기 안에서 동작한다.

### 3-1. 결과가 입력을 따라간다

```ts
type TParsed<T extends string | number> = T extends string ? bigint : number;
function Widen<T extends string | number>(vValue: T): TParsed<T> { ... }

const biWide = Widen("0xff"); // bigint
const nWide = Widen(21);      // number
```

함수 본문 안에서는 TS 가 조건부 반환 타입을 검사하지 못하므로 `Widen` 에는 캐스트가 하나 필요하다. 대신 호출하는 쪽은 정확한 타입을 얻는다 — 이것이 트레이드오프(Trade-off)다.

### 3-2. 유니온에 분배된다

`T` 가 유니온이면 조건이 멤버마다 한 번씩 실행되고 결과가 다시 합쳐진다 (**분배, distributive**):

```ts
type TNoBig<T> = T extends bigint ? never : T;
type TSmall = TNoBig<number | bigint | string>; // number | string
```

`Exclude<T, U>` 가 바로 이렇게 작성되어 있다. 유니온 전체를 한 번에 검사하려면 `T` 를 대괄호로 감싼다: `[T] extends [string] ? ... : ...`.

### 3-3. infer: 일부를 추출한다

```ts
type TElementOf<T> = T extends readonly (infer E)[] ? E : never;
type TUnwrap<T> = T extends Promise<infer V> ? TUnwrap<V> : T; // 재귀

const WORDS = [8, 16, 32, 64] as const;
type TWord = TElementOf<typeof WORDS>;                // 8 | 16 | 32 | 64
type TDeep = TUnwrap<Promise<Promise<bigint>>>;       // bigint
```

`infer E` 는 "여기에 무엇이 있든 E 라고 부르자" 라는 뜻이다. 1-3 절의 `ReturnType`, `Parameters`, `Awaited` 모두 이렇게 만들어져 있다.

> **C#** : C# 에는 이런 것이 없다. 제네릭 제약(`where T : struct`)은 `T` 를 *제한* 할 뿐, `T` 로 새 타입을 계산하지는 못한다.

---

## 4. 템플릿 리터럴 타입과 satisfies

### 4-1. 문자열 모양

```ts
type THexText = `0x${string}`;               // "0x" 로 시작하는 모든 문자열
type EIntName = `${"i" | "u"}${8 | 16 | 32 | 64}`; // "i8" | "i16" | ... | "u64"
type EHandlerName = `On${Capitalize<"hex" | "dec">}`; // "OnHex" | "OnDec"
```

템플릿 안의 유니온은 모든 조합을 만든다. `Uppercase`, `Lowercase`, `Capitalize`, `Uncapitalize` 는 기본 제공이다. 여기서도 `infer` 를 쓸 수 있다:

```ts
type TFlagName<T> = T extends `--${infer N}=${string}` ? N : never;
type TBits = TFlagName<"--bits=32">; // "bits"
```

외부 (파일, 명령줄, 입력 상자) 에서 들어온 텍스트는 그냥 `string` 이다. 타입 가드(Type guard)가 실행 시점에 모양을 확인하고 좁힌다:

```ts
function IsHexText(strText: string): strText is THexText {
	return /^0x[0-9a-f]+$/i.test(strText);
}
```

### 4-2. 타입 표기, satisfies, as

객체에 타입을 주는 세 가지 방법:

| | 검사? | 값 자체의 타입 |
|---|---|---|
| `const X: T = { ... }` (타입 표기) | 함 | 잃음 : `X` 는 그냥 `T` |
| `const X = { ... } satisfies T` | 함 | 유지 : 정확한 키, 리터럴 값 |
| `const X = { ... } as T` | **안 함** | 값이 실제로 무엇이든 `T` |

```ts
const SATISFIED = {
	"+": { strName: "add", nPrecedence: 4 },
	"-": { strName: "subtract", nPrecedence: 4 },
	"<<": { strName: "shift left", nPrecedence: 3 },
} as const satisfies Record<ECalcOperator, IOperatorInfo>;

const strExact: "shift left" = SATISFIED["<<"].strName; // OK : 리터럴이 유지됨
```

`as` 는 전혀 겹칠 수 없는 타입만 거부한다 (TS2352). 빠진 키는 통과하고, 실행 시점에야 알게 된다:

```
6-2) as : Expected error: TypeError - Cannot read properties of undefined (reading 'strName')
     Why : 'as' tells TS to trust you, so the missing "<<" key was not checked.
     Fix : use satisfies (6-3) or an annotation (6-1); TS then reports the missing key.
```

> **C#** : C# 캐스트는 실행 시점에 검사된다 (`InvalidCastException`). TS 의 `as` 는 전혀 검사되지 않는다 — 지워진다. 값을 직접 확인한 곳에서만 쓰자.

---

## 5. 따라하기

각 파일을 열고 `F5` 를 누르거나 명령줄에서 실행한다. 실행할 수 없는 환경이면 아래 결과와 코드를 함께 읽는다.

### [utility.ko.ts](utility.ko.ts) — Partial, Required, Readonly, Pick / Omit, Record, ReturnType / Parameters / Awaited, Exclude / Extract

```
> node lessons/08-advanced-types/utility.ko.ts
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

해 볼 것: 주석 처리된 다섯 줄을 하나씩 풀어 보자 (TS2561, TS2741, TS2540, TS2739, TS2322). `TParseArgs` 와 `TLoaded` 에 마우스를 올려 보자.

### [mapped.ko.ts](mapped.ko.ts) — 키 순회, 수정자, 타입이 지정된 검사 함수, 키 이름 바꾸기와 빼기

```
> node lessons/08-advanced-types/mapped.ko.ts
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

해 볼 것: `ISettings` 에 `bLower: boolean` 을 더하고 `VALIDATORS` 가 빨개지는 것을 보자 (TS2741). `oGetters.` 를 입력해 만들어진 이름을 보자.

### [conditional.ko.ts](conditional.ko.ts) — extends ? :, 유니온 분배, [T], infer

```
> node lessons/08-advanced-types/conditional.ko.ts
1) TIsBig : bigint / not bigint
2) Widen : 255n bigint / 42 number
3) distributive : 1, one (this is how Exclude<T, U> is written)
4) [T] : boolean false
5) infer : 16 7n 65536n
6) TMyReturn : 16n
7) run time : bigint / not bigint
```

해 볼 것: `biWide` 와 `nWide` 에 마우스를 올려 보자. `T extends readonly [...unknown[], infer L] ? L : never` 로 `TLastOf<T>` 를 만들어 보자.

### [literal.ko.ts](literal.ko.ts) — `0x${string}`, 조합, Capitalize, 타입 가드, 타입 표기 / as / satisfies

```
> node lessons/08-advanced-types/literal.ko.ts
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

해 볼 것: `SATISFIED` 에서 `"<<"` 행을 지워 보자 (TS2741). `ANNOTATED["<<"].strName` 과 `SATISFIED["<<"].strName` 에 마우스를 올려 비교해 보자.

---

## 6. 직접 만들기 — 타입이 지정된 이벤트 이미터

[emitter.ko.ts](emitter.ko.ts): 타입 하나가 이벤트와 그 인수를 나열한다. `On` 과 `Emit` 은 그 이름만 받고, 각 리스너는 타입 표기 없이도 매개변수 타입을 얻는다.

```ts
type TEventMap = Record<string, unknown[]>;
type TListener<A extends unknown[]> = (...arrArg: A) => void;
type TListeners<TEvents extends TEventMap> = { [K in keyof TEvents]?: Set<TListener<TEvents[K]>> }; // 매핑된 타입

class CEmitter<TEvents extends TEventMap> {
	#oListeners: TListeners<TEvents> = {};

	On<K extends keyof TEvents>(eName: K, fnListener: TListener<TEvents[K]>): () => void { ... } // 구독 해제 함수를 반환
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

`...arrArg: TEvents[K]` 는 튜플을 매개변수 목록으로 바꾼다. 그래서 개수가 틀리면 TS2554, 타입이 틀리면 TS2345:

```ts
oEmitter.Emit("evaluated", "1 + 1");    // TS2554 : 인수 3개가 필요한데 2개를 받음
oEmitter.Emit("evaluated", "1 + 1", 2); // TS2345 : 'number' 는 'bigint' 에 대입할 수 없음
oEmitter.On("evaluate", () => {});      // TS2345 : '"evaluate"' 는 'keyof TCalcEvents' 에 대입할 수 없음
```

**이벤트 맵에 왜 `interface` 가 아니라 `type` 인가?** `TEvents extends Record<string, unknown[]>` 는 인덱스 시그니처(Index signature)를 요구한다. 객체 리터럴 타입의 type 별칭은 암묵적으로 이것을 갖지만, interface 는 갖지 않는다 — interface 는 나중에 선언 병합(Declaration merging)으로 늘어날 수 있기 때문이다. 그래서 `CEmitter<ICalcEvents>` 는 TS2344. `Pick<ICalcEvents, keyof ICalcEvents>` 로 매핑된 타입으로 바꾸면 통과한다.

```
> node lessons/08-advanced-types/emitter.ko.ts
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

> **C#** : C# 에는 `event EventHandler<TArgs>` 가 있다 — 이벤트마다 필드 하나, 인수는 컴파일러가 검사. `CEmitter<TEvents>` 는 이벤트마다 필드를 두지 않고 타입 하나로 같은 검사를 얻는다. `node:events` 의 Node 기본 `EventEmitter` 도 같은 방식으로 타입을 줄 수 있다: `new EventEmitter<TCalcEvents>()`.

해 볼 것: `TCalcEvents` 에 `copied: [strText: string]` 을 더하고 구독해 보자. 첫 호출 뒤 스스로 구독을 해제하는 `Once(eName, fnListener)` 를 만들어 보자.

---

## 7. DevCalc 스텝 — 연산자 표

지금까지 연산자는 세 곳에 있었다: `OPERATORS` 목록, `#Apply` 의 `switch`, 그리고 `case` 안의 0 / 시프트 검사. 이제 표 하나가 각 연산자를 설명하고, 타입은 표에서 나온다.

바뀐 파일:

| 파일 | 변경 |
|---|---|
| [devcalc/src/core/Calculator.ts](../../devcalc/src/core/Calculator.ts) | `satisfies` 를 쓴 `OPERATOR_TABLE`, `TOperator = keyof typeof OPERATOR_TABLE`, `OperatorName` |
| [devcalc/src/core/index.ts](../../devcalc/src/core/index.ts) | `OperatorName` 내보내기 |
| [devcalc/src/main.ts](../../devcalc/src/main.ts) | 타입이 지정된 명령줄 옵션 : `TSwitch`, `` TBitsFlag = `--bits=${TWordBits}` ``, `HasSwitch` |
| [devcalc/tests/Calculator.test.ts](../../devcalc/tests/Calculator.test.ts) | 연산자 표 테스트 |

### 연산자마다 한 행

```ts
type ECheck = "none" | "divisor" | "shift";

interface IOperatorSpec {
	readonly strName: string;
	readonly eCheck: ECheck; // 적용 전에 오른쪽에서 검사할 것
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

여기서 `satisfies` 를 쓰는 이유:

- **각 행이 검사된다**: `eCheck: "nothing"` 같은 오타는 TS2322 이고, `biA` / `biB` 는 타입 표기 없이 `IOperatorSpec` 에서 `bigint` 타입을 얻는다.
- **키가 유지된다**: `Record<string, IOperatorSpec>` 로 타입 표기를 하면 `keyof typeof OPERATOR_TABLE` 는 그냥 `string` 이 되어 `TOperator` 가 쓸모없어진다.

`#Apply` 는 더 이상 연산자를 나열하지 않는다. *검사* 로 switch 하고, `AssertNever` (03강) 가 새 `ECheck` 멤버를 처리했는지 확인해 준다:

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

`IsOperator` 는 `in` 이 아니라 `Object.hasOwn` 을 쓴다: 프로토타입 때문에 `"toString" in OPERATOR_TABLE` 은 `true` 다.

### 타입이 지정된 명령줄 옵션

```ts
const SWITCHES = ["--no-group", "--lower", "--no-prefix", "--copy", "--repl"] as const;
type TSwitch = (typeof SWITCHES)[number];
type TBitsFlag = `--bits=${TWordBits}`; // "--bits=8" | "--bits=16" | "--bits=32" | "--bits=64"

function HasSwitch(eSwitch: TSwitch): boolean {
	return arrFlag.includes(eSwitch);
}

HasSwitch("--no-grop"); // TS2345 : 오타가 실행 시점까지 가지 못함
```

전에는 `arrFlag.includes("--no-grop")` 이 아무 경고 없이 `false` 였다.

### 확인한 것

- 회귀 사례 (01~06강: 숫자, `--bits`, 연산자, 에러, 모르는 옵션, `;` 와 `ans`) 의 출력이 변경 전과 **바이트 단위로 같다**. 웹 페이지 (07강) 는 같은 코어를 쓰며 전과 같이 동작한다.
- 새 테스트가 표를 확인한다:

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

해 볼 것: `"**"` (거듭제곱) 를 한 행으로 더해 보자: `{ strName: "power", eCheck: "none", fnApply: (biA, biB) => biA ** biB }`. 그리고 `node devcalc/src/main.ts "2 ** 10"` (= `0x400`) 을 실행해 보자 — `Evaluate` 가 `IsOperator` 에게 묻고, 에러 문구 "supported operators are ..." 도 `OperatorList()` 에서 오므로 다른 곳은 바꿀 필요가 없다. 이어서 `"2 ** -1"` 을 해 보면: BigInt 에는 음수 거듭제곱이 없어서 DevCalc 가 잡히지 않은 `RangeError` 로 멈춘다. 깔끔한 해결은 `CCalcError` 를 던지는 새 `ECheck` 멤버 `"exponent"` 이고 — 어디서 처리해야 하는지는 `AssertNever` 가 알려 준다.

---

## 정리

- 유틸리티 타입은 한 타입을 다른 타입으로 바꾼다 : `Partial`, `Required`, `Readonly`, `Pick`, `Omit`, `Record`, `ReturnType`, `Parameters`, `Awaited`, `Exclude`, `Extract`, `NonNullable`. `Readonly` 는 실행 시점에 강제되지 않는다 — `Object.freeze` 는 강제된다.
- 매핑된 타입은 키를 순회한다 : `{ [K in keyof T]: ... }`. `+` / `-` 로 `readonly` 와 `?` 를 바꾼다. `as` 는 키 이름을 바꾸고, `as never` 는 키를 뺀다.
- 조건부 타입은 타입을 고른다 : `T extends U ? X : Y`. 유니온에 분배된다 (`[T]` 로 감싸면 막힘). `infer` 는 일부를 추출한다.
- 템플릿 리터럴 타입은 문자열 모양을 표현한다 (`` `0x${string}` ``). 외부에서 들어온 텍스트는 여전히 타입 가드가 필요하다.
- `satisfies` 는 값을 검사하고 정확한 타입을 유지한다. 타입 표기는 검사하고 넓힌다. `as` 는 검사하지 않는다.
- DevCalc: `satisfies` 를 쓴 `OPERATOR_TABLE` 하나; `TOperator` 는 그 키에서 나옴; 명령줄 옵션은 유니온 타입.

**다음 → [09. 테스트와 도구](../09-testing-tooling/README.ko.md)**: `node:test` 깊이 보기, Vitest, 모의 객체(Mock), 이 프로젝트의 이름 규칙 검사기 — 그리고 TypeScript 7 에서 ESLint 를 어떻게 할 것인가.

---

[← 이전: 07. 브라우저와 DOM](../07-browser-dom/README.ko.md) · [목차](../../README.ko.md) · [다음: 09. 테스트와 도구 →](../09-testing-tooling/README.ko.md)
