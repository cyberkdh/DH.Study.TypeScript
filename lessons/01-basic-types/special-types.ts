//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 01-basic-types / special-types
//	History			: 2026-10-14 CYBERKDH Initial
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// 1) [TS] any : turns type checking off → anything goes (avoid when possible)
const vAny: any = "hello";
console.log(vAny.toFixed); // Compiles, but undefined at runtime (string has no toFixed)

// 2) [TS] unknown : "not known yet" → nothing is allowed until you check (safer than any)
const vUnknown: unknown = JSON.parse("255");
// vUnknown.toString(16);        // ← Uncomment → red squiggle
if (typeof vUnknown === "number") {
	console.log("hex:", vUnknown.toString(16)); // Narrowed to number here (lesson 03)
}

// 3) [JS + TS] null and undefined : two ways to say "no value"
//    With strict, null can't go into a string variable (like C# nullable reference types)
let strMaybe: string | null = null;
strMaybe = "now it has a value";
console.log(strMaybe);

// 4) [TS] void : a function that returns nothing
//    never : a function that never finishes normally
function PrintLine(strText: string): void {
	console.log(strText);
}
function Fail(strMessage: string): never {
	throw new Error(strMessage);
}

PrintLine("void function called");
try {
	Fail("a never function always throws");
} catch (e) {
	console.log("caught:", (e as Error).message);
}
