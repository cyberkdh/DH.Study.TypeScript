//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 15-bundling-release / esbuild (스크립트에서 esbuild 쓰기)
//	History			: 2026-10-15 CYBERKDH Initial (최초 작성)
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// 스크립트에서 쓰는 esbuild : 명령줄과 같은 도구지만 옵션이 타입 있는 객체이고,
// 결과는 메모리에 남는다 (write: false). 여기서는 디스크에 아무것도 쓰지 않는다.
import { build, transform, type BuildOptions } from "esbuild";
import { resolve } from "node:path";

const ROOT_DIR = resolve(import.meta.dirname, "../..");

function Kb(nChars: number): string {
	return `${(nChars / 1024).toFixed(1)} KB`;
}

// 1) [TS] esbuild 는 타입을 지울 뿐 검사하지 않는다. "8" 은 number 가 아닌데도 오류 없음
const oStrip = await transform('const nBits: number = "8";\nconsole.log(nBits);', { loader: "ts" });
Log("1) transform :", JSON.stringify(oStrip.code));
Log("   no error : esbuild only erases types, so run tsc --noEmit before you bundle");

// 2) [TS] satisfies 는 "esm" 을 리터럴 "esm" 으로 유지. 없으면 format 이 string 으로 넓어짐
const BASE_OPTIONS = {
	entryPoints: [resolve(ROOT_DIR, "devcalc/web/App.ts")],
	bundle: true,
	write: false,
	format: "esm",
	metafile: true,
	logLevel: "silent",
} satisfies BuildOptions;
// const oLoose = { format: "esm" };
// await build(oLoose); // ← 주석 해제 → TS2345: Argument of type '{ format: string; }' is not assignable … Type 'string' is not assignable to type 'Format | undefined'.

const oPlain = await build(BASE_OPTIONS);
const strPlain = oPlain.outputFiles[0]?.text ?? "";
const nInputs = Object.keys(oPlain.metafile.inputs).length;
Log(`2) bundle : ${nInputs} input files → 1 file, ${Kb(strPlain.length)}`);

// 3) [JS] 트리 셰이킹 (tree shaking) : App.ts 에서 아무도 부르지 않는 함수는 빠진다
for (const strName of ["FunctionHelp", "ParseInteger", "OutputHelp", "ToBin"]) {
	const bKept = strPlain.includes(`function ${strName}(`);
	Log(`3) ${strName.padEnd(12)} ${bKept ? "kept" : "dropped (App.ts never uses it)"}`);
}

// 4) [JS] 압축 (minify) : 짧은 이름, 공백과 주석 없음. 동작은 같고 파일은 작다
const oMin = await build({ ...BASE_OPTIONS, minify: true });
const strMin = oMin.outputFiles[0]?.text ?? "";
Log(`4) minify : ${Kb(strPlain.length)} → ${Kb(strMin.length)} (${Math.round((strMin.length / strPlain.length) * 100)}%)`);
Log(`   starts : ${strMin.slice(0, 32)}…`);

// 5) [JS] 형식 (format) : "esm" 은 <script type="module"> 필요, "iife" 는 전체를 함수로 감싸 일반 <script> 용
const oIife = await build({ ...BASE_OPTIONS, minify: true, format: "iife" });
Log(`5) esm  starts : ${strMin.slice(0, 20)}…`);
Log(`   iife starts : ${(oIife.outputFiles[0]?.text ?? "").slice(0, 20)}…`);

// 6) [TS] define : 빌드할 때 이름을 값으로 바꿈. declare 는 그 이름이 있을 거라고 TypeScript 에 알려줌
const strSource = 'declare const __BUILD__: string;\nconsole.log(typeof __BUILD__ === "string" ? __BUILD__ : "dev");';
const oDefine = await transform(strSource, { loader: "ts", minify: true, define: { __BUILD__: JSON.stringify("2026-10-15") } });
Log("6) define :", JSON.stringify(oDefine.code.trim()), "← the check and the dev branch are gone");

// 7) [JS] 빌드가 실패하면 예외. e.errors 에는 문제마다 객체 하나 (text, file, line)
try {
	await build({ stdin: { contents: 'import { X } from "./nope.ts";\nconsole.log(X);', resolveDir: ROOT_DIR, loader: "ts" }, bundle: true, write: false, logLevel: "silent" });
} catch (e) {
	const arrError = (e as { errors?: { text: string }[] }).errors ?? [];
	Log(`7) Expected error: ${arrError[0]?.text ?? String(e)}`);
	Log("   Why : the bundler follows every import at build time, and ./nope.ts does not exist.");
	Log("   Fix : correct the path. The mistake shows up at build time, not when a user opens the page.");
}

function Log(...arrPart: unknown[]): void {
	console.log(arrPart.map(String).join(" "));
}
