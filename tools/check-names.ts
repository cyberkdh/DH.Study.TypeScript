//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: tools / check-names (Check this project's naming rules)
//	History			: 2026-10-15 CYBERKDH Initial - Lesson 09
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// Usage : node tools/check-names.ts [folder or .ts file ...]   (also runs as part of npm test)
//   With no argument, it checks devcalc and tools.
//   ESLint's TypeScript plugin does not support TypeScript 7 yet, so this small checker
//   covers the rules that matter here. It reads each line with regular expressions:
//   it is not a parser, so it skips names in destructuring and parameters.
//
//   class C..., interface I..., type E... (a union of string literals) or T... (other)
//   function / method : PascalCase (constructor is allowed)
//   const / let / var, getter : UPPER_CASE (MAX_BITS), a prefix + an upper-case letter (strName,
//                               m_nValue), or PascalCase for a function in a const (ToHex)
//   (prefixes : the naming table in the root README; e = a value of an E type)

import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

export interface INameIssue {
	nLine: number;
	strName: string;
	strRule: string;
}

export const VARIABLE_PREFIXES = ["n", "bi", "str", "b", "arr", "map", "set", "re", "fn", "el", "o", "v", "e"] as const;

// m_ (member) and g_ (global) may come first : m_nValue, g_oApp
const RE_PREFIXED = new RegExp(`^(?:[mg]_)?(?:${VARIABLE_PREFIXES.join("|")})[A-Z0-9]`);
const RE_UPPER_CASE = /^[A-Z][A-Z0-9_]*$/;
const RE_PASCAL_CASE = /^[A-Z][A-Za-z0-9]*$/;
const RE_STRING_UNION = /^\s*(?:\|\s*)?"[^"]*"(?:\s*\|\s*"[^"]*")*\s*;?\s*$/;
const NOT_METHODS = new Set(["if", "for", "while", "switch", "catch", "function", "return", "constructor", "super"]);

// Blank out comments, and the contents of strings, template literals and regular expressions,
// so that a word inside them is never read as a declaration. Line breaks are kept.
export function BlankNonCode(strSource: string): string {
	let strOut = "";
	let nIdx = 0;
	let strQuote = "";
	let strLastCode = "";
	while (nIdx < strSource.length) {
		const strChar = strSource[nIdx]!;
		if (strQuote !== "") {
			if (strChar === "\\") {
				strOut += "  ";
				nIdx += 2;
				continue;
			}
			if (strChar === strQuote) {
				strQuote = "";
				strOut += strChar;
			} else {
				strOut += strChar === "\n" ? "\n" : " ";
			}
			nIdx++;
			continue;
		}
		if (strSource.startsWith("//", nIdx)) {
			while (nIdx < strSource.length && strSource[nIdx] !== "\n") {
				nIdx++;
			}
			continue;
		}
		if (strSource.startsWith("/*", nIdx)) {
			const nEnd = strSource.indexOf("*/", nIdx + 2);
			const nStop = nEnd === -1 ? strSource.length : nEnd + 2;
			strOut += strSource.slice(nIdx, nStop).replace(/[^\n]/g, " ");
			nIdx = nStop;
			continue;
		}
		// A "/" after an operator or an opening bracket starts a regular expression
		const bRegex = strChar === "/" && (strLastCode === "" || "(,=:[!&|?{};".includes(strLastCode));
		if (strChar === '"' || strChar === "'" || strChar === "`" || bRegex) {
			strQuote = strChar;
		}
		strOut += strChar;
		if (strChar.trim() !== "") {
			strLastCode = strChar;
		}
		nIdx++;
	}
	return strOut;
}

// UPPER_CASE (a constant), a prefix (strName), or PascalCase (a function kept in a const : ToHex)
function IsVariableName(strName: string): boolean {
	return RE_UPPER_CASE.test(strName) || RE_PREFIXED.test(strName) || RE_PASCAL_CASE.test(strName);
}

