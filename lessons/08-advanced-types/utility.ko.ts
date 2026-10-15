//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 08-advanced-types / utility (내장 유틸리티 타입)
//	History			: 2026-10-15 CYBERKDH Initial (최초 작성)
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// 내장 유틸리티 타입 (utility types) : 이미 있는 타입으로 새 타입 만들기
interface IRegister {
	readonly strName: string;
	nValue: number;
	strNote?: string;
}

const AX: IRegister = { strName: "AX", nValue: 0x1234 };

// 1) [TS] Partial<T> : 모든 프로퍼티를 선택적으로. "이 필드만 바꾸기" 에 좋음
function UpdateRegister(oRegister: IRegister, oChange: Partial<IRegister>): IRegister {
	return { ...oRegister, ...oChange };
}
const oChanged = UpdateRegister(AX, { nValue: 0xff });
console.log("1) Partial  :", JSON.stringify(oChanged));
// UpdateRegister(AX, { nValu: 1 }); // ← 주석을 풀면 빨간 줄 TS2561 (객체 리터럴에는 알려진 프로퍼티만 쓸 수 있음)

// 2) [TS] Required<T> : 모든 프로퍼티를 필수로 (? 가 빠짐)
const oDocumented: Required<IRegister> = { strName: "BX", nValue: 0, strNote: "base register" };
// const oNoNote: Required<IRegister> = { strName: "CX", nValue: 0 }; // ← 주석을 풀면 빨간 줄 TS2741 (strNote 프로퍼티가 없음)
console.log("2) Required :", oDocumented.strNote.toUpperCase());

// 3) [TS] Readonly<T> : 모든 프로퍼티를 읽기 전용으로. TS 만 검사함; Object.freeze 는 실행 시점에도 막음
const oFixed: Readonly<IRegister> = { strName: "CX", nValue: 1 };
// oFixed.nValue = 2; // ← 주석을 풀면 빨간 줄 TS2540 (nValue 는 읽기 전용 프로퍼티라 대입할 수 없음)
const oFrozen = Object.freeze({ strName: "DX", nValue: 2 }); // Readonly<{ strName: string; nValue: number }>
try {
	(oFrozen as { nValue: number }).nValue = 3; // 캐스트로 TS 에게서는 숨겼지만, 객체는 동결 (freeze) 되어 있음
} catch (e) {
	console.log("3) Readonly :", oFixed.nValue, "/ Expected error:", (e as Error).name);
	console.log("   Why : Object.freeze stops changes at run time. Readonly<T> alone only stops them in the editor.");
	console.log("   Fix : don't cast readonly away. Make a changed copy instead : { ...oFrozen, nValue: 3 }");
}

// 4) [TS] Pick<T, K> 는 일부 키만 남기고, Omit<T, K> 는 일부 키를 뺌
type TRegisterValue = Pick<IRegister, "strName" | "nValue">; // { readonly strName; nValue }
type TNewRegister = Omit<IRegister, "strName">; // { nValue; strNote? }
const oPicked: TRegisterValue = { strName: "SP", nValue: 0xfffe };
const oNew: TNewRegister = { nValue: 0 };
console.log("4) Pick / Omit :", Object.keys(oPicked).join(","), "/", Object.keys(oNew).join(","));

// 5) [TS] Record<K, V> : 키가 K, 값이 V 인 객체. K 가 유니온이면 모든 키가 필수
type EWordName = "BYTE" | "WORD" | "DWORD" | "QWORD";
const WORD_BITS: Record<EWordName, number> = { BYTE: 8, WORD: 16, DWORD: 32, QWORD: 64 };
// const WORD_BAD: Record<EWordName, number> = { BYTE: 8, WORD: 16 }; // ← 주석을 풀면 빨간 줄 TS2739 (DWORD, QWORD 가 없음)
console.log("5) Record :", Object.entries(WORD_BITS).map(([strKey, nBits]) => `${strKey}=${nBits}`).join(" "));

// 6) [TS] 함수에서 타입 얻기 : ReturnType, Parameters, Awaited
function ParseHex(strText: string, bStrict = true): { bOk: boolean; nValue: number } {
	const nValue = Number.parseInt(strText, 16);
	return { bOk: !Number.isNaN(nValue) && (!bStrict || /^[0-9a-f]+$/i.test(strText)), nValue };
}
async function LoadValue(): Promise<bigint> {
	return 255n;
}
type TParseResult = ReturnType<typeof ParseHex>; // { bOk: boolean; nValue: number }
type TParseArgs = Parameters<typeof ParseHex>; // [strText: string, bStrict?: boolean]
type TLoaded = Awaited<ReturnType<typeof LoadValue>>; // bigint (Promise<bigint> 를 벗겨 냄)
const arrArgs: TParseArgs = ["ff"];
const oParsed: TParseResult = ParseHex(...arrArgs);
const biLoaded: TLoaded = await LoadValue();
console.log("6) ReturnType / Parameters / Awaited :", JSON.stringify(oParsed), arrArgs.length, biLoaded);

// 7) [TS] 유니온 거르기 : Exclude, Extract, NonNullable
type EOperator = "+" | "-" | "&" | "|" | "<<" | ">>";
type EBitOperator = Extract<EOperator, "&" | "|" | "<<" | ">>">; // 이것들만
type EMathOperator = Exclude<EOperator, EBitOperator>; // "+" | "-"
type TMaybeText = string | null | undefined;
const strText: NonNullable<TMaybeText> = "never null";
const arrMath: EMathOperator[] = ["+", "-"];
// const strWrong: EMathOperator = "&"; // ← 주석을 풀면 빨간 줄 TS2322 ('"&"' 타입은 대입할 수 없음)
console.log("7) Exclude / Extract / NonNullable :", arrMath.join(" "), "/", strText);

// 8) [JS] 유틸리티 타입은 지워짐 : 실행 시점에는 그냥 객체만 있음
console.log("8) at run time oDocumented is just", typeof oDocumented, "with keys", Object.keys(oDocumented).join(","));
