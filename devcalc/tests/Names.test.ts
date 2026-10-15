//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: devcalc / tests / Names (tools/check-names.ts, written with Vitest's expect)
//	History			: 2026-10-15 CYBERKDH Initial - Lesson 09 DevCalc step
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

import { describe, expect, test } from "vitest";
import { BlankNonCode, CheckSource } from "../../tools/check-names.ts";

// Only the names, to keep the expectations short
function Names(strSource: string): string[] {
	return CheckSource(strSource).map((oIssue) => oIssue.strName);
}

describe("check-names", () => {
	test("good names pass", () => {
		const strSource = [
			"class CCalculator {",
			"\tget nCount(): number { return 0; }",
			"\tEvaluate(strExpr: string): bigint {",
			"\t\treturn 0n;",
			"\t}",
			"}",
			"interface IResult { bOk: boolean }",
			'type ERadix = "hex" | "dec";',
			"type TResult = IResult | undefined;",
			"function ParseNumber(): void {}",
			"const MAX_BITS = 64;",
			"let m_nValue = 0;",
			"const ToHex = (biValue: bigint) => biValue.toString(16);",
			"const oTable = { a: 1 } as const;",
		].join("\n");
		expect(CheckSource(strSource)).toEqual([]);
	});

	test("each rule finds its bad name", () => {
		expect(Names("class Calculator {}")).toEqual(["Calculator"]);
		expect(Names("interface Result {}")).toEqual(["Result"]);
		expect(Names('type Radix = "hex" | "dec";')).toEqual(["Radix"]);
		expect(Names('type TRadix = "hex" | "dec";')).toEqual(["TRadix"]); // a string union is E, not T
		expect(Names("type Box = { n: number };")).toEqual(["Box"]);
		expect(Names("function parse_number() {}")).toEqual(["parse_number"]);
		expect(Names("class CBox {\n\tadd(nA: number): number {\n\t\treturn nA;\n\t}\n}")).toEqual(["add"]);
		expect(Names("class CBox {\n\tget count(): number { return 1; }\n}")).toEqual(["count"]);
		expect(Names("const total = 1;")).toEqual(["total"]);
		expect(Names("const o = {};")).toEqual(["o"]); // a prefix alone is not a name
	});

	test("an issue has the line and the rule", () => {
		expect(CheckSource("const nOk = 1;\nlet value = 2;")).toEqual([
			{ nLine: 2, strName: "value", strRule: expect.stringContaining("prefix") },
		]);
	});

	test("words inside comments, strings and regular expressions are not code", () => {
		expect(Names('// class bad\nconst strText = "class Bad";\nconst RE_WORD = /class X/;')).toEqual([]);
		expect(BlankNonCode('a = "xy"; // c')).toBe('a = "  "; ');
	});
});
