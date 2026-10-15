//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 09-testing-tooling / naming (직접 만들기 : 이름 규칙 검사기)
//	History			: 2026-10-15 CYBERKDH Initial (최초 작성)
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// 직접 만들기 : 이름 규칙 검사기 (naming-rule checker), 테스트 먼저 작성.
// 전체 버전 (주석, 문자열, 메서드, getter, 폴더) 은 tools/check-names.ts

import { describe, test } from "node:test";
import assert from "node:assert/strict";

// 1) [TS] 문제 하나를 나타내는 타입
interface INameIssue {
	nLine: number;
	strName: string;
	strRule: string;
}

// 2) [TS] 규칙 하나 = 선언을 찾는 패턴 + 이름이 맞아야 하는 패턴
interface INameRule {
	reFind: RegExp; // 그룹 1 이 이름
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

// 3) [JS + TS] 검사기 : 모든 줄, 모든 규칙. 주석 줄은 건너뜀
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

// 4) 테스트 : 규칙마다 하나, 규칙보다 먼저 작성 (빨강 → 초록)
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

// 5) 사용 : 코드 조각을 검사하고 찾은 것을 출력 (테스트 보고서보다 먼저)
const SAMPLE = `class Calculator {}
type TRadixName = "hex" | "dec";
function ParseNumber(strText: string) {}
const value = 1;`;
for (const oIssue of CheckNames(SAMPLE)) {
	console.log(`5) line ${oIssue.nLine} ${oIssue.strName.padEnd(10)} : ${oIssue.strRule}`);
}
// 검사기는 파서 (parser) 가 아니라 정규식 : 코드처럼 보이는 문자열을 잘못 잡아냄
console.log("5) a string : Expected error: a false alarm", CheckNames('const strText = "class bad";').map((oIssue) => oIssue.strName));
console.log("   Why : the line is not parsed, so the word class inside the string is read as a declaration.");
console.log("   Fix : blank out strings and comments first (BlankNonCode in tools/check-names.ts)");
