[English](README.md) · **한국어**

[← 이전: 10. 렉서와 파서](../10-lexer-parser/README.ko.md) · [목차](../../README.ko.md) · [다음: 12. bigint 와 고정 크기 워드 →](../12-bigint-words/README.ko.md)

# 11. 정규식과 리터럴 타입 — 렉서 키우기

> 시리즈: DH.Study.TypeScript · 11강 (2부)
> 환경: Node.js v24 · TypeScript 7 · Vitest 5 · VS Code

## 목표

이 강의를 마치면 다음을 할 수 있다.

- [ ] 정규식(Regular expression)을 읽고 쓴다: 문자 클래스(Class), 수량자(Quantifier, 탐욕/게으른), 앵커(Anchor), 그룹(Group), 전후방 탐색(Lookaround)
- [ ] 알맞은 플래그(Flag, `g` `i` `y` `u`)를 고르고, `lastIndex` 함정을 피한다
- [ ] TypeScript 에서 이름 있는 그룹(Named group)을 쓴다. 캡처는 모두 `string | undefined` 다
- [ ] 리터럴 타입(Literal type)과 그 유니온을 쓰고, `as const` 로 리터럴을 유지하고, `satisfies Record<EUnit, …>` 로 표를 검사한다
- [ ] 템플릿 리터럴 타입(Template literal type, `` `0x${string}` ``)을 쓰고, 바깥에서 온 텍스트를 타입 가드(Type guard)로 확인한다
- [ ] 우선순위 클라이밍 파서에 오른쪽 결합 `**`, `>>>`, 단항 `~` 를 더한다

## 이 강의의 목차

