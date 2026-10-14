//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 00-setup / enum-sample
//	History			: 2026-10-14 CYBERKDH 최초 작성
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// enum 은 타입만이 아니라 런타임 객체(JavaScript 코드)를 생성한다.
// → ① Node 직접 실행: 오류 (ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX)
// → ② tsc 빌드 / ③ tsx: 정상 동작
enum Color {
	Red = "RED",
	Green = "GREEN",
}

console.log(Color.Red, Color.Green);
