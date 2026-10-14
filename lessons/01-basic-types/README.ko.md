[English](README.md) · **한국어**

[← 이전: 00. 개발 환경 구성](../00-setup/README.ko.md) · [목차](../../README.ko.md) · [다음: 02. 함수와 객체 →](../02-functions-objects/README.ko.md)

# 01. 기본 타입과 bigint — 진법 변환기 만들기 (DevCalc Lv1)

> 시리즈: DH.Study.TypeScript · 01강
> 환경: Node.js v24 · TypeScript 7 · VS Code

## 목표

이 강의를 마치면 다음을 할 수 있다.

- [ ] `const` / `let` 으로 변수를 선언하고, `var` 를 쓰지 않는 이유를 안다
- [ ] 변수에 타입을 표기(Type Annotation)하고, 표기를 생략해도 되는 경우(Type Inference)를 안다
- [ ] `number` 의 한계(2^53 - 1)를 설명하고, 큰 정수에는 `bigint` 를 쓴다
- [ ] `any` 와 `unknown` 의 차이, `void` 와 `never` 의 쓰임을 안다
- [ ] 배운 타입으로 진법 변환 함수(ToHex/ToBin/ToDec/ToBigInt)를 직접 만든다
- [ ] DevCalc 에 진법 변환 기능(ToHex/ToBin/ToDec)을 추가한다

## 이 강의의 목차

