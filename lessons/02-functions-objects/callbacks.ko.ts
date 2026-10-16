//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 02-functions-objects / callbacks (값으로서의 함수, 클로저)
//	History			: 2026-10-14 CYBERKDH Initial (최초 작성)
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// 1) [JS] 함수를 인자로 넘긴다 (콜백, Callback). C# 에서 델리게이트를 넘기는 것과 같음
// ": (biValue: bigint) => string" 부분은 [TS]
function PrintAll(arrValue: bigint[], fnFormat: (biValue: bigint) => string): void {
	for (const biValue of arrValue) {
		console.log("   " + biValue + " => " + fnFormat(biValue));
	}
}
console.log("1) PrintAll with a hex callback:");
PrintAll([10n, 255n], (biValue) => "0x" + biValue.toString(16).toUpperCase());

// 2) [JS] 배열 메서드는 콜백을 받는다 : map / filter / reduce. C# LINQ 의 Select / Where / Aggregate
const arrBits = [8, 16, 32, 64];
const arrBytes = arrBits.map((nBits) => nBits / 8); // number[] (추론)
const arrBig = arrBits.filter((nBits) => nBits >= 32);
const nTotal = arrBits.reduce((nSum, nBits) => nSum + nBits, 0);
console.log("2) map:", arrBytes, "/ filter:", arrBig, "/ reduce:", nTotal);

// 3) [JS] 함수에서 함수를 돌려준다 : 안쪽 함수는 바깥 변수를 기억한다 (클로저, Closure)
function MakeFormatter(nRadix: number, strPrefix: string): (biValue: bigint) => string {
	return (biValue) => strPrefix + biValue.toString(nRadix).toUpperCase();
}
const fnHex = MakeFormatter(16, "0x");
const fnBin = MakeFormatter(2, "0b");
console.log("3)", fnHex(255n), fnBin(5n));

// 4) [JS] 클로저로 외부에서 못 건드리는 상태를 가질 수 있다
function MakeCounter(): () => number {
	let nCount = 0; // 돌려준 함수만 볼 수 있음
	return () => {
		nCount += 1;
		return nCount;
	};
}
const fnNext = MakeCounter();
fnNext();
fnNext();
console.log("4) counter after 3 calls =", fnNext());

// 5) [JS + TS] 함수 표 : [이름, 함수] 쌍의 배열
type TFormatter = (biValue: bigint) => string;
const arrFormatter: [string, TFormatter][] = [
	["HEX", fnHex],
	["DEC", (biValue) => biValue.toString(10)],
	["BIN", fnBin],
];
console.log("5) Function table for 10n:");
for (const [strLabel, fnFormat] of arrFormatter) {
	console.log(`   ${strLabel} : ${fnFormat(10n)}`);
}
