//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 08-advanced-types / literal (템플릿 리터럴 타입과 satisfies)
//	History			: 2026-10-15 CYBERKDH Initial (최초 작성)
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// 템플릿 리터럴 타입 (template literal types) : 템플릿 문자열처럼 쓰는 문자열 타입, 그리고 satisfies

// 1) [TS] 패턴 : "0x" 로 시작하는 모든 문자열
type THexText = `0x${string}`;
const strHex: THexText = "0xFF";
// const strNoPrefix: THexText = "FF"; // ← 주석을 풀면 빨간 줄 TS2322 ('"FF"' 타입은 '`0x${string}`' 타입에 대입할 수 없음)
console.log("1) pattern :", strHex, BigInt(strHex));

// 2) [TS] 유니온을 넣으면 : 모든 조합이 만들어짐
type ESign = "i" | "u";
type ESize = 8 | 16 | 32 | 64;
type EIntName = `${ESign}${ESize}`; // "i8" | "i16" | ... | "u64" (2 × 4 = 8 개 이름)
const arrName: EIntName[] = ["i8", "u16", "i32", "u64"];
// const strBad: EIntName = "u12"; // ← 주석을 풀면 빨간 줄 TS2322 ('"u12"' 타입은 ... 타입에 대입할 수 없음)
console.log("2) combinations :", arrName.join(" "));

// 3) [TS] 내장 문자열 타입 : Uppercase, Lowercase, Capitalize, Uncapitalize
type ERadix = "hex" | "dec" | "bin";
type ERadixLabel = Uppercase<ERadix>; // "HEX" | "DEC" | "BIN"
type EShowFlag = `--show-${ERadix}`; // "--show-hex" | "--show-dec" | "--show-bin"
type EHandlerName = `On${Capitalize<ERadix>}`; // "OnHex" | "OnDec" | "OnBin"
const strLabel: ERadixLabel = "HEX";
const strFlag: EShowFlag = "--show-bin";
const strHandler: EHandlerName = "OnDec";
console.log("3) built-in :", strLabel, strFlag, strHandler);

// 4) [JS + TS] 외부에서 들어온 문자열은 그냥 string : 타입 가드로 확인
const RE_HEX = /^0x[0-9a-f]+$/i;
function IsHexText(strText: string): strText is THexText {
	return RE_HEX.test(strText);
}
for (const strInput of ["0x1F", "1F"]) {
	if (IsHexText(strInput)) {
		const strChecked: THexText = strInput; // 좁혀짐
		console.log("4) guard :", strChecked, "→", BigInt(strChecked));
	} else {
		console.log("4) guard : Expected error:", JSON.stringify(strInput), "is not a hex text");
		console.log("   Why : the type guard IsHexText checks the pattern at run time; the type alone can't.");
		console.log("   Fix : write the 0x prefix, e.g. 0x1F");
	}
}

// 5) [TS] infer 로 일부 추출
type TFlagName<T> = T extends `--${infer N}=${string}` ? N : never;
const strFlagName: TFlagName<"--bits=32"> = "bits";
console.log("5) infer in a template :", strFlagName);

// 6) [TS] 객체에 타입을 주는 세 가지 방법
interface IOperatorInfo {
	strName: string;
	nPrecedence: number;
}
type ECalcOperator = "+" | "-" | "<<";

// 6-1) 타입 표기 (annotation) : 검사되지만, 값 타입이 넓어짐 (strName 은 그냥 string)
const ANNOTATED: Record<ECalcOperator, IOperatorInfo> = {
	"+": { strName: "add", nPrecedence: 4 },
	"-": { strName: "subtract", nPrecedence: 4 },
	"<<": { strName: "shift left", nPrecedence: 3 },
};
console.log("6-1) annotation :", ANNOTATED["+"].strName);

// 6-2) as : 검사되지 않음. 빠진 키도 통과하고 나중에 실행 시점에 실패
const CAST = { "+": { strName: "add", nPrecedence: 4 } } as Record<ECalcOperator, IOperatorInfo>;
// const CAST_BAD = { "+": "add" } as Record<ECalcOperator, IOperatorInfo>; // ← 주석을 풀면 빨간 줄 TS2352 (... 타입으로의 변환은 실수일 수 있음)
try {
	console.log("6-2) as :", CAST["<<"].strName.toUpperCase());
} catch (e) {
	console.log("6-2) as : Expected error:", (e as Error).name, "-", (e as Error).message);
	console.log("     Why : 'as' tells TS to trust you, so the missing \"<<\" key was not checked.");
	console.log("     Fix : use satisfies (6-3) or an annotation (6-1); TS then reports the missing key.");
}

// 6-3) satisfies : 타입 표기처럼 검사되지만, 값의 정확한 타입은 유지
const SATISFIED = {
	"+": { strName: "add", nPrecedence: 4 },
	"-": { strName: "subtract", nPrecedence: 4 },
	"<<": { strName: "shift left", nPrecedence: 3 },
} as const satisfies Record<ECalcOperator, IOperatorInfo>;
// "<<" 항목을 지우면 → TS2741 ('"<<"' 프로퍼티가 없음 ... 'Record<ECalcOperator, IOperatorInfo>' 타입에는 필요)
const strExact: "shift left" = SATISFIED["<<"].strName; // 리터럴 타입이 유지됨
// const strExactBad: "shift left" = ANNOTATED["<<"].strName; // ← 주석을 풀면 빨간 줄 TS2322 ('string' 타입은 '"shift left"' 타입에 대입할 수 없음)
console.log("6-3) satisfies :", strExact, "/ keys :", Object.keys(SATISFIED).join(" "));
