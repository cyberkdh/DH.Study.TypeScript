//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 10-lexer-parser / parser
//	History			: 2026-10-15 CYBERKDH Initial
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// Syntax tree + recursive descent parser : tokens → a tree whose shape says what is calculated first

// 1) [TS] The syntax tree : a recursive discriminated union
type EOp = "+" | "-" | "*" | "/";

type TNode =
	| { eKind: "number"; nValue: number }
	| { eKind: "negate"; oOperand: TNode }
	| { eKind: "binary"; strOp: EOp; oLeft: TNode; oRight: TNode };

// const oBad: TNode = { eKind: "binary", strOp: "%", oLeft: { eKind: "number", nValue: 1 }, oRight: { eKind: "number", nValue: 2 } }; // ← Uncomment → red squiggle TS2322 (Type '"%"' is not assignable to type 'EOp')

// 2) [JS + TS] Calculating a tree is recursion : a leaf is its value, a node calculates its children first
function Calc(oNode: TNode): number {
	switch (oNode.eKind) {
		case "number":
			return oNode.nValue;
		case "negate":
			return -Calc(oNode.oOperand);
		case "binary": {
			const nLeft = Calc(oNode.oLeft);
			const nRight = Calc(oNode.oRight);
			switch (oNode.strOp) {
				case "+":
					return nLeft + nRight;
				case "-":
					return nLeft - nRight;
				case "*":
					return nLeft * nRight;
				case "/":
					return nLeft / nRight;
			}
		}
	}
}

// The tree drawn sideways : each child one level deeper
function PrintTree(oNode: TNode, strIndent: string, strBranch: string): void {
	const strLabel = oNode.eKind === "number" ? String(oNode.nValue) : oNode.eKind === "negate" ? "-" : oNode.strOp;
	console.log(`   ${strIndent}${strBranch}${strLabel}`);
	const strChildIndent = strIndent + (strBranch === "├─ " ? "│  " : strBranch === "" ? "" : "   ");
	if (oNode.eKind === "negate") {
		PrintTree(oNode.oOperand, strChildIndent, "└─ ");
	} else if (oNode.eKind === "binary") {
		PrintTree(oNode.oLeft, strChildIndent, "├─ ");
		PrintTree(oNode.oRight, strChildIndent, "└─ ");
	}
}

// 3) Recursive descent : one function per grammar rule. A lower rule binds tighter
//      expression = term   { ("+" | "-") term }
//      term       = factor { ("*" | "/") factor }
//      factor     = number | "-" factor | "(" expression ")"
class CParser {
	readonly #arrToken: string[];
	#nPos = 0;

	constructor(strExpr: string) {
		this.#arrToken = strExpr.match(/\d+|\S/g) ?? []; // a tiny lexer : numbers, or any other single character
	}

	ParseAll(): TNode {
		const oNode = this.#ParseExpression();
		if (this.#Peek() !== "") {
			throw new SyntaxError(`expected an operator or the end, found "${this.#Peek()}"`);
		}
		return oNode;
	}

	#ParseExpression(): TNode {
		let oLeft = this.#ParseTerm();
		while (this.#Peek() === "+" || this.#Peek() === "-") {
			const strOp = this.#Next() as EOp;
			oLeft = { eKind: "binary", strOp, oLeft, oRight: this.#ParseTerm() }; // the loop makes 8 - 4 - 2 = (8 - 4) - 2
		}
		return oLeft;
	}

	#ParseTerm(): TNode {
		let oLeft = this.#ParseFactor();
		while (this.#Peek() === "*" || this.#Peek() === "/") {
			const strOp = this.#Next() as EOp;
			oLeft = { eKind: "binary", strOp, oLeft, oRight: this.#ParseFactor() };
		}
		return oLeft;
	}

	#ParseFactor(): TNode {
		const strToken = this.#Next();
		if (/^\d+$/.test(strToken)) {
			return { eKind: "number", nValue: Number(strToken) };
		}
		if (strToken === "-") {
			return { eKind: "negate", oOperand: this.#ParseFactor() };
		}
		if (strToken === "(") {
			const oInside = this.#ParseExpression(); // recursion : a whole expression inside ( )
			if (this.#Next() !== ")") {
				throw new SyntaxError(`expected ")"`);
			}
			return oInside;
		}
		throw new SyntaxError(`expected a number, "-" or "(", found ${strToken === "" ? "the end" : `"${strToken}"`}`);
	}

	#Peek(): string {
		return this.#arrToken[this.#nPos] ?? ""; // "" = the end
	}

	#Next(): string {
		const strToken = this.#Peek();
		this.#nPos++;
		return strToken;
	}
}

function Parse(strExpr: string): TNode {
	return new CParser(strExpr).ParseAll();
}

for (const strExpr of ["1 + 2 * 3", "(1 + 2) * 3", "8 - 4 - 2", "-(2 + 3) * 4"]) {
	const oTree = Parse(strExpr);
	console.log(`3) ${strExpr} = ${Calc(oTree)}`);
	PrintTree(oTree, "", "");
}

// 4) Wrong input stops at the first token that does not fit the grammar
for (const strExpr of ["1 + * 2", "(1 + 2", "1 2"]) {
	try {
		Parse(strExpr);
	} catch (e) {
		console.log(`4) Expected error: "${strExpr}" → ${(e as Error).name}: ${(e as Error).message}`);
	}
}
console.log("   Why : each rule says which token may come next; anything else is a syntax error.");
console.log("   Fix : fix the input. A real parser also reports the column (devcalc/src/core/Parser.ts).");
