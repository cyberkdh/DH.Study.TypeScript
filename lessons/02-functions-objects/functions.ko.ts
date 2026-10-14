//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 02-functions-objects / functions
//	History			: 2026-10-14 CYBERKDH Initial (최초 작성)
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// 1) [JS] 함수 선언문 : 작성한 줄보다 위에서도 호출할 수 있다 (호이스팅, Hoisting)
console.log("1) Add(1, 2) =", Add(1, 2), "(called before the declaration)");

function Add(nA: number, nB: number): number {
	return nA + nB;
}

// 2) [JS] 화살표 함수 (Arrow Function) : const 에 담는 짧은 함수. C# 람다와 비슷
const Multiply = (nA: number, nB: number): number => nA * nB;
const Square = (nA: number) => nA * nA; // 반환 타입 추론 : number
console.log("2) Multiply(3, 4) =", Multiply(3, 4), "/ Square(5) =", Square(5));

// 3) [JS] const 에 담은 화살표 함수는 그 줄보다 위에서 호출할 수 없다 (let/const 와 같음)
try {
	// @ts-expect-error
	Subtract(5, 3);
	const Subtract = (nA: number, nB: number): number => nA - nB;
	console.log(Subtract(1, 1)); // 여기까지 오지 못함
} catch (e) {
	console.log("3) Expected error:", (e as Error).message);
	console.log("   Why : an arrow function is a const value, so it exists only from its line down.");
	console.log("   Fix : define it first, or use a function declaration.");
}

// 4) [TS] 표기 : 파라미터는 타입이 필요하고, 반환 타입은 대부분 추론된다
function ToUpperHex(nValue: number): string {
	return nValue.toString(16).toUpperCase();
}
// ToUpperHex("255"); // ← 주석을 풀면 빨간 줄 TS2345 (string 은 number 가 아님)
console.log("4) ToUpperHex(255) =", ToUpperHex(255));

// 5) [TS] TS 는 인자 개수를 검사한다. 순수 JS 는 검사하지 않는다.
// @ts-expect-error
const nMissing = Add(1); // TS2554 : Expected 2 arguments, but got 1.
console.log("5) Without TS: Add(1) =", nMissing);
console.log("   Why : JS fills a missing argument with undefined, and 1 + undefined = NaN.");
console.log("   Fix : TS flags it while you type. Pass both arguments.");

// 6) [TS] 함수 타입 : "무엇을 받아 무엇을 돌려주는 함수" 를 나타낸다. C# 의 Func<int, int, int> 와 같은 역할
type TBinaryOp = (nA: number, nB: number) => number;

const fnPlus: TBinaryOp = Add;
const fnTimes: TBinaryOp = (nA, nB) => nA * nB; // 파라미터 타입은 TBinaryOp 에서 옴
console.log("6) fnPlus(2, 3) =", fnPlus(2, 3), "/ fnTimes(2, 3) =", fnTimes(2, 3));

// 7) [JS + TS] void 반환 : 아무것도 돌려주지 않는 함수
function PrintLine(strText: string): void {
	console.log("7)", strText);
}
PrintLine("void function done");
