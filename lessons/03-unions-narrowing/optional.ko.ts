//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 03-unions-narrowing / optional (?. ?? ! 와 없을 수 있는 값)
//	History			: 2026-10-15 CYBERKDH Initial (최초 작성)
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

interface IGrouping {
	nSize?: number;
	strSeparator?: string;
}
interface IConfig {
	strName: string;
	oGrouping?: IGrouping;
}
const oFull: IConfig = { strName: "full", oGrouping: { nSize: 4, strSeparator: "_" } };
const oEmpty: IConfig = { strName: "empty" };
const oOff: IConfig = { strName: "off", oGrouping: { nSize: 0, strSeparator: "" } };

// 1) [JS] 옵셔널 체이닝 ?. : 예외를 던지지 않고 멈춰서 undefined 를 준다
console.log("1) full:", oFull.oGrouping?.nSize, "/ empty:", oEmpty.oGrouping?.nSize);

// 2) [JS] ?? : null / undefined 일 때만 기본값.   || : falsy 값(0, "", false 도) 모두 기본값
const nSizeQQ = oOff.oGrouping?.nSize ?? 4;
const nSizeOr = oOff.oGrouping?.nSize || 4;
console.log("2) nSize 0 with ?? =", nSizeQQ, "/ with || =", nSizeOr, "(0 was lost)");
const strSepQQ = oOff.oGrouping?.strSeparator ?? "_";
const strSepOr = oOff.oGrouping?.strSeparator || "_";
console.log("   separator \"\" with ?? =", JSON.stringify(strSepQQ), "/ with || =", JSON.stringify(strSepOr));

// 3) [TS] noUncheckedIndexedAccess : arr[i] 는 T | undefined (C# 은 IndexOutOfRange 예외, JS 는 undefined)
const arrDigit = ["0", "1"];
const strThird = arrDigit[2]; // string | undefined
console.log("3) arrDigit[2] =", strThird, "/ length =", strThird?.length ?? 0);
// strThird.length; // ← 주석을 풀면 빨간 줄 TS18048 ('strThird' 가 undefined 일 수 있음)

// 4) [TS] 조기 반환 (early return) : "undefined 면 return" 뒤의 나머지 코드는 string 만 본다
function FirstChar(strText: string): string {
	const strChar = strText[0]; // string | undefined
	if (strChar === undefined) {
		return "(empty)";
	}
	return strChar.toUpperCase(); // 여기서는 string
}
console.log("4) FirstChar:", FirstChar("hex"), FirstChar(""));

// 5) [TS] Non-null 단언 ! : "undefined 가 아니다" 라고 단언할 뿐 — 실행 중에는 아무 검사도 없다
const strFirst = arrDigit[0]!; // 올바른 단언 : 0번 요소는 있다
console.log("5) arrDigit[0]! =", strFirst);
try {
	const strMissing = arrDigit[5]!; // 잘못된 단언
	console.log(strMissing.length);
} catch (e) {
	console.log("   Expected error:", (e as Error).message);
	console.log("   Why : ! only silences TS; the value was still undefined at runtime.");
	console.log("   Fix : check it (if / ?? / ?.) instead of using !.");
}
