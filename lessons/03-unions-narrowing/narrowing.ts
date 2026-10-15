//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 03-unions-narrowing / narrowing
//	History			: 2026-10-15 CYBERKDH Initial
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// 1) [JS + TS] typeof : after the check, TS knows the narrower type (hover over vValue in each branch)
function ToBigInt(vValue: string | number | bigint): bigint {
	if (typeof vValue === "bigint") {
		return vValue; // bigint here
	}
	if (typeof vValue === "number") {
		return BigInt(Math.trunc(vValue)); // number here
	}
	return BigInt(vValue.trim()); // only string is left
}
console.log("1) ToBigInt:", ToBigInt(255n), ToBigInt(255.9), ToBigInt(" 0xFF "));

// 2) [JS + TS] Truthiness : if (x) removes undefined — but also removes "" and 0
function Label(strName?: string): string {
	if (strName) {
		return strName; // string here
	}
	return "(none)"; // undefined or ""
}
console.log("2) Label:", Label("HEX"), Label(""), Label());

// 3) [JS + TS] Equality (===) : comparing with literals narrows to those literals
type TSign = "+" | "-";
function SignOf(strChar: string): TSign | undefined {
	if (strChar === "+" || strChar === "-") {
		return strChar; // "+" | "-" here
	}
	return undefined;
}
console.log("3) SignOf:", SignOf("-"), SignOf("x"));

// 4) [JS + TS] in : which object shape has this property?
interface IRegister {
	strName: string;
	biValue: bigint;
}
interface IFlag {
	strName: string;
	bOn: boolean;
}
function Show(oItem: IRegister | IFlag): string {
	if ("biValue" in oItem) {
		return `${oItem.strName} = ${oItem.biValue}`; // IRegister here
	}
	return `${oItem.strName} is ${oItem.bOn ? "on" : "off"}`; // IFlag here
}
console.log("4) Show:", Show({ strName: "AX", biValue: 255n }), "/", Show({ strName: "ZF", bOn: true }));

// 5) [JS + TS] Array.isArray : one value or a list
function CountInputs(vInput: string | string[]): number {
	return Array.isArray(vInput) ? vInput.length : 1; // string[] : string
}
console.log("5) CountInputs:", CountInputs("255"), CountInputs(["1", "2", "3"]));

// 6) [TS] User-defined type guard : a function that returns "strText is T"
const RADIX_NAMES = ["HEX", "DEC", "BIN"] as const;
type TRadixName = (typeof RADIX_NAMES)[number]; // "HEX" | "DEC" | "BIN"

function IsRadixName(strText: string): strText is TRadixName {
	return (RADIX_NAMES as readonly string[]).includes(strText);
}
for (const strText of ["HEX", "OCT"]) {
	if (IsRadixName(strText)) {
		const strName: TRadixName = strText; // narrowed by the guard
		console.log("6)", strName, "is a TRadixName");
	} else {
		console.log("6)", strText, "is just a string");
	}
}

// 7) [JS + TS] unknown : data from outside (JSON) must be checked step by step before use
const vData: unknown = JSON.parse('{"strName":"AX","nBits":16}');
if (typeof vData === "object" && vData !== null && "nBits" in vData && typeof vData.nBits === "number") {
	console.log("7) nBits from JSON =", vData.nBits);
}
// vData.nBits; // ← Uncomment → red squiggle TS18046 ('vData' is of type 'unknown')
