//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 03-unions-narrowing / optional
//	History			: 2026-10-15 CYBERKDH Initial
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

interface IGrouping {
	nSize?: number;
	strSeparator?: string;
}
interface IConfig {
	strName: string;
	oGrouping?: IGrouping;
}
const oFull: IConfig = { strName: "full", oGrouping: { nSize: 4, strSeparator: "_" } };
const oEmpty: IConfig = { strName: "empty" };
const oOff: IConfig = { strName: "off", oGrouping: { nSize: 0, strSeparator: "" } };

// 1) [JS] Optional chaining ?. : stops and gives undefined instead of throwing
console.log("1) full:", oFull.oGrouping?.nSize, "/ empty:", oEmpty.oGrouping?.nSize);

// 2) [JS] ?? : default only for null / undefined.   || : default for every falsy value (0, "", false too)
const nSizeQQ = oOff.oGrouping?.nSize ?? 4;
const nSizeOr = oOff.oGrouping?.nSize || 4;
console.log("2) nSize 0 with ?? =", nSizeQQ, "/ with || =", nSizeOr, "(0 was lost)");
const strSepQQ = oOff.oGrouping?.strSeparator ?? "_";
const strSepOr = oOff.oGrouping?.strSeparator || "_";
console.log("   separator \"\" with ?? =", JSON.stringify(strSepQQ), "/ with || =", JSON.stringify(strSepOr));

// 3) [TS] noUncheckedIndexedAccess : arr[i] is T | undefined (C# throws IndexOutOfRange; JS gives undefined)
const arrDigit = ["0", "1"];
const strThird = arrDigit[2]; // string | undefined
console.log("3) arrDigit[2] =", strThird, "/ length =", strThird?.length ?? 0);
// strThird.length; // ← Uncomment → red squiggle TS18048 ('strThird' is possibly 'undefined')

// 4) [TS] Early return : after "if undefined → return", the rest of the function sees only string
function FirstChar(strText: string): string {
	const strChar = strText[0]; // string | undefined
	if (strChar === undefined) {
		return "(empty)";
	}
	return strChar.toUpperCase(); // string here
}
console.log("4) FirstChar:", FirstChar("hex"), FirstChar(""));

// 5) [TS] Non-null assertion ! : "trust me, it is not undefined" — no check at runtime
const strFirst = arrDigit[0]!; // correct promise : index 0 exists
console.log("5) arrDigit[0]! =", strFirst);
try {
	const strMissing = arrDigit[5]!; // wrong promise
	console.log(strMissing.length);
} catch (e) {
	console.log("   Expected error:", (e as Error).message);
	console.log("   Why : ! only silences TS; the value was still undefined at runtime.");
	console.log("   Fix : check it (if / ?? / ?.) instead of using !.");
}
