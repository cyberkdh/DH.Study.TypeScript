//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: devcalc / tests / Web
//	History			: 2026-10-15 CYBERKDH Initial - Lesson 07 DevCalc step
//					  2026-10-15 CYBERKDH Lesson 09: runs on Vitest (test from "vitest", node:assert kept)
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

import { test } from "vitest";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join, sep } from "node:path";
import { ResolvePath } from "../../tools/serve.ts";

const APP_FILE = join(import.meta.dirname, "../web/App.ts");

test("web/App.ts: imports only the core (the browser has no node: modules)", async () => {
	const strCode = await readFile(APP_FILE, "utf8");
	const arrFrom = [...strCode.matchAll(/from\s+["']([^"']+)["']/g)].map((arrMatch) => arrMatch[1]);
	assert.deepEqual(arrFrom, ["../src/core/index.ts"]);
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
