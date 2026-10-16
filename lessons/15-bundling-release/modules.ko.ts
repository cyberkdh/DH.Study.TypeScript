//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 15-bundling-release / modules (모듈 그래프와 왕복 횟수)
//	History			: 2026-10-15 CYBERKDH Initial (최초 작성)
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// 번들러가 왜 필요한가 : 브라우저는 import 하나하나를 별도 파일로 받고, 앞 파일을 읽은 뒤에야
// 다음 파일이 있다는 걸 안다. DevCalc 웹 페이지를 브라우저가 하는 방식 그대로 따라가 본다.
import { readFileSync, statSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";

const ROOT_DIR = resolve(import.meta.dirname, "../..");
const ENTRY_FILE = resolve(ROOT_DIR, "devcalc/web/App.ts");
const WAVE_MS = 100; // 느린 연결에서 한 번 왕복 (round trip)

// 1) [JS] 줄 맨 앞의 "import … from" 과 "export … from". [^;]*? 는 줄도 넘어감 (긴 목록)
const RE_FROM = /^(?:import|export)\s+(type\s+)?[^;]*?\sfrom\s+["']([^"']+)["']/gm;

function ImportsOf(strFile: string): string[] {
	const strCode = readFileSync(strFile, "utf8");
	const arrSpec: string[] = [];
	for (const arrMatch of strCode.matchAll(RE_FROM)) {
		if (arrMatch[1] === undefined && arrMatch[2] !== undefined) {
			arrSpec.push(arrMatch[2]); // "import type" 은 지워짐 : 브라우저가 요청하지 않음
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

// 2) [JS] 물결 (wave) : 한 물결의 파일을 모두 읽은 뒤, 새로 나온 import 를 한꺼번에 요청
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

// 3) [JS] 번들러가 파일을 쓰는 순서 : 모든 파일은 자기가 import 하는 파일 뒤에 (깊이 우선, depth first)
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

// 4) [JS] ./ 나 / 가 없는 이름은 패키지. Node 는 node_modules 에서 찾고, 브라우저는 찾을 곳이 없음
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
