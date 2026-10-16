[English](README.md) · **한국어**

[← 이전: 02. 함수와 객체](../02-functions-objects/README.ko.md) · [목차](../../README.ko.md) · [다음: 04. 클래스와 에러 처리 →](../04-classes-errors/README.ko.md)

# 03. 유니온과 타입 좁히기 — 0xFF, 0b1010, 1_000 해석 (DevCalc Lv2)

> 시리즈: DH.Study.TypeScript · 03강
> 환경: Node.js v24 · TypeScript 7 · VS Code

## 목표

이 강의를 마치면 다음을 할 수 있다.

- [ ] 유니온 타입(Union Type, `string | number`)과 리터럴 유니온(Literal Union, `"HEX" | "DEC" | "BIN"`)을 쓴다
- [ ] `enum` 대신 `as const` 객체 + 유니온을 쓴다
- [ ] `typeof`, `===`, `in`, `Array.isArray`, truthy/falsy 검사로 유니온을 좁힌다 (Narrowing)
- [ ] 타입 가드(Type Guard) 함수(`strText is TRadixName`)를 만든다
- [ ] 판별 유니온(Discriminated Union)으로 "성공 또는 실패"를 표현하고, `never` 로 `switch` 가 모든 경우를 다뤘는지 검사한다
- [ ] 없을 수 있는 값을 `?.`, `??`, 조기 반환(early return)으로 다룬다 — 그리고 `!` 가 왜 위험한지 안다
- [ ] DevCalc 에 `-0xFF`, `0b1010`, `0o17`, `1_000` 을 해석하는 자체 입력 해석기(Parser)를 붙인다

## 이 강의의 목차

