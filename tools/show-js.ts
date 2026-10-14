//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: tools / show-js (Show the JS that tsc generates, then run it / tsc 가 만든 JS 를 보여 주고 실행)
//	History			: 2026-10-14 CYBERKDH Initial (최초 작성)
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// Usage / 사용법 : npm run js -- lessons/00-setup/hello.ts
//   [1] tsc builds everything into dist/   / tsc 가 전체를 dist/ 로 빌드
//   [2] prints the generated .js            / 만들어진 .js 를 출력
//   [3] runs that .js with node             / 그 .js 를 node 로 실행
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const STR_ROOT = resolve(import.meta.dirname, ".."); // projectroot
const STR_LINE = "-".repeat(70);

// No argument → use hello.ts as an example / 인자가 없으면 hello.ts 를 예시로 사용
let strArg = process.argv[2];
if (strArg === undefined) {
	console.log("Usage: npm run js -- <file.ts>   e.g. npm run js -- lessons/00-setup/hello.ts");
	console.log("(no file given, so showing lessons/00-setup/hello.ts)\n");
	strArg = join(STR_ROOT, "lessons/00-setup/hello.ts");
}

// npm run moves to projectroot; INIT_CWD is the folder you ran it from
// npm run 은 projectroot 로 이동한다. INIT_CWD 는 명령을 실행한 원래 폴더
const strCwd = process.env["INIT_CWD"] ?? process.cwd();
const strTs = relative(STR_ROOT, resolve(strCwd, strArg)); // Path from projectroot / projectroot 기준 경로
if (!strTs.endsWith(".ts") || !existsSync(join(STR_ROOT, strTs))) {
	console.log(`Invalid input: "${strArg}"`);
	console.log("Why : give an existing .ts file inside projectroot.");
	process.exit(1);
}
const strJs = join("dist", strTs.replace(/\.ts$/, ".js"));

// [1] Build / 빌드
console.log(`[1] tsc : ${strTs}  →  ${strJs}`);
try {
	execFileSync(process.execPath, [join(STR_ROOT, "node_modules/typescript/bin/tsc")], { cwd: STR_ROOT, stdio: "inherit" });
} catch {
	// tsc still writes .js even when there are type errors (noEmitOnError is off)
	// 타입 오류가 있어도 tsc 는 .js 를 만든다 (noEmitOnError 꺼짐)
	console.log("Note: tsc reported type errors (above), but the .js is still generated.");
}

// [2] Generated JS, without the file header and the source map line
//     만들어진 JS. 파일 헤더 주석과 소스맵 줄은 빼고 출력
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

// [3] Run the generated JS / 만들어진 JS 실행
console.log(`\n[3] node ${strJs}`);
try {
	execFileSync(process.execPath, [strJs], { cwd: STR_ROOT, stdio: "inherit" });
} catch {
	console.log("Note: the program above exited with an error code.");
}
