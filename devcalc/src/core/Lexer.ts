//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: devcalc / core / Lexer (Expression text → tokens)
//	History			: 2026-10-15 CYBERKDH Initial - Lesson 10 DevCalc step, Lv5
//					  2026-10-15 CYBERKDH Lesson 11: ParseLiteral (1'000 1Fh 4K), character literals ('A'), ~ stands alone, SplitExpressions, Lv6
//					  2026-10-15 CYBERKDH Lesson 13: "name" tokens (ans, variables, functions), "comma", "assign" (=), Lv8
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

import type { IEvalError } from "./Evaluate.ts"; // type only : erased at run time, so no import cycle
import { Err, Ok, type TResult } from "./Result.ts";
import { ParseChar, ParseLiteral } from "./Literal.ts";
import { IsOperator, IsUnaryOperator, OperatorHelp, type TOperator, type TUnaryOperator } from "./Calculator.ts";

// One token. nCol is the 1-based column of its first character, for error messages
export type TToken =
	| { readonly eKind: "number"; readonly strText: string; readonly nCol: number; readonly biValue: bigint }
	| { readonly eKind: "operator"; readonly strText: TOperator | TUnaryOperator; readonly nCol: number }
	| { readonly eKind: "name" | "assign" | "comma" | "open" | "close" | "end"; readonly strText: string; readonly nCol: number };

// Sticky (y) regexes : they match only at lastIndex, never further on
const RE_SPACE = /\s+/y;
const RE_NUMBER = /[0-9][0-9A-Za-z_']*/y; // 0xFF, 1'000, 1Fh, 4K, 12a (ParseLiteral says what is wrong)
const RE_CHAR = /'(?:\\.|[^'\\])*'/y; // 'A', 'AB', '\n', '\'' : a backslash and the next character stay together
const RE_NAME = /[A-Za-z_][0-9A-Za-z_]*/y;
const RE_OPERATOR = /[*/%&|^<>=!]+|[+\-~]/y; // a run, so ** and >>> are read whole; + - ~ stand alone : 2*-1, ~~0

const NUMBER_FIX = "use an integer like 255, -0xFF, 0b1010, 0o17, 1_000, 1'000, 1Fh, 4K or 'A'.";

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
			const oParsed = ParseLiteral(strNumber);
			if (!oParsed.bOk) {
				return Err({ strTitle: `Invalid input: "${strNumber}"`, strWhy: oParsed.strError, strFix: NUMBER_FIX });
			}
			arrToken.push({ eKind: "number", strText: strNumber, nCol, biValue: oParsed.biValue });
			nPos += strNumber.length;
			continue;
		}
		if (strExpr.charAt(nPos) === "'") {
			const strChar = MatchAt(RE_CHAR, strExpr, nPos);
			if (strChar === "") {
				return Err({ strTitle: `Invalid input: "${strExpr.slice(nPos)}"`, strWhy: `no closing ' for the ' at column ${nCol}`, strFix: NUMBER_FIX });
			}
			const oParsed = ParseChar(strChar.slice(1, -1)); // without the quotes
			if (!oParsed.bOk) {
				return Err({ strTitle: `Invalid input: "${strChar}"`, strWhy: oParsed.strError, strFix: NUMBER_FIX });
			}
			arrToken.push({ eKind: "number", strText: strChar, nCol, biValue: oParsed.biValue });
			nPos += strChar.length;
			continue;
		}
		// Lesson 13: ans, a variable or a function. The parser decides which (a function is followed by "(")
		const strName = MatchAt(RE_NAME, strExpr, nPos);
		if (strName !== "") {
			arrToken.push({ eKind: "name", strText: strName, nCol });
			nPos += strName.length;
			continue;
		}
		const strOp = MatchAt(RE_OPERATOR, strExpr, nPos);
		if (strOp === "=") {
			arrToken.push({ eKind: "assign", strText: strOp, nCol }); // lesson 13 : mask = 0xFF00 (== is still an unknown operator)
			nPos += 1;
			continue;
		}
		if (strOp !== "") {
			if (!IsOperator(strOp) && !IsUnaryOperator(strOp)) {
				return Err({
					strTitle: `Invalid operator: "${strOp}"`,
					strWhy: `supported operators are ${OperatorHelp()}`,
					strFix: `e.g. "(0xFF + 1) << 4" (quote the expression).`,
				});
			}
			arrToken.push({ eKind: "operator", strText: strOp, nCol });
			nPos += strOp.length;
			continue;
		}
		const strChar = strExpr.charAt(nPos);
		if (strChar === ",") {
			arrToken.push({ eKind: "comma", strText: strChar, nCol }); // lesson 13 : between function arguments
			nPos += 1;
			continue;
		}
		if (strChar !== "(" && strChar !== ")") {
			return Err({
				strTitle: `Invalid character: "${strChar}"`,
				strWhy: `column ${nCol} : an expression has numbers, 'characters', names, operators, ( ) and ,`,
				strFix: `e.g. "(0xFF + 1) << 4". Operators: ${OperatorHelp()}`,
			});
		}
		arrToken.push({ eKind: strChar === "(" ? "open" : "close", strText: strChar, nCol });
		nPos += 1;
	}
	arrToken.push({ eKind: "end", strText: "", nCol: strExpr.length + 1 });
	return Ok(arrToken);
}

// "a; b; c" → ["a", "b", "c"]. A ; inside a character literal (';') does not split : the g regex takes
// either a whole 'literal' (closed or not) or one character that is neither ; nor '
const RE_EXPRESSION_PART = /(?:'(?:\\.|[^'\\])*'?|[^;'])+/g;

export function SplitExpressions(strInput: string): string[] {
	const arrPart = (strInput.match(RE_EXPRESSION_PART) ?? []).map((strPart) => strPart.trim()).filter((strPart) => strPart !== "");
	return arrPart.length > 0 ? arrPart : [strInput]; // only ";" or spaces : let Evaluate explain what is wrong
}
