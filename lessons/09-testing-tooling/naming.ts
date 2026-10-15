//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 09-testing-tooling / naming
//	History			: 2026-10-15 CYBERKDH Initial
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// Build it : a naming-rule checker, written test-first.
// The full version (comments, strings, methods, getters, folders) is tools/check-names.ts

import { describe, test } from "node:test";
import assert from "node:assert/strict";

// 1) [TS] What a problem looks like
interface INameIssue {
	nLine: number;
	strName: string;
	strRule: string;
}

// 2) [TS] One rule = a pattern that finds a declaration + a pattern the name must match
interface INameRule {
	reFind: RegExp; // group 1 is the name
	reGood: RegExp;
	strRule: string;
}

const RULES: readonly INameRule[] = [
	{ reFind: /\bclass\s+(\w+)/, reGood: /^C[A-Z]/, strRule: "class starts with C" },
	{ reFind: /\binterface\s+(\w+)/, reGood: /^I[A-Z]/, strRule: "interface starts with I" },
	{ reFind: /\btype\s+(\w+)\s*=\s*"/, reGood: /^E[A-Z]/, strRule: "string union starts with E" },
	{ reFind: /\btype\s+(\w+)\s*=\s*[^"\s]/, reGood: /^T[A-Z]/, strRule: "type alias starts with T" },
	{ reFind: /\bfunction\s+(\w+)/, reGood: /^[A-Z][A-Za-z0-9]*$/, strRule: "function is PascalCase" },
	{ reFind: /(?<!\bas\s+)\b(?:const|let)\s+(\w+)/, reGood: /^(?:[A-Z][A-Z0-9_]*|(?:n|bi|str|b|arr|map|set|re|fn|el|o|v|e)[A-Z0-9].*)$/, strRule: "variable has a prefix or is UPPER_CASE" },
];

// 3) [JS + TS] The checker : every line, every rule. A comment line is skipped
function CheckNames(strSource: string): INameIssue[] {
	const arrIssue: INameIssue[] = [];
	strSource.split("\n").forEach((strLine, nIdx) => {
		if (strLine.trimStart().startsWith("//")) {
			return;
		}
		for (const oRule of RULES) {
			const strName = oRule.reFind.exec(strLine)?.[1];
			if (strName !== undefined && !oRule.reGood.test(strName)) {
				arrIssue.push({ nLine: nIdx + 1, strName, strRule: oRule.strRule });
			}
		}
	});
	return arrIssue;
}

// 4) Tests : one per rule, written before the rule (red → green)
describe("CheckNames", () => {
	test("good names : no problems", () => {
		const strGood = 'class CCalc {}\ninterface IResult {}\ntype ERadix = "hex" | "dec";\ntype TPair = [number, number];\nfunction ToHex() {}\nconst MAX_BITS = 64;\nlet strName = "";\nconst oTable = {} as const;';
		assert.deepEqual(CheckNames(strGood), []);
	});
	test("each rule finds its bad name", () => {
		const arrBad = ["class Calc {}", "interface Result {}", 'type Radix = "hex";', "type Pair = [number];", "function to_hex() {}", "let total = 0;"];
		const arrFound = arrBad.map((strLine) => CheckNames(strLine).map((oIssue) => oIssue.strName));
		assert.deepEqual(arrFound, [["Calc"], ["Result"], ["Radix"], ["Pair"], ["to_hex"], ["total"]]);
	});
	test("line numbers start at 1, comments are skipped", () => {
		assert.deepEqual(CheckNames("// let bad = 1;\nconst nOk = 1;\nconst x = 2;"), [{ nLine: 3, strName: "x", strRule: "variable has a prefix or is UPPER_CASE" }]);
	});
});

// 5) Use it : check a piece of code and print what it finds (before the test report)
const SAMPLE = `class Calculator {}
type TRadixName = "hex" | "dec";
function ParseNumber(strText: string) {}
const value = 1;`;
for (const oIssue of CheckNames(SAMPLE)) {
	console.log(`5) line ${oIssue.nLine} ${oIssue.strName.padEnd(10)} : ${oIssue.strRule}`);
}
// The checker is a regex, not a parser : it is fooled by a string that looks like code
console.log("5) a string : Expected error: a false alarm", CheckNames('const strText = "class bad";').map((oIssue) => oIssue.strName));
console.log("   Why : the line is not parsed, so the word class inside the string is read as a declaration.");
console.log("   Fix : blank out strings and comments first (BlankNonCode in tools/check-names.ts)");
