//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: devcalc / core / WordSize (8/16/32/64-bit word size)
//	History			: 2026-10-15 CYBERKDH Initial - Lesson 04 DevCalc step, Lv3
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

export type TWordBits = 8 | 16 | 32 | 64;

const WORD_BITS: readonly TWordBits[] = [8, 16, 32, 64];
const WORD_NAMES: Readonly<Record<TWordBits, string>> = { 8: "BYTE", 16: "WORD", 32: "DWORD", 64: "QWORD" };

export function IsWordBits(nValue: number): nValue is TWordBits {
	return (WORD_BITS as readonly number[]).includes(nValue);
}

// A fixed word size : wraps values into N bits and reads them as unsigned or signed
export class CWordSize {
	readonly nBits: TWordBits;
	readonly #biBits: bigint;

	constructor(nBits: TWordBits) {
		this.nBits = nBits;
		this.#biBits = BigInt(nBits);
	}

	get strName(): string {
		return WORD_NAMES[this.nBits];
	}

	get biMaxUnsigned(): bigint {
		return (1n << this.#biBits) - 1n;
	}

	get biMinSigned(): bigint {
		return -(1n << (this.#biBits - 1n));
	}

	get biMaxSigned(): bigint {
		return (1n << (this.#biBits - 1n)) - 1n;
	}

	// Keep the low N bits, read as unsigned : -1 → 0xFF (8-bit)
	ToUnsigned(biValue: bigint): bigint {
		return BigInt.asUintN(this.nBits, biValue);
	}

	// Keep the low N bits, read as two's complement : 0xFF → -1 (8-bit)
	ToSigned(biValue: bigint): bigint {
		return BigInt.asIntN(this.nBits, biValue);
	}

	// Fits as signed or unsigned : -128..255 for 8 bits
	Fits(biValue: bigint): boolean {
		return biValue >= this.biMinSigned && biValue <= this.biMaxUnsigned;
	}
}
