//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 01-basic-types / ex01-to-hex (테스트)
//	History			: 2026-10-14 CYBERKDH 최초 작성
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

import { test } from "node:test";
import assert from "node:assert/strict";
import type * as TModule from "../exercises/ex01-to-hex.ts";

// LESSON_TARGET=solutions 이면 정답을, 아니면 내가 푼 연습문제를 검사 (tools/check.ts 가 설정)
const strTarget = process.env.LESSON_TARGET ?? "exercises";
const { ToHex } = (await import(`../${strTarget}/ex01-to-hex.ts`)) as typeof TModule;

test("ToHex: 양수", () => {
	assert.equal(ToHex(255n), "0xFF");
	assert.equal(ToHex(4096n), "0x1000");
});

test("ToHex: 0", () => {
	assert.equal(ToHex(0n), "0x0");
});

test("ToHex: 음수는 부호를 맨 앞에", () => {
	assert.equal(ToHex(-255n), "-0xFF");
});

test("ToHex: 64비트 최댓값", () => {
	assert.equal(ToHex(0xffff_ffff_ffff_ffffn), "0xFFFFFFFFFFFFFFFF");
});
