//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 15-bundling-release / modules
//	History			: 2026-10-15 CYBERKDH Initial
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// Why a bundler : the browser loads every import as its own file, and learns about the next file
// only after it has read the one before. This walks DevCalc's web page the way the browser does.
import { readFileSync, statSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";

const ROOT_DIR = resolve(import.meta.dirname, "../..");
const ENTRY_FILE = resolve(ROOT_DIR, "devcalc/web/App.ts");
const WAVE_MS = 100; // one round trip on a slow connection

// 1) [JS] "import … from" and "export … from" at the start of a line. [^;]*? also crosses lines (long lists)
const RE_FROM = /^(?:import|export)\s+(type\s+)?[^;]*?\sfrom\s+["']([^"']+)["']/gm;

function ImportsOf(strFile: string): string[] {
	const strCode = readFileSync(strFile, "utf8");
	const arrSpec: string[] = [];
	for (const arrMatch of strCode.matchAll(RE_FROM)) {
		if (arrMatch[1] === undefined && arrMatch[2] !== undefined) {
			arrSpec.push(arrMatch[2]); // "import type" is erased : the browser never asks for it
		}
	}
	return arrSpec;
}

function Short(strFile: string): string {
	return relative(resolve(ROOT_DIR, "devcalc"), strFile).replaceAll("\\", "/");
}

function Kb(nBytes: number): string {
	return `${(nBytes / 1024).toFixed(1)} KB`;
}

// 2) [JS] Waves : the browser reads every file of one wave, then asks for all the new imports at once
function Waves(strEntry: string): string[][] {
	const setSeen = new Set([strEntry]);
	const arrWave: string[][] = [];
	let arrNow = [strEntry];
	while (arrNow.length > 0) {
		arrWave.push(arrNow);
		const arrNext: string[] = [];
		for (const strFile of arrNow) {
			for (const strSpec of ImportsOf(strFile)) {
				const strDep = resolve(dirname(strFile), strSpec);
				if (!setSeen.has(strDep)) {
					setSeen.add(strDep);
					arrNext.push(strDep);
				}
			}
		}
		arrNow = arrNext;
	}
	return arrWave;
}

// 3) [JS] The order a bundler writes the files : every file after the files it imports (depth first)
function BundleOrder(strFile: string, setDone: Set<string> = new Set(), arrOrder: string[] = []): string[] {
	setDone.add(strFile);
	for (const strSpec of ImportsOf(strFile)) {
		const strDep = resolve(dirname(strFile), strSpec);
		if (!setDone.has(strDep)) {
			BundleOrder(strDep, setDone, arrOrder);
		}
	}
	arrOrder.push(strFile);
	return arrOrder;
}

const arrWave = Waves(ENTRY_FILE);
const arrAll = arrWave.flat();
const nBytes = arrAll.reduce((nSum, strFile) => nSum + statSync(strFile).size, 0);

Log("1) the browser loads App.ts, reads it, and only then asks for what it imports");
arrWave.forEach((arrFile, nAt) => {
	const strList = arrFile.length > 4 ? `${arrFile.slice(0, 3).map(Short).join(", ")}, … (${arrFile.length} files)` : arrFile.map(Short).join(", ");
	Log(`   wave ${nAt + 1} : ${strList}`);
});
Log(`2) ${arrAll.length} files, ${Kb(nBytes)}, ${arrWave.length} waves : at ${WAVE_MS} ms a round trip, ${arrWave.length * WAVE_MS} ms before App.ts can run`);

const arrOrder = BundleOrder(ENTRY_FILE);
Log("3) a bundler writes them into one file in this order (each one after what it imports) :");
Log(`   ${arrOrder.map((strFile) => Short(strFile).split("/").pop()).join(" → ")}`);
Log("   the import lines disappear : the names are already in the same file");

// 4) [JS] A name without ./ or / is a package. Node looks in node_modules; a browser has nowhere to look
const strBare = "devcalc/src/core/index.ts";
try {
	await import(strBare);
} catch (e) {
	Log(`4) Expected error: ${String(e).split(" imported from")[0]}`);
	Log(`   Why : "${strBare}" has no ./ in front, so it is read as a package name, not a path. A browser says "Failed to resolve module specifier".`);
	Log('   Fix : write a relative path ("./" or "../"), or let a bundler resolve the names at build time.');
}

function Log(strLine: string): void {
	console.log(strLine);
}