1. [정규식](#1-정규식)
2. [리터럴 타입](#2-리터럴-타입)
3. [템플릿 리터럴 타입](#3-템플릿-리터럴-타입)
4. [따라하기](#4-따라하기)
5. [직접 만들기 — 새 연산자와 리터럴](#5-직접-만들기--새-연산자와-리터럴)
6. [DevCalc 스텝 — Lv6 개발자용 리터럴과 연산자](#6-devcalc-스텝--lv6-개발자용-리터럴과-연산자)
7. [정리](#정리)
8. [다음으로 갈 곳](#다음으로-갈-곳)

이 강의의 예제 파일: [regex.ko.ts](regex.ko.ts) · [literal-types.ko.ts](literal-types.ko.ts) · [operators.ko.ts](operators.ko.ts)

> 예제는 한국어 주석판(`x.ko.ts`)을 링크한다. 같은 코드의 영어 주석판은 `x.ts` 다.

> 문법 표시: **[JS]** = JavaScript 문법 (TS 없이도 있음) · **[TS]** = TypeScript 가 더한 타입 문법 (지우면 JS) · 자세한 구분은 [00강 7-3](../00-setup/README.ko.md#7-3-ts-문법--js-문법--타입-문법)

1부(00–10강)는 수식 전체를 읽는 계산기로 끝났다. 2부에서는 개발자가 실제로 띄워 두고 쓰는 계산기로 만든다. 이 강의는 **렉서**를 키운다: 개발자가 입력하는 숫자 — `1Fh` (어셈블러 16진수), `1'000'000` (C++ 자릿수 구분자), `4K` (크기), `'A'` (문자) — 와, C 계열 언어에 모두 있는 연산자 세 개 `~`, `**`, `>>>` 를 배운다. 한 줄로 모두 써 보면 — ASCII 소문자를 대문자로 바꾸기:

```
> node devcalc/src/main.ts "'a' & ~0x20" --bits=8
HEX : 0x41
DEC : 65
BIN : 0b0100_0001
INT : 65 (8-bit signed)
```

그 도구가 **정규식** (토큰이 어떻게 생겼는지) 과 **리터럴 타입** (코드가 어떤 문자열을 정확히 받는지) 이다.

---

## 1. 정규식

정규식(Regex)은 텍스트가 어떻게 생겼는지를 적는다. 10강에서 몇 개 썼다 (`/\d+/y`). 이 절은 실제 코드에서 만나게 될 부분을 다룬다.

### 1-1. 리터럴인가 생성자인가

**[JS]** 만드는 방법은 두 가지다:

```ts
const RE_HEX = /^0x[0-9a-f]+$/i; // 리터럴 : 파일을 읽을 때 검사됨
const reHexToo = new RegExp("^0x[0-9a-f]+$", "i"); // 문자열로 : 실행 중에 만들어짐
```

- 패턴이 고정되어 있으면 **리터럴**을 쓴다. TypeScript 가 문법을 검사한다: `/(0x/` 는 빨간 줄이다 (TS1005 `')' expected`).
- 패턴을 실행 중에 만들어야 할 때만 **`new RegExp`** 를 쓴다. 문자열 안에서는 역슬래시를 두 번 써야 하고 (`"\\d+"`), 잘못된 패턴은 실행 중의 `SyntaxError` 다 (1-6 절).

> **C#** : `new Regex(@"^0x[0-9a-f]+$", RegexOptions.IgnoreCase)`. C# 에는 정규식 리터럴이 없어서 실수는 실행할 때만 드러난다 — `[GeneratedRegex]` 소스 생성기(Source generator, .NET 7+)를 쓰면 TS 처럼 빌드 때 검사된다.

### 1-2. 구성 요소

| 요소 | 뜻 | 예 |
|---|---|---|
| `abc` | 이 글자들 | `/0x/` |
| `.` | 줄바꿈을 뺀 아무 글자 | `/a.c/` 는 `abc` 와 일치 |
| `[0-9a-f]` `[^0-9]` | 이 중 하나 (이 중 아닌 것 하나) | `/[kmgt]/i` |
| `\d` `\s` `\w` | 숫자, 공백, 단어 글자 (`\D` `\S` `\W` = 아닌 것) | `/\d+/` |
| `^` `$` | 텍스트의 처음, 끝 | `/^0x/` |
| `\b` `\B` | 단어 경계인 곳 (아닌 곳) | |
| `*` `+` `?` `{2,4}` | 0 번 이상, 1 번 이상, 0 또는 1 번, 2~4 번 | `/\d{2,4}/` |
| `a\|b` | 둘 중 하나 | `/>>>\|>>/` |
| `( )` `(?: )` | 그룹 (캡처함), 그룹 (캡처 안 함) | |
| `\.` `\*` `\(` | 그 글자 자체 | `/\*\*/` = `**` |

수량자는 기본이 **탐욕(Greedy)** 이다 — 가능한 한 많이 가져간다. 뒤에 `?` 를 붙이면 **게으른(Lazy)** 수량자가 된다:

```ts
/<.+>/.exec("<b>bold</b>")?.[0]; // "<b>bold</b>" : 탐욕
/<.+?>/.exec("<b>bold</b>")?.[0]; // "<b>"         : 게으름
```

**`|` 는 순서가 중요하다**: 왼쪽부터 시도해서 처음 되는 것을 고른다. `>>>` 에 `/>>|>>>/` 를 쓰면 `>>` 와 일치한다. 긴 것을 앞에 둔다.

### 1-3. 그룹, 그리고 TS 의 타입

**[JS + TS]** `( )` 는 번호로, `(?<name> )` 은 이름으로 캡처한다:

```ts
const RE_SIZE = /^(?<digits>[0-9]+)(?<unit>[KMGT])$/i;
const oSize = RE_SIZE.exec("16M"); // RegExpExecArray | null
if (oSize !== null) {
	oSize[0]; // "16M"  : 일치한 전체
	oSize[1]; // "16"   : 그룹 1
	oSize.groups?.unit; // "M" : 이름으로
}
```

타입을 눈여겨볼 만하다:

- `exec` 는 `RegExpExecArray | null` 을 돌려준다 — 일치하지 않으면 `null` 이므로 TS 가 확인을 요구한다.
- `oSize[1]` 은 `string | undefined` 다 (`noUncheckedIndexedAccess` 일 때): TS 는 패턴 안의 그룹 수를 세지 않는다.
- `oSize.groups` 는 `{ [key: string]: string } | undefined` 이고, `groups.unit` 은 `string | undefined` 다. TS 는 이름도 읽지 않으므로 오타 (`groups.unti`) 도 오류가 아니다 — 그냥 `undefined` 다.

그래서 그룹을 읽을 때는 언제나 `?.` 와 `??` 다:

```ts
const strUnit: string = oSize.groups?.unit ?? "?";
```

> **C#** : `match.Groups["unit"].Value` 는 없는 그룹에 `null` 대신 `""` 을 준다. TS 는 없는 경우를 타입에 드러내고, C# 은 `Success` 를 확인하게 한다.

### 1-4. 플래그

| 플래그 | 뜻 | 용도 |
|---|---|---|
| `i` | 대소문자 무시 | `1fh` = `1FH` |
| `g` | 전역(Global) : 일치하는 것 모두 | `match`, `matchAll`, `replace` |
| `y` | sticky : 정확히 `lastIndex` **위치에서만** | 렉서 (10강) |
| `u` | 유니코드 : 코드 포인트(Code point), `\p{…}` | 이모지나 라틴 문자가 아닌 글자가 있는 텍스트 |
| `s` | `.` 이 줄바꿈과도 일치 | |
| `m` | `^` `$` 가 줄마다 | |

`g` 가 있으면 문자열 메서드가 일치하는 것을 모두 찾는다:

```ts
"id=12 port=8080".match(/\d+/g); // ["12", "8080"]
for (const oPair of strLog.matchAll(/(?<key>[a-z]+)=(?<value>\d+)/g)) {
	console.log(oPair.groups?.key, oPair.groups?.value, oPair.index);
}
```

`g` 를 쓴 `match` 는 텍스트만 돌려주고, `matchAll` 은 일치마다 그룹과 위치(index)를 함께 돌려준다.

**`lastIndex` 함정.** `g` 나 `y` 정규식은 **상태가 있다(Stateful)**: `exec` 와 `test` 는 `lastIndex` 에서 시작하고 그 값을 옮긴다. `g` 정규식 하나를 `test()` 에 다시 쓰면 결과가 번갈아 나온다:

```ts
const RE_DIGIT_G = /\d/g;
RE_DIGIT_G.test("7"); // true  (lastIndex → 1)
RE_DIGIT_G.test("7"); // false (1 에서 시작해 못 찾고, lastIndex → 0)
RE_DIGIT_G.test("7"); // true
```

규칙: `test()` 에는 `g` 를 쓰지 않는다. DevCalc 의 sticky 정규식은 `exec` 할 때마다 먼저 `lastIndex` 를 설정한다 (`Lexer.ts` 의 `MatchAt`).

### 1-5. 전후방 탐색

`(?= )` (전방 탐색, Lookahead) 와 `(?<= )` (후방 탐색, Lookbehind) 는 어떤 위치의 **주변**을 확인만 하고 가져가지 않는다. `(?! )` 와 `(?<! )` 는 부정형이다.

```ts
"1234567".replace(/\B(?=(\d{3})+(?!\d))/g, ","); // "1,234,567"
"cost $42".match(/(?<=\$)\d+/)?.[0]; // "42"
```

첫 번째는 **위치**(빈 일치)와 일치한다: 단어 경계가 아니고, 뒤로 끝까지 숫자 3 개 묶음이 이어지는 곳. 영리하지만 읽기 어렵다. DevCalc 코드에서 자릿수 묶기는 평범한 반복문이다 (`GroupDigits`, 03강). 전후방 탐색은 짧고 뻔할 때 쓴다.

### 1-6. 유니코드, 그리고 입력으로 만든 패턴

문자열은 UTF-16 이다: `"😀".length` 는 2 다. `u` 가 없으면 `.` 은 UTF-16 단위 하나와 일치하므로 `/^.$/` 는 `😀` 와 일치하지 **않는다**. `u` 가 있으면 일치한다. `u` 는 유니코드 클래스도 켠다:

```ts
"DevCalc 계산기".match(/\p{Script=Hangul}+/u)?.[0]; // "계산기"
```

이것도 TS 가 검사한다: `u` 없는 `/\p{L}/` 는 TS1530 이다.

**사용자 입력**으로 만든 패턴은 잘못되었을 수 있고, 그 자체가 코드다 — `(`, `+`, `.` 에 뜻이 있다:

```ts
new RegExp("(0x"); // SyntaxError: Invalid regular expression: /(0x/: Unterminated group

function EscapeRegExp(strText: string): string {
	return strText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& = 일치한 전체
}
```

이스케이프(Escape)하거나, 아예 입력으로 정규식을 만들지 않는다. ES2025 에 `RegExp.escape` 가 생겼다 (Node 24 에 있음; TS 는 `"lib": ["es2025"]` 이면 앎).

> **C#** : `Regex.Escape(text)`. C# 에는 `(a+)+$` 같은 파국적인 패턴에 대비한 `RegexOptions.NonBacktracking` 이 있지만 JavaScript 에는 그런 옵션이 없다. 그러니 통제하지 못하는 패턴을 통제하지 못하는 텍스트에 돌리지 말자.

---

## 2. 리터럴 타입

**[TS]** **리터럴 타입**은 값이 정확히 하나인 타입이다: `"K"`, `10n`, `true`, `8`. 혼자서는 쓸모가 적지만, 그 **유니온**은 이 시리즈 어디에나 있다 (`EKind`, `ECheck`, `EAssoc`).

### 2-1. TS 가 리터럴을 유지할 때

```ts
const strConstUnit = "K"; // 타입 "K"   : const 는 바뀌지 않음
let strLetUnit = "K"; // 타입 string : let 은 바뀔 수 있으니 TS 가 넓힘
const arrBits = [8, 16, 32, 64] as const; // readonly [8, 16, 32, 64]
type TBits = (typeof arrBits)[number]; // 8 | 16 | 32 | 64
```

- `const` 는 리터럴을 유지하고, `let` 은 `string` 으로 **넓힌다(Widening)**.
- 객체나 배열 안에서는 `const` 라도 넓혀진다 (`[8, 16]` 은 `number[]`). 요소는 바뀔 수 있기 때문이다. `as const` 는 모두 `readonly` 로 만들고 리터럴을 모두 유지한다.
- `(typeof arrBits)[number]` 는 배열 요소 타입들을 유니온으로 만든다 — 목록 하나를 데이터 **와** 타입으로 함께 쓴다.

### 2-2. 유니온, 그리고 그에 맞아야 하는 표

```ts
type EUnit = "K" | "M" | "G" | "T";

const UNIT_SHIFT = { K: 10n, M: 20n, G: 30n, T: 40n } as const satisfies Record<EUnit, bigint>;
```

`satisfies Record<EUnit, bigint>` 는 표를 유니온과 **양방향으로** 검사한다:

- `T` 행을 지우면 → TS2741 (`Property 'T' is missing`);
- `P: 50n` 을 더하면 → TS2353 (`'P' does not exist in type 'Record<EUnit, bigint>'`).

그리고 `as const` 덕분에 `UNIT_SHIFT.K` 의 타입은 그냥 `bigint` 가 아니라 `10n` 이다.

08강은 반대 방향이었다: 표가 먼저 있고, `keyof typeof OPERATOR_TABLE` 가 유니온을 **만들었다**. 어느 쪽을 고를까:

| 유니온이 어디서 오나 | 언제 |
|---|---|
| 표에서 (`keyof typeof TABLE`) | 표 자체가 정의일 때 (DevCalc 의 연산자) |
| `type` 에서, `satisfies Record<E, …>` 로 검사 | 유니온을 다른 곳에서도 쓰고, 모든 표가 그것을 빠짐없이 다뤄야 할 때 (단위, 워드 크기) |

### 2-3. 바깥에서 온 텍스트는 절대 리터럴 타입이 아니다

리터럴 타입은 지워진다(Erased): 실행 중에 `EUnit` 은 없다. 사용자가 입력한 텍스트 — 또는 `JSON.parse` 가 돌려준 값 — 은 `string` 이고, `as EUnit` 은 컴파일러를 조용히 시킬 뿐이다:

```ts
const strUnit = JSON.parse('{ "unit": "X" }').unit as EUnit; // 컴파일됨. strUnit 은 "X"
```

**타입 가드**(03강)로 확인한다:

```ts
function IsUnit(strText: string): strText is EUnit {
	return Object.hasOwn(UNIT_SHIFT, strText); // 자기 키만 : "toString" 은 단위가 아님
}
```

`strText in UNIT_SHIFT` 가 아니라 `Object.hasOwn` 인 이유: `"toString" in {}` 은 `true` 다 (프로토타입에서 옴).

> **C#** : 가장 가까운 것은 `enum` 이지만, enum 은 속이 숫자이고 `(EUnit)99` 도 컴파일된다. TS 리터럴 유니온은 컴파일러가 검사하는 정확한 값의 집합이고 — 실행 비용이 없다.

---

## 3. 템플릿 리터럴 타입

**[TS]** 템플릿 리터럴 **타입**은 템플릿 문자열 문법을 타입 수준에서 쓴다:

```ts
type THexText = `0x${string}`; // 0x 로 시작하는 아무 문자열
type TSizeText = `${number}${EUnit}`; // "16M", "4K", "1.5G"
const strBadHex: THexText = "FF"; // TS2322
```

안에 유니온이 있으면 **모든 조합**을 만든다:

```ts
type EWordName = `${"U" | "I"}${8 | 16 | 32 | 64}`; // "U8" | "U16" | "U32" | "U64" | "I8" | ... : 8 개
```

내장 타입 네 개가 글자를 바꾼다: `Uppercase`, `Lowercase`, `Capitalize`, `Uncapitalize`.

```ts
type ELowerUnit = Lowercase<EUnit>; // "k" | "m" | "g" | "t"
```

정규식 검사가 템플릿 타입의 타입 가드가 될 수 있다 — 실행 중 검사와 타입이 같은 말을 한다:

```ts
function IsHexText(strText: string): strText is THexText {
	return /^0x[0-9a-f]+$/i.test(strText);
}
```

엄밀히는 타입이 정규식보다 넓다 (`"0xZZ"` 도 `THexText` 다). 타입은 "0x 로 시작함" 이라고 하고, 정규식은 실제로 받는 것을 말한다. 그래도 괜찮다: 가드가 관문이고, 타입은 관문을 통과했다는 사실을 기억한다.

`infer` (08강) 는 템플릿 안에서도 동작해서, 리터럴 타입을 부분으로 나눈다:

```ts
type TUnitOf<T extends string> = T extends `${string}${infer EU extends EUnit}` ? EU : never;
type EUnitOf16M = TUnitOf<"16M">; // "M"
type EUnitOfBad = TUnitOf<"16X">; // never
```

타입 수준의 파싱이다. 라이브러리가 경로 문자열의 타입을 만드는 방법이 이것이다 (`"/user/:id"` → `{ id: string }`). 조금씩만 쓰자: 다섯 단계 템플릿 타입 안의 타입 오류는 읽기 어렵다.

> **C#** : 해당하는 것이 없다. 가장 가까운 것은 빌드 때 문자열을 읽는 소스 생성기다.

---

## 4. 따라하기

### [regex.ko.ts](regex.ko.ts) — 리터럴과 플래그, 그룹, g 와 matchAll, 전후방 탐색, u, lastIndex 함정, 이스케이프

```
> node lessons/11-regex-literal-types/regex.ko.ts
1) true true false
1) source / flags : ^0x[0-9a-f]+$ i
2) greedy : <b>bold</b>
2) lazy   : <b>
2) \d{2,4} in 12345 : 1234 · [^0-9]+ in ab12 : ab
3) [0] [1] [2] : 16M 16 M · index : 0
3) groups.digits / unit : 16 M
3) no match → null : null
4) match + g : [ '12', '8080', '64' ]
4) id → 12 at 0
4) port → 8080 at 6
4) bits → 64 at 16
4) replace + g : a + b + c · split : [ '1', '2', '3', '4' ]
5) 1234567 → 1,234,567
5) after $ : 42
6) length : 2 · /^.$/ : false · /^.$/u : true
6) \p{Script=Hangul} : 계산기
7) Expected surprise : true false true
   Why : test() with g starts at lastIndex (1 after the first match), fails, and resets it to 0.
   Fix : no g flag for test(), or set lastIndex = 0 first. DevCalc's sticky (y) regexes always set it.
8) Expected error: SyntaxError: Invalid regular expression: /(0x/: Unterminated group
   Why : ( opens a group, and nothing closes it.
8) escaped : 1\+1=2 \(ok\) → true
```

해 볼 것:

- `const RE_BAD = /(0x/;` 앞의 `//` 를 지우면 → TS1005 (`')' expected`). 같은 실수를 `new RegExp("(0x")` 로 하면 실행해야 드러난다 (출력 8).
- `oSize.groups?.unit ?? "?"` 를 `oSize.groups.unit` 으로 바꾸면 → TS18048 (`'oSize.groups' is possibly 'undefined'`), 그리고 값이 `undefined` 일 수 있으므로 TS2322.
- `const RE_DIGIT_G = /\d/g` 에서 `g` 를 지우면 → 출력 7 이 `true true true` 가 된다.
- `/\p{Script=Hangul}+/u` 에서 `u` 를 지우면 → TS1530.

### [literal-types.ko.ts](literal-types.ko.ts) — 넓히기와 as const, satisfies Record, 타입 가드, 템플릿 타입, infer

```
> node lessons/11-regex-literal-types/literal-types.ko.ts
1) K anything 8,16,32,64 32
2) K shift : 10n · 4K = 4096n
3) "M" → 1M = 1048576
3) "m" → 1M = 1048576
3) "X" → not a unit
3) "toString" → not a unit
4) 0xFF 16M
4) word names : U8 I16 U32 I64
4) lower unit : k
5) "0x1F" → 31n
5) "1F" → not hex
6) TUnitOf<"16M"> : M · TUnitOf<"16X"> holds 0 values
7) Expected error (a type does not check input): X
   Why : as EUnit only tells the compiler, and JSON.parse returns any. Nothing checked it.
   Fix : check text from outside with a type guard like IsUnit (section 3) before using it as EUnit.
```

해 볼 것:

- `const nBad: TBits = 12;` 앞의 `//` 를 지우면 → TS2322 (`Type '12' is not assignable to type '8 | 16 | 32 | 64'`).
- `UNIT_SHIFT` 에서 `T: 40n` 을 지우면 → TS2741, 그리고 `UNIT_SHIFT[strUpper]` 를 쓰는 곳에 두 번째 오류 (TS7053) — 표가 더 이상 `EUnit` 을 빠짐없이 다루지 않는다.
- `UNIT_SHIFT` 에서 `as const` 를 지우면 → `const biShiftK: 10n = UNIT_SHIFT.K` 가 TS2322 (`bigint` 는 `10n` 이 아님).
- VS Code 에서 `EWordName` 위에 마우스를 올려 8 개 멤버를 모두 보자.

### [operators.ko.ts](operators.ko.ts) — 5 절 참고

---

## 5. 직접 만들기 — 새 연산자와 리터럴

10강의 `precedence.ko.ts` 는 연산자 다섯 개로 `number` 를 계산했다. [operators.ko.ts](operators.ko.ts) 는 같은 우선순위 클라이밍 파서를 DevCalc 크기로 키운 것이다: `bigint`, 고정 워드 크기, 이항 연산자 열 개, 단항 두 개, 그리고 새 리터럴. 모든 값을 `BigInt.asUintN` (01강) 으로 부호 없는 워드로 감싼다 — `--bits` 를 준 DevCalc 처럼.

### 표 두 개

```ts
const BINARY = {
	"|": { nPrecedence: 1, eAssoc: "left", fnApply: (biA, biB) => biA | biB },
	// ... ^ & << + - *
	">>": { nPrecedence: 4, eAssoc: "left", fnApply: (biA, biB, nBits) => BigInt.asIntN(nBits, biA) >> biB }, // 부호 비트를 유지
	">>>": { nPrecedence: 4, eAssoc: "left", fnApply: (biA, biB) => biA >> biB }, // biA 가 부호 없음 : 0 이 들어옴
	"**": { nPrecedence: 7, eAssoc: "right", fnApply: (biA, biB) => biA ** biB },
} satisfies Record<string, IBinarySpec>;

const UNARY = {
	"-": (biA: bigint) => -biA,
	"~": (biA: bigint) => ~biA,
} satisfies Record<string, (biA: bigint) => bigint>;

type EBinary = keyof typeof BINARY;
type EUnary = keyof typeof UNARY;
```

**`>>` 와 `>>>`.** 워드는 부호 없이 저장된다 (8 비트에서 `0x80` = 128). 오른쪽으로 미는 방법은 두 가지다:

- `>>` (**산술(Arithmetic)** 시프트) 는 워드를 먼저 **부호 있는** 값으로 읽는다: `asIntN(8, 0x80)` = -128, 그리고 `-128 >> 1` = -64 = `0xC0`. 부호 비트가 복사되어 들어온다.
- `>>>` (**논리(Logical)** 시프트) 는 부호 없는 값을 민다: `128 >> 1` = 64 = `0x40`. 0 이 들어온다.

C# 과 JavaScript 가 이렇게 한다: (부호 있는) `int` 의 `>>` 는 산술, `>>>` 는 논리 시프트다. `bigint` 에는 `>>>` 가 없으므로 (`bigint` 에는 고정 폭이 없음) 워드 크기가 결정한다.

**`~`.** `bigint` 에서 `~x` 는 `-x - 1` 이다: `~0n` = `-1n`. 워드로는 모든 비트가 1 이다: `asUintN(8, -1n)` = `0xFF`.

### 오른쪽 결합 **

10강 6 절에 규칙이 이미 있었다: 우선순위 `p` 인 연산자 뒤의 오른쪽은 `nMin = p + 1` (왼쪽 결합) 또는 `nMin = p` (오른쪽 결합) 로 읽는다:

```ts
const nNextMin = oSpec.eAssoc === "left" ? oSpec.nPrecedence + 1 : oSpec.nPrecedence;
```

그래서 `2 ** 3 ** 2` = `2 ** 9` = 512 이지, `8 ** 2` = 64 가 아니다.

### -2 ** 2

`(-2) ** 2` = 4 인가, `-(2 ** 2)` = -4 인가? 수학은 -4, 어떤 계산기는 4 라고 한다. JavaScript 는 거부한다: `-2 ** 2` 는 `SyntaxError` 다 ("Unary operator used immediately before exponentiation expression"). 이 파서도 같다 — 왼쪽 피연산자가 (괄호 없이) 단항 연산자로 **시작했으면** `**` 는 오류다:

```ts
if (strOp === "**" && bUnaryFirst) {
	throw new SyntaxError(`"${strFirst}x ** y" is ambiguous : write (${strFirst}x) ** y or ${strFirst}(x ** y)`);
}
```

`2 ** -1` 은 괜찮다: 단항이 오른쪽에 있어서 읽는 방법이 하나뿐이다.

### 이름 있는 그룹으로 읽는 리터럴

```ts
const RE_TOKEN = /\x27[^\x27]\x27|[0-9][0-9a-z]*|\*\*|>>>|>>|<<|\S/gi;
const RE_HEX_SUFFIX = /^(?<digits>[0-9][0-9a-f]*)h$/i;
const RE_SIZE = /^(?<digits>[0-9]+)(?<unit>[kmgt])$/i;
const RE_CHAR = /^\x27(?<char>.)\x27$/;
```

- `g` 정규식 하나가 수식을 나눈다. `>>>` 가 `>>` 보다 앞에 있어야 한다. 아니면 `>>>` 가 `>>` 와 `>` 로 읽힌다.
- `\x27` 은 `'` 다 (작은따옴표를 16진 이스케이프로 쓴 것).
- `1Fh` 는 **숫자로** 시작해야 한다: `Fh` 는 이름이 된다. 어셈블러에도 같은 규칙이 있어서 `0FFh` 같은 표기를 보게 된다.

### 실행

```
> node lessons/11-regex-literal-types/operators.ko.ts
4) ~0             = 0xFF (8-bit)
4) ~0 >>> 4       = 0x0F (8-bit)
4) 0x80 >> 1      = 0xC0 (8-bit)
4) 0x80 >>> 1     = 0x40 (8-bit)
4) -16 >> 2       = 0xFC (8-bit)
5) 2 ** 3 ** 2    = 0x0200 (16-bit)
5) (2 ** 3) ** 2  = 0x0040 (16-bit)
5) 3 * 2 ** 4     = 0x0030 (16-bit)
5) (-2) ** 3      = 0xFFF8 (16-bit)
6) 1Fh + 1        = 0x0020 (16-bit)
6) 4K - 1         = 0x0FFF (16-bit)
6) 'A' + 1        = 0x0042 (16-bit)
6) 'a' & ~0x20    = 0x41 (8-bit)
7) Expected error: SyntaxError: "-x ** y" is ambiguous : write (-x) ** y or -(x ** y)
   Why : -(2 ** 2) in math, (-2) ** 2 in some calculators. Either reading surprises someone.
   Fix : parentheses. JavaScript has the same rule : -2 ** 2 is a SyntaxError there too.
```

- `-16 >> 2` = `0xFC` = -4: 부호가 유지된다. `>>>` 라면 `0x3C` = 60 이다.
- `(-2) ** 3` = `0xFFF8` = 부호 있는 16 비트로 -8: 감싸기(Wrap)는 `**` 에서도 2 의 보수를 올바르게 유지한다.
- `'a' & ~0x20`: ASCII 소문자와 대문자는 비트 5 (`0x20`) 하나만 다르다. 그 비트를 지우면 `'a'` (0x61) 가 `'A'` (0x41) 가 된다.

해 볼 것:

- `"**"` 를 `eAssoc: "left"` 로 바꾸면 → `2 ** 3 ** 2` = `0x0040`. 결합성은 표의 단어 하나다.
- `RE_TOKEN` 에서 `>>>` 를 `>>` 뒤로 옮기면 → 프로그램이 `~0 >>> 4` 에서 `SyntaxError: expected a number, "(", "-" or "~", found ">"` 로 멈춘다: `>>>` 가 `>>` 와 `>` 로 읽혔다.
- 우선순위 6 인 `"%"` 를 더해 보자 — 10강처럼 행 하나다.

---

## 6. DevCalc 스텝 — Lv6 개발자용 리터럴과 연산자

### 바뀐 것

| 파일 | 변경 |
|---|---|
| `devcalc/src/core/Literal.ts` | 새 파일: `ParseLiteral` (03강 `ParseInteger` 위에 `1'000`, `1Fh`, `4K`), `ParseChar` (`'A'`, `'AB'`, `'\n'`, `'\x41'`), `EUnit` |
| `devcalc/src/core/Calculator.ts` | `**` (우선순위 7, `eAssoc: "right"`, `"power"` 검사), `>>>` (`"unsigned shift"` 검사). 워드 크기가 있으면 `>>` 가 부호를 유지. `UNARY_TABLE` (`-` `~`), `CalculateUnary`, `OperatorAssoc`, `OperatorHelp` |
| `devcalc/src/core/Lexer.ts` | 숫자는 `ParseLiteral` 로, 문자 리터럴, `~` 는 단독 토큰. `SplitExpressions` (`';'` 안의 `;` 로는 나누지 않음) |
| `devcalc/src/core/Parser.ts` | `"negate"` 노드 → `strOp` 가 있는 `"unary"` 노드. 오른쪽 결합. `-2 ** 2` 오류 |
| `devcalc/src/core/Evaluate.ts` | `Walk` 가 `CalculateUnary` 를 부름 |
| `devcalc/src/main.ts`, `devcalc/web/App.ts` | `SplitExpressions`. 도움말에 새 연산자와 리터럴. 제목 `Lv6` |
| `devcalc/tests/Literal.test.ts` | 새 파일: 테스트 7 개 |
| `devcalc/tests/*.test.ts` | 새 테스트 3 + 4 + 2 개. 8 비트에서 `-1 >> 1` 은 이제 `0xFF` (전에는 `0x7F`) |

### 우선순위

| 우선순위 | 연산자 | 결합성 |
|---|---|---|
| (가장 강함) | 단항 `-` `~` | |
| 7 | `**` | **오른쪽** |
| 6 | `*` `/` `%` | 왼쪽 |
| 5 | `+` `-` | 왼쪽 |
| 4 | `<<` `>>` `>>>` | 왼쪽 |
| 3 | `&` | 왼쪽 |
| 2 | `^` | 왼쪽 |
| 1 (가장 약함) | `\|` | 왼쪽 |

JavaScript, C# 과 같은 순서다 (C 에는 `**` 와 `>>>` 가 없음).

### 새 리터럴

| 리터럴 | 값 | 출처 |
|---|---|---|
| `1'000'000` | 1000000 | C++14 자릿수 구분자 (`_` 와 같음) |
| `1Fh`, `0FFh` | 31, 255 | 어셈블러 16진수 — 숫자로 시작해야 함 |
| `4K` `16M` `1G` `2T` | × 1024, 1024², 1024³, 1024⁴ | 크기 (10진 숫자만) |
| `'A'`, `'한'` | 0x41, 0xD55C | 글자 하나 = 그 코드 포인트 |
| `'AB'`, `'MZ'` | 0x4142, 0x4D5A | 여러 글자 = 바이트, 첫 글자가 가장 높음 (최대 8) — C 의 다중 문자 상수처럼 |
| `'\n'` `'\x41'` | 10, 65 | 이스케이프 `\n \r \t \0 \\ \' \xHH` |

```
> node devcalc/src/main.ts "1Fh + 1"
HEX : 0x20
DEC : 32
BIN : 0b10_0000

> node devcalc/src/main.ts "4K - 1"
HEX : 0xFFF
DEC : 4,095
BIN : 0b1111_1111_1111

> node devcalc/src/main.ts "'AB'"
HEX : 0x4142
DEC : 16,706
BIN : 0b100_0001_0100_0010

> node devcalc/src/main.ts "';' + 1; ans * 2"
[1] ';' + 1
HEX : 0x3C
DEC : 60
BIN : 0b11_1100

[2] ans * 2
HEX : 0x78
DEC : 120
BIN : 0b111_1000
```

마지막 예: 명령줄은 `;` 로 나누지만, `';'` 안의 `;` 로는 나누지 않는다. `SplitExpressions` 는 `g` 정규식 하나로, 문자 리터럴 전체 또는 `;` 가 아닌 글자 하나를 가져간다:

```ts
const RE_EXPRESSION_PART = /(?:'(?:\\.|[^'\\])*'?|[^;'])+/g;
```

### 새 연산자

```
> node devcalc/src/main.ts "~0" --bits=8
HEX : 0xFF
DEC : 255
BIN : 0b1111_1111
INT : -1 (8-bit signed)

> node devcalc/src/main.ts "0x80 >> 1" --bits=8
HEX : 0xC0
DEC : 192
BIN : 0b1100_0000
INT : -64 (8-bit signed)

> node devcalc/src/main.ts "0x80 >>> 1" --bits=8
HEX : 0x40
DEC : 64
BIN : 0b0100_0000
INT : 64 (8-bit signed)

> node devcalc/src/main.ts "2 ** 3 ** 2"
HEX : 0x200
DEC : 512
BIN : 0b10_0000_0000
```

`--bits` 가 없으면 `~0` 은 `-1` 이고 (JavaScript 의 `~0n` 처럼), `>>` 는 평범한 `bigint` 시프트이며, 음수의 `>>>` 는 오류다 — 폭이 없으면 "왼쪽에서 0 을 채운다" 는 말에 뜻이 없다.

**바뀐 답.** 이 강의 전에는 `-1 >> 1 --bits=8` 이 `0x7F` 였다: 워드가 부호 없는 값이라 `>>` 가 0 을 넣었다. 이제 `>>` 는 C#, JavaScript 처럼 산술 시프트이므로 답은 `0xFF` (-1 >> 1 = -1) 이고, 옛 `0x7F` 는 `>>>` 가 준다. 테스트 하나가 함께 바뀌었다 — 일부러, 그리고 테스트에 그 사실을 적어 두었다.

### 오류

```
> node devcalc/src/main.ts "-2 ** 2"
Invalid expression: "-2 ** 2"
Why : "-x ** y" is ambiguous ("**" at column 4) : write (-x) ** y or -(x ** y)
Fix : e.g. "(0xFF + 1) << 4". Operators: + - * / % ** & | ^ << >> >>>, unary - ~

> node devcalc/src/main.ts "2 ** -1"
Cannot calculate: "2 ** -1"
Why : negative exponent -1
Fix : DevCalc has integers only : use an exponent of 0 or more.

> node devcalc/src/main.ts "3 ** 5000"
Cannot calculate: "3 ** 5000"
Why : 3 ** 5000 has more than 4096 bits
Fix : keep the result under 4096 bits.

> node devcalc/src/main.ts "-1 >>> 4"
Cannot calculate: "-1 >>> 4"
Why : >>> of a negative number needs a word size
Fix : choose a word size (--bits=8|16|32|64|128), or use >>.

> node devcalc/src/main.ts "1''0"
Invalid input: "1''0"
Why : separators (_ or ') must sit between digits
Fix : use an integer like 255, -0xFF, 0b1010, 0o17, 1_000, 1'000, 1Fh, 4K or 'A'.

> node devcalc/src/main.ts "'ABCDEFGHI'"
Invalid input: "'ABCDEFGHI'"
Why : more than 8 characters (64 bits)
Fix : use an integer like 255, -0xFF, 0b1010, 0o17, 1_000, 1'000, 1Fh, 4K or 'A'.
```

`3 ** 5000` 은 계산하기 **전에** 거부된다: `bigint` 로 할 수는 있지만 `3 ** 1_000_000` 은 몇 초와 몇 메가바이트가 든다. 검사는 밑(Base)의 비트 길이로 크기를 어림한다.

**수식을 따옴표로 감싸자.** 셸에서 `*` 는 와일드카드다: `node devcalc/src/main.ts 2 ** 3` 은 `**` 대신 폴더의 파일 이름들 (`LICENSE` …) 을 넘긴다. 수식은 언제나 따옴표 안에 — bash 와 PowerShell 모두 `"2 ** 3"`. (큰따옴표 안의 `'A'` 는 괜찮다.)

### 코드

`ParseLiteral` 은 새 형식을 이름 있는 그룹으로 차례로 시도하고, 아니면 03강의 `ParseInteger` 로 넘긴다:

```ts
export function ParseLiteral(strText: string): TParseResult {
	if (RE_BAD_SEPARATOR.test(strText)) {
		return Fail(`separators (_ or ') must sit between digits`);
	}
	const strPlain = strText.replaceAll("'", "_"); // from here on, ' is the same as _
	const oHex = RE_HEX_SUFFIX.exec(strPlain);
	if (oHex?.groups?.digits !== undefined) {
		return ParseInteger(`0x${oHex.groups.digits}`);
	}
	const oSize = RE_SIZE.exec(strPlain);
	const strUnit = oSize?.groups?.unit?.toUpperCase() ?? "";
	if (oSize?.groups?.digits !== undefined && IsUnit(strUnit)) {
		const oDigits = ParseInteger(oSize.groups.digits);
		return oDigits.bOk ? { bOk: true, biValue: oDigits.biValue << UNIT_SHIFT[strUnit] } : oDigits;
	}
	return ParseInteger(strPlain);
}
```

- `UNIT_SHIFT` 는 2-2 절의 표다: `as const satisfies Record<EUnit, bigint>`. `IsUnit` 이 `strUnit` 을 좁힌 뒤에만 읽는다.
- `oHex?.groups?.digits !== undefined` 는 체인 전체를 좁힌다: `if` 안에서 `oHex.groups.digits` 는 `?.` 없이 `string` 이다.
- 숫자 부분의 오류는 `ParseInteger` 에서 오므로, `0x1K` 는 `"k" is not a valid hex digit` 이라고 한다 — 03강의 메시지 그대로다.

파서의 변경은 `#Expression` 안의 두 줄이다 (10강 버전에 `OperatorAssoc` 와 모호함 검사를 더함):

```ts
if (strOp === "**" && oLeft.eKind === "unary" && oFirst.eKind === "operator") {
	throw new CParseError(`"${oFirst.strText}x ** y" is ambiguous ("**" at column ${oNext.nCol}) : ...`);
}
this.#nPos++;
const nPrecedence = OperatorPrecedence(strOp);
const nRightMin = OperatorAssoc(strOp) === "right" ? nPrecedence : nPrecedence + 1;
const oRight = this.#Nested(() => this.#Expression(nRightMin));
```

`#Nested` 가 깊이를 센다: `2 ** 2 ** 2 ** …` 5,000 번은 `-----1` 처럼 오른쪽으로 재귀하므로, 스택 오버플로 대신 같은 깊이 제한 오류가 난다.

웹 페이지는 새로 할 일이 없다: `Evaluate()` 를 부르므로 `'A' + 1` 과 `~0 >>> 4` 가 거기서도 된다.

### 확인한 것

```
> npm test
check-pairs : 54 pairs, 0 failed
check-names : 30 files, 0 problems

 Test Files  10 passed (10)
      Tests  57 passed (57)
```

```ts
test("** binds tightest and groups to the right", () => {
	expect(Grouped("2 ** 3 ** 2")).toBe("(2 ** (3 ** 2))");
	expect(Grouped("2 * 3 ** 2")).toBe("(2 * (3 ** 2))");
	expect(Grouped("(-2) ** 2")).toBe("(-2 ** 2)");
	expect(Grouped("~0 >>> 4")).toBe("(~0 >>> 4)");
});
```

해 볼 것:

- `Literal.ts` 의 `EUnit` 에 `P` (1024⁵) 를 더하면 → `P: 50n` 을 더할 때까지 `UNIT_SHIFT` 에 TS2741. 그다음 `RE_SIZE` 에도 `p` 가 필요하다 — 타입은 정규식을 검사하지 못한다.
- `ParseLiteral` 에 10진 접두사 `0d` (`0d255`) 를 더해 보자.
- 웹 페이지 (`npm run web`) 에 `'A' + 1` 을 입력해 보자.

---

## 정리

- 정규식 리터럴은 TS 가 검사한다. `new RegExp(text)` 는 실행 중에만 검사되고, 텍스트가 입력에서 오면 이스케이프해야 한다.
- 수량자는 뒤에 `?` 가 없으면 탐욕이다. `a|b` 에서는 처음 되는 것이 이긴다 — `>>>` 를 `>>` 앞에 둔다.
- **[TS]** `exec` 는 `… | null` 을 돌려주고, 그룹 (`[1]`, `groups.name`) 은 모두 `string | undefined` 다: 그룹은 `?.` 와 `??` 로 읽는다.
- `g` 와 `y` 정규식은 호출 사이에 `lastIndex` 를 유지한다. `test()` 에는 `g` 를 쓰지 않는다.
- **[TS]** 리터럴 타입과 그 유니온은 정확한 값을 표현한다. `as const` 는 리터럴을 유지하고, `satisfies Record<EUnit, …>` 는 표가 유니온을 정확히 다루는지 검사한다. 바깥에서 온 텍스트에는 타입 가드가 필요하다 — `as` 는 아무것도 검사하지 않는다.
- **[TS]** 템플릿 리터럴 타입은 문자열 패턴을 표현하고, 유니온의 모든 조합을 만들며, `infer` 로 나눌 수 있다.
- DevCalc Lv6: `1'000` `1Fh` `4K` `'A'`, `~`, 오른쪽 결합 `**`, 산술 `>>` 와 논리 `>>>`, 그리고 JavaScript 와 같은 `-2 ** 2` 오류.

## 다음으로 갈 곳

[12강](../12-bigint-words/README.ko.md) 은 `bigint` 를 더 깊이 다룬다 — 128 비트까지 모든 워드 크기의 `asIntN`/`asUintN`, 바이트 순서, 그리고 타입 표기·`as` 와 비교한 `satisfies` — 그리고 DevCalc 에 8진과 문자 출력을 더한다.

---

[← 이전: 10. 렉서와 파서](../10-lexer-parser/README.ko.md) · [목차](../../README.ko.md) · [다음: 12. bigint 와 고정 크기 워드 →](../12-bigint-words/README.ko.md)
