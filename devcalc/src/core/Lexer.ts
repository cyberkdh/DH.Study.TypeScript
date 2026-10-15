//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: devcalc / core / Lexer (Expression text → tokens)
//	History			: 2026-10-15 CYBERKDH Initial - Lesson 10 DevCalc step, Lv5
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

import type { IEvalError } from "./Evaluate.ts"; // type only : erased at run time, so no import cycle
import { Err, Ok, type TResult } from "./Result.ts";
import { ParseInteger } from "./Parse.ts";
import { IsOperator, OperatorList, type TOperator } from "./Calculator.ts";

// One token. nCol is the 1-based column of its first character, for error messages
export type TToken =
	| { readonly eKind: "number"; readonly strText: string; readonly nCol: number; readonly biValue: bigint }
	| { readonly eKind: "operator"; readonly strText: TOperator; readonly nCol: number }
	| { readonly eKind: "ans" | "open" | "close" | "end"; readonly strText: string; readonly nCol: number };

// Sticky (y) regexes : they match only at lastIndex, never further on
const RE_SPACE = /\s+/y;
const RE_NUMBER = /[0-9][0-9A-Za-z_]*/y; // 0xFF, 1_000, 12a (ParseInteger says what is wrong)
const RE_NAME = /[A-Za-z_][0-9A-Za-z_]*/y;
const RE_OPERATOR = /[*/%&|^<>=!~]+|[+-]/y; // a run, so ** and >>> are read whole (and rejected); + and - stand alone : 2*-1

const ANS = "ans";
const NUMBER_FIX = "use an integer like 255, -0xFF, 0b1010, 0o17 or 1_000.";

// The text reToken matches exactly at nPos, or "" when it doesn't match there
function MatchAt(reToken: RegExp, strText: string, nPos: number): string {
	reToken.lastIndex = nPos;
	return reToken.exec(strText)?.[0] ?? "";
}

// The text → tokens, always ending with an "end" token. The first problem is returned as an error
export function Lex(strExpr: string): TResult<TToken[], IEvalError> {
	const arrToken: TToken[] = [];
	let nPos = 0;
	while (nPos < strExpr.length) {
		const nCol = nPos + 1;
		const strSpace = MatchAt(RE_SPACE, strExpr, nPos);
		if (strSpace !== "") {
			nPos += strSpace.length;
			continue;
		}
		const strNumber = MatchAt(RE_NUMBER, strExpr, nPos);
		if (strNumber !== "") {
			const oParsed = ParseInteger(strNumber);
			if (!oParsed.bOk) {
				return Err({ strTitle: `Invalid input: "${strNumber}"`, strWhy: oParsed.strError, strFix: NUMBER_FIX });
			}
			arrToken.push({ eKind: "number", strText: strNumber, nCol, biValue: oParsed.biValue });
			nPos += strNumber.length;
			continue;
		}
		const strName = MatchAt(RE_NAME, strExpr, nPos);
		if (strName !== "") {
			if (strName.toLowerCase() !== ANS) {
				return Err({ strTitle: `Invalid input: "${strName}"`, strWhy: `"${strName}" is not a number, and the only name is ans`, strFix: NUMBER_FIX });
			}
			arrToken.push({ eKind: "ans", strText: strName, nCol });
			nPos += strName.length;
			continue;
		}
		const strOp = MatchAt(RE_OPERATOR, strExpr, nPos);
		if (strOp !== "") {
			if (!IsOperator(strOp)) {
				return Err({
					strTitle: `Invalid operator: "${strOp}"`,
					strWhy: `supported operators are ${OperatorList()}`,
					strFix: `e.g. "(0xFF + 1) << 4" (quote the expression).`,
				});
			}
			arrToken.push({ eKind: "operator", strText: strOp, nCol });
			nPos += strOp.length;
			continue;
		}
		const strChar = strExpr.charAt(nPos);
		if (strChar !== "(" && strChar !== ")") {
			return Err({
				strTitle: `Invalid character: "${strChar}"`,
				strWhy: `column ${nCol} : an expression has numbers, ans, operators and ( )`,
				strFix: `e.g. "(0xFF + 1) << 4". Operators: ${OperatorList()}`,
			});
		}
		arrToken.push({ eKind: strChar === "(" ? "open" : "close", strText: strChar, nCol });
		nPos += 1;
	}
	arrToken.push({ eKind: "end", strText: "", nCol: strExpr.length + 1 });
	return Ok(arrToken);
}
