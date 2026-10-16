//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 16-trees-steps / tree
//	History			: 2026-10-16 CYBERKDH Initial
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// An expression is a tree. Precedence and ( ) decide its shape, and the shape decides the order of the work
import { Parse, type TNode } from "../../devcalc/src/core/index.ts";

const EXPR = "10 + 30 * (100 + 2) / 10 + 20";

const oParsed = Parse(EXPR);
if (!oParsed.bOk) {
	throw new Error(oParsed.vError.strWhy); // EXPR is fixed and valid : this does not happen
}
const oTree = oParsed.vValue;

// [TS] One label per kind of node. The switch covers every eKind : add a kind to TNode and
// the "never" line below becomes a compile error until this function handles it
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
			const oNever: never = oNode; // every kind was handled above, so nothing is left
			return oNever;
		}
	}
}

// The children of a node, left to right. A leaf has none
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

// 1) [JS] Draw the tree : a recursive function, the indent grows one level per call
function Draw(oNode: TNode, strIndent: string, bLast: boolean, bRoot: boolean): void {
	console.log(bRoot ? `   ${Label(oNode)}` : `   ${strIndent}${bLast ? "└─ " : "├─ "}${Label(oNode)}`);
	const arrChild = Children(oNode);
	const strNext = bRoot ? "" : strIndent + (bLast ? "   " : "│  ");
	arrChild.forEach((oChild, nIndex) => Draw(oChild, strNext, nIndex === arrChild.length - 1, false));
}
console.log(`1) ${EXPR}`);
Draw(oTree, "", true, true);

// 2) [JS] Three ways to visit every node. They differ only in WHEN the node itself is written down
function PreOrder(oNode: TNode): string[] {
	return [Label(oNode), ...Children(oNode).flatMap(PreOrder)]; // the node, then its children
}

function PostOrder(oNode: TNode): string[] {
	return [...Children(oNode).flatMap(PostOrder), Label(oNode)]; // the children, then the node
}

function InOrder(oNode: TNode): string {
	if (oNode.eKind !== "binary") {
		return Label(oNode);
	}
	return `(${InOrder(oNode.oLeft)} ${oNode.strOp} ${InOrder(oNode.oRight)})`; // left, the node, right
}
console.log("2) pre-order  :", PreOrder(oTree).join(" "));
console.log("   in-order   :", InOrder(oTree));
console.log("   post-order :", PostOrder(oTree).join(" "));

// 3) [JS] Post-order is the order of the work : a node can only be calculated after its children.
// Read the post-order list with a stack : a number goes on, an operator takes two off and puts one back
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
	const biRight = arrStack.pop() ?? 0n; // the right one was pushed last
	const biLeft = arrStack.pop() ?? 0n;
	arrStack.push(fnApply(biLeft, biRight));
	console.log(`3) ${String(biLeft).padStart(4)} ${strItem} ${String(biRight).padEnd(4)} = ${String(arrStack.at(-1)).padEnd(5)} stack : [${arrStack.join(", ")}]`);
}
console.log("   result :", arrStack.join(", "));
