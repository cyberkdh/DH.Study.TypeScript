//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 10-lexer-parser / recursion
//	History			: 2026-10-15 CYBERKDH Initial
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// Recursion : a function that calls itself, a type that refers to itself, and the call stack

// 1) [JS + TS] A recursive function = a base case (stop here) + a step that makes the problem smaller
function SumDigits(biValue: bigint): bigint {
	if (biValue < 10n) {
		return biValue; // base case : one digit
	}
	return (biValue % 10n) + SumDigits(biValue / 10n); // step : the last digit + the sum of the rest
}
console.log("1) SumDigits(9876n) =", SumDigits(9876n));

// The same, printing each call : every call waits for the one inside it, then finishes in reverse order
function SumDigitsTraced(biValue: bigint, nDepth: number): bigint {
	const strIndent = "   ".repeat(nDepth);
	console.log(`${strIndent}SumDigits(${biValue})`);
	const biSum = biValue < 10n ? biValue : (biValue % 10n) + SumDigitsTraced(biValue / 10n, nDepth + 1);
	console.log(`${strIndent}→ ${biSum}`);
	return biSum;
}
SumDigitsTraced(987n, 1);

// 2) [TS] A recursive type : a folder holds folders
interface IFolder {
	strName: string;
	arrChild: IFolder[]; // the interface refers to itself
}

const ROOT: IFolder = {
	strName: "devcalc",
	arrChild: [
		{ strName: "src", arrChild: [{ strName: "core", arrChild: [] }, { strName: "cli", arrChild: [] }] },
		{ strName: "tests", arrChild: [] },
		{ strName: "web", arrChild: [] },
	],
};

// A recursive type is walked by a recursive function : one call per folder
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

// 3) [TS] A recursive union : the shape of a syntax tree (the parser builds these)
type TExpr = { eKind: "number"; nValue: number } | { eKind: "add"; oLeft: TExpr; oRight: TExpr };

// 1 + (2 + 3)
const EXPR: TExpr = {
	eKind: "add",
	oLeft: { eKind: "number", nValue: 1 },
	oRight: { eKind: "add", oLeft: { eKind: "number", nValue: 2 }, oRight: { eKind: "number", nValue: 3 } },
};

function Calc(oExpr: TExpr): number {
	switch (oExpr.eKind) {
		case "number":
			return oExpr.nValue; // base case : a leaf
		case "add":
			return Calc(oExpr.oLeft) + Calc(oExpr.oRight); // step : the two smaller trees
	}
}
console.log("3) Calc(1 + (2 + 3)) =", Calc(EXPR));
// const oBad: TExpr = { eKind: "add", oLeft: { eKind: "number", nValue: 1 } }; // ← Uncomment → red squiggle TS2322 (Property 'oRight' is missing ...)

// 4) Every call waits on the call stack. No base case → the stack runs out
function Forever(nDepth: number): number {
	return Forever(nDepth + 1); // no base case
}

try {
	Forever(0);
} catch (e) {
	console.log("4) Expected error:", `${(e as Error).name}: ${(e as Error).message}`);
	console.log("   Why : Forever never stops calling itself, and each waiting call takes stack space.");
	console.log("   Fix : every recursive function needs a base case that is always reached.");
}

// 5) Correct but too deep has the same problem : a folder chain 100,000 levels deep
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

// The loop version : the list arrTodo plays the role of the call stack
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
