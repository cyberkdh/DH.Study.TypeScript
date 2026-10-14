//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 01-basic-types / special-types
//	History			: 2026-10-14 CYBERKDH Initial (최초 작성)
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// 1) [TS] any : 타입 검사를 끈다 → 무엇이든 허용 (가능하면 쓰지 않는다)
const vAny: any = "hello";
console.log(vAny.toFixed); // 컴파일 통과, 실행하면 undefined

// 2) [TS] unknown : "무엇인지 모름" → 확인하기 전에는 아무것도 못 한다 (any 보다 안전)
const vUnknown: unknown = JSON.parse("255");
// vUnknown.toString(16);        // ← 주석을 풀면 빨간 줄
if (typeof vUnknown === "number") {
	console.log("hex:", vUnknown.toString(16)); // 여기서는 number 로 좁혀짐 (03강)
}

// 3) [JS + TS] null 과 undefined : 값이 없음을 나타내는 두 가지
//    strict 옵션 덕분에 string 변수에 null 을 넣을 수 없다 (C# 의 Nullable 참조 형식과 비슷)
let strMaybe: string | null = null;
strMaybe = "now it has a value";
console.log(strMaybe);

// 4) [TS] void : 반환값이 없는 함수
//    never : 절대 정상적으로 끝나지 않는 함수
function PrintLine(strText: string): void {
	console.log(strText);
}
function Fail(strMessage: string): never {
	throw new Error(strMessage);
}

PrintLine("void function called");
try {
	Fail("a never function always throws");
} catch (e) {
	console.log("caught:", (e as Error).message);
}
