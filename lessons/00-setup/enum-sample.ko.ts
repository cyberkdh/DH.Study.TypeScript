//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 00-setup / enum-sample
//	History			: 2026-10-14 CYBERKDH Initial (최초 작성)
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// enum 은 JavaScript 코드를 새로 생성하므로 ① Node 직접 실행으로는 돌릴 수 없다.
// 이 저장소는 tsconfig.json 에서 "erasableSyntaxOnly" 를 켰다 → enum 을 쓰면 바로 빨간 줄.
//
//   enum Color { Red = "RED", Green = "GREEN" }   ← 이 저장소에서는 쓰지 않음
//
// 대신: 일반 객체 + "as const" + 유니온 타입. 타입만 붙인 것이라 어디서나 실행된다.

const COLOR = {
	Red: "RED",
	Green: "GREEN",
} as const;

// "RED" | "GREEN" : 객체 값들의 유니온
type EColor = (typeof COLOR)[keyof typeof COLOR];

function Describe(eColor: EColor): string {
	return `color = ${eColor}`;
}

console.log(COLOR.Red, COLOR.Green); // RED GREEN
console.log(Describe(COLOR.Green)); // color = GREEN
console.log(Describe("RED")); // color = RED  (문자열 리터럴도 가능)
// Describe("BLUE"); // ← 주석을 풀면 빨간 줄
