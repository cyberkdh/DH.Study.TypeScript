//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 16-trees-steps / rewrite
//	History			: 2026-10-16 CYBERKDH Initial
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// Steps by rewriting : calculate one part, get a new tree, print it, repeat. The old tree is never changed

// 1) [TS] A small tree of its own, readonly all the way down
type TOp = "+" | "-" | "*" | "/";
type TExpr = { readonly eKind: "num"; readonly biValue: bigint } | { readonly eKind: "bin"; readonly strOp: TOp; readonly oLeft: TExpr; readonly oRight: TExpr };

const PRECEDENCE: Readonly<Record<TOp, number>> = { "+": 1, "-": 1, "*": 2, "/": 2 };

function Num(biValue: bigint): TExpr {
	return { eKind: "num", biValue };
}

function Bin(oLeft: TExpr, strOp: TOp, oRight: TExpr): TExpr {
	return { eKind: "bin", strOp, oLeft, oRight };
}

// 10 + 30 * (100 + 2) / 10 + 20, built the way the parser would build it
const FIRST = Bin(Bin(Num(10n), "+", Bin(Bin(Num(30n), "*", Bin(Num(100n), "+", Num(2n))), "/", Num(10n))), "+", Num(20n));
// FIRST.eKind = "num"; // ← Uncomment → red squiggle TS2540 (Cannot assign to 'eKind' because it is a read-only property)

// The tree as text with the fewest ( ) : a child needs them when it binds looser than its parent,
// or as tight on the right (8 - (4 - 2) is not 8 - 4 - 2)
function Show(oExpr: TExpr): string {
	if (oExpr.eKind === "num") {
		return String(oExpr.biValue);
	}
	const nMine = PRECEDENCE[oExpr.strOp];
	const strLeft = oExpr.oLeft.eKind === "bin" && PRECEDENCE[oExpr.oLeft.strOp] < nMine ? `(${Show(oExpr.oLeft)})` : Show(oExpr.oLeft);
	const strRight = oExpr.oRight.eKind === "bin" && PRECEDENCE[oExpr.oRight.strOp] <= nMine ? `(${Show(oExpr.oRight)})` : Show(oExpr.oRight);
	return `${strLeft} ${oExpr.strOp} ${strRight}`;
}

function Apply(biA: bigint, strOp: TOp, biB: bigint): bigint {
	switch (strOp) {
		case "+":
			return biA + biB;
		case "-":
			return biA - biB;
		case "*":
			return biA * biB;
		case "/":
			return biA / biB;
	}
}

// 2) [JS] One step : find the first node whose two children are numbers (left side first) and replace it.
// Every node on the way down is copied with { ...oExpr, oLeft: … } ; everything else is the same object as before
function ReduceOnce(oExpr: TExpr): TExpr {
	if (oExpr.eKind === "num") {
		return oExpr; // nothing left to do
	}
	const { oLeft, oRight } = oExpr;
	if (oLeft.eKind === "num" && oRight.eKind === "num") {
		return Num(Apply(oLeft.biValue, oExpr.strOp, oRight.biValue)); // the base case : one calculation
	}
	if (oLeft.eKind === "bin") {
		return { ...oExpr, oLeft: ReduceOnce(oLeft) };
	}
	return { ...oExpr, oRight: ReduceOnce(oRight) };
}

let oNow = FIRST;
console.log(`1) ${Show(oNow)}`);
while (oNow.eKind === "bin") {
	oNow = ReduceOnce(oNow);
	console.log(`   ${Show(oNow)}`);
}

// 3) [JS] The old tree is still there, and the new one shares every part that did not change
const SECOND = ReduceOnce(FIRST);
console.log("2) FIRST after all the steps :", Show(FIRST));
if (FIRST.eKind === "bin" && SECOND.eKind === "bin") {
	console.log("   right part (20) is the same object :", FIRST.oRight === SECOND.oRight);
	console.log("   left part is the same object       :", FIRST.oLeft === SECOND.oLeft);
}

// 4) [TS] readonly is a promise to the compiler, not a lock : after "as" the code compiles, and the
// object really changes. Object.freeze locks it at run time (a module is strict mode, so writing throws)
const oLoose = Num(1n);
(oLoose as { biValue: bigint }).biValue = 2n;
console.log("3) readonly, written through as :", Show(oLoose));
const oFrozen = Object.freeze(Num(1n));
try {
	(oFrozen as { biValue: bigint }).biValue = 2n;
} catch (e) {
	console.log("   Expected error:", `${(e as Error).name}: ${(e as Error).message}`);
	console.log("   Why : Object.freeze made the property read-only at run time, not just in the types.");
	console.log("   Fix : build a new object instead ({ ...oFrozen, biValue: 2n }) : the way ReduceOnce works.");
}
