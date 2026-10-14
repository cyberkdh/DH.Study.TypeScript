[English](README.md) · **한국어**

[← 이전: 00. 개발 환경 구성](../00-setup/README.ko.md) · [목차](../../README.ko.md) · 다음: 02. 함수와 객체 (준비 중)

# 01. 기본 타입과 bigint — 진법 변환기 만들기 (DevCalc Lv1)

> 시리즈: DH.Study.TypeScript · 01강
> 환경: Node.js v24 · TypeScript 7 · VS Code

## 목표

이 강의를 마치면 다음을 할 수 있다.

- [ ] 변수에 타입을 표기(Type Annotation)하고, 표기를 생략해도 되는 경우(Type Inference)를 안다
- [ ] `number` 의 한계(2^53 - 1)를 설명하고, 큰 정수에는 `bigint` 를 쓴다
- [ ] `any` 와 `unknown` 의 차이, `void` 와 `never` 의 쓰임을 안다
- [ ] 배운 타입으로 진법 변환 함수(ToHex/ToBin/ToDec/ToBigInt)를 직접 만든다
- [ ] DevCalc 에 진법 변환 기능(ToHex/ToBin/ToDec)을 추가한다

## 이 강의의 목차

1. [타입 표기와 타입 추론](#1-타입-표기와-타입-추론)
2. [기본 타입 — C# 과 비교](#2-기본-타입--c-과-비교)
3. [number 의 함정](#3-number-의-함정)
4. [bigint](#4-bigint)
5. [any / unknown / void / never](#5-any--unknown--void--never)
6. [따라하기](#6-따라하기)
7. [직접 만들기 — 진법 변환 함수](#7-직접-만들기--진법-변환-함수)
8. [DevCalc 스텝 — Lv1 진법 변환기](#8-devcalc-스텝--lv1-진법-변환기)
9. [정리](#정리)

이 강의의 예제 파일: [primitives.ts](primitives.ts) · [bigint.ts](bigint.ts) · [special-types.ts](special-types.ts) · [convert.ts](convert.ts)

---

## 1. 타입 표기와 타입 추론

```ts
const strName: string = "DevCalc";   // 타입 표기 (Type Annotation)
const strVersion = "0.1.0";          // 타입 추론 (Type Inference) → string
```

- 이름 뒤에 `: 타입` 을 붙인다. C# 의 `string strName = ...` 와 순서가 반대다.
- 값이 있으면 TS 가 타입을 알아서 정한다. C# 의 `var` 와 같은 개념이고, **대부분 표기를 생략한다.**
- 표기가 꼭 필요한 곳: 함수의 매개변수(Parameter), 공개 함수의 반환 타입(Return Type).

## 2. 기본 타입 — C# 과 비교

| TypeScript | C# | 비고 |
|---|---|---|
| `string` | `string` | `"..."`, `'...'`, 템플릿 문자열 `` `값: ${n}` `` |
| `number` | `double` | **정수/실수 구분 없음.** `int`, `long`, `float` 가 따로 없다 |
| `bigint` | `BigInteger` | `255n` 처럼 끝에 `n`. 크기 제한 없는 정수 |
| `boolean` | `bool` | |
| `null`, `undefined` | `null` | 값이 없음을 나타내는 것이 **두 개** |
| `T[]`, `[T1, T2]` | `T[]`, `(T1, T2)` | 배열(Array), 튜플(Tuple) |
| `any` | `dynamic` | 타입 검사를 끈다 |
| `unknown` | `object` | 확인하기 전에는 쓸 수 없다 |
| `void` / `never` | `void` / — | `never` 는 "절대 정상 종료하지 않음" |

## 3. number 의 함정

```ts
0.1 + 0.2        // 0.30000000000000004
7 / 2            // 3.5   ← C# 의 int 나눗셈(3)과 다르다
2 ** 53 + 1      // 9007199254740992  ← 1 이 사라진다!
```

`number` 는 64비트 부동소수점(double)이라 정확한 정수는 `Number.MAX_SAFE_INTEGER`(2^53 - 1)까지만 표현한다.
개발자 계산기는 64비트 값(`0xFFFFFFFFFFFFFFFF`)을 다뤄야 하므로 `number` 로는 부족하다.

## 4. bigint

```ts
const biMax64 = 0xffff_ffff_ffff_ffffn;   // 18446744073709551615n
biMax64.toString(16);                      // "ffffffffffffffff"
biMax64.toString(2);                       // "1111...1111" (64개)
7n / 2n;                                   // 3n  (정수 나눗셈)
```

- 리터럴 끝에 `n`. `_` 로 자릿수를 끊어 읽기 쉽게 할 수 있다.
- `toString(진법)` 으로 2/8/16진수 문자열을 만든다.
- **`number` 와 섞어 쓸 수 없다**:

```ts
const biWrong = 1n + 1;    // TS: 작성 즉시 빨간 줄 / JS: 실행 중 TypeError
const biRight = 1n + BigInt(1);
```

> 이것이 TypeScript 를 쓰는 이유의 좋은 예다. JS 라면 실행해 봐야 알 수 있는 오류를 **쓰는 순간** 알려 준다.

## 5. any / unknown / void / never

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

### [primitives.ts](primitives.ts) — 타입 표기·추론, number, 배열·튜플

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

해 볼 것: `nCount = "1";` 주석을 풀어 빨간 줄 확인, 변수 위에 마우스를 올려 추론된 타입(Hover) 확인.

### [bigint.ts](bigint.ts) — bigint, number 와 섞으면?

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

마지막 `TypeError` 는 **일부러** 낸 오류다. `// @ts-expect-error` 를 지우면 에디터가 미리 빨간 줄로 알려 준다.

### [special-types.ts](special-types.ts) — any, unknown, null, void, never

```
> node lessons/01-basic-types/special-types.ts
undefined
hex: ff
now it has a value
void function called
caught: a never function always throws
```

## 7. 직접 만들기 — 진법 변환 함수

배운 타입으로 DevCalc 의 첫 부품을 만든다. 전체 코드는 [convert.ts](convert.ts).

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
> node lessons/01-basic-types/convert.ts
                 255 |                0xFF | 0b11111111
                   0 |                 0x0 | 0b0
                -255 |               -0xFF | -0b11111111
18446744073709551615 |  0xFFFFFFFFFFFFFFFF | 0b1111...1111
255n
RangeError: Not a safe integer: 1.5
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

- 타입은 이름 뒤 `: 타입`. 값이 있으면 대부분 추론에 맡긴다.
- `number` 는 double 하나뿐이고, 2^53 - 1 을 넘는 정수는 `bigint` 로 다룬다.
- `bigint` 와 `number` 는 섞을 수 없다. TS 는 이 실수를 실행 전에 잡아 준다.
- 외부 값은 `unknown` 으로 받는다. `any` 는 피한다.

**다음 강의 → 02. 함수와 객체 (준비 중)**: 함수 타입, 선택적 매개변수(Optional Parameter), `interface` 와 `type`. DevCalc 에는 자릿수 묶기(`0xFFFF_FFFF`)와 출력 옵션을 추가한다.

---

[← 이전: 00. 개발 환경 구성](../00-setup/README.ko.md) · [목차](../../README.ko.md) · 다음: 02. 함수와 객체 (준비 중)
