//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 15-bundling-release / esbuild
//	History			: 2026-10-15 CYBERKDH Initial
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// esbuild from a script : the same tool as the command line, but the options are a typed object
// and the output stays in memory (write: false). Nothing is written to disk here.
import { build, transform, type BuildOptions } from "esbuild";
import { resolve } from "node:path";

const ROOT_DIR = resolve(import.meta.dirname, "../..");

function Kb(nChars: number): string {
	return `${(nChars / 1024).toFixed(1)} KB`;
}

// 1) [TS] esbuild removes types, it does not check them. "8" is not a number, and still no error
const oStrip = await transform('const nBits: number = "8";\nconsole.log(nBits);', { loader: "ts" });
Log("1) transform :", JSON.stringify(oStrip.code));
Log("   no error : esbuild only erases types, so run tsc --noEmit before you bundle");

// 2) [TS] satisfies keeps "esm" as the literal "esm". Without it, format widens to string
const BASE_OPTIONS = {
	entryPoints: [resolve(ROOT_DIR, "devcalc/web/App.ts")],
	bundle: true,
	write: false,
	format: "esm",
	metafile: true,
	logLevel: "silent",
} satisfies BuildOptions;
// const oLoose = { format: "esm" };
// await build(oLoose); // ← Uncomment → TS2345: Argument of type '{ format: string; }' is not assignable … Type 'string' is not assignable to type 'Format | undefined'.

const oPlain = await build(BASE_OPTIONS);
const strPlain = oPlain.outputFiles[0]?.text ?? "";
const nInputs = Object.keys(oPlain.metafile.inputs).length;
Log(`2) bundle : ${nInputs} input files → 1 file, ${Kb(strPlain.length)}`);

// 3) [JS] Tree shaking : functions nobody calls from App.ts are left out
for (const strName of ["FunctionHelp", "ParseInteger", "OutputHelp", "ToBin"]) {
	const bKept = strPlain.includes(`function ${strName}(`);
	Log(`3) ${strName.padEnd(12)} ${bKept ? "kept" : "dropped (App.ts never uses it)"}`);
}

// 4) [JS] minify : shorter names, no spaces or comments. Same behaviour, smaller file
const oMin = await build({ ...BASE_OPTIONS, minify: true });
const strMin = oMin.outputFiles[0]?.text ?? "";
Log(`4) minify : ${Kb(strPlain.length)} → ${Kb(strMin.length)} (${Math.round((strMin.length / strPlain.length) * 100)}%)`);
Log(`   starts : ${strMin.slice(0, 32)}…`);

// 5) [JS] format : "esm" needs <script type="module">, "iife" wraps everything in a function for a plain <script>
const oIife = await build({ ...BASE_OPTIONS, minify: true, format: "iife" });
Log(`5) esm  starts : ${strMin.slice(0, 20)}…`);
Log(`   iife starts : ${(oIife.outputFiles[0]?.text ?? "").slice(0, 20)}…`);

// 6) [TS] define : replace a name with a value at build time. declare tells TypeScript the name will exist
const strSource = 'declare const __BUILD__: string;\nconsole.log(typeof __BUILD__ === "string" ? __BUILD__ : "dev");';
const oDefine = await transform(strSource, { loader: "ts", minify: true, define: { __BUILD__: JSON.stringify("2026-10-15") } });
Log("6) define :", JSON.stringify(oDefine.code.trim()), "← the check and the dev branch are gone");

// 7) [JS] A failed build throws. e.errors holds one object per problem (text, file, line)
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
