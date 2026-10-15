//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 06-modules-async / promises
//	History			: 2026-10-15 CYBERKDH Initial
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// 1) [JS + TS] A Promise wraps a value that arrives later. Promise<T> says what the value will be
function Delay<T>(nMs: number, vValue: T): Promise<T> {
	return new Promise((fnResolve) => {
		setTimeout(() => fnResolve(vValue), nMs);
	});
}

// 2) [JS] The order : synchronous code first, then promise callbacks (microtasks), then timers
console.log("2) order :");
setTimeout(() => console.log("   c) setTimeout 0 : a timer, runs last"), 0);
Promise.resolve().then(() => console.log("   b) then : a microtask, runs when the current code is done"));
console.log("   a) synchronous code runs first");
await Delay(10, undefined); // wait here so the three lines above print before 3)

// 3) [JS + TS] async / await : write asynchronous code top to bottom. An async function returns Promise<T>
async function ReadRegister(strName: string): Promise<bigint> {
	await Delay(5, undefined); // pretend to wait for a device
	if (strName === "ZZ") {
		throw new Error(`unknown register "${strName}"`); // becomes a rejected Promise
	}
	return 0xffn; // becomes Promise<bigint>
}
const biAx = await ReadRegister("AX"); // top-level await : allowed in ES modules
console.log("3) await ReadRegister =", biAx);

// 4) [JS] try / catch works with await, like C#
try {
	await ReadRegister("ZZ");
} catch (e) {
	console.log("4) Expected error:", (e as Error).message);
	console.log("   Why : the async function threw, so its Promise rejected and await rethrew it here.");
	console.log("   Fix : catch it around the await, or let it reach a caller that can.");
}

// 5) [JS] Several at once : Promise.all waits for all (fails on the first error)
const nStart = performance.now();
const arrValue = await Promise.all([Delay(30, 1n), Delay(30, 2n), Delay(30, 3n)]);
const bParallel = performance.now() - nStart < 80; // in parallel ≈ 30 ms, not 90 ms
console.log("5) Promise.all =", arrValue, "/ ran in parallel =", bParallel);

// 6) [JS] allSettled : every result, success or not. race : the first one to finish
const arrSettled = await Promise.allSettled([ReadRegister("AX"), ReadRegister("ZZ")]);
console.log("6) allSettled =", arrSettled.map((oItem) => oItem.status).join(", "));
const strWinner = await Promise.race([Delay(50, "slow"), Delay(5, "fast")]);
console.log("   race =", strWinner);

// 7) [JS] A forgotten await : you get the Promise, not the value
const vForgot = ReadRegister("AX");
console.log("7) without await :", vForgot instanceof Promise ? "a Promise object" : vForgot);
// const biWrong: bigint = ReadRegister("AX"); // ← Uncomment → red squiggle TS2322 (Promise<bigint> is not bigint)
await vForgot;

// 8) [JS] A timeout with race : give up after nMs
async function WithTimeout<T>(oWork: Promise<T>, nMs: number): Promise<T> {
	let oTimer: NodeJS.Timeout | undefined;
	const oTimeout = new Promise<never>((_, fnReject) => {
		oTimer = setTimeout(() => fnReject(new Error(`timed out after ${nMs} ms`)), nMs);
	});
	try {
		return await Promise.race([oWork, oTimeout]);
	} finally {
		clearTimeout(oTimer); // always stop the timer, or Node waits for it before exiting
	}
}
try {
	await WithTimeout(Delay(200, "late"), 20);
} catch (e) {
	console.log("8) Expected error:", (e as Error).message);
	console.log("   Why : the work took longer than the limit.");
	console.log("   Fix : raise the limit, or tell the user and let them retry.");
}
