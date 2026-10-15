//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: devcalc / tests / Parser
//	History			: 2026-10-15 CYBERKDH Initial - Lesson 10 DevCalc step
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

import { describe, expect, test } from "vitest";
import { Lex } from "../src/core/Lexer.ts";
import { Parse, ToText } from "../src/core/Parser.ts";

// The tree as text (every binary node in parentheses), or the error's why
function Grouped(strExpr: string): string {
	const oTree = Parse(strExpr);
	return oTree.bOk ? ToText(oTree.vValue) : `error: ${oTree.vError.strWhy}`;
}

describe("Lex", () => {
	test("kinds, texts and columns", () => {
		const oTokens = Lex("(0xFF+ ans)<<4");
		expect(oTokens.bOk).toBe(true);
		if (!oTokens.bOk) {
			return;
		}
		expect(oTokens.vValue.map((oToken) => `${oToken.eKind}:${oToken.strText}@${oToken.nCol}`)).toEqual([
			"open:(@1",
			"number:0xFF@2",
			"operator:+@6",
			"ans:ans@8",
			"close:)@11",
			"operator:<<@12",
			"number:4@14",
			"end:@15",
		]);
	});

	test("errors : bad number, unknown name, unsupported operator, stray character", () => {
		const arrTitle = ["12a", "abc", "2 ** 3", "1 # 2"].map((strExpr) => {
			const oTokens = Lex(strExpr);
			return oTokens.bOk ? "ok" : oTokens.vError.strTitle;
		});
		expect(arrTitle).toEqual(['Invalid input: "12a"', 'Invalid input: "abc"', 'Invalid operator: "**"', 'Invalid character: "#"']);
	});
});

describe("Parse", () => {
	test("precedence follows C / JavaScript", () => {
		expect(Grouped("1 + 2 * 3")).toBe("(1 + (2 * 3))");
		expect(Grouped("1 << 2 + 3")).toBe("(1 << (2 + 3))");
		expect(Grouped("1 | 2 ^ 3 & 4")).toBe("(1 | (2 ^ (3 & 4)))");
	});

	test("left to right for the same precedence", () => {
		expect(Grouped("8 - 4 - 2")).toBe("((8 - 4) - 2)");
		expect(Grouped("64 / 4 / 2")).toBe("((64 / 4) / 2)");
	});

	test("parentheses and unary minus", () => {
		expect(Grouped("(1 + 2) * 3")).toBe("((1 + 2) * 3)");
		expect(Grouped("-(1 + 2) * -ans")).toBe("(-(1 + 2) * -ans)");
		expect(Grouped("--1")).toBe("--1");
	});

	test("errors say where", () => {
		expect(Grouped("1 +")).toBe('error: expected a number, ans or "(", found the end');
		expect(Grouped("(1 + 2")).toBe('error: expected ")" for the "(" at column 1, found the end');
		expect(Grouped("1 2")).toBe('error: expected an operator or the end, found "2" at column 3');
		expect(Grouped(")")).toBe('error: expected a number, ans or "(", found ")" at column 1');
	});

	test("deep nesting is an error, not a stack overflow", () => {
		expect(Grouped("(".repeat(100) + "1" + ")".repeat(100))).toBe("1");
		expect(Grouped("(".repeat(101) + "1" + ")".repeat(101))).toBe('error: more than 100 levels of "(" or "-"');
		expect(Grouped("-".repeat(5000) + "1")).toBe('error: more than 100 levels of "(" or "-"');
	});
});
