//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 02-functions-objects / group (자릿수 묶기 만들기)
//	History			: 2026-10-14 CYBERKDH Initial (최초 작성)
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// 1) [JS + TS] 오른쪽부터 자릿수를 묶는다
function GroupDigits(strDigits: string, nSize: number, strSeparator: string): string {
	if (nSize <= 0) {
		return strDigits; // 묶지 않음
	}
	const arrGroup: string[] = [];
	for (let nEnd = strDigits.length; nEnd > 0; nEnd -= nSize) {
		const nStart = Math.max(0, nEnd - nSize);
		arrGroup.unshift(strDigits.slice(nStart, nEnd)); // 앞에 추가
	}
	return arrGroup.join(strSeparator);
}

// 2) [TS] 출력 옵션을 interface 로. 모든 프로퍼티가 선택
interface IFormatOptions {
	bGroup?: boolean; // 자릿수 묶기 (기본 false)
	bUpperCase?: boolean; // A-F 대문자 (기본 true)
	bPrefix?: boolean; // 0x / 0b 접두어 (기본 true)
}

// 3) [JS + TS] 옵션을 기본값과 함께 구조 분해하고 문자열을 만든다
function ToHex(biValue: bigint, { bGroup = false, bUpperCase = true, bPrefix = true }: IFormatOptions = {}): string {
	const strSign = biValue < 0n ? "-" : "";
	const biAbs = biValue < 0n ? -biValue : biValue;
	let strDigits = biAbs.toString(16);
	if (bUpperCase) {
		strDigits = strDigits.toUpperCase();
	}
	if (bGroup) {
		strDigits = GroupDigits(strDigits, 4, "_");
	}
	return strSign + (bPrefix ? "0x" : "") + strDigits;
}

// 실행해 보기
console.log("1)", GroupDigits("FFFFFFFF", 4, "_"), GroupDigits("1234567", 3, ","), GroupDigits("FF", 4, "_"));
const biMax64 = 0xffff_ffff_ffff_ffffn;
console.log("2) default      :", ToHex(biMax64));
console.log("3) bGroup       :", ToHex(biMax64, { bGroup: true }));
console.log("4) lower, group :", ToHex(biMax64, { bGroup: true, bUpperCase: false }));
console.log("5) no prefix    :", ToHex(255n, { bPrefix: false }));
console.log("6) negative     :", ToHex(-0x1_0000n, { bGroup: true }));
