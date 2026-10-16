[English](README.md) · **한국어**

[← 이전: 09. 테스트와 도구](../09-testing-tooling/README.ko.md) · [목차](../../README.ko.md) · [다음: 11. 정규식과 리터럴 타입 →](../11-regex-literal-types/README.ko.md)

# 10. (도전) 렉서와 파서 — 재귀, 구문 트리, 수식 전체 계산

> 시리즈: DH.Study.TypeScript · 10강
> 환경: Node.js v24 · TypeScript 7 · Vitest 5 · VS Code

## 목표

이 강의를 마치면 다음을 할 수 있다.

- [ ] 종료 조건(Base case)이 있는 재귀 함수(Recursive function)를 쓰고, 호출 스택(Call stack)이 언제 바닥나는지 (그리고 그때 어떻게 하는지) 안다
- [ ] 재귀 데이터를 재귀 타입(`interface` 나 판별 유니온)으로 표현하고 `switch` 로 순회한다
- [ ] 렉서(Lexer)로 텍스트를 토큰(Token)으로 바꾼다 (스캔 루프, 또는 sticky 정규식). 오류 메시지용으로 열 번호(Column)를 남긴다
- [ ] 재귀 하강 파서(Recursive descent parser)로 토큰을 구문 트리(Syntax tree)로 바꾸고, 그 트리를 계산한다
- [ ] 우선순위(Precedence)와 결합성(Associativity)을 표 하나로 처리한다 (우선순위 클라이밍, Precedence climbing)

## 이 강의의 목차

