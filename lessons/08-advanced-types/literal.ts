//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 08-advanced-types / literal
//	History			: 2026-10-15 CYBERKDH Initial
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// Template literal types : string types written like template strings, plus satisfies

// 1) [TS] A pattern : any string that starts with "0x"
type THexText = `0x${string}`;
const strHex: THexText = "0xFF";
// const strNoPrefix: THexText = "FF"; // ← Uncomment → red squiggle TS2322 (Type '"FF"' is not assignable to type '`0x${string}`')
console.log("1) pattern :", strHex, BigInt(strHex));

// 2) [TS] Unions inside : every combination is made
type ESign = "i" | "u";
type ESize = 8 | 16 | 32 | 64;
type EIntName = `${ESign}${ESize}`; // "i8" | "i16" | ... | "u64" (2 × 4 = 8 names)
const arrName: EIntName[] = ["i8", "u16", "i32", "u64"];
// const strBad: EIntName = "u12"; // ← Uncomment → red squiggle TS2322 (Type '"u12"' is not assignable to type ...)
console.log("2) combinations :", arrName.join(" "));

// 3) [TS] Built-in string types : Uppercase, Lowercase, Capitalize, Uncapitalize
type ERadix = "hex" | "dec" | "bin";
type ERadixLabel = Uppercase<ERadix>; // "HEX" | "DEC" | "BIN"
type EShowFlag = `--show-${ERadix}`; // "--show-hex" | "--show-dec" | "--show-bin"
type EHandlerName = `On${Capitalize<ERadix>}`; // "OnHex" | "OnDec" | "OnBin"
const strLabel: ERadixLabel = "HEX";
const strFlag: EShowFlag = "--show-bin";
const strHandler: EHandlerName = "OnDec";
console.log("3) built-in :", strLabel, strFlag, strHandler);

// 4) [JS + TS] A string from outside is just string : check it with a type guard
const RE_HEX = /^0x[0-9a-f]+$/i;
function IsHexText(strText: string): strText is THexText {
	return RE_HEX.test(strText);
}
for (const strInput of ["0x1F", "1F"]) {
	if (IsHexText(strInput)) {
		const strChecked: THexText = strInput; // narrowed
		console.log("4) guard :", strChecked, "→", BigInt(strChecked));
	} else {
		console.log("4) guard : Expected error:", JSON.stringify(strInput), "is not a hex text");
		console.log("   Why : the type guard IsHexText checks the pattern at run time; the type alone can't.");
		console.log("   Fix : write the 0x prefix, e.g. 0x1F");
	}
}

// 5) [TS] Pull parts out with infer
type TFlagName<T> = T extends `--${infer N}=${string}` ? N : never;
const strFlagName: TFlagName<"--bits=32"> = "bits";
console.log("5) infer in a template :", strFlagName);

// 6) [TS] Three ways to give an object a type
interface IOperatorInfo {
	strName: string;
	nPrecedence: number;
}
type ECalcOperator = "+" | "-" | "<<";

// 6-1) Annotation : checked, but the value types are widened (strName is just string)
const ANNOTATED: Record<ECalcOperator, IOperatorInfo> = {
	"+": { strName: "add", nPrecedence: 4 },
	"-": { strName: "subtract", nPrecedence: 4 },
	"<<": { strName: "shift left", nPrecedence: 3 },
};
console.log("6-1) annotation :", ANNOTATED["+"].strName);

// 6-2) as : NOT checked. A missing key is accepted and fails later at run time
const CAST = { "+": { strName: "add", nPrecedence: 4 } } as Record<ECalcOperator, IOperatorInfo>;
// const CAST_BAD = { "+": "add" } as Record<ECalcOperator, IOperatorInfo>; // ← Uncomment → red squiggle TS2352 (Conversion of type ... may be a mistake)
try {
	console.log("6-2) as :", CAST["<<"].strName.toUpperCase());
} catch (e) {
	console.log("6-2) as : Expected error:", (e as Error).name, "-", (e as Error).message);
	console.log("     Why : 'as' tells TS to trust you, so the missing \"<<\" key was not checked.");
	console.log("     Fix : use satisfies (6-3) or an annotation (6-1); TS then reports the missing key.");
}

// 6-3) satisfies : checked like an annotation, but the exact type of the value is kept
const SATISFIED = {
	"+": { strName: "add", nPrecedence: 4 },
	"-": { strName: "subtract", nPrecedence: 4 },
	"<<": { strName: "shift left", nPrecedence: 3 },
} as const satisfies Record<ECalcOperator, IOperatorInfo>;
// Remove the "<<" entry → TS2741 (Property '"<<"' is missing ... but required in type 'Record<ECalcOperator, IOperatorInfo>')
const strExact: "shift left" = SATISFIED["<<"].strName; // the literal type is kept
// const strExactBad: "shift left" = ANNOTATED["<<"].strName; // ← Uncomment → red squiggle TS2322 (Type 'string' is not assignable to type '"shift left"')
console.log("6-3) satisfies :", strExact, "/ keys :", Object.keys(SATISFIED).join(" "));
