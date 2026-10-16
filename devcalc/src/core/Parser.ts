//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: devcalc / core / Parser (Tokens → syntax tree)
//	History			: 2026-10-15 CYBERKDH Initial - Lesson 10 DevCalc step, Lv5
//					  2026-10-15 CYBERKDH Lesson 11: "unary" node (- ~), right-associative **, "-2 ** 2" is an error (as in JavaScript)
//					  2026-10-15 CYBERKDH Lesson 13: statement (name = expression), "call" / "variable" / "assign" nodes, CParseError.strFix
//					  2026-10-16 CYBERKDH Lesson 16: a "number" node keeps its text (0xFF stays 0xFF in the steps view)
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// Grammar (one function per line, each calls the next one down) :
//   statement  = [ name "=" ] expression         lesson 13 : mask = 0xFF00
//   expression = unary { operator unary }        operators by precedence and associativity (OPERATOR_TABLE)
//   unary      = ("-" | "~") unary | primary
//   primary    = number | name | name "(" [ expression { "," expression } ] ")" | "(" expression ")"
//                a number includes 'A' (lesson 11). A name is ans or a variable, or a function when "(" follows (lesson 13)

import type { IEvalError } from "./Evaluate.ts"; // type only : erased at run time, so no import cycle
import { Err, Ok, type TResult } from "./Result.ts";
import { IsOperator, IsUnaryOperator, OperatorAssoc, OperatorHelp, OperatorPrecedence, type TOperator, type TUnaryOperator } from "./Calculator.ts";
import { Lex, type TToken } from "./Lexer.ts";
import { CheckArgCount, FunctionHelp, FunctionUsage, IsFunction, type TFunction } from "./Functions.ts";

// The syntax tree : a discriminated union on eKind. A node holds more nodes, so the type refers to itself
export type TNode =
	| { readonly eKind: "number"; readonly biValue: bigint; readonly strText: string } // lesson 16 : strText as typed (0xFF, 'A', 4K)
	| { readonly eKind: "ans"; readonly strText: string }
	| { readonly eKind: "variable"; readonly strName: string } // lesson 13 : lower case, the key in the variable map
	| { readonly eKind: "call"; readonly eFunction: TFunction; readonly arrArg: readonly TNode[] }
	| { readonly eKind: "assign"; readonly strName: string; readonly oValue: TNode } // only at the top of the tree
	| { readonly eKind: "unary"; readonly strOp: TUnaryOperator; readonly oOperand: TNode }
	| { readonly eKind: "binary"; readonly strOp: TOperator; readonly oLeft: TNode; readonly oRight: TNode };

const MAX_DEPTH = 100; // ( - ~ ** and calls nest by recursion : a limit keeps "((((…" from overflowing the call stack
const ANS = "ans";
const EXPRESSION_FIX = `e.g. "(0xFF + 1) << 4". Operators: ${OperatorHelp()}`;

// Thrown inside the parser only. Parse() turns it into an Err, so callers never see it.
// Lesson 13: a mistake with a function or a name comes with its own fix
class CParseError extends Error {
	override readonly name = "CParseError";
	readonly strFix: string;

	constructor(strMessage: string, strFix = EXPRESSION_FIX) {
		super(strMessage);
		this.strFix = strFix;
	}
}

function Describe(oToken: TToken): string {
	return oToken.eKind === "end" ? "the end" : `"${oToken.strText}" at column ${oToken.nCol}`;
}

// Lesson 13: a name that can't hold a value, and why
function ReservedReason(strKey: string): string | undefined {
	if (strKey === ANS) {
		return "ans is the previous result";
	}
	return IsFunction(strKey) ? `${strKey} is a function` : undefined;
}

class CParser {
	readonly #arrToken: readonly TToken[];
	#nPos = 0;
	#nDepth = 0;

	constructor(arrToken: readonly TToken[]) {
		this.#arrToken = arrToken;
	}

	ParseAll(): TNode {
		const oNode = this.#Statement();
		const oNext = this.#Peek();
		if (oNext.eKind === "assign") {
			throw new CParseError(`"=" at column ${oNext.nCol} can only follow a name at the start`, 'e.g. "mask = 0xFF00", then "0x1234 & mask".');
		}
		if (oNext.eKind !== "end") {
			throw new CParseError(`expected an operator or the end, found ${Describe(oNext)}`);
		}
		return oNode;
	}

	// Lesson 13: "name = expression", or just an expression
	#Statement(): TNode {
		const oFirst = this.#Peek();
		if (oFirst.eKind !== "name" || this.#Peek(1).eKind !== "assign") {
			return this.#Expression(0);
		}
		const strName = oFirst.strText.toLowerCase(); // names ignore case : Mask and MASK are mask
		const strReserved = ReservedReason(strName);
		if (strReserved !== undefined) {
			throw new CParseError(`cannot assign to "${oFirst.strText}" : ${strReserved}`, 'choose another name, e.g. "mask = 0xFF00".');
		}
		this.#nPos += 2;
		return { eKind: "assign", strName, oValue: this.#Expression(0) };
	}

