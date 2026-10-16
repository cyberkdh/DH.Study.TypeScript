//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: devcalc / core / Calculator (Two-number calculation)
//	History			: 2026-10-15 CYBERKDH Initial - Lesson 04 DevCalc step, Lv3
//					  2026-10-15 CYBERKDH Lesson 08: OPERATOR_TABLE (satisfies), TOperator from its keys, OperatorName
//					  2026-10-15 CYBERKDH Lesson 10: nPrecedence column, OperatorPrecedence (for the parser)
//					  2026-10-15 CYBERKDH Lesson 11: ** and >>> (eAssoc, "power" / "unsigned shift" checks), >> keeps the sign,
//					                             UNARY_TABLE (- ~), CalculateUnary, OperatorHelp
//					  2026-10-15 CYBERKDH Lesson 12: the word size hint lists 128
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

import type { CWordSize } from "./WordSize.ts";

// Lesson 08: one table describes every operator. TOperator is made from its keys,
// so a new operator is one new row (name, check, how to apply) and nothing else.
type ECheck = "none" | "divisor" | "shift" | "unsigned shift" | "power";
type EAssoc = "left" | "right";

interface IOperatorSpec {
	readonly strName: string;
	readonly nPrecedence: number; // lesson 10 : higher binds tighter (C / JavaScript order)
	readonly eAssoc?: EAssoc; // lesson 11 : "right" for ** (2 ** 3 ** 2 = 2 ** 9). Default "left"
	readonly eCheck: ECheck; // what to check before applying
	readonly fnApply: (biA: bigint, biB: bigint, oWord: CWordSize | undefined) => bigint; // lesson 11 : the word size, for >> and >>>
}

// satisfies : every row is checked against IOperatorSpec, but the exact keys are kept for TOperator
const OPERATOR_TABLE = {
	"+": { strName: "add", nPrecedence: 5, eCheck: "none", fnApply: (biA, biB) => biA + biB },
	"-": { strName: "subtract", nPrecedence: 5, eCheck: "none", fnApply: (biA, biB) => biA - biB },
	"*": { strName: "multiply", nPrecedence: 6, eCheck: "none", fnApply: (biA, biB) => biA * biB },
	"/": { strName: "divide", nPrecedence: 6, eCheck: "divisor", fnApply: (biA, biB) => biA / biB },
	"%": { strName: "remainder", nPrecedence: 6, eCheck: "divisor", fnApply: (biA, biB) => biA % biB },
	"**": { strName: "power", nPrecedence: 7, eAssoc: "right", eCheck: "power", fnApply: (biA, biB) => biA ** biB },
	"&": { strName: "and", nPrecedence: 3, eCheck: "none", fnApply: (biA, biB) => biA & biB },
	"|": { strName: "or", nPrecedence: 1, eCheck: "none", fnApply: (biA, biB) => biA | biB },
	"^": { strName: "xor", nPrecedence: 2, eCheck: "none", fnApply: (biA, biB) => biA ^ biB },
	"<<": { strName: "shift left", nPrecedence: 4, eCheck: "shift", fnApply: (biA, biB) => biA << biB },
	// lesson 11 : >> keeps the sign (0x80 >> 1 = 0xC0 in 8 bits), >>> fills with 0 (0x80 >>> 1 = 0x40), as in C# and JavaScript
	">>": { strName: "shift right", nPrecedence: 4, eCheck: "shift", fnApply: (biA, biB, oWord) => (oWord === undefined ? biA : oWord.ToSigned(biA)) >> biB },
	">>>": { strName: "unsigned shift right", nPrecedence: 4, eCheck: "unsigned shift", fnApply: (biA, biB, oWord) => (oWord === undefined ? biA : oWord.ToUnsigned(biA)) >> biB },
} satisfies Record<string, IOperatorSpec>;

export type TOperator = keyof typeof OPERATOR_TABLE; // "+" | "-" | ... | ">>>"

// Lesson 11: operators with one operand, written before it : -x, ~x
interface IUnarySpec {
	readonly strName: string;
	readonly fnApply: (biA: bigint, oWord: CWordSize | undefined) => bigint;
}

const UNARY_TABLE = {
	"-": { strName: "negate", fnApply: (biA) => -biA },
	"~": { strName: "not", fnApply: (biA, oWord) => (oWord === undefined ? ~biA : oWord.ToUnsigned(~biA)) }, // every bit flipped : ~0 = 0xFF (8-bit), -1 without a word size
} satisfies Record<string, IUnarySpec>;

export type TUnaryOperator = keyof typeof UNARY_TABLE; // "-" | "~"

export function IsOperator(strText: string): strText is TOperator {
	return Object.hasOwn(OPERATOR_TABLE, strText); // own keys only : "toString" is not an operator
}

export function IsUnaryOperator(strText: string): strText is TUnaryOperator {
	return Object.hasOwn(UNARY_TABLE, strText);
}

// The binary operators : "+ - * / % ** & | ^ << >> >>>"
export function OperatorList(): string {
	return Object.keys(OPERATOR_TABLE).join(" ");
}

