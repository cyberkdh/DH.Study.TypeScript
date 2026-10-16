//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: devcalc / tests / Parser
//	History			: 2026-10-15 CYBERKDH Initial - Lesson 10 DevCalc step
//					  2026-10-15 CYBERKDH Lesson 11: ~, **, characters
//					  2026-10-15 CYBERKDH Lesson 13: names, commas, calls, assignment
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

import { describe, expect, test } from "vitest";
import { Lex, SplitExpressions } from "../src/core/Lexer.ts";
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
			"name:ans@8",
			"close:)@11",
			"operator:<<@12",
			"number:4@14",
			"end:@15",
		]);
	});

	test("errors : bad number, unsupported operator, stray character (lesson 13 : every name is a token)", () => {
		const arrTitle = ["12a", "abc", "2 <> 3", "1 # 2"].map((strExpr) => {
			const oTokens = Lex(strExpr);
			return oTokens.bOk ? "ok" : oTokens.vError.strTitle;
		});
		expect(arrTitle).toEqual(['Invalid input: "12a"', "ok", 'Invalid operator: "<>"', 'Invalid character: "#"']);
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
		expect(Grouped("1 +")).toBe('error: expected a number, a name or "(", found the end');
		expect(Grouped("(1 + 2")).toBe('error: expected ")" for the "(" at column 1, found the end');
		expect(Grouped("1 2")).toBe('error: expected an operator or the end, found "2" at column 3');
		expect(Grouped(")")).toBe('error: expected a number, a name or "(", found ")" at column 1');
	});

	test("deep nesting is an error, not a stack overflow", () => {
		expect(Grouped("(".repeat(100) + "1" + ")".repeat(100))).toBe("1");
		expect(Grouped("(".repeat(101) + "1" + ")".repeat(101))).toBe('error: more than 100 levels of "(", "-", "~", "**" or calls');
		expect(Grouped("-".repeat(5000) + "1")).toBe('error: more than 100 levels of "(", "-", "~", "**" or calls');
		expect(Grouped("2 ** ".repeat(5000) + "1")).toBe('error: more than 100 levels of "(", "-", "~", "**" or calls'); // lesson 11 : right-associative
	});
});

describe("lesson 11", () => {
	test("new tokens : ** >>> ~ and literals", () => {
		const oTokens = Lex("~'A'**2>>>1Fh");
		expect(oTokens.bOk && oTokens.vValue.map((oToken) => `${oToken.eKind}:${oToken.strText}`)).toEqual([
			"operator:~",
			"number:'A'",
			"operator:**",
			"number:2",
			"operator:>>>",
			"number:1Fh",
			"end:",
		]);
	});

	test("** binds tightest and groups to the right", () => {
		expect(Grouped("2 ** 3 ** 2")).toBe("(2 ** (3 ** 2))");
		expect(Grouped("2 * 3 ** 2")).toBe("(2 * (3 ** 2))");
		expect(Grouped("(-2) ** 2")).toBe("(-2 ** 2)");
		expect(Grouped("2 ** -1")).toBe("(2 ** -1)");
		expect(Grouped("~0 >>> 4")).toBe("(~0 >>> 4)");
	});

	test("a unary operator right before ** is an error, as in JavaScript", () => {
		expect(Grouped("-2 ** 2")).toBe('error: "-x ** y" is ambiguous ("**" at column 4) : write (-x) ** y or -(x ** y)');
		expect(Grouped("~2 ** 2")).toMatch(/^error: "~x \*\* y" is ambiguous/);
		expect(Grouped("-2 * 3")).toBe("(-2 * 3)"); // only ** is ambiguous
	});

	test("SplitExpressions : ; outside character literals only", () => {
		expect(SplitExpressions("1; ans + 1 ;; 2")).toEqual(["1", "ans + 1", "2"]);
		expect(SplitExpressions("';' + 1; 'a;b'")).toEqual(["';' + 1", "'a;b'"]);
		expect(SplitExpressions("'\\\\'; 2")).toEqual(["'\\\\'", "2"]); // '\\' : an escaped backslash, then the closing '
		expect(SplitExpressions("'\\''; 2")).toEqual(["'\\''", "2"]); // '\'' : an escaped quote
		expect(SplitExpressions(" ; ")).toEqual([" ; "]);
	});
});

// Lesson 13: function calls, variables and assignment
describe("Parse calls and names", () => {
	test("calls take expressions as arguments, and names ignore case", () => {
		expect(Grouped("popcount(0xFF) + 1")).toBe("(popcount(255) + 1)");
		expect(Grouped("ROL(x, 1 + 2)")).toBe("rol(x, (1 + 2))");
		expect(Grouped("max(1, min(2, 3), -4)")).toBe("max(1, min(2, 3), -4)");
		expect(Grouped("Mask = 0xFF << 8")).toBe("mask = (255 << 8)");
		expect(Grouped("ANS + 1")).toBe("(ANS + 1)");
	});

	test("mistakes with names say what to do", () => {
		expect(Grouped("rol(1)")).toBe("error: rol(x, n) takes 2 arguments, found 1 (column 1)");
		expect(Grouped("abs()")).toBe("error: abs(x) takes 1 argument, found 0 (column 1)");
		expect(Grouped("min(1)")).toBe("error: min(a, b, ...) takes 2 or more arguments, found 1 (column 1)");
		expect(Grouped("1 + popcount")).toBe('error: "popcount" at column 5 is a function');
		expect(Grouped("toString(1)")).toBe('error: "toString" at column 1 is not a function'); // an own key only, not Object.prototype
		expect(Grouped("abs(1 2)")).toBe('error: expected "," or ")" for the "abs(" at column 1, found "2" at column 7');
		expect(Grouped("ans = 1")).toBe('error: cannot assign to "ans" : ans is the previous result');
		expect(Grouped("bit = 1")).toBe('error: cannot assign to "bit" : bit is a function');
		expect(Grouped("1 + x = 2")).toBe('error: "=" at column 7 can only follow a name at the start');
	});
});
