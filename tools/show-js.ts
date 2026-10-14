//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: tools / show-js (Show the JS that tsc generates, then run it)
//	History			: 2026-10-14 CYBERKDH Initial
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// Usage : npm run js -- lessons/00-setup/hello.ts
//   [1] tsc builds everything into dist/
//   [2] prints the generated .js
//   [3] runs that .js with node
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const STR_ROOT = resolve(import.meta.dirname, ".."); // projectroot
const STR_LINE = "-".repeat(70);

// No argument → use hello.ts as an example
let strArg = process.argv[2];
if (strArg === undefined) {
	console.log("Usage: npm run js -- <file.ts>   e.g. npm run js -- lessons/00-setup/hello.ts");
	console.log("(no file given, so showing lessons/00-setup/hello.ts)\n");
	strArg = join(STR_ROOT, "lessons/00-setup/hello.ts");
}

// npm run moves to projectroot; INIT_CWD is the folder you ran it from
const strCwd = process.env["INIT_CWD"] ?? process.cwd();
const strTs = relative(STR_ROOT, resolve(strCwd, strArg)); // Path from projectroot
if (!strTs.endsWith(".ts") || !existsSync(join(STR_ROOT, strTs))) {
	console.log(`Invalid input: "${strArg}"`);
	console.log("Why : give an existing .ts file inside projectroot.");
	process.exit(1);
}
const strJs = join("dist", strTs.replace(/\.ts$/, ".js"));

// [1] Build
console.log(`[1] tsc : ${strTs}  →  ${strJs}`);
try {
	execFileSync(process.execPath, [join(STR_ROOT, "node_modules/typescript/bin/tsc")], { cwd: STR_ROOT, stdio: "inherit" });
} catch {
	// tsc still writes .js even when there are type errors (noEmitOnError is off)
	console.log("Note: tsc reported type errors (above), but the .js is still generated.");
}

// [2] Generated JS, without the file header and the source map line
const arrLines = readFileSync(join(STR_ROOT, strJs), "utf8").split(/\r?\n/);
let nStart = 0;
while (nStart < arrLines.length && (arrLines[nStart] ?? "").startsWith("//")) {
	nStart++;
}
const strCode = arrLines
	.slice(nStart)
	.filter((strLine) => !strLine.startsWith("//# sourceMappingURL="))
	.join("\n")
	.trim();

console.log(`\n[2] Generated JavaScript (${strJs})`);
console.log(STR_LINE);
console.log(strCode);
console.log(STR_LINE);

// [3] Run the generated JS
console.log(`\n[3] node ${strJs}`);
try {
	execFileSync(process.execPath, [strJs], { cwd: STR_ROOT, stdio: "inherit" });
} catch {
	console.log("Note: the program above exited with an error code.");
}
