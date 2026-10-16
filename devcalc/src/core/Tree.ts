//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: devcalc / core / Tree (The syntax tree as data for a drawing)
//	History			: 2026-10-16 CYBERKDH Initial - Lesson 17 DevCalc step, Lv12
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// Lesson 17: where each node of the tree goes. No DOM here : the command line draws the tree with
// characters (TreeLines), the web page with SVG (web/TreeView.ts), both from the same functions.

import type { TNode } from "./Parser.ts";

// One box of the drawing. Coordinates are in slots and levels, not pixels : the drawer picks the size
export interface ITreeBox {
	readonly oNode: TNode;
	readonly strLabel: string;
	readonly nX: number; // leaves are 0, 1, 2, … from left to right; a parent is in the middle of its children
	readonly nY: number; // the level : the root is 0, its children 1, …
	readonly arrChild: readonly number[]; // indexes into arrBox, left to right
}

export interface ITreeLayout {
	readonly arrBox: readonly ITreeBox[]; // post-order : children before their parent, the root last (lesson 16)
	readonly nWidth: number; // the number of leaf slots
	readonly nHeight: number; // the number of levels
}

// What a node shows. The switch covers every eKind : a new kind is a compile error here (never)
export function NodeLabel(oNode: TNode): string {
	switch (oNode.eKind) {
		case "number":
			return oNode.strText; // as typed : 0xFF, 'A', 4K
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
			const oNever: never = oNode;
			return oNever;
		}
	}
}

// The children of a node, left to right. A leaf has none
export function NodeChildren(oNode: TNode): readonly TNode[] {
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

// Every leaf gets the next free slot, so leaves never overlap. A parent goes in the middle of its
// first and last child, so it is always above them. One recursive walk, children first
export function LayoutTree(oRoot: TNode): ITreeLayout {
	const arrBox: ITreeBox[] = [];
	let nNextLeaf = 0; // shared by every call of Place : a closure (lesson 13)
	let nHeight = 0;

	function Place(oNode: TNode, nY: number): number {
		const arrChild = NodeChildren(oNode).map((oChild) => Place(oChild, nY + 1));
		let nX = nNextLeaf;
		if (arrChild.length === 0) {
			nNextLeaf += 1;
		} else {
			const arrChildX = arrChild.map((nChild) => arrBox[nChild]?.nX ?? 0);
			nX = (Math.min(...arrChildX) + Math.max(...arrChildX)) / 2;
		}
		nHeight = Math.max(nHeight, nY + 1);
		arrBox.push({ oNode, strLabel: NodeLabel(oNode), nX, nY, arrChild });
		return arrBox.length - 1;
	}

	Place(oRoot, 0);
	return { arrBox, nWidth: nNextLeaf, nHeight };
}

// The tree as text, one node per line (the command line's --tree) :
//   +
//   ├─ 1
//   └─ *
//      ├─ 2
//      └─ 3
export function TreeLines(oRoot: TNode): string[] {
	const arrLine: string[] = [NodeLabel(oRoot)];

	function Visit(oNode: TNode, strIndent: string): void {
		const arrChild = NodeChildren(oNode);
		arrChild.forEach((oChild, nIndex) => {
			const bLast = nIndex === arrChild.length - 1;
			arrLine.push(`${strIndent}${bLast ? "└─ " : "├─ "}${NodeLabel(oChild)}`);
			Visit(oChild, strIndent + (bLast ? "   " : "│  "));
		});
	}

	Visit(oRoot, "");
	return arrLine;
}
