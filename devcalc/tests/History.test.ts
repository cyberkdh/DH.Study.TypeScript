//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: devcalc / tests / History (and Result)
//	History			: 2026-10-15 CYBERKDH Initial - Lesson 05 DevCalc step
//					  2026-10-15 CYBERKDH Lesson 09: runs on Vitest (test from "vitest", node:assert kept)
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

import { test } from "vitest";
import assert from "node:assert/strict";
import { CHistory } from "../src/core/History.ts";
import { Err, MapResult, Ok, type TResult } from "../src/core/Result.ts";

test("History: keeps the last N items in order", () => {
	const oHistory = new CHistory<string>(3);
	assert.equal(oHistory.Latest(), undefined);
	for (const strItem of ["a", "b", "c", "d"]) {
		oHistory.Add(strItem);
	}
	assert.equal(oHistory.nCount, 3);
	assert.deepEqual([...oHistory], ["b", "c", "d"]);
	assert.equal(oHistory.At(0), "b");
	assert.equal(oHistory.At(-1), "d");
	assert.equal(oHistory.Latest(), "d");
	assert.equal(oHistory.At(5), undefined);
});

test("History: Find searches from the newest, Clear empties it", () => {
	const oHistory = new CHistory<bigint>(10);
	for (const biItem of [1n, 20n, 3n, 40n, 5n]) {
		oHistory.Add(biItem);
	}
	assert.equal(
		oHistory.Find((biItem) => biItem > 10n),
		40n,
	);
	assert.equal(
		oHistory.Find((biItem) => biItem > 100n),
		undefined,
	);
	oHistory.Clear();
	assert.equal(oHistory.nCount, 0);
});

test("History: capacity must be a positive integer", () => {
	assert.throws(() => new CHistory<string>(0), RangeError);
	assert.throws(() => new CHistory<string>(1.5), RangeError);
});

test("Result: Ok, Err and MapResult", () => {
	// A function result keeps the full TResult<number> type (a const would be narrowed to one side)
	const Half = (nValue: number): TResult<number> => (nValue % 2 === 0 ? Ok(nValue / 2) : Err("odd"));
	assert.deepEqual(
		MapResult(Half(4), (nValue) => nValue * 10),
		{ bOk: true, vValue: 20 },
	);
	assert.deepEqual(
		MapResult(Half(3), (nValue) => nValue * 10),
		{ bOk: false, vError: "odd" },
	);
});
