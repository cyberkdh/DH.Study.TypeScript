//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: devcalc / core / Format (Radix formatting)
//	History			: 2026-10-14 CYBERKDH Initial - Lesson 01 DevCalc step
//					  2026-10-14 CYBERKDH Lesson 02: digit grouping, output options
//					  2026-10-15 CYBERKDH Lesson 04: zero padding to the word size (nBits)
//					  2026-10-15 CYBERKDH Lesson 12: ToOct, ToChar
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// Output options. Every property is optional.
export interface IFormatOptions {
	readonly bGroup?: boolean; // group digits (default false)
	readonly bUpperCase?: boolean; // A-F in upper case (default true)
	readonly bPrefix?: boolean; // 0x / 0o / 0b prefix (default true)
	readonly nBits?: number; // pad HEX / OCT / BIN with zeros to this word size (default: no padding)
}

// A formatting function : ToHex / ToDec / ToOct / ToBin all have this type
export type TFormatter = (biValue: bigint, oOptions?: IFormatOptions) => string;

// How one radix is written
interface IRadixSpec {
	readonly nRadix: number;
	readonly strPrefix: string;
	readonly nGroupSize: number;
	readonly strSeparator: string;
	readonly nBitsPerDigit: number; // 0 = never padded
}

const HEX_SPEC: IRadixSpec = { nRadix: 16, strPrefix: "0x", nGroupSize: 4, strSeparator: "_", nBitsPerDigit: 4 };
const DEC_SPEC: IRadixSpec = { nRadix: 10, strPrefix: "", nGroupSize: 3, strSeparator: ",", nBitsPerDigit: 0 };
const OCT_SPEC: IRadixSpec = { nRadix: 8, strPrefix: "0o", nGroupSize: 3, strSeparator: "_", nBitsPerDigit: 3 };
const BIN_SPEC: IRadixSpec = { nRadix: 2, strPrefix: "0b", nGroupSize: 4, strSeparator: "_", nBitsPerDigit: 1 };

// Group digits from the right : ("FFFFFFFF", 4, "_") → "FFFF_FFFF"
export function GroupDigits(strDigits: string, nSize: number, strSeparator: string): string {
	if (nSize <= 0) {
		return strDigits;
	}
	const arrGroup: string[] = [];
	for (let nEnd = strDigits.length; nEnd > 0; nEnd -= nSize) {
		arrGroup.unshift(strDigits.slice(Math.max(0, nEnd - nSize), nEnd));
	}
	return arrGroup.join(strSeparator);
}

// Split sign and absolute value, then build "sign + prefix + digits"
function FormatRadix(biValue: bigint, oSpec: IRadixSpec, { bGroup = false, bUpperCase = true, bPrefix = true, nBits = 0 }: IFormatOptions): string {
	const strSign = biValue < 0n ? "-" : "";
	const biAbs = biValue < 0n ? -biValue : biValue;
	let strDigits = biAbs.toString(oSpec.nRadix);
	if (nBits > 0 && oSpec.nBitsPerDigit > 0) {
		strDigits = strDigits.padStart(Math.ceil(nBits / oSpec.nBitsPerDigit), "0");
	}
	if (bUpperCase) {
		strDigits = strDigits.toUpperCase();
	}
	if (bGroup) {
		strDigits = GroupDigits(strDigits, oSpec.nGroupSize, oSpec.strSeparator);
	}
	return strSign + (bPrefix ? oSpec.strPrefix : "") + strDigits;
}

export const ToHex: TFormatter = (biValue, oOptions = {}) => FormatRadix(biValue, HEX_SPEC, oOptions);
export const ToDec: TFormatter = (biValue, oOptions = {}) => FormatRadix(biValue, DEC_SPEC, oOptions);
export const ToOct: TFormatter = (biValue, oOptions = {}) => FormatRadix(biValue, OCT_SPEC, oOptions);
export const ToBin: TFormatter = (biValue, oOptions = {}) => FormatRadix(biValue, BIN_SPEC, oOptions);

// Lesson 12: the bytes as a character literal that can be typed back in ('A' → 0x41, 'AB' → 0x4142).
// Leading zero bytes are dropped, and bytes that are not printable ASCII become escapes.
const CHAR_ESCAPES: Readonly<Record<number, string>> = { 0: "\\0", 9: "\\t", 10: "\\n", 13: "\\r", 39: "\\'", 92: "\\\\" };

export function ToChar(biValue: bigint): string | undefined {
	if (biValue < 0n) {
		return undefined; // a negative number has no bytes until a word size is chosen
	}
	const arrByte: number[] = [];
	for (let biRest = biValue; biRest > 0n; biRest >>= 8n) {
		arrByte.unshift(Number(biRest & 0xffn)); // lowest byte last : 0x4142 → [0x41, 0x42]
	}
	if (arrByte.length === 0) {
		arrByte.push(0);
	}
	const strBody = arrByte
		.map((nByte) => CHAR_ESCAPES[nByte] ?? (nByte >= 0x20 && nByte <= 0x7e ? String.fromCharCode(nByte) : `\\x${nByte.toString(16).toUpperCase().padStart(2, "0")}`))
		.join("");
	return `'${strBody}'`;
}
