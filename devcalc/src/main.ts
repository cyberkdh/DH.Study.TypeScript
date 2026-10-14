//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: devcalc / main (명령줄 진입점 / Command-line entry point)
//	History			: 2026-10-14 CYBERKDH 최초 작성 (Initial) - 01강 DevCalc 스텝 / Lesson 01 DevCalc step, Lv1
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// 사용법 / Usage: node devcalc/src/main.ts 255
import { ToBin, ToDec, ToHex } from "./core/Format.ts";

const strInput = process.argv[2];
if (strInput === undefined) {
	console.log("사용법: node devcalc/src/main.ts <정수>   예) node devcalc/src/main.ts 255");
	process.exit(1);
}

// Lv1: 입력 해석은 BigInt() 에 맡긴다 (03강에서 직접 만든 해석기로 바꿀 예정)
//      Input parsing is left to BigInt() for now (replaced by our own parser in lesson 03)
const biValue = BigInt(strInput);

console.log(`HEX : ${ToHex(biValue)}`);
console.log(`DEC : ${ToDec(biValue)}`);
console.log(`BIN : ${ToBin(biValue)}`);
