//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 01-basic-types / ex01-to-hex (연습문제)
//	History			: 2026-10-14 CYBERKDH 최초 작성
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// 문제: bigint 값을 "0x" 로 시작하는 16진수 대문자 문자열로 바꾸세요.
//   255n  → "0xFF"
//   0n    → "0x0"
//   -255n → "-0xFF"   (음수는 부호를 맨 앞에)
// 힌트: biValue.toString(16), 문자열.toUpperCase(), 템플릿 문자열 `${...}`
// 확인: npm run check 01

export function ToHex(biValue: bigint): string {
	// TODO: 아래 줄을 지우고 구현하세요
	throw new Error(`TODO: ToHex(${biValue}) 를 구현하세요`);
}
