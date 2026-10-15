//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 10-lexer-parser / lexer (렉서)
//	History			: 2026-10-15 CYBERKDH Initial (최초 작성)
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// 렉서 (lexer, tokenizer) : 텍스트 → 토큰 (token) 목록. 이후 단계는 글자 단위로 보지 않음

// 1) [TS] 토큰은 판별 유니온 (discriminated union) : 종류마다 필요한 필드만 가짐.
//    nCol (1부터 세는 열 번호, column) 은 오류 메시지용으로 보관
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

// 2) [JS + TS] 스캔 루프 (scanning loop) : nPos 위치의 글자를 보고, 토큰 하나를 읽고, nPos 를 그 뒤로 옮김
function Lex(strExpr: string): TLexResult {
	const arrToken: TToken[] = [];
	let nPos = 0;
	while (nPos < strExpr.length) {
		const strChar = strExpr.charAt(nPos);
		const nCol = nPos + 1;
		if (strChar === " ") {
			nPos++; // 공백은 토큰을 나눌 뿐
		} else if (IsDigit(strChar)) {
			const nStart = nPos;
			while (IsDigit(strExpr.charAt(nPos))) {
				nPos++; // 숫자는 이어지는 숫자 글자 전부 (끝을 지난 charAt 은 "")
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
	arrToken.push({ eKind: "end", nCol: strExpr.length + 1 }); // 파서는 언제나 토큰 하나를 미리 볼 수 있음
	return { bOk: true, arrToken };
}

// 종류마다 다르게 표시 : eKind 에 대한 switch, case 마다 좁혀짐 (narrowing)
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
// const oBad: TToken = { eKind: "operator", strOp: "%", nCol: 1 }; // ← 주석을 풀면 빨간 줄 TS2322 ('"%"' 타입은 'EOp' 에 대입할 수 없음)

// 3) [JS] sticky 정규식 (y 플래그) : 토큰을 읽는 또 다른 방법. 정확히 lastIndex 위치에서만 맞춰 보고, 더 뒤에서 찾지 않음
const RE_NUMBER_G = /\d+/g;
const RE_NUMBER_Y = /\d+/y;
RE_NUMBER_G.lastIndex = 0;
RE_NUMBER_Y.lastIndex = 0;
console.log("3) /\\d+/g at 0 in \"ab12\" :", RE_NUMBER_G.exec("ab12")?.[0], "(skipped ahead to column 3)");
console.log("3) /\\d+/y at 0 in \"ab12\" :", RE_NUMBER_Y.exec("ab12")?.[0], "(nothing AT column 1 : what a lexer wants)");
RE_NUMBER_Y.lastIndex = 2;
console.log("3) /\\d+/y at 2 in \"ab12\" :", RE_NUMBER_Y.exec("ab12")?.[0]);

// 4) 오류는 위치를 알려 줌 : 열 번호, 그리고 그 아래의 ^
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
