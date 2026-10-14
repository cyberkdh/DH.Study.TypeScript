//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: tools / check (강의 연습문제 채점)
//	History			: 2026-10-14 CYBERKDH 최초 작성
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// 사용법
//   npm run check 01              01강 연습문제(exercises) 채점
//   npm run check                 모든 강의 연습문제 채점
//   npm run check:solutions 01    01강 정답(solutions) 채점 (CI 에서 사용)

import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const LESSONS_DIR = "lessons";

const arrArgs = process.argv.slice(2);
const bSolutions = arrArgs.includes("--solutions");
const strLesson = arrArgs.find((s) => !s.startsWith("--"));
const strPrefix = strLesson === undefined ? "" : `${strLesson.padStart(2, "0")}-`;

const arrFiles: string[] = [];
for (const strDir of readdirSync(LESSONS_DIR).sort()) {
	if (!strDir.startsWith(strPrefix)) continue;
	const strTestsDir = join(LESSONS_DIR, strDir, "tests");
	if (!existsSync(strTestsDir)) continue;
	for (const strFile of readdirSync(strTestsDir).sort()) {
		if (strFile.endsWith(".test.ts")) arrFiles.push(join(strTestsDir, strFile));
	}
}

if (arrFiles.length === 0) {
	console.log(`테스트가 없습니다: ${strLesson ?? "(전체)"}`);
	process.exit(strLesson === undefined ? 0 : 1);
}

const strTarget = bSolutions ? "solutions" : "exercises";
console.log(`▶ ${strTarget} 채점: ${arrFiles.length}개 파일\n`);

const oResult = spawnSync(process.execPath, ["--test", ...arrFiles], {
	stdio: "inherit",
	env: { ...process.env, LESSON_TARGET: strTarget },
});
process.exitCode = oResult.status ?? 1;
