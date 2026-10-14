//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 01-basic-types / variables
//	History			: 2026-10-14 CYBERKDH Initial
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// Form : keyword name: type = value;   (the type comes after the name, the opposite of C#)

// 1) [JS] const (default) / let (only when the value must change)
const nMax = 10;
let nCount = 0;
nCount = nCount + 1;
console.log("1) const nMax =", nMax, "/ let nCount =", nCount);
// nMax = 20; // ← Uncomment → red squiggle TS2588 (can't assign to a constant)

// 2) [JS] Reassigning a const also fails at runtime
try {
	const nFixed = 1;
	// @ts-expect-error
	nFixed = 2;
	console.log(nFixed); // Never reached
} catch (e) {
	console.log("2) Expected error:", (e as Error).message);
	console.log("   Why : a const can't be given a new value.");
	console.log("   Fix : use let when the value must change.");
}

// 3) [JS] const blocks reassignment only. The contents of an array/object can still change.
const arrNum = [1, 2];
arrNum.push(3); // OK
// arrNum = [];  // ← Uncomment → red squiggle TS2588
console.log("3) const arrNum after push(3) =", arrNum);

// 4) [TS] Annotation vs inference. const gets the literal type, let gets the wider type.
const strName: string = "DevCalc"; // annotation : string
const strBase = "HEX"; // inferred : "HEX"  (literal type)
let strMode = "HEX"; // inferred : string (widening)
const biOne = 1n; // inferred : 1n
let biTotal = 1n; // inferred : bigint
strMode = "DEC";
biTotal += biOne;
console.log("4)", strName, strBase, strMode, biTotal, "/ typeof 1n =", typeof biOne);

// 5) [TS] Declare first, assign later : the annotation is required
let nLater: number;
// console.log(nLater); // ← Uncomment → red squiggle TS2454 (used before being assigned)
nLater = 5;
console.log("5) nLater =", nLater);

// 6) [JS] Destructuring : declare several variables at once
const oPerson = { strUser: "Hong", nAge: 30 };
const { strUser, nAge } = oPerson;
const [nFirst, nSecond] = [10, 20];
console.log("6)", strUser, nAge, nFirst, nSecond);

// 7) [JS] let/const can't be used before the declaration line
try {
	// @ts-expect-error
	console.log(nEarly);
	const nEarly = 1;
} catch (e) {
	console.log("7) Expected error:", (e as Error).message);
	console.log("   Why : let/const exist only from their declaration line down.");
	console.log("   Fix : declare first, then use.");
}

// 8) [JS] var : old JS. It ignores { } blocks, so don't use it.
for (var nIdx = 0; nIdx < 3; nIdx++) {
	// loop body
}
console.log("8) var nIdx after the loop =", nIdx, "(still alive outside the loop)");
