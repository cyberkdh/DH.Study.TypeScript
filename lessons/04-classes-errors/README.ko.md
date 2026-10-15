[English](README.md) · **한국어**

[← 이전: 03. 유니온과 타입 좁히기](../03-unions-narrowing/README.ko.md) · [목차](../../README.ko.md) · [다음: 05. 제네릭 →](../05-generics/README.ko.md)

# 04. 클래스와 에러 처리 — 워드 크기와 두 수 계산 (DevCalc Lv3)

> 시리즈: DH.Study.TypeScript · 04강
> 환경: Node.js v24 · TypeScript 7 · VS Code

## 목표

이 강의를 마치면 다음을 할 수 있다.

- [ ] 필드(Field), 생성자(Constructor), 메서드(Method), 게터(Getter), `static` 멤버가 있는 클래스를 만든다
- [ ] TS `private` 와 JS `#private` 중 무엇을 쓸지 고르고, 이 저장소에 매개변수 프로퍼티(Parameter Properties)가 없는 이유를 안다
- [ ] `abstract`, `extends`, `super`, `override`, `implements` 를 쓰고, `instanceof` 로 타입을 좁힌다
- [ ] 에러를 `unknown` 으로 받고, `cause` 가 있는 사용자 정의 `Error` 클래스를 만들고, 처리할 수 없는 에러는 다시 던진다 (Rethrow)
- [ ] `BigInt.asUintN` / `asIntN` 으로 값을 8/16/32/64비트로 자른다
- [ ] DevCalc 에 워드 크기(Word Size, `--bits=8`)와 두 수 계산(`"0xFF & 0x0F"`)을 넣는다

## 이 강의의 목차

