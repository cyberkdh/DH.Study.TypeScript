//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 01-basic-types / primitives
//	History			: 2026-10-14 CYBERKDH Initial
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// 1) [TS] Type annotation : ": type" after the variable name
const strName: string = "DevCalc";
const nBits: number = 64;
const bSigned: boolean = true;

// 2) [TS] Type inference : TS works out the type from the value → usually leave the annotation out
const strVersion = "0.1.0"; // inferred as string (hover to check)
let nCount = 0; // number
nCount += 1;
// nCount = "1";            // ← Uncomment → red squiggle (string is not number)

// 3) [JS] number is just C#'s double (no separate int, long or float)
console.log("0.1 + 0.2 =", 0.1 + 0.2); // 0.30000000000000004
console.log("7 / 2 =", 7 / 2); // 3.5  (unlike C# int division)
console.log("Math.trunc(7 / 2) =", Math.trunc(7 / 2)); // 3

// 4) [JS] Radix literals and toString(radix)
const nMask = 0xff;
console.log("0xff =", nMask, "/ hex:", nMask.toString(16), "/ bin:", nMask.toString(2));

// 5) [JS + TS] Arrays and tuples
const arrBits: number[] = [8, 16, 32, 64];
const arrPair: [string, number] = ["WORD", 16]; // Fixed length and per-slot types
console.log(arrBits, arrPair);

// Because of noUncheckedIndexedAccess, arrBits[0] has type number | undefined
const nFirst = arrBits[0];
if (nFirst !== undefined) {
	console.log("first bits x 2:", nFirst * 2);
}

console.log(strName, strVersion, nBits, bSigned, nCount);
