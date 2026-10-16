//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: devcalc / tests / Evaluate
//	History			: 2026-10-15 CYBERKDH Initial - Lesson 05 DevCalc step
//					  2026-10-15 CYBERKDH Lesson 09: runs on Vitest (test from "vitest", node:assert kept)
//					  2026-10-15 CYBERKDH Lesson 10: whole expressions, overflow inside the expression
//					  2026-10-15 CYBERKDH Lesson 11: ** >>> ~, literals
//					  2026-10-15 CYBERKDH Lesson 13: functions, variables (strAssign)
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

import { test } from "vitest";
import assert from "node:assert/strict";
import { Evaluate, type TEvalResult } from "../src/core/Evaluate.ts";
import { CWordSize } from "../src/core/WordSize.ts";

// Returns the value of an Ok result, fails the test otherwise
function ValueOf(oResult: TEvalResult): bigint {
	assert.ok(oResult.bOk, oResult.bOk ? "" : oResult.vError.strTitle);
	return oResult.vValue.biValue;
}

// Returns the title of an Err result, fails the test otherwise
function ErrorOf(oResult: TEvalResult): string {
	assert.ok(!oResult.bOk, "expected an error");
	return oResult.vError.strTitle;
}

test("Evaluate: one number and two-number expressions", () => {
	assert.equal(ValueOf(Evaluate("0xFF")), 255n);
	assert.equal(ValueOf(Evaluate("  0xFF & 0x0F  ")), 0x0fn);
	assert.equal(ValueOf(Evaluate("1_000 * 3")), 3000n);
});

test("Evaluate: word size wraps and reports overflow", () => {
	const oByte = new CWordSize(8);
	const oResult = Evaluate("0xFF + 1", oByte);
	assert.ok(oResult.bOk);
	assert.equal(oResult.vValue.biValue, 0n);
	assert.equal(oResult.vValue.biExact, 256n);
	assert.equal(oResult.vValue.bOverflow, true);

	const oSingle = Evaluate("-1", oByte);
	assert.ok(oSingle.bOk);
	assert.equal(oSingle.vValue.biValue, 255n);
	assert.equal(oSingle.vValue.bOverflow, false); // -1 fits as signed
});

test("Evaluate: ans is the previous result", () => {
	assert.equal(ValueOf(Evaluate("ans * 2", undefined, 21n)), 42n);
	assert.equal(ValueOf(Evaluate("ANS", undefined, 7n)), 7n);
	assert.equal(ValueOf(Evaluate("ans - ans", undefined, 7n)), 0n);
	assert.equal(ErrorOf(Evaluate("ans + 1")), 'Invalid input: "ans"');
});

test("Evaluate: errors are returned, not thrown", () => {
	assert.equal(ErrorOf(Evaluate("12a")), 'Invalid input: "12a"');
	assert.equal(ErrorOf(Evaluate("1 <> 2")), 'Invalid operator: "<>"');
	assert.equal(ErrorOf(Evaluate("1 +")), 'Invalid expression: "1 +"');
	assert.equal(ErrorOf(Evaluate("(1 + 2")), 'Invalid expression: "(1 + 2"');
	assert.equal(ErrorOf(Evaluate("1 $ 2")), 'Invalid character: "$"');
	assert.equal(ErrorOf(Evaluate("(1 + 1) / (1 - 1)")), 'Cannot calculate: "(1 + 1) / (1 - 1)"');
	assert.equal(ErrorOf(Evaluate("10 / 0")), 'Cannot calculate: "10 / 0"');
});

test("Evaluate: whole expressions (lesson 10)", () => {
	assert.equal(ValueOf(Evaluate("1 + 2 + 3")), 6n);
	assert.equal(ValueOf(Evaluate("1 + 2 * 3")), 7n);
	assert.equal(ValueOf(Evaluate("(0xFF + 1) << 4")), 0x1000n);
	assert.equal(ValueOf(Evaluate("-ans * 2", undefined, 21n)), -42n);
	assert.equal(ValueOf(Evaluate("0xFF&0x0F")), 0x0fn); // spaces are no longer needed
});

