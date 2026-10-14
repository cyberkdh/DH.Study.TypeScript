//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 01-basic-types / special-types
//	History			: 2026-10-14 CYBERKDH 최초 작성
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// 1) any : 타입 검사를 끈다 → 무엇이든 허용 (가능하면 쓰지 않는다)
const vAny: any = "hello";
console.log(vAny.toFixed); // 컴파일은 통과, 실행하면 undefined (string 에는 toFixed 가 없음)

// 2) unknown : "무엇인지 모름" → 확인하기 전에는 아무것도 못 한다 (any 보다 안전)
const vUnknown: unknown = JSON.parse("255");
// vUnknown.toString(16);        // ← 주석을 풀면 빨간 줄: unknown 은 바로 쓸 수 없음
if (typeof vUnknown === "number") {
	console.log("16진수:", vUnknown.toString(16)); // 여기서는 number 로 좁혀짐 (03강에서 자세히)
}

// 3) null 과 undefined : 값이 없음을 나타내는 두 가지
//    strict 옵션 덕분에 string 변수에 null 을 넣을 수 없다 (C# 의 Nullable 참조 형식과 비슷)
let strMaybe: string | null = null;
strMaybe = "이제 값이 있음";
console.log(strMaybe);

// 4) void : 반환값이 없는 함수 / never : 절대 정상적으로 끝나지 않는 함수
function PrintLine(strText: string): void {
	console.log(strText);
}
function Fail(strMessage: string): never {
	throw new Error(strMessage);
}

PrintLine("void 함수 호출");
try {
	Fail("never 함수는 항상 예외를 던진다");
} catch (e) {
	console.log("잡은 예외:", (e as Error).message);
}
