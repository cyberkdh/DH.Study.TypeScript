[English](README.md) · **한국어**

[← 이전: 04. 클래스와 에러 처리](../04-classes-errors/README.ko.md) · [목차](../../README.ko.md) · [다음: 06. 모듈과 비동기 →](../06-modules-async/README.ko.md)

# 05. 제네릭 — TResult, 컨테이너, 계산 히스토리

> 시리즈: DH.Study.TypeScript · 05강
> 환경: Node.js v24 · TypeScript 7 · VS Code

## 목표

이 강의를 마치면 다음을 할 수 있다.

- [ ] 제네릭 함수(Generic Function, `<T>`)를 만들고 타입 인수(Type Argument)를 TS 가 추론(Inference)하게 한다
- [ ] `extends`, `keyof`, 기본값(`<T = string>`)으로 타입 매개변수(Type Parameter)를 제한한다
- [ ] 제네릭 인터페이스와 클래스를 만들고, `Array<T>`, `Map<K, V>`, `Set<T>`, `Record<K, V>` 를 쓴다
- [ ] 예외를 던지는 대신 `TResult<T, E>` 를 반환하고, 언제 무엇을 고를지 안다
- [ ] TS 제네릭이 C# 과 달리 실행 시점(Runtime)에 사라지는 이유를 설명한다
- [ ] DevCalc 에 결과 타입, 계산 히스토리(History), `ans` 를 넣는다 (`"0xFF + 1; ans * 2"`)

## 이 강의의 목차

