//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 09-testing-tooling / mocking (테스트 대역)
//	History			: 2026-10-15 CYBERKDH Initial (최초 작성)
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// 테스트 대역 (test doubles) : 가짜 객체 주입, mock.fn, mock.method, mock.timers

import { mock, test } from "node:test";
import assert from "node:assert/strict";

// 1) [TS] 의존성 주입 (dependency injection) : 코드는 interface 를 요구하고, 테스트는 가짜 객체를 넘김.
//    모킹 라이브러리가 필요 없음 — 가장 먼저 시도할 방법
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
	// const oBad: IClipboard = { Write: (nValue: number) => {} }; // ← 주석을 풀면 빨간 줄 TS2322 ('(nValue: number) => void' 타입은 '(strText: string) => Promise<void>' 에 대입할 수 없음)
});

// 2) mock.fn : 모든 호출 (인수, 반환값) 을 기록하는 함수
function EvaluateAll(arrExpr: readonly string[], fnLog: (strLine: string) => void): number {
	for (const strExpr of arrExpr) {
		fnLog(`${strExpr} = ${BigInt(strExpr).toString(16)}`);
	}
	return arrExpr.length;
}

test("2) mock.fn : count the calls and read the arguments", () => {
	const fnLog = mock.fn<(strLine: string) => void>(); // 본문 없음 : 타입이 호출 모양을 알려 줌
	EvaluateAll(["255", "16"], fnLog);
	assert.equal(fnLog.mock.callCount(), 2);
	assert.deepEqual(fnLog.mock.calls[0]?.arguments, ["255 = ff"]);
	assert.deepEqual(
		fnLog.mock.calls.map((oCall) => oCall.arguments[0]),
		["255 = ff", "16 = 10"],
	);
});

// 3) mock.method : 테스트 하나 동안 기존 객체의 메서드 하나를 바꿔 끼움.
//    t.mock (테스트 컨텍스트의 mock) 은 테스트가 끝나면 원래 메서드로 복원함
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
	// t.mock.method(oStamp, "Later", () => 0); // ← 주석을 풀면 빨간 줄 TS2769 (맞는 오버로드가 없음 : '"Later"' 는 'keyof CStamp' 에 대입할 수 없음)
});

// 4) mock.timers : 기다리지 않고 시간을 앞당김
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
	fnTyped(); // 다시 입력 : 300 ms 가 처음부터 다시 시작
	t.mock.timers.tick(299);
	assert.equal(fnRun.mock.callCount(), 0);
	t.mock.timers.tick(1);
	assert.equal(fnRun.mock.callCount(), 1);
});

// 5) 가짜 객체는 일부러 실패하게 만들 수도 있음 : 에러 경로는 이렇게 테스트함
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
