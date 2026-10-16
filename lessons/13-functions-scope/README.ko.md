[English](README.md) · **한국어**

[← 이전: 12. bigint 와 고정 크기 워드](../12-bigint-words/README.ko.md) · [목차](../../README.ko.md) · [다음: 14. DOM 심화 →](../14-events-accessibility/README.ko.md)

# 13. 함수 표와 스코프 — 내장 함수와 변수

> 시리즈: DH.Study.TypeScript · 13강 (2부)
> 환경: Node.js v24 · TypeScript 7 · Vitest 5 · VS Code

## 목표

이 강의를 마치면 다음을 할 수 있다.

- [ ] 오버로드(Overload)를 쓰고, 함수 타입에서 `.length`, "매개변수가 더 적은 함수", `void` 콜백(Callback)이 무슨 뜻인지 말한다
- [ ] 인자 개수가 다른 함수들의 표에 타입을 붙인다 (`satisfies` 아래의 구별된 유니온(Discriminated union))
- [ ] 일반 객체가 왜 위험한 사전(Dictionary)인지 (`toString`, `__proto__`, `in`) 설명하고, 언제 `Map`, `Object.hasOwn`, `ReadonlyMap` 을 쓸지 고른다
- [ ] 블록 스코프(Block scope), 끌어올림(Hoisting), 일시적 사각지대(Temporal dead zone), 반복문 안의 클로저(Closure), 가리기(Shadowing)의 결과를 미리 맞힌다
- [ ] DevCalc 의 내장 함수(`popcount(x)`, `rol(x, n)`, …)와 변수(`mask = 0xFF00`)를 쓴다

## 이 강의의 목차

