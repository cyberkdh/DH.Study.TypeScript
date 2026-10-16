//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 16-trees-steps / listen
//	History			: 2026-10-16 CYBERKDH Initial
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// Steps by listening : the calculator already visits every node in the right order. Let it tell us
import { CWordSize, EvaluateTree, Explain, Parse, ToText, type TNode, type TStepListener } from "../../devcalc/src/core/index.ts";

function ParseOrThrow(strExpr: string): TNode {
	const oParsed = Parse(strExpr);
	if (!oParsed.bOk) {
		throw new Error(oParsed.vError.strWhy);
	}
	return oParsed.vValue;
}

// 1) [TS] A listener is a function type. EvaluateTree calls it once per node, after the node is calculated
const oTree = ParseOrThrow("1 + 2 * 3");
const fnPrint: TStepListener = (oNode, oResult) => {
	console.log(`   heard ${ToText(oNode).padEnd(15)} = ${oResult.biValue}`);
};
console.log("1) 1 + 2 * 3");
EvaluateTree("1 + 2 * 3", oTree, undefined, undefined, undefined, fnPrint);

// 2) [JS] A Map with objects as keys : the key is the object itself, not what it looks like.
// "(1 + 1) * (1 + 1)" has two "1 + 1" nodes : equal text, two objects
const oTwice = ParseOrThrow("(1 + 1) * (1 + 1)");
const mapByNode = new Map<TNode, bigint>();
const mapByText = new Map<string, bigint>();
let nHeard = 0;
EvaluateTree("(1 + 1) * (1 + 1)", oTwice, undefined, undefined, undefined, (oNode, oResult) => {
	if (oNode.eKind !== "binary" || nHeard++ > 0) {
		return; // keep only the first calculation : the left "1 + 1"
	}
	mapByNode.set(oNode, oResult.biValue);
	mapByText.set(ToText(oNode), oResult.biValue);
});
if (oTwice.eKind === "binary") {
	console.log("2) left  (1 + 1) done?  by node :", mapByNode.has(oTwice.oLeft), " by text :", mapByText.has(ToText(oTwice.oLeft)));
	console.log("   right (1 + 1) done?  by node :", mapByNode.has(oTwice.oRight), "by text :", mapByText.has(ToText(oTwice.oRight)), "← wrong : it was not calculated yet");
}

// 3) DevCalc's Explain : the listener above, and a drawing of the whole tree after every step
function PrintSteps(strExpr: string, oWord?: CWordSize): void {
	const oResult = Explain(strExpr, oWord);
	if (!oResult.bOk) {
		console.log(`   ${oResult.vError.strTitle} : ${oResult.vError.strWhy}`);
		return;
	}
	const { arrStep, strLast } = oResult.vValue;
	const nWidth = Math.max(0, ...arrStep.map((oStep) => oStep.strExpr.length));
	for (const { strExpr: strLine, strWork, strNote } of arrStep) {
		console.log(`   ${strLine.padEnd(nWidth)}   ${strWork}${strNote === "" ? "" : `   (${strNote})`}`);
	}
	console.log(`   ${strLast}`);
}
console.log("3) 10 + 30 * (100 + 2) / 10 + 20");
PrintSteps("10 + 30 * (100 + 2) / 10 + 20");
console.log("   2 ** 3 ** 2 : right-associative, so the right part first");
PrintSteps("2 ** 3 ** 2");
console.log("   (0xF0 >>> 4) * 20 + 7 / 2 in 8 bits : notes for a wrap and a dropped remainder");
PrintSteps("(0xF0 >>> 4) * 20 + 7 / 2", new CWordSize(8));
console.log("   1 / (2 - 2) : no steps, the same error Evaluate gives");
PrintSteps("1 / (2 - 2)");
