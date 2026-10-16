//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 11-regex-literal-types / operators
//	History			: 2026-10-15 CYBERKDH Initial
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// Build it : lesson 10's precedence climbing on bigint, in a fixed word size,
// with ** (right-associative), >> and >>>, unary - and ~, and the literals 1Fh, 4K and 'A'

// 1) [TS] Two tables. satisfies checks each row; keyof typeof makes the operator unions from the keys
type EAssoc = "left" | "right";

interface IBinarySpec {
	readonly nPrecedence: number;
	readonly eAssoc: EAssoc;
	readonly fnApply: (biA: bigint, biB: bigint, nBits: number) => bigint; // biA and biB are unsigned words
}

const BINARY = {
	"|": { nPrecedence: 1, eAssoc: "left", fnApply: (biA, biB) => biA | biB },
	"^": { nPrecedence: 2, eAssoc: "left", fnApply: (biA, biB) => biA ^ biB },
	"&": { nPrecedence: 3, eAssoc: "left", fnApply: (biA, biB) => biA & biB },
	"<<": { nPrecedence: 4, eAssoc: "left", fnApply: (biA, biB) => biA << biB },
	">>": { nPrecedence: 4, eAssoc: "left", fnApply: (biA, biB, nBits) => BigInt.asIntN(nBits, biA) >> biB }, // keeps the sign bit
	">>>": { nPrecedence: 4, eAssoc: "left", fnApply: (biA, biB) => biA >> biB }, // biA is unsigned : 0 comes in
	"+": { nPrecedence: 5, eAssoc: "left", fnApply: (biA, biB) => biA + biB },
	"-": { nPrecedence: 5, eAssoc: "left", fnApply: (biA, biB) => biA - biB },
	"*": { nPrecedence: 6, eAssoc: "left", fnApply: (biA, biB) => biA * biB },
	"**": { nPrecedence: 7, eAssoc: "right", fnApply: (biA, biB) => biA ** biB }, // 2 ** 3 ** 2 = 2 ** (3 ** 2)
} satisfies Record<string, IBinarySpec>;

const UNARY = {
	"-": (biA: bigint) => -biA,
	"~": (biA: bigint) => ~biA, // every bit flipped : ~0 = -1, which is 0xFF in 8 bits
} satisfies Record<string, (biA: bigint) => bigint>;

type EBinary = keyof typeof BINARY; // "|" | "^" | ... | "**"
type EUnary = keyof typeof UNARY; // "-" | "~"

function IsBinary(strText: string): strText is EBinary {
	return Object.hasOwn(BINARY, strText);
}

function IsUnary(strText: string): strText is EUnary {
	return Object.hasOwn(UNARY, strText);
}

// 2) [JS] One regex for the tokens : the longest operators first, so >>> is not read as >> and >
//    \x27 is the quote character
const RE_TOKEN = /\x27[^\x27]\x27|[0-9][0-9a-z]*|\*\*|>>>|>>|<<|\S/gi;

// Literals with named groups : 1Fh (hex), 4K (size), 'A' (character)
const RE_HEX_SUFFIX = /^(?<digits>[0-9][0-9a-f]*)h$/i;
const RE_SIZE = /^(?<digits>[0-9]+)(?<unit>[kmgt])$/i;
const RE_CHAR = /^\x27(?<char>.)\x27$/;
const UNIT_SHIFT = { k: 10n, m: 20n, g: 30n, t: 40n } as const satisfies Record<"k" | "m" | "g" | "t", bigint>;

function ReadLiteral(strToken: string): bigint | undefined {
	const strHex = RE_HEX_SUFFIX.exec(strToken)?.groups?.digits;
	if (strHex !== undefined) {
		return BigInt(`0x${strHex}`);
	}
	const oSize = RE_SIZE.exec(strToken)?.groups;
	const strUnit = oSize?.unit?.toLowerCase();
	if (oSize?.digits !== undefined && (strUnit === "k" || strUnit === "m" || strUnit === "g" || strUnit === "t")) {
		return BigInt(oSize.digits) << UNIT_SHIFT[strUnit];
	}
	const strChar = RE_CHAR.exec(strToken)?.groups?.char;
	if (strChar !== undefined) {
		return BigInt(strChar.codePointAt(0) ?? 0);
	}
	return /^(?:0x[0-9a-f]+|[0-9]+)$/i.test(strToken) ? BigInt(strToken) : undefined;
}