1. [클래스](#1-클래스)
2. [상속과 인터페이스](#2-상속과-인터페이스)
3. [에러 — throw, try, catch](#3-에러--throw-try-catch)
4. [워드 크기와 오버플로](#4-워드-크기와-오버플로)
5. [따라하기](#5-따라하기)
6. [직접 만들기 — 두 수 계산기](#6-직접-만들기--두-수-계산기)
7. [DevCalc 스텝 — Lv3 워드 크기와 두 수 계산](#7-devcalc-스텝--lv3-워드-크기와-두-수-계산)
8. [정리](#정리)

이 강의의 예제 파일: [classes.ko.ts](classes.ko.ts) · [inheritance.ko.ts](inheritance.ko.ts) · [errors.ko.ts](errors.ko.ts) · [wordsize.ko.ts](wordsize.ko.ts) · [calc.ko.ts](calc.ko.ts)

> 예제는 한국어 주석판(`x.ko.ts`)을 링크한다. 같은 코드의 영어 주석판은 `x.ts` 다.

> 문법 표시: **[JS]** = JavaScript 문법 (TS 없이도 있음) · **[TS]** = TypeScript 가 더한 타입 문법 (지우면 JS) · 자세한 구분은 [00강 7-3](../00-setup/README.ko.md#7-3-ts-문법--js-문법--타입-문법)

---

## 1. 클래스

### 1-1. 필드, 생성자, 메서드

**[JS + TS]** — `class` 는 JS, 타입을 붙인 필드 선언은 TS

```ts
class CRegister {
	strName: string;
	biValue: bigint;

	constructor(strName: string, biValue = 0n) {
		this.strName = strName;   // "this." 는 필수
		this.biValue = biValue;
	}

	ToString(): string {
		return `${this.strName} = 0x${this.biValue.toString(16).toUpperCase()}`;
	}
}
const oAx = new CRegister("AX", 255n);
```

| | C# | TS / JS |
|---|---|---|
| 클래스 안에서 멤버 접근 | `strName` 또는 `this.strName` | **항상** `this.strName` |
| 생성자 | `public CRegister(...)` | `constructor(...)` |
| 기본 접근 수준 | `private` | `public` |
| 생성자 오버로드 | 가능 | 생성자는 하나 (선택적 / 기본값 매개변수로 대신) |
| 실행 중 `typeof oAx` | — | `"object"` — 클래스는 객체를 만드는 함수 |

- 이름 규칙: 클래스는 `C` 접두어 (`CRegister`). [이름 규칙](../00-setup/README.ko.md) 참고.
- `strict` 에서는 모든 필드를 생성자에서 대입하거나 초기값을 줘야 한다 (아니면 TS2564).

### 1-2. 이 저장소에는 매개변수 프로퍼티가 없다

**[TS]**

```ts
class CShort { constructor(private nBits: number) {} }   // ✕ TS1294: This syntax is not allowed when 'erasableSyntaxOnly' is enabled
```

TS 에는 축약 문법이 있다: 생성자 매개변수에 접근 제한자를 붙이면 필드 선언과 대입을 **한 번에** 한다. C# 12 의 기본 생성자(Primary Constructor)와 비슷하다. 하지만 이 문법은 **코드를 만들어 낸다** (`this.nBits = nBits`). 그래서 타입만 지워서는 안 되는데, Node 의 타입 제거(Type Stripping, 00강)는 지우기만 한다. 이 저장소는 `erasableSyntaxOnly` 를 켜서 `enum` 과 마찬가지로 이 문법을 막는다. 1-1 처럼 필드를 선언하고 대입하자.

### 1-3. `private` 와 `#private`

```ts
class CCounter {
	private nTsPrivate = 0;   // [TS] 컴파일러만 검사
	#nJsPrivate = 0;          // [JS] 실행 중에도 정말로 비공개
}
oCounter.nTsPrivate;   // ✕ TS2341: Property 'nTsPrivate' is private and only accessible within class 'CCounter'
```

| | `private x` [TS] | `#x` [JS] |
|---|---|---|
| 누가 검사하나 | 컴파일러 | JS 엔진 |
| 타입을 지운 뒤 | 일반 프로퍼티 | 여전히 비공개 |
| `Object.keys`, `JSON.stringify` | **보임** | 숨겨짐 |
| 쓸 때 | — | 실제로 데이터를 숨길 때 (이 저장소의 선택) |

[classes.ko.ts](classes.ko.ts) 를 실행하면 `Object.keys(oCounter)` 가 `[ 'nTsPrivate' ]` 를 출력한다 — "private" 필드가 그대로 보인다. DevCalc 는 `#` 를 쓴다 (`#oWord`, `#biBits`).

### 1-4. `readonly`, 게터, `static`

**[JS + TS]** — `readonly` 는 TS, `get` 과 `static` 은 JS

```ts
class CWordSize {
	static readonly MAX_BITS = 64;   // 객체마다가 아니라 클래스에 하나
	readonly nBits: number;           // 생성자에서 정하고, 그 뒤로 고정

	get nBytes(): number {            // 필드처럼 읽음: oWord.nBytes
		return this.nBits / 8;
	}
}
oWord.nBits = 32;   // ✕ TS2540: Cannot assign to 'nBits' because it is a read-only property
```

- 게터는 C# 의 `{ get; }` 프로퍼티다. 이름은 함수 규칙이 아니라 **돌려주는 값** 기준 (`nBytes`, `biMax`).
- `private` 와 마찬가지로 `readonly` 도 TS 만 검사한다.

### 1-5. `this` 는 클래스가 아니라 호출 방식이 정한다

**[JS]**

```ts
const fnToString = oAx.ToString;
fnToString();   // ✕ 실행 중: Cannot read properties of undefined (reading 'strName')

const fnBound = () => oAx.ToString();   // ○ 화살표 함수가 객체를 붙잡아 둠
```

C# 의 메서드 그룹(Method Group)은 객체를 기억한다. JS 에서 `this` 는 **호출할 때 점(.) 왼쪽에 있는 것**이다. 점이 없으면 `this` 는 `undefined` 다. 메서드를 콜백(02강)으로 넘길 때 문제가 된다 — 예를 들어 07강의 `addEventListener("click", oCalc.Run)`. 화살표 함수로 감싸거나 `.bind(oAx)` 를 쓴다.

## 2. 상속과 인터페이스

### 2-1. `abstract`, `extends`, `super`, `override`

```ts
abstract class CFormatter {                          // [TS] abstract
	abstract Format(biValue: bigint): string;
	Show(biValue: bigint): string {
		return `${this.strLabel} : ${this.Format(biValue)}`;
	}
}

class CHexFormatter extends CFormatter {             // [JS] extends
	constructor() {
		super("HEX");                                 // [JS] this 를 쓰기 전에
	}
	override Format(biValue: bigint): string {        // [TS] override
		return "0x" + biValue.toString(16).toUpperCase();
	}
}

class CLowerHexFormatter extends CHexFormatter {
	override Format(biValue: bigint): string {
		return super.Format(biValue).toLowerCase();   // [JS] 부모의 메서드 호출
	}
}
new CFormatter("X");   // ✕ TS2511: Cannot create an instance of an abstract class
```

- JS 의 메서드는 모두 "virtual" 이다. `virtual` 키워드는 없다.
- `override` 는 보통 TS 에서는 선택이다. 이 저장소는 `noImplicitOverride` 로 필수로 만든다 (없으면 TS4114). 그래서 부모 메서드 이름을 바꾸면 더 이상 재정의하지 않게 된 자식이 모두 드러난다.
- 클래스는 하나만 상속한다. `abstract` 와 `override` 는 지워지고, `extends` 와 `super` 는 JS 다.

### 2-2. `implements`

**[TS]**

```ts
interface IResettable {
	Reset(): void;
}
class CAccumulator implements IResettable {
	#biTotal = 0n;
	Add(biValue: bigint): this {
		this.#biTotal += biValue;
		return this;   // 이어 쓰기 (Chaining): new CAccumulator().Add(0xf0n).Add(0x0fn)
	}
	Reset(): void { this.#biTotal = 0n; }
}
```

`implements` 는 "이 클래스에 그 멤버들이 있다"는 검사일 뿐, 실행 중에는 아무것도 더하지 않는다. C# 과 달리 `IResettable` 로 쓰려고 `implements` 가 **꼭 있어야** 하지는 않다 — `Reset()` 이 맞게 있는 객체면 무엇이든 된다 (구조적 타입, Structural Typing, 02강).

### 2-3. `instanceof` 와 그 한계

**[JS + TS]**

```ts
function Describe(vItem: CFormatter | IResettable): string {
	if (vItem instanceof CFormatter) {
		return vItem.Show(10n);   // CFormatter 로 좁혀짐
	}
	return "something resettable";
}
// vItem instanceof IResettable   ← 불가능: 인터페이스는 실행 중에 없음

const oFake: CHexFormatter = { strLabel: "FAKE", Format: () => "?", Show: () => "fake" };   // 컴파일됨
oFake instanceof CHexFormatter;   // false
```

- `instanceof` 는 실행 중에 **프로토타입 체인(Prototype Chain)** 을 검사한다. 03강 표에서 남겨 둔 좁히기 검사다.
- 타입이 구조적이라서, 공개 멤버가 같은 일반 객체는 TS 에게는 `CHexFormatter` **이지만** `instanceof` 에게는 아니다. `#private` 필드가 있는 클래스는 이 문제가 없다: 객체 리터럴은 `#` 필드를 가질 수 없어서 TS 가 흉내 낸 객체를 거부한다.

## 3. 에러 — throw, try, catch

### 3-1. `try` / `catch` / `finally`

**[JS]**

```ts
try {
	Divide(10n, 0n);   // bigint / 0n 은 RangeError 를 던짐
} catch (e) {
	...
} finally {
	console.log("finally runs either way");
}
```

C# 과 같지만 하나가 다르다: `catch` 는 **하나**이고 `catch (RangeError e)` 같은 필터가 없다. 타입은 안에서 확인한다.

### 3-2. `e` 는 `unknown`

**[TS]**

```ts
try {
	throw "just a string";            // JS 는 무엇이든 throw 할 수 있음
} catch (e) {
	e.message;                         // ✕ TS18046: 'e' is of type 'unknown'
	const strMessage = e instanceof Error ? e.message : String(e);   // ○ 먼저 좁힘
}
```

`strict` 에 포함된 `useUnknownInCatchVariables` 때문에 `e` 는 `unknown` 이다. `Error` 라는 보장이 없기 때문이다. `instanceof` 로 좁힌다 (03강).

### 3-3. 내장 에러

| 에러 | 예 | C# |
|---|---|---|
| `SyntaxError` | `BigInt("12a")`, `JSON.parse("{")` | `FormatException` |
| `RangeError` | `1n / 0n`, `(255).toString(99)` | `DivideByZeroException`, `ArgumentOutOfRangeException` |
| `TypeError` | `null.length`, `1n >>> 1n` | `NullReferenceException`, `InvalidCastException` |

`1n >>> 1n` 은 컴파일 에러이기도 하다 (TS2365: bigint 에는 부호 없는 오른쪽 시프트가 없음). [errors.ko.ts](errors.ko.ts) 는 실행 중 에러를 보여 주려고 `// @ts-expect-error` 로 막아 두었다.

### 3-4. 사용자 정의 에러 클래스 — `cause` 와 함께

**[JS + TS]**

```ts
class CCalcError extends Error {
	override readonly name = "CCalcError";   // 스택 트레이스(Stack Trace)와 e.name 에 나옴
	readonly strFix: string;                  // 추가 데이터: 사용자가 할 수 있는 일

	constructor(strMessage: string, strFix: string, oOptions?: ErrorOptions) {
		super(strMessage, oOptions);
		this.strFix = strFix;
	}
}

try {
	return biA / biB;
} catch (e) {
	throw new CCalcError("division by zero", "use a non-zero divisor", { cause: e });
}
```

- `cause` (ES2022) 는 C# 의 `InnerException` 이다: 원래 에러가 `e.cause` 에 남는다.
- `name` 은 `Error` 의 필드라서 다시 정의하려면 `override` 가 필요하다.
- 최신 컴파일 대상(Target)에서는 `Error` 를 상속한 클래스에 `instanceof CCalcError` 가 잘 동작한다 (예전 ES5 출력에서는 우회가 필요했지만 여기서는 상관없다).

### 3-5. 처리할 수 있는 것만 잡는다

```ts
function TryCalc(fnCalc: () => bigint): string {
	try {
		return String(fnCalc());
	} catch (e) {
		if (e instanceof CCalcError) {
			return `error: ${e.message}`;   // 예상된 에러: 사용자에게 알림
		}
		throw e;                             // 직접 만든 에러가 아님: 버그 — 숨기지 않음
	}
}
```

| | 결과 유니온 (03강) | 예외 (Exception) |
|---|---|---|
| 쓰는 곳 | 호출한 쪽 가까이에서 예상되는 실패 (잘못된 입력) | 깊은 곳의 실패, 또는 호출한 쪽이 고칠 수 없는 실패 |
| TS 검사 | 있음 — `bOk` 를 꼭 확인 | 없음 — 함수 타입에 무엇을 던지는지 안 나옴 |
| DevCalc | `ParseInteger` | `CCalculator` → `CCalcError` |

C# 과 TS 모두 검사 예외(Checked Exception)가 없어서, 타입에 `throws` 목록이 나오지 않는다. 결과 유니온은 TS 가 검사하는 값이다. DevCalc 는 두 방식을 모두 쓴다.

## 4. 워드 크기와 오버플로

**[JS]**

```ts
BigInt.asUintN(8, 256n)   // 0n      — 아래 8비트만, 부호 없음
BigInt.asIntN(8, 255n)    // -1n     — 아래 8비트를 2의 보수(Two's Complement)로 읽음
BigInt.asUintN(16, -1n)   // 65535n  — 0xFFFF
```

| 비트 | C# | 부호 없는 범위 | 부호 있는 범위 | -1 을 부호 없이 |
|---|---|---|---|---|
| 8 | `byte` / `sbyte` | 0..255 | -128..127 | `0xFF` |
| 16 | `ushort` / `short` | 0..65,535 | -32,768..32,767 | `0xFFFF` |
| 32 | `uint` / `int` | 0..4,294,967,295 | -2,147,483,648..2,147,483,647 | `0xFFFFFFFF` |
| 64 | `ulong` / `long` | 0..2⁶⁴-1 | -2⁶³..2⁶³-1 | `0xFFFFFFFFFFFFFFFF` |

- `bigint` 는 오버플로(Overflow)가 없으므로 워드 크기는 **직접** 적용한다: 정확히 계산한 뒤 N비트만 남긴다. C# 의 기본 `unchecked` 동작과 같다 (`(byte)(0xFF + 1)` 은 `0`).
- 같은 비트가 두 가지 수를 뜻한다: `0xFF` 는 부호 없이 255, 부호 있게 -1. DevCalc Lv3 은 둘 다 보여 준다.
- 왜 `number` 가 아닌가? `number` 의 비트 연산자는 먼저 **32비트 부호 있는 정수**로 바꾼다: `0xFFFFFFFF | 0` 은 `-1`, `1 << 31` 은 `-2147483648`. `bigint` 는 비트를 그대로 유지한다.

---

## 5. 따라하기

각 파일을 열고 `F5` 를 누르거나 명령줄에서 실행한다. 실행할 수 없는 환경이면 아래 결과와 코드를 함께 읽는다.

### [classes.ko.ts](classes.ko.ts) — 필드, private 와 #private, readonly, 게터, static, this

```
> node lessons/04-classes-errors/classes.ko.ts
1) AX = 0xFF / typeof = object
2) declare fields, then assign them in the constructor
3) Object.keys = [ 'nTsPrivate' ] / JSON = {"nTsPrivate":1}
4) nBits = 16 / nBytes = 2 / biMax = 65535n / MAX_BITS = 64
5) Expected error: Cannot read properties of undefined (reading 'strName')
   Why : fnToString() is called without an object, so "this" is undefined.
   Fix : wrap it — () => oAx.ToString() — or use oAx.ToString.bind(oAx).
   arrow wrapper: AX = 0xFF
```

해 볼 것: `// class CShort ...`, `// oCounter.nTsPrivate;`, `// oWord.nBits = 32;` 의 주석을 하나씩 풀고 빨간 줄의 메시지를 읽어 보자.

### [inheritance.ko.ts](inheritance.ko.ts) — abstract, extends, override, implements, instanceof

```
> node lessons/04-classes-errors/inheritance.ko.ts
1) CFormatter is abstract : only its subclasses can be created
2) HEX : 0xFF (CHexFormatter)
2) HEX : 0xff (CLowerHexFormatter)
3) total = 255n
   after Reset = 0n
4) HEX : 0xA / something resettable
5) TS accepted oFake / instanceof CHexFormatter = false
```

해 볼 것: `CLowerHexFormatter.Format` 의 `override` 를 지워 보자 (TS4114). 그다음 `CFormatter` 에 `#nId = 0;` 을 넣고 `oFake` 를 보자.

### [errors.ko.ts](errors.ko.ts) — try/catch/finally, unknown, 내장 에러, 사용자 정의 에러, 다시 던지기

```
> node lessons/04-classes-errors/errors.ko.ts
1) caught: RangeError - Division by zero
   finally runs either way
2) thrown: just a string / typeof = string
3) BigInt("12a")  → SyntaxError: Cannot convert 12a to a BigInt
3) 1n / 0n        → RangeError: Division by zero
3) 1n >>> 1n      → TypeError: BigInts have no unsigned right shift, use >> instead
3) null.length    → TypeError: Cannot read properties of null (reading 'length')
4) CCalcError: division by zero / fix: use a non-zero divisor
   cause: RangeError: Division by zero
5) 3 / error: division by zero
   rethrown: TypeError: a bug, not a user error
```

### [wordsize.ko.ts](wordsize.ko.ts) — asUintN / asIntN, 범위, 오버플로, number 와 bigint

```
> node lessons/04-classes-errors/wordsize.ko.ts
1)  255 → 8-bit unsigned 255, signed -1
1)  256 → 8-bit unsigned 0, signed 0
1)   -1 → 8-bit unsigned 255, signed -1
1) -128 → 8-bit unsigned 128, signed -128
2) -1 as  8-bit = 0xFF
2) -1 as 16-bit = 0xFFFF
2) -1 as 32-bit = 0xFFFFFFFF
2) -1 as 64-bit = 0xFFFFFFFFFFFFFFFF
3) 8-bit : unsigned 0..255, signed -128..127
3) 16-bit : unsigned 0..65535, signed -32768..32767
3) 32-bit : unsigned 0..4294967295, signed -2147483648..2147483647
4) 0xFF + 1 = 256n → 8-bit 0n
5) number : 0xFFFFFFFF | 0 = -1 / 1 << 31 = -2147483648
   bigint : 0xFFFFFFFFn | 0n = 4294967295n / 1n << 31n = 2147483648n
```

1번 줄: 255 와 -1 이 같은 쌍을 출력한다 — 8비트에서는 같은 비트 패턴이기 때문이다.

## 6. 직접 만들기 — 두 수 계산기

**[JS + TS]**

`"<수> <연산자> <수>"` 를 읽는 8비트 계산기다. 03강의 리터럴 유니온, `#private` 필드가 있는 클래스, 에러 클래스를 한데 모은다. 전체 코드: [calc.ko.ts](calc.ko.ts).

### 연산자와 에러 클래스

```ts
const OPERATORS = ["+", "-", "*", "/", "&", "|", "<<"] as const;
type TOperator = (typeof OPERATORS)[number];

function IsOperator(strText: string): strText is TOperator {
	return (OPERATORS as readonly string[]).includes(strText);
}

class CCalcError extends Error {
	override readonly name = "CCalcError";
	readonly strFix: string;
	constructor(strMessage: string, strFix: string, oOptions?: ErrorOptions) { ... }
}
```

### 계산기 클래스

```ts
class CCalculator {
	readonly #oWord: CWordSize;

	constructor(oWord: CWordSize) {
		this.#oWord = oWord;
	}

	Run(strExpr: string): bigint {
		const [strA = "", strOp = "", strB = "", ...arrRest] = strExpr.trim().split(/\s+/);
		if (arrRest.length > 0 || strB === "") {
			throw new CCalcError("expected <number> <operator> <number>", 'write it like "0xFF + 1".');
		}
		if (!IsOperator(strOp)) {
			throw new CCalcError(`"${strOp}" is not an operator`, `use one of ${OPERATORS.join(" ")}`);
		}
		const biA = this.#Parse(strA);
		const biB = this.#Parse(strB);
		return this.#oWord.ToUnsigned(this.#Apply(biA, strOp, biB));   // 여기서 strOp 는 TOperator
	}

	#Parse(strText: string): bigint {
		try {
			return this.#oWord.ToUnsigned(BigInt(strText));
		} catch (e) {
			throw new CCalcError(`"${strText}" is not an integer`, "use 255, 0xFF, 0b1010 or 0o17.", { cause: e });
		}
	}

	#Apply(biA: bigint, strOp: TOperator, biB: bigint): bigint {
		switch (strOp) {
			case "+": return biA + biB;
			...
			case "/":
				if (biB === 0n) {
					throw new CCalcError("division by zero", "the right side of / must not be 0.");
				}
				return biA / biB;
			...
			default: return AssertNever(strOp);   // 03강: 연산자를 추가하면 처리할 때까지 빨간 줄
		}
	}
}
```

- `#Parse` 와 `#Apply` 는 비공개 **메서드**다 — `#` 는 메서드에도 쓸 수 있다.
- `#Parse` 는 `SyntaxError` 를 `CCalcError` 로 바꾸고 원래 에러를 `cause` 로 남긴다. 호출한 쪽은 에러 타입 하나만 다루면 된다.
- 기본값이 있는 구조 분해(Destructuring, `strOp = ""`)가 `string | undefined` 를 `string` 으로 만든다 (`noUncheckedIndexedAccess`, 03강).

### 실행

```
> node lessons/04-classes-errors/calc.ko.ts
8-bit calculator (0..255)
  0xF0 | 0x0F  = 0xFF (255, signed -1)
  0xFF + 1     = 0x00 (0, signed 0)
  0 - 1        = 0xFF (255, signed -1)
  1 << 7       = 0x80 (128, signed -128)
  200 * 2      = 0x90 (144, signed -112)
  10 / 0       → CCalcError: division by zero / Fix : the right side of / must not be 0.
  12a + 1      → CCalcError: "12a" is not an integer [cause: SyntaxError] / Fix : use 255, 0xFF, 0b1010 or 0o17.
  3 % 2        → CCalcError: "%" is not an operator / Fix : use one of + - * / & | <<
  1 +          → CCalcError: expected <number> <operator> <number> / Fix : write it like "0xFF + 1".
```

해 볼 것: `OPERATORS` 에 `"%"` 를 넣어 보자. `case "%":` 를 추가할 때까지 `AssertNever(strOp)` 가 빨간 줄(TS2345)이 된다.

## 7. DevCalc 스텝 — Lv3 워드 크기와 두 수 계산

새 파일:

| 파일 | 내용 |
|---|---|
| [devcalc/src/core/WordSize.ts](../../devcalc/src/core/WordSize.ts) | `TWordBits`, `IsWordBits`, `class CWordSize` (`strName` BYTE/WORD/DWORD/QWORD, 범위, `ToUnsigned`, `ToSigned`, `Fits`) |
| [devcalc/src/core/Calculator.ts](../../devcalc/src/core/Calculator.ts) | `TOperator` (`+ - * / % & \| ^ << >>`), `class CCalcError`, `class CCalculator` |
| [devcalc/tests/Calculator.test.ts](../../devcalc/tests/Calculator.test.ts) | 워드 크기 범위, 연산자, 오버플로, 에러 |

[Format.ts](../../devcalc/src/core/Format.ts) 는 `IFormatOptions` 에 `nBits` 가 생겨서, 워드 크기만큼 0 으로 채운다 (16비트면 `0x00FF`).

`CCalculator` 는 6장의 계산기에 두 가지를 더했다. 워드 크기가 없으면 제한 없이 계산하고, 있으면 오버플로도 알려 준다.

```ts
Calculate(biA: bigint, strOp: TOperator, biB: bigint): ICalcResult {
	...
	const biExact = this.#Apply(oWord.ToUnsigned(biA), strOp, oWord.ToUnsigned(biB));
	return { biValue: oWord.ToUnsigned(biExact), biExact, bOverflow: !oWord.Fits(biExact) };
}
```

[main.ts](../../devcalc/src/main.ts) 는 `CCalcError` 만 잡는다.

```ts
try {
	const oResult = new CCalculator(oWord).Calculate(biA, strOp, biB);
	...
} catch (e) {
	if (e instanceof CCalcError) {
		console.log(`Cannot calculate: "${strExpr}"`);
		console.log(`Why : ${e.message}`);
		console.log(`Fix : ${e.strFix}`);
		return 1;
	}
	throw e;   // 직접 만든 에러가 아님 : 버그이므로 스택 트레이스와 함께 종료되게 둠
}
```

### `process.exit()` → `process.exitCode`

03강은 잘못된 입력에서 `process.exit(1)` 을 불렀다. 이제 코드는 종료 코드(Exit Code)를 **돌려주는** `Main()` 함수 안에 있다.

```ts
process.exitCode = Main(strExpr);
```

`process.exit()` 는 출력을 쓰는 중이라도 Node 를 바로 멈춘다. 출력이 파이프(Pipe, 다른 프로그램이나 테스트 실행기)로 갈 때는 줄이 사라질 수 있고, Windows 에서는 Node 가 비정상 종료되기도 한다. `exitCode` 를 쓰면 Node 가 출력을 다 쓴 뒤 그 코드로 끝난다. `Main()` 에서 조기 반환(early return)하므로 흐름도 평범한 `if`/`return` 이 된다.

실행 (식은 따옴표로 묶어 한 인수로, 연산자 앞뒤에는 공백):

```
> node devcalc/src/main.ts "0xFF & 0x0F"
HEX : 0xF
DEC : 15
BIN : 0b1111

> node devcalc/src/main.ts "0xFF + 1" --bits=8
HEX : 0x00
DEC : 0
BIN : 0b0000_0000
INT : 0 (8-bit signed)
Note: 256 does not fit in 8 bits (BYTE), so it wrapped to 0.

> node devcalc/src/main.ts -1 --bits=16
HEX : 0xFFFF
DEC : 65,535
BIN : 0b1111_1111_1111_1111
INT : -1 (16-bit signed)

> node devcalc/src/main.ts "1 << 31" --bits=32
HEX : 0x8000_0000
DEC : 2,147,483,648
BIN : 0b1000_0000_0000_0000_0000_0000_0000_0000
INT : -2,147,483,648 (32-bit signed)

> node devcalc/src/main.ts "1 / 0"
Cannot calculate: "1 / 0"
Why : division by zero
Fix : the right side of / must not be 0.

> node devcalc/src/main.ts "1 << 9" --bits=8
Cannot calculate: "1 << 9"
Why : shift count 9 is out of range
Fix : use a shift count from 0 to 8.
```

- `--bits=N` 은 출력을 워드 크기만큼 채우고, 같은 비트를 부호 있게 읽은 `INT` 를 더한다.
- `"1 << 31" --bits=32` 는 C# 에서 `int` 의 `1 << 31` 과 같다: `-2,147,483,648`.
- 알 수 없는 옵션 메시지에 `--bits` 도 나오므로, 02강의 `--bad` 예시는 `Why :` 줄이 더 길게 출력된다.

테스트:

```
> npm test
check-pairs : 25 pairs, 0 failed
✔ Format: 255
✔ Format: zero and negative
✔ GroupDigits
✔ Format options
✔ Format padding (nBits)
✔ Parse: decimal and sign
✔ Parse: prefixes and case
✔ Parse: _ separators
✔ Parse: invalid input
✔ WordSize: ranges and wrapping
✔ Calculator: operators without a word size
✔ Calculator: word size wraps and reports overflow
✔ Calculator: errors
ℹ pass 13
```

`assert.throws(() => ..., CCalcError)` 는 올바른 에러 **클래스**가 던져지는지 검사한다 — 여기서도 `instanceof` 다.

## 정리

- `class` 는 JS: 필드, `constructor`, 메서드, `get`, `static`. 안에서는 항상 `this.`. 멤버는 기본이 public.
- 이 저장소에는 매개변수 프로퍼티가 없다 (`erasableSyntaxOnly`, TS1294). 필드를 선언하고 대입한다.
- `private` / `readonly` 는 컴파일 때만 검사한다. `#private` 는 실행 중에도 지켜진다.
- `this` 는 호출 방식에 달렸다. 떼어 낸 메서드는 `this` 를 잃는다 → 화살표 함수로 감싸거나 `bind`.
- `abstract`, `override` (`noImplicitOverride` 로 필수), `implements` 는 TS. `extends`, `super`, `instanceof` 는 JS. 인터페이스는 `instanceof` 로 검사할 수 없다.
- `catch (e)` 의 `e` 는 `unknown`. `instanceof` 로 좁히고, 직접 정의한 에러만 잡고, 나머지는 다시 던진다. 원래 에러는 `{ cause: e }` 로 남긴다.
- `bigint` + `BigInt.asUintN` / `asIntN` = 정확히 계산한 뒤 8/16/32/64비트로 자르기.
- 종료는 `process.exit()` 가 아니라 `process.exitCode` 로.

**다음 → [05. 제네릭](../05-generics/README.ko.md)**: `TResult<T, E>`, `Map<K, V>`, 어떤 타입에도 동작하는 함수를 만든다. DevCalc 에 계산 히스토리(History)가 생긴다.

---

[← 이전: 03. 유니온과 타입 좁히기](../03-unions-narrowing/README.ko.md) · [목차](../../README.ko.md) · [다음: 05. 제네릭 →](../05-generics/README.ko.md)