1. [함수 타입 깊이 보기](#1-함수-타입-깊이-보기)
2. [Map 인가 객체인가](#2-map-인가-객체인가)
3. [스코프와 클로저](#3-스코프와-클로저)
4. [따라하기](#4-따라하기)
5. [직접 만들기 — 작은 명령 실행기](#5-직접-만들기--작은-명령-실행기)
6. [DevCalc 스텝 — Lv8 함수와 변수](#6-devcalc-스텝--lv8-함수와-변수)
7. [정리](#정리)
8. [다음으로 갈 곳](#다음으로-갈-곳)

이 강의의 예제 파일: [functions.ko.ts](functions.ko.ts) · [maps.ko.ts](maps.ko.ts) · [scope.ko.ts](scope.ko.ts) · [calls.ko.ts](calls.ko.ts)

> 예제는 한국어 주석판(`x.ko.ts`)을 링크한다. 같은 코드의 영어 주석판은 `x.ts` 다.

> 문법 표시: **[JS]** = JavaScript 문법 (TS 없이도 있음) · **[TS]** = TypeScript 가 더한 타입 문법 (지우면 JS) · 자세한 구분은 [00강 7-3](../00-setup/README.ko.md#7-3-ts-문법--js-문법--타입-문법)

02강에서 함수의 기본을 봤다: 함수 선언, 화살표 함수, 선택 매개변수와 나머지 매개변수, 클로저. 개발자가 하루 종일 켜 두는 계산기에는 조금 더 필요하다: 이름이 있고 (`popcount`, `rol`) 인자 개수가 서로 다른 함수, 그리고 마스크나 주소를 줄과 줄 사이에 보관하는 변수. 즉 함수의 표, 이름을 보관할 곳, 그리고 각 이름이 어디에 사는지에 대한 분명한 이해다. 강의 끝에는 이렇게 된다:

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

## 1. 함수 타입 깊이 보기

### 1-1. 오버로드

**[TS]** 함수 하나가 여러 호출 모양을 제공할 수 있다. 모양들을 (본문 없이) 나열하고, 그 모두를 덮는 시그니처(Signature)로 본문 하나를 쓴다:

```ts
function Describe(): string;                              // 모양 1
function Describe(strName: string): string | undefined;  // 모양 2
function Describe(strName?: string): string | undefined { // 본문 : 호출하는 쪽에는 이 줄이 보이지 않음
	...
}
const strAll: string = Describe();   // 모양 1 : string, undefined 검사 불필요
const strOne = Describe("rol");      // 모양 2 : string | undefined
```

핵심은 반환 타입이다: 이름 없이 부른 `Describe()` 는 항상 목록을 돌려주므로, 호출하는 쪽은 `string | undefined` 가 아니라 `string` 을 받는다. 시그니처가 `(strName?: string): string | undefined` 하나뿐이면, 그럴 일이 없는 경우에도 모든 호출하는 쪽이 `undefined` 를 검사해야 한다.

어느 모양에도 맞지 않는 호출이면 TS 는 가장 가까운 모양을 기준으로 알려 준다: `Describe(1, 2)` → TS2554 `Expected 0-1 arguments, but got 2`, `Describe(42)` → TS2345 (42 는 `string` 이 아님).

> 오버로드도 다른 타입처럼 지워진다: JavaScript 에게는 함수 하나뿐이다. 반환 타입이 바뀌지 않으면 유니온이나 선택 매개변수를 쓰고, 바뀔 때 오버로드를 쓴다.

### 1-2. 인자 개수와 `.length`

**[JS]** 함수의 `.length` 는 첫 기본값(Default) 매개변수나 나머지(Rest) 매개변수 앞까지의 매개변수 개수다:

| 함수 | `.length` |
|---|---|
| `Rol(biX, biN)` | 2 |
| `Align(biX, biN = 16n)` | 1 |
| `Min(...arrValue)` | 0 |

그래서 `.length` 로는 "2 개 이상 받음" 을 알 수 없다. DevCalc 의 표는 대신 인자 개수(Arity)를 직접 적는다: `nMinArgs` 와 `nMaxArgs` (`min`, `max` 는 `Infinity`).

### 1-3. 매개변수가 더 적어도 된다

**[TS]** 매개변수가 더 적은 함수는 인자를 더 많이 넘기는 자리에 쓸 수 있다. 남는 인자는 무시된다. `forEach` 는 인자를 세 개 넘기는데도 `arr.forEach((x) => …)` 가 되는 이유다:

```ts
type TVisit = (biValue: bigint, nIndex: number, arrAll: readonly bigint[]) => void;
const fnPrint: TVisit = (biValue) => console.log(biValue); // 문제없음
```

반대는 오류다: 인자가 두 개 필요한 함수는 하나만 넘기는 자리에 쓸 수 없다 (TS2322).

### 1-4. `void` 콜백

**[TS]** `=> void` 타입의 콜백도 값을 반환할 수 있다. 호출하는 쪽이 그 값을 무시하겠다고 약속한 것이다. `push` 가 숫자를 반환해도 `[3n, 4n].forEach((biValue) => arrSeen.push(biValue))` 는 컴파일된다.

### 1-5. 인자 개수가 다른 함수들의 표

DevCalc 함수 표의 모양이 이것이다: 함수마다 행 하나, 그리고 행마다 `fnApply` 가 받는 인자 개수가 다르다. 구별된 유니온이 행마다 매개변수 타입을 정해 준다:

```ts
interface IUnary  { readonly nArgs: 1; readonly fnApply: (biX: bigint) => bigint; }
interface IBinary { readonly nArgs: 2; readonly fnApply: (biX: bigint, biN: bigint) => bigint; }

const TABLE = {
	neg: { nArgs: 1, fnApply: (biX) => -biX },          // biX : bigint
	shl: { nArgs: 2, fnApply: (biX, biN) => biX << biN }, // biX, biN : bigint
} satisfies Record<string, IUnary | IBinary>;
```

`satisfies` (12강) 가 각 행을 유니온과 대조하고, `nArgs: 1` 이냐 `nArgs: 2` 냐가 멤버를 고르므로, 화살표 함수에 매개변수 타입을 적지 않아도 된다. 표를 통해 호출할 때는 `oSpec.nArgs === 1` 이 `oSpec` 을 `IUnary` 로 좁힌다(Narrowing).

TS 가 검사할 수 없는 것은 사용자다: 계산기에 입력한 `shl(1)` 은 값이 하나뿐인 목록으로 들어온다. 호출하기 전에 개수를 검사한다. [functions.ko.ts](functions.ko.ts) 6번이 검사하지 않으면 무슨 일이 생기는지 보여 준다: `1n << undefined` 가 `TypeError: Cannot mix BigInt and other types` 를 던진다.

---

## 2. Map 인가 객체인가

### 2-1. 일반 객체에는 이미 키가 있다

**[JS]** `{}` 는 `Object.prototype` 을 물려받으므로 `toString`, `constructor`, `hasOwnProperty`, … 를 이미 "가지고" 있다. 객체로 단어 수를 세면:

```ts
const oCount: Record<string, number> = {};
oCount[strWord] = (oCount[strWord] ?? 0) + 1;
```

`"constructor"` 에서 `oCount["constructor"]` 는 `undefined` 가 아니라 `Object` 함수이므로 `?? 0` 이 아무 일도 하지 않고, `함수 + 1` 은 문자열 `"function Object() { [native code] }1"` 이 된다.

### 2-2. `in` 과 `Object.hasOwn`

**[JS]** `"toString" in oVar` 는 어떤 객체든 `true` 다 — `in` 은 프로토타입 체인(Prototype chain)까지 찾는다. `Object.hasOwn(oVar, "toString")` 은 객체 자신의 키만 보고 `false` 라고 답한다. DevCalc 의 `IsFunction` 은 `Object.hasOwn` 을 쓰므로 `toString(1)` 은 "함수가 아님" 이다.

### 2-3. `__proto__` 와 `Object.create(null)`

**[JS]** `oNames["__proto__"] = 5` 는 키를 추가하지 않는다: `__proto__` 는 프로토타입을 바꾸는 세터(Setter)이고, 숫자는 조용히 무시된다. `Object.create(null)` 은 프로토타입이 없는 객체를 만들어 `toString` 과 `__proto__` 도 보통 키가 된다 — 더 안전하지만 여전히 문자열 키만 되고, 잊기 쉽다.

### 2-4. Map

**[JS]** 이 용도로 만든 것이 `Map` 이다:

| | 객체 `{}` | `Map` |
|---|---|---|
| 키 | 문자열 (과 심볼) | 무엇이든 |
| 내장 키 | `toString`, `constructor`, `__proto__`, … | 없음 |
| 크기 | `Object.keys(o).length` | `map.size` |
| 순서 | 정수 같은 키 먼저, 그다음 넣은 순서 | 넣은 순서 |
| 없는 키 | `undefined` (프로토타입에 없을 때만) | `undefined` |
| JSON | `JSON.stringify` 가능 | `[...map]` 이나 `Object.fromEntries` 필요 |

이미 있는 키에 값을 넣으면 값만 바뀌고 위치는 그대로다 — DevCalc 의 `vars` 가 변수를 처음 넣은 순서대로 보여 주는 이유다.

### 2-5. `get()` 은 `undefined` 일 수 있다, 그리고 `ReadonlyMap`

**[TS]** `Map<string, bigint>.get()` 은 `bigint | undefined` 를 반환한다. 검사 없이 쓰면 TS 가 막는다 (TS18048 `'biMask' is possibly 'undefined'`). non-null 단언(Assertion) `!` 은 이 검사를 끈다 — 그러면 철자가 틀린 이름은 실행 중에 실패한다 ([maps.ko.ts](maps.ko.ts) 8번).

`ReadonlyMap<K, V>` 는 `set`, `delete`, `clear` 가 없는 `Map` 타입이다. `ReadonlyMap` 을 받는 함수는 그것을 바꾸지 않겠다고 약속하는 것이다. DevCalc 의 `Evaluate` 가 바로 그렇게 한다.

키는 `===` 로 비교하므로 `"Mask"` 와 `"mask"` 는 다른 키 두 개다. 이름이 들어오는 곳에서 한 번 정규화(Normalize)한다 (DevCalc: 파서에서 소문자로).

---

## 3. 스코프와 클로저

### 3-1. 블록 스코프

**[JS]** `let` 과 `const` 는 자기를 선언한 `{ }` 블록 안에서만 산다. 밖에서는 그 이름이 없다 (TS2304 `Cannot find name`). 01강에서 `var` 가 블록을 무시한다는 것을 봤다. 그것이 어디서 문제가 되는지는 3-4 에서 본다.

### 3-2. 끌어올림과 일시적 사각지대

**[JS]** `function` 선언은 끌어올려진다(Hoisting): 선언 줄보다 위에서도 호출할 수 있다. `const` (나 `let`) 도 블록 시작부터 존재하지만, 그 줄이 실행될 때까지는 값이 없다. 그 전에 읽으면 `ReferenceError` 다 — 이것이 **일시적 사각지대(Temporal dead zone)** 다.

```ts
console.log(Twice(21));        // 문제없음 : 함수 선언
console.log(Half(42));         // TS2448 : Block-scoped variable 'Half' used before its declaration
const Half = (nValue: number): number => nValue / 2;
```

TS 는 위에서 아래로 읽는 코드에서만 이것을 잡는다. 함수 안에서는 그 함수가 언제 호출될지 TS 가 알 수 없다:

```ts
function ReadMax(): number {
	return MAX_LEVEL;          // TS 오류 없음
}
ReadMax();                     // ReferenceError: Cannot access 'MAX_LEVEL' before initialization
const MAX_LEVEL = 100;
```

상수는 파일 맨 위, 실행되는 코드보다 위에 둔다.

### 3-3. 확실한 할당

**[TS]** 값 없이 선언한 `let strMode: string;` 은 읽기 전에 모든 경로에서 값을 받아야 한다(Definite assignment). `if` 한 곳에서만 값을 넣으면 읽는 줄이 TS2454 `Variable 'strMode' is used before being assigned` 다.

### 3-4. 반복문 안의 클로저

**[JS]** 클로저는 그때의 값이 아니라 변수 자체를 붙잡는다. `var` 는 반복문 전체에 변수 하나를 만들고, `let` 은 회차마다 새 변수를 만든다:

```ts
for (var nOld = 0; nOld < 3; nOld++) arrVar.push(() => nOld); // 3 3 3
for (let nNew = 0; nNew < 3; nNew++) arrLet.push(() => nNew); // 0 1 2
```

이 고전적인 버그는 반복문에서 만든 이벤트 처리기(Event handler)에서 나타난다 — 14강은 반복문으로 비트마다 버튼을 하나씩 만든다.

### 3-5. 숨긴 상태

**[JS]** 클로저는 상태를 숨기는 가장 오래된 방법이다. `MakeCounter` 밖에서는 아무도 `nCount` 에 닿을 수 없고 `Next` 와 `Reset` 만 닿는다. `MakeCounter` 를 부를 때마다 자기만의 `nCount` 가 생긴다:

```ts
function MakeCounter(nStart: number): { Next: () => number; Reset: () => void } {
	let nCount = nStart;
	return { Next: () => nCount++, Reset: () => { nCount = nStart; } };
}
```

04강의 `#private` 필드는 클래스 안에서 같은 일을 한다.

### 3-6. 가리기

**[JS]** 같은 이름의 안쪽 선언은 그 블록 안에서 바깥 이름을 가린다(Shadowing). 문법상 문제없지만 "분명히 바꿨는데!" 버그의 흔한 원인이다. 다른 이름을 쓰는 편이 낫다.

---

## 4. 따라하기

### [functions.ko.ts](functions.ko.ts) — 오버로드, .length, 더 적은 매개변수, void 콜백, 타입 있는 표

```
> node lessons/13-functions-scope/functions.ko.ts
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

해 볼 것:

- `Describe(1, 2);` 앞의 `//` 를 지우면 → TS2554, `Describe(42);` 앞의 `//` 를 지우면 → TS2345.
- `Rol(1n);` 앞의 `//` 를 지우면 → TS2554 `Expected 2 arguments, but got 1`.
- `const fnTooMany …` 앞의 `//` 를 지우면 → TS2322: 인자가 두 개 필요한 함수는 하나만 넘기는 타입에 맞지 않는다.
- `Describe` 본문 위의 오버로드 두 줄을 지우면 → `const strAll: string = Describe();` 가 TS2322 가 된다. 남은 시그니처 하나가 `string | undefined` 를 반환하기 때문이다.

### [maps.ko.ts](maps.ko.ts) — 프로토타입 키, in 과 hasOwn, __proto__, Map, get() 과 undefined

```
> node lessons/13-functions-scope/maps.ko.ts
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

해 볼 것:

- `const biBad: bigint = …` 앞의 `//` 를 지우면 → TS2322, `console.log(biMask + 1n);` 앞의 `//` 를 지우면 → TS18048.
- `mapRead.set("x", 1n);` 앞의 `//` 를 지우면 → TS2339: `ReadonlyMap` 에는 `set` 이 없다.
- 1번의 `Record<string, number>` 와 `{}` 를 `Map` 과 `get`/`set` 으로 바꾸면 → `constructor` 도 다른 단어처럼 1 로 세어진다.

### [scope.ko.ts](scope.ko.ts) — 블록 스코프, 끌어올림, 확실한 할당, 반복문 클로저, 숨긴 상태, 가리기

```
> node lessons/13-functions-scope/scope.ko.ts
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

해 볼 것:

- `console.log(strInside);` 앞의 `//` 를 지우면 → TS2304, `console.log(Half(42));` 앞은 → TS2448, `console.log(strMode);` 앞은 → TS2454.
- `const MAX_LEVEL = 100;` 을 `function ReadMax` 위로 옮기면 → 7번이 100 을 출력한다.
- `var nOld` 를 `let nOld` 로 바꾸면 → 두 목록 모두 `0 1 2` 를 출력한다.

---

## 5. 직접 만들기 — 작은 명령 실행기

[calls.ko.ts](calls.ko.ts) 는 DevCalc 의 새 기능을 파서 없이 100 줄로 줄인 것이다: 인자 개수가 적힌 함수 표, `Map` 에 담은 변수, 오버로드된 `Help`.

```ts
interface IFunctionSpec {
	readonly strUsage: string;
	readonly nMinArgs: number;
	readonly nMaxArgs: number; // Infinity : 개수 제한 없음
	readonly fnApply: (...arrArg: bigint[]) => bigint;
}

const FUNCTIONS = {
	popcount: { strUsage: "popcount(x)", nMinArgs: 1, nMaxArgs: 1, fnApply: (biX) => … },
	rol8: { strUsage: "rol8(x, n)", nMinArgs: 2, nMaxArgs: 2, fnApply: (biX, biN) => … },
	max: { strUsage: "max(a, b, ...)", nMinArgs: 2, nMaxArgs: Infinity, fnApply: (...arrArg) => … },
} satisfies Record<string, IFunctionSpec>;

function IsFunction(strName: string): strName is TFunction {
	return Object.hasOwn(FUNCTIONS, strName); // "in" 이 아님 : 여기서 toString 은 함수가 아님
}
```

- 표 하나에 함수에 필요한 모든 것이 있다: 도움말과 오류 메시지용 사용법, 인자 개수 범위, 그리고 코드.
- `IsFunction` 은 타입 가드(Type guard, 03강)이면서 2장의 프로토타입 함정도 피한다.
- 대입은 오른쪽을 먼저 계산한다. 거기서 예외가 나면 변수는 설정되지 않는다.

### 실행

```
> node lessons/13-functions-scope/calls.ko.ts
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

해 볼 것:

- 행 `bit: { strUsage: "bit(n)", nMinArgs: 1, nMaxArgs: 1, fnApply: (biN) => 1n << biN }` 을 추가하면 → `help` 에 나오고, 다른 곳을 고치지 않아도 `bit(4)` 가 동작한다.
- `Help(1);` 앞의 `//` 를 지우면 → TS2345.
- `Object.hasOwn(FUNCTIONS, strName)` 을 `strName in FUNCTIONS` 로 바꾸면 → `toString(1)` 이 검사를 통과하고, 나중에 덜 친절한 메시지로 실패한다.

---

## 6. DevCalc 스텝 — Lv8 함수와 변수

### 바뀐 것

| 파일 | 변경 |
|---|---|
| `devcalc/src/core/Functions.ts` | 새 파일: `FUNCTION_TABLE` (함수 12 개), `IsFunction`, `CheckArgCount`, `FunctionUsage`, `CallFunction`, `FunctionHelp` (오버로드) |
| `devcalc/src/core/Lexer.ts` | 모든 이름이 `name` 토큰 (`ans` 만이 아님). 새 토큰 `assign` (`=`), `comma` (`,`) |
| `devcalc/src/core/Parser.ts` | `statement = [ name "=" ] expression`. 새 노드 `variable`, `call`, `assign`. `CParseError` 가 자기 해결 방법을 가짐 |
| `devcalc/src/core/Evaluate.ts` | `IWalkContext` (매개변수 여러 개 대신 객체 하나). 함수 호출. `ReadonlyMap` 에서 읽는 변수. 대입은 `strAssign` 을 반환 |
| `devcalc/src/core/index.ts` | 함수 관련 내보내기 |
| `devcalc/src/main.ts` | `mapVar` 가 변수를 보관. REPL `vars` 와 `help <함수>`. 사용법과 도움말에 함수 목록 |
| `devcalc/web/App.ts`, `index.html` | 페이지도 변수를 보관. 제목 `Lv8` |
| `devcalc/tests/Functions.test.ts` | 새 파일 |
| `devcalc/tests/Parser.test.ts`, `Evaluate.test.ts`, `Cli.test.ts` | 함수 호출, 이름, 변수, REPL |

### 함수 표

```
abs min max bit popcount clz ctz log2 bswap rol ror align
```

행마다 `IWordFunction` (`bNeedsWord: true`: `clz`, `bswap`, `rol`, `ror` 는 고정 워드에서만 의미가 있음) 이거나 `IAnyFunction` 이다. 행은 `satisfies Record<string, TFunctionSpec>` 으로 검사되므로, `bNeedsWord: true` 인 행의 `fnApply` 는 절대 `undefined` 가 아닌 `oWord: CWordSize` 를 받는다:

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

`CallFunction` 은 개수를 검사하고, 인자를 워드 크기로 자르고, 워드 크기 없이 `bNeedsWord` 행을 부르면 아래에 나오는 오류를 던진다. `oSpec.bNeedsWord` 로 좁히기 때문에 `fnApply(oWord, …)` 를 올바른 타입으로 부를 수 있다.

`FunctionHelp` 는 1-1 의 `Describe` 처럼 오버로드가 두 개다: `FunctionHelp()` 는 모든 이름 (`string`), `FunctionHelp("rol")` 은 한 줄 또는 `undefined` 를 반환한다.

### 이름 : `ans`, 변수, 함수

렉서(Lexer)는 이제 이름이 무엇인지 정하지 않고 `name` 토큰만 낸다. 파서가 뒤에 오는 것을 보고 정한다:

| 입력 | 노드 |
|---|---|
| `ans` | `ans` (이전과 같음) |
| `popcount(` … `)` | `call` — 이름이 표에 있어야 하고, 인자 개수가 맞아야 함 |
| `mask` | `variable` |
| 맨 앞의 `mask =` | `assign` |

이름은 대소문자를 가리지 않는다 (`POPCOUNT(MASK)` 도 됨). 파서가 소문자로 저장한다 — 2-5 의 "들어오는 곳에서 정규화". `ans` 와 함수 이름에는 대입할 수 없다.

### Evaluate 는 읽고, 호출한 쪽이 보관한다

```ts
export function Evaluate(strExpr: string, oWord?: CWordSize, biAns?: bigint, mapVar: ReadonlyMap<string, bigint> = new Map()): TEvalResult
```

`Evaluate` 는 변수를 `ReadonlyMap` 으로 받고 절대 바꾸지 않는다. `mask = 0xFF00` 이면 값과 함께 `strAssign: "mask"` 를 반환하고, `set` 은 `main.ts` (또는 웹 페이지) 가 한다. 프로그램마다 `Map` 하나가 실행되는 동안 살아 있고, 테스트는 자기만의 작은 `Map` 을 넘긴다.

안에서는 트리를 도는(Walk) 모든 단계가 계산기, 워드 크기, `ans`, 변수를 필요로 한다. 재귀 호출마다 매개변수 네 개를 넘기는 대신, 객체 하나 `IWalkContext` 에 담아 넘긴다.

### 새 출력

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

함수 결과가 워드에 맞지 않으면 다른 계산처럼 넘침(Overflow)이다:

```
> node devcalc/src/main.ts "align(250, 16)" --bits=8
HEX : 0x00
DEC : 0
BIN : 0b0000_0000
INT : 0 (8-bit signed)
Note: 256 does not fit in 8 bits (BYTE), so it wrapped to 0.
```

실수에는 여전히 Why 와 Fix 가 따라온다:

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

REPL 에서는 변수가 `exit` 할 때까지 살아 있다:

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

> 왜 `>>>` 인가? 16 비트 워드에서 `0xFF00` 은 음수 (INT -256) 이고, `>>` 는 부호를 유지한다 (11강): `mask >> 8` 은 `0xFFFF` 다. `>>>` 는 0 을 밀어 넣는다.

### 확인한 것

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
	assert.equal(ValueOf(Evaluate("MASK >> 8", undefined, undefined, mapVar)), 0xffn); // 이름은 대소문자 무시
	...
	// Evaluate 는 맵을 읽기만 함 : 대입 결과가 돌아오고, 보관은 호출한 쪽이 함
	const oResult = Evaluate("x = mask | 1", undefined, undefined, mapVar);
	assert.ok(oResult.bOk);
	assert.equal(oResult.vValue.strAssign, "x");
	assert.equal(mapVar.has("x"), false);
});
```

해 볼 것:

- `FUNCTION_TABLE` 에 행을 하나 추가하면 (예: `parity(x)` : `popcount(x) & 1`) → 파서, `help`, 오류 메시지가 바로 그 함수를 안다.
- 한 행의 `bNeedsWord` 를 `true` 에서 `false` 로 바꾸면 → 그 행의 `fnApply` 가 더 이상 컴파일되지 않는다. 이제 `oWord` 가 `undefined` 일 수 있기 때문이다.
- 웹 페이지 (`npm run web`) 에서 `mask = 0xFF00` 을 입력하고, 이어서 `mask >>> 4` 를 입력해 본다.

---

## 정리

- **[TS]** 오버로드는 호출 모양마다 다른 반환 타입을 준다. 매개변수가 더 적은 함수는 인자를 더 넘기는 타입에 맞고, `void` 콜백은 값을 반환해도 된다.
- **[TS]** 인자 개수가 다른 함수들의 표는 `satisfies` 아래의 구별된 유니온이다: 각 행의 매개변수는 맞는 멤버에서 타입을 받는다. 사용자가 넣은 인자 개수는 여전히 실행 중에 검사해야 한다.
- **[JS]** 일반 객체는 `toString`, `constructor`, `__proto__` 를 물려받는다. `in` 은 그것들을 보고, `Object.hasOwn` 은 보지 않는다. 사용자가 정하는 이름에는 `Map` 을 쓴다. **[TS]** `get()` 은 `T | undefined` 이고, `ReadonlyMap` 은 바꾸지 않겠다는 약속이다.
- **[JS]** `let`/`const` 는 블록 스코프이고 그 줄이 실행될 때까지 일시적 사각지대에 있다. 함수 선언은 끌어올려진다. 클로저는 변수를 붙잡는다: 반복문의 `var` 는 변수 하나, `let` 은 회차마다 하나.
- DevCalc Lv8: 표 하나에서 나오는 내장 함수 12 개, 변수 (`mask = 0xFF00`, `vars`), `help rol`. `Evaluate` 는 `ReadonlyMap` 을 읽고 `strAssign` 을 반환하며, 변수 보관은 호출한 쪽이 한다.

## 다음으로 갈 곳

[14강](../14-events-accessibility/README.ko.md) 은 웹 페이지로 돌아간다: 클릭할 수 있는 비트 그리드를 위한 이벤트 위임(Event delegation), 키보드 (Enter, Esc, 화살표 키), 포커스(Focus), 그리고 `aria-*` 를 쓰는 접근성(Accessibility).

---

[← 이전: 12. bigint 와 고정 크기 워드](../12-bigint-words/README.ko.md) · [목차](../../README.ko.md) · [다음: 14. DOM 심화 →](../14-events-accessibility/README.ko.md)
