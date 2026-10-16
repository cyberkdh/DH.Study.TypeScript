//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 12-bigint-words / formats
//	History			: 2026-10-15 CYBERKDH Initial
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// Build it : one value in six forms (HEX DEC INT OCT BIN CHAR), for any word size up to 128 bits.
// The rows are one table checked with satisfies, and the order is a separate list

type ERow = "HEX" | "DEC" | "INT" | "OCT" | "BIN" | "CHAR";
type TBits = 8 | 16 | 32 | 64 | 128;

interface IRowSpec {
	readonly fnFormat: (biUnsigned: bigint, nBits: TBits) => string; // biUnsigned is already cut to nBits
}

// 1) [TS] Digits padded to the word size : 4 bits per hex digit, 3 per octal digit (rounded up), 1 per binary digit
function Digits(biValue: bigint, nRadix: number, nBitsPerDigit: number, nBits: TBits): string {
	return biValue.toString(nRadix).toUpperCase().padStart(Math.ceil(nBits / nBitsPerDigit), "0");
}

// 2) [JS] The bytes as a character literal : printable ASCII as is, the rest as escapes
const CHAR_ESCAPES: Readonly<Record<number, string>> = { 0: "\\0", 9: "\\t", 10: "\\n", 13: "\\r", 39: "\\'", 92: "\\\\" };

function CharText(biValue: bigint): string {
	const arrByte: number[] = [];
	for (let biRest = biValue; biRest > 0n; biRest >>= 8n) {
		arrByte.unshift(Number(biRest & 0xffn));
	}
	const strBody = (arrByte.length > 0 ? arrByte : [0])
		.map((nByte) => CHAR_ESCAPES[nByte] ?? (nByte >= 0x20 && nByte <= 0x7e ? String.fromCharCode(nByte) : `\\x${nByte.toString(16).toUpperCase().padStart(2, "0")}`))
		.join("");
	return `'${strBody}'`;
}

// 3) [TS] The table. satisfies checks that every ERow is there, and types biUnsigned and nBits in each function
const ROWS = {
	HEX: { fnFormat: (biUnsigned, nBits) => "0x" + Digits(biUnsigned, 16, 4, nBits) },
	DEC: { fnFormat: (biUnsigned) => String(biUnsigned) },
	INT: { fnFormat: (biUnsigned, nBits) => String(BigInt.asIntN(nBits, biUnsigned)) },
	OCT: { fnFormat: (biUnsigned, nBits) => "0o" + Digits(biUnsigned, 8, 3, nBits) },
	BIN: { fnFormat: (biUnsigned, nBits) => "0b" + Digits(biUnsigned, 2, 1, nBits) },
	CHAR: { fnFormat: (biUnsigned) => CharText(biUnsigned) },
} satisfies Record<ERow, IRowSpec>;

// 4) [TS] The order : only real row names, and a tuple type that remembers the order
const ROW_ORDER = ["HEX", "DEC", "INT", "OCT", "BIN", "CHAR"] as const satisfies readonly ERow[];

function Show(biValue: bigint, nBits: TBits, arrRow: readonly ERow[] = ROW_ORDER): void {
	const biUnsigned = BigInt.asUintN(nBits, biValue); // one place cuts the value; every row reads the same bits
	console.log(`${biValue} in ${nBits} bits`);
	for (const eRow of arrRow) {
		console.log(`  ${eRow.padEnd(4)} : ${ROWS[eRow].fnFormat(biUnsigned, nBits)}`);
	}
}

// 5) Try it : the same table at 8, 32 and 128 bits
Show(-1n, 8);
Show(0x48690A00n, 32); // 'Hi\n\0'
Show(-2n, 128, ["HEX", "INT", "OCT"]);
// Show(1n, 12); // ← Uncomment → TS2345 (Argument of type '12' is not assignable to parameter of type 'TBits')
// Show(1n, 8, ["HEX", "UDEC"]); // ← Uncomment → TS2820 (Type '"UDEC"' is not assignable to type 'ERow'. Did you mean '"DEC"'?)

// 6) A value that is wider than the word
const biWide = 0x1_0000_0041n;
const biCut = BigInt.asUintN(8, biWide);
if (biCut !== biWide) {
	console.log(`Note: ${biWide} does not fit in 8 bits, so every row shows the low 8 bits (${biCut}).`);
}
Show(biWide, 8, ["HEX", "CHAR"]);
