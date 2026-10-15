//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 05-generics / generics
//	History			: 2026-10-15 CYBERKDH Initial
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// 1) [TS] The problem : one function for every element type
function FirstAny(arrItem: any[]): any {
	return arrItem[0];
}
const vFirst = FirstAny([255n, 16n]); // any : the type is lost
console.log("1) FirstAny =", vFirst, "/ but TS only knows: any");
try {
	console.log(vFirst.toUpperCase()); // compiles : any allows everything
} catch (e) {
	console.log("   Expected error:", (e as Error).message);
	console.log("   Why : vFirst is a bigint, but any let us call a string method on it.");
	console.log("   Fix : a type parameter keeps the real type — see 2).");
}

// 2) [TS] A type parameter <T> : "whatever type the caller uses"
function First<T>(arrItem: readonly T[]): T | undefined {
	return arrItem[0];
}
const biFirst = First([255n, 16n]); // T = bigint (inferred) → bigint | undefined
const strFirst = First(["HEX", "DEC"]); // T = string
console.log("2) First =", biFirst, "/", strFirst);

// 3) [TS] Explicit type arguments, and what they check
const nFirst = First<number>([1, 2, 3]);
// First<number>(["1"]); // ← Uncomment → red squiggle TS2322 (string is not number)
console.log("3) First<number> =", nFirst);

// 4) [TS] Several type parameters : the return type is built from them
function MakePair<A, B>(vLeft: A, vRight: B): [A, B] {
	return [vLeft, vRight];
}
const arrPair = MakePair("AX", 0xffn); // [string, bigint]
console.log("4) MakePair =", arrPair, "/ second + 1n =", arrPair[1] + 1n);

// 5) [TS] Generic arrow functions and generic function types
const Last = <T>(arrItem: readonly T[]): T | undefined => arrItem[arrItem.length - 1];
type TMapper<TIn, TOut> = (vItem: TIn) => TOut;
const fnToHex: TMapper<bigint, string> = (biValue) => "0x" + biValue.toString(16).toUpperCase();
console.log("5) Last =", Last([1n, 2n, 3n]), "/ mapped =", [255n, 16n].map(fnToHex).join(", "));

// 6) [TS] A generic Map function : the caller decides both types
function MapAll<TIn, TOut>(arrItem: readonly TIn[], fnMap: TMapper<TIn, TOut>): TOut[] {
	const arrOut: TOut[] = [];
	for (const vItem of arrItem) {
		arrOut.push(fnMap(vItem));
	}
	return arrOut;
}
const arrLength = MapAll(["0xFF", "0b1010"], (strText) => strText.length); // TIn = string, TOut = number
console.log("6) MapAll lengths =", arrLength);
