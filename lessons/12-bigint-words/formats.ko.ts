//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 12-bigint-words / formats (출력 형식)
//	History			: 2026-10-15 CYBERKDH Initial (최초 작성)
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// 직접 만들기 : 값 하나를 여섯 가지 형태 (HEX DEC INT OCT BIN CHAR) 로. 128 비트까지 어떤 워드 크기든.
// 행 (row) 은 satisfies 로 검사하는 표 하나이고, 순서는 따로 둔 목록

type ERow = "HEX" | "DEC" | "INT" | "OCT" | "BIN" | "CHAR";
type TBits = 8 | 16 | 32 | 64 | 128;

interface IRowSpec {
	readonly fnFormat: (biUnsigned: bigint, nBits: TBits) => string; // biUnsigned 는 이미 nBits 로 잘린 값
}

// 1) [TS] 워드 크기에 맞춰 0 으로 채운 자릿수 : 16진수 한 자리는 4 비트, 8진수는 3 비트 (올림), 2진수는 1 비트
function Digits(biValue: bigint, nRadix: number, nBitsPerDigit: number, nBits: TBits): string {
	return biValue.toString(nRadix).toUpperCase().padStart(Math.ceil(nBits / nBitsPerDigit), "0");
}

// 2) [JS] 바이트를 문자 리터럴로 : 출력 가능한 ASCII 는 그대로, 나머지는 이스케이프 (escape)
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

// 3) [TS] 표. satisfies 가 ERow 가 모두 있는지 검사하고, 각 함수의 biUnsigned 와 nBits 에 타입을 줌
const ROWS = {
	HEX: { fnFormat: (biUnsigned, nBits) => "0x" + Digits(biUnsigned, 16, 4, nBits) },
	DEC: { fnFormat: (biUnsigned) => String(biUnsigned) },
	INT: { fnFormat: (biUnsigned, nBits) => String(BigInt.asIntN(nBits, biUnsigned)) },
	OCT: { fnFormat: (biUnsigned, nBits) => "0o" + Digits(biUnsigned, 8, 3, nBits) },
	BIN: { fnFormat: (biUnsigned, nBits) => "0b" + Digits(biUnsigned, 2, 1, nBits) },
	CHAR: { fnFormat: (biUnsigned) => CharText(biUnsigned) },
} satisfies Record<ERow, IRowSpec>;

// 4) [TS] 순서 : 실제 행 이름만 쓸 수 있고, 순서를 기억하는 튜플 (tuple) 타입
const ROW_ORDER = ["HEX", "DEC", "INT", "OCT", "BIN", "CHAR"] as const satisfies readonly ERow[];

function Show(biValue: bigint, nBits: TBits, arrRow: readonly ERow[] = ROW_ORDER): void {
	const biUnsigned = BigInt.asUintN(nBits, biValue); // 값을 자르는 곳은 한 군데. 모든 행이 같은 비트를 읽음
	console.log(`${biValue} in ${nBits} bits`);
	for (const eRow of arrRow) {
		console.log(`  ${eRow.padEnd(4)} : ${ROWS[eRow].fnFormat(biUnsigned, nBits)}`);
	}
}

// 5) 실행해 보기 : 같은 표를 8, 32, 128 비트로
Show(-1n, 8);
Show(0x48690A00n, 32); // 'Hi\n\0'
Show(-2n, 128, ["HEX", "INT", "OCT"]);
// Show(1n, 12); // ← 주석 해제 → TS2345 (Argument of type '12' is not assignable to parameter of type 'TBits')
// Show(1n, 8, ["HEX", "UDEC"]); // ← 주석 해제 → TS2820 (Type '"UDEC"' is not assignable to type 'ERow'. Did you mean '"DEC"'?)

// 6) 워드보다 넓은 값
const biWide = 0x1_0000_0041n;
const biCut = BigInt.asUintN(8, biWide);
if (biCut !== biWide) {
	console.log(`Note: ${biWide} does not fit in 8 bits, so every row shows the low 8 bits (${biCut}).`);
}
Show(biWide, 8, ["HEX", "CHAR"]);
