//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 01-basic-types / convert (진법 변환 함수 만들기 / Radix conversion functions)
//	History			: 2026-10-14 CYBERKDH 최초 작성 (Initial)
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// 1) 16진수 / Hex : 255n → "0xFF", -255n → "-0xFF"
function ToHex(biValue: bigint): string {
	const strSign = biValue < 0n ? "-" : ""; // 부호는 따로 떼어 맨 앞에 / Sign goes first, separately
	const biAbs = biValue < 0n ? -biValue : biValue; // 절댓값 / Absolute value
	return `${strSign}0x${biAbs.toString(16).toUpperCase()}`;
}

// 2) 2진수 / Binary : 10n → "0b1010"  (ToHex 와 진법만 다름 / differs from ToHex only in radix)
function ToBin(biValue: bigint): string {
	const strSign = biValue < 0n ? "-" : "";
	const biAbs = biValue < 0n ? -biValue : biValue;
	return `${strSign}0b${biAbs.toString(2)}`;
}

// 3) 10진수 / Decimal : 255n → "255"
function ToDec(biValue: bigint): string {
	return biValue.toString(10);
}

// 4) number → bigint : 안전한 정수가 아니면 RangeError / RangeError if not a safe integer
function ToBigInt(nValue: number): bigint {
	if (!Number.isSafeInteger(nValue)) {
		throw new RangeError(`안전한 정수가 아닙니다: ${nValue}`);
	}
	return BigInt(nValue);
}

// 실행해 보기 / Try it
for (const biValue of [255n, 0n, -255n, 0xffff_ffff_ffff_ffffn]) {
	console.log(`${ToDec(biValue).padStart(20)} | ${ToHex(biValue).padStart(19)} | ${ToBin(biValue)}`);
}

console.log(ToBigInt(255)); // 255n
try {
	ToBigInt(1.5); // ← 중단점을 걸고 F11 로 들어가 보기 / Set a breakpoint and press F11 to step in
} catch (e) {
	console.log("RangeError:", (e as Error).message);
}
