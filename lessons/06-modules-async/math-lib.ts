//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 06-modules-async / math-lib
//	History			: 2026-10-15 CYBERKDH Initial
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// A module : every file with import or export has its own scope. Only what is exported is visible outside.

// 1) [JS] Named exports : export in front of a declaration
export const MAX_BITS = 64;

export function Add(biA: bigint, biB: bigint): bigint {
	return biA + biB;
}

export function ToHex(biValue: bigint): string {
	return "0x" + biValue.toString(16).toUpperCase();
}

// 2) [JS] Not exported : private to this file, like C# internal / private
const SEPARATOR = " .. ";

// 3) [TS] Type exports : interfaces and types exist only for the compiler
export interface IRange {
	readonly biMin: bigint;
	readonly biMax: bigint;
}
export type ESign = "signed" | "unsigned";

export function RangeOf(nBits: number, eSign: ESign): IRange {
	const biBits = BigInt(nBits);
	return eSign === "unsigned" ? { biMin: 0n, biMax: (1n << biBits) - 1n } : { biMin: -(1n << (biBits - 1n)), biMax: (1n << (biBits - 1n)) - 1n };
}

// 4) [JS] A default export : at most one per module, imported without braces
export default function Describe(oRange: IRange): string {
	return ToHex(oRange.biMin) + SEPARATOR + ToHex(oRange.biMax);
}

// 5) [JS] import.meta.main : true only when this file is run directly, not when it is imported
if (import.meta.main) {
	console.log("math-lib.ts is a module : it only exports things. Run the file that imports it:");
	console.log("  node lessons/06-modules-async/modules.ts");
}
