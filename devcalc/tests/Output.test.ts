//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: devcalc / tests / Output
//	History			: 2026-10-15 CYBERKDH Initial - Lesson 12 DevCalc step
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

import { describe, expect, test } from "vitest";
import { OutputHelp, OutputRows, ROW_ORDER } from "../src/core/Output.ts";
import { CWordSize } from "../src/core/WordSize.ts";

// "HEX=0xFF DEC=255 ..." : one string to compare
function Rows(biValue: bigint, oWord: CWordSize | undefined, bAll: boolean): string {
	return OutputRows(biValue, {}, oWord, bAll)
		.map(({ eRow, strText }) => `${eRow}=${strText}`)
		.join(" ");
}

describe("OutputRows", () => {
	test("default rows : HEX DEC BIN, and INT only with a word size", () => {
		expect(Rows(255n, undefined, false)).toBe("HEX=0xFF DEC=255 BIN=0b11111111");
		expect(Rows(255n, new CWordSize(8), false)).toBe("HEX=0xFF DEC=255 BIN=0b11111111 INT=-1");
	});

	test("all rows add OCT and CHAR", () => {
		expect(Rows(0x41n, new CWordSize(8), true)).toBe("HEX=0x41 DEC=65 BIN=0b1000001 INT=65 OCT=0o101 CHAR='A'");
	});

	test("a negative number without a word size has no CHAR row", () => {
		expect(Rows(-1n, undefined, true)).toBe("HEX=-0x1 DEC=-1 BIN=-0b1 OCT=-0o1");
	});

	test("128-bit words", () => {
		const oWord = new CWordSize(128);
		expect(oWord.strName).toBe("OWORD");
		expect(oWord.ToUnsigned(-1n)).toBe(2n ** 128n - 1n);
		expect(oWord.ToSigned(2n ** 127n)).toBe(-(2n ** 127n));
		expect(Rows(oWord.ToUnsigned(-1n), oWord, false)).toContain("INT=-1");
	});

	test("every row has help text, in display order", () => {
		expect(ROW_ORDER).toEqual(["HEX", "DEC", "BIN", "INT", "OCT", "CHAR"]);
		expect(OutputHelp().split(" · ").map((strPart) => strPart.split(" ")[0])).toEqual([...ROW_ORDER]);
	});
});
