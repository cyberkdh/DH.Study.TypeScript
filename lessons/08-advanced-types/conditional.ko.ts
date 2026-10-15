//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 08-advanced-types / conditional (조건부 타입)
//	History			: 2026-10-15 CYBERKDH Initial (최초 작성)
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// 조건부 타입 (conditional types) : T extends U ? X : Y  ("T 가 U 에 대입 가능하면 X, 아니면 Y")

// 1) [TS] 타입에 대한 간단한 검사
type TIsBig<T> = T extends bigint ? "bigint" : "not bigint";
const strA: TIsBig<123n> = "bigint";
const strB: TIsBig<123> = "not bigint";
// const strC: TIsBig<123> = "bigint"; // ← 주석을 풀면 빨간 줄 TS2322 ('"bigint"' 타입은 '"not bigint"' 타입에 대입할 수 없음)
console.log("1) TIsBig :", strA, "/", strB);

// 2) [TS] 입력 타입으로 결과 타입 고르기 : 인수 타입에 따라 반환 타입이 정해짐
type TParsed<T extends string | number> = T extends string ? bigint : number;
function Widen<T extends string | number>(vValue: T): TParsed<T> {
	// 함수 본문 안에서는 TS 가 조건부 타입을 검사하지 못함 : 캐스트 한 번, 호출하는 쪽은 정확한 타입 유지
	return (typeof vValue === "string" ? BigInt(vValue) : Number(vValue) * 2) as TParsed<T>;
}
const biWide = Widen("0xff"); // bigint
const nWide = Widen(21); // number
console.log("2) Widen :", biWide, typeof biWide, "/", nWide, typeof nWide);

// 3) [TS] 분배 (distributive) : 유니온은 멤버 하나씩 검사됨
type TNoBig<T> = T extends bigint ? never : T;
type TSmall = TNoBig<number | bigint | string>; // number | string (bigint 는 never 가 되어 사라짐)
const arrSmall: TSmall[] = [1, "one"];
// const arrBad: TSmall[] = [1n]; // ← 주석을 풀면 빨간 줄 TS2322 (bigint 타입은 대입할 수 없음)
console.log("3) distributive :", arrSmall.join(", "), "(this is how Exclude<T, U> is written)");

// 4) [TS] [T] 로 감싸면 분배를 막음 : 유니온 전체를 한 번에 검사
type TIsString<T> = T extends string ? true : false;
type TIsStringWhole<T> = [T] extends [string] ? true : false;
const bSplit: TIsString<string | number> = true as boolean; // true | false = boolean
const bWhole: TIsStringWhole<string | number> = false; // 결과는 false 하나
console.log("4) [T] :", typeof bSplit, bWhole);

// 5) [TS] infer : 타입에서 일부를 꺼냄
type TElementOf<T> = T extends readonly (infer E)[] ? E : never;
type TUnwrap<T> = T extends Promise<infer V> ? TUnwrap<V> : T; // 재귀 : Promise<Promise<X>> → X
type TFirstArg<F> = F extends (vFirst: infer A, ...arrRest: never[]) => unknown ? A : never;

const WORDS = [8, 16, 32, 64] as const;
const nWord: TElementOf<typeof WORDS> = 16; // 8 | 16 | 32 | 64
// const nBadWord: TElementOf<typeof WORDS> = 12; // ← 주석을 풀면 빨간 줄 TS2322 ('12' 타입은 '8 | 16 | 32 | 64' 타입에 대입할 수 없음)
const biDeep: TUnwrap<Promise<Promise<bigint>>> = 7n;
function Shift(biValue: bigint, nBits: number): bigint {
	return biValue << BigInt(nBits);
}
const biFirst: TFirstArg<typeof Shift> = 1n; // bigint
console.log("5) infer :", nWord, biDeep, Shift(biFirst, nWord));

// 6) [TS] 내장 유틸리티 타입도 조건부 타입
//   ReturnType<F>  = F extends (...arrArg: any) => infer R ? R : any
//   Awaited<T>     ≈ 위의 TUnwrap<T>
//   NonNullable<T> = T & {}
type TMyReturn<F> = F extends (...arrArg: never[]) => infer R ? R : never;
const biMy: TMyReturn<typeof Shift> = Shift(1n, 4);
console.log("6) TMyReturn :", biMy);

// 7) [JS] 조건부 타입은 지워짐. 실행 시점 검사는 여전히 typeof / instanceof 가 필요
function Describe(vValue: unknown): string {
	return typeof vValue === "bigint" ? "bigint" : "not bigint"; // TIsBig 에 대응하는 실행 시점 코드
}
console.log("7) run time :", Describe(1n), "/", Describe(1));
