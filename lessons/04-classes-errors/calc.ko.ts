//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 04-classes-errors / calc (두 수 계산기 만들기)
//	History			: 2026-10-15 CYBERKDH Initial (최초 작성)
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// 1) [JS + TS] 연산자 : as const 배열 → 리터럴 유니온, 그리고 타입 가드 (type guard)
const OPERATORS = ["+", "-", "*", "/", "&", "|", "<<"] as const;
type TOperator = (typeof OPERATORS)[number];

function IsOperator(strText: string): strText is TOperator {
	return (OPERATORS as readonly string[]).includes(strText);
}

// 2) [JS + TS] 직접 만든 에러 클래스 : message 는 "왜", strFix 는 "고치는 방법"
class CCalcError extends Error {
	override readonly name = "CCalcError";
	readonly strFix: string;

	constructor(strMessage: string, strFix: string, oOptions?: ErrorOptions) {
		super(strMessage, oOptions);
		this.strFix = strFix;
	}
}

// 3) [JS + TS] 워드 크기 : #biBits 는 비공개, 나머지는 게터 (getter) 로 읽음
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

// 4) [JS + TS] 계산기 : 해석 → 검사 → 계산 → 워드 크기로 자르기. 문제는 CCalcError 로 던짐
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
			return this.#oWord.ToUnsigned(BigInt(strText)); // BigInt() 자체가 SyntaxError 를 던짐
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

// 5) [JS + TS] 사용 예 : 여기서는 CCalcError 만 처리하고, 그 밖의 에러는 버그로 봄
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
