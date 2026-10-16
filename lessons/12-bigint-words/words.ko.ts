//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 12-bigint-words / words (워드)
//	History			: 2026-10-15 CYBERKDH Initial (최초 작성)
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// bigint 로 고정 크기 워드 (word) 다루기 : BigInt.asUintN, BigInt.asIntN, 2의 보수 (two's complement), 바이트 순서 (byte order)

// 1) [JS] asUintN 은 아래 N 비트만 남김. asIntN 은 같은 비트를 부호 있는 수로 읽음
const arrInput = [255n, 256n, -1n, 200n];
for (const biValue of arrInput) {
	console.log(`1) ${String(biValue).padStart(4)} → asUintN(8) = ${String(BigInt.asUintN(8, biValue)).padStart(3)} · asIntN(8) = ${BigInt.asIntN(8, biValue)}`);
}

// 2) [JS] 2의 보수 : -1 은 모든 워드 크기에서 전부 1
function Hex(biValue: bigint, nBits: number): string {
	return "0x" + BigInt.asUintN(nBits, biValue).toString(16).toUpperCase().padStart(nBits / 4, "0");
}
for (const nBits of [8, 16, 32, 64, 128]) {
	console.log(`2) -1 in ${String(nBits).padStart(3)} bits = ${Hex(-1n, nBits)}`);
}

// 3) [JS] 범위는 마법의 숫자 표가 아니라 시프트 (shift) 로 계산
for (const nBits of [8, 16, 32, 64, 128]) {
	const biBits = BigInt(nBits);
	const biMaxUnsigned = (1n << biBits) - 1n;
	const biMinSigned = -(1n << (biBits - 1n));
	console.log(`3) ${String(nBits).padStart(3)} bits : 0 .. ${biMaxUnsigned} · ${biMinSigned} .. ${-biMinSigned - 1n}`);
}

// 4) [JS] 바이트를 16 비트로 넓히기 : 부호 없으면 0 확장 (zero extension), 부호 있으면 부호 확장 (sign extension)
const biByte = 0x80n;
const biZero = BigInt.asUintN(16, BigInt.asUintN(8, biByte));
const biSign = BigInt.asUintN(16, BigInt.asIntN(8, biByte));
console.log(`4) 0x80 → zero extend ${Hex(biZero, 16)} · sign extend ${Hex(biSign, 16)}`);

// 5) [JS] DataView 는 64 비트 값을 8 바이트로 씀. 빅 엔디언 (big endian) 또는 리틀 엔디언 (little endian) 순서
const oView = new DataView(new ArrayBuffer(8));
function Bytes(oDataView: DataView): string {
	return Array.from(new Uint8Array(oDataView.buffer), (nByte) => nByte.toString(16).padStart(2, "0")).join(" ");
}
oView.setBigUint64(0, 0x0102030405060708n); // 기본값은 빅 엔디언
console.log("5) big endian    :", Bytes(oView));
oView.setBigUint64(0, 0x0102030405060708n, true); // true = 리틀 엔디언 (x86, ARM)
console.log("5) little endian :", Bytes(oView), "→ read back", Hex(oView.getBigUint64(0, true), 64));

// 6) [JS] 128 비트 값은 DataView 호출 한 번에 안 들어감 : 64 비트 두 덩어리로 나눔
const biWide = (0x0123456789ABCDEFn << 64n) | 0xFEDCBA9876543210n;
const biHigh = biWide >> 64n;
const biLow = BigInt.asUintN(64, biWide);
console.log(`6) ${Hex(biWide, 128)} = high ${Hex(biHigh, 64)} + low ${Hex(biLow, 64)}`);
console.log(`6) joined again : ${(biHigh << 64n | biLow) === biWide}`);

// 7) 버퍼 (buffer) 끝을 넘어서 읽기
try {
	oView.getBigUint64(4);
} catch (e) {
	console.log(`7) Expected error: ${String(e)}`);
	console.log("   Why : 8 bytes from offset 4 need bytes 4..11, and the buffer has only 8 (0..7).");
	console.log("   Fix : check nOffset + 8 <= oView.byteLength first, or make the buffer larger.");
}
