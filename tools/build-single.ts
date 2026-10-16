//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: tools / build-single (DevCalc web page as one HTML file, Lesson 15)
//	History			: 2026-10-15 CYBERKDH Initial
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// Usage : npm run build:single   (after npm run build:web : that one empties dist/web first)
//   [1] tsc --noEmit -p tsconfig.web.json : esbuild does not check types, so tsc does it first
//   [2] esbuild : devcalc/web/App.ts and everything it imports → one minified ES module
//   [3] index.html + style.css + the module → dist/web/DevCalc.html (no other file needed)
//   [4] checks : no link to App.ts or style.css left, exactly one </script>
// Open DevCalc.html by double-clicking it (file://), from a USB stick, or from GitHub Pages.
import { build, version } from "esbuild";
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const ROOT_DIR = resolve(import.meta.dirname, ".."); // projectroot
const WEB_SRC_DIR = join(ROOT_DIR, "devcalc", "web");
const OUT_DIR = join(ROOT_DIR, "dist", "web");
const OUT_FILE = join(OUT_DIR, "DevCalc.html");
const STR_STYLE_LINK = '<link rel="stylesheet" href="./style.css" />';
const STR_SCRIPT_TAG = '<script type="module" src="./App.ts"></script>';

function Fail(strWhy: string): never {
	console.log("Build failed.");
	console.log(`Why : ${strWhy}`);
	process.exit(1);
}

// A function replacer : $& or $$ in the code stay as they are. </script and </style cannot end the tag early
function Inline(strHtml: string, strFind: string, strOpen: string, strClose: string, strCode: string): string {
	if (!strHtml.includes(strFind)) {
		Fail(`devcalc/web/index.html has no ${strFind}. Update tools/build-single.ts to match the page.`);
	}
	const strSafe = strCode.replace(/<\/(script|style)/gi, "<\\/$1");
	return strHtml.replace(strFind, () => `${strOpen}\n${strSafe}\n${strClose}`);
}

// [1] Types first
console.log("[1] tsc --noEmit -p tsconfig.web.json");
try {
	execFileSync(process.execPath, [join(ROOT_DIR, "node_modules/typescript/bin/tsc"), "--noEmit", "-p", "tsconfig.web.json"], { cwd: ROOT_DIR, stdio: "inherit" });
} catch {
	Fail("tsc reported errors (above). esbuild would build them anyway, so the build stops here.");
}

// [2] Bundle
const STR_BUILD = `one file · built ${new Date().toISOString().slice(0, 10)} · esbuild ${version}`;
console.log("[2] esbuild devcalc/web/App.ts  →  one module");
let strJs = "";
try {
	const oResult = await build({
		entryPoints: [join(WEB_SRC_DIR, "App.ts")],
		bundle: true,
		write: false,
		format: "esm",
		target: "es2022",
		minify: true,
		metafile: true,
		define: { DEVCALC_BUILD: JSON.stringify(STR_BUILD) },
		logLevel: "silent",
	});
	strJs = oResult.outputFiles[0]?.text ?? "";
	console.log(`    ${Object.keys(oResult.metafile.inputs).length} files → ${(strJs.length / 1024).toFixed(1)} KB`);
} catch (e) {
	const arrError = (e as { errors?: { text: string }[] }).errors ?? [];
	Fail(arrError.map((oError) => oError.text).join(" / ") || String(e));
}

// [3] One page
console.log("[3] index.html + style.css + module  →  dist/web/DevCalc.html");
const strHtml = readFileSync(join(WEB_SRC_DIR, "index.html"), "utf8");
const strCss = readFileSync(join(WEB_SRC_DIR, "style.css"), "utf8");
const strStyled = Inline(strHtml, STR_STYLE_LINK, "<style>", "</style>", strCss);
const strPage = Inline(strStyled, STR_SCRIPT_TAG, '<script type="module">', "</script>", strJs);

// [4] Checks before writing
const arrProblem = [
	strPage.includes("./App.ts") ? "the page still points at ./App.ts" : "",
	strPage.includes("./style.css") ? "the page still points at ./style.css" : "",
	(strPage.match(/<\/script/gi) ?? []).length !== 1 ? "more than one </script> : the module would end early" : "",
].filter((strProblem) => strProblem !== "");
if (arrProblem.length > 0) {
	Fail(arrProblem.join(" / "));
}
mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(OUT_FILE, strPage);
console.log(`[4] checks ok · ${(strPage.length / 1024).toFixed(1)} KB · ${STR_BUILD}`);
console.log("Done : dist/web/DevCalc.html (double-click it : no server needed)");
