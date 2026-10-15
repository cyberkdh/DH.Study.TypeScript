//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 06-modules-async / files
//	History			: 2026-10-15 CYBERKDH Initial
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// 1) [JS] node:fs/promises : the Promise version of the file API (like C# File.ReadAllTextAsync)
import { mkdtemp, writeFile, readFile, appendFile, readdir, stat, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

// 2) [JS] Work in a new temporary folder, so this example never touches your files
const strDir = await mkdtemp(join(tmpdir(), "devcalc-"));
console.log("2) temp folder created : devcalc-XXXXXX");

try {
	// 3) [JS] Write and read text. Always give the encoding, or you get a Buffer (bytes)
	const strFile = join(strDir, "history.txt");
	await writeFile(strFile, "0xFF + 1 = 256\n", "utf8");
	await appendFile(strFile, "ans * 2 = 512\n", "utf8");
	const strText = await readFile(strFile, "utf8");
	console.log("3) read back :", JSON.stringify(strText));

	// 4) [JS + TS] JSON : stringify / parse. JSON has no bigint, so convert to a string first
	interface ISaved {
		readonly strExpr: string;
		readonly strValue: string; // bigint as text
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

	// 5) [JS] List a folder and read file sizes
	const arrName = (await readdir(strDir)).sort();
	for (const strName of arrName) {
		const oStat = await stat(join(strDir, strName));
		console.log(`5) ${strName.padEnd(13)} ${oStat.size} bytes`);
	}

	// 6) [JS + TS] A missing file : the error has a code. Check it to handle "not found" only
	try {
		await readFile(join(strDir, "missing.txt"), "utf8");
	} catch (e) {
		const strCode = (e as NodeJS.ErrnoException).code;
		if (strCode !== "ENOENT") {
			throw e; // something else (permissions, disk) : not ours to hide
		}
		console.log("6) Expected error:", strCode);
		console.log("   Why : the file does not exist (ENOENT = Error NO ENTry).");
		console.log("   Fix : treat it as empty on the first run, e.g. start with an empty history.");
	}
} finally {
	// 7) [JS] Clean up in finally, so the folder is removed even after an error
	await rm(strDir, { recursive: true, force: true });
	console.log("7) temp folder removed");
}
