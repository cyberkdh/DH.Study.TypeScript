//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 01-basic-types / special-types
//	History			: 2026-10-14 CYBERKDH 최초 작성 (Initial)
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// 1) any : 타입 검사를 끈다 → 무엇이든 허용 (가능하면 쓰지 않는다)
//    any : turns type checking off → anything goes (avoid when possible)
const vAny: any = "hello";
console.log(vAny.toFixed); // 컴파일 통과, 실행하면 undefined / Compiles, but undefined at runtime (string has no toFixed)

// 2) unknown : "무엇인지 모름" → 확인하기 전에는 아무것도 못 한다 (any 보다 안전)
//    unknown : "not known yet" → nothing is allowed until you check (safer than any)
const vUnknown: unknown = JSON.parse("255");
// vUnknown.toString(16);        // ← 주석을 풀면 빨간 줄 / Uncomment → red squiggle
if (typeof vUnknown === "number") {
	console.log("16진수:", vUnknown.toString(16)); // 여기서는 number 로 좁혀짐 / Narrowed to number here (03강 / lesson 03)
}

// 3) null 과 undefined : 값이 없음을 나타내는 두 가지
//    null and undefined : two ways to say "no value"
//    strict 옵션 덕분에 string 변수에 null 을 넣을 수 없다 (C# 의 Nullable 참조 형식과 비슷)
//    With strict, null can't go into a string variable (like C# nullable reference types)
let strMaybe: string | null = null;
strMaybe = "이제 값이 있음";
console.log(strMaybe);

// 4) void : 반환값이 없는 함수 / A function that returns nothing
//    never : 절대 정상적으로 끝나지 않는 함수 / A function that never finishes normally
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
