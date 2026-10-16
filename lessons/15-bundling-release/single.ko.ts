//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 15-bundling-release / single (직접 만들기: HTML 파일 하나)
//	History			: 2026-10-15 CYBERKDH Initial (최초 작성)
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// 직접 만들기 : 14강 비트 그리드를 HTML 파일 하나로. 서버도 node_modules 도 없이 더블클릭으로 실행.
// 순서 : .ts 번들 → CSS 와 JS 를 템플릿에 넣기 → 검사 → dist/single/bitgrid.html 쓰기
import { build } from "esbuild";
import { mkdirSync, writeFileSync } from "node:fs";
import { relative, resolve } from "node:path";

const ROOT_DIR = resolve(import.meta.dirname, "../..");
const ENTRY_FILE = resolve(ROOT_DIR, "lessons/14-events-accessibility/bitgrid.ts");
const OUT_FILE = resolve(ROOT_DIR, "dist/single/bitgrid.html");
const CSS_MARK = "/*INLINE:CSS*/";
const JS_MARK = "/*INLINE:JS*/";

const TEMPLATE_HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Bit grid · one file</title>
<style>${CSS_MARK}</style>
</head>
<body>
<h1>Bit grid</h1>
<div id="grid" class="grid" role="group" aria-label="bits 15 to 0"></div>
<p>value = <output id="grid-value">0x0000</output></p>
<pre id="bitgrid-log"></pre>
<script type="module">${JS_MARK}</script>
</body>
</html>
`;

const STYLE_CSS = `body { font-family: system-ui, sans-serif; margin: 2em; }
.grid { display: grid; grid-template-columns: repeat(8, 2.2em); gap: 4px; }
.grid button { padding: 4px 0; }
[aria-pressed="true"] { background: teal; color: white; }
:focus-visible { outline: 2px solid teal; outline-offset: 2px; }
pre { background: #f4f4f4; padding: 0.5em; }`;

// 1) [TS] inline.ts 와 같은 함수 : 함수 치환자 (function replacer), 중간에 끝나는 </script 나 </style 없음
function Inline(strHtml: string, strMarker: string, strCode: string): string {
	if (!strHtml.includes(strMarker)) {
		throw new Error(`marker ${strMarker} not found in the template`);
	}
	const strSafe = strCode.replace(/<\/(script|style)/gi, "<\\/$1");
	return strHtml.replace(strMarker, () => strSafe);
}

// 2) [JS] 번들 : bitgrid.ts 는 import 가 없지만 타입은 지워야 하고, minify 로 작게 만든다
const oResult = await build({ entryPoints: [ENTRY_FILE], bundle: true, write: false, format: "esm", minify: true, target: "es2022", logLevel: "silent" });
const strJs = oResult.outputFiles[0]?.text ?? "";
Log(`1) bundle : ${relative(ROOT_DIR, ENTRY_FILE).replaceAll("\\", "/")} → ${strJs.length} chars of JS`);

// 3) [JS] 넣은 뒤, 쓰기 전에 페이지를 검사
const strPage = Inline(Inline(TEMPLATE_HTML, CSS_MARK, STYLE_CSS), JS_MARK, strJs);
const arrCheck: [string, boolean][] = [
	["markers replaced", !strPage.includes(CSS_MARK) && !strPage.includes(JS_MARK)],
	["one </script>", (strPage.match(/<\/script/gi) ?? []).length === 1],
	["no .ts file left", !/src=["'][^"']+\.ts["']/.test(strPage)],
	["no import left", !/^\s*import\s/m.test(strJs)],
];
for (const [strName, bOk] of arrCheck) {
	Log(`2) check ${strName.padEnd(18)} ${bOk ? "ok" : "FAILED"}`);
}

mkdirSync(resolve(OUT_FILE, ".."), { recursive: true });
writeFileSync(OUT_FILE, strPage);
Log(`3) wrote ${relative(ROOT_DIR, OUT_FILE).replaceAll("\\", "/")} : ${(strPage.length / 1024).toFixed(1)} KB, 1 file`);
Log("   open it from Explorer (file://) : the grid works, and the log shows lesson 14's lines 6) to 9)");

// 4) [JS] 표시 (marker) 가 없는 템플릿 : 스크립트 없는 페이지를 쓰느니 멈추는 게 낫다
try {
	Inline("<script></script>", JS_MARK, strJs);
} catch (e) {
	Log(`4) Expected error: ${String(e)}`);
	Log("   Why : someone changed the template and the marker went with it. replace() alone would return the page unchanged, silently.");
	Log(`   Fix : put ${JS_MARK} back inside <script type="module">. Inline() checks so the build stops instead.`);
}

function Log(strLine: string): void {
	console.log(strLine);
}
