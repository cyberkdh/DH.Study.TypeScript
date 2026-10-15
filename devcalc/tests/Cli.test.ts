//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: devcalc / tests / Cli
//	History			: 2026-10-15 CYBERKDH Initial - Lesson 06 DevCalc step
//					  2026-10-15 CYBERKDH Lesson 09: runs on Vitest (test from "vitest", node:assert kept)
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

import { test } from "vitest";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { ClipboardCommands } from "../src/cli/Clipboard.ts";

const CORE_DIR = join(import.meta.dirname, "../src/core");
const MAIN_FILE = join(import.meta.dirname, "../src/main.ts");

test("core: no Node-only imports, so it can run in the browser", async () => {
	for (const strName of await readdir(CORE_DIR)) {
		const strCode = await readFile(join(CORE_DIR, strName), "utf8");
		assert.doesNotMatch(strCode, /from\s+["']node:/, `${strName} imports a node: module`);
	}
});

test("core/index.ts: exports what main.ts needs", async () => {
	const oCore = await import("../src/core/index.ts");
	for (const strName of ["Evaluate", "CHistory", "CWordSize", "ToHex", "ToDec", "ToBin", "ParseInteger"]) {
		assert.ok(strName in oCore, `${strName} is missing`);
	}
});

test("ClipboardCommands: one program per OS, several on Linux", () => {
	assert.deepEqual(
		ClipboardCommands("win32").map((oCommand) => oCommand.strFile),
		["clip"],
	);
	assert.deepEqual(
		ClipboardCommands("darwin").map((oCommand) => oCommand.strFile),
		["pbcopy"],
	);
	assert.deepEqual(
		ClipboardCommands("linux").map((oCommand) => oCommand.strFile),
		["wl-copy", "xclip", "xsel"],
	);
});

test("--repl: reads piped lines, keeps ans between lines, stops at exit", () => {
	const oRun = spawnSync(process.execPath, [MAIN_FILE, "--repl"], {
		input: "0xFF\nans + 1\n0xG\nhistory\nexit\n0x1\n",
		encoding: "utf8",
	});
	assert.equal(oRun.status, 0);
	assert.match(oRun.stdout, /devcalc> ans \+ 1\nHEX : 0x100\n/);
	assert.match(oRun.stdout, /Invalid input: "0xG"/); // an error does not end the loop
	assert.match(oRun.stdout, / 2\) ans \+ 1 = 0x100\n/);
	assert.doesNotMatch(oRun.stdout, /0x1\n/); // after exit nothing runs
});
