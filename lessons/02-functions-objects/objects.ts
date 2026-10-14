//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 02-functions-objects / objects (Object types, interface vs type)
//	History			: 2026-10-14 CYBERKDH Initial
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// 1) [JS] Object literal : no class needed, just { key: value }
const oWord = { strName: "WORD", nBits: 16 };
console.log("1)", oWord, "/ oWord.nBits =", oWord.nBits);
// oWord.nBytes; // ← Uncomment → red squiggle TS2339 (property does not exist)

// 2) [TS] interface : names the shape of an object
interface IWordSize {
	readonly strName: string; // readonly : can't be reassigned
	nBits: number;
	strNote?: string; // optional property
}
const oDword: IWordSize = { strName: "DWORD", nBits: 32 };
console.log("2)", oDword.strName, oDword.nBits, "/ strNote =", oDword.strNote);

// 3) [TS] type : can name an object shape too, and almost anything else
type TWordSize = {
	readonly strName: string;
	nBits: number;
	strNote?: string;
};
type TBits = number; // a type alias for a primitive (interface can't do this)
const oQword: TWordSize = { strName: "QWORD", nBits: 64 };
const nBits: TBits = oQword.nBits;
console.log("3)", oQword.strName, nBits);

// 4) [TS] Structural typing : same shape = compatible, whatever the name (C# is nominal)
const oFromType: IWordSize = oQword; // TWordSize → IWordSize : OK
const oPlain = { strName: "BYTE", nBits: 8, bSigned: false };
const oByte: IWordSize = oPlain; // extra property, but passed via a variable : OK
console.log("4)", oFromType.strName, oByte.strName, oByte.nBits);

// 5) [TS] Excess property check : a fresh object literal with an unknown key is flagged (typo guard)
// @ts-expect-error
const oTypo: IWordSize = { strName: "WORD", nBit: 16 }; // TS2561 : did you mean 'nBits'?
console.log("5) Without TS: oTypo.nBits =", oTypo.nBits);
console.log("   Why : the key was typed as nBit, so nBits does not exist.");
console.log("   Fix : TS flags the typo while you type. Write nBits.");

// 6) [TS] readonly exists only while checking. [JS] Object.freeze guards at runtime.
const oWritable: IWordSize = { strName: "WORD", nBits: 16 };
// @ts-expect-error
oWritable.strName = "CHANGED"; // TS2540 : read-only property
console.log("6) readonly at runtime:", oWritable.strName, "(type erased, so the assignment ran)");
try {
	const oFrozen: IWordSize = Object.freeze({ strName: "WORD", nBits: 16 });
	// @ts-expect-error
	oFrozen.strName = "CHANGED";
} catch (e) {
	console.log("   Expected error:", (e as Error).message);
	console.log("   Why : Object.freeze makes the object read-only at runtime.");
	console.log("   Fix : readonly for compile time, Object.freeze when it must hold at runtime.");
}

// 7) [TS] Extending : interface uses extends, type uses & (intersection)
interface IRegister extends IWordSize {
	biValue: bigint;
}
type TRegister = TWordSize & { biValue: bigint };
const oAx: IRegister = { strName: "AX", nBits: 16, biValue: 0xffn };
const oEax: TRegister = { strName: "EAX", nBits: 32, biValue: 0xffff_ffffn };
console.log("7)", oAx.strName, oAx.biValue, "/", oEax.strName, oEax.biValue);

// 8) [TS] Methods in an object type
interface IFormatter {
	strName: string;
	Format(biValue: bigint): string; // method
}
const oHexFormatter: IFormatter = {
	strName: "hex",
	Format(biValue) {
		return "0x" + biValue.toString(16).toUpperCase();
	},
};
console.log("8)", oHexFormatter.strName, oHexFormatter.Format(255n));
