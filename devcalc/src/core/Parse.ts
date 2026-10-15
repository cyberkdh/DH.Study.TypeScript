//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: devcalc / core / Parse (Integer input parser)
//	History			: 2026-10-15 CYBERKDH Initial - Lesson 03 DevCalc step, Lv2
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// Success-or-failure result (discriminated union on bOk)
export type TParseResult = { readonly bOk: true; readonly biValue: bigint } | { readonly bOk: false; readonly strError: string };

interface IRadixRule {
	readonly nRadix: number;
	readonly strName: string;
}

// Prefix table : as const object instead of enum
const PREFIX_RULES = {
	"0x": { nRadix: 16, strName: "hex" },
	"0o": { nRadix: 8, strName: "octal" },
	"0b": { nRadix: 2, strName: "binary" },
} as const;
type TPrefix = keyof typeof PREFIX_RULES;
const DECIMAL_RULE: IRadixRule = { nRadix: 10, strName: "decimal" };
const DIGITS = "0123456789abcdef";

function IsPrefix(strText: string): strText is TPrefix {
	return Object.hasOwn(PREFIX_RULES, strText);
}

function Fail(strError: string): TParseResult {
	return { bOk: false, strError };
}

// Parses "255", "-0xFF", "0b1010", "0o17", "1_000" (case-insensitive, surrounding spaces ignored)
export function ParseInteger(strInput: string): TParseResult {
	let strText = strInput.trim().toLowerCase();
	if (strText === "") {
		return Fail("empty input");
	}

	// Sign
	let bNegative = false;
	const strFirst = strText[0];
	if (strFirst === "-" || strFirst === "+") {
		bNegative = strFirst === "-";
		strText = strText.slice(1);
	}

	// Prefix
	let oRule: IRadixRule = DECIMAL_RULE;
	const strHead = strText.slice(0, 2);
	if (IsPrefix(strHead)) {
		oRule = PREFIX_RULES[strHead];
		strText = strText.slice(2);
	}

	// "_" separators : only between digits
	if (strText.startsWith("_") || strText.endsWith("_") || strText.includes("__")) {
		return Fail(`"_" must sit between digits`);
	}
	const strDigits = strText.replaceAll("_", "");
	if (strDigits === "") {
		return Fail("no digits after the sign or prefix");
	}

	// Digits
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
