//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: devcalc / tests / Steps
//	History			: 2026-10-16 CYBERKDH Initial - Lesson 16 DevCalc step
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

import { test } from "vitest";
import assert from "node:assert/strict";
import { Evaluate, EvaluateTree } from "../src/core/Evaluate.ts";
import { Parse, ToText } from "../src/core/Parser.ts";
import { Explain, type IExplanation } from "../src/core/Steps.ts";
import { CWordSize } from "../src/core/WordSize.ts";

// Returns the explanation of an Ok result, fails the test otherwise
function ExplainOk(strExpr: string, oWord?: CWordSize, mapVar?: ReadonlyMap<string, bigint>): IExplanation {
	const oResult = Explain(strExpr, oWord, undefined, mapVar);
	assert.ok(oResult.bOk, oResult.bOk ? "" : oResult.vError.strTitle);
	return oResult.vValue;
}

// Every line of the steps view : the expressions, then the result
function Lines(oExplain: IExplanation): string[] {
	return [...oExplain.arrStep.map((oStep) => oStep.strExpr), oExplain.strLast];
}

test("Explain: the lesson example, from the inside out", () => {
	const oExplain = ExplainOk("10 + 30 * (100 + 2) / 10 + 20");
	assert.deepEqual(Lines(oExplain), ["10 + 30 * (100 + 2) / 10 + 20", "10 + 30 * 102 / 10 + 20", "10 + 3060 / 10 + 20", "10 + 306 + 20", "316 + 20", "336"]);
	assert.deepEqual(
		oExplain.arrStep.map((oStep) => oStep.strWork),
		["100 + 2 = 102", "30 * 102 = 3060", "3060 / 10 = 306", "10 + 306 = 316", "316 + 20 = 336"],
	);
	assert.equal(oExplain.oEval.biValue, 336n);
});

test("Explain: nStart / nEnd mark the part calculated next, with its ( )", () => {
	const arrPart = ExplainOk("10 + 30 * (100 + 2) / 10 + 20").arrStep.map((oStep) => oStep.strExpr.slice(oStep.nStart, oStep.nEnd));
	assert.deepEqual(arrPart, ["(100 + 2)", "30 * 102", "3060 / 10", "10 + 306", "316 + 20"]);
});

test("Explain: the same order and value as the calculation", () => {
	for (const strExpr of ["1 + 2 * 3", "2 ** 3 ** 2", "8 - 4 - 2", "(0xFF + 1) << 4", "~0x0F & 0xFF", "max(3, 1 + 1) * -2"]) {
		const oEval = Evaluate(strExpr);
		assert.ok(oEval.bOk);
		assert.equal(ExplainOk(strExpr).oEval.biValue, oEval.vValue.biValue, strExpr);
	}
	assert.deepEqual(Lines(ExplainOk("2 ** 3 ** 2")), ["2 ** 3 ** 2", "2 ** 9", "512"]); // right-associative : 3 ** 2 first
	assert.deepEqual(Lines(ExplainOk("8 - 4 - 2")), ["8 - 4 - 2", "4 - 2", "2"]); // left-associative : 8 - 4 first
});

test("Explain: only the ( ) the tree needs", () => {
	assert.deepEqual(Lines(ExplainOk("8 - (4 - 2) - 1")), ["8 - (4 - 2) - 1", "8 - 2 - 1", "6 - 1", "5"]);
	assert.deepEqual(Lines(ExplainOk("((1 + 2)) + 3")), ["1 + 2 + 3", "3 + 3", "6"]); // ( ) that change nothing are not in the tree
	assert.deepEqual(Lines(ExplainOk("(2 - 5) ** 2")), ["(2 - 5) ** 2", "(-3) ** 2", "9"]); // -3 ** 2 would be an error
	assert.deepEqual(Lines(ExplainOk("1 - (2 - 5)")), ["1 - (2 - 5)", "1 - (-3)", "4"]);
	assert.deepEqual(Lines(ExplainOk("-(1 + 2) * 4")), ["-(1 + 2) * 4", "-(3) * 4", "-3 * 4", "-12"]);
});

test("Explain: numbers keep the way they were typed until they are used", () => {
	assert.deepEqual(Lines(ExplainOk("0xFF + 'A'")), ["0xFF + 'A'", "320"]);
	assert.equal(ExplainOk("-5 + 1").arrStep.length, 1); // -5 is how a negative number is written, not a step
	assert.equal(ExplainOk("255").arrStep.length, 0);
});

test("Explain: names, functions and assignment", () => {
	const oExplain = ExplainOk("y = x * popcount(0xF0)", undefined, new Map([["x", 21n]]));
	assert.deepEqual(
		oExplain.arrStep.map((oStep) => oStep.strWork),
		["x → 21", "popcount(0xF0) = 4", "21 * 4 = 84"],
	);
	assert.equal(oExplain.strLast, "y = 84");
	assert.equal(oExplain.oEval.strAssign, "y");
});

test("Explain: notes for a dropped remainder and a wrap", () => {
	assert.equal(ExplainOk("7 / 2").arrStep[0]?.strNote, "integer division : remainder 1 dropped");
	assert.equal(ExplainOk("6 / 2").arrStep[0]?.strNote, "");
	const oByte = new CWordSize(8);
	assert.equal(ExplainOk("0xFF + 1", oByte).arrStep[0]?.strNote, "256 does not fit in 8 bits, wrapped to 0");
	assert.deepEqual(Lines(ExplainOk("300 + 1", oByte)), ["300 + 1", "44 + 1", "45"]); // the literal did not fit : a step of its own
	assert.equal(ExplainOk("-1", oByte).arrStep[0]?.strNote, "-1 as 8-bit unsigned");
});

test("Explain: errors are the ones Evaluate gives", () => {
	for (const strExpr of ["1 / 0", "1 +", "nope + 1", "ans"]) {
		const oExplain = Explain(strExpr);
		const oEval = Evaluate(strExpr);
		assert.ok(!oExplain.bOk && !oEval.bOk, strExpr);
		assert.deepEqual(oExplain.vError, oEval.vError);
	}
});

test("EvaluateTree: the listener hears every part, leaves first, and the tree is not changed", () => {
	const oTree = Parse("1 + 2 * 3");
	assert.ok(oTree.bOk);
	const strBefore = ToText(oTree.vValue);
	const arrHeard: string[] = [];
	const oResult = EvaluateTree("1 + 2 * 3", oTree.vValue, undefined, undefined, undefined, (oNode, oCalc) => {
		arrHeard.push(`${ToText(oNode)}=${oCalc.biValue}`);
	});
	assert.ok(oResult.bOk);
	assert.deepEqual(arrHeard, ["1=1", "2=2", "3=3", "(2 * 3)=6", "(1 + (2 * 3))=7"]); // post-order
	assert.equal(ToText(oTree.vValue), strBefore);
});
