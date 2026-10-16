[English](README.md) · **한국어**

[← 이전: 15. 번들러와 빌드](../15-bundling-release/README.ko.md) · [목차](../../README.ko.md) · [다음: 17. 트리 그리기 →](../17-tree-view/README.ko.md)

# 16. 트리와 재귀 — 계산 과정을 한 단계씩 보기

> 시리즈: DH.Study.TypeScript · 16강 (3부)
> 환경: Node.js v24 · TypeScript 7 · Vitest 5 · VS Code · 브라우저

## 목표

이 강의를 마치면 다음을 할 수 있다.

- [ ] 파서(Parser)가 식으로 만드는 트리(Tree)를 그리고, 우선순위(Precedence)와 `( )` 가 그 모양을 어떻게 정하는지 설명한다
- [ ] 트리를 세 가지 방법 (전위(Pre-order), 중위(In-order), 후위(Post-order)) 으로 순회하고, 왜 후위 순회가 계산 순서인지 말한다
- [ ] 바뀌지 않는(Immutable) 트리를 펼침 복사(Spread copy)로 한 단계씩 다시 쓰고, 구조 공유(Structural sharing)를 설명한다
- [ ] `readonly` (컴파일 때의 약속) 와 `Object.freeze` (실행 때의 잠금) 를 구별한다
- [ ] 재귀 순회에 리스너(Listener) 함수를 넘기고, `Map` 의 키로 글자 대신 객체를 쓴다
- [ ] DevCalc 의 계산을 한 부분씩 보여준다: 명령줄의 `--steps`, 페이지의 Steps 패널

## 이 강의의 목차

