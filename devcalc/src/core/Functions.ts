//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: devcalc / core / Functions (Built-in functions : popcount(x), rol(x, n), ...)
//	History			: 2026-10-15 CYBERKDH Initial - Lesson 13 DevCalc step, Lv8
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

import { WORD_BITS, type CWordSize } from "./WordSize.ts";
import { CCalcError } from "./Calculator.ts";

// Lesson 13: one table, like the operators (lesson 08). A row says how many arguments the function takes
// and whether it needs a word size. bNeedsWord is the discriminant of the union : a row with true gets
// an oWord that is never undefined, so clz, bswap, rol and ror don't check it themselves
interface IFunctionBase {
	readonly strUsage: string; // "rol(x, n)" : for help and error messages
	readonly strHelp: string;
	readonly nMinArgs: number;
	readonly nMaxArgs: number; // Infinity : any number (min, max)
}

interface IWordFunction extends IFunctionBase {
	readonly bNeedsWord: true;
	readonly fnApply: (oWord: CWordSize, ...arrArg: bigint[]) => bigint;
}

interface IAnyFunction extends IFunctionBase {
	readonly bNeedsWord: false;
	readonly fnApply: (oWord: CWordSize | undefined, ...arrArg: bigint[]) => bigint;
}

type TFunctionSpec = IWordFunction | IAnyFunction;

const MAX_BIT = 4096n; // bit(n) without a word size : the same limit as << (lesson 11)
const WORD_HINT = `choose a word size (--bits=${WORD_BITS.join("|")}).`;

function Abs(biValue: bigint): bigint {
	return biValue < 0n ? -biValue : biValue;
}

// Bits needed for a number of 0 or more : 255 → 8, 256 → 9, 0 → 0
function BitLength(biValue: bigint): number {
	return biValue === 0n ? 0 : biValue.toString(2).length;
}

// rol and ror : the bits that leave one end come back at the other. ror(x, n) is rol(x, -n)
function Rotate(oWord: CWordSize, biValue: bigint, biCount: bigint): bigint {
	const biBits = BigInt(oWord.nBits);
	const biBy = ((biCount % biBits) + biBits) % biBits; // 0 .. nBits-1, also for a negative count
	return oWord.ToUnsigned((biValue << biBy) | (biValue >> (biBits - biBy)));
}

// A row's fnApply lists only the arguments it uses : (oWord, biX, biN). The parser checked the count,
// so biN is never missing. satisfies gives every parameter its type from TFunctionSpec
const FUNCTION_TABLE = {
	abs: {
		strUsage: "abs(x)",
		strHelp: "absolute value (x is read as signed when a word size is set)",
		nMinArgs: 1,
		nMaxArgs: 1,
		bNeedsWord: false,
		fnApply: (oWord, biX) => Abs(oWord === undefined ? biX : oWord.ToSigned(biX)),
	},
	min: {
		strUsage: "min(a, b, ...)",
		strHelp: "the smallest value (unsigned when a word size is set)",
		nMinArgs: 2,
		nMaxArgs: Infinity,
		bNeedsWord: false,
		fnApply: (_oWord, ...arrArg) => arrArg.reduce((biMin, biValue) => (biValue < biMin ? biValue : biMin)),
	},
	max: {
		strUsage: "max(a, b, ...)",
		strHelp: "the largest value (unsigned when a word size is set)",
		nMinArgs: 2,
		nMaxArgs: Infinity,
		bNeedsWord: false,
		fnApply: (_oWord, ...arrArg) => arrArg.reduce((biMax, biValue) => (biValue > biMax ? biValue : biMax)),
	},
	bit: {
		strUsage: "bit(n)",
		strHelp: "only bit n set : 1 << n",
		nMinArgs: 1,
		nMaxArgs: 1,
		bNeedsWord: false,
		fnApply: (oWord, biN) => {
			const biTop = oWord === undefined ? MAX_BIT : BigInt(oWord.nBits) - 1n;
			if (biN < 0n || biN > biTop) {
				throw new CCalcError(`bit ${biN} is out of range`, `use a bit number from 0 to ${biTop}.`);
			}
			return 1n << biN;
		},
	},
	popcount: {
		strUsage: "popcount(x)",
		strHelp: "how many bits are 1",
		nMinArgs: 1,
		nMaxArgs: 1,
		bNeedsWord: false,
		fnApply: (_oWord, biX) => {
			if (biX < 0n) {
				throw new CCalcError(`popcount(${biX}) : a negative number has endless 1 bits`, WORD_HINT);
			}
			return BigInt([...biX.toString(2)].filter((strDigit) => strDigit === "1").length);
		},
	},
	clz: {
		strUsage: "clz(x)",
		strHelp: "count leading zeros : the 0 bits above the highest 1",
		nMinArgs: 1,
		nMaxArgs: 1,
		bNeedsWord: true,
		fnApply: (oWord, biX) => BigInt(oWord.nBits - BitLength(biX)),
	},
	ctz: {
		strUsage: "ctz(x)",
		strHelp: "count trailing zeros : the 0 bits below the lowest 1",
		nMinArgs: 1,
		nMaxArgs: 1,
		bNeedsWord: false,
		fnApply: (oWord, biX) => {
			if (biX === 0n) {
				if (oWord === undefined) {
					throw new CCalcError("ctz(0) : 0 has endless 0 bits", WORD_HINT);
				}
				return BigInt(oWord.nBits);
			}
			let biCount = 0n;
			for (let biRest = Abs(biX); (biRest & 1n) === 0n; biRest >>= 1n) {
				biCount++;
			}
			return biCount;
		},
	},
	log2: {
		strUsage: "log2(x)",
		strHelp: "the position of the highest 1 bit (log base 2, rounded down)",
		nMinArgs: 1,
		nMaxArgs: 1,
		bNeedsWord: false,
		fnApply: (_oWord, biX) => {
			if (biX <= 0n) {
				throw new CCalcError(`log2(${biX}) has no answer`, "use a number above 0.");
			}
			return BigInt(BitLength(biX) - 1);
		},
	},
	bswap: {
		strUsage: "bswap(x)",
		strHelp: "reverse the byte order (big endian ↔ little endian)",
		nMinArgs: 1,
		nMaxArgs: 1,
		bNeedsWord: true,
		fnApply: (oWord, biX) => {
			let biOut = 0n;
			for (let biShift = 0n; biShift < BigInt(oWord.nBits); biShift += 8n) {
				biOut = (biOut << 8n) | ((biX >> biShift) & 0xffn);
			}
			return biOut;
		},
	},
	rol: {
		strUsage: "rol(x, n)",
		strHelp: "rotate left by n bits",
		nMinArgs: 2,
		nMaxArgs: 2,
		bNeedsWord: true,
		fnApply: (oWord, biX, biN) => Rotate(oWord, biX, biN),
	},
	ror: {
		strUsage: "ror(x, n)",
		strHelp: "rotate right by n bits",
		nMinArgs: 2,
		nMaxArgs: 2,
		bNeedsWord: true,
		fnApply: (oWord, biX, biN) => Rotate(oWord, biX, -biN),
	},
	align: {
		strUsage: "align(x, n)",
		strHelp: "round x up to a multiple of n",
		nMinArgs: 2,
		nMaxArgs: 2,
		bNeedsWord: false,
		fnApply: (_oWord, biX, biN) => {
			if (biN <= 0n) {
				throw new CCalcError(`align(${biX}, ${biN}) : n must be above 0`, "e.g. align(x, 16).");
			}
			const biRest = ((biX % biN) + biN) % biN; // 0 .. n-1, also for a negative x
			return biRest === 0n ? biX : biX + (biN - biRest);
		},
	},
} satisfies Record<string, TFunctionSpec>;

