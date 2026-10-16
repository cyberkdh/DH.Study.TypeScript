//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 13-functions-scope / scope (스코프)
//	History			: 2026-10-15 CYBERKDH Initial (최초 작성)
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// 이름이 사는 곳 : 블록 스코프 (block scope), 일시적 사각지대 (temporal dead zone), 반복문 변수 클로저 (closure), 숨긴 상태, 가리기 (shadowing)

// 1) [JS] let 과 const 는 자기 { } 블록 안에서만 삶
{
	const strInside = "only in this block";
	console.log(`1) ${strInside}`);
}
// console.log(strInside); // ← 주석 해제 → TS2304 (Cannot find name 'strInside')

// 2) [JS] 함수 선언은 끌어올려짐 (hoisting : 선언 줄 위에서도 호출 가능). const 화살표 함수는 아님
console.log(`2) Twice(21) = ${Twice(21)}`);
function Twice(nValue: number): number {
	return nValue * 2;
}
// console.log(Half(42)); // ← 주석 해제 → TS2448 (Block-scoped variable 'Half' used before its declaration)
const Half = (nValue: number): number => nValue / 2;
console.log(`2) Half(42) = ${Half(42)}`);

// 3) [TS] 값 없이 선언한 let 은 읽기 전에 모든 경로에서 값을 받아야 함
let strMode: string;
if (Half(4) > 1) {
	strMode = "wide";
}
// console.log(strMode); // ← 주석 해제 → TS2454 (Variable 'strMode' is used before being assigned)
strMode ??= "narrow";
console.log(`3) mode = ${strMode}`);

// 4) [JS] 반복문 안의 클로저 : var 는 반복문 전체에 변수 하나, let 은 매 회차마다 새 변수
const arrVar: (() => number)[] = [];
for (var nOld = 0; nOld < 3; nOld++) {
	arrVar.push(() => nOld);
}
const arrLet: (() => number)[] = [];
for (let nNew = 0; nNew < 3; nNew++) {
	arrLet.push(() => nNew);
}
console.log(`4) var : ${arrVar.map((fnGet) => fnGet()).join(" ")} · let : ${arrLet.map((fnGet) => fnGet()).join(" ")}`);

// 5) [JS] 클로저는 숨긴 상태 (private state) 를 가짐 : 바깥에서는 nCount 에 닿을 수 없고 Next 와 Reset 만 가능
function MakeCounter(nStart: number): { Next: () => number; Reset: () => void } {
	let nCount = nStart;
	return {
		Next: () => nCount++,
		Reset: () => {
			nCount = nStart;
		},
	};
}
const oIds = MakeCounter(1);
const oOther = MakeCounter(100); // 자기만의 nCount
console.log(`5) ${oIds.Next()} ${oIds.Next()} ${oIds.Next()} · other ${oOther.Next()}`);
oIds.Reset();
console.log(`5) after Reset : ${oIds.Next()}`);

// 6) [JS] 가리기 (shadowing) : 안쪽 이름이 바깥 이름을 가림. 문법상 문제없지만 잘못 읽기 쉬움
const nLimit = 10;
function CheckLimit(nValue: number): string {
	const nLimit = 5; // 이 함수 안에서는 바깥 nLimit 을 가림
	return `${nValue} <= ${nLimit} : ${nValue <= nLimit}`;
}
console.log(`6) ${CheckLimit(7)} · the outer nLimit is still ${nLimit}`);

// 7) TS 는 "선언 전 사용" 을 위에서 아래로 읽는 코드에서만 검사함. 함수 안에서는 언제 호출될지 알 수 없음
function ReadMax(): number {
	return MAX_LEVEL;
}
try {
	console.log(ReadMax());
} catch (e) {
	console.log(`7) Expected error: ${String(e)}`);
	console.log("   Why : ReadMax() ran before the line const MAX_LEVEL = 100; the name exists, but it has no value yet (temporal dead zone).");
	console.log("   Fix : declare constants at the top of the file, above the code that calls functions using them.");
}
const MAX_LEVEL = 100;
