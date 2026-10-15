//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: tools / build-web (Build the DevCalc web page as static files for GitHub Pages)
//	History			: 2026-10-15 CYBERKDH Initial
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// Usage : npm run build:web
//   [1] tsc -p tsconfig.web.json : devcalc/web/App.ts and the core it imports → dist/web/ (.ts imports become .js)
//   [2] copies index.html and style.css, pointing the page at App.js instead of App.ts
//   [3] dist/web/index.html : sends the site root to devcalc/web/
// The result is plain static files (no dev server needed). .github/workflows/pages.yml publishes dist/web.
import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const ROOT_DIR = resolve(import.meta.dirname, ".."); // projectroot
const OUT_DIR = join(ROOT_DIR, "dist", "web");
const WEB_SRC_DIR = join(ROOT_DIR, "devcalc", "web");
const WEB_OUT_DIR = join(OUT_DIR, "devcalc", "web");
const STR_SCRIPT_TS = 'src="./App.ts"';
const STR_SCRIPT_JS = 'src="./App.js"';

function Fail(strWhy: string): never {
	console.log("Build failed.");
	console.log(`Why : ${strWhy}`);
	process.exit(1);
}

// Start clean : an old App.js must not hide a missing one
rmSync(OUT_DIR, { recursive: true, force: true });

// [1] Compile (a type error stops the build : tsc exits with 1)
console.log("[1] tsc -p tsconfig.web.json  →  dist/web/");
try {
	execFileSync(process.execPath, [join(ROOT_DIR, "node_modules/typescript/bin/tsc"), "-p", "tsconfig.web.json"], { cwd: ROOT_DIR, stdio: "inherit" });
} catch {
	Fail("tsc reported errors (above). Fix them, or check with npm run typecheck.");
}
if (!existsSync(join(WEB_OUT_DIR, "App.js"))) {
	Fail("tsc did not write dist/web/devcalc/web/App.js. Check outDir and include in tsconfig.web.json.");
}

// [2] Page and style
console.log("[2] index.html, style.css  →  dist/web/devcalc/web/");
const strHtml = readFileSync(join(WEB_SRC_DIR, "index.html"), "utf8");
if (!strHtml.includes(STR_SCRIPT_TS)) {
	Fail(`devcalc/web/index.html has no ${STR_SCRIPT_TS}. Update STR_SCRIPT_TS in tools/build-web.ts.`);
}
writeFileSync(join(WEB_OUT_DIR, "index.html"), strHtml.replace(STR_SCRIPT_TS, STR_SCRIPT_JS));
copyFileSync(join(WEB_SRC_DIR, "style.css"), join(WEB_OUT_DIR, "style.css"));

// [3] Site root → the calculator
console.log("[3] dist/web/index.html  →  devcalc/web/");
const STR_ROOT_HTML = `<!doctype html>
<html lang="en">
	<head>
		<meta charset="utf-8" />
		<meta http-equiv="refresh" content="0; url=devcalc/web/" />
		<title>DevCalc</title>
	</head>
	<body>
		<a href="devcalc/web/">DevCalc</a>
	</body>
</html>
`;
writeFileSync(join(OUT_DIR, "index.html"), STR_ROOT_HTML);

console.log("Done : dist/web/ (open devcalc/web/index.html through any static web server)");
