//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 17-tree-view / layout (트리 상자의 자리 정하기)
//	History			: 2026-10-16 CYBERKDH Initial (최초 작성)
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// 트리의 상자를 각각 어디에 둘까? 잎은 다음 빈 칸 (slot) 을 차지하고, 부모는 자식들의 가운데에 선다.
// DevCalc 의 LayoutTree 와 같은 규칙을 여기서 직접 써 보며 동작을 지켜본다
import { Parse, LayoutTree, NodeChildren, NodeLabel, type TNode } from "../../devcalc/src/core/index.ts";

// [TS] 상자 하나 : 좌표는 픽셀이 아니라 칸 (x) 과 층 (y). 크기는 그리는 쪽이 정한다
interface IBox {
	readonly strLabel: string;
	readonly nX: number;
	readonly nY: number;
	readonly arrChild: readonly number[]; // 상자 목록 안의 인덱스
}

function TreeOf(strExpr: string): TNode {
	const oParsed = Parse(strExpr);
	if (!oParsed.bOk) {
		throw new Error(oParsed.vError.strWhy); // 아래 식들은 고정된 올바른 식
	}
	return oParsed.vValue;
}

// [JS] 재귀 순회 한 번, 자식 먼저 (후위 순회, 16강). nNextLeaf 는 모든 Place 호출이 함께 쓴다 :
// 클로저 (13강). 그래서 잎은 왼쪽부터 0, 1, 2, … 를 받는다
function Layout(oRoot: TNode): IBox[] {
	const arrBox: IBox[] = [];
	let nNextLeaf = 0;
	function Place(oNode: TNode, nY: number): number {
		const arrChild = NodeChildren(oNode).map((oChild) => Place(oChild, nY + 1));
		let nX = nNextLeaf;
		if (arrChild.length === 0) {
			nNextLeaf += 1; // 잎 : 다음 빈 칸
		} else {
			const arrChildX = arrChild.map((nChild) => arrBox[nChild]?.nX ?? 0);
			nX = (Math.min(...arrChildX) + Math.max(...arrChildX)) / 2; // 부모 : 자식들의 가운데
		}
		arrBox.push({ strLabel: NodeLabel(oNode), nX, nY, arrChild });
		return arrBox.length - 1;
	}
	Place(oRoot, 0);
	return arrBox;
}

// 1) 작은 트리의 상자들, 놓인 순서대로
const SMALL = "1 + 2 * 3";
const arrSmall = Layout(TreeOf(SMALL));
console.log(`1) ${SMALL}`);
console.log("   #  label  x     y  children");
arrSmall.forEach((oBox, nIndex) => {
	console.log(`   ${nIndex}  ${oBox.strLabel.padEnd(5)}  ${String(oBox.nX).padEnd(4)}  ${oBox.nY}  [${oBox.arrChild.join(", ")}]`);
});

// 2) [JS] 좌표 → 그림. 한 칸 = COL 글자, 한 층 = 2 줄 (상자 줄 하나, 연결선 줄 하나).
//    어떤 그리기든 같은 방식이다 : SVG 는 글자 대신 픽셀을 쓸 뿐
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
		const strBox = `[${oBox.strLabel}]`; // 괄호로 감쌈 : 연산자 / 가 연결선으로 읽히지 않게
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

// 3) DevCalc 의 LayoutTree 와 같은가? 그리고 너비 : 잎 6 개 → 6 칸
const oCore = LayoutTree(oTree);
const bSame = oCore.arrBox.every((oBox, nIndex) => oBox.nX === arrBig[nIndex]?.nX && oBox.nY === arrBig[nIndex]?.nY);
console.log(`3) same places as LayoutTree : ${bSame} · ${oCore.nWidth} slots × ${oCore.nHeight} levels`);
console.log(`   in pixels (a slot 48 wide, a level 58 high) : ${oCore.nWidth * 48} × ${(oCore.nHeight - 1) * 58 + 26}`);
// 다른 규칙 : x = 중위 순서의 위치 (왼쪽, 노드, 오른쪽). 역시 겹치지 않지만
// 연산자마다 자기 열을 하나씩 차지한다
console.log(`   x = in-order position instead : ${arrBig.length} columns`);

// 4) 잎에는 자식이 없다. 부모처럼 놓으면 '아무것도 없는 것의 가운데' 를 받는다
const arrNoChild: number[] = [];
const nMiddle = (Math.min(...arrNoChild) + Math.max(...arrNoChild)) / 2;
console.log(`4) Expected problem: a leaf placed like a parent → x = ${nMiddle}`);
console.log(`   Why : Math.min() of nothing is ${Math.min()}, Math.max() of nothing is ${Math.max()}. Infinity + -Infinity is NaN, and no error is thrown.`);
console.log("   Fix : handle the base case first : a leaf takes the next free slot (the if in Place).");