1. [제네릭 함수](#1-제네릭-함수)
2. [제약 조건](#2-제약-조건)
3. [제네릭 타입과 컨테이너](#3-제네릭-타입과-컨테이너)
4. [TResult — 값으로서의 에러](#4-tresult--값으로서의-에러)
5. [따라하기](#5-따라하기)
6. [직접 만들기 — 계산 히스토리](#6-직접-만들기--계산-히스토리)
7. [DevCalc 스텝 — Evaluate, 히스토리, ans](#7-devcalc-스텝--evaluate-히스토리-ans)
8. [정리](#정리)

이 강의의 예제 파일: [generics.ko.ts](generics.ko.ts) · [constraints.ko.ts](constraints.ko.ts) · [containers.ko.ts](containers.ko.ts) · [result.ko.ts](result.ko.ts) · [history.ko.ts](history.ko.ts)

> 예제는 한국어 주석판(`x.ko.ts`)을 링크한다. 같은 코드의 영어 주석판은 `x.ts` 다.

> 문법 표시: **[JS]** = JavaScript 문법 (TS 없이도 있음) · **[TS]** = TypeScript 가 더한 타입 문법 (지우면 JS) · 자세한 구분은 [00강 7-3](../00-setup/README.ko.md#7-3-ts-문법--js-문법--타입-문법)

---

## 1. 제네릭 함수

### 1-1. 문제: `any` 는 타입을 잃는다

**[TS]**

```ts
function FirstAny(arrItem: any[]): any {
	return arrItem[0];
}
const vFirst = FirstAny([255n, 16n]);   // any
vFirst.toUpperCase();                    // 컴파일됨 — 그리고 실행 중에 실패
```

요소 타입에 상관없이 쓸 수 있는 함수 하나가 필요하지만, `any` 는 검사기를 꺼 버린다. 결과가 무엇이든 될 수 있으니 어떤 실수도 컴파일된다.

### 1-2. 타입 매개변수 `<T>`

**[TS]**

```ts
function First<T>(arrItem: readonly T[]): T | undefined {
	return arrItem[0];
}
const biFirst = First([255n, 16n]);      // T = bigint → bigint | undefined
const strFirst = First(["HEX", "DEC"]);  // T = string
```

- `<T>` 는 자리 표시자(Placeholder)다. "호출하는 쪽에서 정하는 타입". TS 가 인수에서 **추론**하므로 직접 적을 일은 드물다.
- 배열이 비어 있을 수 있으므로 `T | undefined` 다 (`noUncheckedIndexedAccess`, 03강).
- `readonly T[]` 는 일반 배열과 읽기 전용 배열을 모두 받고, 배열을 바꾸지 않겠다는 표시다.

### 1-3. 타입 인수를 직접 적기

```ts
First<number>([1, 2, 3]);   // ○
First<number>(["1"]);       // ✕ TS2322: Type 'string' is not assignable to type 'number'
```

추론할 근거가 없을 때(빈 배열, 나중에 돌아오는 값) 또는 인수를 그 타입으로 검사하고 싶을 때 타입 인수를 적는다.

### 1-4. 여러 매개변수, 화살표 함수, 함수 타입

```ts
function MakePair<A, B>(vLeft: A, vRight: B): [A, B] { return [vLeft, vRight]; }
MakePair("AX", 0xffn);                                  // [string, bigint]

const Last = <T>(arrItem: readonly T[]): T | undefined => arrItem[arrItem.length - 1];

type TMapper<TIn, TOut> = (vItem: TIn) => TOut;         // 제네릭 함수 타입
function MapAll<TIn, TOut>(arrItem: readonly TIn[], fnMap: TMapper<TIn, TOut>): TOut[] { ... }
MapAll(["0xFF", "0b1010"], (strText) => strText.length); // TIn = string, TOut = number
```

| | C# | TS |
|---|---|---|
| 제네릭 메서드 | `T First<T>(IList<T> list)` | `function First<T>(arrItem: readonly T[]): T \| undefined` |
| 추론 | 있음 | 있음 — 콜백의 반환값에서도 추론 (`TOut`) |
| 델리게이트 타입 | `Func<TIn, TOut>` | `type TMapper<TIn, TOut> = (vItem: TIn) => TOut` |
| `default(T)` | 있음 | 없음 — 실행 시점에 `T` 가 없으므로 `undefined` 를 반환 |

## 2. 제약 조건

### 2-1. `T extends ...`

**[TS]**

```ts
function LengthOf<T>(vItem: T) {
	return vItem.length;   // ✕ TS2339: Property 'length' does not exist on type 'T'
}

function Longest<T extends { length: number }>(vLeft: T, vRight: T): T {
	return vRight.length > vLeft.length ? vRight : vLeft;   // ○ 모든 T 에 length 가 있음
}
Longest("0xFF", "0b1111_1111");   // 문자열에는 length 가 있다
Longest([1, 2], [3]);             // 배열도
Longest(10, 20);                  // ✕ TS2345: 'number' is not assignable to '{ length: number; }'
```

제약(Constraint)이 없으면 `T` 는 무엇이든 될 수 있으므로 TS 는 아무 멤버도 쓰지 못하게 한다. `extends` 는 C# 의 `where T : ...` 이지만 **구조적(Structural)** 이다. `length: number` 만 있으면 어떤 타입이든 맞는다. 인터페이스를 선언할 필요가 없다.

### 2-2. `K extends keyof T` 와 `T[K]`

```ts
function GetProp<T, K extends keyof T>(oItem: T, strKey: K): T[K] {
	return oItem[strKey];
}
GetProp(oAx, "biValue");   // bigint
GetProp(oAx, "nBits");     // number
GetProp(oAx, "nBitz");     // ✕ TS2345: Argument of type '"nBitz"' is not assignable to parameter of type 'keyof IRegister'
```

`keyof T` 는 T 의 키 이름 유니온이다 (`"strName" | "biValue" | "nBits"`). `T[K]` 는 "그 키의 타입" 이다. 프로퍼티 이름의 오타가 컴파일 에러가 된다. C# 에는 같은 것이 없고 리플렉션(Reflection)이나 `nameof` 를 쓴다.

### 2-3. 기본값과 `const T`

```ts
interface IBox<T = string> { readonly vValue: T; }
const oText: IBox = { vValue: "0xFF" };           // T = string

function Options<const T extends readonly string[]>(arrOption: T): T { return arrOption; }
Options(["HEX", "DEC", "BIN"]);                   // string[] 이 아니라 readonly ["HEX", "DEC", "BIN"]
```

`const T` (TS 5.0) 는 인수에 `as const` (03강) 를 붙인 것처럼 추론하므로 리터럴 타입이 남는다.

| | C# | TS |
|---|---|---|
| 기반 타입 / 인터페이스 | `where T : IFoo` | `T extends IFoo` (구조적) |
| `class` / `struct` / `new()` | 있음 | 없음 — 값 타입이 없고 `T` 로 객체를 만들 수 없다 |
| 기본 타입 인수 | 없음 | `<T = string>` |
| 타입의 키 | — | `K extends keyof T` |

## 3. 제네릭 타입과 컨테이너

### 3-1. 제네릭 인터페이스와 클래스

**[JS + TS]** — `class` 는 JS, `<T>` 는 TS

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

### 3-2. 내장 제네릭

**[JS + TS]**

```ts
const arrValue: Array<bigint> = [1n, 2n];          // bigint[] 와 같음
const mapRegister = new Map<string, bigint>([["AX", 0x1234n]]);
const setSeen = new Set<string>(["HEX", "DEC", "HEX"]);   // 크기 2
mapRegister.get("AX");                              // bigint | undefined

type ERadixName = "HEX" | "DEC" | "BIN";
const RADIX_BASE: Record<ERadixName, number> = { HEX: 16, DEC: 10, BIN: 2 };
const oPartial: Record<ERadixName, number> = { HEX: 16 };   // ✕ TS2739: missing the following properties: BIN, DEC
```

| C# | TS / JS |
|---|---|
| `List<T>` | `T[]` / `Array<T>` |
| `Dictionary<K, V>` | `Map<K, V>` (키 타입 자유), 또는 문자열 키의 일반 객체면 `Record<K, V>` |
| `HashSet<T>` | `Set<T>` |
| `IReadOnlyList<T>` | `readonly T[]` / `ReadonlyArray<T>` |
| `IReadOnlyDictionary<K, V>` | `ReadonlyMap<K, V>` |
| `dict.TryGetValue(k, out v)` | `map.get(k)` 가 `V \| undefined` 를 반환 |

- `Record<ERadixName, number>` 는 유니온의 **모든** 키를 요구한다. `ERadixName` 에 `"OCT"` 를 더하면 `OCT` 항목을 넣을 때까지 모든 표가 빨간 줄이 된다.
- `ReadonlyArray` / `ReadonlyMap` 에는 `push` / `set` 이 없다 (TS2339). `readonly` 처럼 컴파일 때만 검사한다.

### 3-3. 제네릭은 지워진다

**[JS]**

```ts
new CStack<string>().constructor === new CStack<bigint>().constructor   // true
```

C# 은 `List<int>` 와 `List<string>` 을 별개의 타입으로 만들고, 실행 중에 `typeof(T)` 를 물어볼 수 있다. TS 에서 `<T>` 는 타입 문법이라 다른 타입처럼 지워진다 (00강, 타입 소거 Type Erasure). 실행 시점에는 `CStack` 하나뿐이다. 그래서 `T` 를 값으로 쓸 수 없다. `new T()`, `x instanceof T`, `typeof T` 검사 모두 불가능하다. 실행 중에 타입이 필요하면 값(클래스, 가드 함수)을 넘긴다.

## 4. TResult — 값으로서의 에러

**[TS]**

```ts
type TResult<T, E = string> = { bOk: true; vValue: T } | { bOk: false; vError: E };

function Ok<T>(vValue: T) { return { bOk: true, vValue } as const; }   // (간략화)
function Err<E>(vError: E) { return { bOk: false, vError } as const; }

function ParseHex(strText: string): TResult<bigint> {
	if (!/^0x[0-9a-f]+$/i.test(strText)) {
		return Err(`"${strText}" is not a hex number`);
	}
	return Ok(BigInt(strText));
}

const oResult = ParseHex("0xFF");
if (oResult.bOk) {
	oResult.vValue;   // bigint — 좁혀짐
}
oResult.vValue;       // ✕ TS2339: vValue 는 bOk 가 true 일 때만 있음
```

03강의 판별 유니온(Discriminated Union)에 타입 매개변수 두 개를 단 것이다. 03강의 `TParseResult` 는 이것의 고정된 한 버전이었다. 에러는 어떤 타입이든 될 수 있다. `TResult<bigint, IParseError>` 는 메시지뿐 아니라 위치도 담는다.

```ts
function MapResult<T, U, E>(oResult: TResult<T, E>, fnMap: (vValue: T) => U): TResult<U, E> {
	return oResult.bOk ? Ok(fnMap(oResult.vValue)) : oResult;   // 에러는 그대로 통과
}
```

| | `throw` (04강) | `TResult<T, E>` |
|---|---|---|
| 함수 타입에 드러남 | 아니오 | 예 |
| 호출하는 쪽이 잊을 수 있음 | 예 | 아니오 — 값이 `bOk` 뒤에 있음 |
| 어울리는 곳 | 버그, 깊은 곳의 드문 실패 | 예상되는 실패 (사용자 입력) |
| C# | 예외 | `int.TryParse(s, out n)`, 또는 `Result<T>` 클래스 |

함정 하나: 유니온 타입의 `const` 는 **초깃값으로 좁혀진다**. `const oErr: TResult<number> = Err("bad")` 라고 쓰면 `oErr` 는 에러 쪽만 남고, `MapResult(oErr, ...)` 는 `T` 를 추론하지 못한다 (`unknown`). 결과는 보통 함수 호출에서 오므로 이 문제가 생기지 않는다. DevCalc 테스트 파일에 예가 있다.

---

## 5. 따라하기

각 파일을 열고 `F5` 를 누르거나 명령줄에서 실행한다. 실행할 수 없는 환경이면 아래 결과와 코드를 함께 읽는다.

### [generics.ko.ts](generics.ko.ts) — any 와 T, 추론, 타입 인수 직접 적기, 여러 매개변수

```
> node lessons/05-generics/generics.ko.ts
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

해 볼 것: 1) 의 `FirstAny` 를 `First` 로 바꾸면 `vFirst.toUpperCase()` 에 빨간 줄이 생긴다. `// First<number>(["1"]);` 의 주석을 풀어 보자.

### [constraints.ko.ts](constraints.ko.ts) — extends, keyof, 기본값, const T

```
> node lessons/05-generics/constraints.ko.ts
1) LengthOf = string
2) Longest = 0b1111_1111 / [ 1, 2 ]
3) GetProp = 255n 16
4) NameList = AX, BX
5) IBox = 0xFF / 255n
6) Options = HEX | DEC | BIN / count = 3
```

해 볼 것: 주석 처리된 세 줄을 하나씩 풀어 보자 (TS2339, TS2345, TS2345). `Options<const T ...>` 에서 `const` 를 넣고 뺄 때 `arrRadix` 에 마우스를 올려 타입을 비교해 보자.

### [containers.ko.ts](containers.ko.ts) — 제네릭 인터페이스와 클래스, Map, Set, Record, readonly

```
> node lessons/05-generics/containers.ko.ts
1) IBox = HEX 255n / flags [ true, false ]
2) CStack : count = 2 / peek = 255n / pop = 255n / count = 1
3) Array = 2 / Map AX = 4660n / Map CX = undefined / Set size = 2
4) Record = { HEX: 16, DEC: 10, BIN: 2 }
5) Total = 6n / ReadonlyMap has AX = true
6) same class at run time = true / C# would make two types
```

### [result.ko.ts](result.ko.ts) — TResult, Ok / Err, 직접 만든 에러 타입, MapResult

```
> node lessons/05-generics/result.ko.ts
1) TResult sample = { bOk: false, vError: 'not ready' }
2) Ok = { bOk: true, vValue: 255n } / Err = { bOk: false, vError: 'bad input' }
3) 0xFF → value 255
3) 0xZZ → error: "0xZZ" is not a hex number
4) ParseBin = bad char at 2 in "10201"
5) MapResult = { bOk: true, vValue: '0xFF' } / { bOk: false, vError: '"hello" is not a hex number' }
6) 3 inputs, 1 error(s) — nothing was thrown
```

## 6. 직접 만들기 — 계산 히스토리

**[JS + TS]**

**어떤** 타입이든 마지막 N 개를 보관하는 히스토리다. 가득 차면 가장 오래된 것이 빠진다 (링 버퍼, Ring Buffer). DevCalc 이 계산 결과를 여기에 담는다. 전체 코드: [history.ko.ts](history.ko.ts).

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
			this.#arrItem.shift();   // 가장 오래된 것 제거
		}
		this.#arrItem.push(vItem);
	}

	At(nIndex: number): T | undefined {
		return this.#arrItem.at(nIndex);   // 0 = 가장 오래된 것, -1 = 가장 최근 것
	}

	Find(fnTest: (vItem: T) => boolean): T | undefined { ... }   // 최근 것부터

	*[Symbol.iterator](): IterableIterator<T> {
		yield* this.#arrItem;   // for...of 와 [...spread]
	}
}
```

- `*[Symbol.iterator]` 는 **제너레이터(Generator)** 메서드다 (`function*` + `yield`, C# 의 `yield return`). 객체를 `for...of` 로 돌 수 있게 한다. C# 의 `IEnumerable<T>` 에 해당한다.
- `Find` 의 콜백은 `T` 를 받으므로, `oHistory.Find((oEntry) => oEntry.biValue > 100n)` 에서 타입을 적지 않아도 `oEntry` 가 `IEntry` 인 것을 안다.
- 잘못된 크기는 사용자 입력이 아니라 프로그래머의 실수이므로 **던진다** (4절의 표).

```
> node lessons/05-generics/history.ko.ts
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

## 7. DevCalc 스텝 — Evaluate, 히스토리, ans

새 파일:

| 파일 | 내용 |
|---|---|
| [devcalc/src/core/Result.ts](../../devcalc/src/core/Result.ts) | `TResult<T, E>`, `Ok`, `Err`, `MapResult` |
| [devcalc/src/core/History.ts](../../devcalc/src/core/History.ts) | `CHistory<T>` (6절 + `Clear`) |
| [devcalc/src/core/Evaluate.ts](../../devcalc/src/core/Evaluate.ts) | `Evaluate(strExpr, oWord?, biAns?)` → `TResult<IEvaluation, IEvalError>` |
| [devcalc/tests/History.test.ts](../../devcalc/tests/History.test.ts) | 히스토리 순서, 크기, Find, Result 헬퍼 |
| [devcalc/tests/Evaluate.test.ts](../../devcalc/tests/Evaluate.test.ts) | 수식, 워드 크기, `ans`, 모든 종류의 에러 |

### 계산을 main.ts 밖으로

04강까지 [main.ts](../../devcalc/src/main.ts) 는 해석하고, 계산하고, **출력까지** 했다. 그 코드가 이제 `Evaluate()` 로 옮겨졌다. `Evaluate()` 는 **아무것도 출력하지 않고, 잘못된 입력에 예외를 던지지도 않는다**. 결과를 반환한다.

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
		throw e;   // 직접 만든 에러가 아님 : 버그
	}
}
```

`CCalculator` 는 안에서 여전히 `CCalcError` 를 던지고, `Evaluate` 가 경계(Boundary)에서 그것을 값으로 바꾼다. main.ts 는 출력만 한다. 07강의 웹 페이지는 같은 `Evaluate()` 를 호출하고 `console.log` 대신 HTML 로 보여 준다.

### `;` 와 `ans`

```ts
const oHistory = new CHistory<IEvaluation>(20);
...
const oResult = Evaluate(strOne, oWord, oHistory.Latest()?.biValue);   // ans = 직전 결과
if (oResult.bOk) {
	oHistory.Add(oResult.vValue);
}
```

`;` 로 나눈 여러 수식을 차례로 계산한다. `ans` 는 직전 결과다. 첫 에러에서 멈춘다 (뒤의 수식이 `ans` 에 기대고 있을 수 있으므로).

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

수식이 하나면 04강과 똑같이 출력한다 (`[1]` 머리글 없음).

테스트:

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

테스트가 `Evaluate()` 를 직접 호출한다. 프로세스를 띄우거나 출력을 가로챌 필요가 없다. 계산과 출력을 나눈 또 하나의 이유다.

## 정리

- `<T>` = "호출하는 쪽에서 정하는 타입". TS 가 추론한다. 추론할 수 없을 때나 인수를 검사하고 싶을 때만 적는다.
- `T extends X` 는 T 를 제한한다 (구조적, `where T : X` 와 비슷). `K extends keyof T` + `T[K]` 로 이름으로 프로퍼티 타입을 얻는다.
- 기본값: `<T = string>`. `const T` 는 리터럴 타입을 남긴다.
- `Array<T>`, `Map<K, V>`, `Set<T>`, `Record<K, V>`, `ReadonlyArray<T>`, `ReadonlyMap<K, V>` 로 C# 컬렉션 대부분을 대신한다.
- 제네릭은 지워진다. 실행 시점에는 클래스가 하나, `new T()` 도 `typeof(T)` 도 없다.
- `TResult<T, E>` 는 실패를 타입의 일부로 만든다. 버그에는 던지고, 사용자 입력에는 결과를 반환한다.
- 제너레이터 `*[Symbol.iterator]` 로 클래스를 `for...of` 에 쓸 수 있다.

**다음 → [06. 모듈과 비동기](../06-modules-async/README.ko.md)**: 코드를 모듈로 나누고 `import` / `export`, `Promise` 와 `async` / `await`, 파일과 클립보드를 다룬다. DevCalc 에 대화형 모드(`--repl`)와 `--copy` 가 생긴다.

---

[← 이전: 04. 클래스와 에러 처리](../04-classes-errors/README.ko.md) · [목차](../../README.ko.md) · [다음: 06. 모듈과 비동기 →](../06-modules-async/README.ko.md)