1. [식은 트리다](#1-식은-트리다)
2. [트리를 순회하는 세 가지 방법](#2-트리를-순회하는-세-가지-방법)
3. [다시 쓰기로 단계 만들기](#3-다시-쓰기로-단계-만들기)
4. [듣기로 단계 만들기](#4-듣기로-단계-만들기)
5. [따라하기](#5-따라하기)
6. [DevCalc 스텝 — Lv11 계산 과정](#6-devcalc-스텝--lv11-계산-과정)
7. [정리](#정리)
8. [다음으로 갈 곳](#다음으로-갈-곳)

이 강의의 예제 파일: [tree.ko.ts](tree.ko.ts) · [rewrite.ko.ts](rewrite.ko.ts) · [listen.ko.ts](listen.ko.ts)

> 예제는 한국어 주석판(`x.ko.ts`)을 링크한다. 같은 코드의 영어 주석판은 `x.ts` 다.

> 문법 표시: **[JS]** = JavaScript 문법 (TS 없이도 있음) · **[TS]** = TypeScript 가 더한 타입 문법 (지우면 JS) · 자세한 구분은 [00강 7-3](../00-setup/README.ko.md#7-3-ts-문법--js-문법--타입-문법)

DevCalc 는 `10 + 30 * (100 + 2) / 10 + 20` 이 336 이라고 말하지만, 어떻게 거기에 닿았는지는 말하지 않는다. 학교에서는 이것을 가장 안쪽부터 계산해 점점 짧아지는 식의 줄로 배운다. 이 강의는 DevCalc 가 그 줄을 보여주게 만든다:

```
> node devcalc/src/main.ts "10 + 30 * (100 + 2) / 10 + 20" --steps
Steps : 5
  10 + 30 * (100 + 2) / 10 + 20   100 + 2 = 102
  10 + 30 * 102 / 10 + 20         30 * 102 = 3060
  10 + 3060 / 10 + 20             3060 / 10 = 306
  10 + 306 + 20                   10 + 306 = 316
  316 + 20                        316 + 20 = 336
  336
HEX : 0x150
DEC : 336
BIN : 0b1_0101_0000
```

어려운 부분은 10강의 파서가 이미 했다: 글자를 트리로 바꾸었다. 여기서 하는 일은 모두 그 트리를 읽는 것이다.

---

## 1. 식은 트리다

[tree.ko.ts](tree.ko.ts) 는 DevCalc 의 `Parse` 로 예제를 파싱하고 결과를 그린다:

```
1) 10 + 30 * (100 + 2) / 10 + 20
   +
   ├─ +
   │  ├─ 10
   │  └─ /
   │     ├─ *
   │     │  ├─ 30
   │     │  └─ +
   │     │     ├─ 100
   │     │     └─ 2
   │     └─ 10
   └─ 20
```

- 연산자는 모두 자식이 둘인 노드(Node)이고, 숫자는 모두 **잎(Leaf)** (자식이 없는 노드) 이다.
- 맨 위의 **뿌리(Root)** 는 마지막 `+` 다: 가장 나중에 계산되는 연산자.
- `( )` 는 사라졌다. 파싱하는 동안 할 일을 다 했다: `100 + 2` 를 트리 깊은 곳, `*` 아래에 넣었다. 이제는 모양이 괄호가 말하던 것을 말한다.
- `*` 와 `/` 는 더 세게 묶이므로 (우선순위) 둘러싼 `+` 보다 깊다. `30 * … / 10` 에서 `*` 가 `/` 아래에 있는 것은 둘의 우선순위가 같고 왼쪽부터 읽기 때문이다.

### 1-1. 그리기: 재귀 함수

```ts
function Draw(oNode: TNode, strIndent: string, bLast: boolean, bRoot: boolean): void {
	console.log(bRoot ? `   ${Label(oNode)}` : `   ${strIndent}${bLast ? "└─ " : "├─ "}${Label(oNode)}`);
	const arrChild = Children(oNode);
	const strNext = bRoot ? "" : strIndent + (bLast ? "   " : "│  ");
	arrChild.forEach((oChild, nIndex) => Draw(oChild, strNext, nIndex === arrChild.length - 1, false));
}
```

**[JS]** `Draw` 는 노드 하나를 출력하고, 자식마다 들여쓰기를 늘려 자기 자신을 부른다. 트리는 재귀적인 모양 (노드가 노드를 품는다) 이라서 재귀 함수가 잘 맞는다: 얼마나 깊은지 알 필요가 없다. **기저 사례(Base case)** (재귀가 멈추는 곳) 는 잎이다: `Children()` 이 `[]` 를 돌려주고 `forEach` 는 아무것도 하지 않는다.

### 1-2. 종류마다 이름표 하나: 잊을 수 없는 switch

```ts
function Label(oNode: TNode): string {
	switch (oNode.eKind) {
		case "number":
			return oNode.strText;
		…
		default: {
			const oNever: never = oNode; // 모든 종류를 위에서 다뤘으니 남은 것이 없다
			return oNever;
		}
	}
}
```

**[TS]** `TNode` 는 10강의 구별된 유니온(Discriminated union)이다 (개념은 03강). case 를 다 지나면 TypeScript 는 `oNode` 를 아무것도 없는 타입, `never` 로 좁힌다. 누군가 `TNode` 에 새 종류를 더하고 `Label` 을 잊으면, 실행 중의 조용한 `undefined` 대신 `never` 줄에 빨간 밑줄 (TS2322) 이 생긴다.

`oNode.strText` 는 이 강의에서 새로 생겼다: 숫자 노드가 입력된 그대로의 글자 (`0xFF`, `'A'`, `4K`) 를 가지고 있어서, 그림에서도 같은 모양으로 보여줄 수 있다.

---

## 2. 트리를 순회하는 세 가지 방법

```ts
function PreOrder(oNode: TNode): string[] {
	return [Label(oNode), ...Children(oNode).flatMap(PreOrder)]; // 노드, 그다음 자식들
}

function PostOrder(oNode: TNode): string[] {
	return [...Children(oNode).flatMap(PostOrder), Label(oNode)]; // 자식들, 그다음 노드
}
```

```
2) pre-order  : + + 10 / * 30 + 100 2 10 20
   in-order   : ((10 + ((30 * (100 + 2)) / 10)) + 20)
   post-order : 10 30 100 2 + * 10 / + 20 +
```

셋은 같은 노드를 방문한다. 다른 점은 **노드 자신을 언제 적느냐** 뿐이다: 자식보다 먼저 (전위), 자식 사이에 (중위), 자식 다음에 (후위).

- **중위(In-order)** 는 사람이 쓰는 방식이다: `왼쪽 연산자 오른쪽`. 연산자마다 `( )` 를 두르면 식이 다시 나온다. 10강 DevCalc 의 `ToText` 가 중위 순회다.
- **후위(Post-order)** 는 계산 순서다. `+` 는 양쪽이 모두 숫자가 된 다음에야 계산할 수 있으니 자식들 뒤에 와야 한다. 10강의 `Evaluate` 도 이렇게 동작한다: 두 자식에 대해 먼저 자기 자신을 부르고, 그다음 연산자를 적용한다.
- **[JS]** `flatMap` 은 자식마다 목록을 만들고 그 목록들을 이어 붙인다. `[...a, x]` 와 `[x, ...a]` 가 후위와 전위의 차이 전부다.

### 2-1. 후위 목록을 스택(Stack)으로 읽기

후위 목록은 트리 없이도 계산할 수 있다: 숫자는 스택에 올리고, 연산자는 둘을 꺼내 결과를 다시 올린다.

```
3)  100 + 2    = 102   stack : [10, 30, 102]
3)   30 * 102  = 3060  stack : [10, 3060]
3) 3060 / 10   = 306   stack : [10, 306]
3)   10 + 306  = 316   stack : [316]
3)  316 + 20   = 336   stack : [336]
   result : 336
```

이 강의 맨 위의 다섯 단계와 같은 순서다. 옛 HP 계산기가 이렇게 동작했고 (RPN: `10 30 100 2 + * …` 처럼 입력했다), 많은 가상 머신(Virtual machine)도 그렇다. 그러니 "단계를 보여준다" 는 것은 **후위 순서의 계산을 보여준다** 는 뜻이다.

---

## 3. 다시 쓰기로 단계 만들기

첫 번째 생각: 한 부분을 계산해 더 작은 새 트리를 얻고, 출력하고, 숫자 하나만 남을 때까지 되풀이한다. [rewrite.ko.ts](rewrite.ko.ts) 는 이것을 해 보려고 작은 트리 타입을 따로 만든다.

### 3-1. 끝까지 readonly

```ts
type TOp = "+" | "-" | "*" | "/";
type TExpr = { readonly eKind: "num"; readonly biValue: bigint } | { readonly eKind: "bin"; readonly strOp: TOp; readonly oLeft: TExpr; readonly oRight: TExpr };

const FIRST = Bin(Bin(Num(10n), "+", Bin(Bin(Num(30n), "*", Bin(Num(100n), "+", Num(2n))), "/", Num(10n))), "+", Num(20n));
// FIRST.eKind = "num"; // ← 주석 해제 → 빨간 밑줄 TS2540 (Cannot assign to 'eKind' because it is a read-only property : 읽기 전용 속성)
```

**[TS]** `TExpr` 는 자기 자신을 가리킨다: 재귀 타입(Recursive type) (10강). 모든 속성이 `readonly` 이므로 어떤 단계도 실수로 트리를 바꿀 수 없다: 단계마다 새 트리를 만들어야 한다.

### 3-2. 한 단계: 길은 복사하고 나머지는 공유한다

```ts
function ReduceOnce(oExpr: TExpr): TExpr {
	if (oExpr.eKind === "num") {
		return oExpr; // 더 할 일이 없다
	}
	const { oLeft, oRight } = oExpr;
	if (oLeft.eKind === "num" && oRight.eKind === "num") {
		return Num(Apply(oLeft.biValue, oExpr.strOp, oRight.biValue)); // 기저 사례(base case) : 계산 한 번
	}
	if (oLeft.eKind === "bin") {
		return { ...oExpr, oLeft: ReduceOnce(oLeft) };
	}
	return { ...oExpr, oRight: ReduceOnce(oRight) };
}
```

`ReduceOnce` 는 두 자식이 모두 숫자인 첫 노드까지 (왼쪽 먼저) 내려가서 그 노드를 값으로 바꾼다. **[JS]** `{ ...oExpr, oLeft: … }` 는 속성 하나만 바꿔 노드를 복사한다. 내려가는 길의 노드만 복사되고, 새 트리의 나머지는 옛 트리와 **같은 객체** 다 (**구조 공유(Structural sharing)**):

```
1) 10 + 30 * (100 + 2) / 10 + 20
   10 + 30 * 102 / 10 + 20
   10 + 3060 / 10 + 20
   10 + 306 + 20
   316 + 20
   336
2) FIRST after all the steps : 10 + 30 * (100 + 2) / 10 + 20
   right part (20) is the same object : true
   left part is the same object       : false
```

모든 단계가 끝나도 첫 트리는 그대로다. 첫 단계는 왼쪽 부분 안의 무언가를 바꿨으니 왼쪽 부분은 새 객체다. 오른쪽의 `20` 은 길 위에 없었으므로 두 트리가 같은 `20` 을 가리킨다.

### 3-3. 가장 적은 괄호

트리에는 `( )` 가 없으므로 `Show()` 는 의미 있는 것만 되살려야 한다: 자식이 부모보다 느슨하게 묶일 때, 또는 오른쪽에서 같은 세기로 묶일 때 괄호가 필요하다 (`8 - (4 - 2)` 는 `8 - 4 - 2` 가 아니다):

```ts
const strLeft = oExpr.oLeft.eKind === "bin" && PRECEDENCE[oExpr.oLeft.strOp] < nMine ? `(${Show(oExpr.oLeft)})` : Show(oExpr.oLeft);
const strRight = oExpr.oRight.eKind === "bin" && PRECEDENCE[oExpr.oRight.strOp] <= nMine ? `(${Show(oExpr.oRight)})` : Show(oExpr.oRight);
```

그래서 첫 줄의 `(100 + 2)` 는 괄호를 유지하고, 계산되어 사라진 뒤에는 괄호도 없다.

### 3-4. readonly 는 약속, Object.freeze 는 잠금

```
3) readonly, written through as : 2
   Expected error: TypeError: Cannot assign to read only property 'biValue' of object '#<Object>'
   Why : Object.freeze made the property read-only at run time, not just in the types.
   Fix : build a new object instead ({ ...oFrozen, biValue: 2n }) : the way ReduceOnce works.
```

(예상된 오류: 읽기 전용 속성 'biValue' 에 대입할 수 없다 / 이유: Object.freeze 가 타입에서만이 아니라 실행 때 속성을 읽기 전용으로 만들었다 / 고치기: 대신 새 객체를 만든다 — ReduceOnce 가 하는 방식)

**[TS]** `readonly` 는 타입에만 있다. `(oLoose as { biValue: bigint }).biValue = 2n` 은 컴파일되고 (`as` 는 TypeScript 에게 눈감으라고 하는 것, 12강), 객체는 정말로 바뀐다. **[JS]** `Object.freeze()` 는 실행 때 객체를 잠근다: 모듈 (언제나 엄격 모드(Strict mode)) 에서는 쓰기가 예외를 던진다. `readonly` 는 입력하는 동안 실수를 잡고, `freeze` 는 프로그램이 도는 동안 약간의 비용으로 잡는다. 둘 다 한 단계 깊이까지만이다: 뿌리를 `freeze` 해도 자식은 얼지 않는다.

### 3-5. DevCalc 가 이 방법을 쓰지 않는 이유

다시 쓰기는 `+ - * /` 에는 잘 된다. DevCalc 에서는 두 번째 계산기가 된다: 워드 크기와 감싸기(Wrap), 부호 없는 결과, `**` 와 그 오류, 함수, 변수, `ans`, 대입. 모든 규칙을 두 번 써야 하고, 언젠가 단계와 답이 서로 다르게 될 수 있다. 다음 절은 이것을 피한다.

---

## 4. 듣기로 단계 만들기

DevCalc 의 `Evaluate` 는 이미 모든 노드를 후위 순서로 방문하며 계산한다. 다시 계산하는 대신, 계산할 때마다 **알려 달라** 고 하자.

### 4-1. 리스너는 함수 타입이다

```ts
// devcalc/src/core/Evaluate.ts
export type TStepListener = (oNode: TNode, oResult: ICalcResult) => void;
```

`EvaluateTree(strExpr, oTree, oWord, biAns, mapVar, fnStep)` 은 이미 파싱된 트리를 위한 `Evaluate` 이고, 선택 인자가 하나 더 있다. 순회 안의 모든 case 는 `Heard(oNode, oResult, oContext)` 로 끝나는데, 이 함수는 `oContext.fnStep?.(oNode, oResult)` 를 부르고 결과를 그대로 돌려준다. **[JS]** `?.()` 는 함수가 있을 때만 부르므로, 리스너 없는 `Evaluate` 는 전과 똑같이 동작한다.

[listen.ko.ts](listen.ko.ts) 는 들은 것을 출력하는 리스너를 넘긴다:

```ts
const fnPrint: TStepListener = (oNode, oResult) => {
	console.log(`   heard ${ToText(oNode).padEnd(15)} = ${oResult.biValue}`);
};
EvaluateTree("1 + 2 * 3", oTree, undefined, undefined, undefined, fnPrint);
```

```
1) 1 + 2 * 3
   heard 1               = 1
   heard 2               = 2
   heard 3               = 3
   heard (2 * 3)         = 6
   heard (1 + (2 * 3))   = 7
```

2절에서 말한 대로 후위 순서, 자식이 먼저다. **[TS]** `fnPrint` 에 `TStepListener` 타입을 붙였으므로, `oNode` 와 `oResult` 는 적지 않아도 타입을 얻는다 (문맥적 타이핑(Contextual typing), 02강).

`addEventListener` 콜백 (07강) 과 같은 생각이다: 무언가가 *언제* 일어나는지 아는 코드가, 그것으로 *무엇을 할지* 아는 코드를 부른다. 계산기는 단계를 모르고, 단계는 계산하는 법을 모른다.

### 4-2. 객체를 키로 쓰는 Map

단계를 그리려면 DevCalc 는 어느 부분이 이미 끝났는지 기억해야 한다. 쉬운 키는 그 부분의 글자인데, 틀렸다:

```
2) left  (1 + 1) done?  by node : true  by text : true
   right (1 + 1) done?  by node : false by text : true ← wrong : it was not calculated yet
```

`(1 + 1) * (1 + 1)` 에는 `1 + 1` 노드가 둘 있다. 왼쪽을 계산한 뒤 `Map<string, bigint>` 는 글자가 같으니 오른쪽도 끝났다고 말한다 (← 틀림: 아직 계산하지 않았다). **[JS]** `Map` 은 객체를 포함해 **어떤 값이든 키로** 쓸 수 있고, 객체 키는 동일성(Identity, `===`) 으로 비교한다: 같아 보이는 객체가 아니라 같은 객체. `Map<TNode, bigint>` 는 둘을 구별한다. 보통 객체 `{}` 는 이것을 못 한다: 키가 문자열이 된다 (13강).

### 4-3. Explain: 듣고, 트리 전체를 그린다

`devcalc/src/core/Steps.ts` 가 이것을 모은다:

```ts
// Keyed by the node object itself : two "1 + 1" in one tree are two different keys
const mapValue = new Map<TNode, bigint>(); // every part calculated so far
const mapDone = new Map<TNode, bigint>(); // only the steps : a number as typed keeps its text (0xFF, 'A')
const arrStep: IStep[] = [];
const oResult = EvaluateTree(strTrim, oRoot, oWord, biAns, mapVar, (oNode, oCalc) => {
	mapValue.set(oNode, oCalc.biValue);
	const strNote = NoteFor(oNode, oCalc, mapValue, oWord);
	if (!IsStep(oNode, strNote)) {
		return;
	}
	const { strText, nStart, nEnd } = Draw(oRoot, mapDone, oNode);
	arrStep.push({ strExpr: strText, nStart, nEnd, strWork: WorkFor(oNode, oCalc.biValue, mapDone), strNote });
	mapDone.set(oNode, oCalc.biValue);
});
```

- 한 부분이 계산될 때마다 `Draw` 가 **트리 전체** 를 한 번 그린다. `mapDone` 에 있는 부분은 숫자로 그린다. 이것이 그 단계의 줄이다. 그다음 그 부분을 `mapDone` 에 넣으므로, 다음 줄은 그 값을 보여준다.
- `Draw` 는 그 부분이 줄의 어디에 있는지 (`nStart`, `nEnd`) 도 돌려주므로, 페이지가 강조할 수 있다.
- 입력된 그대로의 숫자 (`0xFF`) 는 단계가 아니고 `-5` 도 아니다. 단, 워드 크기가 값을 바꿨으면 단계다 (8 비트에서 300 은 44).
- 트리는 절대 바뀌지 않고, 답은 `Evaluate` 가 주는 답 그대로다: 단계가 답과 다를 수 없다.

[listen.ko.ts](listen.ko.ts) 의 다른 예들. `( )` 는 우선순위와 결합 방향(Associativity)에 따라 놓이고 (`**` 는 오른쪽 결합), 값이 의외일 수 있는 곳에는 메모가 붙는다:

```
   2 ** 3 ** 2 : right-associative, so the right part first
   2 ** 3 ** 2   3 ** 2 = 9
   2 ** 9        2 ** 9 = 512
   512
   (0xF0 >>> 4) * 20 + 7 / 2 in 8 bits : notes for a wrap and a dropped remainder
   (0xF0 >>> 4) * 20 + 7 / 2   0xF0 >>> 4 = 15
   15 * 20 + 7 / 2             15 * 20 = 44   (300 does not fit in 8 bits, wrapped to 44)
   44 + 7 / 2                  7 / 2 = 3   (integer division : remainder 1 dropped)
   44 + 3                      44 + 3 = 47
   47
   1 / (2 - 2) : no steps, the same error Evaluate gives
   Cannot calculate: "1 / (2 - 2)" : division by zero
```

(메모: 300 은 8 비트에 맞지 않아 44 로 감싸짐 / 정수 나눗셈: 나머지 1 버림 / 0 으로 나누기는 단계 없이 Evaluate 와 같은 오류)

---

## 5. 따라하기

세 예제를 실행한다:

```
> node lessons/16-trees-steps/tree.ko.ts
1) 10 + 30 * (100 + 2) / 10 + 20
   +
   ├─ +
   │  ├─ 10
   │  └─ /
   │     ├─ *
   │     │  ├─ 30
   │     │  └─ +
   │     │     ├─ 100
   │     │     └─ 2
   │     └─ 10
   └─ 20
2) pre-order  : + + 10 / * 30 + 100 2 10 20
   in-order   : ((10 + ((30 * (100 + 2)) / 10)) + 20)
   post-order : 10 30 100 2 + * 10 / + 20 +
3)  100 + 2    = 102   stack : [10, 30, 102]
3)   30 * 102  = 3060  stack : [10, 3060]
3) 3060 / 10   = 306   stack : [10, 306]
3)   10 + 306  = 316   stack : [316]
3)  316 + 20   = 336   stack : [336]
   result : 336
```

```
> node lessons/16-trees-steps/rewrite.ko.ts
1) 10 + 30 * (100 + 2) / 10 + 20
   10 + 30 * 102 / 10 + 20
   10 + 3060 / 10 + 20
   10 + 306 + 20
   316 + 20
   336
2) FIRST after all the steps : 10 + 30 * (100 + 2) / 10 + 20
   right part (20) is the same object : true
   left part is the same object       : false
3) readonly, written through as : 2
   Expected error: TypeError: Cannot assign to read only property 'biValue' of object '#<Object>'
   Why : Object.freeze made the property read-only at run time, not just in the types.
   Fix : build a new object instead ({ ...oFrozen, biValue: 2n }) : the way ReduceOnce works.
```

```
> node lessons/16-trees-steps/listen.ko.ts
1) 1 + 2 * 3
   heard 1               = 1
   heard 2               = 2
   heard 3               = 3
   heard (2 * 3)         = 6
   heard (1 + (2 * 3))   = 7
2) left  (1 + 1) done?  by node : true  by text : true
   right (1 + 1) done?  by node : false by text : true ← wrong : it was not calculated yet
3) 10 + 30 * (100 + 2) / 10 + 20
   10 + 30 * (100 + 2) / 10 + 20   100 + 2 = 102
   10 + 30 * 102 / 10 + 20         30 * 102 = 3060
   10 + 3060 / 10 + 20             3060 / 10 = 306
   10 + 306 + 20                   10 + 306 = 316
   316 + 20                        316 + 20 = 336
   336
   2 ** 3 ** 2 : right-associative, so the right part first
   2 ** 3 ** 2   3 ** 2 = 9
   2 ** 9        2 ** 9 = 512
   512
   (0xF0 >>> 4) * 20 + 7 / 2 in 8 bits : notes for a wrap and a dropped remainder
   (0xF0 >>> 4) * 20 + 7 / 2   0xF0 >>> 4 = 15
   15 * 20 + 7 / 2             15 * 20 = 44   (300 does not fit in 8 bits, wrapped to 44)
   44 + 7 / 2                  7 / 2 = 3   (integer division : remainder 1 dropped)
   44 + 3                      44 + 3 = 47
   47
   1 / (2 - 2) : no steps, the same error Evaluate gives
   Cannot calculate: "1 / (2 - 2)" : division by zero
```

해 볼 것:

- tree.ko.ts 에서 `EXPR` 를 `(10 + 30) * 2` 로 바꾼다 → `+` 가 `*` 아래로 내려가고, 후위 목록이 `*` 로 끝난다.
- `devcalc/src/core/Parser.ts` 의 `TNode` 에 `| { readonly eKind: "test" }` 를 더한다 → tree.ko.ts 의 `Label` 에서 `never` 줄에 빨간 밑줄이 생긴다 (확인한 뒤 다시 지운다).
- rewrite.ko.ts 에서 `FIRST.eKind = "num";` 의 주석을 해제한다 → TS2540.
- rewrite.ko.ts 에서 `FIRST` 를 `Bin(Num(8n), "-", Bin(Num(4n), "-", Num(2n)))` 로 바꾼다 → `8 - (4 - 2)`, `8 - 2`, `6`. 그다음 `strRight` 의 `<=` 를 `<` 로 바꾼다 → 첫 줄이 `8 - 4 - 2` 가 된다: 답이 다른 (2) 다른 식이다.
- listen.ko.ts 에 `PrintSteps("(1 + 1) * (1 + 1)");` 를 더한다 → `1 + 1 = 2` 단계가 따로 두 번, 왼쪽이 먼저 나온다: 노드를 키로 쓰는 Map 이 둘을 구별한다.

---

## 6. DevCalc 스텝 — Lv11 계산 과정

### 바뀐 것

| 파일 | 변경 |
|---|---|
| `devcalc/src/core/Parser.ts` | 숫자 노드가 입력된 그대로의 글자 `strText` 를 가진다 |
| `devcalc/src/core/Evaluate.ts` | `TStepListener`, `EvaluateTree()` (파싱된 트리, 선택 리스너), 순회의 모든 case 에 `Heard()`. `Evaluate()` = `Parse` + `EvaluateTree` |
| `devcalc/src/core/Steps.ts` | 새 파일: `Explain()` → `IExplanation` (`arrStep`, `strLast`, `oEval`); `IStep` (`strExpr`, `nStart`/`nEnd`, `strWork`, `strNote`); 가장 적은 `( )`, 버린 나머지와 감싸기 메모 |
| `devcalc/src/core/index.ts` | `EvaluateTree`, `TStepListener`, `Explain`, `IExplanation`, `IStep` 내보내기 |
| `devcalc/src/main.ts` | `--steps` |
| `devcalc/web/index.html` | Steps 패널 (`<ol>` 이 든 `<details id="steps-box">`), 제목 `Lv11` |
| `devcalc/web/App.ts` | `ShowSteps()`: 단계마다 한 줄, 다음에 계산할 부분은 `<mark>` 안에 |
| `devcalc/web/style.css` | `--mark` 색 (라이트와 다크), `.steps` |
| `devcalc/tests/Steps.test.ts` | 새 파일: 테스트 9 개 |

계산 규칙은 바뀌지 않았다: `Explain` 과 `Evaluate` 는 같은 순회를 돈다.

### 페이지

```ts
// devcalc/web/App.ts
const elMark = document.createElement("mark");
elMark.textContent = strExpr.slice(nStart, nEnd);
const elCode = document.createElement("code");
elCode.append(strExpr.slice(0, nStart), elMark, strExpr.slice(nEnd));
```

식은 사용자 입력이므로 줄은 텍스트 노드 (문자열로 `append`, `textContent`) 로만 만들고, `innerHTML` 은 쓰지 않는다 (07강). `<mark>` 는 "참고용으로 강조한" 이라는 뜻의 HTML 요소다: 화면 낭독기(Screen reader)가 알려줄 수 있고, 두 테마 모두에서 `--mark` 색을 받는다.

예제에 대한 패널의 처음 두 줄 (`[ ]` 는 강조 표시를 나타낸다):

```
10 + 30 * [(100 + 2)] / 10 + 20     100 + 2 = 102
10 + [30 * 102] / 10 + 20           30 * 102 = 3060
```

마지막 줄은 굵은 `336` 이다. `--bits=8` (또는 페이지에서 8 비트를 고르면) 메모가 계산 뒤 괄호 안에 나온다.

### 테스트

`devcalc/tests/Steps.test.ts` 가 확인하는 것: 예제의 줄, 계산, 강조할 부분; `1 + 2 * 3`, `2 ** 3 ** 2`, `8 - 4 - 2`, `(0xFF + 1) << 4`, `~0x0F & 0xFF`, `max(3, 1 + 1) * -2` 에서 `Evaluate` 와 같은 값; 트리에 필요한 `( )` 만 (`(2 - 5) ** 2` → `(-3) ** 2`, `-3 ** 2` 는 오류이므로); 입력된 그대로의 리터럴; 이름, 함수, 대입 (`x → 21`, `y = 84`); 메모; `Evaluate` 와 같은 오류; 그리고 리스너가 트리를 바꾸지 않고 후위 순서로 노드를 듣는지.

```
> npm test
check-pairs : 73 pairs, 0 failed
check-names : 38 files, 0 problems

 Test Files  13 passed (13)
      Tests  88 passed (88)
```

### 확인

페이지를 로컬 서버로 헤드리스(Headless) 브라우저에서 열었다: 제목은 `DevCalc Lv11 · web`, 예제는 올바른 부분이 강조된 5 단계, 8 비트에서는 감싸기 메모, `<b>1</b>` 은 오류를 보여주고 패널을 비우며 `<b>` 요소를 만들지 않는다. `npm run build:single` 로 만든 `DevCalc.html` 에도 패널이 들어간다.

해 볼 것:

- `node devcalc/src/main.ts "x = 3; y = x * x + 1" --steps` → `x = 3` 은 단계가 없고 (3 은 입력된 그대로), 두 번째 식은 4 단계: `x → 3` 두 번, `3 * 3 = 9`, `9 + 1 = 10`, 그리고 `y = 10`.
- `node devcalc/src/main.ts "-0x80 / 3" --bits=8 --steps` → `-0x80 = 128   (-128 as 8-bit unsigned)`, 그다음 `128 / 3 = 42   (integer division : remainder 2 dropped)`. DevCalc 의 워드는 부호가 없으므로 (12강) 답은 -42 가 아니라 42 다.
- 페이지에서 `popcount(0xF0) << 2` 를 입력하고 Enter → 함수 호출이 한 단계, 그다음 시프트.

---

## 정리

- **[JS]** 식은 트리다: 연산자는 노드, 숫자는 잎. 우선순위와 `( )` 는 파싱하는 동안 모양을 정하고, 그 뒤에는 `( )` 가 사라진다.
- **[JS]** 재귀적인 모양에는 재귀 함수가 맞는다. 전위, 중위, 후위는 노드를 언제 적느냐만 다르다. **후위 순서가 계산 순서** 이고, 스택 하나면 계산할 수 있다.
- **[TS]** switch 끝의 `never` 줄은 새 종류를 잊는 것을 컴파일 오류로 만든다. 모든 곳이 `readonly` 인 재귀 타입은 모든 변경이 새 트리를 만들게 한다.
- **[JS]** `{ ...oExpr, oLeft: … }` 는 길을 복사하고 나머지를 공유한다 (구조 공유). `readonly` 는 컴파일러만 검사하고, `Object.freeze` 는 실행 때 한 단계 깊이로 예외를 던진다.
- **[JS]** 리스너 (넘겨받은 함수) 덕분에 계산기는 단계를 몰라도 부분마다 알려줄 수 있다. 객체를 키로 쓰는 `Map` 은 동일성으로 비교한다: 같아 보이는 두 부분도 키 두 개로 남는다.
- DevCalc Lv11: `Explain()` → `--steps` 와 Steps 패널, 다음 부분 강조, 언제나 `Evaluate` 와 같은 답.

## 다음으로 갈 곳

이 강의에서 만든 것 위에 올릴 아이디어:

- **트리 보기**: 페이지에 `Children()` 을 중첩 상자나 SVG 트리로 그리고, 현재 단계의 노드를 강조한다. → [17강](../17-tree-view/README.ko.md)
- **한 단계씩 넘기기**: 한 번에 한 단계만 보여주는 ◀ ▶ 버튼, 14강의 키보드 패턴과 함께.
- **부동소수점 비트**: DevCalc 는 정수로 계산한다. IEEE 754 강의 (`0.1 + 0.2`, 부호·지수·가수 비트, `DataView` 와 `Float64Array`) 로 왜 `0.1 + 0.2 !== 0.3` 인지 볼 수 있다.

---

[← 이전: 15. 번들러와 빌드](../15-bundling-release/README.ko.md) · [목차](../../README.ko.md) · [다음: 17. 트리 그리기 →](../17-tree-view/README.ko.md)