// Lesson 11: every operator, for help and error messages
export function OperatorHelp(): string {
	return `${OperatorList()}, unary ${Object.keys(UNARY_TABLE).join(" ")}`;
}

export function OperatorName(strOp: TOperator): string {
	return OPERATOR_TABLE[strOp].strName;
}

// Lesson 10: 1 + 2 * 3 is 1 + (2 * 3) because * has the higher number
export function OperatorPrecedence(strOp: TOperator): number {
	return OPERATOR_TABLE[strOp].nPrecedence;
}

// Lesson 11: 8 - 4 - 2 groups to the left, 2 ** 3 ** 2 to the right
export function OperatorAssoc(strOp: TOperator): EAssoc {
	const oSpec: IOperatorSpec = OPERATOR_TABLE[strOp]; // as the interface : most rows have no eAssoc property
	return oSpec.eAssoc ?? "left";
}

// A calculation that can't be done. strFix says what the user can do about it.
export class CCalcError extends Error {
	override readonly name = "CCalcError";
	readonly strFix: string;

	constructor(strMessage: string, strFix: string, oOptions?: ErrorOptions) {
		super(strMessage, oOptions);
		this.strFix = strFix;
	}
}

export interface ICalcResult {
	readonly biValue: bigint; // the result (wrapped to the word size, if any)
	readonly biExact: bigint; // the exact result before wrapping
	readonly bOverflow: boolean; // biExact did not fit in the word size
}

const MAX_SHIFT_UNLIMITED = 4096n;
const MAX_POWER_BITS = 4096n; // 3 ** 1_000_000 would take seconds and megabytes

export class CCalculator {
	readonly #oWord: CWordSize | undefined; // undefined = no word size (unlimited)

	constructor(oWord?: CWordSize) {
		this.#oWord = oWord;
	}

	// With a word size, the operands are wrapped to unsigned first (like a programmer calculator)
	Calculate(biA: bigint, strOp: TOperator, biB: bigint): ICalcResult {
		const oWord = this.#oWord;
		if (oWord === undefined) {
			return this.#Result(this.#Apply(biA, strOp, biB));
		}
		return this.#Result(this.#Apply(oWord.ToUnsigned(biA), strOp, oWord.ToUnsigned(biB)));
	}

	// Lesson 11: -x and ~x, wrapped the same way
	CalculateUnary(strOp: TUnaryOperator, biA: bigint): ICalcResult {
		const oWord = this.#oWord;
		return this.#Result(UNARY_TABLE[strOp].fnApply(oWord === undefined ? biA : oWord.ToUnsigned(biA), oWord));
	}

	#Result(biExact: bigint): ICalcResult {
		const oWord = this.#oWord;
		if (oWord === undefined) {
			return { biValue: biExact, biExact, bOverflow: false };
		}
		return { biValue: oWord.ToUnsigned(biExact), biExact, bOverflow: !oWord.Fits(biExact) };
	}

	#Apply(biA: bigint, strOp: TOperator, biB: bigint): bigint {
		const oSpec: IOperatorSpec = OPERATOR_TABLE[strOp];
		switch (oSpec.eCheck) {
			case "none":
				break;
			case "divisor":
				if (biB === 0n) {
					throw new CCalcError("division by zero", `the right side of ${strOp} must not be 0.`);
				}
				break;
			case "shift":
				this.#CheckShift(biB);
				break;
			case "unsigned shift":
				this.#CheckShift(biB);
				if (this.#oWord === undefined && biA < 0n) {
					throw new CCalcError(`${strOp} of a negative number needs a word size`, "choose a word size (--bits=8|16|32|64|128), or use >>.");
				}
				break;
			case "power":
				this.#CheckPower(biA, biB);
				break;
			default:
				return AssertNever(oSpec.eCheck); // a new ECheck member must be handled here
		}
		return oSpec.fnApply(biA, biB, this.#oWord);
	}

	#CheckShift(biCount: bigint): void {
		const biMax = this.#oWord === undefined ? MAX_SHIFT_UNLIMITED : BigInt(this.#oWord.nBits);
		if (biCount < 0n || biCount > biMax) {
			throw new CCalcError(`shift count ${biCount} is out of range`, `use a shift count from 0 to ${biMax}.`);
		}
	}

	// Lesson 11: integers only, and a result small enough to calculate
	#CheckPower(biBase: bigint, biExponent: bigint): void {
		if (biExponent < 0n) {
			throw new CCalcError(`negative exponent ${biExponent}`, "DevCalc has integers only : use an exponent of 0 or more.");
		}
		const biAbs = biBase < 0n ? -biBase : biBase;
		const biLow = BigInt(biAbs.toString(2).length - 1); // the result has at least biLow * biExponent bits
		if (biLow * biExponent > MAX_POWER_BITS) {
			throw new CCalcError(`${biBase} ** ${biExponent} has more than ${MAX_POWER_BITS} bits`, `keep the result under ${MAX_POWER_BITS} bits.`);
		}
	}
}

function AssertNever(vValue: never): never {
	throw new Error(`Unexpected value: ${String(vValue)}`);
}
