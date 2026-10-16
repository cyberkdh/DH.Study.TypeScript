//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 12-bigint-words / words
//	History			: 2026-10-15 CYBERKDH Initial
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// Fixed-size words with bigint : BigInt.asUintN, BigInt.asIntN, two's complement, byte order

// 1) [JS] asUintN keeps the low N bits. asIntN reads the same bits as a signed number
const arrInput = [255n, 256n, -1n, 200n];
for (const biValue of arrInput) {
	console.log(`1) ${String(biValue).padStart(4)} → asUintN(8) = ${String(BigInt.asUintN(8, biValue)).padStart(3)} · asIntN(8) = ${BigInt.asIntN(8, biValue)}`);
}

// 2) [JS] Two's complement : -1 is all ones in every word size
function Hex(biValue: bigint, nBits: number): string {
	return "0x" + BigInt.asUintN(nBits, biValue).toString(16).toUpperCase().padStart(nBits / 4, "0");
}
for (const nBits of [8, 16, 32, 64, 128]) {
	console.log(`2) -1 in ${String(nBits).padStart(3)} bits = ${Hex(-1n, nBits)}`);
}

// 3) [JS] The ranges come from shifts, not from a table of magic numbers
for (const nBits of [8, 16, 32, 64, 128]) {
	const biBits = BigInt(nBits);
	const biMaxUnsigned = (1n << biBits) - 1n;
	const biMinSigned = -(1n << (biBits - 1n));
	console.log(`3) ${String(nBits).padStart(3)} bits : 0 .. ${biMaxUnsigned} · ${biMinSigned} .. ${-biMinSigned - 1n}`);
}

// 4) [JS] Widening a byte to 16 bits : zero extension for unsigned, sign extension for signed
const biByte = 0x80n;
const biZero = BigInt.asUintN(16, BigInt.asUintN(8, biByte));
const biSign = BigInt.asUintN(16, BigInt.asIntN(8, biByte));
console.log(`4) 0x80 → zero extend ${Hex(biZero, 16)} · sign extend ${Hex(biSign, 16)}`);

// 5) [JS] DataView writes a 64-bit value as 8 bytes, in big or little endian order
const oView = new DataView(new ArrayBuffer(8));
function Bytes(oDataView: DataView): string {
	return Array.from(new Uint8Array(oDataView.buffer), (nByte) => nByte.toString(16).padStart(2, "0")).join(" ");
}
oView.setBigUint64(0, 0x0102030405060708n); // big endian by default
console.log("5) big endian    :", Bytes(oView));
oView.setBigUint64(0, 0x0102030405060708n, true); // true = little endian (x86, ARM)
console.log("5) little endian :", Bytes(oView), "→ read back", Hex(oView.getBigUint64(0, true), 64));

// 6) [JS] A 128-bit value does not fit in a DataView call : split it into two 64-bit halves
const biWide = (0x0123456789ABCDEFn << 64n) | 0xFEDCBA9876543210n;
const biHigh = biWide >> 64n;
const biLow = BigInt.asUintN(64, biWide);
console.log(`6) ${Hex(biWide, 128)} = high ${Hex(biHigh, 64)} + low ${Hex(biLow, 64)}`);
console.log(`6) joined again : ${(biHigh << 64n | biLow) === biWide}`);

// 7) Reading past the end of the buffer
try {
	oView.getBigUint64(4);
} catch (e) {
	console.log(`7) Expected error: ${String(e)}`);
	console.log("   Why : 8 bytes from offset 4 need bytes 4..11, and the buffer has only 8 (0..7).");
	console.log("   Fix : check nOffset + 8 <= oView.byteLength first, or make the buffer larger.");
}
