//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 01-basic-types / variables
//	History			: 2026-10-14 CYBERKDH Initial (최초 작성)
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// 형식 : 키워드 이름: 타입 = 값;       (타입이 이름 뒤, C# 과 반대)

// 1) [JS] const (기본) / let (값이 바뀌어야 할 때만)
const nMax = 10;
let nCount = 0;
nCount = nCount + 1;
console.log("1) const nMax =", nMax, "/ let nCount =", nCount);
// nMax = 20; // ← 주석을 풀면 빨간 줄 TS2588 (상수에 다시 할당 불가)

// 2) [JS] const 재할당은 실행 중에도 실패한다
try {
	const nFixed = 1;
	// @ts-expect-error
	nFixed = 2;
	console.log(nFixed); // 여기까지 오지 못함
} catch (e) {
	console.log("2) Expected error:", (e as Error).message);
	console.log("   Why : a const can't be given a new value.");
	console.log("   Fix : use let when the value must change.");
}

// 3) [JS] const 는 재할당만 막는다. 배열/객체의 내용은 바뀔 수 있다.
const arrNum = [1, 2];
arrNum.push(3); // OK
// arrNum = [];  // ← 주석을 풀면 빨간 줄 TS2588
console.log("3) const arrNum after push(3) =", arrNum);

// 4) [TS] 표기 vs 추론. const 는 리터럴 타입, let 은 넓은 타입 (hover 로 확인)
const strName: string = "DevCalc"; // 표기 : string
const strBase = "HEX"; // 추론 : "HEX"  (리터럴 타입)
let strMode = "HEX"; // 추론 : string (넓혀짐)
const biOne = 1n; // 추론 : 1n
let biTotal = 1n; // 추론 : bigint
strMode = "DEC";
biTotal += biOne;
console.log("4)", strName, strBase, strMode, biTotal, "/ typeof 1n =", typeof biOne);

// 5) [TS] 먼저 선언하고 나중에 할당 : 타입 표기 필요
let nLater: number;
// console.log(nLater); // ← 주석을 풀면 빨간 줄 TS2454 (할당 전 사용)
nLater = 5;
console.log("5) nLater =", nLater);

// 6) [JS] 구조 분해 (Destructuring) : 변수 여러 개를 한 번에 선언
const oPerson = { strUser: "Hong", nAge: 30 };
const { strUser, nAge } = oPerson;
const [nFirst, nSecond] = [10, 20];
console.log("6)", strUser, nAge, nFirst, nSecond);

// 7) [JS] let/const 는 선언한 줄보다 위에서 쓸 수 없다
try {
	// @ts-expect-error
	console.log(nEarly);
	const nEarly = 1;
} catch (e) {
	console.log("7) Expected error:", (e as Error).message);
	console.log("   Why : let/const exist only from their declaration line down.");
	console.log("   Fix : declare first, then use.");
}

// 8) [JS] var : 예전 JS 방식. { } 블록을 무시하므로 쓰지 않는다.
for (var nIdx = 0; nIdx < 3; nIdx++) {
	// 반복 본문
}
console.log("8) var nIdx after the loop =", nIdx, "(still alive outside the loop)"); // 반복문 밖에서도 살아 있음
