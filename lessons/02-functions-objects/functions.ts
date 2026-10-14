//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 02-functions-objects / functions
//	History			: 2026-10-14 CYBERKDH Initial
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// 1) [JS] Function declaration : can be called above the line where it is written (hoisting)
console.log("1) Add(1, 2) =", Add(1, 2), "(called before the declaration)");

function Add(nA: number, nB: number): number {
	return nA + nB;
}

// 2) [JS] Arrow function : a short function stored in a const. Like a C# lambda.
const Multiply = (nA: number, nB: number): number => nA * nB;
const Square = (nA: number) => nA * nA; // return type inferred : number
console.log("2) Multiply(3, 4) =", Multiply(3, 4), "/ Square(5) =", Square(5));

// 3) [JS] An arrow function in a const can't be called before its line (same as let/const)
try {
	// @ts-expect-error
	Subtract(5, 3);
	const Subtract = (nA: number, nB: number): number => nA - nB;
	console.log(Subtract(1, 1)); // Never reached
} catch (e) {
	console.log("3) Expected error:", (e as Error).message);
	console.log("   Why : an arrow function is a const value, so it exists only from its line down.");
	console.log("   Fix : define it first, or use a function declaration.");
}

// 4) [TS] Annotations : parameters need a type, the return type is usually inferred
function ToUpperHex(nValue: number): string {
	return nValue.toString(16).toUpperCase();
}
// ToUpperHex("255"); // ← Uncomment → red squiggle TS2345 (string is not number)
console.log("4) ToUpperHex(255) =", ToUpperHex(255));

// 5) [TS] TS checks the number of arguments. Plain JS does not.
// @ts-expect-error
const nMissing = Add(1); // TS2554 : Expected 2 arguments, but got 1.
console.log("5) Without TS: Add(1) =", nMissing);
console.log("   Why : JS fills a missing argument with undefined, and 1 + undefined = NaN.");
console.log("   Fix : TS flags it while you type. Pass both arguments.");

// 6) [TS] Function type : describes "a function that takes ... and returns ..."
type TBinaryOp = (nA: number, nB: number) => number;

const fnPlus: TBinaryOp = Add;
const fnTimes: TBinaryOp = (nA, nB) => nA * nB; // parameter types come from TBinaryOp
console.log("6) fnPlus(2, 3) =", fnPlus(2, 3), "/ fnTimes(2, 3) =", fnTimes(2, 3));

// 7) [JS + TS] void return : a function that returns nothing
function PrintLine(strText: string): void {
	console.log("7)", strText);
}
PrintLine("void function done");
