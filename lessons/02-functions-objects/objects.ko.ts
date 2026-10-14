//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 02-functions-objects / objects (객체 타입, interface 와 type)
//	History			: 2026-10-14 CYBERKDH Initial (최초 작성)
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// 1) [JS] 객체 리터럴 : 클래스 없이 { 키: 값 } 으로 바로 만든다
const oWord = { strName: "WORD", nBits: 16 };
console.log("1)", oWord, "/ oWord.nBits =", oWord.nBits);
// oWord.nBytes; // ← 주석을 풀면 빨간 줄 TS2339 (없는 프로퍼티)

// 2) [TS] interface : 객체의 모양(Shape) 에 이름을 붙인다
interface IWordSize {
	readonly strName: string; // 다시 할당할 수 없음
	nBits: number;
	strNote?: string; // 선택 프로퍼티
}
const oDword: IWordSize = { strName: "DWORD", nBits: 32 };
console.log("2)", oDword.strName, oDword.nBits, "/ strNote =", oDword.strNote);

// 3) [TS] type : 객체 모양에도, 그 밖의 거의 모든 타입에도 이름을 붙일 수 있다
type TWordSize = {
	readonly strName: string;
	nBits: number;
	strNote?: string;
};
type TBits = number; // 기본 타입 별칭 (interface 는 불가)
const oQword: TWordSize = { strName: "QWORD", nBits: 64 };
const nBits: TBits = oQword.nBits;
console.log("3)", oQword.strName, nBits);

// 4) [TS] 구조적 타이핑 (Structural Typing) : 이름이 달라도 모양이 같으면 호환 (C# 은 이름 기준, Nominal)
const oFromType: IWordSize = oQword; // TWordSize → IWordSize : OK
const oPlain = { strName: "BYTE", nBits: 8, bSigned: false };
const oByte: IWordSize = oPlain; // 변수로 넘기면 남는 프로퍼티 허용
console.log("4)", oFromType.strName, oByte.strName, oByte.nBits);

// 5) [TS] 초과 프로퍼티 검사 : 바로 쓴 객체 리터럴에 모르는 키가 있으면 빨간 줄 (오타 방지)
// @ts-expect-error
const oTypo: IWordSize = { strName: "WORD", nBit: 16 }; // TS2561 : did you mean 'nBits'?
console.log("5) Without TS: oTypo.nBits =", oTypo.nBits);
console.log("   Why : the key was typed as nBit, so nBits does not exist.");
console.log("   Fix : TS flags the typo while you type. Write nBits.");

// 6) [TS] readonly 는 검사할 때만 있다. 실행 중 보호는 Object.freeze
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

// 7) [TS] 확장 : interface 는 extends, type 은 & (교차 타입, Intersection)
interface IRegister extends IWordSize {
	biValue: bigint;
}
type TRegister = TWordSize & { biValue: bigint };
const oAx: IRegister = { strName: "AX", nBits: 16, biValue: 0xffn };
const oEax: TRegister = { strName: "EAX", nBits: 32, biValue: 0xffff_ffffn };
console.log("7)", oAx.strName, oAx.biValue, "/", oEax.strName, oEax.biValue);

// 8) [TS] 객체 타입 안의 메서드
interface IFormatter {
	strName: string;
	Format(biValue: bigint): string; // 메서드
}
const oHexFormatter: IFormatter = {
	strName: "hex",
	Format(biValue) {
		return "0x" + biValue.toString(16).toUpperCase();
	},
};
console.log("8)", oHexFormatter.strName, oHexFormatter.Format(255n));
