//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 04-classes-errors / errors
//	History			: 2026-10-15 CYBERKDH Initial
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// 1) [JS] throw / try / catch / finally
function Divide(biA: bigint, biB: bigint): bigint {
	return biA / biB; // bigint division by 0n throws RangeError
}
try {
	console.log("1)", Divide(10n, 0n));
} catch (e) {
	console.log("1) caught:", e instanceof RangeError ? "RangeError" : "other", "-", (e as Error).message);
} finally {
	console.log("   finally runs either way");
}

// 2) [TS] catch (e) : e is unknown — JS can throw anything, not only Error
try {
	throw "just a string";
} catch (e) {
	// e.message; // ← Uncomment → red squiggle TS18046 ('e' is of type 'unknown')
	const strMessage = e instanceof Error ? e.message : String(e);
	console.log("2) thrown:", strMessage, "/ typeof =", typeof e);
}

// 3) [JS] Built-in error types
const biOne = 1n;
const arrTest: [string, () => unknown][] = [
	['BigInt("12a")', () => BigInt("12a")],
	["1n / 0n", () => biOne / 0n],
	// @ts-expect-error
	["1n >>> 1n", () => biOne >>> biOne], // TS2365 too : bigint has no >>>
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

// 4) [JS + TS] A custom error class : extends Error, its own name and extra fields
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
		throw new CCalcError("division by zero", "use a non-zero divisor", { cause: e }); // keep the original
	}
}

try {
	SafeDivide(10n, 0n);
} catch (e) {
	if (e instanceof CCalcError) {
		console.log("4)", `${e.name}: ${e.message} / fix: ${e.strFix}`); // e is CCalcError here
		console.log("   cause:", e.cause instanceof Error ? `${e.cause.name}: ${e.cause.message}` : e.cause);
	}
}

// 5) [JS + TS] Catch only what you can handle, rethrow the rest
function TryCalc(fnCalc: () => bigint): string {
	try {
		return String(fnCalc());
	} catch (e) {
		if (e instanceof CCalcError) {
			return `error: ${e.message}`;
		}
		throw e; // not ours : let the caller (or the crash) see it
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
