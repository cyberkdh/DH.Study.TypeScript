//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 01-basic-types / ex02-to-bin (테스트)
//	History			: 2026-10-14 CYBERKDH 최초 작성
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

import { test } from "node:test";
import assert from "node:assert/strict";
import type * as TModule from "../exercises/ex02-to-bin.ts";

const strTarget = process.env.LESSON_TARGET ?? "exercises";
const { ToBin, ToDec } = (await import(`../${strTarget}/ex02-to-bin.ts`)) as typeof TModule;

test("ToBin: 양수와 0", () => {
	assert.equal(ToBin(10n), "0b1010");
	assert.equal(ToBin(0n), "0b0");
});

test("ToBin: 음수", () => {
	assert.equal(ToBin(-5n), "-0b101");
});

test("ToDec", () => {
	assert.equal(ToDec(255n), "255");
	assert.equal(ToDec(-1n), "-1");
	assert.equal(ToDec(2n ** 64n), "18446744073709551616");
});
