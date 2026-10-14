//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 01-basic-types / convert (Radix conversion functions / 진법 변환 함수 만들기)
//	History			: 2026-10-14 CYBERKDH Initial (최초 작성)
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// 1) Hex / 16진수 : 255n → "0xFF", -255n → "-0xFF"
function ToHex(biValue: bigint): string {
	const strSign = biValue < 0n ? "-" : ""; // Sign goes first, separately / 부호는 따로 떼어 맨 앞에
	const biAbs = biValue < 0n ? -biValue : biValue; // Absolute value / 절댓값
	return `${strSign}0x${biAbs.toString(16).toUpperCase()}`;
}

// 2) Binary / 2진수 : 10n → "0b1010"  (differs from ToHex only in radix / ToHex 와 진법만 다름)
function ToBin(biValue: bigint): string {
	const strSign = biValue < 0n ? "-" : "";
	const biAbs = biValue < 0n ? -biValue : biValue;
	return `${strSign}0b${biAbs.toString(2)}`;
}

// 3) Decimal / 10진수 : 255n → "255"
function ToDec(biValue: bigint): string {
	return biValue.toString(10);
}

// 4) number → bigint : RangeError if not a safe integer / 안전한 정수가 아니면 RangeError
function ToBigInt(nValue: number): bigint {
	if (!Number.isSafeInteger(nValue)) {
		throw new RangeError(`Not a safe integer: ${nValue}`);
	}
	return BigInt(nValue);
}

// Try it / 실행해 보기
for (const biValue of [255n, 0n, -255n, 0xffff_ffff_ffff_ffffn]) {
	console.log(`${ToDec(biValue).padStart(20)} | ${ToHex(biValue).padStart(19)} | ${ToBin(biValue)}`);
}

console.log(ToBigInt(255)); // 255n
try {
	ToBigInt(1.5); // ← Set a breakpoint and press F11 to step in / 중단점을 걸고 F11 로 들어가 보기
} catch (e) {
	console.log("RangeError:", (e as Error).message);
}
