//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 01-basic-types / ex02-to-bin (연습문제)
//	History			: 2026-10-14 CYBERKDH 최초 작성
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// 문제 1: bigint 값을 "0b" 로 시작하는 2진수 문자열로 바꾸세요.
//   10n  → "0b1010"
//   0n   → "0b0"
//   -5n  → "-0b101"
//
// 문제 2: bigint 값을 10진수 문자열로 바꾸세요.
//   255n → "255",  -1n → "-1"
//
// 힌트: ex01 과 거의 같다. 진법만 다르다.
// 확인: npm run check 01

export function ToBin(biValue: bigint): string {
	// TODO
	throw new Error(`TODO: ToBin(${biValue}) 를 구현하세요`);
}

export function ToDec(biValue: bigint): string {
	// TODO
	throw new Error(`TODO: ToDec(${biValue}) 를 구현하세요`);
}
