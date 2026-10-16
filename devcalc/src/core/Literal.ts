//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: devcalc / core / Literal (Number and character literals of an expression)
//	History			: 2026-10-15 CYBERKDH Initial - Lesson 11 DevCalc step, Lv6
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// What a number token may look like, on top of lesson 03's ParseInteger (255, 0xFF, 0b1010, 0o17, 1_000) :
//   1'000  0xFFFF'FFFF   ' separates digits, like _ (C++14)
//   1Fh    0FFh          hex with an h suffix (assembler style). It starts with a digit, or it would be a name
//   4K     16M   1G  2T  a size : times 1024, 1024², 1024³, 1024⁴ (decimal digits only)
// and a character literal :
//   'A'  'AB'  '\n'  '\x41'  one character is its code point; several are bytes, first = highest ('AB' = 0x4142)

import { ParseInteger, type TParseResult } from "./Parse.ts";

// Literal types : the units are a string union, and the table must have exactly these keys
export type EUnit = "K" | "M" | "G" | "T";

const UNIT_SHIFT = { K: 10n, M: 20n, G: 30n, T: 40n } as const satisfies Record<EUnit, bigint>;

function IsUnit(strText: string): strText is EUnit {
	return Object.hasOwn(UNIT_SHIFT, strText);
}

// Named groups : the match says which part is which. The i flag accepts 1fh, 4k
const RE_HEX_SUFFIX = /^(?<digits>[0-9][0-9a-f_']*)h$/i;
const RE_SIZE = /^(?<digits>[0-9][0-9_']*)(?<unit>[kmgt])$/i;
const RE_BAD_SEPARATOR = /^[_']|[_']$|[_']{2}|^0[xob][_']/i; // at an end, doubled, or right after the prefix

const ESCAPES: Readonly<Record<string, number>> = { n: 10, r: 13, t: 9, "0": 0, "\\": 92, "'": 39 };
export const MAX_CHARS = 8; // 8 bytes = 64 bits

function Fail(strError: string): TParseResult {
	return { bOk: false, strError };
}

// One number token → its value. Errors read like lesson 03's
export function ParseLiteral(strText: string): TParseResult {
	if (RE_BAD_SEPARATOR.test(strText)) {
		return Fail(`separators (_ or ') must sit between digits`);
	}
	const strPlain = strText.replaceAll("'", "_"); // from here on, ' is the same as _
	const oHex = RE_HEX_SUFFIX.exec(strPlain);
	if (oHex?.groups?.digits !== undefined) {
		return ParseInteger(`0x${oHex.groups.digits}`);
	}
	const oSize = RE_SIZE.exec(strPlain);
	const strUnit = oSize?.groups?.unit?.toUpperCase() ?? "";
	if (oSize?.groups?.digits !== undefined && IsUnit(strUnit)) {
		const oDigits = ParseInteger(oSize.groups.digits);
		return oDigits.bOk ? { bOk: true, biValue: oDigits.biValue << UNIT_SHIFT[strUnit] } : oDigits;
	}
	return ParseInteger(strPlain);
}

// The text between the quotes of a character literal → its value
export function ParseChar(strBody: string): TParseResult {
	const arrCode: number[] = [];
	const reEscape = /\\(?:x(?<hex>[0-9a-f]{2})|(?<char>.))/iy; // \x41 or \n \r \t \0 \\ \'
	let nPos = 0;
	while (nPos < strBody.length) {
		reEscape.lastIndex = nPos;
		const oEscape = reEscape.exec(strBody);
		if (oEscape !== null) {
			const strHex = oEscape.groups?.hex;
			const nCode = strHex !== undefined ? Number.parseInt(strHex, 16) : ESCAPES[oEscape.groups?.char ?? ""];
			if (nCode === undefined) {
				return Fail(`unknown escape "${oEscape[0]}" (use \\n \\r \\t \\0 \\\\ \\' or \\xHH)`);
			}
			arrCode.push(nCode);
			nPos += oEscape[0].length;
			continue;
		}
		const nCode = strBody.codePointAt(nPos) ?? 0; // a code point : '😀' is one character, two UTF-16 units
		arrCode.push(nCode);
		nPos += nCode > 0xffff ? 2 : 1;
	}
	if (arrCode.length === 0) {
		return Fail("empty character literal");
	}
	if (arrCode.length > MAX_CHARS) {
		return Fail(`more than ${MAX_CHARS} characters (${MAX_CHARS * 8} bits)`);
	}
	if (arrCode.length > 1 && arrCode.some((nCode) => nCode > 0xff)) {
		return Fail("several characters must each be one byte (0 to 0xFF)");
	}
	let biValue = 0n;
	for (const nCode of arrCode) {
		biValue = (biValue << 8n) | BigInt(nCode); // 'AB' = 0x41 << 8 | 0x42
	}
	return { bOk: true, biValue };
}
