//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 11-regex-literal-types / literal-types (리터럴 타입)
//	History			: 2026-10-15 CYBERKDH Initial (최초 작성)
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// 리터럴 타입 (literal type) : 정확히 값 하나인 타입 ("K", 10n, true), 그리고 그것들의 유니온

// 1) [TS] const 는 리터럴을 유지하고, let 은 넓힘 (widening). as const 는 객체나 배열 안의 리터럴을 모두 유지
const strConstUnit = "K"; // 타입 "K"
let strLetUnit = "K"; // 타입 string : 나중에 바뀔 수 있으니까
strLetUnit = "anything";
const arrBits = [8, 16, 32, 64] as const; // readonly [8, 16, 32, 64]
type TBits = (typeof arrBits)[number]; // 8 | 16 | 32 | 64
const nBits: TBits = 32;
console.log("1)", strConstUnit, strLetUnit, arrBits.join(","), nBits);
// const nBad: TBits = 12; // ← 주석을 풀면 빨간 줄 TS2322 ('12' 타입은 '8 | 16 | 32 | 64' 에 대입할 수 없음)

// 2) [TS] 리터럴 유니온, 그리고 정확히 그 키들을 가져야 하는 표
type EUnit = "K" | "M" | "G" | "T";

const UNIT_SHIFT = { K: 10n, M: 20n, G: 30n, T: 40n } as const satisfies Record<EUnit, bigint>;
// T 행을 지우면 → TS2741 ('T' 속성이 없음). P: 50n 을 더하면 → TS2353 (모르는 키)

// 단위의 값을 타입으로 알 수 있음 : UNIT_SHIFT.K 는 그냥 bigint 가 아니라 10n
const biShiftK: 10n = UNIT_SHIFT.K;
console.log("2) K shift :", biShiftK, "· 4K =", 4n << UNIT_SHIFT.K);

// 3) [TS] 바깥에서 온 텍스트는 string 이지, "K" 가 아님. 타입 가드 (type guard) 가 실행 중에 확인
function IsUnit(strText: string): strText is EUnit {
	return Object.hasOwn(UNIT_SHIFT, strText); // 자기 키만 : "toString" 은 단위가 아님
}

for (const strText of ["M", "m", "X", "toString"]) {
	const strUpper = strText.toUpperCase();
	console.log(`3) "${strText}" →`, IsUnit(strUpper) ? `1${strUpper} = ${1n << UNIT_SHIFT[strUpper]}` : "not a unit");
}

// 4) [TS] 템플릿 리터럴 타입 (template literal type) : 패턴이 있는 문자열 타입
type THexText = `0x${string}`;
type TSizeText = `${number}${EUnit}`;
const strHex: THexText = "0xFF";
const strSize: TSizeText = "16M";
console.log("4)", strHex, strSize);
// const strBadHex: THexText = "FF"; // ← 주석을 풀면 TS2322 ('"FF"' 타입은 '`0x${string}`' 에 대입할 수 없음)

// 템플릿 안의 유니온은 모든 조합을 만듦
type EWordName = `${"U" | "I"}${8 | 16 | 32 | 64}`; // "U8" | "U16" | ... | "I64" : 8 개
const arrWordName: EWordName[] = ["U8", "I16", "U32", "I64"];
console.log("4) word names :", arrWordName.join(" "));

// Uppercase / Lowercase / Capitalize 는 리터럴 타입의 글자를 바꿈
type ELowerUnit = Lowercase<EUnit>; // "k" | "m" | "g" | "t"
const strLower: ELowerUnit = "k";
console.log("4) lower unit :", strLower);

// 5) [TS] 정규식 검사가 템플릿 리터럴 타입의 타입 가드가 될 수 있음
function IsHexText(strText: string): strText is THexText {
	return /^0x[0-9a-f]+$/i.test(strText);
}

function HexValue(strText: THexText): bigint {
	return BigInt(strText); // BigInt 는 0x... 를 직접 읽음
}

for (const strText of ["0x1F", "1F"]) {
	console.log(`5) "${strText}" →`, IsHexText(strText) ? HexValue(strText) : "not hex");
}

// 6) [TS] 템플릿 안의 infer : 리터럴 타입을 부분으로 나눔
type TUnitOf<T extends string> = T extends `${string}${infer EU extends EUnit}` ? EU : never;
type EUnitOf16M = TUnitOf<"16M">; // "M"
type EUnitOfBad = TUnitOf<"16X">; // never
const strUnitOf: EUnitOf16M = "M";
const arrNone: EUnitOfBad[] = []; // never : 아무것도 넣을 수 없음
console.log("6) TUnitOf<\"16M\"> :", strUnitOf, "· TUnitOf<\"16X\"> holds", arrNone.length, "values");

// 7) 리터럴 타입은 지워짐 (erased) : 실행 중에 단위는 그냥 문자열
console.log("7) Expected error (a type does not check input):", JSON.parse('{ "unit": "X" }').unit as EUnit);
console.log("   Why : as EUnit only tells the compiler, and JSON.parse returns any. Nothing checked it.");
console.log("   Fix : check text from outside with a type guard like IsUnit (section 3) before using it as EUnit.");
