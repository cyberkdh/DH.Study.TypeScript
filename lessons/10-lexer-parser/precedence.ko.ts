//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 10-lexer-parser / precedence (직접 만들기 : 우선순위 클라이밍)
//	History			: 2026-10-15 CYBERKDH Initial (최초 작성)
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// 직접 만들기 : 우선순위 클라이밍 (precedence climbing). 함수 하나와 표 하나가 우선순위 단계마다 있던 함수들을 대신함

// 1) [TS] 표 : 연산자마다 우선순위 (precedence, 높을수록 강하게 묶음) 와 결합성 (associativity)
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
	"**": { nPrecedence: 3, eAssoc: "right", fnApply: (nLeft, nRight) => nLeft ** nRight }, // 2 ** 3 ** 2 = 2 ** (3 ** 2) : 오른쪽부터
};

// 2) 파서. 파싱하면서 바로 계산하고 (트리 없음), 호출마다 출력할 수 있음
function Parse(strExpr: string, oTable: TTable, bTrace: boolean): number {
	const arrToken = strExpr.match(/\d+|\*\*|\S/g) ?? []; // ** 는 토큰 하나
	let nPos = 0;

	// 피연산자 하나를 읽고, 우선순위가 nMin 이상인 연산자를 모두 읽음
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
				break; // 연산자가 아니거나 더 약하게 묶는 연산자 : 호출한 쪽이 가져감
			}
			nPos++;
			// left : 오른쪽은 더 강한 연산자만 가져감. right : 같은 연산자가 오른쪽에서 또 나올 수 있음
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

// 3) 추적 (trace) : 1 + 2 * 3. * 는 + 가 오른쪽을 위해 부른 호출 안에서 계산됨
console.log("3) Trace of 1 + 2 * 3");
Parse("1 + 2 * 3", TABLE, true);

// 4) 모든 것은 표가 정함 : 같은 파서에서 "-" 를 오른쪽 결합으로 표시하면
const WRONG_TABLE: TTable = { ...TABLE, "-": { ...TABLE["-"]!, eAssoc: "right" } };
console.log("4) Expected error (a wrong answer, not an exception): 8 - 4 - 2 =", Parse("8 - 4 - 2", WRONG_TABLE, false));
console.log("   Why : right-associative reads it as 8 - (4 - 2) = 6, but - is left-associative : (8 - 4) - 2 = 2.");
console.log("   Fix : only ** (and assignment =) are right-associative; keep - left. A test catches this.");

// 5) 새 연산자는 표의 한 줄. 파서는 바뀌지 않음
const MOD_TABLE: TTable = { ...TABLE, "%": { nPrecedence: 2, eAssoc: "left", fnApply: (nLeft, nRight) => nLeft % nRight } };
console.log("5) 1 + 17 % 5 * 2 =", Parse("1 + 17 % 5 * 2", MOD_TABLE, false));
