//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 04-classes-errors / wordsize
//	History			: 2026-10-15 CYBERKDH Initial
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// 1) [JS] BigInt.asUintN / asIntN : keep the low N bits, read as unsigned / signed (two's complement)
for (const biValue of [255n, 256n, -1n, -128n]) {
	const strValue = String(biValue).padStart(4);
	console.log(`1) ${strValue} → 8-bit unsigned ${BigInt.asUintN(8, biValue)}, signed ${BigInt.asIntN(8, biValue)}`);
}

// 2) [JS] -1 in each word size : all bits set
for (const nBits of [8, 16, 32, 64]) {
	const strHex = BigInt.asUintN(nBits, -1n).toString(16).toUpperCase();
	console.log(`2) -1 as ${String(nBits).padStart(2)}-bit = 0x${strHex}`);
}

// 3) [TS] A word size class with a literal union for the bit count
type TWordBits = 8 | 16 | 32 | 64;

class CWordSize {
	readonly nBits: TWordBits;

	constructor(nBits: TWordBits) {
		this.nBits = nBits;
	}

	get biMaxUnsigned(): bigint {
		return (1n << BigInt(this.nBits)) - 1n;
	}

	get biMinSigned(): bigint {
		return -(1n << BigInt(this.nBits - 1));
	}

	get biMaxSigned(): bigint {
		return (1n << BigInt(this.nBits - 1)) - 1n;
	}
}
// new CWordSize(12); // ← Uncomment → red squiggle TS2345 (12 is not a TWordBits)
for (const nBits of [8, 16, 32] as const) {
	const oWord = new CWordSize(nBits);
	console.log(`3) ${nBits}-bit : unsigned 0..${oWord.biMaxUnsigned}, signed ${oWord.biMinSigned}..${oWord.biMaxSigned}`);
}

// 4) [JS] Overflow : 0xFF + 1 does not fit in 8 bits, so it wraps to 0 (C# byte : unchecked by default)
const biSum = 0xffn + 1n;
console.log("4) 0xFF + 1 =", biSum, "→ 8-bit", BigInt.asUintN(8, biSum));

// 5) [JS] Why DevCalc uses bigint : bitwise operators on number work in 32-bit signed
console.log("5) number : 0xFFFFFFFF | 0 =", 0xffffffff | 0, "/ 1 << 31 =", 1 << 31);
console.log("   bigint : 0xFFFFFFFFn | 0n =", 0xffffffffn | 0n, "/ 1n << 31n =", 1n << 31n);
