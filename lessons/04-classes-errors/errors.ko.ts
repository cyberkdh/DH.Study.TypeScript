//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 04-classes-errors / errors (에러 처리)
//	History			: 2026-10-15 CYBERKDH Initial (최초 작성)
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// 1) [JS] throw / try / catch / finally
function Divide(biA: bigint, biB: bigint): bigint {
	return biA / biB; // bigint 를 0n 으로 나누면 RangeError 발생
}
try {
	console.log("1)", Divide(10n, 0n));
} catch (e) {
	console.log("1) caught:", e instanceof RangeError ? "RangeError" : "other", "-", (e as Error).message);
} finally {
	console.log("   finally runs either way");
}

// 2) [TS] catch (e) : e 는 unknown — JS 는 Error 가 아닌 것도 throw 할 수 있음
try {
	throw "just a string";
} catch (e) {
	// e.message; // ← 주석을 풀면 빨간 줄 TS18046 ('e' 는 unknown 타입)
	const strMessage = e instanceof Error ? e.message : String(e);
	console.log("2) thrown:", strMessage, "/ typeof =", typeof e);
}

// 3) [JS] 내장 에러 타입 (built-in error types)
const biOne = 1n;
const arrTest: [string, () => unknown][] = [
	['BigInt("12a")', () => BigInt("12a")],
	["1n / 0n", () => biOne / 0n],
	// @ts-expect-error
	["1n >>> 1n", () => biOne >>> biOne], // TS2365 도 발생 : bigint 에는 >>> 가 없음
	["null.length", () => (JSON.parse("null") as string).length],
];
for (const [strCode, fnRun] of arrTest) {
	try {
		fnRun();
	} catch (e) {
		if (e instanceof Error) {
			console.log(`3) ${strCode.padEnd(14)} → ${e.name}: ${e.message}`);
		}
	}
}

// 4) [JS + TS] 사용자 정의 에러 클래스 (custom error) : Error 를 상속하고, 자기 name 과 추가 필드를 가짐
class CCalcError extends Error {
	override readonly name = "CCalcError";
	readonly strFix: string;

	constructor(strMessage: string, strFix: string, oOptions?: ErrorOptions) {
		super(strMessage, oOptions);
		this.strFix = strFix;
	}
}

function SafeDivide(biA: bigint, biB: bigint): bigint {
	try {
		return biA / biB;
	} catch (e) {
		throw new CCalcError("division by zero", "use a non-zero divisor", { cause: e }); // 원래 에러를 cause 로 보존
	}
}

try {
	SafeDivide(10n, 0n);
} catch (e) {
	if (e instanceof CCalcError) {
		console.log("4)", `${e.name}: ${e.message} / fix: ${e.strFix}`); // 여기서 e 는 CCalcError
		console.log("   cause:", e.cause instanceof Error ? `${e.cause.name}: ${e.cause.message}` : e.cause);
	}
}

// 5) [JS + TS] 처리할 수 있는 것만 잡고, 나머지는 다시 던짐 (rethrow)
function TryCalc(fnCalc: () => bigint): string {
	try {
		return String(fnCalc());
	} catch (e) {
		if (e instanceof CCalcError) {
			return `error: ${e.message}`;
		}
		throw e; // 직접 만든 에러가 아님 : 호출한 쪽에서 처리하게 함 (없으면 프로그램 종료)
	}
}
console.log("5)", TryCalc(() => SafeDivide(10n, 3n)), "/", TryCalc(() => SafeDivide(1n, 0n)));
try {
	TryCalc(() => {
		throw new TypeError("a bug, not a user error");
	});
} catch (e) {
	console.log("   rethrown:", e instanceof TypeError ? `TypeError: ${e.message}` : e);
}