export type TFunction = keyof typeof FUNCTION_TABLE; // "abs" | "min" | ... | "align"

// Own keys only : a plain object also "has" toString and constructor (from Object.prototype)
export function IsFunction(strName: string): strName is TFunction {
	return Object.hasOwn(FUNCTION_TABLE, strName);
}

// "1 argument", "2 arguments", "2 or more arguments"
function ArgCountText(oSpec: TFunctionSpec): string {
	const strCount = oSpec.nMaxArgs === Infinity ? `${oSpec.nMinArgs} or more` : String(oSpec.nMinArgs);
	return `${strCount} argument${oSpec.nMinArgs === 1 && oSpec.nMaxArgs === 1 ? "" : "s"}`;
}

// What is wrong with nCount arguments, or undefined when the count is right (used by the parser too)
export function CheckArgCount(eFunction: TFunction, nCount: number): string | undefined {
	const oSpec: TFunctionSpec = FUNCTION_TABLE[eFunction];
	if (nCount >= oSpec.nMinArgs && nCount <= oSpec.nMaxArgs) {
		return undefined;
	}
	return `${oSpec.strUsage} takes ${ArgCountText(oSpec)}, found ${nCount}`;
}

export function FunctionUsage(eFunction: TFunction): string {
	return FUNCTION_TABLE[eFunction].strUsage;
}

// Calls one function. With a word size the arguments are read as unsigned first, like the operators.
// Throws CCalcError for a wrong count, a missing word size or a value the function can't take
export function CallFunction(eFunction: TFunction, arrArg: readonly bigint[], oWord: CWordSize | undefined): bigint {
	const oSpec: TFunctionSpec = FUNCTION_TABLE[eFunction]; // as the union : bNeedsWord narrows it below
	const strCount = CheckArgCount(eFunction, arrArg.length);
	if (strCount !== undefined) {
		throw new CCalcError(strCount, `e.g. ${oSpec.strUsage}.`);
	}
	const arrValue = arrArg.map((biArg) => (oWord === undefined ? biArg : oWord.ToUnsigned(biArg)));
	if (oSpec.bNeedsWord) {
		if (oWord === undefined) {
			throw new CCalcError(`${oSpec.strUsage} needs a word size`, WORD_HINT);
		}
		return oSpec.fnApply(oWord, ...arrValue); // IWordFunction : oWord is a CWordSize here
	}
	return oSpec.fnApply(oWord, ...arrValue);
}

// Overloads : no argument → every name; a name → its usage line, or undefined for an unknown name
export function FunctionHelp(): string;
export function FunctionHelp(strName: string): string | undefined;
export function FunctionHelp(strName?: string): string | undefined {
	if (strName === undefined) {
		return Object.keys(FUNCTION_TABLE).join(" ");
	}
	const strKey = strName.toLowerCase();
	if (!IsFunction(strKey)) {
		return undefined;
	}
	const oSpec: TFunctionSpec = FUNCTION_TABLE[strKey];
	return `${oSpec.strUsage.padEnd(14)} ${oSpec.strHelp}${oSpec.bNeedsWord ? " (needs a word size)" : ""}`;
}
