//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 02-functions-objects / parameters (Optional, default, rest, options object)
//	History			: 2026-10-14 CYBERKDH Initial
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// 1) [TS] Optional parameter "?" : may be left out, and is then undefined
function Greet(strName: string, strTitle?: string): string {
	// strTitle is string | undefined here, so check it first
	return strTitle === undefined ? `Hello, ${strName}` : `Hello, ${strTitle} ${strName}`;
}
console.log("1)", Greet("Hong"), "/", Greet("Hong", "Dr."));

// 2) [JS] Default value : used when the argument is left out (the type is inferred from it)
function ToRadix(nValue: number, nRadix = 16): string {
	return nValue.toString(nRadix);
}
console.log("2) ToRadix(255) =", ToRadix(255), "/ ToRadix(255, 2) =", ToRadix(255, 2));

// 3) [JS] Rest parameter "..." : any number of arguments, collected into an array. Like C# params.
//    The ": number[]" part is [TS]
function Sum(...arrNum: number[]): number {
	let nTotal = 0;
	for (const nValue of arrNum) {
		nTotal += nValue;
	}
	return nTotal;
}
console.log("3) Sum() =", Sum(), "/ Sum(1, 2, 3) =", Sum(1, 2, 3));

// 4) [JS] Spread : expand an array into separate arguments
const arrBits = [8, 16, 32, 64];
console.log("4) Sum(...arrBits) =", Sum(...arrBits), "/ Math.max(...arrBits) =", Math.max(...arrBits));

// 5) [JS + TS] Options object : many optional settings in one object, destructured with defaults
//    (plays the role of C# named arguments)
function FormatHex(nValue: number, { bPrefix = true, bUpperCase = true }: { bPrefix?: boolean; bUpperCase?: boolean } = {}): string {
	const strDigits = nValue.toString(16);
	return (bPrefix ? "0x" : "") + (bUpperCase ? strDigits.toUpperCase() : strDigits);
}
console.log("5)", FormatHex(255), FormatHex(255, { bUpperCase: false }), FormatHex(255, { bPrefix: false }));

// 6) [TS] Parameter order : an optional parameter can't come before a required one
// function Bad(strTitle?: string, strName: string) {} // ← Uncomment → red squiggle TS1016
console.log("6) Optional parameters go last (TS1016 otherwise).");
