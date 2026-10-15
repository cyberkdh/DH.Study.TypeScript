//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 03-unions-narrowing / parse (정수 해석기 만들기)
//	History			: 2026-10-15 CYBERKDH Initial (최초 작성)
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// 1) [TS] 결과는 판별 유니온 : 값, 또는 실패한 이유
type TParseResult = { bOk: true; biValue: bigint } | { bOk: false; strError: string };

// 2) [JS + TS] 접두어 표 : enum 대신 as const 객체
interface IRadixRule {
	readonly nRadix: number;
	readonly strName: string;
}
const PREFIX_RULES = {
	"0x": { nRadix: 16, strName: "hex" },
	"0o": { nRadix: 8, strName: "octal" },
	"0b": { nRadix: 2, strName: "binary" },
} as const;
type TPrefix = keyof typeof PREFIX_RULES; // "0x" | "0o" | "0b"
const DECIMAL_RULE: IRadixRule = { nRadix: 10, strName: "decimal" };
const DIGITS = "0123456789abcdef";

// 3) [TS] 타입 가드 : 이 글자가 접두어 중 하나인가?
function IsPrefix(strText: string): strText is TPrefix {
	return Object.hasOwn(PREFIX_RULES, strText);
}

function Fail(strError: string): TParseResult {
	return { bOk: false, strError };
}

// 4) [JS + TS] 부호 → 접두어 → "_" 구분자 → 숫자
function ParseInteger(strInput: string): TParseResult {
	let strText = strInput.trim().toLowerCase();
	if (strText === "") {
		return Fail("empty input");
	}

	// 부호 : strText[0] 은 string | undefined (noUncheckedIndexedAccess), === 로 비교
	let bNegative = false;
	const strFirst = strText[0];
	if (strFirst === "-" || strFirst === "+") {
		bNegative = strFirst === "-";
		strText = strText.slice(1);
	}

	// 접두어 : 가드가 아니라고 하면 10진수
	let oRule: IRadixRule = DECIMAL_RULE;
	const strHead = strText.slice(0, 2);
	if (IsPrefix(strHead)) {
		oRule = PREFIX_RULES[strHead]; // 여기서 strHead 는 TPrefix
		strText = strText.slice(2);
	}

	// "_" 는 숫자 사이에만 : 1_000 은 OK, _1 / 1_ / 1__0 은 거부
	if (strText.startsWith("_") || strText.endsWith("_") || strText.includes("__")) {
		return Fail(`"_" must sit between digits`);
	}
	const strDigits = strText.replaceAll("_", "");
	if (strDigits === "") {
		return Fail(`no digits after the sign or prefix`);
	}

	// 숫자 : 값 = 값 * 진수 + 자릿값
	const biRadix = BigInt(oRule.nRadix);
	let biValue = 0n;
	for (const strChar of strDigits) {
		const nDigit = DIGITS.indexOf(strChar);
		if (nDigit < 0 || nDigit >= oRule.nRadix) {
			return Fail(`"${strChar}" is not a valid ${oRule.strName} digit`);
		}
		biValue = biValue * biRadix + BigInt(nDigit);
	}
	return { bOk: true, biValue: bNegative ? -biValue : biValue };
}

// 5) [JS + TS] 올바른 입력과 잘못된 입력으로 테스트
function PrintParse(strInput: string): void {
	const oResult = ParseInteger(strInput);
	const strShown = JSON.stringify(strInput).padEnd(14);
	if (oResult.bOk) {
		console.log(`   ${strShown} → ${oResult.biValue}`);
	} else {
		console.log(`   ${strShown} → error: ${oResult.strError}`);
	}
}

console.log("1) valid:");
for (const strInput of ["255", "-0xFF", "0b1010", "0o17", "1_000", "0xFFFF_FFFF", "+42", " 0XAB "]) {
	PrintParse(strInput);
}
console.log("2) invalid:");
for (const strInput of ["", "0x", "12a", "0b102", "1__0", "_1", "0xG"]) {
	PrintParse(strInput);
}
