//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 10-lexer-parser / recursion (재귀)
//	History			: 2026-10-15 CYBERKDH Initial (최초 작성)
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// 재귀 (recursion) : 자기 자신을 호출하는 함수, 자기 자신을 참조하는 타입, 그리고 호출 스택 (call stack)

// 1) [JS + TS] 재귀 함수 = 종료 조건 (base case, 여기서 멈춤) + 문제를 더 작게 만드는 단계 (step)
function SumDigits(biValue: bigint): bigint {
	if (biValue < 10n) {
		return biValue; // 종료 조건 : 한 자리 수
	}
	return (biValue % 10n) + SumDigits(biValue / 10n); // 단계 : 마지막 자리 + 나머지 자리들의 합
}
console.log("1) SumDigits(9876n) =", SumDigits(9876n));

// 같은 함수, 호출마다 출력 : 각 호출은 안쪽 호출을 기다렸다가, 거꾸로 된 순서로 끝남
function SumDigitsTraced(biValue: bigint, nDepth: number): bigint {
	const strIndent = "   ".repeat(nDepth);
	console.log(`${strIndent}SumDigits(${biValue})`);
	const biSum = biValue < 10n ? biValue : (biValue % 10n) + SumDigitsTraced(biValue / 10n, nDepth + 1);
	console.log(`${strIndent}→ ${biSum}`);
	return biSum;
}
SumDigitsTraced(987n, 1);

// 2) [TS] 재귀 타입 (recursive type) : 폴더가 폴더를 담음
interface IFolder {
	strName: string;
	arrChild: IFolder[]; // interface 가 자기 자신을 참조
}

const ROOT: IFolder = {
	strName: "devcalc",
	arrChild: [
		{ strName: "src", arrChild: [{ strName: "core", arrChild: [] }, { strName: "cli", arrChild: [] }] },
		{ strName: "tests", arrChild: [] },
		{ strName: "web", arrChild: [] },
	],
};

// 재귀 타입은 재귀 함수로 순회함 : 폴더 하나에 호출 하나
function CountFolders(oFolder: IFolder): number {
	return 1 + oFolder.arrChild.reduce((nSum, oChild) => nSum + CountFolders(oChild), 0);
}

function PrintTree(oFolder: IFolder, strIndent: string): void {
	console.log(`2) ${strIndent}${oFolder.strName}/`);
	for (const oChild of oFolder.arrChild) {
		PrintTree(oChild, strIndent + "   ");
	}
}
PrintTree(ROOT, "");
console.log("2) CountFolders =", CountFolders(ROOT));

// 3) [TS] 재귀 유니온 (recursive union) : 구문 트리 (syntax tree) 의 모양 (파서가 이것을 만듦)
type TExpr = { eKind: "number"; nValue: number } | { eKind: "add"; oLeft: TExpr; oRight: TExpr };

// 1 + (2 + 3) 을 나타내는 트리
const EXPR: TExpr = {
	eKind: "add",
	oLeft: { eKind: "number", nValue: 1 },
	oRight: { eKind: "add", oLeft: { eKind: "number", nValue: 2 }, oRight: { eKind: "number", nValue: 3 } },
};

function Calc(oExpr: TExpr): number {
	switch (oExpr.eKind) {
		case "number":
			return oExpr.nValue; // 종료 조건 : 리프 노드 (leaf)
		case "add":
			return Calc(oExpr.oLeft) + Calc(oExpr.oRight); // 단계 : 더 작은 두 트리
	}
}
console.log("3) Calc(1 + (2 + 3)) =", Calc(EXPR));
// const oBad: TExpr = { eKind: "add", oLeft: { eKind: "number", nValue: 1 } }; // ← 주석을 풀면 빨간 줄 TS2322 (oRight 속성이 없음 ...)

// 4) 모든 호출은 호출 스택에서 기다림. 종료 조건이 없으면 → 스택 오버플로 발생
function Forever(nDepth: number): number {
	return Forever(nDepth + 1); // 종료 조건 없음
}

try {
	Forever(0);
} catch (e) {
	console.log("4) Expected error:", `${(e as Error).name}: ${(e as Error).message}`);
	console.log("   Why : Forever never stops calling itself, and each waiting call takes stack space.");
	console.log("   Fix : every recursive function needs a base case that is always reached.");
}

// 5) 올바르지만 너무 깊어도 같은 문제 : 깊이가 100,000 인 폴더 체인
let oDeep: IFolder = { strName: "leaf", arrChild: [] };
for (let nIdx = 0; nIdx < 100_000; nIdx++) {
	oDeep = { strName: `f${nIdx}`, arrChild: [oDeep] };
}
try {
	CountFolders(oDeep);
} catch (e) {
	console.log("5) Expected error:", `${(e as Error).name}: ${(e as Error).message}`);
	console.log("   Why : the input is deeper than the call stack.");
	console.log("   Fix : a loop with your own stack (below), or a depth limit for input you don't control.");
}

// 반복문 버전 : 리스트 arrTodo 가 호출 스택 역할을 함
function CountFoldersLoop(oFolder: IFolder): number {
	const arrTodo: IFolder[] = [oFolder];
	let nCount = 0;
	for (let oNext = arrTodo.pop(); oNext !== undefined; oNext = arrTodo.pop()) {
		nCount++;
		arrTodo.push(...oNext.arrChild);
	}
	return nCount;
}
console.log("5) CountFoldersLoop(deep chain) =", CountFoldersLoop(oDeep));
console.log("5) CountFoldersLoop(ROOT)       =", CountFoldersLoop(ROOT));
