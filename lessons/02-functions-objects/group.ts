//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 02-functions-objects / group (Digit grouping)
//	History			: 2026-10-14 CYBERKDH Initial
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// 1) [JS + TS] Group digits from the right : ("FFFFFFFF", 4, "_") → "FFFF_FFFF"
function GroupDigits(strDigits: string, nSize: number, strSeparator: string): string {
	if (nSize <= 0) {
		return strDigits; // no grouping
	}
	const arrGroup: string[] = [];
	for (let nEnd = strDigits.length; nEnd > 0; nEnd -= nSize) {
		const nStart = Math.max(0, nEnd - nSize);
		arrGroup.unshift(strDigits.slice(nStart, nEnd)); // add to the front
	}
	return arrGroup.join(strSeparator);
}

// 2) [TS] Output options as an interface. Every property is optional.
interface IFormatOptions {
	bGroup?: boolean; // group digits (default false)
	bUpperCase?: boolean; // A-F in upper case (default true)
	bPrefix?: boolean; // 0x / 0b prefix (default true)
}

// 3) [JS + TS] Destructure the options with defaults, then build the string
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

// Try it
console.log("1)", GroupDigits("FFFFFFFF", 4, "_"), GroupDigits("1234567", 3, ","), GroupDigits("FF", 4, "_"));
const biMax64 = 0xffff_ffff_ffff_ffffn;
console.log("2) default      :", ToHex(biMax64));
console.log("3) bGroup       :", ToHex(biMax64, { bGroup: true }));
console.log("4) lower, group :", ToHex(biMax64, { bGroup: true, bUpperCase: false }));
console.log("5) no prefix    :", ToHex(255n, { bPrefix: false }));
console.log("6) negative     :", ToHex(-0x1_0000n, { bGroup: true }));
