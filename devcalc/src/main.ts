//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: devcalc / main (Command-line entry point)
//	History			: 2026-10-14 CYBERKDH Initial - Lesson 01 DevCalc step, Lv1
//					  2026-10-14 CYBERKDH Lesson 02: output options, function table
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// Usage : node devcalc/src/main.ts 255 [--no-group] [--lower] [--no-prefix]
import { ToBin, ToDec, ToHex, type IFormatOptions, type TFormatter } from "./core/Format.ts";

// Split arguments into the number and the --options
const arrArg = process.argv.slice(2);
const arrFlag = arrArg.filter((strArg) => strArg.startsWith("--"));
let strInput = arrArg.find((strArg) => !strArg.startsWith("--"));

const arrKnownFlag = ["--no-group", "--lower", "--no-prefix"];
for (const strFlag of arrFlag) {
	if (!arrKnownFlag.includes(strFlag)) {
		console.log(`Unknown option: "${strFlag}" (ignored)`);
		console.log(`Why : only ${arrKnownFlag.join(", ")} are supported.`);
	}
}

if (strInput === undefined) {
	console.log("Usage: node devcalc/src/main.ts <integer> [--no-group] [--lower] [--no-prefix]   e.g. node devcalc/src/main.ts 255");
	console.log("(no input given, so running the example 255)");
	strInput = "255";
}

// Lv1: Input parsing is left to BigInt() for now (replaced by our own parser in lesson 03)
let biValue: bigint;
try {
	biValue = BigInt(strInput);
} catch {
	console.log(`Invalid input: "${strInput}"`);
	console.log("Why : BigInt() accepts only an integer (e.g. 255, -10, 0xFF). Our own parser comes in lesson 03.");
	process.exit(1);
}

// Lesson 02: the command line groups digits by default; the flags turn things off
const oOptions: IFormatOptions = {
	bGroup: !arrFlag.includes("--no-group"),
	bUpperCase: !arrFlag.includes("--lower"),
	bPrefix: !arrFlag.includes("--no-prefix"),
};

// Function table : [label, formatter]
const arrRow: [string, TFormatter][] = [
	["HEX", ToHex],
	["DEC", ToDec],
	["BIN", ToBin],
];
for (const [strLabel, fnFormat] of arrRow) {
	console.log(`${strLabel} : ${fnFormat(biValue, oOptions)}`);
}
