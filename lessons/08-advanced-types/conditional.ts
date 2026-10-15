//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 08-advanced-types / conditional
//	History			: 2026-10-15 CYBERKDH Initial
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// Conditional types : T extends U ? X : Y  ("if T fits U, the type is X, else Y")

// 1) [TS] A simple test on a type
type TIsBig<T> = T extends bigint ? "bigint" : "not bigint";
const strA: TIsBig<123n> = "bigint";
const strB: TIsBig<123> = "not bigint";
// const strC: TIsBig<123> = "bigint"; // ← Uncomment → red squiggle TS2322 (Type '"bigint"' is not assignable to type '"not bigint"')
console.log("1) TIsBig :", strA, "/", strB);

// 2) [TS] Pick the result type from the input type : the return type follows the argument
type TParsed<T extends string | number> = T extends string ? bigint : number;
function Widen<T extends string | number>(vValue: T): TParsed<T> {
	// TS can't check a conditional type inside the body : one cast, the callers stay exact
	return (typeof vValue === "string" ? BigInt(vValue) : Number(vValue) * 2) as TParsed<T>;
}
const biWide = Widen("0xff"); // bigint
const nWide = Widen(21); // number
console.log("2) Widen :", biWide, typeof biWide, "/", nWide, typeof nWide);

// 3) [TS] Distributive : a union is tested one member at a time
type TNoBig<T> = T extends bigint ? never : T;
type TSmall = TNoBig<number | bigint | string>; // number | string (bigint became never and vanished)
const arrSmall: TSmall[] = [1, "one"];
// const arrBad: TSmall[] = [1n]; // ← Uncomment → red squiggle TS2322 (Type 'bigint' is not assignable)
console.log("3) distributive :", arrSmall.join(", "), "(this is how Exclude<T, U> is written)");

// 4) [TS] [T] stops the split : test the whole union at once
type TIsString<T> = T extends string ? true : false;
type TIsStringWhole<T> = [T] extends [string] ? true : false;
const bSplit: TIsString<string | number> = true as boolean; // true | false = boolean
const bWhole: TIsStringWhole<string | number> = false; // just false
console.log("4) [T] :", typeof bSplit, bWhole);

// 5) [TS] infer : take a part out of a type
type TElementOf<T> = T extends readonly (infer E)[] ? E : never;
type TUnwrap<T> = T extends Promise<infer V> ? TUnwrap<V> : T; // recursive : Promise<Promise<X>> → X
type TFirstArg<F> = F extends (vFirst: infer A, ...arrRest: never[]) => unknown ? A : never;

const WORDS = [8, 16, 32, 64] as const;
const nWord: TElementOf<typeof WORDS> = 16; // 8 | 16 | 32 | 64
// const nBadWord: TElementOf<typeof WORDS> = 12; // ← Uncomment → red squiggle TS2322 (Type '12' is not assignable to type '8 | 16 | 32 | 64')
const biDeep: TUnwrap<Promise<Promise<bigint>>> = 7n;
function Shift(biValue: bigint, nBits: number): bigint {
	return biValue << BigInt(nBits);
}
const biFirst: TFirstArg<typeof Shift> = 1n; // bigint
console.log("5) infer :", nWord, biDeep, Shift(biFirst, nWord));

// 6) [TS] The built-in ones are conditional types too
//   ReturnType<F>  = F extends (...arrArg: any) => infer R ? R : any
//   Awaited<T>     ≈ TUnwrap<T> above
//   NonNullable<T> = T & {}
type TMyReturn<F> = F extends (...arrArg: never[]) => infer R ? R : never;
const biMy: TMyReturn<typeof Shift> = Shift(1n, 4);
console.log("6) TMyReturn :", biMy);

// 7) [JS] Conditional types are erased. A run-time check still needs typeof / instanceof
function Describe(vValue: unknown): string {
	return typeof vValue === "bigint" ? "bigint" : "not bigint"; // the run-time twin of TIsBig
}
console.log("7) run time :", Describe(1n), "/", Describe(1));
