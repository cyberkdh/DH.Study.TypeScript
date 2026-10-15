//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: devcalc / core / Calculator (Two-number calculation)
//	History			: 2026-10-15 CYBERKDH Initial - Lesson 04 DevCalc step, Lv3
//					  2026-10-15 CYBERKDH Lesson 08: OPERATOR_TABLE (satisfies), TOperator from its keys, OperatorName
//					  2026-10-15 CYBERKDH Lesson 10: nPrecedence column, OperatorPrecedence (for the parser)
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

import type { CWordSize } from "./WordSize.ts";

// Lesson 08: one table describes every operator. TOperator is made from its keys,
// so a new operator is one new row (name, check, how to apply) and nothing else.
type ECheck = "none" | "divisor" | "shift";

interface IOperatorSpec {
	readonly strName: string;
	readonly nPrecedence: number; // lesson 10 : higher binds tighter (C / JavaScript order)
	readonly eCheck: ECheck; // what to check on the right side before applying
	readonly fnApply: (biA: bigint, biB: bigint) => bigint;
}

// satisfies : every row is checked against IOperatorSpec, but the exact keys are kept for TOperator
const OPERATOR_TABLE = {
	"+": { strName: "add", nPrecedence: 5, eCheck: "none", fnApply: (biA, biB) => biA + biB },
	"-": { strName: "subtract", nPrecedence: 5, eCheck: "none", fnApply: (biA, biB) => biA - biB },
	"*": { strName: "multiply", nPrecedence: 6, eCheck: "none", fnApply: (biA, biB) => biA * biB },
	"/": { strName: "divide", nPrecedence: 6, eCheck: "divisor", fnApply: (biA, biB) => biA / biB },
	"%": { strName: "remainder", nPrecedence: 6, eCheck: "divisor", fnApply: (biA, biB) => biA % biB },
	"&": { strName: "and", nPrecedence: 3, eCheck: "none", fnApply: (biA, biB) => biA & biB },
	"|": { strName: "or", nPrecedence: 1, eCheck: "none", fnApply: (biA, biB) => biA | biB },
	"^": { strName: "xor", nPrecedence: 2, eCheck: "none", fnApply: (biA, biB) => biA ^ biB },
	"<<": { strName: "shift left", nPrecedence: 4, eCheck: "shift", fnApply: (biA, biB) => biA << biB },
	">>": { strName: "shift right", nPrecedence: 4, eCheck: "shift", fnApply: (biA, biB) => biA >> biB },
} satisfies Record<string, IOperatorSpec>;

export type TOperator = keyof typeof OPERATOR_TABLE; // "+" | "-" | ... | ">>"

export function IsOperator(strText: string): strText is TOperator {
	return Object.hasOwn(OPERATOR_TABLE, strText); // own keys only : "toString" is not an operator
}

export function OperatorList(): string {
	return Object.keys(OPERATOR_TABLE).join(" ");
}

export function OperatorName(strOp: TOperator): string {
	return OPERATOR_TABLE[strOp].strName;
}

// Lesson 10: 1 + 2 * 3 is 1 + (2 * 3) because * has the higher number
export function OperatorPrecedence(strOp: TOperator): number {
	return OPERATOR_TABLE[strOp].nPrecedence;
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

export class CCalculator {
	readonly #oWord: CWordSize | undefined; // undefined = no word size (unlimited)

	constructor(oWord?: CWordSize) {
		this.#oWord = oWord;
	}

	// With a word size, the operands are wrapped to unsigned first (like a programmer calculator)
	Calculate(biA: bigint, strOp: TOperator, biB: bigint): ICalcResult {
		const oWord = this.#oWord;
		if (oWord === undefined) {
			const biExact = this.#Apply(biA, strOp, biB);
			return { biValue: biExact, biExact, bOverflow: false };
		}
		const biExact = this.#Apply(oWord.ToUnsigned(biA), strOp, oWord.ToUnsigned(biB));
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
			default:
				return AssertNever(oSpec.eCheck); // a new ECheck member must be handled here
		}
		return oSpec.fnApply(biA, biB);
	}

	#CheckShift(biCount: bigint): void {
		const biMax = this.#oWord === undefined ? MAX_SHIFT_UNLIMITED : BigInt(this.#oWord.nBits);
		if (biCount < 0n || biCount > biMax) {
			throw new CCalcError(`shift count ${biCount} is out of range`, `use a shift count from 0 to ${biMax}.`);
		}
	}
}

function AssertNever(vValue: never): never {
	throw new Error(`Unexpected value: ${String(vValue)}`);
}
