[English](README.md) · **한국어**

[← 이전: 11. 정규식과 리터럴 타입](../11-regex-literal-types/README.ko.md) · [목차](../../README.ko.md) · [다음: 13. 함수 표와 스코프 →](../13-functions-scope/README.ko.md)

# 12. bigint 와 고정 크기 워드 — 모든 출력 형식

> 시리즈: DH.Study.TypeScript · 12강 (2부)
> 환경: Node.js v24 · TypeScript 7 · Vitest 5 · VS Code

## 목표

이 강의를 마치면 다음을 할 수 있다.

- [ ] `number` 가 어디서부터 정확하지 않은지, `bigint` 가 어디서 다르게 동작하는지 (나눗셈, `Math`, `==`, `sort`, JSON) 말할 수 있다
- [ ] `BigInt.asUintN` / `BigInt.asIntN` 으로 값을 N 비트로 자르고, 2의 보수(Two's complement), 부호 확장(Sign extension), 바이트 순서(Byte order)를 설명한다
- [ ] 표에 타입 표기(Annotation), `as`, `satisfies` 중 무엇을 쓸지 고르고 — 그중 아무것도 검사하지 않는 것이 무엇인지 안다
- [ ] 출력 행을 표 하나(`satisfies Record<ERow, …>`)와 순서 목록(`as const satisfies readonly ERow[]`)으로 표현한다
- [ ] DevCalc 의 새 OCT, CHAR 행(`--all`)과 128 비트 워드를 쓴다

## 이 강의의 목차

1. [bigint 깊이 보기](#1-bigint-깊이-보기)
2. [고정 크기 워드](#2-고정-크기-워드)
3. [타입 표기, as, satisfies](#3-타입-표기-as-satisfies)
4. [따라하기](#4-따라하기)
5. [직접 만들기 — 값 하나를 여섯 가지로](#5-직접-만들기--값-하나를-여섯-가지로)
6. [DevCalc 스텝 — Lv7 모든 출력 형식, 128 비트](#6-devcalc-스텝--lv7-모든-출력-형식-128-비트)
7. [정리](#정리)
8. [다음으로 갈 곳](#다음으로-갈-곳)

이 강의의 예제 파일: [bigint.ko.ts](bigint.ko.ts) · [words.ko.ts](words.ko.ts) · [satisfies.ko.ts](satisfies.ko.ts) · [formats.ko.ts](formats.ko.ts)

> 예제는 한국어 주석판(`x.ko.ts`)을 링크한다. 같은 코드의 영어 주석판은 `x.ts` 다.

> 문법 표시: **[JS]** = JavaScript 문법 (TS 없이도 있음) · **[TS]** = TypeScript 가 더한 타입 문법 (지우면 JS) · 자세한 구분은 [00강 7-3](../00-setup/README.ko.md#7-3-ts-문법--js-문법--타입-문법)

DevCalc 는 01강부터 `bigint` 를, 04강부터 워드 크기를 썼지만, 필요한 만큼만 썼다. 이 강의에서는 둘을 제대로 본다. 개발자용 계산기는 이 둘 위에서 돌아가기 때문이다: 레지스터 덤프는 64 비트 워드이고, UUID 는 128 비트이며, `0xC1` 은 묻는 사람에 따라 193 이기도 하고 -63 이기도 하다. 강의 끝에 DevCalc 는 값 하나를 개발자가 읽는 모든 형태로 보여 준다 — 여기서는 바이트 `'A' | 0x80` 을 여섯 가지로:

```
> node devcalc/src/main.ts "'A' | 0x80" --bits=8 --all
HEX  : 0xC1
DEC  : 193
BIN  : 0b1100_0001
INT  : -63 (8-bit signed)
OCT  : 0o301
CHAR : '\xC1'
```

---

## 1. bigint 깊이 보기

### 1-1. 크기와 상관없이 정확

**[JS]** `number` 는 64 비트 부동소수점(Floating-point) 값이다. 정수는 2^53 (`Number.MAX_SAFE_INTEGER` + 1) 까지만 빠짐없이 표현하고, 그 뒤로는 건너뛰는 수가 생긴다. `bigint` 는 한계가 없다:

```ts
2 ** 53 + 1;    // 9007199254740992 — + 1 이 사라짐
2n ** 53n + 1n; // 9007199254740993n
2n ** 64n;      // 18446744073709551616n
```

그래서 DevCalc 의 코어는 처음부터 끝까지 `bigint` 다: 64 비트 워드는 `number` 에 들어가지 않는다.

### 1-2. 섞어 쓰기 금지

**[JS + TS]** `bigint` 와 `number` 는 산술에서 절대 섞이지 않는다. JavaScript 는 실행 중에 `TypeError` 를 던지고, TypeScript 는 그 전에 알려 준다:

```ts
const nCount = 3;
const biBad = 10n * nCount;          // TS2365 : Operator '*' cannot be applied to types 'bigint' and 'number'
const biTimes = 10n * BigInt(nCount); // 30n
Number(2n ** 64n + 1n);               // 18446744073709552000 — number 로는 너무 큼 : 아래 자리가 사라짐
```

`BigInt(text)` 는 10진, `0x`, `0o`, `0b` 텍스트를 읽고 앞뒤 공백은 무시하지만, 그 밖에는 아무것도 못 읽는다 — `_` 도, `1Fh` 도 안 된다. 그래서 03강에서 `ParseInteger` 를 직접 만들었다.

### 1-3. 나눗셈은 0 쪽으로 자른다

**[JS]** bigint 의 `/` 는 소수 부분을 0 쪽으로 버리고, `%` 는 왼쪽 값의 부호를 따른다 — C 의 규칙이다:

| 식 | 결과 | `Math.floor` 라면 |
|---|---|---|
| `7n / 2n` | `3n` | 3 |
| `-7n / 2n` | `-3n` | -4 |
| `-7n % 2n` | `-1n` | |

내림 나눗셈(Floor division, Python 의 `//`)이 필요하면, 잘린 결과이고 부호가 다를 때 하나 내린다 — [bigint.ko.ts](bigint.ko.ts) 의 `FloorDiv`.

### 1-4. Math 는 number 전용

**[TS]** `Math.max(1n, 2n)` 은 TS2345 (`Argument of type 'bigint' is not assignable to parameter of type 'number'`) 다. 필요한 도우미 몇 개는 직접 쓴다 — 짧다:

```ts
function MaxOf(...arrValue: bigint[]): bigint {
	return arrValue.reduce((biMax, biValue) => (biValue > biMax ? biValue : biMax));
}
function BitLength(biValue: bigint): number {
	return biValue === 0n ? 0 : (biValue < 0n ? -biValue : biValue).toString(2).length;
}
```

### 1-5. 비교와 정렬

- `<` `>` `<=` `>=` 는 두 타입 사이에서도 비교한다: `2n > 1` 은 `true`.
- `1n == 1` 은 `true`, `1n === 1` 은 `false` (타입이 다름). 리터럴끼리라면 TS 는 둘 다 TS2367 (`… the types 'bigint' and 'number' have no overlap`) 로 알린다 — 거의 언제나 실수이기 때문이다.
- `[10n, 9n, 100n].sort()` 는 **텍스트로** 정렬한다: `10 100 9`. 비교 함수는 `number` 를 돌려줘야 하므로 `(biA, biB) => biA - biB` 는 TS2345 다. `biA < biB ? -1 : biA > biB ? 1 : 0` 을 쓴다.

### 1-6. JSON 에는 bigint 가 없다

**[JS]** `JSON.stringify({ biValue: 1n })` 은 `TypeError: Do not know how to serialize a BigInt` 를 던진다. 텍스트 형태를 직접 정한다 — 나갈 때는 replacer 함수, 들어올 때는 `BigInt(text)`. 07강의 웹 기록이 이미 10진 텍스트로 그렇게 하고 있다.

---

## 2. 고정 크기 워드

### 2-1. asUintN 과 asIntN

**[JS]** 워드 크기는 비트 수다. 두 함수가 어떤 bigint 든 N 비트로 자른다:

- `BigInt.asUintN(N, x)` — 아래 N 비트를 남기고 **부호 없는(Unsigned)** 수로 읽는다 (0 … 2^N − 1)
- `BigInt.asIntN(N, x)` — 아래 N 비트를 남기고 **부호 있는(Signed)** 수로 읽는다 (−2^(N−1) … 2^(N−1) − 1)

| x | asUintN(8, x) | asIntN(8, x) |
|---|---|---|
| 255 | 255 | -1 |
| 256 | 0 | 0 |
| -1 | 255 | -1 |
| 200 | 200 | -56 |

비트는 같고 읽는 방법만 다르다. DevCalc 의 `CWordSize.ToUnsigned` / `ToSigned` (04강) 가 이 두 호출이다.

### 2-2. 2의 보수

부호 있는 워드는 **2의 보수**를 쓴다: −x 는 "모든 비트를 뒤집고 1 을 더한 것" 이다. 그래서 −1 은 어떤 크기에서든 전부 1 — `0xFF`, `0xFFFF`, … 128 비트면 F 가 32 개 — 이고, 맨 위 비트가 "음수" 라는 표시다. 범위는 시프트로 구한다:

```ts
const biMaxUnsigned = (1n << biBits) - 1n;  // 8 비트면 255
const biMinSigned = -(1n << (biBits - 1n)); // 8 비트면 -128
```

### 2-3. 넓히기 : 0 확장과 부호 확장

바이트를 더 넓은 레지스터에 불러오는 방법은 두 가지다. `0x80` 을 부호 없는 수로 보면 128 → `0x0080`. 부호 있는 수로 보면 −128 → `0xFF80` (부호 비트가 새 비트로 복사됨). bigint 로는 `asUintN(16, asUintN(8, x))` 와 `asUintN(16, asIntN(8, x))` 의 차이다.

### 2-4. 바이트 순서

**[JS]** `DataView` 는 `ArrayBuffer` 안에 수를 읽고 쓰며, 바이트 순서를 고를 수 있다:

```ts
const oView = new DataView(new ArrayBuffer(8));
oView.setBigUint64(0, 0x0102030405060708n);       // 빅 엔디언(Big endian) : 01 02 03 04 05 06 07 08
oView.setBigUint64(0, 0x0102030405060708n, true); // 리틀 엔디언(Little endian, x86, ARM) : 08 07 06 05 04 03 02 01
```

128 비트 호출은 없다. 128 비트 값은 64 비트 두 덩어리다: `biWide >> 64n` 과 `BigInt.asUintN(64, biWide)`.

---

## 3. 타입 표기, as, satisfies

08강과 11강은 연산자 표와 단위 표에 `satisfies` 를 썼다. 여기서는 표에 타입을 붙이는 세 가지 방법을 나란히 본다.

```ts
type EWord = "byte" | "word" | "dword";

const WORD_BITS_A: Record<EWord, number> = { byte: 8, word: 16, dword: 32 };                 // 1 타입 표기
const WORD_BITS_AS = { byte: 8, word: 16 } as Record<EWord, number>;                         // 2 as
const WORD_BITS = { byte: 8, word: 16, dword: 32 } as const satisfies Record<EWord, number>; // 3 satisfies
```

| | 빠진 행 | 철자가 틀린 행 | `.byte` 의 타입 |
|---|---|---|---|
| **[TS]** 타입 표기 `: T` | TS2741 | TS2561 | `number` |
| **[TS]** `as T` | 없음 — 실행 중에 `undefined` | 없음 (아예 T 가 될 수 없을 때만 TS2352) | `number` |
| **[TS]** `satisfies T` | TS2741 | TS2561 | `8` (`as const` 와 함께) |

- 타입 표기는 표를 검사한 다음 **잊어버린다**: 변수의 타입은 표기한 타입이 된다. `TBitsA = typeof WORD_BITS_A["byte"]` 는 `number` 이므로 `12` 도 통과한다.
- `as` 는 거의 아무것도 검사하지 않는다. "믿어 줘" 라는 말이라서, 빠진 `dword` 는 나중에 `TypeError: Cannot read properties of undefined` 로 드러난다.
- `satisfies` 는 표를 검사하고 표 자신의 타입을 **유지한다**. `TBits = typeof WORD_BITS[EWord]` 는 `8 | 16 | 32` 다.

`satisfies` 가 주는 것이 두 가지 더 있다:

- **표 안 함수의 문맥 타입(Contextual type).** `{ hex: { fnFormat: (biValue) => … } } satisfies Record<string, IRadixSpec>` 에서 `biValue` 는 쓰지 않아도 `bigint` 다.
- **정확한 키.** `keyof typeof RADIX` 는 `"hex" | "oct" | "bin"` 이다. 타입 표기 `Record<string, IRadixSpec>` 였다면 `string` 이 된다.

순서 목록도 표다: `["bin", "oct", "hex"] as const satisfies readonly ERadix[]` 는 실제 이름만 받고 (`"dec"` 는 TS2322), 타입은 튜플(Tuple) `readonly ["bin", "oct", "hex"]` 이다.

---

## 4. 따라하기

### [bigint.ko.ts](bigint.ko.ts) — 정확한 크기, 섞어 쓰기 금지, 나눗셈, Math, 비교, JSON

```
> node lessons/12-bigint-words/bigint.ko.ts
1) number : 9007199254740992 · bigint : 9007199254740993n
1) safe? false · 2^64 = 18446744073709551616n
2) 10n * BigInt(3) = 30n · Number(2n ** 64n + 1n) = 18446744073709552000
2) BigInt("0xFF") = 255n · BigInt(" 42 ") = 42n
3) 7n / 2n = 3n · -7n / 2n = -3n · -7n % 2n = -1n
3) floor(-7 / 2) = -4n · Math.floor(-7 / 2) = -4
4) MaxOf(3n, 10n, 7n) = 10n · BitLength(255n) = 8 · BitLength(256n) = 9
5) 1n == 1 : true · 1n === 1 : false · 2n > 1 : true · typeof 1n : bigint
5) sort() : 10 100 9 (as text)
5) sort(compare) : 9 10 100
6) JSON with a replacer : {"biValue":"0xff"} → 255n
7) Expected error: SyntaxError: Cannot convert 12a to a BigInt
   Why : BigInt() takes whole integer text only ("255", "0xFF", "-7"). It has no 12a, 1Fh or 1_000.
   Fix : parse the text yourself (lesson 03's ParseInteger), or check it with a regex first.
```

해 볼 것:

- `const biBad = 10n * nCount;` 앞의 `//` 를 지우면 → TS2365.
- `if (1n === 1) {}` 앞의 `//` 를 지우면 → TS2367. 5절은 대신 `vOne: unknown` 과 비교한다. `JSON.parse` 에서 온 값이 이런 모습이다.
- `arrValue.sort((biA, biB) => biA - biB);` 앞의 `//` 를 지우면 → TS2345.

### [words.ko.ts](words.ko.ts) — asUintN / asIntN, 2의 보수, 범위, 확장, 바이트 순서

```
> node lessons/12-bigint-words/words.ko.ts
1)  255 → asUintN(8) = 255 · asIntN(8) = -1
1)  256 → asUintN(8) =   0 · asIntN(8) = 0
1)   -1 → asUintN(8) = 255 · asIntN(8) = -1
1)  200 → asUintN(8) = 200 · asIntN(8) = -56
2) -1 in   8 bits = 0xFF
2) -1 in  16 bits = 0xFFFF
2) -1 in  32 bits = 0xFFFFFFFF
2) -1 in  64 bits = 0xFFFFFFFFFFFFFFFF
2) -1 in 128 bits = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF
3)   8 bits : 0 .. 255 · -128 .. 127
3)  16 bits : 0 .. 65535 · -32768 .. 32767
3)  32 bits : 0 .. 4294967295 · -2147483648 .. 2147483647
3)  64 bits : 0 .. 18446744073709551615 · -9223372036854775808 .. 9223372036854775807
3) 128 bits : 0 .. 340282366920938463463374607431768211455 · -170141183460469231731687303715884105728 .. 170141183460469231731687303715884105727
4) 0x80 → zero extend 0x0080 · sign extend 0xFF80
5) big endian    : 01 02 03 04 05 06 07 08
5) little endian : 08 07 06 05 04 03 02 01 → read back 0x0102030405060708
6) 0x0123456789ABCDEFFEDCBA9876543210 = high 0x0123456789ABCDEF + low 0xFEDCBA9876543210
6) joined again : true
7) Expected error: RangeError: Offset is outside the bounds of the DataView
   Why : 8 bytes from offset 4 need bytes 4..11, and the buffer has only 8 (0..7).
   Fix : check nOffset + 8 <= oView.byteLength first, or make the buffer larger.
```

해 볼 것:

- 5절의 리틀 엔디언 바이트를 `getBigUint64(0)` (`true` 없이) 로 읽으면 → `0x0807060504030201`. 바이트 순서를 헷갈리는 것은 파일이나 네트워크 패킷을 읽을 때 흔한 버그다.
- 1절의 8 두 개를 16 으로 바꾸면 → 255 와 200 이 `asIntN(16, …)` 에서도 양수로 남는다: 맨 위 비트가 더 이상 부호 비트가 아니다.

### [satisfies.ko.ts](satisfies.ko.ts) — 타입 표기, satisfies, 문맥 타입, 순서 목록, as

```
> node lessons/12-bigint-words/satisfies.ko.ts
1) annotation : 8 · a TBitsA can be 12
2) satisfies : 8 · a TBits can only be 8, 16 or 32 : 16
3) satisfies checks every key : byte, word, dword
4) hex : 0xC8
4) oct : 0o310
4) bin : 0b11001000
5) order : 0b101 0o5 0x5
6) Expected error: TypeError: Cannot read properties of undefined (reading 'toFixed')
   Why : as tells TS to trust you. The table has no dword, so WORD_BITS_AS.dword is undefined.
   Fix : write satisfies instead of as. Then TS2741 reports the missing row before the program runs.
```

해 볼 것:

- `const MISSING = …` 앞의 `//` 를 지우면 → TS2741, `const TYPO = …` 앞의 `//` 를 지우면 → TS2561 ("Did you mean 'dword'?" 와 함께).
- `const nBitsBad: TBits = 12;` 앞의 `//` 를 지우면 → TS2322.
- 4절의 `satisfies Record<string, IRadixSpec>` 를 타입 표기 `const RADIX: Record<string, IRadixSpec> = …` 로 바꾸면 → 5절의 `keyof typeof RADIX` 가 `string` 이 되고, `RADIX[eRadix]` 가 `undefined` 일 수 있다 (`noUncheckedIndexedAccess` 때문에 TS2532 `Object is possibly 'undefined'`).

---

## 5. 직접 만들기 — 값 하나를 여섯 가지로

[formats.ko.ts](formats.ko.ts) 는 DevCalc 의 새 출력을 70 줄로 줄인 것이다: 행의 표, 순서 목록, 그리고 값을 한 번만 자르고 모든 행이 같은 비트를 읽게 하는 함수 하나.

```ts
type ERow = "HEX" | "DEC" | "INT" | "OCT" | "BIN" | "CHAR";
type TBits = 8 | 16 | 32 | 64 | 128;

interface IRowSpec {
	readonly fnFormat: (biUnsigned: bigint, nBits: TBits) => string; // biUnsigned 는 이미 nBits 로 잘린 값
}

const ROWS = {
	HEX: { fnFormat: (biUnsigned, nBits) => "0x" + Digits(biUnsigned, 16, 4, nBits) },
	DEC: { fnFormat: (biUnsigned) => String(biUnsigned) },
	INT: { fnFormat: (biUnsigned, nBits) => String(BigInt.asIntN(nBits, biUnsigned)) },
	OCT: { fnFormat: (biUnsigned, nBits) => "0o" + Digits(biUnsigned, 8, 3, nBits) },
	BIN: { fnFormat: (biUnsigned, nBits) => "0b" + Digits(biUnsigned, 2, 1, nBits) },
	CHAR: { fnFormat: (biUnsigned) => CharText(biUnsigned) },
} satisfies Record<ERow, IRowSpec>;

const ROW_ORDER = ["HEX", "DEC", "INT", "OCT", "BIN", "CHAR"] as const satisfies readonly ERow[];
```

- **자릿수 채우기.** 16진수 한 자리는 4 비트, 8진수는 3 비트, 2진수는 1 비트를 담는다. 너비는 `Math.ceil(nBits / nBitsPerDigit)`: 8 비트 → 16진 2 자리, 8진 3 자리, 2진 8 자리. 128 비트 → 8진 43 자리 (128 / 3 올림).
- **CHAR** 는 바이트를 DevCalc 가 다시 읽을 수 있는 문자 리터럴 (11강의 `'…'`) 로 바꾼다: 출력 가능한 ASCII 는 그대로, `\0 \t \n \r \' \\` 는 이스케이프, 나머지는 `\xHH`. 앞쪽의 0 바이트는 버리므로 `0x41` 은 `'\0\0\0A'` 가 아니라 `'A'` 다.
- `INT` 는 부호를 따로 다룰 필요가 없다: `asIntN` 이 같은 비트를 부호 있는 수로 읽는다.

### 실행

```
> node lessons/12-bigint-words/formats.ko.ts
-1 in 8 bits
  HEX  : 0xFF
  DEC  : 255
  INT  : -1
  OCT  : 0o377
  BIN  : 0b11111111
  CHAR : '\xFF'
1214843392 in 32 bits
  HEX  : 0x48690A00
  DEC  : 1214843392
  INT  : 1214843392
  OCT  : 0o11032205000
  BIN  : 0b01001000011010010000101000000000
  CHAR : 'Hi\n\0'
-2 in 128 bits
  HEX  : 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFE
  INT  : -2
  OCT  : 0o3777777777777777777777777777777777777777776
Note: 4294967361 does not fit in 8 bits, so every row shows the low 8 bits (65).
4294967361 in 8 bits
  HEX  : 0x41
  CHAR : 'A'
```

해 볼 것:

- `Show(1n, 12);` 앞의 `//` 를 지우면 → TS2345: 12 는 `TBits` 가 아니다.
- `Show(1n, 8, ["HEX", "UDEC"]);` 앞의 `//` 를 지우면 → TS2820, "Did you mean '"DEC"'?" 와 함께.
- `ERow` 에만 `"UDEC"` 를 더하면 → 행을 쓸 때까지 `ROWS` 에 TS2741. 순서 목록에는 넣지 않아도 된다 — 보이게 하려면 거기에도 `"UDEC"` 를 넣는다.

---

## 6. DevCalc 스텝 — Lv7 모든 출력 형식, 128 비트

### 바뀐 것

| 파일 | 변경 |
|---|---|
| `devcalc/src/core/WordSize.ts` | `TWordBits` 에 `128` (`OWORD`) 추가. `WORD_BITS` 와 `WORD_NAMES` 는 `as const satisfies`. `WORD_BITS` 내보냄 |
| `devcalc/src/core/Format.ts` | `ToOct` (`0o`, 3 자리 묶음, `ceil(nBits / 3)` 자리로 채움), `ToChar` (문자 리터럴, 음수면 `undefined`) |
| `devcalc/src/core/Output.ts` | 새 파일: `OUTPUT_ROWS` (`satisfies Record<ERow, IRowSpec>`), `ROW_ORDER`, `OutputRows()`, `OutputHelp()` |
| `devcalc/src/core/Calculator.ts` | "워드 크기가 필요" 안내에 128 추가 |
| `devcalc/src/main.ts` | 행은 `OutputRows()` 에서. `--all` 이 OCT 와 CHAR 를 더함. `--bits=` 목록은 `WORD_BITS` 로 만듦. `help` 가 행을 보여 줌 |
| `devcalc/web/App.ts`, `index.html` | 모든 행을 `OutputRows(…, true)` 에서. 128-bit 선택지. 제목 `Lv7` |
| `devcalc/tests/Output.test.ts` | 새 파일: 테스트 5 개 |
| `devcalc/tests/Format.test.ts`, `Cli.test.ts` | `ToOct`, `ToChar` (모든 `ToChar` 결과를 `ParseChar` 로 다시 읽을 수 있는지), `--all`, `--bits=128` |

### 두 화면이 쓰는 표 하나

지금까지는 `main.ts` 와 `App.ts` 가 각자 목록 `[["HEX", ToHex], ["DEC", ToDec], ["BIN", ToBin]]` 과 INT 를 위한 `if` 를 갖고 있었다. 이제 둘 다 코어에 묻는다:

```ts
const OUTPUT_ROWS = {
	HEX: { bExtra: false, strHelp: "hexadecimal", fnFormat: (biValue, oOptions) => ToHex(biValue, oOptions) },
	DEC: { bExtra: false, strHelp: "decimal (unsigned when a word size is set)", fnFormat: (biValue, oOptions) => ToDec(biValue, oOptions) },
	BIN: { bExtra: false, strHelp: "binary", fnFormat: (biValue, oOptions) => ToBin(biValue, oOptions) },
	INT: { bExtra: false, strHelp: "signed decimal (two's complement)", fnFormat: (biValue, oOptions, oWord) => (oWord === undefined ? undefined : ToDec(oWord.ToSigned(biValue), oOptions)) },
	OCT: { bExtra: true, strHelp: "octal", fnFormat: (biValue, oOptions) => ToOct(biValue, oOptions) },
	CHAR: { bExtra: true, strHelp: "the bytes as a character literal", fnFormat: (biValue) => ToChar(biValue) },
} as const satisfies Record<ERow, IRowSpec>;

export const ROW_ORDER = ["HEX", "DEC", "BIN", "INT", "OCT", "CHAR"] as const satisfies readonly ERow[];
```

- `fnFormat` 은 `string | undefined` 를 돌려준다. `undefined` 는 "행 없음" 이다. INT 는 워드 크기가 없으면 보여 줄 것이 없고, CHAR 는 워드 크기 없는 음수에는 보여 줄 것이 없다.
- `bExtra` 행은 요청할 때만 나온다. 명령줄은 기본으로 네 줄을 그대로 유지하고 (그래서 앞 강의들의 출력이 모두 그대로다), `--all` 이면 여섯 줄을 모두 보여 준다. 웹 페이지는 언제나 여섯 줄이다.
- 순서가 `HEX DEC BIN INT OCT CHAR` 인 이유도 같다: 앞의 네 줄이 예전 출력이다.

`main.ts` 는 돌아온 것을 출력만 한다:

```ts
for (const { eRow, strText } of OutputRows(oEval.biValue, oOptions, oWord, bAll)) {
	const strNote = eRow === "INT" && oWord !== undefined ? ` (${oWord.nBits}-bit signed)` : "";
	console.log(`${eRow.padEnd(bAll ? 4 : 3)} : ${strText}${strNote}`);
}
```

### 새 출력

```
> node devcalc/src/main.ts "'Hi' << 8" --all
HEX  : 0x48_6900
DEC  : 4,745,472
BIN  : 0b100_1000_0110_1001_0000_0000
OCT  : 0o22_064_400
CHAR : 'Hi\0'
```

`'Hi\0'` 는 다시 입력할 수 있다: `node devcalc/src/main.ts "'Hi\0'"` 는 다시 `0x48_6900` 이다. 8 바이트까지의 값을 다시 읽을 수 있다 — 11강 문자 리터럴의 한계다.

```
> node devcalc/src/main.ts -1 --bits=128
HEX : 0xFFFF_FFFF_FFFF_FFFF_FFFF_FFFF_FFFF_FFFF
DEC : 340,282,366,920,938,463,463,374,607,431,768,211,455
BIN : 0b1111_1111_1111_1111_1111_1111_1111_1111_1111_1111_1111_1111_1111_1111_1111_1111_1111_1111_1111_1111_1111_1111_1111_1111_1111_1111_1111_1111_1111_1111_1111_1111
INT : -1 (128-bit signed)
```

128 을 더한 것은 `TWordBits` 에 한 단어, `WORD_NAMES` 에 한 행이었다 — `satisfies Record<TWordBits, string>` 이 `OWORD` 행이 생길 때까지 컴파일을 거부했다. 사용법 줄과 "Unknown option" 메시지의 `--bits=` 목록은 `WORD_BITS` 로 만들기 때문에 128 이 저절로 들어갔다:

```
> node devcalc/src/main.ts 255 --bits=12
Unknown option: "--bits=12" (ignored)
Why : only --no-group, --lower, --no-prefix, --copy, --repl, --all, --bits=8|16|32|64|128 are supported.
HEX : 0xFF
DEC : 255
BIN : 0b1111_1111
```

워드 크기 없는 음수에는 바이트가 없으므로 CHAR 는 빠지고 안내가 나온다:

```
> node devcalc/src/main.ts -5 --all
HEX  : -0x5
DEC  : -5
BIN  : -0b101
OCT  : -0o5
Note: a negative number has no bytes for CHAR until a word size is chosen (--bits=8|16|...).
```

### 확인한 것

```
> npm test
check-pairs : 58 pairs, 0 failed
check-names : 32 files, 0 problems

 Test Files  11 passed (11)
      Tests  65 passed (65)
```

```ts
test("Format: ToChar writes a character literal that reads back", () => {
	...
	for (const biValue of [0n, 0x41n, 0x0a27n, 0x5cn, 0xff00n, 0x48690021n, 0x0102030405060708n]) {
		const strChar = ToChar(biValue) ?? "";
		const oBack = ParseChar(strChar.slice(1, -1)); // without the quotes
		assert.ok(oBack.bOk && oBack.biValue === biValue, `${strChar} does not read back as ${biValue}`);
	}
});
```

이런 왕복 테스트(Round trip test)는 두 함수를 서로 맞춰 본다: `ToChar` 가 무엇을 쓰든, `ParseChar` 는 같은 값으로 다시 읽어야 한다.

해 볼 것:

- `Output.ts` 의 `ERow` 에 `"UDEC"` 행을 더하면 → `OUTPUT_ROWS` 에 TS2741. 행을 쓰고 `ROW_ORDER` 에 더하면 명령줄과 웹 페이지 모두에 나타난다.
- `OCT` 의 `bExtra` 를 `false` 로 바꾸면 → `--all` 없이도 OCT 가 나온다 (그리고 앞 강의 몇 개의 출력이 달라진다: `bExtra` 가 막아 주던 것이다).
- 웹 페이지 (`npm run web`) 에서 128-bit 를 고르고 `-1` 을 입력해 보자.

---

## 정리

- **[JS]** `number` 는 2^53 까지만 정확하고, `bigint` 는 크기와 상관없이 정확하다. 산술에서 절대 섞이지 않는다 — `BigInt()` / `Number()` 로 일부러 변환한다.
- **[JS]** bigint 의 `/` 는 0 쪽으로 자르고, `%` 는 왼쪽 부호를 따르고, `Math` 는 bigint 를 받지 않고, 비교 함수 없는 `sort()` 는 텍스트로 정렬하고, JSON 에는 replacer 가 필요하다.
- **[JS]** `BigInt.asUintN` / `asIntN` 은 N 비트로 잘라 부호 없이 또는 부호 있게 읽는다 — 2의 보수 전체가 이 두 호출이다. `DataView` 로 바이트 순서를 고른다.
- **[TS]** 타입 표기는 검사하고 잊고, `as` 는 아무것도 검사하지 않고, `satisfies` 는 검사하면서 리터럴 타입, 정확한 키, 안쪽 함수의 문맥 타입을 유지한다.
- DevCalc Lv7: OCT 와 CHAR 행 (`--all`, 웹 페이지는 항상), 128 비트 워드, 명령줄과 페이지가 함께 쓰는 출력 표 하나 (`core/Output.ts`).

## 다음으로 갈 곳

[13강](../13-functions-scope/README.ko.md) 은 DevCalc 에 함수와 변수 — `popcount(x)`, `rol(x, 4)`, `mask = 0xFF00` — 를 더한다. 그러려면 함수 표, 오버로드(Overload), `Map`, 그리고 스코프(Scope)와 클로저(Closure)를 더 자세히 봐야 한다.

---

[← 이전: 11. 정규식과 리터럴 타입](../11-regex-literal-types/README.ko.md) · [목차](../../README.ko.md) · [다음: 13. 함수 표와 스코프 →](../13-functions-scope/README.ko.md)
