//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 17-tree-view / layout
//	History			: 2026-10-16 CYBERKDH Initial
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// Where does each box of a tree go? Leaves take the next free slot, a parent sits in the middle
// of its children. The same rule as DevCalc's LayoutTree, written out here to watch it work
import { Parse, LayoutTree, NodeChildren, NodeLabel, type TNode } from "../../devcalc/src/core/index.ts";

// [TS] A box : coordinates in slots (x) and levels (y), not pixels. The drawer picks the size
interface IBox {
	readonly strLabel: string;
	readonly nX: number;
	readonly nY: number;
	readonly arrChild: readonly number[]; // indexes into the box list
}

function TreeOf(strExpr: string): TNode {
	const oParsed = Parse(strExpr);
	if (!oParsed.bOk) {
		throw new Error(oParsed.vError.strWhy); // the expressions below are fixed and valid
	}
	return oParsed.vValue;
}

// [JS] One recursive walk, children first (post-order, lesson 16). nNextLeaf is shared by every
// call of Place : a closure (lesson 13), so the leaves get 0, 1, 2, … from left to right
function Layout(oRoot: TNode): IBox[] {
	const arrBox: IBox[] = [];
	let nNextLeaf = 0;
	function Place(oNode: TNode, nY: number): number {
		const arrChild = NodeChildren(oNode).map((oChild) => Place(oChild, nY + 1));
		let nX = nNextLeaf;
		if (arrChild.length === 0) {
			nNextLeaf += 1; // a leaf : the next free slot
		} else {
			const arrChildX = arrChild.map((nChild) => arrBox[nChild]?.nX ?? 0);
			nX = (Math.min(...arrChildX) + Math.max(...arrChildX)) / 2; // a parent : the middle of its children
		}
		arrBox.push({ strLabel: NodeLabel(oNode), nX, nY, arrChild });
		return arrBox.length - 1;
	}
	Place(oRoot, 0);
	return arrBox;
}

// 1) The boxes of a small tree, in the order they were placed
const SMALL = "1 + 2 * 3";
const arrSmall = Layout(TreeOf(SMALL));
console.log(`1) ${SMALL}`);
console.log("   #  label  x     y  children");
arrSmall.forEach((oBox, nIndex) => {
	console.log(`   ${nIndex}  ${oBox.strLabel.padEnd(5)}  ${String(oBox.nX).padEnd(4)}  ${oBox.nY}  [${oBox.arrChild.join(", ")}]`);
});

// 2) [JS] Coordinates → a picture. One slot = COL characters, one level = 2 lines (a line for the
//    boxes, a line for the edges). Any drawer works the same way : SVG only uses pixels instead
const COL = 6;
function Picture(arrBox: readonly IBox[]): string[] {
	const nWidth = Math.max(...arrBox.map((oBox) => oBox.nX)) + 1;
	const nHeight = Math.max(...arrBox.map((oBox) => oBox.nY)) + 1;
	const arrRow = Array.from({ length: nHeight * 2 - 1 }, () => [..." ".repeat(nWidth * COL)]);
	const Column = (nX: number): number => Math.round(nX * COL + COL / 2);
	const Put = (nRow: number, nColumn: number, strText: string): void => {
		[...strText].forEach((strChar, nAt) => {
			const arrLine = arrRow[nRow];
			if (arrLine !== undefined) {
				arrLine[nColumn + nAt] = strChar;
			}
		});
	};
	for (const oBox of arrBox) {
		const strBox = `[${oBox.strLabel}]`; // in brackets, so the operator / is not read as an edge
		Put(oBox.nY * 2, Column(oBox.nX) - Math.floor(strBox.length / 2), strBox);
		for (const nChild of oBox.arrChild) {
			const nChildX = arrBox[nChild]?.nX ?? oBox.nX;
			const strEdge = nChildX < oBox.nX ? "/" : nChildX > oBox.nX ? "\\" : "|";
			Put(oBox.nY * 2 + 1, Math.round((Column(oBox.nX) + Column(nChildX)) / 2), strEdge);
		}
	}
	return arrRow.map((arrLine) => arrLine.join("").trimEnd());
}

const EXPR = "10 + 30 * (100 + 2) / 10 + 20";
const oTree = TreeOf(EXPR);
const arrBig = Layout(oTree);
console.log(`2) ${EXPR}`);
for (const strLine of Picture(arrBig)) {
	console.log(`   ${strLine}`);
}

// 3) The same as DevCalc's LayoutTree? And how wide : 6 leaves → 6 slots
const oCore = LayoutTree(oTree);
const bSame = oCore.arrBox.every((oBox, nIndex) => oBox.nX === arrBig[nIndex]?.nX && oBox.nY === arrBig[nIndex]?.nY);
console.log(`3) same places as LayoutTree : ${bSame} · ${oCore.nWidth} slots × ${oCore.nHeight} levels`);
console.log(`   in pixels (a slot 48 wide, a level 58 high) : ${oCore.nWidth * 48} × ${(oCore.nHeight - 1) * 58 + 26}`);
// Another rule : x = the in-order position (left, node, right). No overlap either, but every
// operator takes a column of its own
console.log(`   x = in-order position instead : ${arrBig.length} columns`);

// 4) A leaf has no children. Placed like a parent, it gets the middle of nothing
const arrNoChild: number[] = [];
const nMiddle = (Math.min(...arrNoChild) + Math.max(...arrNoChild)) / 2;
console.log(`4) Expected problem: a leaf placed like a parent → x = ${nMiddle}`);
console.log(`   Why : Math.min() of nothing is ${Math.min()}, Math.max() of nothing is ${Math.max()}. Infinity + -Infinity is NaN, and no error is thrown.`);
console.log("   Fix : handle the base case first : a leaf takes the next free slot (the if in Place).");
