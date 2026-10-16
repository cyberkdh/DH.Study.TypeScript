//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: devcalc / tests / Calculator (and WordSize)
//	History			: 2026-10-15 CYBERKDH Initial - Lesson 04 DevCalc step
//					  2026-10-15 CYBERKDH Lesson 08: operator table test
//					  2026-10-15 CYBERKDH Lesson 09: runs on Vitest (test from "vitest", node:assert kept)
//					  2026-10-15 CYBERKDH Lesson 11: ** >>> ~, >> keeps the sign with a word size
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

import { test } from "vitest";
import assert from "node:assert/strict";
import { CWordSize, IsWordBits } from "../src/core/WordSize.ts";
import { CCalcError, CCalculator, IsOperator, IsUnaryOperator, OperatorAssoc, OperatorHelp, OperatorList, OperatorName } from "../src/core/Calculator.ts";

test("WordSize: ranges and wrapping", () => {
	const oByte = new CWordSize(8);
	assert.equal(oByte.strName, "BYTE");
	assert.equal(oByte.biMaxUnsigned, 255n);
	assert.equal(oByte.biMinSigned, -128n);
	assert.equal(oByte.biMaxSigned, 127n);
	assert.equal(oByte.ToUnsigned(-1n), 255n);
	assert.equal(oByte.ToUnsigned(256n), 0n);
	assert.equal(oByte.ToSigned(0xffn), -1n);
	assert.equal(oByte.ToSigned(0x7fn), 127n);
	assert.equal(oByte.Fits(-128n), true);
	assert.equal(oByte.Fits(255n), true);
	assert.equal(oByte.Fits(256n), false);
	assert.equal(oByte.Fits(-129n), false);
	assert.equal(new CWordSize(64).biMaxUnsigned, 0xffff_ffff_ffff_ffffn);
	assert.equal(IsWordBits(16), true);
	assert.equal(IsWordBits(12), false);
});

test("Calculator: operators without a word size", () => {
	const oCalc = new CCalculator();
	assert.equal(oCalc.Calculate(0xffn, "&", 0x0fn).biValue, 0x0fn);
	assert.equal(oCalc.Calculate(0xf0n, "|", 0x0fn).biValue, 0xffn);
	assert.equal(oCalc.Calculate(0xffn, "^", 0x0fn).biValue, 0xf0n);
	assert.equal(oCalc.Calculate(1n, "<<", 70n).biValue, 1n << 70n);
	assert.equal(oCalc.Calculate(-8n, ">>", 1n).biValue, -4n);
	assert.equal(oCalc.Calculate(7n, "/", 2n).biValue, 3n);
	assert.equal(oCalc.Calculate(-7n, "%", 2n).biValue, -1n);
	assert.equal(oCalc.Calculate(2n, "-", 5n).bOverflow, false);
});

test("Calculator: word size wraps and reports overflow", () => {
	const oCalc = new CCalculator(new CWordSize(8));
	const oAdd = oCalc.Calculate(0xffn, "+", 1n);
	assert.deepEqual(oAdd, { biValue: 0n, biExact: 256n, bOverflow: true });
	assert.equal(oCalc.Calculate(-1n, ">>", 1n).biValue, 0xffn); // lesson 11 : >> keeps the sign (was 0x7F)
	assert.equal(oCalc.Calculate(2n, "-", 5n).biValue, 0xfdn);
	assert.equal(oCalc.Calculate(2n, "-", 5n).bOverflow, false); // -3 fits as signed
	assert.equal(oCalc.Calculate(0x80n, "*", 2n).bOverflow, true);
});

test("Calculator: errors", () => {
	const oCalc = new CCalculator(new CWordSize(16));
	assert.throws(() => oCalc.Calculate(1n, "/", 0n), CCalcError);
	assert.throws(() => oCalc.Calculate(1n, "%", 0n), { name: "CCalcError", message: "division by zero" });
	assert.throws(() => oCalc.Calculate(1n, "<<", 17n), { message: "shift count 17 is out of range" });
	assert.throws(() => new CCalculator().Calculate(1n, "<<", -1n), CCalcError);
	assert.equal(IsOperator("&"), true);
	assert.equal(IsOperator("**"), true); // lesson 11
	assert.equal(IsOperator("<>"), false);
});

test("Calculator: operator table", () => {
	assert.equal(OperatorList(), "+ - * / % ** & | ^ << >> >>>"); // lesson 11 : ** and >>>
	assert.equal(IsOperator("toString"), false); // Object.hasOwn : inherited keys are not operators
	assert.equal(OperatorName("^"), "xor");
	const oCalc = new CCalculator(new CWordSize(8));
	for (const strOp of OperatorList().split(" ")) {
		assert.ok(IsOperator(strOp), strOp);
		assert.equal(typeof oCalc.Calculate(12n, strOp, 3n).biValue, "bigint"); // every row can be applied
		assert.notEqual(OperatorName(strOp), "");
	}
});

test("Calculator: >> keeps the sign, >>> fills with 0 (lesson 11)", () => {
	const oByte = new CCalculator(new CWordSize(8));
	assert.equal(oByte.Calculate(0x80n, ">>", 1n).biValue, 0xc0n);
	assert.equal(oByte.Calculate(0x80n, ">>>", 1n).biValue, 0x40n);
	assert.equal(oByte.Calculate(0x40n, ">>", 1n).biValue, 0x20n); // the same when the top bit is 0
	assert.equal(new CCalculator(new CWordSize(32)).Calculate(-16n, ">>>", 28n).biValue, 0xfn);
	assert.equal(new CCalculator().Calculate(16n, ">>>", 2n).biValue, 4n);
	assert.throws(() => new CCalculator().Calculate(-16n, ">>>", 2n), { message: ">>> of a negative number needs a word size" });
});

test("Calculator: ** (lesson 11)", () => {
	const oCalc = new CCalculator();
	assert.equal(oCalc.Calculate(2n, "**", 10n).biValue, 1024n);
	assert.equal(oCalc.Calculate(-3n, "**", 3n).biValue, -27n);
	assert.equal(oCalc.Calculate(0n, "**", 0n).biValue, 1n);
	assert.equal(oCalc.Calculate(1n, "**", 1_000_000n).biValue, 1n); // 1 has no bits to grow
	assert.equal(OperatorAssoc("**"), "right");
	assert.equal(OperatorAssoc("-"), "left");
	assert.throws(() => oCalc.Calculate(2n, "**", -1n), { message: "negative exponent -1" });
	assert.throws(() => oCalc.Calculate(3n, "**", 5000n), { message: "3 ** 5000 has more than 4096 bits" });
	assert.deepEqual(new CCalculator(new CWordSize(8)).Calculate(2n, "**", 8n), { biValue: 0n, biExact: 256n, bOverflow: true });
});

test("Calculator: unary - and ~ (lesson 11)", () => {
	assert.equal(new CCalculator().CalculateUnary("~", 0n).biValue, -1n);
	assert.deepEqual(new CCalculator(new CWordSize(8)).CalculateUnary("~", 0x0fn), { biValue: 0xf0n, biExact: 0xf0n, bOverflow: false });
	assert.deepEqual(new CCalculator(new CWordSize(8)).CalculateUnary("-", 1n), { biValue: 0xffn, biExact: -1n, bOverflow: false });
	assert.equal(IsUnaryOperator("~"), true);
	assert.equal(IsUnaryOperator("+"), false);
	assert.equal(OperatorHelp(), "+ - * / % ** & | ^ << >> >>>, unary - ~");
});
