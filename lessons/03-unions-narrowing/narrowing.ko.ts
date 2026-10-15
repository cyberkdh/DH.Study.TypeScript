//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 03-unions-narrowing / narrowing (타입 좁히기)
//	History			: 2026-10-15 CYBERKDH Initial (최초 작성)
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// 1) [JS + TS] typeof : 검사한 뒤에는 TS 가 더 좁은 타입을 안다 (분기마다 vValue 에 마우스를 올려 보자)
function ToBigInt(vValue: string | number | bigint): bigint {
	if (typeof vValue === "bigint") {
		return vValue; // 여기서는 bigint
	}
	if (typeof vValue === "number") {
		return BigInt(Math.trunc(vValue)); // 여기서는 number
	}
	return BigInt(vValue.trim()); // 남은 것은 string 뿐
}
console.log("1) ToBigInt:", ToBigInt(255n), ToBigInt(255.9), ToBigInt(" 0xFF "));

// 2) [JS + TS] truthy / falsy 검사 : if (x) 는 undefined 를 걸러 낸다 — 하지만 "" 와 0 도 걸러 낸다
function Label(strName?: string): string {
	if (strName) {
		return strName; // 여기서는 string
	}
	return "(none)"; // undefined 또는 ""
}
console.log("2) Label:", Label("HEX"), Label(""), Label());

// 3) [JS + TS] 동등 비교 (===) : 리터럴과 비교하면 그 리터럴로 좁혀진다
type TSign = "+" | "-";
function SignOf(strChar: string): TSign | undefined {
	if (strChar === "+" || strChar === "-") {
		return strChar; // 여기서는 "+" | "-"
	}
	return undefined;
}
console.log("3) SignOf:", SignOf("-"), SignOf("x"));

// 4) [JS + TS] in : 이 프로퍼티가 있는 객체 모양은 어느 쪽인가?
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
		return `${oItem.strName} = ${oItem.biValue}`; // 여기서는 IRegister
	}
	return `${oItem.strName} is ${oItem.bOn ? "on" : "off"}`; // 여기서는 IFlag
}
console.log("4) Show:", Show({ strName: "AX", biValue: 255n }), "/", Show({ strName: "ZF", bOn: true }));

// 5) [JS + TS] Array.isArray : 값 하나 또는 목록
function CountInputs(vInput: string | string[]): number {
	return Array.isArray(vInput) ? vInput.length : 1; // string[] : string
}
console.log("5) CountInputs:", CountInputs("255"), CountInputs(["1", "2", "3"]));

// 6) [TS] 사용자 정의 타입 가드 : "strText is T" 를 돌려주는 함수
const RADIX_NAMES = ["HEX", "DEC", "BIN"] as const;
type TRadixName = (typeof RADIX_NAMES)[number]; // "HEX" | "DEC" | "BIN"

function IsRadixName(strText: string): strText is TRadixName {
	return (RADIX_NAMES as readonly string[]).includes(strText);
}
for (const strText of ["HEX", "OCT"]) {
	if (IsRadixName(strText)) {
		const strName: TRadixName = strText; // 가드 덕분에 좁혀짐
		console.log("6)", strName, "is a TRadixName");
	} else {
		console.log("6)", strText, "is just a string");
	}
}

// 7) [JS + TS] unknown : 외부(JSON)에서 온 데이터는 쓰기 전에 한 단계씩 확인해야 한다
const vData: unknown = JSON.parse('{"strName":"AX","nBits":16}');
if (typeof vData === "object" && vData !== null && "nBits" in vData && typeof vData.nBits === "number") {
	console.log("7) nBits from JSON =", vData.nBits);
}
// vData.nBits; // ← 주석을 풀면 빨간 줄 TS18046 ('vData' 는 unknown 타입)
