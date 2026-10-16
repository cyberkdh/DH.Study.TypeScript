//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 16-trees-steps / listen (계산기가 알려 주는 단계 듣기)
//	History			: 2026-10-16 CYBERKDH Initial (최초 작성)
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// 듣기로 단계 만들기 : 계산기는 이미 모든 노드를 올바른 순서로 방문한다. 그때 알려 달라고 하자
import { CWordSize, EvaluateTree, Explain, Parse, ToText, type TNode, type TStepListener } from "../../devcalc/src/core/index.ts";

function ParseOrThrow(strExpr: string): TNode {
	const oParsed = Parse(strExpr);
	if (!oParsed.bOk) {
		throw new Error(oParsed.vError.strWhy);
	}
	return oParsed.vValue;
}

// 1) [TS] 리스너(listener)는 함수 타입이다. EvaluateTree 가 노드를 계산한 뒤 노드마다 한 번 부른다
const oTree = ParseOrThrow("1 + 2 * 3");
const fnPrint: TStepListener = (oNode, oResult) => {
	console.log(`   heard ${ToText(oNode).padEnd(15)} = ${oResult.biValue}`);
};
console.log("1) 1 + 2 * 3");
EvaluateTree("1 + 2 * 3", oTree, undefined, undefined, undefined, fnPrint);

// 2) [JS] 객체를 키로 쓰는 Map : 키는 생김새가 아니라 객체 그 자체다.
// "(1 + 1) * (1 + 1)" 에는 "1 + 1" 노드가 둘 : 글자는 같고 객체는 둘
const oTwice = ParseOrThrow("(1 + 1) * (1 + 1)");
const mapByNode = new Map<TNode, bigint>();
const mapByText = new Map<string, bigint>();
let nHeard = 0;
EvaluateTree("(1 + 1) * (1 + 1)", oTwice, undefined, undefined, undefined, (oNode, oResult) => {
	if (oNode.eKind !== "binary" || nHeard++ > 0) {
		return; // 첫 계산만 남긴다 : 왼쪽 "1 + 1"
	}
	mapByNode.set(oNode, oResult.biValue);
	mapByText.set(ToText(oNode), oResult.biValue);
});
if (oTwice.eKind === "binary") {
	console.log("2) left  (1 + 1) done?  by node :", mapByNode.has(oTwice.oLeft), " by text :", mapByText.has(ToText(oTwice.oLeft)));
	console.log("   right (1 + 1) done?  by node :", mapByNode.has(oTwice.oRight), "by text :", mapByText.has(ToText(oTwice.oRight)), "← wrong : it was not calculated yet");
}

// 3) DevCalc 의 Explain : 위의 리스너, 그리고 단계마다 트리 전체를 다시 그리기
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
