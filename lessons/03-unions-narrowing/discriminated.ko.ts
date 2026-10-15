//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 03-unions-narrowing / discriminated (판별 유니온)
//	History			: 2026-10-15 CYBERKDH Initial (최초 작성)
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// 1) [TS] 판별 유니온 : 모든 멤버가 같은 프로퍼티(태그)를 갖고, 그 값(리터럴)이 서로 다르다
type TToken =
	| { strKind: "number"; biValue: bigint }
	| { strKind: "op"; strOp: "+" | "-" | "*" | "/" }
	| { strKind: "paren"; bOpen: boolean };

// 2) [JS + TS] 태그로 switch : case 마다 정확한 멤버를 안다
function DescribeToken(oToken: TToken): string {
	switch (oToken.strKind) {
		case "number":
			return `number ${oToken.biValue}`; // oToken.biValue 는 여기서만 있다
		case "op":
			return `operator ${oToken.strOp}`;
		case "paren":
			return oToken.bOpen ? "open paren" : "close paren";
		default:
			return AssertNever(oToken); // 모든 case 를 처리 → 여기서 oToken 은 never
	}
}

// 3) [TS] 빠짐없이 처리했는지 검사 : 위의 case "paren" 을 지우면 AssertNever(oToken) 에 빨간 줄 TS2345
function AssertNever(oValue: never): never {
	throw new Error(`Unexpected value: ${JSON.stringify(oValue)}`);
}

// "(1 + 2)" 의 토큰들
const arrToken: TToken[] = [
	{ strKind: "paren", bOpen: true },
	{ strKind: "number", biValue: 1n },
	{ strKind: "op", strOp: "+" },
	{ strKind: "number", biValue: 2n },
	{ strKind: "paren", bOpen: false },
];
console.log("2)", arrToken.map(DescribeToken).join(" / "));

// 4) [TS] as 는 아무것도 검사하지 않는다 : 외부 데이터는 실행 중에 여전히 틀릴 수 있다
try {
	const oBad = JSON.parse('{"strKind":"space"}') as TToken; // 단언일 뿐 — 실행 시점 검사 없음
	DescribeToken(oBad);
} catch (e) {
	console.log("4) Expected error:", (e as Error).message);
	console.log("   Why : as TToken only told TS what to believe; \"space\" is not in the union.");
	console.log("   Fix : check outside data before use (narrowing.ts 7). AssertNever caught it here.");
}

// 5) [TS] 성공 또는 실패 결과 : 예외를 던지는 대신 이유를 돌려준다 (C# int.TryParse 와 비슷)
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
		console.log("5) ok    :", oResult.biValue); // 여기서는 { bOk: true; biValue }
	} else {
		console.log("5) error :", oResult.strError); // 여기서는 { bOk: false; strError }
	}
	// oResult.biValue; // ← 주석을 풀면 빨간 줄 TS2339 (아직 확인 전이라 실패 멤버일 수 있음)
}
