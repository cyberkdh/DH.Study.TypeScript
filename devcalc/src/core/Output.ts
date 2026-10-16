//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: devcalc / core / Output (Which result rows to show, in which order)
//	History			: 2026-10-15 CYBERKDH Initial - Lesson 12 DevCalc step, Lv7
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// The command line and the web page showed HEX / DEC / BIN (+ INT) from two copies of the same list.
// Now one table describes every row, and both of them ask OutputRows() for the rows to show.
import { ToBin, ToChar, ToDec, ToHex, ToOct, type IFormatOptions } from "./Format.ts";
import type { CWordSize } from "./WordSize.ts";

export type ERow = "HEX" | "DEC" | "BIN" | "INT" | "OCT" | "CHAR";

interface IRowSpec {
	readonly bExtra: boolean; // shown only when all rows are asked for (--all, the web page)
	readonly strHelp: string;
	readonly fnFormat: (biValue: bigint, oOptions: IFormatOptions, oWord: CWordSize | undefined) => string | undefined; // undefined = no row
}

// satisfies : every ERow needs a row, and the functions get their parameter types from IRowSpec
const OUTPUT_ROWS = {
	HEX: { bExtra: false, strHelp: "hexadecimal", fnFormat: (biValue, oOptions) => ToHex(biValue, oOptions) },
	DEC: { bExtra: false, strHelp: "decimal (unsigned when a word size is set)", fnFormat: (biValue, oOptions) => ToDec(biValue, oOptions) },
	BIN: { bExtra: false, strHelp: "binary", fnFormat: (biValue, oOptions) => ToBin(biValue, oOptions) },
	INT: { bExtra: false, strHelp: "signed decimal (two's complement)", fnFormat: (biValue, oOptions, oWord) => (oWord === undefined ? undefined : ToDec(oWord.ToSigned(biValue), oOptions)) },
	OCT: { bExtra: true, strHelp: "octal", fnFormat: (biValue, oOptions) => ToOct(biValue, oOptions) },
	CHAR: { bExtra: true, strHelp: "the bytes as a character literal", fnFormat: (biValue) => ToChar(biValue) },
} as const satisfies Record<ERow, IRowSpec>;

// The order of the rows. Only real row names, each written once by hand
export const ROW_ORDER = ["HEX", "DEC", "BIN", "INT", "OCT", "CHAR"] as const satisfies readonly ERow[];

export interface IOutputRow {
	readonly eRow: ERow;
	readonly strText: string;
}

// The rows for one value : extra rows only with bAll, and a row that has nothing to show is left out
export function OutputRows(biValue: bigint, oOptions: IFormatOptions, oWord: CWordSize | undefined, bAll: boolean): IOutputRow[] {
	const arrRow: IOutputRow[] = [];
	for (const eRow of ROW_ORDER) {
		const oSpec: IRowSpec = OUTPUT_ROWS[eRow];
		const strText = bAll || !oSpec.bExtra ? oSpec.fnFormat(biValue, oOptions, oWord) : undefined;
		if (strText !== undefined) {
			arrRow.push({ eRow, strText });
		}
	}
	return arrRow;
}

// "HEX hexadecimal, DEC ..." for help texts
export function OutputHelp(): string {
	return ROW_ORDER.map((eRow) => `${eRow} ${OUTPUT_ROWS[eRow].strHelp}`).join(" · ");
}
