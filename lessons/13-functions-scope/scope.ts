//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 13-functions-scope / scope
//	History			: 2026-10-15 CYBERKDH Initial
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// Where a name lives : block scope, the temporal dead zone, closures over loop variables, private state, shadowing

// 1) [JS] let and const live inside their { } block
{
	const strInside = "only in this block";
	console.log(`1) ${strInside}`);
}
// console.log(strInside); // ← Uncomment → TS2304 (Cannot find name 'strInside')

// 2) [JS] A function declaration is hoisted (callable above its line). A const arrow function is not
console.log(`2) Twice(21) = ${Twice(21)}`);
function Twice(nValue: number): number {
	return nValue * 2;
}
// console.log(Half(42)); // ← Uncomment → TS2448 (Block-scoped variable 'Half' used before its declaration)
const Half = (nValue: number): number => nValue / 2;
console.log(`2) Half(42) = ${Half(42)}`);

// 3) [TS] A let without a value must be given one on every path before it is read
let strMode: string;
if (Half(4) > 1) {
	strMode = "wide";
}
// console.log(strMode); // ← Uncomment → TS2454 (Variable 'strMode' is used before being assigned)
strMode ??= "narrow";
console.log(`3) mode = ${strMode}`);

// 4) [JS] Closures in a loop : var is one variable for the whole loop, let is a new one per round
const arrVar: (() => number)[] = [];
for (var nOld = 0; nOld < 3; nOld++) {
	arrVar.push(() => nOld);
}
const arrLet: (() => number)[] = [];
for (let nNew = 0; nNew < 3; nNew++) {
	arrLet.push(() => nNew);
}
console.log(`4) var : ${arrVar.map((fnGet) => fnGet()).join(" ")} · let : ${arrLet.map((fnGet) => fnGet()).join(" ")}`);

// 5) [JS] A closure keeps private state : nothing outside can reach nCount, only Next and Reset
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
const oOther = MakeCounter(100); // its own nCount
console.log(`5) ${oIds.Next()} ${oIds.Next()} ${oIds.Next()} · other ${oOther.Next()}`);
oIds.Reset();
console.log(`5) after Reset : ${oIds.Next()}`);

// 6) [JS] Shadowing : an inner name hides the outer one. Legal, but easy to misread
const nLimit = 10;
function CheckLimit(nValue: number): string {
	const nLimit = 5; // hides the outer nLimit inside this function
	return `${nValue} <= ${nLimit} : ${nValue <= nLimit}`;
}
console.log(`6) ${CheckLimit(7)} · the outer nLimit is still ${nLimit}`);

// 7) TS checks "used before its declaration" only in straight-line code. Inside a function it can't know when you call it
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
