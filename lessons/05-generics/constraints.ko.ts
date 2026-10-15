//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 05-generics / constraints (제약 조건)
//	History			: 2026-10-15 CYBERKDH Initial (최초 작성)
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// 1) [TS] 제약 (constraint) 이 없으면 T 는 무엇이든 될 수 있으므로 쓸 수 있는 멤버가 없음
function LengthOf<T>(vItem: T): string {
	// return vItem.length; // ← 주석을 풀면 빨간 줄 TS2339 (타입 'T' 에 'length' 가 없음)
	return typeof vItem;
}
console.log("1) LengthOf =", LengthOf("0xFF"));

// 2) [TS] T extends { length: number } : length 가 있는 타입만
function Longest<T extends { length: number }>(vLeft: T, vRight: T): T {
	return vRight.length > vLeft.length ? vRight : vLeft;
}
console.log("2) Longest =", Longest("0xFF", "0b1111_1111"), "/", Longest([1, 2], [3]));
// Longest(10, 20); // ← 주석을 풀면 빨간 줄 TS2345 (number 에는 length 가 없음)

// 3) [TS] K extends keyof T : T 에 실제로 있는 키, 그리고 그 타입은 T[K]
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
// GetProp(oAx, "nBitz"); // ← 주석을 풀면 빨간 줄 TS2345 ("nBitz" 는 IRegister 의 키가 아님)
console.log("3) GetProp =", biValue, nBits);

// 4) [TS] 인터페이스를 제약으로 : 함수가 그 멤버를 쓸 수 있음
interface INamed {
	readonly strName: string;
}
function NameList<T extends INamed>(arrItem: readonly T[]): string {
	return arrItem.map((oItem) => oItem.strName).join(", ");
}
const arrReg: IRegister[] = [oAx, { strName: "BX", biValue: 1n, nBits: 16 }];
console.log("4) NameList =", NameList(arrReg)); // IRegister 에 strName 이 있으므로 통과

// 5) [TS] 기본 타입 인수 (default type argument) : <T = string>
interface IBox<T = string> {
	readonly vValue: T;
}
const oText: IBox = { vValue: "0xFF" }; // T = string (기본값)
const oNumber: IBox<bigint> = { vValue: 255n };
console.log("5) IBox =", oText.vValue, "/", oNumber.vValue);

// 6) [TS] 리터럴 타입을 유지하는 제네릭 : const T (TS 5.0+)
function Options<const T extends readonly string[]>(arrOption: T): T {
	return arrOption;
}
const arrRadix = Options(["HEX", "DEC", "BIN"]); // string[] 이 아니라 readonly ["HEX", "DEC", "BIN"]
console.log("6) Options =", arrRadix.join(" | "), "/ count =", arrRadix.length);
