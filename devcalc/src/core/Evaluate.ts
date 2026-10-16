//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: devcalc / core / Evaluate (One expression → result or error, no printing)
//	History			: 2026-10-15 CYBERKDH Initial - Lesson 05 DevCalc step (moved out of main.ts)
//					  2026-10-15 CYBERKDH Lesson 10: whole expressions : Parse() → syntax tree → Walk() (recursion)
//					  2026-10-15 CYBERKDH Lesson 11: "unary" node (- ~) through CCalculator.CalculateUnary
//					  2026-10-15 CYBERKDH Lesson 13: function calls, variables (a ReadonlyMap in, strAssign out), IWalkContext
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

import { Err, Ok, type TResult } from "./Result.ts";
import type { CWordSize } from "./WordSize.ts";
import { CCalcError, CCalculator, type ICalcResult } from "./Calculator.ts";
import { CallFunction, FunctionHelp } from "./Functions.ts";
import { Parse, type TNode } from "./Parser.ts";

export interface IEvaluation {
	readonly strExpr: string;
	readonly biValue: bigint; // the result (wrapped to the word size, if any)
	readonly biExact: bigint; // the exact result before wrapping (lesson 10 : or the first value that did not fit)
	readonly bOverflow: boolean; // biExact did not fit in the word size
	readonly strAssign?: string; // lesson 13 : "mask" for "mask = 0xFF00". The caller keeps the variable
}

// What went wrong, in the three lines DevCalc always prints
export interface IEvalError {
	readonly strTitle: string;
	readonly strWhy: string;
	readonly strFix: string;
}

export type TEvalResult = TResult<IEvaluation, IEvalError>;

// Lesson 13: what every step of Walk needs. One object instead of five parameters
interface IWalkContext {
	readonly oCalc: CCalculator;
	readonly oWord: CWordSize | undefined;
	readonly biAns: bigint;
	readonly mapVar: ReadonlyMap<string, bigint>;
}

// Lesson 13: Extract keeps the union members that match : the "ans" and "variable" nodes
type TNameNode = Extract<TNode, { eKind: "ans" | "variable" }>;

// Lesson 10: the first ans in the tree (recursion), to say "no previous result" before calculating.
// Lesson 13: or the first variable that has no value yet
function FindMissing(oNode: TNode, bHasAns: boolean, mapVar: ReadonlyMap<string, bigint>): TNameNode | undefined {
	switch (oNode.eKind) {
		case "number":
			return undefined;
		case "ans":
			return bHasAns ? undefined : oNode;
		case "variable":
			return mapVar.has(oNode.strName) ? undefined : oNode;
		case "call":
			return oNode.arrArg.map((oArg) => FindMissing(oArg, bHasAns, mapVar)).find((oFound) => oFound !== undefined);
		case "assign":
			return FindMissing(oNode.oValue, bHasAns, mapVar);
		case "unary":
			return FindMissing(oNode.oOperand, bHasAns, mapVar);
		case "binary":
			return FindMissing(oNode.oLeft, bHasAns, mapVar) ?? FindMissing(oNode.oRight, bHasAns, mapVar);
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
// (like a programmer calculator). CCalculator and CallFunction throw CCalcError for 1 / 0, bad shifts, ...
function Walk(oNode: TNode, oContext: IWalkContext): ICalcResult {
	switch (oNode.eKind) {
		case "number":
			return Wrap(oNode.biValue, oContext.oWord);
		case "ans":
			return Wrap(oContext.biAns, oContext.oWord);
		case "variable":
			return Wrap(oContext.mapVar.get(oNode.strName) ?? 0n, oContext.oWord); // FindMissing checked it is there
		case "call": {
			const arrArg = oNode.arrArg.map((oArg) => Walk(oArg, oContext));
			const biResult = CallFunction(oNode.eFunction, arrArg.map((oArg) => oArg.biValue), oContext.oWord);
			return KeepOverflow(Wrap(biResult, oContext.oWord), arrArg);
		}
		case "assign":
			return Walk(oNode.oValue, oContext);
		case "unary": {
			const oOperand = Walk(oNode.oOperand, oContext);
			return KeepOverflow(oContext.oCalc.CalculateUnary(oNode.strOp, oOperand.biValue), [oOperand]);
		}
		case "binary": {
			const oLeft = Walk(oNode.oLeft, oContext);
			const oRight = Walk(oNode.oRight, oContext);
			return KeepOverflow(oContext.oCalc.Calculate(oLeft.biValue, oNode.strOp, oRight.biValue), [oLeft, oRight]);
		}
	}
}

function MissingError(oMissing: TNameNode): IEvalError {
	if (oMissing.eKind === "ans") {
		return { strTitle: `Invalid input: "${oMissing.strText}"`, strWhy: "there is no previous result yet", strFix: 'calculate something first, e.g. "0xFF + 1; ans * 2".' };
	}
	const strName = oMissing.strName; // narrowed : the only other TNameNode is "variable"
	return {
		strTitle: `Invalid input: "${strName}"`,
		strWhy: `"${strName}" is not a number, and no variable has that name yet`,
		strFix: `assign it first, e.g. "${strName} = 0xFF; ${strName} + 1". Functions: ${FunctionHelp()}`,
	};
}

// A whole expression : (0xFF + 1) << 4, -ans * 2, popcount(x) + 1, mask = 0xFF00. Nothing is printed and nothing is thrown for bad input.
// With a word size, biExact is the first value that did not fit (bOverflow), or the exact result.
// Lesson 13: mapVar is only read (ReadonlyMap). "x = …" returns strAssign, and the caller decides where to keep x
export function Evaluate(strExpr: string, oWord?: CWordSize, biAns?: bigint, mapVar: ReadonlyMap<string, bigint> = new Map()): TEvalResult {
	const strTrim = strExpr.trim();
	const oTree = Parse(strTrim);
	if (!oTree.bOk) {
		return oTree;
	}
	const oMissing = FindMissing(oTree.vValue, biAns !== undefined, mapVar);
	if (oMissing !== undefined) {
		return Err(MissingError(oMissing));
	}
	try {
		const oResult = Walk(oTree.vValue, { oCalc: new CCalculator(oWord), oWord, biAns: biAns ?? 0n, mapVar });
		const strAssign = oTree.vValue.eKind === "assign" ? oTree.vValue.strName : undefined;
		return Ok({ strExpr: strTrim, ...oResult, ...(strAssign === undefined ? {} : { strAssign }) });
	} catch (e) {
		if (e instanceof CCalcError) {
			return Err({ strTitle: `Cannot calculate: "${strTrim}"`, strWhy: e.message, strFix: e.strFix });
		}
		throw e; // not ours : a bug, let it crash with its stack trace
	}
}
