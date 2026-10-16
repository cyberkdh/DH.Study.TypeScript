//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 11-regex-literal-types / literal-types
//	History			: 2026-10-15 CYBERKDH Initial
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// Literal types : a type that is one exact value ("K", 10n, true), and unions of them

// 1) [TS] const keeps the literal, let widens it. as const keeps every literal in an object or array
const strConstUnit = "K"; // type "K"
let strLetUnit = "K"; // type string : it may change later
strLetUnit = "anything";
const arrBits = [8, 16, 32, 64] as const; // readonly [8, 16, 32, 64]
type TBits = (typeof arrBits)[number]; // 8 | 16 | 32 | 64
const nBits: TBits = 32;
console.log("1)", strConstUnit, strLetUnit, arrBits.join(","), nBits);
// const nBad: TBits = 12; // ← Uncomment → red squiggle TS2322 (Type '12' is not assignable to type '8 | 16 | 32 | 64')

// 2) [TS] A union of literals, and a table that must have exactly those keys
type EUnit = "K" | "M" | "G" | "T";

const UNIT_SHIFT = { K: 10n, M: 20n, G: 30n, T: 40n } as const satisfies Record<EUnit, bigint>;
// Remove the T row → TS2741 (Property 'T' is missing). Add P: 50n → TS2353 (an unknown key)

// The value of a unit is known from its type : UNIT_SHIFT.K is 10n, not just bigint
const biShiftK: 10n = UNIT_SHIFT.K;
console.log("2) K shift :", biShiftK, "· 4K =", 4n << UNIT_SHIFT.K);

// 3) [TS] Text from outside is a string, never "K". A type guard checks it at run time
function IsUnit(strText: string): strText is EUnit {
	return Object.hasOwn(UNIT_SHIFT, strText); // own keys only : "toString" is not a unit
}

for (const strText of ["M", "m", "X", "toString"]) {
	const strUpper = strText.toUpperCase();
	console.log(`3) "${strText}" →`, IsUnit(strUpper) ? `1${strUpper} = ${1n << UNIT_SHIFT[strUpper]}` : "not a unit");
}

// 4) [TS] Template literal types : string types with a pattern
type THexText = `0x${string}`;
type TSizeText = `${number}${EUnit}`;
const strHex: THexText = "0xFF";
const strSize: TSizeText = "16M";
console.log("4)", strHex, strSize);
// const strBadHex: THexText = "FF"; // ← Uncomment → TS2322 (Type '"FF"' is not assignable to type '`0x${string}`')

// A union inside a template makes every combination
type EWordName = `${"U" | "I"}${8 | 16 | 32 | 64}`; // "U8" | "U16" | ... | "I64" : 8 members
const arrWordName: EWordName[] = ["U8", "I16", "U32", "I64"];
console.log("4) word names :", arrWordName.join(" "));

// Uppercase / Lowercase / Capitalize change the letters of a literal type
type ELowerUnit = Lowercase<EUnit>; // "k" | "m" | "g" | "t"
const strLower: ELowerUnit = "k";
console.log("4) lower unit :", strLower);

// 5) [TS] A regex test can be a type guard for a template literal type
function IsHexText(strText: string): strText is THexText {
	return /^0x[0-9a-f]+$/i.test(strText);
}

function HexValue(strText: THexText): bigint {
	return BigInt(strText); // BigInt reads 0x... itself
}

for (const strText of ["0x1F", "1F"]) {
	console.log(`5) "${strText}" →`, IsHexText(strText) ? HexValue(strText) : "not hex");
}

// 6) [TS] infer inside a template : take a part of a literal type apart
type TUnitOf<T extends string> = T extends `${string}${infer EU extends EUnit}` ? EU : never;
type EUnitOf16M = TUnitOf<"16M">; // "M"
type EUnitOfBad = TUnitOf<"16X">; // never
const strUnitOf: EUnitOf16M = "M";
const arrNone: EUnitOfBad[] = []; // never : nothing can be put in
console.log("6) TUnitOf<\"16M\"> :", strUnitOf, "· TUnitOf<\"16X\"> holds", arrNone.length, "values");

// 7) Literal types are erased : at run time a unit is just a string
console.log("7) Expected error (a type does not check input):", JSON.parse('{ "unit": "X" }').unit as EUnit);
console.log("   Why : as EUnit only tells the compiler, and JSON.parse returns any. Nothing checked it.");
console.log("   Fix : check text from outside with a type guard like IsUnit (section 3) before using it as EUnit.");