1. [변수 선언 — const / let, 타입 표기와 추론](#1-변수-선언--const--let-타입-표기와-추론)
2. [기본 타입 — C# 과 비교](#2-기본-타입--c-과-비교)
3. [number 의 함정](#3-number-의-함정)
4. [bigint](#4-bigint)
5. [any / unknown / void / never](#5-any--unknown--void--never)
6. [따라하기](#6-따라하기)
7. [직접 만들기 — 진법 변환 함수](#7-직접-만들기--진법-변환-함수)
8. [DevCalc 스텝 — Lv1 진법 변환기](#8-devcalc-스텝--lv1-진법-변환기)
9. [정리](#정리)

이 강의의 예제 파일: [variables.ko.ts](variables.ko.ts) · [primitives.ko.ts](primitives.ko.ts) · [bigint.ko.ts](bigint.ko.ts) · [special-types.ko.ts](special-types.ko.ts) · [convert.ko.ts](convert.ko.ts)

> 예제는 한국어 주석판(`x.ko.ts`)을 링크한다. 같은 코드의 영어 주석판은 `x.ts` 다.

> 문법 표시: **[JS]** = JavaScript 문법 (TS 없이도 있음) · **[TS]** = TypeScript 가 더한 타입 문법 (지우면 JS) · 자세한 구분은 [00강 7-3](../00-setup/README.ko.md#7-3-ts-문법--js-문법--타입-문법)

---

## 1. 변수 선언 — const / let, 타입 표기와 추론

```
키워드  이름     : 타입   = 값;
const  biMax64 : bigint = 0xffff_ffff_ffff_ffffn;
```

### 1-1. 키워드 3개

**[JS]**

| 키워드 | 재할당 | 범위(Scope) | 사용 |
|---|---|---|---|
| **`const`** | ✕ | 블록 `{ }` | **기본으로 이것** |
| **`let`** | ○ | 블록 `{ }` | 값이 바뀌어야 할 때만 |
| `var` | ○ | 함수 전체 | **쓰지 않는다** (옛 JS) |

```ts
const nMax = 10;
nMax = 20;            // ✕ TS2588: Cannot assign to 'nMax' because it is a constant.

let nCount = 0;
nCount = nCount + 1;  // ○
```

- `var` 를 쓰지 않는 이유: `{ }` 블록을 무시해서 반복문이 끝난 뒤에도 변수가 살아 있고, 선언보다 위에서 써도 오류 없이 `undefined` 가 된다(호이스팅, Hoisting).
- `let` / `const` 는 선언한 줄보다 위에서 쓰면 오류다 (`Cannot access ... before initialization`).
- `const` 는 **재할당만** 막는다. 배열/객체의 **내용**은 바뀔 수 있다 (`arrNum.push(3)` 은 OK, `arrNum = []` 은 ✕). C# 의 `const`(컴파일 타임 상수)보다 **readonly 참조**에 가깝다.

### 1-2. 타입 표기 (Type Annotation) 와 타입 추론 (Type Inference)

**[TS]**

```ts
const strName: string = "DevCalc";   // 타입 표기
const strVersion = "0.1.0";          // 타입 추론 → "0.1.0"
let strMode = "HEX";                 // 타입 추론 → string
let nLater: number;                  // 값 없이 선언 → 표기 필요
```

- 이름 뒤에 `: 타입` 을 붙인다. C# 의 `string strName = ...` 와 순서가 반대다.
- 값이 있으면 TS 가 타입을 알아서 정한다. C# 의 `var` 와 같은 개념이고, **대부분 표기를 생략한다.**
- `const` 는 값이 바뀌지 않으니 **값 자체가 타입**(리터럴 타입, Literal Type)이 된다: `const strBase = "HEX"` → `"HEX"`. `let` 은 바뀔 수 있으니 **넓은 타입**(Widening)이 된다: `let strMode = "HEX"` → `string`. 변수 위에 마우스를 올려(Hover) 확인해 보자.
- 표기가 꼭 필요한 곳: 값 없이 선언한 변수, 함수의 매개변수(Parameter), 공개 함수의 반환 타입(Return Type).

### 1-3. 구조 분해 (Destructuring) 선언

**[JS]**

```ts
const { strUser, nAge } = oPerson;   // 객체의 속성을 꺼내 변수 두 개를 한 번에
const [nFirst, nSecond] = [10, 20];  // 배열도 가능
```

## 2. 기본 타입 — C# 과 비교

| TypeScript | C# | 구분 | 비고 |
|---|---|---|---|
| `string` | `string` | JS | `"..."`, `'...'`, 템플릿 문자열 `` `값: ${n}` `` |
| `number` | `double` | JS | **정수/실수 구분 없음.** `int`, `long`, `float` 가 따로 없다 |
| `bigint` | `BigInteger` | JS | `255n` 처럼 끝에 `n`. 크기 제한 없는 정수 |
| `boolean` | `bool` | JS | |
| `null`, `undefined` | `null` | JS | 값이 없음을 나타내는 것이 **두 개** |
| `T[]`, `[T1, T2]` | `T[]`, `(T1, T2)` | JS + TS | 배열(Array)은 JS, 튜플(Tuple)은 TS (실행하면 그냥 배열) |
| `any` | `dynamic` | **TS** | 타입 검사를 끈다 |
| `unknown` | `object` | **TS** | 확인하기 전에는 쓸 수 없다 |
| `void` / `never` | `void` / — | **TS** | `never` 는 "절대 정상 종료하지 않음" |

> **JS** 인 타입은 실행 중에도 존재한다 (`typeof 1n === "bigint"`). **TS** 인 타입은 검사할 때만 있고 실행하면 사라진다.

## 3. number 의 함정

**[JS]**

```ts
0.1 + 0.2        // 0.30000000000000004
7 / 2            // 3.5   ← C# 의 int 나눗셈(3)과 다르다
2 ** 53 + 1      // 9007199254740992  ← 1 이 사라진다!
```

`number` 는 64비트 부동소수점(double)이라 정확한 정수는 `Number.MAX_SAFE_INTEGER`(2^53 - 1)까지만 표현한다.
개발자 계산기는 64비트 값(`0xFFFFFFFFFFFFFFFF`)을 다뤄야 하므로 `number` 로는 부족하다.

## 4. bigint

**[JS]** — 섞어 쓰는 실수를 미리 잡아 주는 것은 **[TS]**

```ts
const biMax64 = 0xffff_ffff_ffff_ffffn;   // 18446744073709551615n
biMax64.toString(16);                      // "ffffffffffffffff"
biMax64.toString(2);                       // "1111...1111" (64개)
7n / 2n;                                   // 3n  (정수 나눗셈)
```

- 리터럴 끝에 `n`. `_` 로 자릿수를 끊어 읽기 쉽게 할 수 있다.
- 타입은 `bigint` (`typeof 1n === "bigint"`). `const biOne = 1n` 은 리터럴 타입 `1n`, `let biTotal = 1n` 은 `bigint`.
- **정수만** 가능: `1.5n` 은 문법 오류.
- `toString(진법)` 으로 2/8/16진수 문자열을 만든다.
- **`number` 와 섞어 쓸 수 없다**:

```ts
const biWrong = 1n + 1;    // TS: 작성 즉시 빨간 줄 (biWrong 의 타입은 any) / JS: 실행 중 TypeError
const biRight = 1n + BigInt(1);
```

> 이것이 TypeScript 를 쓰는 이유의 좋은 예다. JS 라면 실행해 봐야 알 수 있는 오류를 **쓰는 순간** 알려 준다.

## 5. any / unknown / void / never

**[TS]**

```ts
const vAny: any = "hello";
vAny.toFixed;                    // 통과 (검사 안 함) → 실행하면 undefined

const vUnknown: unknown = JSON.parse("255");
vUnknown.toString(16);           // 오류: 먼저 무엇인지 확인해야 함
if (typeof vUnknown === "number") vUnknown.toString(16);   // OK
```

- 외부에서 들어온 값(JSON, 사용자 입력)은 `any` 대신 **`unknown`** 으로 받고 확인한 뒤 쓴다.
- `void`: 반환값이 없는 함수. `never`: 항상 예외를 던지거나 끝나지 않는 함수.

> 이름 규칙: 헝가리언 표기법(Hungarian Notation)에서 `any`/`unknown` 값은 `v`(variant) 접두어를 쓴다.

---

## 6. 따라하기

각 파일을 열고 `F5` 로 실행하거나, 명령줄에서 실행한다. 실행할 수 없는 환경이라면 아래 실행 결과를 보며 코드를 읽어도 된다.

### [variables.ko.ts](variables.ko.ts) — const / let / var, 표기·추론, 구조 분해

```
> node lessons/01-basic-types/variables.ko.ts
1) const nMax = 10 / let nCount = 1
2) Expected error: Assignment to constant variable.
   Why : a const can't be given a new value.
   Fix : use let when the value must change.
3) const arrNum after push(3) = [ 1, 2, 3 ]
4) DevCalc HEX DEC 2n / typeof 1n = bigint
5) nLater = 5
6) Hong 30 10 20
7) Expected error: Cannot access 'nEarly' before initialization
   Why : let/const exist only from their declaration line down.
   Fix : declare first, then use.
8) var nIdx after the loop = 3 (still alive outside the loop)
```

해 볼 것: `strBase`, `strMode`, `biOne`, `biTotal` 에 마우스를 올려 리터럴 타입과 넓은 타입 비교. `// nMax = 20;` 주석을 풀어 빨간 줄 확인.

### [primitives.ko.ts](primitives.ko.ts) — 타입 표기·추론, number, 배열·튜플

```
> node lessons/01-basic-types/primitives.ko.ts
0.1 + 0.2 = 0.30000000000000004
7 / 2 = 3.5
Math.trunc(7 / 2) = 3
0xff = 255 / hex: ff / bin: 11111111
[ 8, 16, 32, 64 ] [ 'WORD', 16 ]
first bits x 2: 16
DevCalc 0.1.0 64 true 1
```

해 볼 것: `nCount = "1";` 주석을 풀어 빨간 줄 확인, 변수 위에 마우스를 올려 추론된 타입(Hover) 확인.

### [bigint.ko.ts](bigint.ko.ts) — bigint, number 와 섞으면?

```
> node lessons/01-basic-types/bigint.ko.ts
MAX_SAFE_INTEGER = 9007199254740991
2^53 + 1 = 9007199254740992
64-bit max = 18446744073709551615n
hex = ffffffffffffffff
2^53 + 1 = 9007199254740993n
7n / 2n = 3n
Expected error: Cannot mix BigInt and other types, use explicit conversions
Why : number and bigint can't be mixed in one operation.
Fix : 1n + BigInt(1) = 2n / Number(1n) + 1 = 2
```

`TypeError` 는 **일부러** 낸 오류다. 예제가 `try`/`catch` 로 잡아서 이유와 해결 방법을 출력한다. `// @ts-expect-error` 를 지우면 에디터가 미리 빨간 줄로 알려 준다.

### [special-types.ko.ts](special-types.ko.ts) — any, unknown, null, void, never

```
> node lessons/01-basic-types/special-types.ko.ts
undefined
hex: ff
now it has a value
void function called
caught: a never function always throws
```

## 7. 직접 만들기 — 진법 변환 함수

**[JS + TS]** — 함수 본문은 JS, `: bigint` / `: string` 표기는 TS

배운 타입으로 DevCalc 의 첫 부품을 만든다. 전체 코드는 [convert.ko.ts](convert.ko.ts).

### ToHex : 255n → "0xFF"

```ts
function ToHex(biValue: bigint): string {
	const strSign = biValue < 0n ? "-" : "";            // 부호는 따로 떼어 맨 앞에
	const biAbs = biValue < 0n ? -biValue : biValue;    // 절댓값
	return `${strSign}0x${biAbs.toString(16).toUpperCase()}`;
}
```

- 매개변수 `biValue: bigint`, 반환 `: string` — 함수에는 타입을 표기한다.
- `0n` 처럼 **bigint 끼리** 비교한다. `biValue < 0` 도 동작은 하지만 bigint 코드에서는 `0n` 으로 맞추는 것이 읽기 좋다.
- 음수를 그대로 `toString(16)` 하면 `"-ff"` 가 되어 접두어 위치가 어색하므로 부호를 분리했다.

### ToBin, ToDec

```ts
function ToBin(biValue: bigint): string { ... `${strSign}0b${biAbs.toString(2)}` ... }
function ToDec(biValue: bigint): string { return biValue.toString(10); }
```

`ToBin` 은 `ToHex` 와 진법·접두어만 다르다. 이 중복은 DevCalc 스텝에서 하나로 묶는다.

### ToBigInt : number → bigint

```ts
function ToBigInt(nValue: number): bigint {
	if (!Number.isSafeInteger(nValue)) {
		throw new RangeError(`Not a safe integer: ${nValue}`);
	}
	return BigInt(nValue);
}
```

- `1.5`, `NaN`, `Infinity`, `2 ** 53` 은 정확한 정수가 아니므로 거부한다.
- 3장의 "number 의 함정"을 코드로 막는 방법이다.

### 실행

```
> node lessons/01-basic-types/convert.ko.ts
                 255 |                0xFF | 0b11111111
                   0 |                 0x0 | 0b0
                -255 |               -0xFF | -0b11111111
18446744073709551615 |  0xFFFFFFFFFFFFFFFF | 0b1111...1111
255n
Expected error: Not a safe integer: 1.5
Why : 1.5 is not an integer, so it can't become a bigint.
```

> `ToBigInt(1.5)` 줄에 중단점(Breakpoint)을 걸고 `F11` 로 함수 안에 들어가 `nValue` 값을 확인해 보자.

## 8. DevCalc 스텝 — Lv1 진법 변환기

7장에서 만든 함수를 [devcalc/src/core/Format.ts](../../devcalc/src/core/Format.ts) 로 옮겼다. 중복되는 부호 처리는 `FormatRadix` 하나로 묶었다.

```ts
function FormatRadix(biValue: bigint, nRadix: number, strPrefix: string): string {
	const strSign = biValue < 0n ? "-" : "";
	const biAbs = biValue < 0n ? -biValue : biValue;
	return `${strSign}${strPrefix}${biAbs.toString(nRadix).toUpperCase()}`;
}
export function ToHex(biValue: bigint): string { return FormatRadix(biValue, 16, "0x"); }
```

실행:

```
> node devcalc/src/main.ts 255
HEX : 0xFF
DEC : 255
BIN : 0b11111111
```

> 지금은 입력 해석을 `BigInt("255")` 에 맡긴다. 03강에서 `0xFF`, `0b1010`, `1_000` 을 직접 해석하는 함수로 바꾼다.

## 정리

- 변수는 `const` 가 기본, 바뀌어야 하면 `let`. `var` 는 쓰지 않는다.
- 타입은 이름 뒤 `: 타입`. 값이 있으면 대부분 추론에 맡긴다.
- `number` 는 double 하나뿐이고, 2^53 - 1 을 넘는 정수는 `bigint` 로 다룬다.
- `bigint` 와 `number` 는 섞을 수 없다. TS 는 이 실수를 실행 전에 잡아 준다.
- 외부 값은 `unknown` 으로 받는다. `any` 는 피한다.

**다음 강의 → [02. 함수와 객체](../02-functions-objects/README.ko.md)**: 함수 타입, 선택적 매개변수(Optional Parameter), `interface` 와 `type`. DevCalc 에는 자릿수 묶기(`0xFFFF_FFFF`)와 출력 옵션을 추가한다.

---

[← 이전: 00. 개발 환경 구성](../00-setup/README.ko.md) · [목차](../../README.ko.md) · [다음: 02. 함수와 객체 →](../02-functions-objects/README.ko.md)
