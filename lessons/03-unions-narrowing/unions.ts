//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 03-unions-narrowing / unions
//	History			: 2026-10-15 CYBERKDH Initial
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// 1) [TS] Union type : the value is one of several types (A | B)
let vInput: string | number = "255";
console.log("1) vInput =", vInput, "/ typeof =", typeof vInput);
vInput = 255;
console.log("   vInput =", vInput, "/ typeof =", typeof vInput);
// vInput = true; // ← Uncomment → red squiggle TS2322 (boolean is not string | number)

// 2) [TS] Literal union : only these exact values are allowed
type TRadixName = "HEX" | "DEC" | "BIN";
let strRadix: TRadixName = "HEX";
strRadix = "BIN";
// strRadix = "OCT"; // ← Uncomment → red squiggle TS2322 ("OCT" is not a TRadixName)
console.log("2) strRadix =", strRadix);

// 3) [TS] Without checking which type it is, only members that every type has can be used
function Describe(vValue: string | number): string {
	// vValue.toUpperCase(); // ← Uncomment → red squiggle TS2339 (number has no toUpperCase)
	return vValue.toString(); // string and number both have toString
}
console.log("3) Describe:", Describe("FF"), Describe(255));

// 4) [JS + TS] Instead of enum : an as const object + a union of its keys and values
const RADIX = { HEX: 16, DEC: 10, BIN: 2 } as const;
type TRadixKey = keyof typeof RADIX; // "HEX" | "DEC" | "BIN"
type TRadix = (typeof RADIX)[TRadixKey]; // 16 | 10 | 2

function RadixOf(strKey: TRadixKey): TRadix {
	return RADIX[strKey];
}
console.log("4) RADIX.HEX =", RADIX.HEX, "/ RadixOf(\"BIN\") =", RadixOf("BIN"), "/ keys =", Object.keys(RADIX).join(", "));

// 5) [TS] T | undefined : a value that may be missing. find returns undefined when nothing matches.
const arrName: TRadixName[] = ["HEX", "DEC", "BIN"];
const strFound = arrName.find((strName) => strName.startsWith("O")); // TRadixName | undefined
console.log("5) find O* =", strFound);
// strFound.length; // ← Uncomment → red squiggle TS18048 ('strFound' is possibly 'undefined')

// 6) [TS] What happens if you use it without checking
try {
	// @ts-expect-error
	console.log(strFound.length);
} catch (e) {
	console.log("6) Expected error:", (e as Error).message);
	console.log("   Why : find found nothing and returned undefined, which has no properties.");
	console.log("   Fix : TS flags it (TS18048). Check for undefined first — narrowing.ts.");
}
