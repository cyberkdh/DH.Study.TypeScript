//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 12-bigint-words / bigint
//	History			: 2026-10-15 CYBERKDH Initial
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// bigint in depth : exact integers of any size, and the places where they behave differently from number

// 1) [JS] number is exact only up to 2^53. bigint is exact at any size
const nBig = 2 ** 53 + 1; // 9007199254740993 does not exist as a number
const biBig = 2n ** 53n + 1n;
console.log("1) number :", nBig, "· bigint :", biBig);
console.log("1) safe?", Number.isSafeInteger(2 ** 53), "· 2^64 =", 2n ** 64n);

// 2) [JS + TS] No mixing : convert on purpose, in one direction or the other
const nCount = 3;
// const biBad = 10n * nCount; // ← Uncomment → TS2365 (Operator '*' cannot be applied to types 'bigint' and 'number')
const biTimes = 10n * BigInt(nCount);
const nBack = Number(2n ** 64n + 1n); // too big for a number : the low digits are lost
console.log("2) 10n * BigInt(3) =", biTimes, "· Number(2n ** 64n + 1n) =", nBack);
console.log("2) BigInt(\"0xFF\") =", BigInt("0xFF"), "· BigInt(\" 42 \") =", BigInt(" 42 "));

// 3) [JS] Division cuts toward zero, and % takes the sign of the left side (as in C)
console.log("3) 7n / 2n =", 7n / 2n, "· -7n / 2n =", -7n / 2n, "· -7n % 2n =", -7n % 2n);

function FloorDiv(biA: bigint, biB: bigint): bigint {
	const biQuotient = biA / biB;
	const bInexact = biA % biB !== 0n;
	const bSignsDiffer = biA < 0n !== biB < 0n;
	return bInexact && bSignsDiffer ? biQuotient - 1n : biQuotient; // -3.5 was cut to -3 : step down to -4
}
console.log("3) floor(-7 / 2) =", FloorDiv(-7n, 2n), "· Math.floor(-7 / 2) =", Math.floor(-7 / 2));

// 4) [JS + TS] Math is for number only. Write the few helpers you need
// Math.max(1n, 2n); // ← Uncomment → TS2345 (Argument of type 'bigint' is not assignable to parameter of type 'number')
function MaxOf(...arrValue: bigint[]): bigint {
	return arrValue.reduce((biMax, biValue) => (biValue > biMax ? biValue : biMax));
}

function BitLength(biValue: bigint): number {
	return biValue === 0n ? 0 : (biValue < 0n ? -biValue : biValue).toString(2).length;
}
console.log("4) MaxOf(3n, 10n, 7n) =", MaxOf(3n, 10n, 7n), "· BitLength(255n) =", BitLength(255n), "· BitLength(256n) =", BitLength(256n));

// 5) [JS + TS] Comparing and sorting. < > work across the two types; == and === are a TS error on literals
// if (1n === 1) {} // ← Uncomment → TS2367 (This comparison appears to be unintentional because the types 'bigint' and 'number' have no overlap)
const vOne: unknown = 1; // a value TS knows nothing about, like one from JSON.parse
console.log("5) 1n == 1 :", 1n == vOne, "· 1n === 1 :", 1n === vOne, "· 2n > 1 :", 2n > 1, "· typeof 1n :", typeof 1n);
const arrValue = [10n, 9n, 100n];
console.log("5) sort() :", [...arrValue].sort().join(" "), "(as text)");
console.log("5) sort(compare) :", [...arrValue].sort((biA, biB) => (biA < biB ? -1 : biA > biB ? 1 : 0)).join(" "));
// arrValue.sort((biA, biB) => biA - biB); // ← Uncomment → TS2345 (a compare function returns a number, and biA - biB is a bigint)

// 6) [JS] JSON has no bigint : choose a text form yourself
const strJson = JSON.stringify({ biValue: 255n }, (_strKey, vValue: unknown) => (typeof vValue === "bigint" ? `0x${vValue.toString(16)}` : vValue));
console.log("6) JSON with a replacer :", strJson, "→", BigInt((JSON.parse(strJson) as { biValue: string }).biValue));

// 7) Converting text that is not an integer
try {
	console.log(BigInt("12a"));
} catch (e) {
	console.log(`7) Expected error: ${String(e)}`);
	console.log("   Why : BigInt() takes whole integer text only (\"255\", \"0xFF\", \"-7\"). It has no 12a, 1Fh or 1_000.");
	console.log("   Fix : parse the text yourself (lesson 03's ParseInteger), or check it with a regex first.");
}
