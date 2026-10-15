//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: devcalc / tests / Parse
//	History			: 2026-10-15 CYBERKDH Initial - Lesson 03 DevCalc step
//					  2026-10-15 CYBERKDH Lesson 09: runs on Vitest (test from "vitest", node:assert kept)
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

import { test } from "vitest";
import assert from "node:assert/strict";
import { ParseInteger } from "../src/core/Parse.ts";

// assert.ok is an assertion function, so after it oResult is narrowed to the success member
function ParseOk(strInput: string): bigint {
	const oResult = ParseInteger(strInput);
	assert.ok(oResult.bOk, `expected success: "${strInput}"`);
	return oResult.biValue;
}

function ParseError(strInput: string): string {
	const oResult = ParseInteger(strInput);
	assert.ok(!oResult.bOk, `expected failure: "${strInput}"`);
	return oResult.strError;
}

test("Parse: decimal and sign", () => {
	assert.equal(ParseOk("255"), 255n);
	assert.equal(ParseOk("-255"), -255n);
	assert.equal(ParseOk("+42"), 42n);
	assert.equal(ParseOk("0"), 0n);
	assert.equal(ParseOk("-0"), 0n);
	assert.equal(ParseOk("18446744073709551615"), 18446744073709551615n);
});

test("Parse: prefixes and case", () => {
	assert.equal(ParseOk("0xFF"), 255n);
	assert.equal(ParseOk("0XAB"), 171n);
	assert.equal(ParseOk("-0xff"), -255n);
	assert.equal(ParseOk("0b1010"), 10n);
	assert.equal(ParseOk("0o17"), 15n);
	assert.equal(ParseOk("  0x10  "), 16n);
});

test("Parse: _ separators", () => {
	assert.equal(ParseOk("1_000"), 1000n);
	assert.equal(ParseOk("0xFFFF_FFFF"), 4294967295n);
	assert.equal(ParseOk("0b1111_0000"), 240n);
	assert.equal(ParseError("_1"), `"_" must sit between digits`);
	assert.equal(ParseError("1_"), `"_" must sit between digits`);
	assert.equal(ParseError("1__0"), `"_" must sit between digits`);
	assert.equal(ParseError("0x_FF"), `"_" must sit between digits`);
});

test("Parse: invalid input", () => {
	assert.equal(ParseError(""), "empty input");
	assert.equal(ParseError("   "), "empty input");
	assert.equal(ParseError("-"), "no digits after the sign or prefix");
	assert.equal(ParseError("0x"), "no digits after the sign or prefix");
	assert.equal(ParseError("12a"), `"a" is not a valid decimal digit`);
	assert.equal(ParseError("0b102"), `"2" is not a valid binary digit`);
	assert.equal(ParseError("0o8"), `"8" is not a valid octal digit`);
	assert.equal(ParseError("0xG"), `"g" is not a valid hex digit`);
	assert.equal(ParseError("1.5"), `"." is not a valid decimal digit`);
});