1. [재귀](#1-재귀)
2. [렉서](#2-렉서)
3. [구문 트리](#3-구문-트리)
4. [재귀 하강 파서](#4-재귀-하강-파서)
5. [따라하기](#5-따라하기)
6. [직접 만들기 — 우선순위 클라이밍](#6-직접-만들기--우선순위-클라이밍)
7. [DevCalc 스텝 — Lv5 수식 전체](#7-devcalc-스텝--lv5-수식-전체)
8. [정리](#정리)
9. [다음으로 갈 곳](#다음으로-갈-곳)

이 강의의 예제 파일: [recursion.ko.ts](recursion.ko.ts) · [lexer.ko.ts](lexer.ko.ts) · [parser.ko.ts](parser.ko.ts) · [precedence.ko.ts](precedence.ko.ts)

> 예제는 한국어 주석판(`x.ko.ts`)을 링크한다. 같은 코드의 영어 주석판은 `x.ts` 다.

> 문법 표시: **[JS]** = JavaScript 문법 (TS 없이도 있음) · **[TS]** = TypeScript 가 더한 타입 문법 (지우면 JS) · 자세한 구분은 [00강 7-3](../00-setup/README.ko.md#7-3-ts-문법--js-문법--타입-문법)

지금까지 DevCalc 는 많아야 `a op b` 만 읽었다: 숫자 하나, 연산자 하나, 숫자 하나. `1 + 2 + 3` 은 오류였다. 이 강의에서는 **어떤** 수식이든 읽게 만든다 — `(0xFF + 1) << 4`, `-ans * 2`, `1 | 2 ^ 3 & 4`. 방법은 컴파일러가 코드를 읽는 방식과 같다: 텍스트 → **토큰** (렉서) → **구문 트리** (파서) → 값 (평가기, Evaluator).

```
"(1 + 2) * 3"  ──Lex──▶  ( 1 + 2 ) * 3 end  ──Parse──▶      *       ──Calc──▶  9
                                                           ├─ +
                                                           │  ├─ 1
                                                           │  └─ 2
                                                           └─ 3
```

도전 강의다: 앞 강의들의 모든 것 (유니온과 좁히기, 클래스, `Result`, 테스트) 이 한데 모인다. 새로운 생각은 하나뿐이다: **재귀(Recursion)**.

---

## 1. 재귀

재귀 함수는 자기 자신을 호출한다. 두 부분이 필요하다:

- **종료 조건(Base case)** — 바로 답할 수 있을 만큼 작은 입력 (여기서 멈춤);
- **단계(Step)** — 문제를 더 작게 만들고, 그 작은 부분으로 자신을 호출.

```ts
function SumDigits(biValue: bigint): bigint {
	if (biValue < 10n) {
		return biValue; // 종료 조건 : 한 자리 수
	}
	return (biValue % 10n) + SumDigits(biValue / 10n); // 단계 : 마지막 자리 + 나머지 자리들의 합
}
```

`SumDigits(987n)` 은 `SumDigits(98n)` 을 부르고, 그것은 `SumDigits(9n)` 을 부른다. 각 호출은 안쪽 호출을 호출 스택에서 **기다린다**. 그다음 거꾸로 된 순서로 끝난다 (9 → 17 → 24). 예제가 이것을 출력한다.

> **C#** : 새로운 것 없음 — 재귀는 똑같이 동작한다. 두 언어 모두 꼬리 호출 제거(Tail-call elimination)를 기대할 수 없으므로, 깊은 재귀는 양쪽 모두 스택 오버플로가 난다. C# 은 프로세스가 종료되고 (`StackOverflowException` 은 catch 할 수 없음), JavaScript 는 catch *할 수 있는* `RangeError` 를 던진다.

### 1-1. 재귀 타입

재귀는 **데이터**가 재귀적일 때 가장 쓸모 있다: 폴더는 폴더를 담고, 수식은 수식을 담는다. **[TS]** 타입은 자기 자신을 참조할 수 있다:

```ts
interface IFolder {
	strName: string;
	arrChild: IFolder[]; // interface 가 자기 자신을 참조
}

type TExpr = { eKind: "number"; nValue: number } | { eKind: "add"; oLeft: TExpr; oRight: TExpr };
```

재귀 데이터는 재귀 함수로 순회한다 — 노드 하나에 호출 하나. 코드의 모양이 타입의 모양을 따라간다:

```ts
function Calc(oExpr: TExpr): number {
	switch (oExpr.eKind) {
		case "number":
			return oExpr.nValue; // 종료 조건 : 리프 노드 (leaf)
		case "add":
			return Calc(oExpr.oLeft) + Calc(oExpr.oRight); // 단계 : 더 작은 두 트리
	}
}
```

`default` 도, 마지막 `return` 도 없다: 유니온의 모든 case 가 return 하고, TS 가 그것을 안다 (03강의 완전성 검사, Exhaustiveness). `TExpr` 에 세 번째 종류를 더하면 그것을 처리할 때까지 `Calc` 에 빨간 줄이 생긴다.

### 1-2. 스택이 넘칠 때

기다리는 호출마다 스택 공간을 쓴다. 넘치는 경우는 두 가지다:

| 원인 | 예 | 해결 |
|---|---|---|
| 종료 조건이 없음 (버그) | `Forever(n)` 이 `Forever(n + 1)` 을 호출 | 언제나 도달하는 종료 조건 |
| 올바르지만 입력이 너무 깊음 | 깊이가 100,000 인 폴더 체인 | 직접 만든 스택을 쓰는 반복문, 또는 깊이 제한 |

둘 다 `RangeError: Maximum call stack size exceeded` 를 던진다 (Node 에서는 대략 만 번 정도의 호출, 프레임 크기에 따라 다름). 내가 통제하지 못하는 입력 — 사용자가 친 텍스트 — 에서는 이게 중요하다: 괄호 100,000 개짜리 `((((((…1` 은 크래시가 아니라 오류 메시지를 내야 한다. DevCalc 파서에는 바로 그것을 위한 깊이 제한이 있다 (7 절).

반복문 버전은 호출 스택을 배열로 바꾼다:

```ts
function CountFoldersLoop(oFolder: IFolder): number {
	const arrTodo: IFolder[] = [oFolder];
	let nCount = 0;
	for (let oNext = arrTodo.pop(); oNext !== undefined; oNext = arrTodo.pop()) {
		nCount++;
		arrTodo.push(...oNext.arrChild);
	}
	return nCount;
}
```

깊이가 작고 알려져 있으면 (사람이 친 구문 트리, 폴더 트리) 재귀를, 깊이가 아주 커질 수 있으면 반복문을 쓴다.

---

## 2. 렉서

**렉서(Lexer, Tokenizer, Scanner)** 는 텍스트를 **토큰**으로 바꾼다: 언어의 단어다. `12 + 3*(40 - 1)` 은 `12`, `+`, `3`, `*`, `(`, `40`, `-`, `1`, `)` 가 된다. 이후 단계에서는 글자, 공백, 숫자 글자를 하나하나 다시 보지 않는다.

**[TS]** 토큰은 판별 유니온(Discriminated union)이다 — 종류마다 필요한 필드만 가진다:

```ts
type EOp = "+" | "-" | "*" | "/";

type TToken =
	| { eKind: "number"; nValue: number; nCol: number }
	| { eKind: "operator"; strOp: EOp; nCol: number }
	| { eKind: "open" | "close" | "end"; nCol: number };
```

- `nCol` (1부터 세는 열 번호) 은 오류가 **어디서** 났는지 말하려고 남긴다.
- 목록은 언제나 `end` 토큰으로 끝난다. 그래서 파서는 길이를 확인하지 않고도 언제나 토큰 하나를 미리 볼 수 있다.

### 2-1. 스캔 루프

**[JS]** `nPos` 위치의 글자를 보고, 토큰 하나를 통째로 읽고, `nPos` 를 그 뒤로 옮긴다:

```ts
while (nPos < strExpr.length) {
	const strChar = strExpr.charAt(nPos);
	const nCol = nPos + 1;
	if (strChar === " ") {
		nPos++; // 공백은 토큰을 나눌 뿐
	} else if (IsDigit(strChar)) {
		const nStart = nPos;
		while (IsDigit(strExpr.charAt(nPos))) {
			nPos++;
		}
		arrToken.push({ eKind: "number", nValue: Number(strExpr.slice(nStart, nPos)), nCol });
	} else if (IsOp(strChar)) {
		arrToken.push({ eKind: "operator", strOp: strChar, nCol }); // IsOp 는 타입 가드 : 여기서 strChar 는 EOp
		nPos++;
	}
	// ... ( ) , 또는 nCol 이 담긴 오류
}
```

`IsOp(strChar): strChar is EOp` 는 타입 가드(Type guard, 03강)다: 그 뒤에서 `strChar` 는 `EOp` 이므로, 형 변환 없이 `strOp` 필드에 들어간다.

### 2-2. sticky 정규식

**[JS]** 토큰 종류가 많으면 반복문이 길어진다. 정규식으로 토큰 하나를 읽을 수 있지만, 보통의 `g` 정규식은 **앞으로 찾아 나간다**. `y` (sticky) 플래그는 정확히 `lastIndex` **에서만** 맞춰 본다:

```ts
const RE_NUMBER_Y = /\d+/y;
RE_NUMBER_Y.lastIndex = 0;
RE_NUMBER_Y.exec("ab12"); // null : 1열에는 숫자가 없음 (/g 정규식이면 3열의 "12" 를 찾음)
```

렉서에 필요한 것이 바로 이것이다: "*여기에* 숫자가 있나?". DevCalc 렉서는 sticky 정규식 네 개다 (7 절).

> **C#** : `Regex.Match(text, startat)` 은 `g` 처럼 앞으로 찾는다. sticky 에 해당하는 것은 `\G` 앵커다 (`new Regex(@"\G\d+")`). Roslyn 렉서는 대부분의 실제 렉서처럼 글자를 하나씩 스캔하는, 손으로 짠 반복문이다.

---

## 3. 구문 트리

토큰은 평평하지만, 수식은 그렇지 않다. `1 + 2 * 3` 은 `1 + (2 * 3)` 이라는 뜻이다. **구문 트리** (AST, Abstract syntax tree, 추상 구문 트리) 는 묶음을 눈에 보이게 한다 — 트리에서 아래에 있는 것을 먼저 계산한다:

```
1 + 2 * 3        (1 + 2) * 3      8 - 4 - 2
+                *                -
├─ 1             ├─ +             ├─ -
└─ *             │  ├─ 1          │  ├─ 8
   ├─ 2          │  └─ 2          │  └─ 4
   └─ 3          └─ 3             └─ 2
```

- 괄호는 트리에서 사라진다: 괄호는 트리의 모양을 정했을 뿐이다.
- `8 - 4 - 2` 는 `(8 - 4) - 2` = 2 이지, `8 - (4 - 2)` = 6 이 아니다. 같은 단계의 연산자는 **왼쪽에서 오른쪽으로** 묶인다 (왼쪽 결합, Left-associative).

**[TS]** 트리는 재귀적인 판별 유니온이다:

```ts
type TNode =
	| { eKind: "number"; nValue: number }
	| { eKind: "negate"; oOperand: TNode }
	| { eKind: "binary"; strOp: EOp; oLeft: TNode; oRight: TNode };
```

트리 계산은 1-1 절의 `Calc` 에 case 를 더한 것이다: 리프 노드(Leaf)는 자기 값이고, 내부 노드는 자식들을 먼저 계산한 뒤 자신을 계산한다.

> **C#** : Roslyn 이 주는 것 (`SyntaxTree`, `BinaryExpressionSyntax`), 그리고 `System.Linq.Expressions` 가 람다에서 만드는 것 (`BinaryExpression`, `Expression.Add`) 이 이것이다. C# 에서는 노드 종류가 클래스 계층이다. TS 에서는 `eKind` 가 있는 평범한 객체의 유니온이면 충분하다 — 그리고 컴파일러가 모든 `switch` 를 검사한다.

---

## 4. 재귀 하강 파서

**파서(Parser)** 는 토큰을 트리로 바꾼다. 규칙은 **문법(Grammar)** 으로 쓴다 — 규칙 하나에 한 줄, `{ }` 는 "반복":

```
expression = term   { ("+" | "-") term }
term       = factor { ("*" | "/") factor }
factor     = number | "-" factor | "(" expression ")"
```

**재귀 하강(Recursive descent)** 파서는 규칙 하나에 함수 하나를 둔다. 각 함수는 아래 규칙을 호출한다. `factor` 는 `( )` 때문에 다시 `expression` 을 호출한다 — 이것이 재귀다.

```ts
#ParseExpression(): TNode {
	let oLeft = this.#ParseTerm();
	while (this.#Peek() === "+" || this.#Peek() === "-") {
		const strOp = this.#Next() as EOp;
		oLeft = { eKind: "binary", strOp, oLeft, oRight: this.#ParseTerm() }; // 반복문 덕분에 8 - 4 - 2 = (8 - 4) - 2
	}
	return oLeft;
}

#ParseFactor(): TNode {
	const strToken = this.#Next();
	if (/^\d+$/.test(strToken)) {
		return { eKind: "number", nValue: Number(strToken) };
	}
	if (strToken === "-") {
		return { eKind: "negate", oOperand: this.#ParseFactor() };
	}
	if (strToken === "(") {
		const oInside = this.#ParseExpression(); // 재귀 : ( ) 안에는 식 전체
		if (this.#Next() !== ")") {
			throw new SyntaxError(`expected ")"`);
		}
		return oInside;
	}
	throw new SyntaxError(`expected a number, "-" or "(", found ...`);
}
```

- **우선순위는 규칙의 순서에서 나온다.** `term` 은 `expression` *안에서* 호출되므로, `+` 가 닿기 전에 `*` 가 먼저 묶인다.
- **왼쪽 결합은 반복문에서 나온다.** 한 바퀴마다 지금까지 만든 트리 (`oLeft`) 를 새 노드로 감싼다.
- **오류**: 규칙마다 다음에 올 수 있는 토큰을 안다. 그 밖의 것은 구문 오류(Syntax error)이고, 맞지 않는 첫 토큰에서 발견된다. 맨 위 규칙이 끝나면 다음 토큰은 끝이어야 한다 (`1 2` 는 오류).

> **C#** : `#` 필드는 실행 시간에도 private 이다 (04강). 파서 안의 `throw new SyntaxError` 는 괜찮다: DevCalc 에서는 `Parse` 밖으로 나가지 않고 `Result` 로 바뀐다 (7 절).

---

## 5. 따라하기

### [recursion.ko.ts](recursion.ko.ts) — 종료 조건과 단계, 재귀 타입, 스택 오버플로, 반복문 버전

```
> node lessons/10-lexer-parser/recursion.ko.ts
1) SumDigits(9876n) = 30n
   SumDigits(987)
      SumDigits(98)
         SumDigits(9)
         → 9
      → 17
   → 24
2) devcalc/
2)    src/
2)       core/
2)       cli/
2)    tests/
2)    web/
2) CountFolders = 6
3) Calc(1 + (2 + 3)) = 6
4) Expected error: RangeError: Maximum call stack size exceeded
   Why : Forever never stops calling itself, and each waiting call takes stack space.
   Fix : every recursive function needs a base case that is always reached.
5) Expected error: RangeError: Maximum call stack size exceeded
   Why : the input is deeper than the call stack.
   Fix : a loop with your own stack (below), or a depth limit for input you don't control.
5) CountFoldersLoop(deep chain) = 100001
5) CountFoldersLoop(ROOT)       = 6
```

해 볼 것:

- 5 절의 `100_000` 을 `1_000` 으로 바꾸면 → `CountFolders` 가 성공한다. 내 컴퓨터에서 실패하는 가장 작은 깊이를 찾아 보자 (`node --stack-size=2000 ...` 은 한계를 올린다 — 해결책이 아니라 우회책).
- `const oBad: TExpr = ...` 앞의 `//` 를 지우면 → 빨간 줄 TS2322 (`Property 'oRight' is missing ...`).
- `TExpr` 에 `{ eKind: "multiply"; oLeft: TExpr; oRight: TExpr }` 를 더하면 → case 를 추가할 때까지 `Calc` 가 빨갛다 (TS2366, 모든 경로가 return 하지 않음).

### [lexer.ko.ts](lexer.ko.ts) — 토큰 유니온, 스캔 루프, g 와 y, 열 번호가 있는 오류

```
> node lessons/10-lexer-parser/lexer.ko.ts
2) "12 + 3*(40 - 1)" → [number 12] [op +] [number 3] [op *] [(] [number 40] [op -] [number 1] [)] [end]
2) "7/2" → [number 7] [op /] [number 2] [end]
2) "" → [end]
3) /\d+/g at 0 in "ab12" : 12 (skipped ahead to column 3)
3) /\d+/y at 0 in "ab12" : undefined (nothing AT column 1 : what a lexer wants)
3) /\d+/y at 2 in "ab12" : 12
4) Expected error: unexpected character "$" at column 5
   2 + $3
       ^
4) Expected error: unexpected character "%" at column 8
   2 ** 3 % 4
          ^
   Why : the lexer knows digits, + - * / ( ) and spaces. ** is read as * *, and % is unknown.
   Fix : the parser rejects * *; DevCalc's lexer reads a run of operator characters (devcalc/src/core/Lexer.ts).
```

해 볼 것:

- `const oBad: TToken = ...` 앞의 `//` 를 지우면 → TS2322 (`Type '"%"' is not assignable to type 'EOp'`). `EOp` 와 `IsOp` 에 `"%"` 를 더하면 → `2 ** 3 % 4` 가 토큰으로 나뉜다.
- `ShowToken` 의 `case "end":` 를 지우면 → TS2366. switch 는 유니온을 기준으로 검사된다.

### [parser.ko.ts](parser.ko.ts) — 구문 트리, 재귀 하강, 트리 출력, 구문 오류

```
> node lessons/10-lexer-parser/parser.ko.ts
3) 1 + 2 * 3 = 7
   +
   ├─ 1
   └─ *
      ├─ 2
      └─ 3
3) (1 + 2) * 3 = 9
   *
   ├─ +
   │  ├─ 1
   │  └─ 2
   └─ 3
3) 8 - 4 - 2 = 2
   -
   ├─ -
   │  ├─ 8
   │  └─ 4
   └─ 2
3) -(2 + 3) * 4 = -20
   *
   ├─ -
   │  └─ +
   │     ├─ 2
   │     └─ 3
   └─ 4
4) Expected error: "1 + * 2" → SyntaxError: expected a number, "-" or "(", found "*"
4) Expected error: "(1 + 2" → SyntaxError: expected ")"
4) Expected error: "1 2" → SyntaxError: expected an operator or the end, found "2"
   Why : each rule says which token may come next; anything else is a syntax error.
   Fix : fix the input. A real parser also reports the column (devcalc/src/core/Parser.ts).
```

`-(2 + 3) * 4` 는 단항 마이너스(Unary minus)가 `*` 보다 강하게 묶인다는 것을 보여 준다: `factor` 가 `-` 를 처리하므로 `-` 노드가 `*` 아래에 있다.

해 볼 것:

- 두 규칙을 맞바꾸자: `#ParseExpression` 이 `*` `/` 를, `#ParseTerm` 이 `+` `-` 를 찾게 하면 → `1 + 2 * 3 = 9`. 규칙의 순서가 *곧* 우선순위다.
- `#ParseExpression` 의 `while` 을 `if` 로 바꾸면 → 프로그램이 `8 - 4 - 2` 에서 `SyntaxError: expected an operator or the end, found "-"` 로 멈춘다. 연속된 연산을 읽는 것은 반복문이다.
- `const oBad: TNode = ...` 앞의 `//` 를 지우면 → TS2322.

### [precedence.ko.ts](precedence.ko.ts) — 6 절 참고

---

## 6. 직접 만들기 — 우선순위 클라이밍

재귀 하강은 우선순위 단계마다 함수 하나가 필요하다. C 의 이항 연산자는 10 단계, DevCalc 는 6 단계다. **우선순위 클라이밍(Precedence climbing)** 은 그 함수들을 **함수 하나와 표 하나** 로 바꾼다:

```ts
type EAssoc = "left" | "right";

const TABLE: TTable = {
	"+": { nPrecedence: 1, eAssoc: "left", fnApply: (nLeft, nRight) => nLeft + nRight },
	"-": { nPrecedence: 1, eAssoc: "left", fnApply: (nLeft, nRight) => nLeft - nRight },
	"*": { nPrecedence: 2, eAssoc: "left", fnApply: (nLeft, nRight) => nLeft * nRight },
	"/": { nPrecedence: 2, eAssoc: "left", fnApply: (nLeft, nRight) => nLeft / nRight },
	"**": { nPrecedence: 3, eAssoc: "right", fnApply: (nLeft, nRight) => nLeft ** nRight }, // 2 ** 3 ** 2 = 2 ** (3 ** 2) : 오른쪽부터
};
```

### 함수 하나

```ts
// 피연산자 하나를 읽고, 우선순위가 nMin 이상인 연산자를 모두 읽음
function Expression(nMin: number, nDepth: number): number {
	let nLeft = Operand(nDepth);
	for (;;) {
		const strOp = arrToken[nPos] ?? "";
		const oInfo = oTable[strOp];
		if (oInfo === undefined || oInfo.nPrecedence < nMin) {
			break; // 연산자가 아니거나 더 약하게 묶는 연산자 : 호출한 쪽이 가져감
		}
		nPos++;
		// left : 오른쪽은 더 강한 연산자만 가져감. right : 같은 연산자가 오른쪽에서 또 나올 수 있음
		const nNextMin = oInfo.eAssoc === "left" ? oInfo.nPrecedence + 1 : oInfo.nPrecedence;
		const nRight = Expression(nNextMin, nDepth + 1);
		nLeft = oInfo.fnApply(nLeft, nRight);
	}
	return nLeft;
}
```

읽는 법:

- `Expression(nMin)` 은 "식을 읽되, `nMin` 보다 **약한** 연산자에서는 멈춰라" 라는 뜻이다.
- 우선순위 `p` 인 연산자 뒤의 오른쪽은 `nMin = p + 1` 로 읽는다: 더 **강한** 연산자만 가져갈 수 있다. 그래서 `1 + 2 * 3` 에서 `+` 의 오른쪽 (min 2) 은 `* 3` 까지 가져가고, `8 - 4 - 2` 에서 첫 `-` 의 오른쪽 (min 2) 은 두 번째 `-` 앞에서 멈춘 뒤 반복문이 그것을 집는다 → `(8 - 4) - 2`.
- 오른쪽 결합 연산자는 `nMin = p` 를 쓴다: 같은 연산자가 오른쪽에서 이어질 수 있다 → `2 ** (3 ** 2)`.

이 예제는 파싱하면서 바로 계산한다 — 트리가 없다. DevCalc 는 같은 함수로 대신 트리를 만든다 (7 절).

### 실행

```
> node lessons/10-lexer-parser/precedence.ko.ts
2) 1 + 2 * 3   = 7
2) (1 + 2) * 3 = 9
2) 8 - 4 - 2   = 2
2) 2 ** 3 ** 2 = 512
2) 2 * 3 ** 2  = 18
3) Trace of 1 + 2 * 3
   Expression(min 1) at "1"
      Expression(min 2) at "2"
         Expression(min 3) at "3"
      2 * 3
   1 + 6
4) Expected error (a wrong answer, not an exception): 8 - 4 - 2 = 6
   Why : right-associative reads it as 8 - (4 - 2) = 6, but - is left-associative : (8 - 4) - 2 = 2.
   Fix : only ** (and assignment =) are right-associative; keep - left. A test catches this.
5) 1 + 17 % 5 * 2 = 5
```

추적(Trace)이 재귀를 보여 준다: `*` 는 `+` 가 자기 오른쪽을 위해 부른 호출 (min 2) 안에서 계산되므로, `2 * 3` 이 `1 + 6` 보다 먼저 끝난다.

표는 데이터다: 출력 4) 는 잘못된 표가 **아무 오류 없이** 틀린 답을 낸다는 것을 보여 준다 — 그래서 DevCalc 파서에는 우선순위와 결합성 테스트가 있다. 출력 5) 는 한 줄로 `%` 를 더한다. 파서는 바뀌지 않는다.

> **C#** : C# 의 우선순위 표는 언어 명세(Specification)의 "Operator precedence and associativity" 에 있다. 손으로 짠 파서들 — Roslyn 과 TypeScript 컴파일러도 — 은 `Expression(nMin)` 같은 우선순위 반복문으로 이항 연산자를 읽는다.

---

## 7. DevCalc 스텝 — Lv5 수식 전체

### 바뀐 것

| 파일 | 변경 |
|---|---|
| `devcalc/src/core/Lexer.ts` | 새 파일: `Lex(strExpr)` → `TResult<TToken[], IEvalError>`. sticky 정규식 네 개 (공백, 숫자, 이름, 연산자 연속) |
| `devcalc/src/core/Parser.ts` | 새 파일: `TNode`, `Parse(strExpr)` (우선순위 클라이밍, 깊이 제한), `ToText(oNode)` |
| `devcalc/src/core/Calculator.ts` | `OPERATOR_TABLE` 에 `nPrecedence` 열, `OperatorPrecedence(strOp)` |
| `devcalc/src/core/Evaluate.ts` | `Evaluate` = `Parse` → `Walk` (재귀). 전에는 정규식으로 `a op b` 를 나눴음 |
| `devcalc/src/core/index.ts` | `Lex`, `Parse`, `ToText`, `OperatorPrecedence` 를 내보냄 |
| `devcalc/src/main.ts`, `devcalc/web/App.ts` | 사용법 `"<expression>"`. 오버플로 안내에 범위를 벗어난 값을 표시 |
| `devcalc/tests/Parser.test.ts` | 새 파일: 테스트 7 개 (렉서, 우선순위, 결합성, 오류, 깊이) |
| `devcalc/tests/Evaluate.test.ts` | `1 + 2 + 3` 은 더 이상 오류가 아님. 새 테스트 2 개 |

명령줄, REPL, `;` 와 `ans`, `--bits`, `--copy`, 웹 페이지는 바뀌지 않았다 — 모두 `Evaluate()` 를 부르므로, 모두 이제 수식 전체를 읽는다.

### 우선순위

C, JavaScript (그리고 C#) 와 같은 순서다. 그래서 코드에서 복사한 수식이 같은 답을 낸다:

| 우선순위 | 연산자 | 예 |
|---|---|---|
| 6 (가장 강함) | `*` `/` `%` | `1 + 2 * 3` = 7 |
| 5 | `+` `-` | `1 << 2 + 3` = `1 << 5` = 32 |
| 4 | `<<` `>>` | |
| 3 | `&` | `1 \| 2 ^ 3 & 4` = `1 \| (2 ^ (3 & 4))` = 3 |
| 2 | `^` | |
| 1 (가장 약함) | `\|` | |

모두 왼쪽 결합이다. 단항 `-` 는 그 모두보다 강하게 묶인다: `-2 * 3` 은 `(-2) * 3` 이다.

```
> node devcalc/src/main.ts "(0xFF + 1) << 4"
HEX : 0x1000
DEC : 4,096
BIN : 0b1_0000_0000_0000

> node devcalc/src/main.ts "1 << 2 + 3"
HEX : 0x20
DEC : 32
BIN : 0b10_0000

> node devcalc/src/main.ts "-(0x10 - 1) * 2"
HEX : -0x1E
DEC : -30
BIN : -0b1_1110
```

`1 << 2 + 3` = 32 는 C 계열 언어 어디서나 사람들을 놀라게 한다 — `+` 가 `<<` 보다 강하게 묶인다. 헷갈리면 괄호를 쓰자.

### 렉서 : sticky 정규식 네 개

```ts
const RE_SPACE = /\s+/y;
const RE_NUMBER = /[0-9][0-9A-Za-z_]*/y; // 0xFF, 1_000, 12a (ParseInteger says what is wrong)
const RE_NAME = /[A-Za-z_][0-9A-Za-z_]*/y;
const RE_OPERATOR = /[*/%&|^<>=!~]+|[+-]/y; // a run, so ** and >>> are read whole (and rejected); + and - stand alone : 2*-1
```

- 숫자는 너그럽게 읽고 (`12a`, `0x1G`) 03강의 `ParseInteger` 에 넘긴다. 그래서 잘못된 숫자의 메시지는 이미 아는 그것이다.
- 연산자 글자는 **연속(Run)** 으로 읽는다: `**` 는 토큰 하나이고 `Invalid operator: "**"` 메시지를 받는다 — 헷갈리는 "expected a number, found `*`" 가 아니다. `+` 와 `-` 는 단독 토큰이므로 `2*-1` 은 `2 * -1` 이다.
- 이름은 `ans` (대소문자 무관) 하나뿐이다.

### 파서 : TOperator 기반 우선순위 클라이밍

```ts
#Expression(nMinPrecedence: number): TNode {
	let oLeft = this.#Unary();
	for (;;) {
		const oNext = this.#Peek();
		if (oNext.eKind !== "operator" || OperatorPrecedence(oNext.strText) < nMinPrecedence) {
			return oLeft;
		}
		this.#nPos++;
		const oRight = this.#Expression(OperatorPrecedence(oNext.strText) + 1);
		oLeft = { eKind: "binary", strOp: oNext.strText, oLeft, oRight };
	}
}
```

6 절의 함수에 `Calculator.ts` 의 표를 쓰고, 숫자 대신 `TNode` 를 만든 것이다. 토큰의 `strText` 가 `TOperator` 이므로 (`eKind === "operator"` 로 좁혀짐), `OperatorPrecedence` 와 트리 노드가 형 변환 없이 받아들인다.

안에서는 오류를 private `CParseError` 로 던진다. `Parse()` 가 그것을 잡아 열 번호가 담긴 `Err` 로 돌려준다. 호출하는 쪽은 잘못된 입력 때문에 예외를 보는 일이 없다:

```
> node devcalc/src/main.ts "(1 + 2"
Invalid expression: "(1 + 2"
Why : expected ")" for the "(" at column 1, found the end
Fix : e.g. "(0xFF + 1) << 4". Operators: + - * / % & | ^ << >>

> node devcalc/src/main.ts "1 2"
Invalid expression: "1 2"
Why : expected an operator or the end, found "2" at column 3
Fix : e.g. "(0xFF + 1) << 4". Operators: + - * / % & | ^ << >>

> node devcalc/src/main.ts "2 ** 3"
Invalid operator: "**"
Why : supported operators are + - * / % & | ^ << >>
Fix : e.g. "(0xFF + 1) << 4" (quote the expression).

> node devcalc/src/main.ts "(1 + 1) / (1 - 1)"
Cannot calculate: "(1 + 1) / (1 - 1)"
Why : division by zero
Fix : the right side of / must not be 0.
```

> 10강 시점의 출력이다. [11강](../11-regex-literal-types/README.ko.md) 에서 `**`, `>>>`, `~` 가 추가되므로, 거기서는 연산자 목록이 길어지고 `2 ** 3` 은 8 이 된다.

**깊이 제한.** `(` 와 단항 `-` 는 재귀로 중첩된다. `MAX_DEPTH = 100` 은 `((((…` 와 `-----…1` 을 `RangeError` (1-2 절) 대신 오류 메시지로 바꾼다. 테스트가 100 단계 (OK), 101 단계 (오류), 마이너스 5,000 개 (오류, 크래시 없음) 를 확인한다.

### Evaluate : 트리 순회

```ts
function Walk(oNode: TNode, oCalc: CCalculator, oWord: CWordSize | undefined, biAns: bigint): ICalcResult {
	switch (oNode.eKind) {
		case "number":
			return Wrap(oNode.biValue, oWord);
		case "ans":
			return Wrap(biAns, oWord);
		case "negate": {
			const oOperand = Walk(oNode.oOperand, oCalc, oWord, biAns);
			return KeepOverflow(Wrap(-oOperand.biValue, oWord), [oOperand]);
		}
		case "binary": {
			const oLeft = Walk(oNode.oLeft, oCalc, oWord, biAns);
			const oRight = Walk(oNode.oRight, oCalc, oWord, biAns);
			return KeepOverflow(oCalc.Calculate(oLeft.biValue, oNode.strOp, oRight.biValue), [oLeft, oRight]);
		}
	}
}
```

이항 노드마다 04강의 `CCalculator` 를 쓴다 — 같은 검사 (0 으로 나누기, 시프트 범위) 와 같은 감싸기(Wrapping)다. `--bits` 가 있으면 **모든** 값을 계산하는 대로 감싼다. 프로그래머용 계산기 (또는 C 의 고정 크기 정수) 와 같다. 오버플로 안내에는 이제 처음으로 범위를 벗어난 값이 표시된다:

```
> node devcalc/src/main.ts "(0xFF + 1) | 0" --bits=8
HEX : 0x00
DEC : 0
BIN : 0b0000_0000
INT : 0 (8-bit signed)
Note: 256 does not fit in 8 bits (BYTE), so it wrapped to 0.

> node devcalc/src/main.ts "-2 * -3" --bits=8
HEX : 0x06
DEC : 6
BIN : 0b0000_0110
INT : 6 (8-bit signed)
Note: 64262 does not fit in 8 bits (BYTE), so it wrapped to 6.
```

10강 전에는 안내가 *최종* 값을 출력했으므로, `(0xFF + 1) | 0` 이면 "0 does not fit" 이라고 했을 것이다. 두 번째 예는 워드 안이 부호 없는 수(Unsigned)라는 것을 보여 준다: `-2` 는 254, `-3` 은 253 으로 저장되고, `254 * 253 = 64262` 다. 그 하위 8 비트는 6 — 맞는 답이다. 이것이 2의 보수(Two's complement)다: `+ - *` 결과의 하위 비트는 비트를 부호 있는 수로 읽든 없는 수로 읽든 같다.

### 확인한 것

```
> npm test
check-pairs : 51 pairs, 0 failed
check-names : 27 files, 0 problems

 RUN  v5.0.4 D:/mydata/blog/projects/DH.Study.TypeScript/projectroot

 Test Files  9 passed (9)
      Tests  41 passed (41)
```

```ts
test("precedence follows C / JavaScript", () => {
	expect(Grouped("1 + 2 * 3")).toBe("(1 + (2 * 3))");
	expect(Grouped("1 << 2 + 3")).toBe("(1 << (2 + 3))");
	expect(Grouped("1 | 2 ^ 3 & 4")).toBe("(1 | (2 ^ (3 & 4)))");
});
```

`ToText` 는 모든 이항 노드를 괄호로 감싸서 트리를 출력한다. 그래서 테스트가 트리의 **모양**을 문자열 하나로 확인할 수 있다.

- 04~09강에 나온 DevCalc 출력은 바뀌지 않았다. 바뀐 것은 전에 오류였던 것들이다: `1 + 2 + 3` 은 이제 6 이고, `3 ** 2` / `1 +` 는 새 메시지를 받는다.
- 웹 페이지도 수식 전체를 읽는다: 입력 칸의 `(0xFF + 1) << 4` 가 동작하며, `App.ts` 는 오버플로 안내 말고는 바뀌지 않았다.

해 볼 것:

- 단항 연산자 `~` (비트 NOT) 를 더하자: `"bitnot"` 노드 종류 (또는 연산자 필드를 둔 `"negate"` 재사용), `#Unary` 의 case, `Walk` 의 case. 빠뜨린 `switch` 는 TS 가 모두 보여 준다.
- `OPERATOR_TABLE` 에 우선순위 7 로 `**` 를 더하자. 렉서는 이미 그것을 토큰 하나로 읽는다. `2 ** 3 ** 2` = 512 가 되려면 무엇이 빠졌을까? (힌트: 6 절, `eAssoc`.)
- 결과 앞에 `ToText(oTree)` 를 출력하는 `--tree` 옵션을 더하자. DevCalc 가 수식을 어떻게 묶었는지 볼 수 있다.

---

## 정리

- 재귀 함수에는 언제나 도달하는 종료 조건과 입력을 더 작게 만드는 단계가 필요하다. 기다리는 호출마다 스택 공간을 쓴다: 통제하지 못하는 입력에는 깊이 제한을 두거나, 직접 만든 스택으로 반복문을 쓴다.
- **[TS]** 타입은 자기 자신을 참조할 수 있다. 재귀적인 판별 유니온이 구문 트리를 표현하고, `eKind` 에 대한 `switch` 가 그것을 순회한다 — 컴파일러가 모든 case 를 검사한다.
- 렉서는 텍스트를 토큰 (종류, 텍스트, 열 번호) 으로 바꾸고 언제나 `end` 토큰으로 끝낸다. 스캔 루프이나 sticky (`y`) 정규식이 현재 위치의 토큰 하나를 읽는다.
- 재귀 하강 파서는 문법 규칙 하나에 함수 하나를 둔다. 우선순위는 규칙의 순서에서, 왼쪽 결합은 반복문에서 나온다. 우선순위 클라이밍은 함수 하나와 표 하나로 같은 일을 한다.
- DevCalc Lv5: `Evaluate` = `Lex` → `Parse` → `Walk`. C 우선순위의 수식 전체, 열 번호가 있는 오류, 깊이 제한 — `Evaluate` 를 쓰는 모든 곳에서.

## 다음으로 갈 곳

이것이 1부의 마지막 강의다. DevCalc 에는 이제 렉서, 파서, 평가기, 명령줄, REPL, 웹 페이지, 테스트, CI 가 있다 — 모두 strict TypeScript 이고, 빌드 단계가 없다.

[11강](../11-regex-literal-types/README.ko.md) 부터 2부가 시작된다: 정규식과 리터럴 타입, 그리고 그것으로 `~`, `**`, `>>>` 와 개발자가 입력하는 리터럴 (`1Fh`, `1'000`, `4K`, `'A'`) 을 만든다 — 위 "해 볼 것" 의 처음 두 개를 제대로 한 것이다.

그 밖에 갈 수 있는 방향:

- 직접 **DevCalc 를 확장**하자: `--tree`, 그다음 변수 (`x = 0xFF; x << 4`) — 새 토큰 종류, 새 노드 종류, 그리고 `Map<string, bigint>` (13강에서 다룸).
- **실제 파서를 읽자**: TypeScript 컴파일러 자신의 `scanner.ts` 와 `parser.ts` 가 같은 생각 (스캔 루프, 재귀 하강, 표에서 오는 우선순위) 을 훨씬 큰 규모로 쓴다.
- **08강으로 돌아가** 트리를 다른 방식으로 타입 지정하자: `Extract<TNode, { eKind: "binary" }>` 는 노드 종류 하나를 준다. `TNode["eKind"]` 를 순회하는 매핑된 타입(Mapped type)은 노드 핸들러 표의 타입을 만들 수 있다.

---

[← 이전: 09. 테스트와 도구](../09-testing-tooling/README.ko.md) · [목차](../../README.ko.md) · [다음: 11. 정규식과 리터럴 타입 →](../11-regex-literal-types/README.ko.md)
