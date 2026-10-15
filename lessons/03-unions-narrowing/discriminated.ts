//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 03-unions-narrowing / discriminated
//	History			: 2026-10-15 CYBERKDH Initial
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// 1) [TS] Discriminated union : every member has the same property (the tag) with a different literal value
type TToken =
	| { strKind: "number"; biValue: bigint }
	| { strKind: "op"; strOp: "+" | "-" | "*" | "/" }
	| { strKind: "paren"; bOpen: boolean };

// 2) [JS + TS] switch on the tag : each case knows the exact member
function DescribeToken(oToken: TToken): string {
	switch (oToken.strKind) {
		case "number":
			return `number ${oToken.biValue}`; // oToken.biValue exists only here
		case "op":
			return `operator ${oToken.strOp}`;
		case "paren":
			return oToken.bOpen ? "open paren" : "close paren";
		default:
			return AssertNever(oToken); // every case handled → oToken is never here
	}
}

// 3) [TS] Exhaustiveness check : delete the case "paren" above → red squiggle TS2345 on AssertNever(oToken)
function AssertNever(oValue: never): never {
	throw new Error(`Unexpected value: ${JSON.stringify(oValue)}`);
}

// The tokens of "(1 + 2)"
const arrToken: TToken[] = [
	{ strKind: "paren", bOpen: true },
	{ strKind: "number", biValue: 1n },
	{ strKind: "op", strOp: "+" },
	{ strKind: "number", biValue: 2n },
	{ strKind: "paren", bOpen: false },
];
console.log("2)", arrToken.map(DescribeToken).join(" / "));

// 4) [TS] as does not check anything : data from outside can still be wrong at runtime
try {
	const oBad = JSON.parse('{"strKind":"space"}') as TToken; // "trust me" — no check
	DescribeToken(oBad);
} catch (e) {
	console.log("4) Expected error:", (e as Error).message);
	console.log("   Why : as TToken only told TS what to believe; \"space\" is not in the union.");
	console.log("   Fix : check outside data before use (narrowing.ts 7). AssertNever caught it here.");
}

// 5) [TS] Success-or-failure result : return the reason instead of throwing (like C# int.TryParse)
type TParseResult = { bOk: true; biValue: bigint } | { bOk: false; strError: string };

function ParseDecimal(strText: string): TParseResult {
	if (!/^-?[0-9]+$/.test(strText)) {
		return { bOk: false, strError: `not a decimal integer: "${strText}"` };
	}
	return { bOk: true, biValue: BigInt(strText) };
}

for (const strText of ["255", "12a"]) {
	const oResult = ParseDecimal(strText);
	if (oResult.bOk) {
		console.log("5) ok    :", oResult.biValue); // { bOk: true; biValue } here
	} else {
		console.log("5) error :", oResult.strError); // { bOk: false; strError } here
	}
	// oResult.biValue; // ← Uncomment → red squiggle TS2339 (not checked yet, so it may be the error member)
}
