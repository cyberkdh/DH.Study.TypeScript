//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: devcalc / core / Format (진법별 문자열 변환 / Radix formatting)
//	History			: 2026-10-14 CYBERKDH 최초 작성 (Initial) - 01강 DevCalc 스텝 / Lesson 01 DevCalc step
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// 부호와 절댓값을 나눠 "부호 + 접두어 + 숫자" 형태로 만든다
// Split sign and absolute value, then build "sign + prefix + digits"
function FormatRadix(biValue: bigint, nRadix: number, strPrefix: string): string {
	const strSign = biValue < 0n ? "-" : "";
	const biAbs = biValue < 0n ? -biValue : biValue;
	return `${strSign}${strPrefix}${biAbs.toString(nRadix).toUpperCase()}`;
}

export function ToHex(biValue: bigint): string {
	return FormatRadix(biValue, 16, "0x");
}

export function ToBin(biValue: bigint): string {
	return FormatRadix(biValue, 2, "0b");
}

export function ToDec(biValue: bigint): string {
	return biValue.toString(10);
}
