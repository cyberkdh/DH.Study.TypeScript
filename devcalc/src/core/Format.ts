//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: devcalc / core / Format (Radix formatting / 진법별 문자열 변환)
//	History			: 2026-10-14 CYBERKDH Initial (최초 작성) - Lesson 01 DevCalc step / 01강 DevCalc 스텝
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// Split sign and absolute value, then build "sign + prefix + digits"
// 부호와 절댓값을 나눠 "부호 + 접두어 + 숫자" 형태로 만든다
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
