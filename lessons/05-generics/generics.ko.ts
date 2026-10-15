//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 05-generics / generics (제네릭 기초)
//	History			: 2026-10-15 CYBERKDH Initial (최초 작성)
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// 1) [TS] 문제 : 요소 타입에 상관없이 쓸 수 있는 함수 하나
function FirstAny(arrItem: any[]): any {
	return arrItem[0];
}
const vFirst = FirstAny([255n, 16n]); // any : 타입 정보가 사라짐
console.log("1) FirstAny =", vFirst, "/ but TS only knows: any");
try {
	console.log(vFirst.toUpperCase()); // 컴파일됨 : any 는 무엇이든 허용
} catch (e) {
	console.log("   Expected error:", (e as Error).message);
	console.log("   Why : vFirst is a bigint, but any let us call a string method on it.");
	console.log("   Fix : a type parameter keeps the real type — see 2).");
}

// 2) [TS] 타입 매개변수 (type parameter) <T> : "호출하는 쪽에서 정하는 타입"
function First<T>(arrItem: readonly T[]): T | undefined {
	return arrItem[0];
}
const biFirst = First([255n, 16n]); // T = bigint (추론) → bigint | undefined
const strFirst = First(["HEX", "DEC"]); // T = string
console.log("2) First =", biFirst, "/", strFirst);

// 3) [TS] 타입 인수 (type argument) 를 직접 적기, 그리고 그때 검사되는 것
const nFirst = First<number>([1, 2, 3]);
// First<number>(["1"]); // ← 주석을 풀면 빨간 줄 TS2322 (string 은 number 가 아님)
console.log("3) First<number> =", nFirst);

// 4) [TS] 타입 매개변수 여러 개 : 그 타입들로 반환 타입을 만듦
function MakePair<A, B>(vLeft: A, vRight: B): [A, B] {
	return [vLeft, vRight];
}
const arrPair = MakePair("AX", 0xffn); // [string, bigint]
console.log("4) MakePair =", arrPair, "/ second + 1n =", arrPair[1] + 1n);

// 5) [TS] 제네릭 화살표 함수 (arrow function) 와 제네릭 함수 타입
const Last = <T>(arrItem: readonly T[]): T | undefined => arrItem[arrItem.length - 1];
type TMapper<TIn, TOut> = (vItem: TIn) => TOut;
const fnToHex: TMapper<bigint, string> = (biValue) => "0x" + biValue.toString(16).toUpperCase();
console.log("5) Last =", Last([1n, 2n, 3n]), "/ mapped =", [255n, 16n].map(fnToHex).join(", "));

// 6) [TS] 제네릭 Map 함수 : 두 타입 모두 호출하는 쪽이 정함
function MapAll<TIn, TOut>(arrItem: readonly TIn[], fnMap: TMapper<TIn, TOut>): TOut[] {
	const arrOut: TOut[] = [];
	for (const vItem of arrItem) {
		arrOut.push(fnMap(vItem));
	}
	return arrOut;
}
const arrLength = MapAll(["0xFF", "0b1010"], (strText) => strText.length); // TIn = string, TOut = number
console.log("6) MapAll lengths =", arrLength);
