//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 06-modules-async / promises (Promise 와 async/await)
//	History			: 2026-10-15 CYBERKDH Initial (최초 작성)
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// 1) [JS + TS] Promise 는 나중에 도착할 값을 감쌈. Promise<T> 의 T 가 그 값의 타입
function Delay<T>(nMs: number, vValue: T): Promise<T> {
	return new Promise((fnResolve) => {
		setTimeout(() => fnResolve(vValue), nMs);
	});
}

// 2) [JS] 실행 순서 : 동기 코드 먼저, 그다음 Promise 콜백 (마이크로태스크, microtask), 그다음 타이머
console.log("2) order :");
setTimeout(() => console.log("   c) setTimeout 0 : a timer, runs last"), 0);
Promise.resolve().then(() => console.log("   b) then : a microtask, runs when the current code is done"));
console.log("   a) synchronous code runs first");
await Delay(10, undefined); // 위 세 줄이 3) 보다 먼저 출력되도록 여기서 기다림

// 3) [JS + TS] async / await : 비동기 코드를 위에서 아래로 씀. async 함수는 Promise<T> 를 돌려줌
async function ReadRegister(strName: string): Promise<bigint> {
	await Delay(5, undefined); // 장치를 기다리는 흉내
	if (strName === "ZZ") {
		throw new Error(`unknown register "${strName}"`); // reject 된 Promise 가 됨
	}
	return 0xffn; // Promise<bigint> 가 됨
}
const biAx = await ReadRegister("AX"); // 최상위 await (top-level await) : ES 모듈에서 허용
console.log("3) await ReadRegister =", biAx);

// 4) [JS] try / catch 는 await 와 함께 동작함. C# 과 같음
try {
	await ReadRegister("ZZ");
} catch (e) {
	console.log("4) Expected error:", (e as Error).message);
	console.log("   Why : the async function threw, so its Promise rejected and await rethrew it here.");
	console.log("   Fix : catch it around the await, or let it reach a caller that can.");
}

// 5) [JS] 여러 개를 동시에 : Promise.all 은 모두를 기다림 (첫 에러에서 실패)
const nStart = performance.now();
const arrValue = await Promise.all([Delay(30, 1n), Delay(30, 2n), Delay(30, 3n)]);
const bParallel = performance.now() - nStart < 80; // 병렬이면 약 30 ms, 90 ms 가 아님
console.log("5) Promise.all =", arrValue, "/ ran in parallel =", bParallel);

// 6) [JS] allSettled : 성공이든 실패든 모든 결과. race : 가장 먼저 끝난 하나
const arrSettled = await Promise.allSettled([ReadRegister("AX"), ReadRegister("ZZ")]);
console.log("6) allSettled =", arrSettled.map((oItem) => oItem.status).join(", "));
const strWinner = await Promise.race([Delay(50, "slow"), Delay(5, "fast")]);
console.log("   race =", strWinner);

// 7) [JS] await 를 잊으면 : 값이 아니라 Promise 를 받음
const vForgot = ReadRegister("AX");
console.log("7) without await :", vForgot instanceof Promise ? "a Promise object" : vForgot);
// const biWrong: bigint = ReadRegister("AX"); // ← 주석을 풀면 빨간 줄 TS2322 (Promise<bigint> 는 bigint 가 아님)
await vForgot;

// 8) [JS] race 로 시간 제한 (timeout) : nMs 후에 포기
async function WithTimeout<T>(oWork: Promise<T>, nMs: number): Promise<T> {
	let oTimer: NodeJS.Timeout | undefined;
	const oTimeout = new Promise<never>((_, fnReject) => {
		oTimer = setTimeout(() => fnReject(new Error(`timed out after ${nMs} ms`)), nMs);
	});
	try {
		return await Promise.race([oWork, oTimeout]);
	} finally {
		clearTimeout(oTimer); // 타이머는 항상 정리함. 아니면 Node 가 종료 전에 그 타이머를 기다림
	}
}
try {
	await WithTimeout(Delay(200, "late"), 20);
} catch (e) {
	console.log("8) Expected error:", (e as Error).message);
	console.log("   Why : the work took longer than the limit.");
	console.log("   Fix : raise the limit, or tell the user and let them retry.");
}
