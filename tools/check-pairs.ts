//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: tools / check-pairs (Check that x.ts and x.ko.ts have the same code)
//	History			: 2026-10-14 CYBERKDH Initial
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// Usage : node tools/check-pairs.ts   (also runs as part of npm test)
//   Every lesson example is a pair : x.ts (English comments) + x.ko.ts (Korean comments).
//   Comments are removed, whitespace is ignored and ".ko.ts" is read as ".ts",
//   then the two files must be identical. Otherwise the check fails (exit code 1).

import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join, relative } from "node:path";

const LESSONS_DIR = join(import.meta.dirname, "..", "lessons");

// Remove // and /* */ comments that are outside strings and template literals
// (enough for the lesson examples, which have no regex literals)
function StripComments(strSource: string): string {
	let strOut = "";
	let nIdx = 0;
	let strQuote = "";
	while (nIdx < strSource.length) {
		const strChar = strSource[nIdx]!;
		if (strQuote !== "") {
			strOut += strChar;
			if (strChar === "\\") {
				strOut += strSource[nIdx + 1] ?? "";
				nIdx += 2;
				continue;
			}
			if (strChar === strQuote) {
				strQuote = "";
			}
			nIdx++;
			continue;
		}
		if (strChar === '"' || strChar === "'" || strChar === "`") {
			strQuote = strChar;
			strOut += strChar;
			nIdx++;
			continue;
		}
		if (strSource.startsWith("//", nIdx)) {
			const nEnd = strSource.indexOf("\n", nIdx);
			nIdx = nEnd === -1 ? strSource.length : nEnd;
			continue;
		}
		if (strSource.startsWith("/*", nIdx)) {
			const nEnd = strSource.indexOf("*/", nIdx + 2);
			nIdx = nEnd === -1 ? strSource.length : nEnd + 2;
			continue;
		}
		strOut += strChar;
		nIdx++;
	}
	return strOut;
}

function Normalize(strSource: string): string[] {
	return StripComments(strSource)
		.replaceAll(".ko.ts", ".ts")
		.split("\n")
		.map((strLine) => strLine.replace(/\s+/g, " ").trim())
		.filter((strLine) => strLine !== "");
}

function FindTsFiles(strDir: string): string[] {
	const arrFile: string[] = [];
	for (const oEntry of readdirSync(strDir, { withFileTypes: true })) {
		const strPath = join(strDir, oEntry.name);
		if (oEntry.isDirectory()) {
			arrFile.push(...FindTsFiles(strPath));
		} else if (oEntry.name.endsWith(".ts")) {
			arrFile.push(strPath);
		}
	}
	return arrFile;
}

let nFail = 0;
const arrAllFile = FindTsFiles(LESSONS_DIR);
const arrFile = arrAllFile.filter((strPath) => !strPath.endsWith(".ko.ts"));
const arrKoFile = arrAllFile.filter((strPath) => strPath.endsWith(".ko.ts"));
for (const strEn of arrFile) {
	const strKo = strEn.replace(/\.ts$/, ".ko.ts");
	const strName = relative(process.cwd(), strEn);
	if (!existsSync(strKo)) {
		console.log(`FAIL ${strName} : no Korean pair (${relative(process.cwd(), strKo)})`);
		nFail++;
		continue;
	}
	const arrEn = Normalize(readFileSync(strEn, "utf8"));
	const arrKo = Normalize(readFileSync(strKo, "utf8"));
	const nLine = Math.max(arrEn.length, arrKo.length);
	for (let nIdx = 0; nIdx < nLine; nIdx++) {
		if (arrEn[nIdx] !== arrKo[nIdx]) {
			console.log(`FAIL ${strName} : code differs from the .ko.ts file`);
			console.log(`  .ts    : ${arrEn[nIdx] ?? "(end of file)"}`);
			console.log(`  .ko.ts : ${arrKo[nIdx] ?? "(end of file)"}`);
			nFail++;
			break;
		}
	}
}

// A .ko.ts without its .ts
for (const strKo of arrKoFile) {
	const strEn = strKo.replace(/\.ko\.ts$/, ".ts");
	if (!existsSync(strEn)) {
		console.log(`FAIL ${relative(process.cwd(), strKo)} : no English pair (${relative(process.cwd(), strEn)})`);
		nFail++;
	}
}

console.log(`check-pairs : ${arrFile.length} pairs, ${nFail} failed`);
if (nFail > 0) {
	process.exitCode = 1;
}
