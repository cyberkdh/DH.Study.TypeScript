//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 16-trees-steps / rewrite (트리를 바꾸지 않고 다시 쓰기)
//	History			: 2026-10-16 CYBERKDH Initial (최초 작성)
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// 다시 쓰기로 단계 만들기 : 한 부분을 계산해 새 트리를 얻고, 출력하고, 반복. 옛 트리는 절대 바뀌지 않는다

// 1) [TS] 이 예제만의 작은 트리, 끝까지 readonly
type TOp = "+" | "-" | "*" | "/";
type TExpr = { readonly eKind: "num"; readonly biValue: bigint } | { readonly eKind: "bin"; readonly strOp: TOp; readonly oLeft: TExpr; readonly oRight: TExpr };

const PRECEDENCE: Readonly<Record<TOp, number>> = { "+": 1, "-": 1, "*": 2, "/": 2 };

function Num(biValue: bigint): TExpr {
	return { eKind: "num", biValue };
}

function Bin(oLeft: TExpr, strOp: TOp, oRight: TExpr): TExpr {
	return { eKind: "bin", strOp, oLeft, oRight };
}

// 10 + 30 * (100 + 2) / 10 + 20 을 파서가 만드는 모양 그대로 만든다
const FIRST = Bin(Bin(Num(10n), "+", Bin(Bin(Num(30n), "*", Bin(Num(100n), "+", Num(2n))), "/", Num(10n))), "+", Num(20n));
// FIRST.eKind = "num"; // ← 주석 해제 → 빨간 밑줄 TS2540 (Cannot assign to 'eKind' because it is a read-only property : 읽기 전용 속성)

// 트리를 ( ) 가 가장 적은 글자로 : 자식이 부모보다 느슨하게 묶이거나,
// 오른쪽에서 같은 세기로 묶일 때 ( ) 가 필요하다 (8 - (4 - 2) 는 8 - 4 - 2 가 아니다)
function Show(oExpr: TExpr): string {
	if (oExpr.eKind === "num") {
		return String(oExpr.biValue);
	}
	const nMine = PRECEDENCE[oExpr.strOp];
	const strLeft = oExpr.oLeft.eKind === "bin" && PRECEDENCE[oExpr.oLeft.strOp] < nMine ? `(${Show(oExpr.oLeft)})` : Show(oExpr.oLeft);
	const strRight = oExpr.oRight.eKind === "bin" && PRECEDENCE[oExpr.oRight.strOp] <= nMine ? `(${Show(oExpr.oRight)})` : Show(oExpr.oRight);
	return `${strLeft} ${oExpr.strOp} ${strRight}`;
}

function Apply(biA: bigint, strOp: TOp, biB: bigint): bigint {
	switch (strOp) {
		case "+":
			return biA + biB;
		case "-":
			return biA - biB;
		case "*":
			return biA * biB;
		case "/":
			return biA / biB;
	}
}

// 2) [JS] 한 단계 : 두 자식이 모두 숫자인 첫 노드를 (왼쪽 먼저) 찾아 바꾼다.
// 내려가는 길의 노드만 { ...oExpr, oLeft: … } 로 복사하고, 나머지는 전과 같은 객체다
function ReduceOnce(oExpr: TExpr): TExpr {
	if (oExpr.eKind === "num") {
		return oExpr; // 더 할 일이 없다
	}
	const { oLeft, oRight } = oExpr;
	if (oLeft.eKind === "num" && oRight.eKind === "num") {
		return Num(Apply(oLeft.biValue, oExpr.strOp, oRight.biValue)); // 기저 사례(base case) : 계산 한 번
	}
	if (oLeft.eKind === "bin") {
		return { ...oExpr, oLeft: ReduceOnce(oLeft) };
	}
	return { ...oExpr, oRight: ReduceOnce(oRight) };
}

let oNow = FIRST;
console.log(`1) ${Show(oNow)}`);
while (oNow.eKind === "bin") {
	oNow = ReduceOnce(oNow);
	console.log(`   ${Show(oNow)}`);
}

// 3) [JS] 옛 트리는 그대로 있고, 새 트리는 바뀌지 않은 부분을 모두 함께 쓴다
const SECOND = ReduceOnce(FIRST);
console.log("2) FIRST after all the steps :", Show(FIRST));
if (FIRST.eKind === "bin" && SECOND.eKind === "bin") {
	console.log("   right part (20) is the same object :", FIRST.oRight === SECOND.oRight);
	console.log("   left part is the same object       :", FIRST.oLeft === SECOND.oLeft);
}

// 4) [TS] readonly 는 컴파일러와의 약속이지 자물쇠가 아니다 : "as" 를 쓰면 컴파일되고
// 객체가 실제로 바뀐다. Object.freeze 는 실행 중에 잠근다 (모듈은 strict 모드라 쓰면 예외)
const oLoose = Num(1n);
(oLoose as { biValue: bigint }).biValue = 2n;
console.log("3) readonly, written through as :", Show(oLoose));
const oFrozen = Object.freeze(Num(1n));
try {
	(oFrozen as { biValue: bigint }).biValue = 2n;
} catch (e) {
	console.log("   Expected error:", `${(e as Error).name}: ${(e as Error).message}`);
	console.log("   Why : Object.freeze made the property read-only at run time, not just in the types.");
	console.log("   Fix : build a new object instead ({ ...oFrozen, biValue: 2n }) : the way ReduceOnce works.");
}
