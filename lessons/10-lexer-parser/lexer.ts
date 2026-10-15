//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 10-lexer-parser / lexer
//	History			: 2026-10-15 CYBERKDH Initial
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// Lexer (tokenizer) : text → a list of tokens. After this, nobody looks at single characters again

// 1) [TS] A token is a discriminated union : each kind has only the fields it needs.
//    nCol (1-based column) is kept for error messages
type EOp = "+" | "-" | "*" | "/";

type TToken =
	| { eKind: "number"; nValue: number; nCol: number }
	| { eKind: "operator"; strOp: EOp; nCol: number }
	| { eKind: "open" | "close" | "end"; nCol: number };

type TLexResult = { bOk: true; arrToken: TToken[] } | { bOk: false; strError: string; nCol: number };

function IsOp(strChar: string): strChar is EOp {
	return strChar === "+" || strChar === "-" || strChar === "*" || strChar === "/";
}

function IsDigit(strChar: string): boolean {
	return strChar >= "0" && strChar <= "9";
}

// 2) [JS + TS] The scanning loop : look at the character at nPos, read one token, move nPos past it
function Lex(strExpr: string): TLexResult {
	const arrToken: TToken[] = [];
	let nPos = 0;
	while (nPos < strExpr.length) {
		const strChar = strExpr.charAt(nPos);
		const nCol = nPos + 1;
		if (strChar === " ") {
			nPos++; // spaces only separate tokens
		} else if (IsDigit(strChar)) {
			const nStart = nPos;
			while (IsDigit(strExpr.charAt(nPos))) {
				nPos++; // a number is as many digits as follow (charAt past the end is "")
			}
			arrToken.push({ eKind: "number", nValue: Number(strExpr.slice(nStart, nPos)), nCol });
		} else if (IsOp(strChar)) {
			arrToken.push({ eKind: "operator", strOp: strChar, nCol });
			nPos++;
		} else if (strChar === "(" || strChar === ")") {
			arrToken.push({ eKind: strChar === "(" ? "open" : "close", nCol });
			nPos++;
		} else {
			return { bOk: false, strError: `unexpected character "${strChar}"`, nCol };
		}
	}
	arrToken.push({ eKind: "end", nCol: strExpr.length + 1 }); // the parser can always look one token ahead
	return { bOk: true, arrToken };
}

// Each kind is shown differently : a switch over eKind, narrowed in every case
function ShowToken(oToken: TToken): string {
	switch (oToken.eKind) {
		case "number":
			return `[number ${oToken.nValue}]`;
		case "operator":
			return `[op ${oToken.strOp}]`;
		case "open":
			return "[(]";
		case "close":
			return "[)]";
		case "end":
			return "[end]";
	}
}

for (const strExpr of ["12 + 3*(40 - 1)", "7/2", ""]) {
	const oResult = Lex(strExpr);
	if (oResult.bOk) {
		console.log(`2) "${strExpr}" →`, oResult.arrToken.map(ShowToken).join(" "));
	}
}
// const oBad: TToken = { eKind: "operator", strOp: "%", nCol: 1 }; // ← Uncomment → red squiggle TS2322 (Type '"%"' is not assignable to type 'EOp')

// 3) [JS] Sticky regex (y flag) : another way to read a token. It matches only AT lastIndex, never further on
const RE_NUMBER_G = /\d+/g;
const RE_NUMBER_Y = /\d+/y;
RE_NUMBER_G.lastIndex = 0;
RE_NUMBER_Y.lastIndex = 0;
console.log("3) /\\d+/g at 0 in \"ab12\" :", RE_NUMBER_G.exec("ab12")?.[0], "(skipped ahead to column 3)");
console.log("3) /\\d+/y at 0 in \"ab12\" :", RE_NUMBER_Y.exec("ab12")?.[0], "(nothing AT column 1 : what a lexer wants)");
RE_NUMBER_Y.lastIndex = 2;
console.log("3) /\\d+/y at 2 in \"ab12\" :", RE_NUMBER_Y.exec("ab12")?.[0]);

// 4) An error says where : the column, and a ^ under it
function ShowError(strExpr: string): void {
	const oResult = Lex(strExpr);
	if (!oResult.bOk) {
		console.log(`4) Expected error: ${oResult.strError} at column ${oResult.nCol}`);
		console.log(`   ${strExpr}`);
		console.log(`   ${" ".repeat(oResult.nCol - 1)}^`);
	}
}
ShowError("2 + $3");
ShowError("2 ** 3 % 4");
console.log("   Why : the lexer knows digits, + - * / ( ) and spaces. ** is read as * *, and % is unknown.");
console.log("   Fix : the parser rejects * *; DevCalc's lexer reads a run of operator characters (devcalc/src/core/Lexer.ts).");
