//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 04-classes-errors / calc (build a two-number calculator)
//	History			: 2026-10-15 CYBERKDH Initial
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// 1) [JS + TS] Operators : an as const array → literal union, plus a type guard
const OPERATORS = ["+", "-", "*", "/", "&", "|", "<<"] as const;
type TOperator = (typeof OPERATORS)[number];

function IsOperator(strText: string): strText is TOperator {
	return (OPERATORS as readonly string[]).includes(strText);
}

// 2) [JS + TS] Our own error : a message for "why" and strFix for "what to do"
class CCalcError extends Error {
	override readonly name = "CCalcError";
	readonly strFix: string;

	constructor(strMessage: string, strFix: string, oOptions?: ErrorOptions) {
		super(strMessage, oOptions);
		this.strFix = strFix;
	}
}

// 3) [JS + TS] The word size : #biBits is private, the rest is read through getters
type TWordBits = 8 | 16 | 32 | 64;

class CWordSize {
	readonly nBits: TWordBits;
	readonly #biBits: bigint;

	constructor(nBits: TWordBits) {
		this.nBits = nBits;
		this.#biBits = BigInt(nBits);
	}

	get biMax(): bigint {
		return (1n << this.#biBits) - 1n;
	}

	ToUnsigned(biValue: bigint): bigint {
		return BigInt.asUintN(this.nBits, biValue);
	}

	ToSigned(biValue: bigint): bigint {
		return BigInt.asIntN(this.nBits, biValue);
	}
}

// 4) [JS + TS] The calculator : parse → check → apply → wrap. Problems are thrown as CCalcError.
class CCalculator {
	readonly #oWord: CWordSize;

	constructor(oWord: CWordSize) {
		this.#oWord = oWord;
	}

	Run(strExpr: string): bigint {
		const [strA = "", strOp = "", strB = "", ...arrRest] = strExpr.trim().split(/\s+/);
		if (arrRest.length > 0 || strB === "") {
			throw new CCalcError("expected <number> <operator> <number>", 'write it like "0xFF + 1".');
		}
		if (!IsOperator(strOp)) {
			throw new CCalcError(`"${strOp}" is not an operator`, `use one of ${OPERATORS.join(" ")}`);
		}
		const biA = this.#Parse(strA);
		const biB = this.#Parse(strB);
		return this.#oWord.ToUnsigned(this.#Apply(biA, strOp, biB));
	}

	#Parse(strText: string): bigint {
		try {
			return this.#oWord.ToUnsigned(BigInt(strText)); // BigInt() itself throws SyntaxError
		} catch (e) {
			throw new CCalcError(`"${strText}" is not an integer`, "use 255, 0xFF, 0b1010 or 0o17.", { cause: e });
		}
	}

	#Apply(biA: bigint, strOp: TOperator, biB: bigint): bigint {
		switch (strOp) {
			case "+":
				return biA + biB;
			case "-":
				return biA - biB;
			case "*":
				return biA * biB;
			case "/":
				if (biB === 0n) {
					throw new CCalcError("division by zero", "the right side of / must not be 0.");
				}
				return biA / biB;
			case "&":
				return biA & biB;
			case "|":
				return biA | biB;
			case "<<":
				return biA << biB;
			default:
				return AssertNever(strOp);
		}
	}
}

function AssertNever(vValue: never): never {
	throw new Error(`Unexpected value: ${String(vValue)}`);
}

// 5) [JS + TS] Use it : only CCalcError is handled here, anything else would be a bug
const oWord = new CWordSize(8);
const oCalc = new CCalculator(oWord);
const arrExpr = ["0xF0 | 0x0F", "0xFF + 1", "0 - 1", "1 << 7", "200 * 2", "10 / 0", "12a + 1", "3 % 2", "1 +"];

console.log(`8-bit calculator (0..${oWord.biMax})`);
for (const strExpr of arrExpr) {
	try {
		const biResult = oCalc.Run(strExpr);
		const strHex = biResult.toString(16).toUpperCase().padStart(2, "0");
		console.log(`  ${strExpr.padEnd(12)} = 0x${strHex} (${biResult}, signed ${oWord.ToSigned(biResult)})`);
	} catch (e) {
		if (!(e instanceof CCalcError)) {
			throw e;
		}
		const strCause = e.cause instanceof Error ? ` [cause: ${e.cause.name}]` : "";
		console.log(`  ${strExpr.padEnd(12)} → ${e.name}: ${e.message}${strCause} / Fix : ${e.strFix}`);
	}
}
