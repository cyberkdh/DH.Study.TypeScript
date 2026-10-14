//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: devcalc / main (Command-line entry point / 명령줄 진입점)
//	History			: 2026-10-14 CYBERKDH Initial (최초 작성) - Lesson 01 DevCalc step / 01강 DevCalc 스텝, Lv1
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// Usage / 사용법: node devcalc/src/main.ts 255
import { ToBin, ToDec, ToHex } from "./core/Format.ts";

const strInput = process.argv[2];
if (strInput === undefined) {
	console.log("Usage: node devcalc/src/main.ts <integer>   e.g. node devcalc/src/main.ts 255");
	process.exit(1);
}

// Lv1: Input parsing is left to BigInt() for now (replaced by our own parser in lesson 03)
//      입력 해석은 BigInt() 에 맡긴다 (03강에서 직접 만든 해석기로 바꿀 예정)
const biValue = BigInt(strInput);

console.log(`HEX : ${ToHex(biValue)}`);
console.log(`DEC : ${ToDec(biValue)}`);
console.log(`BIN : ${ToBin(biValue)}`);
