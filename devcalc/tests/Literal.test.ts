//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: devcalc / tests / Literal
//	History			: 2026-10-15 CYBERKDH Initial - Lesson 11 DevCalc step
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

import { describe, expect, test } from "vitest";
import { ParseChar, ParseLiteral } from "../src/core/Literal.ts";
import type { TParseResult } from "../src/core/Parse.ts";

// The value, or "error: why" : one string to compare
function Show(oResult: TParseResult): string {
	return oResult.bOk ? `0x${oResult.biValue.toString(16)}` : `error: ${oResult.strError}`;
}

describe("ParseLiteral", () => {
	test("lesson 03 forms still work", () => {
		expect(["255", "0xFF", "0b1111_1111", "0o377"].map((strText) => Show(ParseLiteral(strText)))).toEqual(["0xff", "0xff", "0xff", "0xff"]);
	});

	test("' separates digits like _", () => {
		expect(Show(ParseLiteral("1'000'000"))).toBe("0xf4240");
		expect(Show(ParseLiteral("0xFFFF'FFFF"))).toBe("0xffffffff");
		expect(Show(ParseLiteral("1''0"))).toBe("error: separators (_ or ') must sit between digits");
		expect(Show(ParseLiteral("1'"))).toBe("error: separators (_ or ') must sit between digits");
		expect(Show(ParseLiteral("0x'FF"))).toBe("error: separators (_ or ') must sit between digits");
	});

	test("h suffix : hex", () => {
		expect(Show(ParseLiteral("1Fh"))).toBe("0x1f");
		expect(Show(ParseLiteral("0ffh"))).toBe("0xff");
		expect(Show(ParseLiteral("0FFFF'0000h"))).toBe("0xffff0000");
		expect(Show(ParseLiteral("1Gh"))).toBe('error: "g" is not a valid decimal digit'); // not hex : read as a plain number
	});

	test("K M G T : sizes in 1024s", () => {
		expect(Show(ParseLiteral("4K"))).toBe("0x1000");
		expect(Show(ParseLiteral("1m"))).toBe("0x100000");
		expect(Show(ParseLiteral("2G"))).toBe("0x80000000");
		expect(Show(ParseLiteral("1T"))).toBe("0x10000000000");
		expect(Show(ParseLiteral("0x1K"))).toBe('error: "k" is not a valid hex digit'); // decimal digits only
		expect(Show(ParseLiteral("4X"))).toBe('error: "x" is not a valid decimal digit');
	});
});

describe("ParseChar", () => {
	test("one character is its code point", () => {
		expect(Show(ParseChar("A"))).toBe("0x41");
		expect(Show(ParseChar("한"))).toBe("0xd55c");
		expect(Show(ParseChar("😀"))).toBe("0x1f600"); // one code point, two UTF-16 units
	});

	test("several characters are bytes, the first one highest", () => {
		expect(Show(ParseChar("AB"))).toBe("0x4142");
		expect(Show(ParseChar("ABCDEFGH"))).toBe("0x4142434445464748");
		expect(Show(ParseChar("ABCDEFGHI"))).toBe("error: more than 8 characters (64 bits)");
		expect(Show(ParseChar("A한"))).toBe("error: several characters must each be one byte (0 to 0xFF)");
	});

	test("escapes", () => {
		expect(Show(ParseChar("\\n"))).toBe("0xa");
		expect(Show(ParseChar("\\x41\\0"))).toBe("0x4100");
		expect(Show(ParseChar("\\'"))).toBe("0x27");
		expect(Show(ParseChar("\\\\"))).toBe("0x5c");
		expect(Show(ParseChar("\\q"))).toBe(`error: unknown escape "\\q" (use \\n \\r \\t \\0 \\\\ \\' or \\xHH)`);
		expect(Show(ParseChar(""))).toBe("error: empty character literal");
	});
});
