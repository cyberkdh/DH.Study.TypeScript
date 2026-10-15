//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 09-testing-tooling / mocking
//	History			: 2026-10-15 CYBERKDH Initial
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// Test doubles : pass a fake in (injection), mock.fn, mock.method, mock.timers

import { mock, test } from "node:test";
import assert from "node:assert/strict";

// 1) [TS] Dependency injection : the code asks for an interface, the test passes a fake.
//    No mocking library needed — this is the first thing to try
interface IClipboard {
	Write(strText: string): Promise<void>;
}

async function CopyResult(biValue: bigint, oClipboard: IClipboard): Promise<string> {
	const strHex = "0x" + biValue.toString(16).toUpperCase();
	await oClipboard.Write(strHex);
	return `copied ${strHex}`;
}

test("1) injection : a fake clipboard keeps what was written", async () => {
	const arrWritten: string[] = [];
	const oFake: IClipboard = {
		Write: async (strText) => {
			arrWritten.push(strText);
		},
	};
	assert.equal(await CopyResult(255n, oFake), "copied 0xFF");
	assert.deepEqual(arrWritten, ["0xFF"]);
	// const oBad: IClipboard = { Write: (nValue: number) => {} }; // ← Uncomment → red squiggle TS2322 (Type '(nValue: number) => void' is not assignable to type '(strText: string) => Promise<void>')
});

// 2) mock.fn : a function that records every call (arguments, return value)
function EvaluateAll(arrExpr: readonly string[], fnLog: (strLine: string) => void): number {
	for (const strExpr of arrExpr) {
		fnLog(`${strExpr} = ${BigInt(strExpr).toString(16)}`);
	}
	return arrExpr.length;
}

test("2) mock.fn : count the calls and read the arguments", () => {
	const fnLog = mock.fn<(strLine: string) => void>(); // no body : the type says what a call looks like
	EvaluateAll(["255", "16"], fnLog);
	assert.equal(fnLog.mock.callCount(), 2);
	assert.deepEqual(fnLog.mock.calls[0]?.arguments, ["255 = ff"]);
	assert.deepEqual(
		fnLog.mock.calls.map((oCall) => oCall.arguments[0]),
		["255 = ff", "16 = 10"],
	);
});

// 3) mock.method : replace one method of an existing object for one test.
//    t.mock (the test context's mock) puts the original back when the test ends
class CStamp {
	Now(): number {
		return Date.now();
	}
	Line(strText: string): string {
		return `[${new Date(this.Now()).toISOString()}] ${strText}`;
	}
}

test("3) mock.method : a fixed time", (t) => {
	const oStamp = new CStamp();
	const oNow = t.mock.method(oStamp, "Now", () => 0);
	assert.equal(oStamp.Line("start"), "[1970-01-01T00:00:00.000Z] start");
	assert.equal(oNow.mock.callCount(), 1);
	// t.mock.method(oStamp, "Later", () => 0); // ← Uncomment → red squiggle TS2769 (No overload matches this call : '"Later"' is not assignable to 'keyof CStamp')
});

// 4) mock.timers : move time forward without waiting
function Debounce(fnRun: () => void, nWaitMs: number): () => void {
	let vTimer: ReturnType<typeof setTimeout> | undefined;
	return () => {
		clearTimeout(vTimer);
		vTimer = setTimeout(fnRun, nWaitMs);
	};
}

test("4) mock.timers : 300 ms pass in no time", (t) => {
	t.mock.timers.enable({ apis: ["setTimeout"] });
	const fnRun = t.mock.fn();
	const fnTyped = Debounce(fnRun, 300);
	fnTyped();
	t.mock.timers.tick(200);
	fnTyped(); // typed again : the 300 ms start over
	t.mock.timers.tick(299);
	assert.equal(fnRun.mock.callCount(), 0);
	t.mock.timers.tick(1);
	assert.equal(fnRun.mock.callCount(), 1);
});

// 5) A fake can fail on purpose : that is how you test the error path
test("5) a failing fake (the error is caught here)", async (t) => {
	const oBroken: IClipboard = {
		Write: async (strText) => {
			throw new Error(`clipboard is locked (${strText})`);
		},
	};
	try {
		await CopyResult(1n, oBroken);
	} catch (e) {
		t.diagnostic("Expected error: " + (e as Error).message);
		t.diagnostic("Why : the fake throws; CopyResult does not catch, so the error reaches the caller");
		t.diagnostic("Fix : a test can expect it : await assert.rejects(CopyResult(1n, oBroken), /locked/)");
	}
	await assert.rejects(CopyResult(1n, oBroken), /locked/);
});
