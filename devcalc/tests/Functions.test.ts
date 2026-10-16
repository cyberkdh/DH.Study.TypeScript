//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: devcalc / tests / Functions
//	History			: 2026-10-15 CYBERKDH Initial - Lesson 13 DevCalc step
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

import { describe, expect, test } from "vitest";
import { CallFunction, CheckArgCount, FunctionHelp, IsFunction, type TFunction } from "../src/core/Functions.ts";
import { CWordSize } from "../src/core/WordSize.ts";

const BYTE = new CWordSize(8);
const DWORD = new CWordSize(32);

// The result, or the error message (CallFunction throws CCalcError)
function Call(eFunction: TFunction, arrArg: readonly bigint[], oWord?: CWordSize): bigint | string {
	try {
		return CallFunction(eFunction, arrArg, oWord);
	} catch (e) {
		return (e as Error).message;
	}
}

describe("CallFunction", () => {
	test("abs, min, max : signed abs in a word, unsigned compare", () => {
		expect(Call("abs", [-5n])).toBe(5n);
		expect(Call("abs", [0xfbn], BYTE)).toBe(5n); // 0xFB is -5 as a signed byte
		expect(Call("min", [3n, 1n, 2n])).toBe(1n);
		expect(Call("max", [3n, -10n, 2n])).toBe(3n);
		expect(Call("min", [-1n, 1n], BYTE)).toBe(1n); // -1 is 0xFF : the largest byte
	});

	test("bits : bit, popcount, clz, ctz, log2", () => {
		expect(Call("bit", [4n])).toBe(16n);
		expect(Call("bit", [8n], BYTE)).toBe("bit 8 is out of range");
		expect(Call("popcount", [0xf0f0n])).toBe(8n);
		expect(Call("popcount", [-1n], BYTE)).toBe(8n);
		expect(Call("popcount", [-1n])).toBe("popcount(-1) : a negative number has endless 1 bits");
		expect(Call("clz", [1n], DWORD)).toBe(31n);
		expect(Call("clz", [0n], BYTE)).toBe(8n);
		expect(Call("clz", [1n])).toBe("clz(x) needs a word size");
		expect(Call("ctz", [0x50n])).toBe(4n);
		expect(Call("ctz", [0n], BYTE)).toBe(8n);
		expect(Call("ctz", [0n])).toBe("ctz(0) : 0 has endless 0 bits");
		expect(Call("log2", [1024n])).toBe(10n);
		expect(Call("log2", [1023n])).toBe(9n);
		expect(Call("log2", [0n])).toBe("log2(0) has no answer");
	});

	test("words : bswap, rol, ror", () => {
		expect(Call("bswap", [0x12345678n], DWORD)).toBe(0x78563412n);
		expect(Call("bswap", [0xabn], BYTE)).toBe(0xabn);
		expect(Call("rol", [0x81n, 1n], BYTE)).toBe(0x03n);
		expect(Call("ror", [0x81n, 1n], BYTE)).toBe(0xc0n);
		expect(Call("rol", [0x81n, 8n], BYTE)).toBe(0x81n); // a full turn
		expect(Call("rol", [0x12345678n, 8n], DWORD)).toBe(0x34567812n);
	});

	test("align rounds up, also below zero", () => {
		expect(Call("align", [250n, 16n])).toBe(256n);
		expect(Call("align", [256n, 16n])).toBe(256n);
		expect(Call("align", [-5n, 4n])).toBe(-4n);
		expect(Call("align", [5n, 0n])).toBe("align(5, 0) : n must be above 0");
	});

	test("a wrong count is an error here too (for callers that skip the parser)", () => {
		expect(Call("rol", [1n], BYTE)).toBe("rol(x, n) takes 2 arguments, found 1");
		expect(CheckArgCount("max", 5)).toBeUndefined();
	});
});

describe("names and help", () => {
	test("IsFunction : own keys only", () => {
		expect(IsFunction("popcount")).toBe(true);
		expect(IsFunction("toString")).toBe(false); // on Object.prototype, not in the table
		expect(IsFunction("__proto__")).toBe(false);
	});

	test("FunctionHelp : both overloads", () => {
		expect(FunctionHelp()).toBe("abs min max bit popcount clz ctz log2 bswap rol ror align");
		expect(FunctionHelp("ROL")).toBe("rol(x, n)      rotate left by n bits (needs a word size)");
		expect(FunctionHelp("nope")).toBeUndefined();
	});
});
