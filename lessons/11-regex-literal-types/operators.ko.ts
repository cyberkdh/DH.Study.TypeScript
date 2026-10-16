//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 11-regex-literal-types / operators (연산자)
//	History			: 2026-10-15 CYBERKDH Initial (최초 작성)
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// 직접 만들기 : 10강의 우선순위 클라이밍 (precedence climbing) 을 bigint 와 고정 워드 크기 (word size) 로.
// ** (오른쪽 결합), >> 와 >>>, 단항 - 와 ~, 그리고 리터럴 1Fh, 4K, 'A' 까지

// 1) [TS] 표 두 개. satisfies 가 각 행을 검사하고, keyof typeof 가 키로 연산자 유니온을 만듦
type EAssoc = "left" | "right";

interface IBinarySpec {
	readonly nPrecedence: number;
	readonly eAssoc: EAssoc;
	readonly fnApply: (biA: bigint, biB: bigint, nBits: number) => bigint; // biA 와 biB 는 부호 없는 워드
}

const BINARY = {
	"|": { nPrecedence: 1, eAssoc: "left", fnApply: (biA, biB) => biA | biB },
	"^": { nPrecedence: 2, eAssoc: "left", fnApply: (biA, biB) => biA ^ biB },
	"&": { nPrecedence: 3, eAssoc: "left", fnApply: (biA, biB) => biA & biB },
	"<<": { nPrecedence: 4, eAssoc: "left", fnApply: (biA, biB) => biA << biB },
	">>": { nPrecedence: 4, eAssoc: "left", fnApply: (biA, biB, nBits) => BigInt.asIntN(nBits, biA) >> biB }, // 부호 비트를 유지
	">>>": { nPrecedence: 4, eAssoc: "left", fnApply: (biA, biB) => biA >> biB }, // biA 가 부호 없음 : 0 이 들어옴
	"+": { nPrecedence: 5, eAssoc: "left", fnApply: (biA, biB) => biA + biB },
	"-": { nPrecedence: 5, eAssoc: "left", fnApply: (biA, biB) => biA - biB },
	"*": { nPrecedence: 6, eAssoc: "left", fnApply: (biA, biB) => biA * biB },
	"**": { nPrecedence: 7, eAssoc: "right", fnApply: (biA, biB) => biA ** biB }, // 2 ** 3 ** 2 = 2 ** (3 ** 2)
} satisfies Record<string, IBinarySpec>;

const UNARY = {
	"-": (biA: bigint) => -biA,
	"~": (biA: bigint) => ~biA, // 모든 비트를 뒤집음 : ~0 = -1, 8 비트로는 0xFF
} satisfies Record<string, (biA: bigint) => bigint>;

type EBinary = keyof typeof BINARY; // "|" | "^" | ... | "**"
type EUnary = keyof typeof UNARY; // "-" | "~"

function IsBinary(strText: string): strText is EBinary {
	return Object.hasOwn(BINARY, strText);
}

function IsUnary(strText: string): strText is EUnary {
	return Object.hasOwn(UNARY, strText);
}

// 2) [JS] 토큰용 정규식 하나 : 긴 연산자를 먼저 적어야 >>> 가 >> 와 > 로 읽히지 않음
//    \x27 은 작은따옴표 글자
const RE_TOKEN = /\x27[^\x27]\x27|[0-9][0-9a-z]*|\*\*|>>>|>>|<<|\S/gi;

// 이름 있는 그룹 (named group) 으로 읽는 리터럴 : 1Fh (16진), 4K (크기), 'A' (문자)
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

// 3) 파서는 읽으면서 바로 계산함. 모든 값을 부호 없는 nBits 워드로 감쌈 (wrap)
function Calc(strExpr: string, nBits: number): bigint {
	const arrToken = strExpr.match(RE_TOKEN) ?? [];
	let nPos = 0;
	const Wrap = (biValue: bigint): bigint => BigInt.asUintN(nBits, biValue);

	function Expression(nMin: number): bigint {
		const strFirst = arrToken[nPos] ?? "";
		let biLeft = Unary();
		let bUnaryFirst = IsUnary(strFirst); // -2 ... 나 ~2 ... : 괄호로 감싸지 않은 단항
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
			return Wrap(UNARY[strToken](Unary())); // - 와 ~ 는 모든 이항 연산자보다 강하게 묶임
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

// 4) 단항 ~ 와 두 가지 오른쪽 시프트
Show("4)", "~0", 8);
Show("4)", "~0 >>> 4", 8);
Show("4)", "0x80 >> 1", 8);
Show("4)", "0x80 >>> 1", 8);
Show("4)", "-16 >> 2", 8);

// 5) ** 는 오른쪽부터 묶이고, * 보다 강하게 묶임
Show("5)", "2 ** 3 ** 2", 16);
Show("5)", "(2 ** 3) ** 2", 16);
Show("5)", "3 * 2 ** 4", 16);
Show("5)", "(-2) ** 3", 16);

// 6) 새 리터럴
Show("6)", "1Fh + 1", 16);
Show("6)", "4K - 1", 16);
Show("6)", "'A' + 1", 16);
Show("6)", "'a' & ~0x20", 8);

// 7) -2 ** 2 : 4 인가 -4 인가? JavaScript 는 추측하지 않고 거부하며, 이 파서도 같음
try {
	Show("7)", "-2 ** 2", 16);
} catch (e) {
	console.log(`7) Expected error: ${String(e)}`);
	console.log("   Why : -(2 ** 2) in math, (-2) ** 2 in some calculators. Either reading surprises someone.");
	console.log("   Fix : parentheses. JavaScript has the same rule : -2 ** 2 is a SyntaxError there too.");
}
