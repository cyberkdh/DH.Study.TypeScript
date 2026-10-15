//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 03-unions-narrowing / parse (build an integer parser)
//	History			: 2026-10-15 CYBERKDH Initial
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// 1) [TS] The result is a discriminated union : a value, or the reason it failed
type TParseResult = { bOk: true; biValue: bigint } | { bOk: false; strError: string };

// 2) [JS + TS] Prefix table : an as const object instead of enum
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

// 3) [TS] Type guard : is this text one of the prefixes?
function IsPrefix(strText: string): strText is TPrefix {
	return Object.hasOwn(PREFIX_RULES, strText);
}

function Fail(strError: string): TParseResult {
	return { bOk: false, strError };
}

// 4) [JS + TS] Sign → prefix → "_" separators → digits
function ParseInteger(strInput: string): TParseResult {
	let strText = strInput.trim().toLowerCase();
	if (strText === "") {
		return Fail("empty input");
	}

	// Sign : strText[0] is string | undefined (noUncheckedIndexedAccess), compare with ===
	let bNegative = false;
	const strFirst = strText[0];
	if (strFirst === "-" || strFirst === "+") {
		bNegative = strFirst === "-";
		strText = strText.slice(1);
	}

	// Prefix : decimal unless the guard says otherwise
	let oRule: IRadixRule = DECIMAL_RULE;
	const strHead = strText.slice(0, 2);
	if (IsPrefix(strHead)) {
		oRule = PREFIX_RULES[strHead]; // strHead is TPrefix here
		strText = strText.slice(2);
	}

	// "_" only between digits : 1_000 OK, _1 / 1_ / 1__0 rejected
	if (strText.startsWith("_") || strText.endsWith("_") || strText.includes("__")) {
		return Fail(`"_" must sit between digits`);
	}
	const strDigits = strText.replaceAll("_", "");
	if (strDigits === "") {
		return Fail(`no digits after the sign or prefix`);
	}

	// Digits : value = value * radix + digit
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

// 5) [JS + TS] Try it on valid and invalid inputs
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