1. [유니온 타입 — 여러 타입 중 하나](#1-유니온-타입--여러-타입-중-하나)
2. [타입 좁히기 — 타입을 작게 만드는 검사](#2-타입-좁히기--타입을-작게-만드는-검사)
3. [판별 유니온 — 태그와 switch](#3-판별-유니온--태그와-switch)
4. [없을 수 있는 값](#4-없을-수-있는-값)
5. [따라하기](#5-따라하기)
6. [직접 만들기 — 정수 해석기](#6-직접-만들기--정수-해석기)
7. [DevCalc 스텝 — Lv2 입력 해석기](#7-devcalc-스텝--lv2-입력-해석기)
8. [정리](#정리)

이 강의의 예제 파일: [unions.ko.ts](unions.ko.ts) · [narrowing.ko.ts](narrowing.ko.ts) · [discriminated.ko.ts](discriminated.ko.ts) · [optional.ko.ts](optional.ko.ts) · [parse.ko.ts](parse.ko.ts)

> 예제는 한국어 주석판(`x.ko.ts`)을 링크한다. 같은 코드의 영어 주석판은 `x.ts` 다.

> 문법 표시: **[JS]** = JavaScript 문법 (TS 없이도 있음) · **[TS]** = TypeScript 가 더한 타입 문법 (지우면 JS) · 자세한 구분은 [00강 7-3](../00-setup/README.ko.md#7-3-ts-문법--js-문법--타입-문법)

---

## 1. 유니온 타입 — 여러 타입 중 하나

```
type TName = TypeA | TypeB | ...;
```

### 1-1. 유니온 `|`

**[TS]**

```ts
let vInput: string | number = "255";
vInput = 255;     // OK
vInput = true;    // ✕ TS2322: Type 'boolean' is not assignable to type 'string | number'
```

- "string **또는** number" 로 읽는다. 실행 중의 값은 언제나 둘 중 정확히 하나다.
- C# 에는 이런 유니온 타입이 없다. `object` 로 받아 캐스트하거나, 오버로드를 쓰거나, 기반 클래스를 만든다. TS 에서는 JSON 이나 명령줄에서 온 값이 실제로 "이것 또는 저것"인 경우가 많아서 유니온을 자주 쓴다.
- 이름 규칙: 타입이 바뀔 수 있는 값은 `v` 접두어 (`vInput`).

### 1-2. 리터럴 유니온

**[TS]**

```ts
type TRadixName = "HEX" | "DEC" | "BIN";
let strRadix: TRadixName = "HEX";
strRadix = "OCT";   // ✕ TS2322: Type '"OCT"' is not assignable to type 'TRadixName'
```

- 문자열 리터럴 자체가 타입이 될 수 있다: `"HEX"` 는 값이 `"HEX"` 하나뿐인 타입.
- 리터럴을 유니온으로 묶으면 허용 값의 닫힌 목록이 된다. 편집기가 자동 완성해 주고, 오타는 오류.
- 실행 중에는 그냥 문자열 — 변환할 것도, 생성되는 코드도 없다.

### 1-3. enum 대신 — `as const` 객체

**[JS + TS]**

```ts
const RADIX = { HEX: 16, DEC: 10, BIN: 2 } as const;
type TRadixKey = keyof typeof RADIX;      // "HEX" | "DEC" | "BIN"
type TRadix = (typeof RADIX)[TRadixKey];  // 16 | 10 | 2

function RadixOf(strKey: TRadixKey): TRadix {
	return RADIX[strKey];
}
```

| | C# `enum` | 리터럴 유니온 | `as const` 객체 + 유니온 |
|---|---|---|---|
| 실행 중의 값 | 정수 | 문자열 그 자체 | 실제 객체 (`RADIX.HEX`) |
| 실행 중에 멤버 나열 | `Enum.GetValues` | ✕ (타입은 지워짐) | `Object.keys(RADIX)` |
| `node` 로 바로 실행 (00강) | — | ○ | ○ |
| 쓰는 곳 | — | 이름 몇 개의 고정 목록 | 이름이 값에 대응할 때 (`HEX → 16`) |

- `as const` 는 모든 프로퍼티를 `readonly` 로 만들고 리터럴 값(`number` 가 아닌 `16`)을 유지한다.
- `typeof RADIX` 는 **값의 타입**을 가져오고, `keyof` 는 키의 유니온, `T[K]` 는 프로퍼티 타입을 찾는다.
- 이 저장소는 `enum` 을 전혀 쓰지 않는다 — [00강 enum-sample.ko.ts](../00-setup/README.ko.md) 참고.

### 1-4. `T | undefined` — 가장 흔한 유니온

**[TS]**

```ts
const strFound = arrName.find((strName) => strName.startsWith("O"));   // TRadixName | undefined
strFound.length;   // ✕ TS18048: 'strFound' is possibly 'undefined'
```

이미 만난 적이 있다: 02강의 선택 파라미터(`strTitle?: string`)가 `string | undefined` 였다. `find`, `Map.get`, 배열 인덱스(4장)도 이것을 돌려준다. `strict` 가 켜져 있으면 쓰기 전에 확인하라고 한다. 방법은 2장.

## 2. 타입 좁히기 — 타입을 작게 만드는 검사

**[JS + TS]** — 검사 자체는 평범한 JS 이고, TS 가 그것을 읽어 타입을 좁힌다

```ts
function ToBigInt(vValue: string | number | bigint): bigint {
	if (typeof vValue === "bigint") {
		return vValue;                       // bigint
	}
	if (typeof vValue === "number") {
		return BigInt(Math.trunc(vValue));   // number
	}
	return BigInt(vValue.trim());            // 남은 것은 string 뿐
}
```

`if` 안에서는 TS 가 더 좁은 타입을 안다. `return` 뒤의 나머지 코드는 그 경우가 사라졌다는 것을 안다. 분기마다 `vValue` 에 마우스를 올려 타입이 바뀌는 것을 보자.

### 2-1. TS 가 알아듣는 검사

| 검사 | 좁히는 대상 | 예 |
|---|---|---|
| `typeof x === "string"` | 기본 타입 (`string`, `number`, `bigint`, `boolean`, `undefined`, `object`, `function`) | `typeof vValue === "bigint"` |
| `x === 값` | 리터럴 유니온, `undefined`, `null` | `strChar === "+" \|\| strChar === "-"` → `"+" \| "-"` |
| `"key" in x` | 프로퍼티로 구분되는 객체 유니온 | `"biValue" in oItem` → `IRegister` |
| `Array.isArray(x)` | 값 하나 또는 배열 | `string \| string[]` → `string[]` |
| `if (x)` | `undefined` / `null` 제거 (그리고 `""`, `0` 도!) | `if (strName)` |
| `x instanceof C` | 클래스 인스턴스 | 04강 |

- C# 패턴 매칭 `if (o is string s)` 는 **새** 변수 `s` 를 만든다. TS 는 **같은** 변수를 좁힌다 — 새 이름도, 캐스트도 없다.
- truthy/falsy 검사(Truthiness)는 숫자와 문자열에서 함정이다: `if (nSize)` 는 `0` 을 "없음"처럼, `if (strName)` 은 `""` 를 "없음"처럼 다룬다. `0` 이나 `""` 가 올바른 값이면 `=== undefined` 로 비교한다.

### 2-2. 타입 가드 함수 — `x is T`

**[TS]**

```ts
const RADIX_NAMES = ["HEX", "DEC", "BIN"] as const;
type TRadixName = (typeof RADIX_NAMES)[number];   // "HEX" | "DEC" | "BIN"

function IsRadixName(strText: string): strText is TRadixName {
	return (RADIX_NAMES as readonly string[]).includes(strText);
}

if (IsRadixName(strText)) {
	const strName: TRadixName = strText;   // 가드 덕분에 좁혀짐
}
```

- 검사가 `if` 한 줄에 넣기에 길면, 반환 타입이 `strText is TRadixName` 인 함수로 뺀다. 호출하는 쪽의 `if` 가 검사를 직접 쓴 것처럼 좁혀진다.
- TS 는 가드의 판단을 **그대로 받아들인다**. 함수 본문이 틀리면 좁힌 결과도 틀린다 — 가드는 짧게.
- `(typeof RADIX_NAMES)[number]` 는 "이 배열 요소의 타입". `as const` 와 함께 쓰면 리터럴의 유니온이 되므로, 목록과 타입이 어긋날 일이 없다.

### 2-3. `unknown` — 한 단계씩 확인

**[JS + TS]**

```ts
const vData: unknown = JSON.parse('{"strName":"AX","nBits":16}');
vData.nBits;   // ✕ TS18046: 'vData' is of type 'unknown'

if (typeof vData === "object" && vData !== null && "nBits" in vData && typeof vData.nBits === "number") {
	vData.nBits;   // number
}
```

01강에서 "`any` 보다 `unknown`" 이라고 했던 이유가 이것이다: `unknown` 은 바로 이런 검사를 강제한다. `&&` 마다 조금씩 좁혀진다 (`typeof null` 도 `"object"` 라서 `!== null` 이 필요).

## 3. 판별 유니온 — 태그와 switch

### 3-1. 공통 태그 프로퍼티

**[TS]**

```ts
type TToken =
	| { strKind: "number"; biValue: bigint }
	| { strKind: "op"; strOp: "+" | "-" | "*" | "/" }
	| { strKind: "paren"; bOpen: boolean };

function DescribeToken(oToken: TToken): string {
	switch (oToken.strKind) {
		case "number": return `number ${oToken.biValue}`;   // biValue 는 이 멤버에만 있다
		case "op":     return `operator ${oToken.strOp}`;
		case "paren":  return oToken.bOpen ? "open paren" : "close paren";
		default:       return AssertNever(oToken);
	}
}
```

- 모든 멤버가 같은 프로퍼티(`strKind`)를 갖고 **서로 다른 리터럴 값**을 가진다. 그 프로퍼티 하나만 검사하면 멤버 하나로 좁혀진다.
- 10강에서 DevCalc 의 렉서(Lexer)가 토큰을 이렇게 표현한다.
- C# 으로 치면: 추상 `record Token` + sealed 하위 클래스 + 타입에 대한 `switch` 식. F# 에서는 판별 유니온이라고 부른다.

### 3-2. 빠짐없이 처리했는지 검사 — `never`

**[TS]**

```ts
function AssertNever(oValue: never): never {
	throw new Error(`Unexpected value: ${JSON.stringify(oValue)}`);
}
```

- case 세 개를 지나면 남는 것이 없다: `default` 에서 `oToken` 은 `never`.
- `TToken` 에 네 번째 종류를 더하거나 case 를 하나 지우면 `AssertNever(oToken)` 에 빨간 줄(TS2345) — **고치는 것을 잊은 곳을 컴파일러가 알려 준다**.
- `never` 는 01강에서 "끝나지 않는 함수"로 나왔다. 여기서는 "있을 수 없는 값"이기도 하다.

### 3-3. `as` 는 아무것도 검사하지 않는다

**[TS]**

```ts
const oBad = JSON.parse('{"strKind":"space"}') as TToken;   // 컴파일됨
DescribeToken(oBad);   // 실행 중: default 로 빠짐 → AssertNever 가 예외
```

`as` 는 C# 의 캐스트가 아니다 — 변환도 검사도 하지 않고 TS 에게 "이 타입으로 취급하라"고 알려 줄 뿐이다. 외부 데이터는 확인해야 한다 (2-3). `AssertNever` 는 그것을 놓쳤을 때의 안전망.

### 3-4. 예외 없이 성공 또는 실패

**[TS]**

```ts
type TParseResult = { bOk: true; biValue: bigint } | { bOk: false; strError: string };

const oResult = ParseDecimal("12a");
if (oResult.bOk) {
	oResult.biValue;    // 성공 멤버
} else {
	oResult.strError;   // 실패 멤버
}
oResult.biValue;   // ✕ TS2339: 아직 확인 전
```

- C# 의 `int.TryParse(s, out var n)` 와 비슷하다: 잘못된 입력은 예외가 아니라 **예상된** 결과다.
- `TryParse` 와 달리 실패에 이유가 담기고, `bOk` 를 확인하기 전에는 `biValue` 를 **읽을 수 없다**.
- 6장의 해석기가 이 방식으로 만들어진다. 05강에서 제네릭 `TResult<T, E>` 로 일반화한다.

## 4. 없을 수 있는 값

`?.` 와 `??` 는 **[JS]**, `!` 와 검사는 **[TS]**

```ts
oConfig.oGrouping?.nSize          // oGrouping 이 없으면 undefined — 예외 없음
oConfig.oGrouping?.nSize ?? 4     // null / undefined 일 때만 기본값
arrDigit[2]                       // string | undefined (noUncheckedIndexedAccess)
arrDigit[0]!                      // 단언일 뿐 — 실행 중 검사 없음
```

| | TS / JS | C# |
|---|---|---|
| 옵셔널 체이닝 (Optional Chaining) | `o?.p`, `fn?.()` | `o?.P` — 같음 |
| 없을 때 기본값 | `x ?? y` | `x ?? y` — 같음 |
| falsy 값이면 기본값 | `x \|\| y` (`0`, `""`, `false` 도 바뀜) | — |
| "null 이 아님" 단언 | `x!` | `x!` (null-forgiving) — 같음 |
| 인덱스 범위 밖 | `undefined` | `IndexOutOfRangeException` |

- `??` vs `||`: `{ nSize: 0 }` 이 "묶지 않음"이라는 뜻일 때 `nSize || 4` 는 `0` 을 조용히 `4` 로 바꾼다. 정말로 "falsy 값 전부"를 뜻하는 게 아니면 기본값에는 `??` 를 쓴다.
- `noUncheckedIndexedAccess` (이 저장소 tsconfig 에서 켜져 있음) 는 `arr[i]` 와 `oRecord[key]` 에 `undefined` 를 포함시킨다. JS 는 예외 대신 `undefined` 를 돌려주기 때문.
- **조기 반환(early return)** 이 가장 깔끔한 검사다: `if (strChar === undefined) { return "(empty)"; }` — 그 뒤의 모든 줄은 `string` 을 본다.
- `!` 는 타입에서 `undefined` 를 지울 뿐 **다른 일은 하지 않는다**. 잘못 쓴 `!` 는 TS 가 없을 때와 똑같이 실행 중에 에러가 난다. 값이 있다는 것을 방금 확인했는데 TS 가 그걸 모를 때만 쓴다.

---

## 5. 따라하기

각 파일을 열고 `F5` 를 누르거나 명령줄에서 실행한다. 실행할 수 없는 환경이면 아래 결과와 코드를 함께 읽는다.

### [unions.ko.ts](unions.ko.ts) — 유니온, 리터럴 유니온, as const, T | undefined

```
> node lessons/03-unions-narrowing/unions.ko.ts
1) vInput = 255 / typeof = string
   vInput = 255 / typeof = number
2) strRadix = BIN
3) Describe: FF 255
4) RADIX.HEX = 16 / RadixOf("BIN") = 2 / keys = HEX, DEC, BIN
5) find O* = undefined
6) Expected error: Cannot read properties of undefined (reading 'length')
   Why : find found nothing and returned undefined, which has no properties.
   Fix : TS flags it (TS18048). Check for undefined first — narrowing.ts.
```

해 볼 것: `// strRadix = "OCT";` 의 주석을 풀어 보자. 그다음 `strRadix = "` 까지 쓰고 `Ctrl+Space` — 허용되는 세 값이 목록으로 나온다.

### [narrowing.ko.ts](narrowing.ko.ts) — typeof, truthy/falsy, ===, in, Array.isArray, 타입 가드, unknown

```
> node lessons/03-unions-narrowing/narrowing.ko.ts
1) ToBigInt: 255n 255n 255n
2) Label: HEX (none) (none)
3) SignOf: - undefined
4) Show: AX = 255 / ZF is on
5) CountInputs: 1 3
6) HEX is a TRadixName
6) OCT is just a string
7) nBits from JSON = 16
```

2번 줄: `Label("")` 이 `(none)` 을 출력했다 — 2-1 의 truthy/falsy 함정. 해 볼 것: `ToBigInt` 의 각 `return` 줄에서 `vValue` 에 마우스를 올려 보자.

### [discriminated.ko.ts](discriminated.ko.ts) — 태그 + switch, never, as, 성공 또는 실패

```
> node lessons/03-unions-narrowing/discriminated.ko.ts
2) open paren / number 1 / operator + / number 2 / close paren
4) Expected error: Unexpected value: {"strKind":"space"}
   Why : as TToken only told TS what to believe; "space" is not in the union.
   Fix : check outside data before use (narrowing.ts 7). AssertNever caught it here.
5) ok    : 255n
5) error : not a decimal integer: "12a"
```

해 볼 것: `case "paren":` 두 줄을 지우고 `AssertNever(oToken)` 을 보자. 그다음 `TToken` 에 `| { strKind: "space" }` 를 더해도 같은 빨간 줄이 생긴다.

### [optional.ko.ts](optional.ko.ts) — ?., ?? vs ||, 인덱스, 조기 반환, !

```
> node lessons/03-unions-narrowing/optional.ko.ts
1) full: 4 / empty: undefined
2) nSize 0 with ?? = 0 / with || = 4 (0 was lost)
   separator "" with ?? = "" / with || = "_"
3) arrDigit[2] = undefined / length = 0
4) FirstChar: H (empty)
5) arrDigit[0]! = 0
   Expected error: Cannot read properties of undefined (reading 'length')
   Why : ! only silences TS; the value was still undefined at runtime.
   Fix : check it (if / ?? / ?.) instead of using !.
```

## 6. 직접 만들기 — 정수 해석기

**[JS + TS]**

지금까지 DevCalc 는 입력을 `BigInt()` 에 넘겼다. `BigInt()` 는 `1_000`, `0xFFFF_FFFF`, `-0xFF` 를 거부하고, 실패하면 `SyntaxError` 라고만 한다. 직접 만든다. 전체 코드: [parse.ko.ts](parse.ko.ts).

### 결과 타입과 접두어 표

```ts
type TParseResult = { bOk: true; biValue: bigint } | { bOk: false; strError: string };

const PREFIX_RULES = {
	"0x": { nRadix: 16, strName: "hex" },
	"0o": { nRadix: 8, strName: "octal" },
	"0b": { nRadix: 2, strName: "binary" },
} as const;
type TPrefix = keyof typeof PREFIX_RULES;   // "0x" | "0o" | "0b"

function IsPrefix(strText: string): strText is TPrefix {
	return Object.hasOwn(PREFIX_RULES, strText);
}
```

`in` 대신 `Object.hasOwn`: `"constructor" in {}` 는 `true` (상속된 것), `Object.hasOwn` 은 객체 자신의 키만 본다.

### 부호 → 접두어 → `_` → 숫자

```ts
function ParseInteger(strInput: string): TParseResult {
	let strText = strInput.trim().toLowerCase();
	if (strText === "") {
		return Fail("empty input");
	}

	let bNegative = false;
	const strFirst = strText[0];                   // string | undefined
	if (strFirst === "-" || strFirst === "+") {    // "-" | "+" 로 좁혀짐
		bNegative = strFirst === "-";
		strText = strText.slice(1);
	}

	let oRule: IRadixRule = DECIMAL_RULE;
	const strHead = strText.slice(0, 2);
	if (IsPrefix(strHead)) {
		oRule = PREFIX_RULES[strHead];   // strHead 가 TPrefix 라서 안전하게 찾는다
		strText = strText.slice(2);
	}

	if (strText.startsWith("_") || strText.endsWith("_") || strText.includes("__")) {
		return Fail(`"_" must sit between digits`);
	}
	const strDigits = strText.replaceAll("_", "");
	if (strDigits === "") {
		return Fail(`no digits after the sign or prefix`);
	}

	const biRadix = BigInt(oRule.nRadix);
	let biValue = 0n;
	for (const strChar of strDigits) {
		const nDigit = DIGITS.indexOf(strChar);   // DIGITS = "0123456789abcdef"
		if (nDigit < 0 || nDigit >= oRule.nRadix) {
			return Fail(`"${strChar}" is not a valid ${oRule.strName} digit`);
		}
		biValue = biValue * biRadix + BigInt(nDigit);
	}
	return { bOk: true, biValue: bNegative ? -biValue : biValue };
}
```

- 일찍 `return Fail(...)` 하는 곳마다 좁히기 한 단계: 그 뒤의 코드는 그 문제가 없다는 것을 안다.
- `값 = 값 * 진수 + 자릿값` 은 숫자를 왼쪽부터 읽는다: `"1A"` (16진) → `0×16+1 = 1` → `1×16+10 = 26`.
- 처음부터 끝까지 `bigint` 라서 64비트(또는 그보다 긴) 입력도 정밀도를 잃지 않는다 (01강).

### 실행

```
> node lessons/03-unions-narrowing/parse.ko.ts
1) valid:
   "255"          → 255
   "-0xFF"        → -255
   "0b1010"       → 10
   "0o17"         → 15
   "1_000"        → 1000
   "0xFFFF_FFFF"  → 4294967295
   "+42"          → 42
   " 0XAB "       → 171
2) invalid:
   ""             → error: empty input
   "0x"           → error: no digits after the sign or prefix
   "12a"          → error: "a" is not a valid decimal digit
   "0b102"        → error: "2" is not a valid binary digit
   "1__0"         → error: "_" must sit between digits
   "_1"           → error: "_" must sit between digits
   "0xG"          → error: "g" is not a valid hex digit
```

해 볼 것: DevCalc 는 10진수를 `1,234,567` 로 출력한다. 10진 입력에서 `,` 도 받도록 고쳐서, 출력을 그대로 다시 넣을 수 있게 해 보자.

## 7. DevCalc 스텝 — Lv2 입력 해석기

[devcalc/src/core/Parse.ts](../../devcalc/src/core/Parse.ts) 는 6장의 해석기를 export 한 것이다.

```ts
export type TParseResult = { readonly bOk: true; readonly biValue: bigint } | { readonly bOk: false; readonly strError: string };
export function ParseInteger(strInput: string): TParseResult { ... }
```

[devcalc/src/main.ts](../../devcalc/src/main.ts) 는 `BigInt()` try/catch 를 이것으로 바꿨다.

```ts
const oParsed = ParseInteger(strInput);
if (!oParsed.bOk) {
	console.log(`Invalid input: "${strInput}"`);
	console.log(`Why : ${oParsed.strError}`);
	console.log("Fix : use an integer like 255, -0xFF, 0b1010, 0o17 or 1_000.");
	process.exit(1);
}
const biValue = oParsed.biValue;   // 좁혀짐 : 여기서는 bOk 가 true
```

`process.exit` 의 반환 타입이 `never` 라서, `if` 뒤에서 TS 는 `oParsed` 가 성공 멤버라는 것을 안다.

실행:

```
> node devcalc/src/main.ts 0xFFFF_FFFF
HEX : 0xFFFF_FFFF
DEC : 4,294,967,295
BIN : 0b1111_1111_1111_1111_1111_1111_1111_1111

> node devcalc/src/main.ts 0o777
HEX : 0x1FF
DEC : 511
BIN : 0b1_1111_1111

> node devcalc/src/main.ts -0b1010 --no-group
HEX : -0xA
DEC : -10
BIN : -0b1010

> node devcalc/src/main.ts 0x1G
Invalid input: "0x1G"
Why : "g" is not a valid hex digit
Fix : use an integer like 255, -0xFF, 0b1010, 0o17 or 1_000.
```

> 03강 시점의 출력이다. [11강](../11-regex-literal-types/README.ko.md) 에서 `1'000`, `1Fh`, `4K`, `'A'` 가 추가되므로, 거기서는 "Fix" 줄에 그것도 나온다.

이제 DevCalc 의 출력을 다시 입력으로 넣을 수 있다: 02강에서는 `0xFFFF_FFFF` 가 거부됐다.

테스트: [devcalc/tests/Parse.test.ts](../../devcalc/tests/Parse.test.ts) 를 새로 만들었다.

```ts
function ParseOk(strInput: string): bigint {
	const oResult = ParseInteger(strInput);
	assert.ok(oResult.bOk, `expected success: "${strInput}"`);
	return oResult.biValue;   // assert.ok 는 단언 함수(Assertion Function) → 좁혀짐
}
```

`assert.ok` 는 `asserts value` 로 선언되어 있어서, `if` 뒤처럼 TS 가 그 뒤를 좁힌다.

```
> npm test
check-pairs : 20 pairs, 0 failed
✔ Format: 255
✔ Format: zero and negative
✔ GroupDigits
✔ Format options
✔ Parse: decimal and sign
✔ Parse: prefixes and case
✔ Parse: _ separators
✔ Parse: invalid input
ℹ pass 8
```

## 정리

- `A | B` : 여러 타입 중 하나인 값. 리터럴 유니온(`"HEX" | "DEC"`)은 값의 닫힌 목록.
- `enum` 대신: `as const` 객체 + `keyof typeof` / `(typeof X)[K]`.
- 좁히기: `typeof`, `===`, `in`, `Array.isArray`, truthy/falsy, 타입 가드(`x is T`). TS 는 같은 변수를 좁힌다 — 캐스트 없음.
- truthy/falsy 검사는 `0` 과 `""` 도 걸러 낸다. 그 값들이 올바른 값이면 `=== undefined` 나 `??` 를 쓴다.
- 판별 유니온 = 공통 태그 + `switch`. `AssertNever` (`never`) 로 빠진 case 를 컴파일러가 찾게 한다.
- `as` 와 `!` 는 실행 중에 아무것도 검사하지 않는다. 외부 데이터는 `unknown` + 검사로.
- 예상된 실패에는 예외 대신 결과 유니온(`{ bOk: true; ... } | { bOk: false; ... }`).

**다음 → [04. 클래스와 에러 처리](../04-classes-errors/README.ko.md)**: `class`, `private` / `#private`, `instanceof`, 사용자 정의 `Error` 클래스, `unknown` 으로 받는 `try`/`catch`. DevCalc Lv3 에 워드 크기(8/16/32/64비트)와 두 수 계산이 들어간다.

---

[← 이전: 02. 함수와 객체](../02-functions-objects/README.ko.md) · [목차](../../README.ko.md) · [다음: 04. 클래스와 에러 처리 →](../04-classes-errors/README.ko.md)
