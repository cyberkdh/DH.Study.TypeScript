//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 01-basic-types / ex03-to-bigint (연습문제)
//	History			: 2026-10-14 CYBERKDH 최초 작성
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// 문제: number 를 bigint 로 안전하게 바꾸세요.
//   - "안전한 정수"(소수점이 없고, ±(2^53 - 1) 범위 안)이면 bigint 로 바꿔서 반환
//       255 → 255n,  -1 → -1n
//   - 아니면 RangeError 를 던짐 (메시지는 자유)
//       1.5, NaN, Infinity, 2 ** 53 → RangeError
//
// 힌트: Number.isSafeInteger(n), BigInt(n), throw new RangeError("...")
// 확인: npm run check 01

export function ToBigInt(nValue: number): bigint {
	// TODO
	throw new Error(`TODO: ToBigInt(${nValue}) 를 구현하세요`);
}
