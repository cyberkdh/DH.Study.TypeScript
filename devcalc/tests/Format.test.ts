//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: devcalc / tests / Format
//	History			: 2026-10-14 CYBERKDH 최초 작성 (01강 DevCalc 스텝)
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

import { test } from "node:test";
import assert from "node:assert/strict";
import { ToBin, ToDec, ToHex } from "../src/core/Format.ts";

test("Format: 255", () => {
	assert.equal(ToHex(255n), "0xFF");
	assert.equal(ToDec(255n), "255");
	assert.equal(ToBin(255n), "0b11111111");
});

test("Format: 0 과 음수", () => {
	assert.equal(ToHex(0n), "0x0");
	assert.equal(ToHex(-255n), "-0xFF");
	assert.equal(ToBin(-5n), "-0b101");
});
