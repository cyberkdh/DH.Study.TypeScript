//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 01-basic-types / bigint
//	History			: 2026-10-14 CYBERKDH Initial
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// 1) [JS] number represents integers exactly only up to 2^53 - 1
console.log("MAX_SAFE_INTEGER =", Number.MAX_SAFE_INTEGER); // 9007199254740991
console.log("2^53 + 1 =", 2 ** 53 + 1); // 9007199254740992  ← the 1 is lost!

// 2) [JS] bigint : add n at the end for an integer of unlimited size (C# BigInteger)
const biMax64 = 0xffff_ffff_ffff_ffffn; // 64-bit max
console.log("64-bit max =", biMax64); // 18446744073709551615n
console.log("hex =", biMax64.toString(16)); // ffffffffffffffff
console.log("2^53 + 1 =", 2n ** 53n + 1n); // 9007199254740993n  ← exact

// 3) [JS] Division is integer division (fraction discarded)
console.log("7n / 2n =", 7n / 2n); // 3n

// 4) [JS + TS] number and bigint can't be mixed
//    The @ts-expect-error below : TS already knows the next line is an error (remove it to see the red squiggle)
try {
	// @ts-expect-error
	const biWrong = 1n + 1;
	console.log(biWrong); // Never reached
} catch (e) {
	console.log("Expected error:", (e as Error).message);
	console.log("Why : number and bigint can't be mixed in one operation.");
	// Fix: convert one side
	console.log("Fix : 1n + BigInt(1) =", 1n + BigInt(1), "/ Number(1n) + 1 =", Number(1n) + 1);
}
