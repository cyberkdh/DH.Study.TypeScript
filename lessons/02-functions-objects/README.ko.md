[English](README.md) · **한국어**

[← 이전: 01. 기본 타입과 bigint](../01-basic-types/README.ko.md) · [목차](../../README.ko.md) · [다음: 03. 유니온과 타입 좁히기 →](../03-unions-narrowing/README.ko.md)

# 02. 함수와 객체 — 자릿수 묶기와 출력 옵션 (DevCalc Lv1)

> 시리즈: DH.Study.TypeScript · 02강
> 환경: Node.js v24 · TypeScript 7 · VS Code

## 목표

이 강의를 마치면 다음을 할 수 있다.

- [ ] 함수를 선언문과 화살표 함수(Arrow Function)로 쓰고, 둘의 차이를 안다
- [ ] 파라미터와 반환값에 타입을 표기하고, 함수 타입(`(nA: number) => string`)을 쓴다
- [ ] 선택(`?`)·기본값(`=`)·나머지(`...`) 파라미터를 쓰고, 옵션을 객체 하나로 넘긴다
- [ ] `interface` 나 `type` 으로 객체 모양을 정하고, `?` 와 `readonly` 를 쓴다
- [ ] 구조적 타이핑(Structural Typing) — C# 타입 시스템과 가장 다른 점 — 을 설명한다
- [ ] 함수를 값으로 다룬다 (콜백(Callback), 클로저(Closure), 함수 표)
- [ ] DevCalc 에 자릿수 묶기(`0xFFFF_FFFF`)와 출력 옵션을 추가한다

## 이 강의의 목차

