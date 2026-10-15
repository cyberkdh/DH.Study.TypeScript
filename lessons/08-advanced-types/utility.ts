//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 08-advanced-types / utility
//	History			: 2026-10-15 CYBERKDH Initial
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// Built-in utility types : new types made from a type you already have
interface IRegister {
	readonly strName: string;
	nValue: number;
	strNote?: string;
}

const AX: IRegister = { strName: "AX", nValue: 0x1234 };

// 1) [TS] Partial<T> : every property optional. Good for "change only these fields"
function UpdateRegister(oRegister: IRegister, oChange: Partial<IRegister>): IRegister {
	return { ...oRegister, ...oChange };
}
const oChanged = UpdateRegister(AX, { nValue: 0xff });
console.log("1) Partial  :", JSON.stringify(oChanged));
// UpdateRegister(AX, { nValu: 1 }); // ← Uncomment → red squiggle TS2561 (Object literal may only specify known properties)

// 2) [TS] Required<T> : every property required (the ? is removed)
const oDocumented: Required<IRegister> = { strName: "BX", nValue: 0, strNote: "base register" };
// const oNoNote: Required<IRegister> = { strName: "CX", nValue: 0 }; // ← Uncomment → red squiggle TS2741 (Property 'strNote' is missing)
console.log("2) Required :", oDocumented.strNote.toUpperCase());

// 3) [TS] Readonly<T> : every property readonly. Only TS checks it; Object.freeze also stops it at run time
const oFixed: Readonly<IRegister> = { strName: "CX", nValue: 1 };
// oFixed.nValue = 2; // ← Uncomment → red squiggle TS2540 (Cannot assign to 'nValue' because it is a read-only property)
const oFrozen = Object.freeze({ strName: "DX", nValue: 2 }); // Readonly<{ strName: string; nValue: number }>
try {
	(oFrozen as { nValue: number }).nValue = 3; // the cast hides it from TS, but the object is frozen
} catch (e) {
	console.log("3) Readonly :", oFixed.nValue, "/ Expected error:", (e as Error).name);
	console.log("   Why : Object.freeze stops changes at run time. Readonly<T> alone only stops them in the editor.");
	console.log("   Fix : don't cast readonly away. Make a changed copy instead : { ...oFrozen, nValue: 3 }");
}

// 4) [TS] Pick<T, K> keeps some keys, Omit<T, K> removes some
type TRegisterValue = Pick<IRegister, "strName" | "nValue">; // { readonly strName; nValue }
type TNewRegister = Omit<IRegister, "strName">; // { nValue; strNote? }
const oPicked: TRegisterValue = { strName: "SP", nValue: 0xfffe };
const oNew: TNewRegister = { nValue: 0 };
console.log("4) Pick / Omit :", Object.keys(oPicked).join(","), "/", Object.keys(oNew).join(","));

// 5) [TS] Record<K, V> : an object with keys K and values V. With a union K, every key is required
type EWordName = "BYTE" | "WORD" | "DWORD" | "QWORD";
const WORD_BITS: Record<EWordName, number> = { BYTE: 8, WORD: 16, DWORD: 32, QWORD: 64 };
// const WORD_BAD: Record<EWordName, number> = { BYTE: 8, WORD: 16 }; // ← Uncomment → red squiggle TS2739 (missing DWORD, QWORD)
console.log("5) Record :", Object.entries(WORD_BITS).map(([strKey, nBits]) => `${strKey}=${nBits}`).join(" "));

// 6) [TS] Types from functions : ReturnType, Parameters, Awaited
function ParseHex(strText: string, bStrict = true): { bOk: boolean; nValue: number } {
	const nValue = Number.parseInt(strText, 16);
	return { bOk: !Number.isNaN(nValue) && (!bStrict || /^[0-9a-f]+$/i.test(strText)), nValue };
}
async function LoadValue(): Promise<bigint> {
	return 255n;
}
type TParseResult = ReturnType<typeof ParseHex>; // { bOk: boolean; nValue: number }
type TParseArgs = Parameters<typeof ParseHex>; // [strText: string, bStrict?: boolean]
type TLoaded = Awaited<ReturnType<typeof LoadValue>>; // bigint (Promise<bigint> unwrapped)
const arrArgs: TParseArgs = ["ff"];
const oParsed: TParseResult = ParseHex(...arrArgs);
const biLoaded: TLoaded = await LoadValue();
console.log("6) ReturnType / Parameters / Awaited :", JSON.stringify(oParsed), arrArgs.length, biLoaded);

// 7) [TS] Union filters : Exclude, Extract, NonNullable
type EOperator = "+" | "-" | "&" | "|" | "<<" | ">>";
type EBitOperator = Extract<EOperator, "&" | "|" | "<<" | ">>">; // only these
type EMathOperator = Exclude<EOperator, EBitOperator>; // "+" | "-"
type TMaybeText = string | null | undefined;
const strText: NonNullable<TMaybeText> = "never null";
const arrMath: EMathOperator[] = ["+", "-"];
// const strWrong: EMathOperator = "&"; // ← Uncomment → red squiggle TS2322 (Type '"&"' is not assignable)
console.log("7) Exclude / Extract / NonNullable :", arrMath.join(" "), "/", strText);

// 8) [JS] Utility types are erased : at run time there is only the plain object
console.log("8) at run time oDocumented is just", typeof oDocumented, "with keys", Object.keys(oDocumented).join(","));
