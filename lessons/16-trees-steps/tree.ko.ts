//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 16-trees-steps / tree (식 트리 그리기와 순회 순서)
//	History			: 2026-10-16 CYBERKDH Initial (최초 작성)
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// 식은 트리다. 우선순위와 ( ) 가 모양을 정하고, 모양이 계산 순서를 정한다
import { Parse, type TNode } from "../../devcalc/src/core/index.ts";

const EXPR = "10 + 30 * (100 + 2) / 10 + 20";

const oParsed = Parse(EXPR);
if (!oParsed.bOk) {
	throw new Error(oParsed.vError.strWhy); // EXPR 은 고정된 올바른 식 : 여기에 오지 않는다
}
const oTree = oParsed.vValue;

// [TS] 노드 종류마다 이름표 하나. switch 가 모든 eKind 를 다룬다 : TNode 에 종류를 추가하면
// 이 함수가 그 종류를 다룰 때까지 아래 "never" 줄이 컴파일 오류가 된다
function Label(oNode: TNode): string {
	switch (oNode.eKind) {
		case "number":
			return oNode.strText;
		case "ans":
			return oNode.strText;
		case "variable":
			return oNode.strName;
		case "call":
			return `${oNode.eFunction}()`;
		case "assign":
			return `${oNode.strName} =`;
		case "unary":
		case "binary":
			return oNode.strOp;
		default: {
			const oNever: never = oNode; // 모든 종류를 위에서 다뤘으니 남은 것이 없다
			return oNever;
		}
	}
}

// 노드의 자식들, 왼쪽부터. 잎(leaf)은 자식이 없다
function Children(oNode: TNode): readonly TNode[] {
	switch (oNode.eKind) {
		case "call":
			return oNode.arrArg;
		case "assign":
			return [oNode.oValue];
		case "unary":
			return [oNode.oOperand];
		case "binary":
			return [oNode.oLeft, oNode.oRight];
		default:
			return [];
	}
}

// 1) [JS] 트리 그리기 : 재귀 함수, 호출 한 번마다 들여쓰기가 한 단계 깊어진다
function Draw(oNode: TNode, strIndent: string, bLast: boolean, bRoot: boolean): void {
	console.log(bRoot ? `   ${Label(oNode)}` : `   ${strIndent}${bLast ? "└─ " : "├─ "}${Label(oNode)}`);
	const arrChild = Children(oNode);
	const strNext = bRoot ? "" : strIndent + (bLast ? "   " : "│  ");
	arrChild.forEach((oChild, nIndex) => Draw(oChild, strNext, nIndex === arrChild.length - 1, false));
}
console.log(`1) ${EXPR}`);
Draw(oTree, "", true, true);

// 2) [JS] 모든 노드를 방문하는 세 가지 방법. 노드 자신을 "언제" 적느냐만 다르다
function PreOrder(oNode: TNode): string[] {
	return [Label(oNode), ...Children(oNode).flatMap(PreOrder)]; // 노드, 그다음 자식들
}

function PostOrder(oNode: TNode): string[] {
	return [...Children(oNode).flatMap(PostOrder), Label(oNode)]; // 자식들, 그다음 노드
}

function InOrder(oNode: TNode): string {
	if (oNode.eKind !== "binary") {
		return Label(oNode);
	}
	return `(${InOrder(oNode.oLeft)} ${oNode.strOp} ${InOrder(oNode.oRight)})`; // 왼쪽, 노드, 오른쪽
}
console.log("2) pre-order  :", PreOrder(oTree).join(" "));
console.log("   in-order   :", InOrder(oTree));
console.log("   post-order :", PostOrder(oTree).join(" "));

// 3) [JS] 후위 순서가 곧 계산 순서다 : 노드는 자식들이 계산된 뒤에야 계산할 수 있다.
// 후위 목록을 스택으로 읽는다 : 숫자는 쌓고, 연산자는 두 개를 꺼내 하나를 다시 쌓는다
const OPERATORS: Readonly<Record<string, (biA: bigint, biB: bigint) => bigint>> = {
	"+": (biA, biB) => biA + biB,
	"-": (biA, biB) => biA - biB,
	"*": (biA, biB) => biA * biB,
	"/": (biA, biB) => biA / biB,
};

const arrStack: bigint[] = [];
for (const strItem of PostOrder(oTree)) {
	const fnApply = OPERATORS[strItem];
	if (fnApply === undefined) {
		arrStack.push(BigInt(strItem));
		continue;
	}
	const biRight = arrStack.pop() ?? 0n; // 오른쪽 값이 마지막에 쌓였다
	const biLeft = arrStack.pop() ?? 0n;
	arrStack.push(fnApply(biLeft, biRight));
	console.log(`3) ${String(biLeft).padStart(4)} ${strItem} ${String(biRight).padEnd(4)} = ${String(arrStack.at(-1)).padEnd(5)} stack : [${arrStack.join(", ")}]`);
}
console.log("   result :", arrStack.join(", "));