test("Evaluate: the first value that did not fit is reported (lesson 10)", () => {
	const oResult = Evaluate("(0xFF + 1) | 0", new CWordSize(8));
	assert.ok(oResult.bOk);
	assert.equal(oResult.vValue.biValue, 0n);
	assert.equal(oResult.vValue.biExact, 256n); // from 0xFF + 1, not from the last step
	assert.equal(oResult.vValue.bOverflow, true);
});

test("Evaluate: programmer input and operators (lesson 11)", () => {
	assert.equal(ValueOf(Evaluate("1Fh + 1'000 + 4K")), 0x1fn + 1000n + 4096n);
	assert.equal(ValueOf(Evaluate("'A' + 1")), 0x42n);
	assert.equal(ValueOf(Evaluate("2 ** 3 ** 2")), 512n);
	assert.equal(ValueOf(Evaluate("~0")), -1n);
	assert.equal(ValueOf(Evaluate("~0", new CWordSize(16))), 0xffffn);
	assert.equal(ValueOf(Evaluate("~0 >>> 4", new CWordSize(8))), 0x0fn);
	assert.equal(ValueOf(Evaluate("~0 >> 4", new CWordSize(8))), 0xffn);
	assert.equal(ErrorOf(Evaluate("-2 ** 2")), 'Invalid expression: "-2 ** 2"');
	assert.equal(ErrorOf(Evaluate("2 ** -1")), 'Cannot calculate: "2 ** -1"');
	assert.equal(ErrorOf(Evaluate("'AB")), `Invalid input: "'AB"`);
});

test("Evaluate: ~ never reports an overflow (lesson 11)", () => {
	const oResult = Evaluate("~0xFF", new CWordSize(8));
	assert.ok(oResult.bOk);
	assert.equal(oResult.vValue.biValue, 0n);
	assert.equal(oResult.vValue.bOverflow, false); // ~ stays in the word : no "-256 does not fit"
});

test("Evaluate: functions and variables (lesson 13)", () => {
	const mapVar = new Map([["mask", 0xff00n]]);
	assert.equal(ValueOf(Evaluate("0x1234 & mask", undefined, undefined, mapVar)), 0x1200n);
	assert.equal(ValueOf(Evaluate("MASK >> 8", undefined, undefined, mapVar)), 0xffn); // names ignore case
	assert.equal(ValueOf(Evaluate("popcount(mask) + clz(1)", new CWordSize(16), undefined, mapVar)), 8n + 15n);
	assert.equal(ErrorOf(Evaluate("x + 1", undefined, undefined, mapVar)), 'Invalid input: "x"');
	assert.equal(ErrorOf(Evaluate("rol(1, 1)")), 'Cannot calculate: "rol(1, 1)"'); // needs a word size

	// Evaluate only reads the map : the assignment comes back, and the caller keeps it
	const oResult = Evaluate("x = mask | 1", undefined, undefined, mapVar);
	assert.ok(oResult.bOk);
	assert.equal(oResult.vValue.strAssign, "x");
	assert.equal(oResult.vValue.biValue, 0xff01n);
	assert.equal(mapVar.has("x"), false);
	const oPlain = Evaluate("1 + 1");
	assert.ok(oPlain.bOk);
	assert.equal(oPlain.vValue.strAssign, undefined); // no assignment, no property
});

test("Evaluate: a function result that does not fit is an overflow", () => {
	const oResult = Evaluate("align(250, 16)", new CWordSize(8));
	assert.ok(oResult.bOk);
	assert.equal(oResult.vValue.biValue, 0n);
	assert.equal(oResult.vValue.biExact, 256n);
	assert.equal(oResult.vValue.bOverflow, true);
});
