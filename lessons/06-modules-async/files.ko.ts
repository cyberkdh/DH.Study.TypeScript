//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 06-modules-async / files (파일 읽기·쓰기와 JSON)
//	History			: 2026-10-15 CYBERKDH Initial (최초 작성)
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// 1) [JS] node:fs/promises : 파일 API 의 Promise 버전 (C# File.ReadAllTextAsync 와 비슷)
import { mkdtemp, writeFile, readFile, appendFile, readdir, stat, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

// 2) [JS] 새 임시 폴더에서 작업하므로, 이 예제는 기존 파일을 절대 건드리지 않음
const strDir = await mkdtemp(join(tmpdir(), "devcalc-"));
console.log("2) temp folder created : devcalc-XXXXXX");

try {
	// 3) [JS] 텍스트 쓰기와 읽기. 인코딩을 항상 지정할 것. 아니면 Buffer (바이트) 를 받음
	const strFile = join(strDir, "history.txt");
	await writeFile(strFile, "0xFF + 1 = 256\n", "utf8");
	await appendFile(strFile, "ans * 2 = 512\n", "utf8");
	const strText = await readFile(strFile, "utf8");
	console.log("3) read back :", JSON.stringify(strText));

	// 4) [JS + TS] JSON : stringify / parse. JSON 에는 bigint 가 없으므로 먼저 문자열로 바꿈
	interface ISaved {
		readonly strExpr: string;
		readonly strValue: string; // bigint 를 텍스트로
	}
	const arrSave: ISaved[] = [{ strExpr: "0xFF + 1", strValue: (0xffn + 1n).toString() }];
	await writeFile(join(strDir, "history.json"), JSON.stringify(arrSave, null, 2), "utf8");
	const arrLoad = JSON.parse(await readFile(join(strDir, "history.json"), "utf8")) as ISaved[];
	console.log("4) JSON round trip :", arrLoad[0]?.strExpr, "=", BigInt(arrLoad[0]?.strValue ?? "0"));
	try {
		JSON.stringify({ biValue: 1n });
	} catch (e) {
		console.log("   Expected error:", (e as Error).message);
		console.log("   Why : JSON has no bigint type.");
		console.log("   Fix : save biValue.toString() and read it back with BigInt(text).");
	}

	// 5) [JS] 폴더 목록과 파일 크기 읽기
	const arrName = (await readdir(strDir)).sort();
	for (const strName of arrName) {
		const oStat = await stat(join(strDir, strName));
		console.log(`5) ${strName.padEnd(13)} ${oStat.size} bytes`);
	}

	// 6) [JS + TS] 없는 파일 : 에러에 code 가 있음. 그것을 확인해 "없음" 만 처리
	try {
		await readFile(join(strDir, "missing.txt"), "utf8");
	} catch (e) {
		const strCode = (e as NodeJS.ErrnoException).code;
		if (strCode !== "ENOENT") {
			throw e; // 다른 문제 (권한, 디스크) : 여기서 숨길 일이 아님
		}
		console.log("6) Expected error:", strCode);
		console.log("   Why : the file does not exist (ENOENT = Error NO ENTry).");
		console.log("   Fix : treat it as empty on the first run, e.g. start with an empty history.");
	}
} finally {
	// 7) [JS] finally 에서 정리하므로, 에러가 나도 폴더가 지워짐
	await rm(strDir, { recursive: true, force: true });
	console.log("7) temp folder removed");
}
