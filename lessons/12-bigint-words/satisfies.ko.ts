//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 12-bigint-words / satisfies (만족 검사)
//	History			: 2026-10-15 CYBERKDH Initial (최초 작성)
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// 표에 타입을 붙이는 세 가지 방법 : 타입 표기 (annotation), as, satisfies. 표를 검사하면서 세부 타입까지 남기는 것은 satisfies 뿐

type EWord = "byte" | "word" | "dword";

// 1) [TS] 타입 표기 : 검사는 되지만 세부 정보가 사라짐 (모든 값이 그냥 number)
const WORD_BITS_A: Record<EWord, number> = { byte: 8, word: 16, dword: 32 };
type TBitsA = (typeof WORD_BITS_A)["byte"]; // number
const nBitsA: TBitsA = 12; // 허용됨 : byte 가 8 이라는 사실을 TS 가 더 이상 모름
console.log("1) annotation :", WORD_BITS_A.byte, "· a TBitsA can be", nBitsA);

// 2) [TS] satisfies : 검사도 되고 리터럴 타입 (literal type) 도 남음 (byte 는 number 가 아니라 8)
const WORD_BITS = { byte: 8, word: 16, dword: 32 } as const satisfies Record<EWord, number>;
type TBits = (typeof WORD_BITS)[EWord]; // 8 | 16 | 32
// const nBitsBad: TBits = 12; // ← 주석 해제 → TS2322 (Type '12' is not assignable to type '8 | 16 | 32')
const nBits: TBits = WORD_BITS.word;
console.log("2) satisfies :", WORD_BITS.byte, "· a TBits can only be 8, 16 or 32 :", nBits);

// 3) [TS] satisfies 는 빠진 행과 철자가 틀린 행을 찾아냄
// const MISSING = { byte: 8, word: 16 } satisfies Record<EWord, number>; // ← 주석 해제 → TS2741 (Property 'dword' is missing)
// const TYPO = { byte: 8, word: 16, dowrd: 32 } satisfies Record<EWord, number>; // ← 주석 해제 → TS2561 (Object literal may only specify known properties ... Did you mean to write 'dword'?)
console.log("3) satisfies checks every key :", Object.keys(WORD_BITS).join(", "));

// 4) [TS] 표가 그 안의 함수에도 타입을 줌 : 매개변수 (parameter) 타입을 쓸 필요가 없음
interface IRadixSpec {
	readonly strPrefix: string;
	readonly fnFormat: (biValue: bigint) => string;
}
const RADIX = {
	hex: { strPrefix: "0x", fnFormat: (biValue) => biValue.toString(16).toUpperCase() }, // 여기서 biValue 는 bigint
	oct: { strPrefix: "0o", fnFormat: (biValue) => biValue.toString(8) },
	bin: { strPrefix: "0b", fnFormat: (biValue) => biValue.toString(2) },
} satisfies Record<string, IRadixSpec>;
for (const [strName, oSpec] of Object.entries(RADIX)) {
	console.log(`4) ${strName} : ${oSpec.strPrefix}${oSpec.fnFormat(200n)}`);
}

// 5) [TS] 실제 행 이름만 쓸 수 있고, 순서를 튜플 (tuple) 타입으로 간직하는 순서 목록
type ERadix = keyof typeof RADIX; // "hex" | "oct" | "bin" : 키가 string 으로 넓어지지 않고 남음
const RADIX_ORDER = ["bin", "oct", "hex"] as const satisfies readonly ERadix[];
// const ORDER_BAD = ["bin", "dec"] as const satisfies readonly ERadix[]; // ← 주석 해제 → TS2322 (Type '"dec"' is not assignable to type '"hex" | "oct" | "bin"')
console.log("5) order :", RADIX_ORDER.map((eRadix) => RADIX[eRadix].strPrefix + RADIX[eRadix].fnFormat(5n)).join(" "));

// 6) as : 검사가 전혀 없음. 빠진 행은 실행할 때에야 드러남
const WORD_BITS_AS = { byte: 8, word: 16 } as Record<EWord, number>; // dword 가 빠졌는데 TS 는 아무 말도 안 함
try {
	console.log(WORD_BITS_AS.dword.toFixed(0));
} catch (e) {
	console.log(`6) Expected error: ${String(e)}`);
	console.log("   Why : as tells TS to trust you. The table has no dword, so WORD_BITS_AS.dword is undefined.");
	console.log("   Fix : write satisfies instead of as. Then TS2741 reports the missing row before the program runs.");
}
