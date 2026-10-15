//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 10-lexer-parser / parser (파서)
//	History			: 2026-10-15 CYBERKDH Initial (최초 작성)
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// 구문 트리 (syntax tree) + 재귀 하강 파서 (recursive descent parser) : 토큰 → 무엇을 먼저 계산할지를 구조로 나타내는 트리

// 1) [TS] 구문 트리 : 재귀적인 판별 유니온
type EOp = "+" | "-" | "*" | "/";

type TNode =
	| { eKind: "number"; nValue: number }
	| { eKind: "negate"; oOperand: TNode }
	| { eKind: "binary"; strOp: EOp; oLeft: TNode; oRight: TNode };

// const oBad: TNode = { eKind: "binary", strOp: "%", oLeft: { eKind: "number", nValue: 1 }, oRight: { eKind: "number", nValue: 2 } }; // ← 주석을 풀면 빨간 줄 TS2322 ('"%"' 타입은 'EOp' 에 대입할 수 없음)

// 2) [JS + TS] 트리 계산은 재귀 : 리프 노드 (leaf) 는 자기 값, 내부 노드는 자식들을 먼저 계산
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

// 옆으로 그린 트리 : 자식은 한 단계 더 들여씀
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

// 3) 재귀 하강 : 문법 규칙 (grammar rule) 하나에 함수 하나. 아래 규칙일수록 더 강하게 묶음
//      expression = term   { ("+" | "-") term }
//      term       = factor { ("*" | "/") factor }
//      factor     = number | "-" factor | "(" expression ")"
class CParser {
	readonly #arrToken: string[];
	#nPos = 0;

	constructor(strExpr: string) {
		this.#arrToken = strExpr.match(/\d+|\S/g) ?? []; // 아주 작은 렉서 : 숫자, 또는 그 밖의 글자 하나
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
			oLeft = { eKind: "binary", strOp, oLeft, oRight: this.#ParseTerm() }; // 반복문 덕분에 8 - 4 - 2 = (8 - 4) - 2
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
			const oInside = this.#ParseExpression(); // 재귀 : ( ) 안에는 식 전체
			if (this.#Next() !== ")") {
				throw new SyntaxError(`expected ")"`);
			}
			return oInside;
		}
		throw new SyntaxError(`expected a number, "-" or "(", found ${strToken === "" ? "the end" : `"${strToken}"`}`);
	}

	#Peek(): string {
		return this.#arrToken[this.#nPos] ?? ""; // "" = 끝
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

// 4) 잘못된 입력은 문법에 맞지 않는 첫 토큰에서 멈춤
for (const strExpr of ["1 + * 2", "(1 + 2", "1 2"]) {
	try {
		Parse(strExpr);
	} catch (e) {
		console.log(`4) Expected error: "${strExpr}" → ${(e as Error).name}: ${(e as Error).message}`);
	}
}
console.log("   Why : each rule says which token may come next; anything else is a syntax error.");
console.log("   Fix : fix the input. A real parser also reports the column (devcalc/src/core/Parser.ts).");
