//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: devcalc / core / Parser (Tokens → syntax tree)
//	History			: 2026-10-15 CYBERKDH Initial - Lesson 10 DevCalc step, Lv5
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// Grammar (one function per line, each calls the next one down) :
//   expression = unary { operator unary }        operators by precedence (OPERATOR_TABLE)
//   unary      = "-" unary | primary
//   primary    = number | ans | "(" expression ")"

import type { IEvalError } from "./Evaluate.ts"; // type only : erased at run time, so no import cycle
import { Err, Ok, type TResult } from "./Result.ts";
import { OperatorList, OperatorPrecedence, type TOperator } from "./Calculator.ts";
import { Lex, type TToken } from "./Lexer.ts";

// The syntax tree : a discriminated union on eKind. A node holds more nodes, so the type refers to itself
export type TNode =
	| { readonly eKind: "number"; readonly biValue: bigint }
	| { readonly eKind: "ans"; readonly strText: string }
	| { readonly eKind: "negate"; readonly oOperand: TNode }
	| { readonly eKind: "binary"; readonly strOp: TOperator; readonly oLeft: TNode; readonly oRight: TNode };

const MAX_DEPTH = 100; // ( and - nest by recursion : a limit keeps "((((…" from overflowing the call stack

// Thrown inside the parser only. Parse() turns it into an Err, so callers never see it
class CParseError extends Error {
	override readonly name = "CParseError";
}

function Describe(oToken: TToken): string {
	return oToken.eKind === "end" ? "the end" : `"${oToken.strText}" at column ${oToken.nCol}`;
}

class CParser {
	readonly #arrToken: readonly TToken[];
	#nPos = 0;
	#nDepth = 0;

	constructor(arrToken: readonly TToken[]) {
		this.#arrToken = arrToken;
	}

	ParseAll(): TNode {
		const oNode = this.#Expression(0);
		const oNext = this.#Peek();
		if (oNext.eKind !== "end") {
			throw new CParseError(`expected an operator or the end, found ${Describe(oNext)}`);
		}
		return oNode;
	}

	// Precedence climbing : one operand, then every operator with a precedence of at least nMinPrecedence.
	// The right side asks for a higher minimum, so 1 + 2 * 3 is 1 + (2 * 3) and 8 - 4 - 2 is (8 - 4) - 2
	#Expression(nMinPrecedence: number): TNode {
		let oLeft = this.#Unary();
		for (;;) {
			const oNext = this.#Peek();
			if (oNext.eKind !== "operator" || OperatorPrecedence(oNext.strText) < nMinPrecedence) {
				return oLeft;
			}
			this.#nPos++;
			const oRight = this.#Expression(OperatorPrecedence(oNext.strText) + 1);
			oLeft = { eKind: "binary", strOp: oNext.strText, oLeft, oRight };
		}
	}

	#Unary(): TNode {
		const oNext = this.#Peek();
		if (oNext.eKind === "operator" && oNext.strText === "-") {
			this.#nPos++;
			return { eKind: "negate", oOperand: this.#Nested(() => this.#Unary()) };
		}
		return this.#Primary();
	}

	#Primary(): TNode {
		const oToken = this.#Peek();
		this.#nPos++;
		switch (oToken.eKind) {
			case "number":
				return { eKind: "number", biValue: oToken.biValue };
			case "ans":
				return { eKind: "ans", strText: oToken.strText };
			case "open": {
				const oInside = this.#Nested(() => this.#Expression(0));
				const oClose = this.#Peek();
				if (oClose.eKind !== "close") {
					throw new CParseError(`expected ")" for the "(" at column ${oToken.nCol}, found ${Describe(oClose)}`);
				}
				this.#nPos++;
				return oInside;
			}
			default:
				throw new CParseError(`expected a number, ans or "(", found ${Describe(oToken)}`);
		}
	}

	#Nested(fnParse: () => TNode): TNode {
		if (this.#nDepth >= MAX_DEPTH) {
			throw new CParseError(`more than ${MAX_DEPTH} levels of "(" or "-"`);
		}
		this.#nDepth++;
		try {
			return fnParse();
		} finally {
			this.#nDepth--;
		}
	}

	#Peek(): TToken {
		return this.#arrToken[this.#nPos] ?? { eKind: "end", strText: "", nCol: 0 }; // Lex always ends the list with "end"
	}
}

// The text → a syntax tree, or the first problem as an error
export function Parse(strExpr: string): TResult<TNode, IEvalError> {
	const oTokens = Lex(strExpr);
	if (!oTokens.bOk) {
		return oTokens;
	}
	try {
		return Ok(new CParser(oTokens.vValue).ParseAll());
	} catch (e) {
		if (e instanceof CParseError) {
			return Err({ strTitle: `Invalid expression: "${strExpr}"`, strWhy: e.message, strFix: `e.g. "(0xFF + 1) << 4". Operators: ${OperatorList()}` });
		}
		throw e; // not ours : a bug
	}
}

// The tree back to text, every binary node in ( ) : shows how the parser grouped the expression
export function ToText(oNode: TNode): string {
	switch (oNode.eKind) {
		case "number":
			return String(oNode.biValue);
		case "ans":
			return oNode.strText;
		case "negate":
			return `-${ToText(oNode.oOperand)}`;
		case "binary":
			return `(${ToText(oNode.oLeft)} ${oNode.strOp} ${ToText(oNode.oRight)})`;
	}
}
