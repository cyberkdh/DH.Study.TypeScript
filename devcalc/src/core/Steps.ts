//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: devcalc / core / Steps (How an expression is calculated, one part at a time)
//	History			: 2026-10-16 CYBERKDH Initial - Lesson 16 DevCalc step, Lv11
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// 10 + 30 * (100 + 2) / 10 + 20     100 + 2 = 102
// 10 + 30 * 102 / 10 + 20           30 * 102 = 3060
// ...
// 336
// The steps are not a second calculator : EvaluateTree tells us each part as it calculates it (TStepListener),
// and we draw the whole tree again with the parts done so far as numbers. The tree is never changed.

import { Ok, type TResult } from "./Result.ts";
import type { CWordSize } from "./WordSize.ts";
import { OperatorAssoc, OperatorPrecedence, type ICalcResult } from "./Calculator.ts";
import { EvaluateTree, type IEvalError, type IEvaluation } from "./Evaluate.ts";
import { Parse, type TNode } from "./Parser.ts";

export interface IStep {
	readonly strExpr: string; // the whole expression before this step, the parts done so far as numbers
	readonly nStart: number; // strExpr.slice(nStart, nEnd) is the part this step calculates (with its ( ), if any)
	readonly nEnd: number;
	readonly strWork: string; // "100 + 2 = 102", "x → 21"
	readonly strNote: string; // "" or why the value may surprise : a dropped remainder, a wrap
}

export interface IExplanation {
	readonly arrStep: readonly IStep[];
	readonly strLast: string; // the expression after the last step : "336", "x = 336"
	readonly oEval: IEvaluation; // the same result Evaluate() gives
}

// Where the text of one node went in the drawing
interface IDrawing {
	readonly strText: string;
	readonly nStart: number;
	readonly nEnd: number;
}

type TBinaryNode = Extract<TNode, { eKind: "binary" }>;

// A child of a binary node needs ( ) when the tree would read differently without them :
// 1 + 2 * 3 has none, (1 + 2) * 3 keeps them, 8 - (4 - 2) keeps them, 2 ** 3 ** 2 has none (right-associative)
function NeedsParen(oParent: TBinaryNode, oChild: TNode, bLeft: boolean, mapDone: ReadonlyMap<TNode, bigint>): boolean {
	if (mapDone.has(oChild)) {
		return false; // already a number
	}
	if (oChild.eKind === "unary") {
		return bLeft && oParent.strOp === "**"; // -2 ** 2 is an error, so (-2) ** 2
	}
	if (oChild.eKind !== "binary") {
		return false;
	}
	const nParent = OperatorPrecedence(oParent.strOp);
	const nChild = OperatorPrecedence(oChild.strOp);
	if (nChild !== nParent) {
		return nChild < nParent;
	}
	const bRightAssoc = OperatorAssoc(oParent.strOp) === "right";
	return bLeft ? bRightAssoc : !bRightAssoc;
}

// The tree as text with the fewest ( ). A node in mapDone is drawn as its value.
// With oFocus, the result also says where that node's text is
function Draw(oRoot: TNode, mapDone: ReadonlyMap<TNode, bigint>, oFocus?: TNode): IDrawing {
	let strText = "";
	let nStart = 0;
	let nEnd = 0;

	// bNegParen : a negative value here needs ( ) : 1 - (-3), (-3) ** 2, -(-3). On the left of * it does not : -3 * 4
	function Visit(oNode: TNode, bParen: boolean, bNegParen: boolean): void {
		if (oNode === oFocus) {
			nStart = strText.length;
		}
		if (bParen) {
			strText += "(";
		}
		VisitInside(oNode, bNegParen);
		if (bParen) {
			strText += ")";
		}
		if (oNode === oFocus) {
			nEnd = strText.length;
		}
	}

	function VisitInside(oNode: TNode, bNegParen: boolean): void {
		const biDone = mapDone.get(oNode);
		if (biDone !== undefined) {
			strText += biDone < 0n && bNegParen ? `(${biDone})` : String(biDone);
			return;
		}
		switch (oNode.eKind) {
			case "number":
				strText += oNode.strText;
				return;
			case "ans":
				strText += oNode.strText;
				return;
			case "variable":
				strText += oNode.strName;
				return;
			case "call":
				strText += `${oNode.eFunction}(`;
				oNode.arrArg.forEach((oArg, nIndex) => {
					strText += nIndex > 0 ? ", " : "";
					Visit(oArg, false, false);
				});
				strText += ")";
				return;
			case "assign":
				strText += `${oNode.strName} = `;
				Visit(oNode.oValue, false, false);
				return;
			case "unary":
				strText += oNode.strOp;
				// -(1 + 2) keeps its ( ), and so does a value calculated before : -(3), not -3 = -3
				Visit(oNode.oOperand, oNode.oOperand.eKind === "binary" || mapDone.has(oNode.oOperand), false);
				return;
			case "binary":
				Visit(oNode.oLeft, NeedsParen(oNode, oNode.oLeft, true, mapDone), oNode.strOp === "**");
				strText += ` ${oNode.strOp} `;
				Visit(oNode.oRight, NeedsParen(oNode, oNode.oRight, false, mapDone), true);
				return;
		}
	}

	Visit(oRoot, false, false);
	return { strText, nStart, nEnd };
}

