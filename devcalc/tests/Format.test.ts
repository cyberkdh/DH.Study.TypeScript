//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: devcalc / tests / Format
//	History			: 2026-10-14 CYBERKDH Initial - Lesson 01 DevCalc step
//					  2026-10-14 CYBERKDH Lesson 02: grouping and option tests
//					  2026-10-15 CYBERKDH Lesson 04: zero padding test
//					  2026-10-15 CYBERKDH Lesson 09: runs on Vitest (test from "vitest", node:assert kept)
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

import { test } from "vitest";
import assert from "node:assert/strict";
import { GroupDigits, ToBin, ToDec, ToHex } from "../src/core/Format.ts";

test("Format: 255", () => {
	assert.equal(ToHex(255n), "0xFF");
	assert.equal(ToDec(255n), "255");
	assert.equal(ToBin(255n), "0b11111111");
});

test("Format: zero and negative", () => {
	assert.equal(ToHex(0n), "0x0");
	assert.equal(ToHex(-255n), "-0xFF");
	assert.equal(ToBin(-5n), "-0b101");
});

test("GroupDigits", () => {
	assert.equal(GroupDigits("FFFFFFFF", 4, "_"), "FFFF_FFFF");
	assert.equal(GroupDigits("1234567", 3, ","), "1,234,567");
	assert.equal(GroupDigits("FF", 4, "_"), "FF");
	assert.equal(GroupDigits("", 4, "_"), "");
	assert.equal(GroupDigits("1234", 0, "_"), "1234");
});

test("Format options", () => {
	assert.equal(ToHex(0xffff_ffffn, { bGroup: true }), "0xFFFF_FFFF");
	assert.equal(ToDec(1234567n, { bGroup: true }), "1,234,567");
	assert.equal(ToBin(255n, { bGroup: true }), "0b1111_1111");
	assert.equal(ToHex(255n, { bUpperCase: false }), "0xff");
	assert.equal(ToHex(255n, { bPrefix: false }), "FF");
	assert.equal(ToHex(-0x1_0000n, { bGroup: true }), "-0x1_0000");
});

test("Format padding (nBits)", () => {
	assert.equal(ToHex(255n, { nBits: 16 }), "0x00FF");
	assert.equal(ToBin(5n, { nBits: 8, bGroup: true }), "0b0000_0101");
	assert.equal(ToDec(5n, { nBits: 8 }), "5");
	assert.equal(ToHex(0x1_0000n, { nBits: 8 }), "0x10000");
});
