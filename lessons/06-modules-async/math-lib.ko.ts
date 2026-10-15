//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 06-modules-async / math-lib (export 하는 모듈)
//	History			: 2026-10-15 CYBERKDH Initial (최초 작성)
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// 모듈 (module) : import 나 export 가 있는 파일은 자기만의 스코프를 가짐. export 한 것만 밖에서 보임.

// 1) [JS] 이름 있는 내보내기 (named export) : 선언 앞에 export
export const MAX_BITS = 64;

export function Add(biA: bigint, biB: bigint): bigint {
	return biA + biB;
}

export function ToHex(biValue: bigint): string {
	return "0x" + biValue.toString(16).toUpperCase();
}

// 2) [JS] export 하지 않음 : 이 파일 전용, C# 의 internal / private 과 비슷
const SEPARATOR = " .. ";

// 3) [TS] 타입 내보내기 : interface 와 type 은 컴파일러에만 존재
export interface IRange {
	readonly biMin: bigint;
	readonly biMax: bigint;
}
export type ESign = "signed" | "unsigned";

export function RangeOf(nBits: number, eSign: ESign): IRange {
	const biBits = BigInt(nBits);
	return eSign === "unsigned" ? { biMin: 0n, biMax: (1n << biBits) - 1n } : { biMin: -(1n << (biBits - 1n)), biMax: (1n << (biBits - 1n)) - 1n };
}

// 4) [JS] 기본 내보내기 (default export) : 모듈당 최대 하나, 중괄호 없이 import
export default function Describe(oRange: IRange): string {
	return ToHex(oRange.biMin) + SEPARATOR + ToHex(oRange.biMax);
}

// 5) [JS] import.meta.main : 이 파일을 직접 실행할 때만 true, import 될 때는 false
if (import.meta.main) {
	console.log("math-lib.ts is a module : it only exports things. Run the file that imports it:");
	console.log("  node lessons/06-modules-async/modules.ts");
}
