//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 04-classes-errors / wordsize (워드 크기와 오버플로)
//	History			: 2026-10-15 CYBERKDH Initial (최초 작성)
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// 1) [JS] BigInt.asUintN / asIntN : 하위 N 비트만 남기고, 부호 없는 / 부호 있는 수 (2의 보수, two's complement) 로 읽음
for (const biValue of [255n, 256n, -1n, -128n]) {
	const strValue = String(biValue).padStart(4);
	console.log(`1) ${strValue} → 8-bit unsigned ${BigInt.asUintN(8, biValue)}, signed ${BigInt.asIntN(8, biValue)}`);
}

// 2) [JS] 워드 크기별 -1 : 모든 비트가 1
for (const nBits of [8, 16, 32, 64]) {
	const strHex = BigInt.asUintN(nBits, -1n).toString(16).toUpperCase();
	console.log(`2) -1 as ${String(nBits).padStart(2)}-bit = 0x${strHex}`);
}

// 3) [TS] 비트 수를 리터럴 유니온으로 받는 워드 크기 클래스
type TWordBits = 8 | 16 | 32 | 64;

class CWordSize {
	readonly nBits: TWordBits;

	constructor(nBits: TWordBits) {
		this.nBits = nBits;
	}

	get biMaxUnsigned(): bigint {
		return (1n << BigInt(this.nBits)) - 1n;
	}

	get biMinSigned(): bigint {
		return -(1n << BigInt(this.nBits - 1));
	}

	get biMaxSigned(): bigint {
		return (1n << BigInt(this.nBits - 1)) - 1n;
	}
}
// new CWordSize(12); // ← 주석을 풀면 빨간 줄 TS2345 (12 는 TWordBits 가 아님)
for (const nBits of [8, 16, 32] as const) {
	const oWord = new CWordSize(nBits);
	console.log(`3) ${nBits}-bit : unsigned 0..${oWord.biMaxUnsigned}, signed ${oWord.biMinSigned}..${oWord.biMaxSigned}`);
}

// 4) [JS] 오버플로 (overflow) : 0xFF + 1 은 8 비트에 안 들어가므로 0 으로 돌아감 (C# byte : 기본값 unchecked 와 같음)
const biSum = 0xffn + 1n;
console.log("4) 0xFF + 1 =", biSum, "→ 8-bit", BigInt.asUintN(8, biSum));

// 5) [JS] DevCalc 가 bigint 를 쓰는 이유 : number 의 비트 연산자는 32 비트 부호 있는 정수로 계산함
console.log("5) number : 0xFFFFFFFF | 0 =", 0xffffffff | 0, "/ 1 << 31 =", 1 << 31);
console.log("   bigint : 0xFFFFFFFFn | 0n =", 0xffffffffn | 0n, "/ 1n << 31n =", 1n << 31n);
