//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: devcalc / main (Command-line entry point / 명령줄 진입점)
//	History			: 2026-10-14 CYBERKDH Initial (최초 작성) - Lesson 01 DevCalc step / 01강 DevCalc 스텝, Lv1
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// Usage / 사용법: node devcalc/src/main.ts 255
import { ToBin, ToDec, ToHex } from "./core/Format.ts";

// No argument → show usage and run an example / 인자가 없으면 사용법을 보여 주고 예시로 실행
let strInput = process.argv[2];
if (strInput === undefined) {
	console.log("Usage: node devcalc/src/main.ts <integer>   e.g. node devcalc/src/main.ts 255");
	console.log("(no input given, so running the example 255)");
	strInput = "255";
}

// Lv1: Input parsing is left to BigInt() for now (replaced by our own parser in lesson 03)
//      입력 해석은 BigInt() 에 맡긴다 (03강에서 직접 만든 해석기로 바꿀 예정)
let biValue: bigint;
try {
	biValue = BigInt(strInput);
} catch {
	console.log(`Invalid input: "${strInput}"`);
	console.log("Why : BigInt() accepts only an integer (e.g. 255, -10, 0xFF). Our own parser comes in lesson 03.");
	process.exit(1);
}

console.log(`HEX : ${ToHex(biValue)}`);
console.log(`DEC : ${ToDec(biValue)}`);
console.log(`BIN : ${ToBin(biValue)}`);
