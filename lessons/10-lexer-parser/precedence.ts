//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 10-lexer-parser / precedence
//	History			: 2026-10-15 CYBERKDH Initial
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// Build it : precedence climbing. One function and a table replace one function per precedence level

// 1) [TS] The table : precedence (higher binds tighter) and associativity per operator
type EAssoc = "left" | "right";

interface IOpInfo {
	readonly nPrecedence: number;
	readonly eAssoc: EAssoc;
	readonly fnApply: (nLeft: number, nRight: number) => number;
}

type TTable = Readonly<Record<string, IOpInfo>>;

const TABLE: TTable = {
	"+": { nPrecedence: 1, eAssoc: "left", fnApply: (nLeft, nRight) => nLeft + nRight },
	"-": { nPrecedence: 1, eAssoc: "left", fnApply: (nLeft, nRight) => nLeft - nRight },
	"*": { nPrecedence: 2, eAssoc: "left", fnApply: (nLeft, nRight) => nLeft * nRight },
	"/": { nPrecedence: 2, eAssoc: "left", fnApply: (nLeft, nRight) => nLeft / nRight },
	"**": { nPrecedence: 3, eAssoc: "right", fnApply: (nLeft, nRight) => nLeft ** nRight }, // 2 ** 3 ** 2 = 2 ** (3 ** 2)
};

// 2) The parser. It calculates while it parses (no tree), and can print each call
function Parse(strExpr: string, oTable: TTable, bTrace: boolean): number {
	const arrToken = strExpr.match(/\d+|\*\*|\S/g) ?? []; // ** is one token
	let nPos = 0;

	// Reads one operand, then every operator whose precedence is at least nMin
	function Expression(nMin: number, nDepth: number): number {
		const strIndent = "   ".repeat(nDepth);
		if (bTrace) {
			console.log(`   ${strIndent}Expression(min ${nMin}) at "${arrToken[nPos] ?? "the end"}"`);
		}
		let nLeft = Operand(nDepth);
		for (;;) {
			const strOp = arrToken[nPos] ?? "";
			const oInfo = oTable[strOp];
			if (oInfo === undefined || oInfo.nPrecedence < nMin) {
				break; // not an operator, or one that binds looser : the caller takes it
			}
			nPos++;
			// left : the right side may only take tighter operators. right : the same operator may repeat there
			const nNextMin = oInfo.eAssoc === "left" ? oInfo.nPrecedence + 1 : oInfo.nPrecedence;
			const nRight = Expression(nNextMin, nDepth + 1);
			if (bTrace) {
				console.log(`   ${strIndent}${nLeft} ${strOp} ${nRight}`);
			}
			nLeft = oInfo.fnApply(nLeft, nRight);
		}
		return nLeft;
	}

	function Operand(nDepth: number): number {
		const strToken = arrToken[nPos++] ?? "";
		if (strToken === "(") {
			const nInside = Expression(1, nDepth + 1);
			if (arrToken[nPos++] !== ")") {
				throw new SyntaxError(`expected ")"`);
			}
			return nInside;
		}
		if (!/^\d+$/.test(strToken)) {
			throw new SyntaxError(`expected a number or "(", found ${strToken === "" ? "the end" : `"${strToken}"`}`);
		}
		return Number(strToken);
	}

	const nValue = Expression(1, 0);
	if (nPos < arrToken.length) {
		throw new SyntaxError(`expected an operator or the end, found "${arrToken[nPos]}"`);
	}
	return nValue;
}

for (const strExpr of ["1 + 2 * 3", "(1 + 2) * 3", "8 - 4 - 2", "2 ** 3 ** 2", "2 * 3 ** 2"]) {
	console.log(`2) ${strExpr.padEnd(11)} = ${Parse(strExpr, TABLE, false)}`);
}

// 3) The trace : 1 + 2 * 3. * is calculated inside the call that + made for its right side
console.log("3) Trace of 1 + 2 * 3");
Parse("1 + 2 * 3", TABLE, true);

// 4) The table decides everything : the same parser with "-" marked right-associative
const WRONG_TABLE: TTable = { ...TABLE, "-": { ...TABLE["-"]!, eAssoc: "right" } };
console.log("4) Expected error (a wrong answer, not an exception): 8 - 4 - 2 =", Parse("8 - 4 - 2", WRONG_TABLE, false));
console.log("   Why : right-associative reads it as 8 - (4 - 2) = 6, but - is left-associative : (8 - 4) - 2 = 2.");
console.log("   Fix : only ** (and assignment =) are right-associative; keep - left. A test catches this.");

// 5) A new operator is one table row. The parser does not change
const MOD_TABLE: TTable = { ...TABLE, "%": { nPrecedence: 2, eAssoc: "left", fnApply: (nLeft, nRight) => nLeft % nRight } };
console.log("5) 1 + 17 % 5 * 2 =", Parse("1 + 17 % 5 * 2", MOD_TABLE, false));