	// Precedence climbing : one operand, then every operator with a precedence of at least nMinPrecedence.
	// The right side asks for a higher minimum, so 1 + 2 * 3 is 1 + (2 * 3) and 8 - 4 - 2 is (8 - 4) - 2.
	// Lesson 11: a right-associative operator lets the same precedence continue : 2 ** 3 ** 2 is 2 ** (3 ** 2)
	#Expression(nMinPrecedence: number): TNode {
		const oFirst = this.#Peek();
		let oLeft = this.#Unary();
		for (;;) {
			const oNext = this.#Peek();
			if (oNext.eKind !== "operator" || !IsOperator(oNext.strText) || OperatorPrecedence(oNext.strText) < nMinPrecedence) {
				return oLeft;
			}
			const strOp: TOperator = oNext.strText;
			if (strOp === "**" && oLeft.eKind === "unary" && oFirst.eKind === "operator") {
				// -2 ** 2 : 4 in some languages, -4 in others. JavaScript makes it an error, and so does DevCalc
				throw new CParseError(`"${oFirst.strText}x ** y" is ambiguous ("**" at column ${oNext.nCol}) : write (${oFirst.strText}x) ** y or ${oFirst.strText}(x ** y)`);
			}
			this.#nPos++;
			const nPrecedence = OperatorPrecedence(strOp);
			const nRightMin = OperatorAssoc(strOp) === "right" ? nPrecedence : nPrecedence + 1;
			const oRight = this.#Nested(() => this.#Expression(nRightMin));
			oLeft = { eKind: "binary", strOp, oLeft, oRight };
		}
	}

	#Unary(): TNode {
		const oNext = this.#Peek();
		if (oNext.eKind === "operator" && IsUnaryOperator(oNext.strText)) {
			this.#nPos++;
			return { eKind: "unary", strOp: oNext.strText, oOperand: this.#Nested(() => this.#Unary()) };
		}
		return this.#Primary();
	}

	#Primary(): TNode {
		const oToken = this.#Peek();
		this.#nPos++;
		switch (oToken.eKind) {
			case "number":
				return { eKind: "number", biValue: oToken.biValue, strText: oToken.strText };
			case "name":
				return this.#Name(oToken);
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
				throw new CParseError(`expected a number, a name or "(", found ${Describe(oToken)}`);
		}
	}

	// Lesson 13: ans, a variable, or a function call
	#Name(oToken: TToken): TNode {
		const strKey = oToken.strText.toLowerCase(); // names ignore case : POPCOUNT, Mask, ANS
		if (this.#Peek().eKind !== "open") {
			if (IsFunction(strKey)) {
				throw new CParseError(`"${oToken.strText}" at column ${oToken.nCol} is a function`, `call it : ${FunctionUsage(strKey)}.`);
			}
			return strKey === ANS ? { eKind: "ans", strText: oToken.strText } : { eKind: "variable", strName: strKey };
		}
		if (!IsFunction(strKey)) {
			throw new CParseError(`"${oToken.strText}" at column ${oToken.nCol} is not a function`, `functions: ${FunctionHelp()}`);
		}
		this.#nPos++; // the "("
		const arrArg = this.#Arguments(strKey, oToken);
		const strCount = CheckArgCount(strKey, arrArg.length);
		if (strCount !== undefined) {
			throw new CParseError(`${strCount} (column ${oToken.nCol})`, `e.g. ${FunctionUsage(strKey)}.`);
		}
		return { eKind: "call", eFunction: strKey, arrArg };
	}

	// The arguments after "(", up to and including ")" : nothing, "x", "x, n", ...
	#Arguments(eFunction: TFunction, oName: TToken): TNode[] {
		const arrArg: TNode[] = [];
		if (this.#Peek().eKind === "close") {
			this.#nPos++;
			return arrArg;
		}
		for (;;) {
			arrArg.push(this.#Nested(() => this.#Expression(0)));
			const oNext = this.#Peek();
			this.#nPos++;
			if (oNext.eKind === "close") {
				return arrArg;
			}
			if (oNext.eKind !== "comma") {
				throw new CParseError(`expected "," or ")" for the "${oName.strText}(" at column ${oName.nCol}, found ${Describe(oNext)}`, `e.g. ${FunctionUsage(eFunction)}.`);
			}
		}
	}

	#Nested(fnParse: () => TNode): TNode {
		if (this.#nDepth >= MAX_DEPTH) {
			throw new CParseError(`more than ${MAX_DEPTH} levels of "(", "-", "~", "**" or calls`);
		}
		this.#nDepth++;
		try {
			return fnParse();
		} finally {
			this.#nDepth--;
		}
	}

	#Peek(nAhead = 0): TToken {
		return this.#arrToken[this.#nPos + nAhead] ?? { eKind: "end", strText: "", nCol: 0 }; // Lex always ends the list with "end"
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
			return Err({ strTitle: `Invalid expression: "${strExpr}"`, strWhy: e.message, strFix: e.strFix });
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
		case "variable":
			return oNode.strName;
		case "call":
			return `${oNode.eFunction}(${oNode.arrArg.map(ToText).join(", ")})`;
		case "assign":
			return `${oNode.strName} = ${ToText(oNode.oValue)}`;
		case "unary":
			return `${oNode.strOp}${ToText(oNode.oOperand)}`;
		case "binary":
			return `(${ToText(oNode.oLeft)} ${oNode.strOp} ${ToText(oNode.oRight)})`;
	}
}
