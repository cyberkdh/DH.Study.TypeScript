//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 09-testing-tooling / testing-basics (node:test 기초)
//	History			: 2026-10-15 CYBERKDH Initial (최초 작성)
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// node:test 기초 : test, describe / it, assert, 비동기 테스트, skip / todo
// 다른 예제처럼 실행 : node lessons/09-testing-tooling/testing-basics.ko.ts
// node:test 를 import 한 파일은 테스트를 실행하고 끝에 보고서 (report) 를 출력함.

import { describe, it, test } from "node:test";
import assert from "node:assert/strict";

// 테스트할 코드
function ToHex(biValue: bigint): string {
	if (biValue < 0n) {
		throw new RangeError("negative value");
	}
	return "0x" + biValue.toString(16).toUpperCase();
}

async function ParseLater(strText: string): Promise<bigint> {
	await Promise.resolve(); // 파일이나 네트워크에서 읽는다고 가정
	if (!/^\d+$/.test(strText)) {
		throw new SyntaxError(`not a number: ${strText}`);
	}
	return BigInt(strText);
}

// 1) [JS + TS] test(이름, fn) : fn 이 예외 없이 끝나면 테스트 통과
test("1) ToHex(255n) is 0xFF", () => {
	assert.equal(ToHex(255n), "0xFF"); // strict : === 로 비교 (/strict 를 import 했으므로)
});

// 2) describe 는 테스트를 묶고, it 은 test 의 별칭 (alias)
describe("2) ToHex", () => {
	it("zero", () => {
		assert.equal(ToHex(0n), "0x0");
	});
	it("throws RangeError for a negative value", () => {
		assert.throws(() => ToHex(-1n), RangeError);
		assert.throws(() => ToHex(-1n), { name: "RangeError", message: "negative value" });
	});
});

// 3) equal 은 === 로, deepEqual 은 내용으로 비교
test("3) deepEqual", () => {
	const arrHex = [1n, 10n, 255n].map(ToHex);
	assert.deepEqual(arrHex, ["0x1", "0xA", "0xFF"]);
	assert.notEqual(arrHex, ["0x1", "0xA", "0xFF"]); // 서로 다른 배열 두 개 : === 가 아님
	assert.ok(arrHex.length === 3); // ok : truthy 값이면 통과
});

// 4) 비동기 테스트 : Promise 를 반환 (async fn). 테스트가 그것을 기다림
test("4) async : await the value, rejects for the error", async () => {
	assert.equal(await ParseLater("42"), 42n);
	await assert.rejects(ParseLater("4x"), SyntaxError); // await 를 빠뜨리면 → 검사가 테스트가 끝난 뒤에 실행됨
});

// 5) skip 과 todo : 보고서에 나오지만 실패로 세지 않음
test("5) copy to the clipboard", { skip: "needs a desktop session" }, () => {
	// 실행 안 됨
});
test.todo("5) ToHex with a word size (--bits)");

// 6) [JS + TS] 실패하면 어떻게 보이나 : assert 는 AssertionError 를 던짐
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
// test("6) fails", () => { assert.equal(ToHex(10n), "0xa"); }); // ← 주석을 풀면 이 테스트가 실패, 보고서에 ✖ 가 나오고 node 는 종료 코드 1 로 끝남