// Why a value may not be what the reader expects. "" when there is nothing to say
function NoteFor(oNode: TNode, oResult: ICalcResult, mapValue: ReadonlyMap<TNode, bigint>, oWord: CWordSize | undefined): string {
	if (oWord !== undefined && oResult.biValue !== oResult.biExact) {
		return oResult.bOverflow
			? `${oResult.biExact} does not fit in ${oWord.nBits} bits, wrapped to ${oResult.biValue}`
			: `${oResult.biExact} as ${oWord.nBits}-bit unsigned`;
	}
	if (oNode.eKind === "binary" && oNode.strOp === "/") {
		const biRemainder = (mapValue.get(oNode.oLeft) ?? 0n) % (mapValue.get(oNode.oRight) ?? 1n);
		return biRemainder === 0n ? "" : `integer division : remainder ${biRemainder} dropped`;
	}
	return "";
}

// A number as typed is not a step, and neither is -5 : that is how a negative number is written.
// Both become steps when the word size changed them (300 in 8 bits → 44)
function IsStep(oNode: TNode, strNote: string): boolean {
	if (oNode.eKind === "number" || (oNode.eKind === "unary" && oNode.strOp === "-" && oNode.oOperand.eKind === "number")) {
		return strNote !== "";
	}
	return true;
}

// "100 + 2 = 102" for a calculation, "x → 21" for a name that is looked up
function WorkFor(oNode: TNode, biValue: bigint, mapDone: ReadonlyMap<TNode, bigint>): string {
	const strPart = Draw(oNode, mapDone).strText;
	return oNode.eKind === "ans" || oNode.eKind === "variable" || oNode.eKind === "number" ? `${strPart} → ${biValue}` : `${strPart} = ${biValue}`;
}

// One expression → its steps and its result, or the same error Evaluate() would give
export function Explain(strExpr: string, oWord?: CWordSize, biAns?: bigint, mapVar: ReadonlyMap<string, bigint> = new Map()): TResult<IExplanation, IEvalError> {
	const strTrim = strExpr.trim();
	const oTree = Parse(strTrim);
	if (!oTree.bOk) {
		return oTree;
	}
	const oRoot = oTree.vValue;
	// Keyed by the node object itself : two "1 + 1" in one tree are two different keys
	const mapValue = new Map<TNode, bigint>(); // every part calculated so far
	const mapDone = new Map<TNode, bigint>(); // only the steps : a number as typed keeps its text (0xFF, 'A')
	const arrStep: IStep[] = [];
	const oResult = EvaluateTree(strTrim, oRoot, oWord, biAns, mapVar, (oNode, oCalc) => {
		mapValue.set(oNode, oCalc.biValue);
		const strNote = NoteFor(oNode, oCalc, mapValue, oWord);
		if (!IsStep(oNode, strNote)) {
			return;
		}
		const { strText, nStart, nEnd } = Draw(oRoot, mapDone, oNode);
		arrStep.push({ strExpr: strText, nStart, nEnd, strWork: WorkFor(oNode, oCalc.biValue, mapDone), strNote });
		mapDone.set(oNode, oCalc.biValue);
	});
	if (!oResult.bOk) {
		return oResult;
	}
	return Ok({ arrStep, strLast: Draw(oRoot, mapDone).strText, oEval: oResult.vValue });
}
