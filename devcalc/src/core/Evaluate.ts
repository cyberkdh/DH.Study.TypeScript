//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: devcalc / core / Evaluate (One expression → result or error, no printing)
//	History			: 2026-10-15 CYBERKDH Initial - Lesson 05 DevCalc step (moved out of main.ts)
//					  2026-10-15 CYBERKDH Lesson 10: whole expressions : Parse() → syntax tree → Walk() (recursion)
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

import { Err, Ok, type TResult } from "./Result.ts";
import type { CWordSize } from "./WordSize.ts";
import { CCalcError, CCalculator, type ICalcResult } from "./Calculator.ts";
import { Parse, type TNode } from "./Parser.ts";

export interface IEvaluation {
	readonly strExpr: string;
	readonly biValue: bigint; // the result (wrapped to the word size, if any)
	readonly biExact: bigint; // the exact result before wrapping (lesson 10 : or the first value that did not fit)
	readonly bOverflow: boolean; // biExact did not fit in the word size
}

// What went wrong, in the three lines DevCalc always prints
export interface IEvalError {
	readonly strTitle: string;
	readonly strWhy: string;
	readonly strFix: string;
}

export type TEvalResult = TResult<IEvaluation, IEvalError>;

// Lesson 10: the first ans in the tree (recursion), to say "no previous result" before calculating
function FindAns(oNode: TNode): string | undefined {
	switch (oNode.eKind) {
		case "number":
			return undefined;
		case "ans":
			return oNode.strText;
		case "negate":
			return FindAns(oNode.oOperand);
		case "binary":
			return FindAns(oNode.oLeft) ?? FindAns(oNode.oRight);
	}
}

// A single value in the word size. Without one, the value stays as it is
function Wrap(biExact: bigint, oWord: CWordSize | undefined): ICalcResult {
	if (oWord === undefined) {
		return { biValue: biExact, biExact, bOverflow: false };
	}
	return { biValue: oWord.ToUnsigned(biExact), biExact, bOverflow: !oWord.Fits(biExact) };
}

// The parts are calculated before the whole, so the first part that did not fit is the one to report
function KeepOverflow(oStep: ICalcResult, arrPart: readonly ICalcResult[]): ICalcResult {
	const oFirst = arrPart.find((oPart) => oPart.bOverflow);
	return oFirst === undefined ? oStep : { biValue: oStep.biValue, biExact: oFirst.biExact, bOverflow: true };
}

// Lesson 10: calculate the tree from the leaves up. Every value is wrapped to the word size on the way
// (like a programmer calculator). CCalculator throws CCalcError for 1 / 0 and bad shifts
function Walk(oNode: TNode, oCalc: CCalculator, oWord: CWordSize | undefined, biAns: bigint): ICalcResult {
	switch (oNode.eKind) {
		case "number":
			return Wrap(oNode.biValue, oWord);
		case "ans":
			return Wrap(biAns, oWord);
		case "negate": {
			const oOperand = Walk(oNode.oOperand, oCalc, oWord, biAns);
			return KeepOverflow(Wrap(-oOperand.biValue, oWord), [oOperand]);
		}
		case "binary": {
			const oLeft = Walk(oNode.oLeft, oCalc, oWord, biAns);
			const oRight = Walk(oNode.oRight, oCalc, oWord, biAns);
			return KeepOverflow(oCalc.Calculate(oLeft.biValue, oNode.strOp, oRight.biValue), [oLeft, oRight]);
		}
	}
}

// A whole expression : (0xFF + 1) << 4, -ans * 2, 1 + 2 * 3. Nothing is printed and nothing is thrown for bad input.
// With a word size, biExact is the first value that did not fit (bOverflow), or the exact result
export function Evaluate(strExpr: string, oWord?: CWordSize, biAns?: bigint): TEvalResult {
	const strTrim = strExpr.trim();
	const oTree = Parse(strTrim);
	if (!oTree.bOk) {
		return oTree;
	}
	const strAns = FindAns(oTree.vValue);
	if (strAns !== undefined && biAns === undefined) {
		return Err({
			strTitle: `Invalid input: "${strAns}"`,
			strWhy: "there is no previous result yet",
			strFix: 'calculate something first, e.g. "0xFF + 1; ans * 2".',
		});
	}
	try {
		const oResult = Walk(oTree.vValue, new CCalculator(oWord), oWord, biAns ?? 0n);
		return Ok({ strExpr: strTrim, ...oResult });
	} catch (e) {
		if (e instanceof CCalcError) {
			return Err({ strTitle: `Cannot calculate: "${strTrim}"`, strWhy: e.message, strFix: e.strFix });
		}
		throw e; // not ours : a bug, let it crash with its stack trace
	}
}
