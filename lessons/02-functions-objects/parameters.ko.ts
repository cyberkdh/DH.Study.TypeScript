//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 02-functions-objects / parameters (선택·기본값·나머지·옵션 객체)
//	History			: 2026-10-14 CYBERKDH Initial (최초 작성)
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// 1) [TS] 선택 파라미터 "?" : 생략할 수 있고, 생략하면 undefined
function Greet(strName: string, strTitle?: string): string {
	// 여기서 strTitle 은 string | undefined 이므로 먼저 확인
	return strTitle === undefined ? `Hello, ${strName}` : `Hello, ${strTitle} ${strName}`;
}
console.log("1)", Greet("Hong"), "/", Greet("Hong", "Dr."));

// 2) [JS] 기본값 : 인자를 생략하면 사용 (타입은 기본값에서 추론)
function ToRadix(nValue: number, nRadix = 16): string {
	return nValue.toString(nRadix);
}
console.log("2) ToRadix(255) =", ToRadix(255), "/ ToRadix(255, 2) =", ToRadix(255, 2));

// 3) [JS] 나머지 파라미터 "..." : 개수 제한 없이 받아 배열로 모은다. C# params 와 같음
// ": number[]" 부분은 [TS]
function Sum(...arrNum: number[]): number {
	let nTotal = 0;
	for (const nValue of arrNum) {
		nTotal += nValue;
	}
	return nTotal;
}
console.log("3) Sum() =", Sum(), "/ Sum(1, 2, 3) =", Sum(1, 2, 3));

// 4) [JS] 펼치기 (Spread) : 배열을 인자 여러 개로 펼친다
const arrBits = [8, 16, 32, 64];
console.log("4) Sum(...arrBits) =", Sum(...arrBits), "/ Math.max(...arrBits) =", Math.max(...arrBits));

// 5) [JS + TS] 옵션 객체 : 선택 설정 여러 개를 객체 하나로 받고, 구조 분해 + 기본값으로 꺼낸다
//    (C# 의 이름 있는 인자 역할)
function FormatHex(nValue: number, { bPrefix = true, bUpperCase = true }: { bPrefix?: boolean; bUpperCase?: boolean } = {}): string {
	const strDigits = nValue.toString(16);
	return (bPrefix ? "0x" : "") + (bUpperCase ? strDigits.toUpperCase() : strDigits);
}
console.log("5)", FormatHex(255), FormatHex(255, { bUpperCase: false }), FormatHex(255, { bPrefix: false }));

// 6) [TS] 파라미터 순서 : 선택 파라미터는 필수 파라미터 앞에 올 수 없다
// function Bad(strTitle?: string, strName: string) {} // ← 주석을 풀면 빨간 줄 TS1016
console.log("6) Optional parameters go last (TS1016 otherwise).");
