//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 00-setup / enum-sample
//	History			: 2026-10-14 CYBERKDH Initial (최초 작성)
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// An enum is not just a type; it generates a runtime object (JavaScript code).
// enum 은 타입만이 아니라 런타임 객체(JavaScript 코드)를 생성한다.
// → ① Node directly / Node 직접 실행 : error / 오류 (ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX)
// → ② tsc build / tsc 빌드, ③ tsx : works / 정상 동작
enum Color {
	Red = "RED",
	Green = "GREEN",
}

console.log(Color.Red, Color.Green);
