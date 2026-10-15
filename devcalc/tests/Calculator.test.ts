//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: devcalc / tests / Calculator (and WordSize)
//	History			: 2026-10-15 CYBERKDH Initial - Lesson 04 DevCalc step
//					  2026-10-15 CYBERKDH Lesson 08: operator table test
//					  2026-10-15 CYBERKDH Lesson 09: runs on Vitest (test from "vitest", node:assert kept)
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

import { test } from "vitest";
import assert from "node:assert/strict";
import { CWordSize, IsWordBits } from "../src/core/WordSize.ts";
import { CCalcError, CCalculator, IsOperator, OperatorList, OperatorName } from "../src/core/Calculator.ts";

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
	assert.equal(oCalc.Calculate(-1n, ">>", 1n).biValue, 0x7fn); // -1 is 0xFF in 8 bits
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
	assert.equal(IsOperator("**"), false);
});

test("Calculator: operator table", () => {
	assert.equal(OperatorList(), "+ - * / % & | ^ << >>"); // same order as before lesson 08
	assert.equal(IsOperator("toString"), false); // Object.hasOwn : inherited keys are not operators
	assert.equal(OperatorName("^"), "xor");
	const oCalc = new CCalculator(new CWordSize(8));
	for (const strOp of OperatorList().split(" ")) {
		assert.ok(IsOperator(strOp), strOp);
		assert.equal(typeof oCalc.Calculate(12n, strOp, 3n).biValue, "bigint"); // every row can be applied
		assert.notEqual(OperatorName(strOp), "");
	}
});