1. [함수 — 선언문과 화살표 함수](#1-함수--선언문과-화살표-함수)
2. [파라미터 — 선택, 기본값, 나머지, 옵션 객체](#2-파라미터--선택-기본값-나머지-옵션-객체)
3. [객체 타입 — interface 와 type](#3-객체-타입--interface-와-type)
4. [구조적 타이핑 — C# 과 다른 점](#4-구조적-타이핑--c-과-다른-점)
5. [값으로서의 함수 — 콜백과 클로저](#5-값으로서의-함수--콜백과-클로저)
6. [따라하기](#6-따라하기)
7. [직접 만들기 — 자릿수 묶기와 출력 옵션](#7-직접-만들기--자릿수-묶기와-출력-옵션)
8. [DevCalc 스텝 — 자릿수 묶기, 옵션, 함수 표](#8-devcalc-스텝--자릿수-묶기-옵션-함수-표)
9. [정리](#정리)

이 강의의 예제 파일: [functions.ko.ts](functions.ko.ts) · [parameters.ko.ts](parameters.ko.ts) · [objects.ko.ts](objects.ko.ts) · [callbacks.ko.ts](callbacks.ko.ts) · [group.ko.ts](group.ko.ts)

> 예제는 한국어 주석판(`x.ko.ts`)을 링크한다. 같은 코드의 영어 주석판은 `x.ts` 다.

> 문법 표시: **[JS]** = JavaScript 문법 (TS 없이도 있음) · **[TS]** = TypeScript 가 더한 타입 문법 (지우면 JS) · 자세한 구분은 [00강 7-3](../00-setup/README.ko.md#7-3-ts-문법--js-문법--타입-문법)

---

## 1. 함수 — 선언문과 화살표 함수

```
function 이름(파라미터: 타입, ...): 반환타입 { ... }
const    이름 = (파라미터: 타입, ...): 반환타입 => 식;
```

### 1-1. 함수를 쓰는 두 가지 방법

**[JS]**

```ts
function Add(nA: number, nB: number): number {   // 함수 선언문
	return nA + nB;
}
const Multiply = (nA: number, nB: number): number => nA * nB;   // 화살표 함수
```

| | 함수 선언문 | 화살표 함수 (`const` 에 담음) |
|---|---|---|
| 닮은 것 | C# 메서드 | C# 람다 `(a, b) => a * b` |
| 선언 줄보다 위에서 호출 | ○ (호이스팅, Hoisting) | ✕ `Cannot access ... before initialization` |
| 본문 | `{ ... return ...; }` | 식 하나, 또는 `{ ... }` |
| 용도 | 이름 있는 최상위 함수 | 짧은 함수, 콜백 |

- C# 은 클래스 밖에 메서드가 없지만, JS 는 **함수가 파일에 혼자** 있을 수 있다.
- 화살표 함수는 `const` 에 담긴 값일 뿐이므로 01강의 `const` 규칙을 그대로 따른다.

### 1-2. 파라미터와 반환값 표기

**[TS]**

```ts
function ToUpperHex(nValue: number): string { ... }
const Square = (nA: number) => nA * nA;     // 반환 타입 추론 → number
```

- **파라미터에는 타입이 필요하다.** 없으면 `any` 가 되고 `strict` 모드에서는 오류다.
- 반환 타입은 추론되므로 생략할 수 있다. 공개 함수에는 적어 두면 함수 안의 실수가 그 자리에서 드러난다.
- TS 는 **인자 개수**도 검사한다. 순수 JS 는 검사하지 않아서 `Add(1)` 이 실행되고 `NaN` 이 나온다.

### 1-3. 함수 타입

**[TS]**

```ts
type TBinaryOp = (nA: number, nB: number) => number;

const fnPlus: TBinaryOp = Add;
const fnTimes: TBinaryOp = (nA, nB) => nA * nB;   // nA, nB 의 타입은 TBinaryOp 에서 옴
```

- "숫자 두 개를 받아 숫자를 돌려주는 함수" 라는 뜻. C# 의 `Func<int, int, int>` 나 `delegate` 와 같은 역할.
- 함수 타입 안의 파라미터 **이름**은 설명용이다. 타입과 순서만 맞으면 된다.
- 이름 규칙: 함수 타입은 타입 별칭이므로 `T` 접두어, 함수를 담은 변수는 `fn` 접두어.

## 2. 파라미터 — 선택, 기본값, 나머지, 옵션 객체

### 2-1. 선택 파라미터 `?`

**[TS]**

```ts
function Greet(strName: string, strTitle?: string): string {
	return strTitle === undefined ? `Hello, ${strName}` : `Hello, ${strTitle} ${strName}`;
}
Greet("Hong");          // "Hello, Hong"
Greet("Hong", "Dr.");   // "Hello, Dr. Hong"
```

- 함수 안에서 `strTitle` 은 `string | undefined` 다. **쓰기 전에 확인한다.** (`|` 는 유니온 타입(Union Type) — 03강)
- 선택 파라미터는 필수 파라미터 **뒤**에 와야 한다 (TS1016).

### 2-2. 기본값 `=`

**[JS]**

```ts
function ToRadix(nValue: number, nRadix = 16): string { ... }   // nRadix: number (추론)
```

C# 의 선택적 매개변수 `int radix = 16` 과 같다. 타입은 기본값에서 추론된다.

### 2-3. 나머지 파라미터 `...` 와 전개 구문

**[JS]** — `: number[]` 부분은 **[TS]**

```ts
function Sum(...arrNum: number[]): number { ... }
Sum(1, 2, 3);              // 6
Sum(...[8, 16, 32, 64]);   // 배열을 인자로 펼침 → 120
```

나머지 파라미터(Rest Parameter)는 C# 의 `params int[]`. 배열을 인자로 펼치는 `...` 는 **전개 구문(Spread Syntax)** 이다.

### 2-4. 옵션 객체

**[JS + TS]**

```ts
function FormatHex(nValue: number, { bPrefix = true, bUpperCase = true }: { bPrefix?: boolean; bUpperCase?: boolean } = {}): string { ... }

FormatHex(255);                          // "0xFF"
FormatHex(255, { bUpperCase: false });   // "0xff"
```

- 선택 설정이 여러 개면 **객체 하나**로 받는다. 호출하는 쪽에서 각 값의 의미가 보인다. C# 의 명명된 인수(Named Arguments) `FormatHex(255, upperCase: false)` 와 같은 효과.
- `{ bPrefix = true, ... }` 는 01강의 구조 분해(Destructuring)에 프로퍼티별 기본값을 더한 것.
- 끝의 `= {}` 덕분에 객체 자체를 생략할 수 있다.
- 인라인 타입 `{ bPrefix?: boolean; ... }` 은 길다. 3절에서 이름을 붙인다.

## 3. 객체 타입 — interface 와 type

### 3-1. 객체 리터럴

**[JS]**

```ts
const oWord = { strName: "WORD", nBits: 16 };   // 추론 → { strName: string; nBits: number }
oWord.nBytes;   // ✕ TS2339: Property 'nBytes' does not exist
```

C# 은 클래스나 익명 타입이 먼저 있어야 하지만, JS 는 `{ 키: 값 }` 이 **바로** 객체다.

### 3-2. interface

**[TS]**

```ts
interface IWordSize {
	readonly strName: string;   // 다시 할당할 수 없음
	nBits: number;
	strNote?: string;           // 선택 프로퍼티
}
const oDword: IWordSize = { strName: "DWORD", nBits: 32 };
```

- `?` : 프로퍼티가 없어도 된다 (`undefined`).
- `readonly` : 할당하면 오류 (TS2540). **타입에만** 있으므로 실행 중에는 할당이 그대로 일어난다. 실행 중에도 막아야 하면 `Object.freeze`.
- TS 의 `interface` 는 데이터 모양을 나타낸다. C# 과 달리 `implements` 하는 `class` 가 없어도 되고, 객체 리터럴이면 충분하다.

### 3-3. type

**[TS]**

```ts
type TWordSize = {
	readonly strName: string;
	nBits: number;
	strNote?: string;
};
type TBits = number;   // interface 는 기본 타입에 이름을 붙일 수 없음
```

### 3-4. interface 와 type, 무엇을 쓰나?

| | `interface` | `type` |
|---|---|---|
| 객체 모양 | ○ | ○ |
| 기본 타입, 유니온, 함수 타입 | ✕ | ○ (`type TBits = number`, `type TBinaryOp = (...) => ...`) |
| 확장 | `interface IRegister extends IWordSize { ... }` | `type TRegister = TWordSize & { ... }` (교차 타입, Intersection) |
| 두 번 선언 | 하나로 합쳐짐 (선언 병합, Declaration Merging) | 오류 |

- 이 시리즈의 기준: **객체 모양은 `interface`, 나머지는 `type`.**
- 이름 규칙: 인터페이스는 `I`, 그 밖의 타입 별칭은 `T` 접두어 (루트 README 의 이름 규칙 표).

### 3-5. 객체 타입 안의 메서드

**[TS]**

```ts
interface IFormatter {
	strName: string;
	Format(biValue: bigint): string;
}
const oHexFormatter: IFormatter = {
	strName: "hex",
	Format(biValue) { return "0x" + biValue.toString(16).toUpperCase(); },   // biValue: bigint 는 IFormatter 에서 옴
};
```

## 4. 구조적 타이핑 — C# 과 다른 점

**[TS]**

```ts
const oFromType: IWordSize = oQword;    // TWordSize → IWordSize : 모양이 같으니 OK

const oPlain = { strName: "BYTE", nBits: 8, bSigned: false };
const oByte: IWordSize = oPlain;        // OK : IWordSize 에 필요한 것을 다 가짐

const oTypo: IWordSize = { strName: "WORD", nBit: 16 };   // ✕ TS2561: did you mean 'nBits'?
```

- C# 은 **이름 기준(Nominal)**: 이름(상속, `implements`)이 이어져 있어야 호환된다. 멤버가 똑같은 두 클래스도 다른 타입이다.
- TS 는 **구조 기준(Structural)**: 이름과 상관없이 **모양이 맞으면 호환**된다. "컴파일할 때 검사하는 덕 타이핑(Duck Typing)" 이라고도 한다.
- 변수로 넘기면 남는 프로퍼티는 허용된다. 하지만 객체 리터럴을 **바로** 쓰면 모르는 키를 오류로 잡는다 (초과 프로퍼티 검사, Excess Property Check). `nBit` 같은 오타를 잡아 준다.

> 왜 이렇게 했나: JS 객체는 클래스 없이 여기저기서 온다 (JSON, 라이브러리, 리터럴). 그래서 TS 는 족보가 아니라 모양을 본다.

## 5. 값으로서의 함수 — 콜백과 클로저

**[JS]** — 함수 타입 표기는 **[TS]**

### 5-1. 콜백

```ts
function PrintAll(arrValue: bigint[], fnFormat: (biValue: bigint) => string): void { ... }
PrintAll([10n, 255n], (biValue) => "0x" + biValue.toString(16).toUpperCase());
```

배열 메서드도 콜백을 받는다. C# LINQ 와 대응된다.

| JS | C# LINQ | 예 |
|---|---|---|
| `map` | `Select` | `arrBits.map((nBits) => nBits / 8)` → `[1, 2, 4, 8]` |
| `filter` | `Where` | `arrBits.filter((nBits) => nBits >= 32)` → `[32, 64]` |
| `reduce` | `Aggregate` | `arrBits.reduce((nSum, nBits) => nSum + nBits, 0)` → `120` |
| `find` | `FirstOrDefault` | 없으면 `undefined` |

### 5-2. 클로저

```ts
function MakeFormatter(nRadix: number, strPrefix: string): (biValue: bigint) => string {
	return (biValue) => strPrefix + biValue.toString(nRadix).toUpperCase();
}
const fnHex = MakeFormatter(16, "0x");
fnHex(255n);   // "0xFF" — nRadix 와 strPrefix 를 여전히 기억함
```

돌려준 함수는 **자기를 만든 함수의 변수를 계속 가지고 있다** (클로저). C# 람다가 지역 변수를 캡처하는 것과 같다.

### 5-3. 함수 표

```ts
type TFormatter = (biValue: bigint) => string;
const arrFormatter: [string, TFormatter][] = [["HEX", fnHex], ["DEC", (biValue) => biValue.toString(10)], ["BIN", fnBin]];
for (const [strLabel, fnFormat] of arrFormatter) { ... }
```

`console.log` 세 줄 대신 표를 돌린다. 진법을 하나 더하면 표에 한 줄만 추가하면 된다. DevCalc 의 `main.ts` 가 이 방식을 쓴다.

---

## 6. 따라하기

각 파일을 열고 `F5` 를 누르거나 명령줄에서 실행한다. 실행할 수 없는 환경이면 아래 결과와 코드를 함께 읽는다.

### [functions.ko.ts](functions.ko.ts) — 선언문, 화살표 함수, 함수 타입

```
> node lessons/02-functions-objects/functions.ko.ts
1) Add(1, 2) = 3 (called before the declaration)
2) Multiply(3, 4) = 12 / Square(5) = 25
3) Expected error: Cannot access 'Subtract' before initialization
   Why : an arrow function is a const value, so it exists only from its line down.
   Fix : define it first, or use a function declaration.
4) ToUpperHex(255) = FF
5) Without TS: Add(1) = NaN
   Why : JS fills a missing argument with undefined, and 1 + undefined = NaN.
   Fix : TS flags it while you type. Pass both arguments.
6) fnPlus(2, 3) = 5 / fnTimes(2, 3) = 6
7) void function done
```

해 볼 것: `// ToUpperHex("255");` 주석을 풀어 빨간 줄 확인. `fnTimes` 의 `nA` 에 마우스를 올려 표기 없이도 `number` 인 것을 확인.

### [parameters.ko.ts](parameters.ko.ts) — 선택, 기본값, 나머지, 옵션 객체

```
> node lessons/02-functions-objects/parameters.ko.ts
1) Hello, Hong / Hello, Dr. Hong
2) ToRadix(255) = ff / ToRadix(255, 2) = 11111111
3) Sum() = 0 / Sum(1, 2, 3) = 6
4) Sum(...arrBits) = 120 / Math.max(...arrBits) = 64
5) 0xFF 0xff FF
6) Optional parameters go last (TS1016 otherwise).
```

해 볼 것: `FormatHex(255, { bUpperCase: false })` 에서 `{ ` 를 치고 `Ctrl+Space` — 편집기가 옵션 목록을 보여 준다.

### [objects.ko.ts](objects.ko.ts) — interface, type, readonly, 구조적 타이핑

```
> node lessons/02-functions-objects/objects.ko.ts
1) { strName: 'WORD', nBits: 16 } / oWord.nBits = 16
2) DWORD 32 / strNote = undefined
3) QWORD 64
4) QWORD BYTE 8
5) Without TS: oTypo.nBits = undefined
   Why : the key was typed as nBit, so nBits does not exist.
   Fix : TS flags the typo while you type. Write nBits.
6) readonly at runtime: CHANGED (type erased, so the assignment ran)
   Expected error: Cannot assign to read only property 'strName' of object '#<Object>'
   Why : Object.freeze makes the object read-only at runtime.
   Fix : readonly for compile time, Object.freeze when it must hold at runtime.
7) AX 255n / EAX 4294967295n
8) hex 0xFF
```

6번 줄이 3-2 절의 핵심: `readonly` 는 실행 중에 사라지고, `Object.freeze` 는 남는다.

### [callbacks.ko.ts](callbacks.ko.ts) — 콜백, map/filter/reduce, 클로저

```
> node lessons/02-functions-objects/callbacks.ko.ts
1) PrintAll with a hex callback:
   0xA
   0xFF
2) map: [ 1, 2, 4, 8 ] / filter: [ 32, 64 ] / reduce: 120
3) 0xFF 0b101
4) counter after 3 calls = 3
5) Function table for 10n:
   HEX : 0xA
   DEC : 10
   BIN : 0b1010
```

> `MakeCounter` 가 돌려주는 화살표 함수 안에 중단점을 걸고, 변수(Variables) 패널의 **Closure** 에서 `nCount` 를 확인해 본다.

## 7. 직접 만들기 — 자릿수 묶기와 출력 옵션

**[JS + TS]**

`0xFFFFFFFFFFFFFFFF` 는 읽기 어렵다. `0xFFFF_FFFF_FFFF_FFFF` 로 만들고 싶다. 전체 코드: [group.ko.ts](group.ko.ts).

### GroupDigits : ("FFFFFFFF", 4, "_") → "FFFF_FFFF"

```ts
function GroupDigits(strDigits: string, nSize: number, strSeparator: string): string {
	if (nSize <= 0) {
		return strDigits;
	}
	const arrGroup: string[] = [];
	for (let nEnd = strDigits.length; nEnd > 0; nEnd -= nSize) {
		const nStart = Math.max(0, nEnd - nSize);
		arrGroup.unshift(strDigits.slice(nStart, nEnd));   // 앞에 추가
	}
	return arrGroup.join(strSeparator);
}
```

- **오른쪽부터** 묶으므로 맨 왼쪽 묶음은 짧을 수 있다: `"1234567"` → `"1,234,567"`.
- `const arrGroup: string[] = []` — 빈 배열은 무엇이 들어갈지 TS 가 알 수 없으므로 타입을 표기한다.

### 출력 옵션

```ts
interface IFormatOptions {
	bGroup?: boolean;       // 기본 false
	bUpperCase?: boolean;   // 기본 true
	bPrefix?: boolean;      // 기본 true
}

function ToHex(biValue: bigint, { bGroup = false, bUpperCase = true, bPrefix = true }: IFormatOptions = {}): string { ... }
```

2-4 절의 옵션 객체에 `interface` 로 이름을 붙였다.

### 실행

```
> node lessons/02-functions-objects/group.ko.ts
1) FFFF_FFFF 1,234,567 FF
2) default      : 0xFFFFFFFFFFFFFFFF
3) bGroup       : 0xFFFF_FFFF_FFFF_FFFF
4) lower, group : 0xffff_ffff_ffff_ffff
5) no prefix    : FF
6) negative     : -0x1_0000
```

## 8. DevCalc 스텝 — 자릿수 묶기, 옵션, 함수 표

[devcalc/src/core/Format.ts](../../devcalc/src/core/Format.ts) 에 추가된 것:

```ts
export interface IFormatOptions { readonly bGroup?: boolean; readonly bUpperCase?: boolean; readonly bPrefix?: boolean; }
export type TFormatter = (biValue: bigint, oOptions?: IFormatOptions) => string;

interface IRadixSpec { readonly nRadix: number; readonly strPrefix: string; readonly nGroupSize: number; readonly strSeparator: string; }
const HEX_SPEC: IRadixSpec = { nRadix: 16, strPrefix: "0x", nGroupSize: 4, strSeparator: "_" };
const DEC_SPEC: IRadixSpec = { nRadix: 10, strPrefix: "",   nGroupSize: 3, strSeparator: "," };
const BIN_SPEC: IRadixSpec = { nRadix: 2,  strPrefix: "0b", nGroupSize: 4, strSeparator: "_" };

export const ToHex: TFormatter = (biValue, oOptions = {}) => FormatRadix(biValue, HEX_SPEC, oOptions);
```

- 01강에서 따로 넘기던 인자(`nRadix`, `strPrefix`)를 **진법마다 객체 하나**(`IRadixSpec`)로 묶었다. 나중에 8진수를 더하려면 한 줄이면 된다.
- `ToHex` / `ToDec` / `ToBin` 이 모두 `TFormatter` 타입이라 표 하나에 들어간다.
- `ToDec` 도 `FormatRadix` 를 거치게 되어 `,` 로 묶을 수 있다.
- 옵션의 기본값이 01강 동작과 같으므로 기존 테스트는 고치지 않아도 통과한다.

[devcalc/src/main.ts](../../devcalc/src/main.ts) 는 옵션(Flag)을 읽고 함수 표를 돌린다.

```ts
const arrRow: [string, TFormatter][] = [["HEX", ToHex], ["DEC", ToDec], ["BIN", ToBin]];
for (const [strLabel, fnFormat] of arrRow) {
	console.log(`${strLabel} : ${fnFormat(biValue, oOptions)}`);
}
```

실행 — 명령줄에서는 자릿수 묶기가 기본으로 **켜져** 있다.

```
> node devcalc/src/main.ts 18446744073709551615
HEX : 0xFFFF_FFFF_FFFF_FFFF
DEC : 18,446,744,073,709,551,615
BIN : 0b1111_1111_1111_1111_1111_1111_1111_1111_1111_1111_1111_1111_1111_1111_1111_1111

> node devcalc/src/main.ts 255 --lower --no-prefix
HEX : ff
DEC : 255
BIN : 1111_1111

> node devcalc/src/main.ts 1234567 --no-group
HEX : 0x12D687
DEC : 1234567
BIN : 0b100101101011010000111

> node devcalc/src/main.ts 255 --bad
Unknown option: "--bad" (ignored)
Why : only --no-group, --lower, --no-prefix are supported.
HEX : 0xFF
DEC : 255
BIN : 0b1111_1111
```

npm 으로 실행할 때는 `--` 뒤에 인자를 둔다: `npm run devcalc -- 255 --lower`.

테스트([devcalc/tests/Format.test.ts](../../devcalc/tests/Format.test.ts))에 `GroupDigits` 와 옵션 검사를 추가했다.

```
> npm test
✔ Format: 255
✔ Format: zero and negative
✔ GroupDigits
✔ Format options
ℹ pass 4
```

> 입력 `0xFFFF_FFFF` (`_` 포함)는 아직 거부된다 — `BigInt()` 가 `_` 를 받지 않기 때문. 03강에서 직접 만드는 해석기로 해결한다.

## 정리

- 함수는 선언문(`function`, 호이스팅됨) 또는 `const` 에 담은 화살표 함수(호이스팅 안 됨).
- 파라미터에는 타입이 필요하고, 반환 타입은 대부분 추론된다. 함수 타입은 `(nA: number) => string` 모양.
- `?` 선택, `=` 기본값, `...` 나머지. 옵션이 많으면 옵션 객체 하나 + 구조 분해 기본값.
- 객체 모양은 `interface`, 기본 타입·유니온·함수 타입은 `type`. `readonly` 는 컴파일할 때만 검사된다.
- TS 는 **구조 기준**: 모양이 같으면 호환된다. 그래도 객체 리터럴의 모르는 키는 잡아 준다.
- 함수는 값이다: 넘기고(콜백), 돌려받고(클로저), 표에 담는다.

**다음 → [03. 유니온과 타입 좁히기](../03-unions-narrowing/README.ko.md)**: `string | undefined`, `typeof` / `in` 검사, `enum` 대신 리터럴 유니온. DevCalc 에 `0xFF`, `0b1010`, `1_000` 을 해석하는 자체 입력 해석기를 만든다.

---

[← 이전: 01. 기본 타입과 bigint](../01-basic-types/README.ko.md) · [목차](../../README.ko.md) · [다음: 03. 유니온과 타입 좁히기 →](../03-unions-narrowing/README.ko.md)
