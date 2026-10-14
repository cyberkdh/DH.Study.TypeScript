//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: devcalc / core / Format (Radix formatting)
//	History			: 2026-10-14 CYBERKDH Initial - Lesson 01 DevCalc step
//					  2026-10-14 CYBERKDH Lesson 02: digit grouping, output options
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// Output options. Every property is optional.
export interface IFormatOptions {
	readonly bGroup?: boolean; // group digits (default false)
	readonly bUpperCase?: boolean; // A-F in upper case (default true)
	readonly bPrefix?: boolean; // 0x / 0b prefix (default true)
}

// A formatting function : ToHex / ToDec / ToBin all have this type
export type TFormatter = (biValue: bigint, oOptions?: IFormatOptions) => string;

// How one radix is written
interface IRadixSpec {
	readonly nRadix: number;
	readonly strPrefix: string;
	readonly nGroupSize: number;
	readonly strSeparator: string;
}

const HEX_SPEC: IRadixSpec = { nRadix: 16, strPrefix: "0x", nGroupSize: 4, strSeparator: "_" };
const DEC_SPEC: IRadixSpec = { nRadix: 10, strPrefix: "", nGroupSize: 3, strSeparator: "," };
const BIN_SPEC: IRadixSpec = { nRadix: 2, strPrefix: "0b", nGroupSize: 4, strSeparator: "_" };

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
function FormatRadix(biValue: bigint, oSpec: IRadixSpec, { bGroup = false, bUpperCase = true, bPrefix = true }: IFormatOptions): string {
	const strSign = biValue < 0n ? "-" : "";
	const biAbs = biValue < 0n ? -biValue : biValue;
	let strDigits = biAbs.toString(oSpec.nRadix);
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
export const ToBin: TFormatter = (biValue, oOptions = {}) => FormatRadix(biValue, BIN_SPEC, oOptions);