// 3) The parser calculates while it parses. Every value is wrapped to an unsigned nBits word
function Calc(strExpr: string, nBits: number): bigint {
	const arrToken = strExpr.match(RE_TOKEN) ?? [];
	let nPos = 0;
	const Wrap = (biValue: bigint): bigint => BigInt.asUintN(nBits, biValue);

	function Expression(nMin: number): bigint {
		const strFirst = arrToken[nPos] ?? "";
		let biLeft = Unary();
		let bUnaryFirst = IsUnary(strFirst); // -2 ... or ~2 ... : not ( ) around it
		for (;;) {
			const strOp = arrToken[nPos] ?? "";
			if (!IsBinary(strOp) || BINARY[strOp].nPrecedence < nMin) {
				return biLeft;
			}
			if (strOp === "**" && bUnaryFirst) {
				throw new SyntaxError(`"${strFirst}x ** y" is ambiguous : write (${strFirst}x) ** y or ${strFirst}(x ** y)`);
			}
			nPos++;
			const oSpec: IBinarySpec = BINARY[strOp];
			const nNextMin = oSpec.eAssoc === "left" ? oSpec.nPrecedence + 1 : oSpec.nPrecedence;
			biLeft = Wrap(oSpec.fnApply(biLeft, Expression(nNextMin), nBits));
			bUnaryFirst = false;
		}
	}

	function Unary(): bigint {
		const strToken = arrToken[nPos++] ?? "";
		if (IsUnary(strToken)) {
			return Wrap(UNARY[strToken](Unary())); // - and ~ bind tighter than every binary operator
		}
		if (strToken === "(") {
			const biInside = Expression(1);
			if (arrToken[nPos++] !== ")") {
				throw new SyntaxError(`expected ")"`);
			}
			return biInside;
		}
		const biValue = ReadLiteral(strToken);
		if (biValue === undefined) {
			throw new SyntaxError(`expected a number, "(", "-" or "~", found ${strToken === "" ? "the end" : `"${strToken}"`}`);
		}
		return Wrap(biValue);
	}

	const biValue = Expression(1);
	if (nPos < arrToken.length) {
		throw new SyntaxError(`expected an operator or the end, found "${arrToken[nPos]}"`);
	}
	return biValue;
}

function Hex(biValue: bigint, nBits: number): string {
	return `0x${biValue.toString(16).toUpperCase().padStart(nBits / 4, "0")}`;
}

function Show(strLabel: string, strExpr: string, nBits: number): void {
	console.log(`${strLabel} ${strExpr.padEnd(14)} = ${Hex(Calc(strExpr, nBits), nBits)} (${nBits}-bit)`);
}

// 4) Unary ~ and the two right shifts
Show("4)", "~0", 8);
Show("4)", "~0 >>> 4", 8);
Show("4)", "0x80 >> 1", 8);
Show("4)", "0x80 >>> 1", 8);
Show("4)", "-16 >> 2", 8);

// 5) ** groups to the right and binds tighter than *
Show("5)", "2 ** 3 ** 2", 16);
Show("5)", "(2 ** 3) ** 2", 16);
Show("5)", "3 * 2 ** 4", 16);
Show("5)", "(-2) ** 3", 16);

// 6) The new literals
Show("6)", "1Fh + 1", 16);
Show("6)", "4K - 1", 16);
Show("6)", "'A' + 1", 16);
Show("6)", "'a' & ~0x20", 8);

// 7) -2 ** 2 : 4 or -4? JavaScript refuses to guess, and so does this parser
try {
	Show("7)", "-2 ** 2", 16);
} catch (e) {
	console.log(`7) Expected error: ${String(e)}`);
	console.log("   Why : -(2 ** 2) in math, (-2) ** 2 in some calculators. Either reading surprises someone.");
	console.log("   Fix : parentheses. JavaScript has the same rule : -2 ** 2 is a SyntaxError there too.");
}
