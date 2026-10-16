//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 12-bigint-words / bigint (빅인트)
//	History			: 2026-10-15 CYBERKDH Initial (최초 작성)
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// bigint 깊이 보기 : 크기 제한 없는 정확한 정수, 그리고 number 와 다르게 동작하는 곳들

// 1) [JS] number 는 2^53 까지만 정확함. bigint 는 크기와 상관없이 정확함
const nBig = 2 ** 53 + 1; // 9007199254740993 은 number 로 표현할 수 없음
const biBig = 2n ** 53n + 1n;
console.log("1) number :", nBig, "· bigint :", biBig);
console.log("1) safe?", Number.isSafeInteger(2 ** 53), "· 2^64 =", 2n ** 64n);

// 2) [JS + TS] 섞어 쓰기 금지 : 한쪽 방향으로 일부러 변환 (conversion)
const nCount = 3;
// const biBad = 10n * nCount; // ← 주석 해제 → TS2365 (Operator '*' cannot be applied to types 'bigint' and 'number')
const biTimes = 10n * BigInt(nCount);
const nBack = Number(2n ** 64n + 1n); // number 로는 너무 큼 : 아래 자리가 사라짐
console.log("2) 10n * BigInt(3) =", biTimes, "· Number(2n ** 64n + 1n) =", nBack);
console.log("2) BigInt(\"0xFF\") =", BigInt("0xFF"), "· BigInt(\" 42 \") =", BigInt(" 42 "));

// 3) [JS] 나눗셈은 0 쪽으로 자르고, % 는 왼쪽 값의 부호를 따름 (C 와 같음)
console.log("3) 7n / 2n =", 7n / 2n, "· -7n / 2n =", -7n / 2n, "· -7n % 2n =", -7n % 2n);

function FloorDiv(biA: bigint, biB: bigint): bigint {
	const biQuotient = biA / biB;
	const bInexact = biA % biB !== 0n;
	const bSignsDiffer = biA < 0n !== biB < 0n;
	return bInexact && bSignsDiffer ? biQuotient - 1n : biQuotient; // -3.5 가 -3 으로 잘림 : 한 칸 내려서 -4
}
console.log("3) floor(-7 / 2) =", FloorDiv(-7n, 2n), "· Math.floor(-7 / 2) =", Math.floor(-7 / 2));

// 4) [JS + TS] Math 는 number 전용. 필요한 도우미 (helper) 몇 개는 직접 작성
// Math.max(1n, 2n); // ← 주석 해제 → TS2345 (Argument of type 'bigint' is not assignable to parameter of type 'number')
function MaxOf(...arrValue: bigint[]): bigint {
	return arrValue.reduce((biMax, biValue) => (biValue > biMax ? biValue : biMax));
}

function BitLength(biValue: bigint): number {
	return biValue === 0n ? 0 : (biValue < 0n ? -biValue : biValue).toString(2).length;
}
console.log("4) MaxOf(3n, 10n, 7n) =", MaxOf(3n, 10n, 7n), "· BitLength(255n) =", BitLength(255n), "· BitLength(256n) =", BitLength(256n));

// 5) [JS + TS] 비교와 정렬. < > 는 두 타입 사이에서도 동작하지만, 리터럴끼리 == 와 === 는 TS 오류
// if (1n === 1) {} // ← 주석 해제 → TS2367 (This comparison appears to be unintentional because the types 'bigint' and 'number' have no overlap)
const vOne: unknown = 1; // JSON.parse 결과처럼 TS 가 아무것도 모르는 값
console.log("5) 1n == 1 :", 1n == vOne, "· 1n === 1 :", 1n === vOne, "· 2n > 1 :", 2n > 1, "· typeof 1n :", typeof 1n);
const arrValue = [10n, 9n, 100n];
console.log("5) sort() :", [...arrValue].sort().join(" "), "(as text)");
console.log("5) sort(compare) :", [...arrValue].sort((biA, biB) => (biA < biB ? -1 : biA > biB ? 1 : 0)).join(" "));
// arrValue.sort((biA, biB) => biA - biB); // ← 주석 해제 → TS2345 (비교 함수는 number 를 돌려줘야 하는데 biA - biB 는 bigint)

// 6) [JS] JSON 에는 bigint 가 없음 : 텍스트 형태를 직접 정함
const strJson = JSON.stringify({ biValue: 255n }, (_strKey, vValue: unknown) => (typeof vValue === "bigint" ? `0x${vValue.toString(16)}` : vValue));
console.log("6) JSON with a replacer :", strJson, "→", BigInt((JSON.parse(strJson) as { biValue: string }).biValue));

// 7) 정수가 아닌 텍스트 변환
try {
	console.log(BigInt("12a"));
} catch (e) {
	console.log(`7) Expected error: ${String(e)}`);
	console.log("   Why : BigInt() takes whole integer text only (\"255\", \"0xFF\", \"-7\"). It has no 12a, 1Fh or 1_000.");
	console.log("   Fix : parse the text yourself (lesson 03's ParseInteger), or check it with a regex first.");
}
