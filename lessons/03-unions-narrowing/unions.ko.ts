//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 03-unions-narrowing / unions (유니온 타입, 리터럴 유니온)
//	History			: 2026-10-15 CYBERKDH Initial (최초 작성)
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// 1) [TS] 유니온 타입 : 값이 여러 타입 중 하나 (A | B)
let vInput: string | number = "255";
console.log("1) vInput =", vInput, "/ typeof =", typeof vInput);
vInput = 255;
console.log("   vInput =", vInput, "/ typeof =", typeof vInput);
// vInput = true; // ← 주석을 풀면 빨간 줄 TS2322 (boolean 은 string | number 가 아님)

// 2) [TS] 리터럴 유니온 : 정해진 값만 허용
type TRadixName = "HEX" | "DEC" | "BIN";
let strRadix: TRadixName = "HEX";
strRadix = "BIN";
// strRadix = "OCT"; // ← 주석을 풀면 빨간 줄 TS2322 ("OCT" 는 TRadixName 이 아님)
console.log("2) strRadix =", strRadix);

// 3) [TS] 어느 타입인지 확인하기 전에는 모든 타입에 공통인 멤버만 쓸 수 있다
function Describe(vValue: string | number): string {
	// vValue.toUpperCase(); // ← 주석을 풀면 빨간 줄 TS2339 (number 에는 toUpperCase 가 없음)
	return vValue.toString(); // string 과 number 모두 toString 이 있다
}
console.log("3) Describe:", Describe("FF"), Describe(255));

// 4) [JS + TS] enum 대신 : as const 객체 + 키와 값의 유니온
const RADIX = { HEX: 16, DEC: 10, BIN: 2 } as const;
type TRadixKey = keyof typeof RADIX; // "HEX" | "DEC" | "BIN"
type TRadix = (typeof RADIX)[TRadixKey]; // 16 | 10 | 2

function RadixOf(strKey: TRadixKey): TRadix {
	return RADIX[strKey];
}
console.log("4) RADIX.HEX =", RADIX.HEX, "/ RadixOf(\"BIN\") =", RadixOf("BIN"), "/ keys =", Object.keys(RADIX).join(", "));

// 5) [TS] T | undefined : 없을 수도 있는 값. find 는 찾지 못하면 undefined 를 돌려준다
const arrName: TRadixName[] = ["HEX", "DEC", "BIN"];
const strFound = arrName.find((strName) => strName.startsWith("O")); // TRadixName | undefined
console.log("5) find O* =", strFound);
// strFound.length; // ← 주석을 풀면 빨간 줄 TS18048 ('strFound' 가 undefined 일 수 있음)

// 6) [TS] 확인하지 않고 쓰면 생기는 일
try {
	// @ts-expect-error
	console.log(strFound.length);
} catch (e) {
	console.log("6) Expected error:", (e as Error).message);
	console.log("   Why : find found nothing and returned undefined, which has no properties.");
	console.log("   Fix : TS flags it (TS18048). Check for undefined first — narrowing.ts.");
}
