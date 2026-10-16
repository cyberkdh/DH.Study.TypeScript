//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 12-bigint-words / satisfies
//	History			: 2026-10-15 CYBERKDH Initial
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// Three ways to type a table : an annotation, as, and satisfies. Only satisfies checks the table and keeps its details

type EWord = "byte" | "word" | "dword";

// 1) [TS] Annotation : checked, but the details are lost (every value is just number)
const WORD_BITS_A: Record<EWord, number> = { byte: 8, word: 16, dword: 32 };
type TBitsA = (typeof WORD_BITS_A)["byte"]; // number
const nBitsA: TBitsA = 12; // allowed : TS no longer knows that byte is 8
console.log("1) annotation :", WORD_BITS_A.byte, "· a TBitsA can be", nBitsA);

// 2) [TS] satisfies : checked, and the literal types stay (byte is 8, not number)
const WORD_BITS = { byte: 8, word: 16, dword: 32 } as const satisfies Record<EWord, number>;
type TBits = (typeof WORD_BITS)[EWord]; // 8 | 16 | 32
// const nBitsBad: TBits = 12; // ← Uncomment → TS2322 (Type '12' is not assignable to type '8 | 16 | 32')
const nBits: TBits = WORD_BITS.word;
console.log("2) satisfies :", WORD_BITS.byte, "· a TBits can only be 8, 16 or 32 :", nBits);

// 3) [TS] satisfies finds a missing row and a misspelled one
// const MISSING = { byte: 8, word: 16 } satisfies Record<EWord, number>; // ← Uncomment → TS2741 (Property 'dword' is missing)
// const TYPO = { byte: 8, word: 16, dowrd: 32 } satisfies Record<EWord, number>; // ← Uncomment → TS2561 (Object literal may only specify known properties ... Did you mean to write 'dword'?)
console.log("3) satisfies checks every key :", Object.keys(WORD_BITS).join(", "));

// 4) [TS] The table types the functions inside it : no parameter types to write
interface IRadixSpec {
	readonly strPrefix: string;
	readonly fnFormat: (biValue: bigint) => string;
}
const RADIX = {
	hex: { strPrefix: "0x", fnFormat: (biValue) => biValue.toString(16).toUpperCase() }, // biValue is bigint here
	oct: { strPrefix: "0o", fnFormat: (biValue) => biValue.toString(8) },
	bin: { strPrefix: "0b", fnFormat: (biValue) => biValue.toString(2) },
} satisfies Record<string, IRadixSpec>;
for (const [strName, oSpec] of Object.entries(RADIX)) {
	console.log(`4) ${strName} : ${oSpec.strPrefix}${oSpec.fnFormat(200n)}`);
}

// 5) [TS] An order list that may only name real rows, and keeps its order as a tuple type
type ERadix = keyof typeof RADIX; // "hex" | "oct" | "bin" : the keys were kept, not widened to string
const RADIX_ORDER = ["bin", "oct", "hex"] as const satisfies readonly ERadix[];
// const ORDER_BAD = ["bin", "dec"] as const satisfies readonly ERadix[]; // ← Uncomment → TS2322 (Type '"dec"' is not assignable to type '"hex" | "oct" | "bin"')
console.log("5) order :", RADIX_ORDER.map((eRadix) => RADIX[eRadix].strPrefix + RADIX[eRadix].fnFormat(5n)).join(" "));

// 6) as : no check at all. A missing row only shows up at run time
const WORD_BITS_AS = { byte: 8, word: 16 } as Record<EWord, number>; // dword is missing, and TS says nothing
try {
	console.log(WORD_BITS_AS.dword.toFixed(0));
} catch (e) {
	console.log(`6) Expected error: ${String(e)}`);
	console.log("   Why : as tells TS to trust you. The table has no dword, so WORD_BITS_AS.dword is undefined.");
	console.log("   Fix : write satisfies instead of as. Then TS2741 reports the missing row before the program runs.");
}