export function CheckSource(strSource: string): INameIssue[] {
	const arrIssue: INameIssue[] = [];
	const arrCode = BlankNonCode(strSource).split("\n");
	const arrRaw = strSource.split("\n");
	arrCode.forEach((strLine, nIdx) => {
		const nLine = nIdx + 1;
		const fnAdd = (strName: string, strRule: string): void => {
			arrIssue.push({ nLine, strName, strRule });
		};
		for (const oMatch of strLine.matchAll(/\bclass\s+([A-Za-z_$][\w$]*)/g)) {
			if (!/^C[A-Z]/.test(oMatch[1]!)) {
				fnAdd(oMatch[1]!, "class name starts with C (CCalculator)");
			}
		}
		for (const oMatch of strLine.matchAll(/\binterface\s+([A-Za-z_$][\w$]*)/g)) {
			if (!/^I[A-Z]/.test(oMatch[1]!)) {
				fnAdd(oMatch[1]!, "interface name starts with I (IResult)");
			}
		}
		const oType = /^\s*(?:export\s+)?type\s+([A-Za-z_$][\w$]*)\s*(?:<[^=]*>)?\s*=(.*)$/.exec(strLine);
		if (oType !== null) {
			const strName = oType[1]!;
			// The raw line still has the string literals
			const strRight = arrRaw[nIdx]!.slice(arrRaw[nIdx]!.indexOf("=") + 1).replace(/\/\/.*$/, "");
			if (RE_STRING_UNION.test(strRight) && strRight.includes("|")) {
				if (!/^E[A-Z]/.test(strName)) {
					fnAdd(strName, "a union of string literals starts with E (ERadix)");
				}
			} else if (!/^[ET][A-Z]/.test(strName)) {
				fnAdd(strName, "type alias starts with T (TResult) or E (string union)");
			}
		}
		for (const oMatch of strLine.matchAll(/\bfunction\s*\*?\s*([A-Za-z_$][\w$]*)/g)) {
			if (!RE_PASCAL_CASE.test(oMatch[1]!)) {
				fnAdd(oMatch[1]!, "function name is PascalCase (ParseNumber)");
			}
		}
		// A method : "  [static] [async] [get|set] [#]name(...) ... {" at the start of an indented line.
		// A getter or setter is used like a property, so it is named like a variable (nCount)
		const oMethod = /^\s+(?:(?:public|private|protected|static|async|override|readonly)\s+)*(?:(get|set)\s+)?#?([A-Za-z_$][\w$]*)\s*(?:<[^>]*>)?\s*\(.*\)\s*(?::.*)?\{.*$/.exec(strLine);
		if (oMethod !== null && !NOT_METHODS.has(oMethod[2]!)) {
			const strName = oMethod[2]!;
			if (oMethod[1] !== undefined) {
				if (!IsVariableName(strName)) {
					fnAdd(strName, "getter / setter has a type prefix (nCount)");
				}
			} else if (!RE_PASCAL_CASE.test(strName)) {
				fnAdd(strName, "method name is PascalCase (Evaluate)");
			}
		}
		// "as const" is not a declaration
		for (const oMatch of strLine.matchAll(/(?<!\bas\s+)\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)/g)) {
			if (!IsVariableName(oMatch[1]!)) {
				fnAdd(oMatch[1]!, "variable has a type prefix (strName, nIdx) or is UPPER_CASE");
			}
		}
	});
	return arrIssue;
}

function FindTsFiles(strDir: string): string[] {
	if (strDir.endsWith(".ts")) {
		return [strDir];
	}
	const arrFile: string[] = [];
	for (const oEntry of readdirSync(strDir, { withFileTypes: true })) {
		const strPath = join(strDir, oEntry.name);
		if (oEntry.isDirectory()) {
			if (oEntry.name !== "node_modules" && !oEntry.name.startsWith(".")) {
				arrFile.push(...FindTsFiles(strPath));
			}
		} else if (oEntry.name.endsWith(".ts")) {
			arrFile.push(strPath);
		}
	}
	return arrFile;
}

export function CheckFolders(arrFolder: readonly string[]): number {
	let nFile = 0;
	let nIssue = 0;
	for (const strFolder of arrFolder) {
		for (const strPath of FindTsFiles(strFolder)) {
			nFile++;
			for (const oIssue of CheckSource(readFileSync(strPath, "utf8"))) {
				console.log(`FAIL ${relative(process.cwd(), strPath)}:${oIssue.nLine} ${oIssue.strName} : ${oIssue.strRule}`);
				nIssue++;
			}
		}
	}
	console.log(`check-names : ${nFile} files, ${nIssue} problems`);
	return nIssue;
}

if (import.meta.main) {
	const ROOT_DIR = join(import.meta.dirname, "..");
	const arrArg = process.argv.slice(2);
	const arrFolder = arrArg.length > 0 ? arrArg : [join(ROOT_DIR, "devcalc"), join(ROOT_DIR, "tools")];
	if (CheckFolders(arrFolder) > 0) {
		process.exitCode = 1;
	}
}
