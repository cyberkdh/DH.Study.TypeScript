//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 01-basic-types / ex03-to-bigint (테스트)
//	History			: 2026-10-14 CYBERKDH 최초 작성
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

import { test } from "node:test";
import assert from "node:assert/strict";
import type * as TModule from "../exercises/ex03-to-bigint.ts";

const strTarget = process.env.LESSON_TARGET ?? "exercises";
const { ToBigInt } = (await import(`../${strTarget}/ex03-to-bigint.ts`)) as typeof TModule;

test("ToBigInt: 안전한 정수", () => {
	assert.equal(ToBigInt(255), 255n);
	assert.equal(ToBigInt(-1), -1n);
	assert.equal(ToBigInt(Number.MAX_SAFE_INTEGER), 9007199254740991n);
});

test("ToBigInt: 안전하지 않으면 RangeError", () => {
	for (const nBad of [1.5, NaN, Infinity, 2 ** 53]) {
		assert.throws(() => ToBigInt(nBad), RangeError, `${nBad} 은(는) RangeError 여야 함`);
	}
});
