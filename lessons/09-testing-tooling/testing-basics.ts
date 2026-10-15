//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 09-testing-tooling / testing-basics
//	History			: 2026-10-15 CYBERKDH Initial
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// node:test basics : test, describe / it, assert, async tests, skip / todo
// Run it like any example : node lessons/09-testing-tooling/testing-basics.ts
// A file that imports node:test runs its tests and prints a report at the end.

import { describe, it, test } from "node:test";
import assert from "node:assert/strict";

// The code under test
function ToHex(biValue: bigint): string {
	if (biValue < 0n) {
		throw new RangeError("negative value");
	}
	return "0x" + biValue.toString(16).toUpperCase();
}

async function ParseLater(strText: string): Promise<bigint> {
	await Promise.resolve(); // pretend this is a file or a network read
	if (!/^\d+$/.test(strText)) {
		throw new SyntaxError(`not a number: ${strText}`);
	}
	return BigInt(strText);
}

// 1) [JS + TS] test(name, fn) : the test passes when fn returns without throwing
test("1) ToHex(255n) is 0xFF", () => {
	assert.equal(ToHex(255n), "0xFF"); // strict : === (the /strict import)
});

// 2) describe groups tests, it is another name for test
describe("2) ToHex", () => {
	it("zero", () => {
		assert.equal(ToHex(0n), "0x0");
	});
	it("throws RangeError for a negative value", () => {
		assert.throws(() => ToHex(-1n), RangeError);
		assert.throws(() => ToHex(-1n), { name: "RangeError", message: "negative value" });
	});
});

// 3) equal compares with ===, deepEqual compares the contents
test("3) deepEqual", () => {
	const arrHex = [1n, 10n, 255n].map(ToHex);
	assert.deepEqual(arrHex, ["0x1", "0xA", "0xFF"]);
	assert.notEqual(arrHex, ["0x1", "0xA", "0xFF"]); // two different arrays : not ===
	assert.ok(arrHex.length === 3); // ok : any truthy value
});

// 4) An async test : return a Promise (async fn). The test waits for it
test("4) async : await the value, rejects for the error", async () => {
	assert.equal(await ParseLater("42"), 42n);
	await assert.rejects(ParseLater("4x"), SyntaxError); // forget the await → the check runs after the test ends
});

// 5) skip and todo : listed in the report, not counted as failures
test("5) copy to the clipboard", { skip: "needs a desktop session" }, () => {
	// not run
});
test.todo("5) ToHex with a word size (--bits)");

// 6) [JS + TS] What a failure looks like : assert throws an AssertionError
test("6) a failing assert (caught here, so the file still passes)", (t) => {
	try {
		assert.equal(ToHex(10n), "0xa");
	} catch (e) {
		assert.ok(e instanceof assert.AssertionError);
		t.diagnostic("Expected error: " + e.message.split("\n")[0]);
		t.diagnostic(`  actual ${JSON.stringify(e.actual)}, expected ${JSON.stringify(e.expected)}`);
		t.diagnostic("Why : ToHex writes upper-case digits; a test without the try would fail");
		t.diagnostic("Fix : expect \"0xA\" (or change ToHex if lower case is what you want)");
	}
});
// test("6) fails", () => { assert.equal(ToHex(10n), "0xa"); }); // ← Uncomment → this test fails, the report shows ✖ and node exits with code 1
