//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: devcalc / tests / Web
//	History			: 2026-10-15 CYBERKDH Initial - Lesson 07 DevCalc step
//					  2026-10-15 CYBERKDH Lesson 09: runs on Vitest (test from "vitest", node:assert kept)
//					  2026-10-15 CYBERKDH Lesson 14: BitGrid.ts imports nothing, App.ts imports the core and BitGrid.ts
//					  2026-10-15 CYBERKDH Lesson 15: index.html keeps the two tags tools/build-single.ts replaces
//					  2026-10-16 CYBERKDH Lesson 17: App.ts also imports TreeView.ts, TreeView.ts imports only core types
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

import { test } from "vitest";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join, sep } from "node:path";
import { ResolvePath } from "../../tools/serve.ts";

const WEB_DIR = join(import.meta.dirname, "../web");

async function ImportsOf(strFile: string): Promise<(string | undefined)[]> {
	const strCode = await readFile(join(WEB_DIR, strFile), "utf8");
	return [...strCode.matchAll(/from\s+["']([^"']+)["']/g)].map((arrMatch) => arrMatch[1]);
}

test("web/App.ts: imports only the core, BitGrid.ts and TreeView.ts (the browser has no node: modules)", async () => {
	assert.deepEqual(await ImportsOf("App.ts"), ["../src/core/index.ts", "./BitGrid.ts", "./TreeView.ts"]);
});

test("web/TreeView.ts: imports only core types (import type is erased, lesson 17)", async () => {
	assert.deepEqual(await ImportsOf("TreeView.ts"), ["../src/core/index.ts"]);
	const strCode = await readFile(join(WEB_DIR, "TreeView.ts"), "utf8");
	assert.match(strCode, /^import type \{[^}]+\} from "\.\.\/src\/core\/index\.ts";$/m);
});

test("web/BitGrid.ts: imports nothing (DOM only, lesson 14)", async () => {
	assert.deepEqual(await ImportsOf("BitGrid.ts"), []);
});

test("serve ResolvePath: files inside the project only", () => {
	const strPage = ResolvePath("/devcalc/web/index.html");
	assert.ok(strPage?.endsWith(["devcalc", "web", "index.html"].join(sep)));
	assert.ok(ResolvePath("/devcalc/web/%41pp.ts")?.endsWith("App.ts")); // %41 = "A"
	assert.equal(ResolvePath("/../secret.txt"), undefined); // path traversal
	assert.equal(ResolvePath("/%2e%2e/secret.txt"), undefined); // the same, %-escaped
	assert.equal(ResolvePath("/.git/config"), undefined); // hidden folders
	assert.equal(ResolvePath("/node_modules/typescript/package.json"), undefined);
	assert.equal(ResolvePath("/%E0%A4%A"), undefined); // a broken %-escape
});

test("web/index.html: has the exact tags tools/build-single.ts replaces (lesson 15)", async () => {
	const strHtml = await readFile(join(WEB_DIR, "index.html"), "utf8");
	const strTool = await readFile(join(WEB_DIR, "../../tools/build-single.ts"), "utf8");
	for (const strTag of ['<link rel="stylesheet" href="./style.css" />', '<script type="module" src="./App.ts"></script>']) {
		assert.ok(strHtml.includes(strTag), `index.html lost ${strTag}`);
		assert.ok(strTool.includes(`'${strTag}'`), `build-single.ts no longer looks for ${strTag}`);
	}
	assert.equal(strHtml.match(/<\/script/gi)?.length, 1); // one script tag : the one that gets the bundle
});
