//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 05-generics / constraints
//	History			: 2026-10-15 CYBERKDH Initial
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// 1) [TS] Without a constraint, T could be anything, so it has no members
function LengthOf<T>(vItem: T): string {
	// return vItem.length; // ← Uncomment → red squiggle TS2339 ('length' does not exist on type 'T')
	return typeof vItem;
}
console.log("1) LengthOf =", LengthOf("0xFF"));

// 2) [TS] T extends { length: number } : only types that have length
function Longest<T extends { length: number }>(vLeft: T, vRight: T): T {
	return vRight.length > vLeft.length ? vRight : vLeft;
}
console.log("2) Longest =", Longest("0xFF", "0b1111_1111"), "/", Longest([1, 2], [3]));
// Longest(10, 20); // ← Uncomment → red squiggle TS2345 (number has no length)

// 3) [TS] K extends keyof T : a key that really exists on T, and T[K] for its type
interface IRegister {
	strName: string;
	biValue: bigint;
	nBits: number;
}
function GetProp<T, K extends keyof T>(oItem: T, strKey: K): T[K] {
	return oItem[strKey];
}
const oAx: IRegister = { strName: "AX", biValue: 0xffn, nBits: 16 };
const biValue = GetProp(oAx, "biValue"); // bigint
const nBits = GetProp(oAx, "nBits"); // number
// GetProp(oAx, "nBitz"); // ← Uncomment → red squiggle TS2345 ("nBitz" is not a key of IRegister)
console.log("3) GetProp =", biValue, nBits);

// 4) [TS] A constraint that is an interface : the function can use its members
interface INamed {
	readonly strName: string;
}
function NameList<T extends INamed>(arrItem: readonly T[]): string {
	return arrItem.map((oItem) => oItem.strName).join(", ");
}
const arrReg: IRegister[] = [oAx, { strName: "BX", biValue: 1n, nBits: 16 }];
console.log("4) NameList =", NameList(arrReg)); // IRegister has strName, so it fits

// 5) [TS] A default type argument : <T = string>
interface IBox<T = string> {
	readonly vValue: T;
}
const oText: IBox = { vValue: "0xFF" }; // T = string (default)
const oNumber: IBox<bigint> = { vValue: 255n };
console.log("5) IBox =", oText.vValue, "/", oNumber.vValue);

// 6) [TS] Generics keep literal types : const T (TS 5.0+)
function Options<const T extends readonly string[]>(arrOption: T): T {
	return arrOption;
}
const arrRadix = Options(["HEX", "DEC", "BIN"]); // readonly ["HEX", "DEC", "BIN"], not string[]
console.log("6) Options =", arrRadix.join(" | "), "/ count =", arrRadix.length);
