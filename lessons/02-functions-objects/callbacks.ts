//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 02-functions-objects / callbacks (Functions as values, closures)
//	History			: 2026-10-14 CYBERKDH Initial
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// 1) [JS] Pass a function as an argument (callback). Like passing a C# delegate.
//    The ": (biValue: bigint) => string" part is [TS]
function PrintAll(arrValue: bigint[], fnFormat: (biValue: bigint) => string): void {
	for (const biValue of arrValue) {
		console.log("   " + biValue + " => " + fnFormat(biValue));
	}
}
console.log("1) PrintAll with a hex callback:");
PrintAll([10n, 255n], (biValue) => "0x" + biValue.toString(16).toUpperCase());

// 2) [JS] Array methods take callbacks : map / filter / reduce. Like C# LINQ Select / Where / Aggregate.
const arrBits = [8, 16, 32, 64];
const arrBytes = arrBits.map((nBits) => nBits / 8); // number[] (inferred)
const arrBig = arrBits.filter((nBits) => nBits >= 32);
const nTotal = arrBits.reduce((nSum, nBits) => nSum + nBits, 0);
console.log("2) map:", arrBytes, "/ filter:", arrBig, "/ reduce:", nTotal);

// 3) [JS] Return a function from a function : the inner function remembers outer variables (closure)
function MakeFormatter(nRadix: number, strPrefix: string): (biValue: bigint) => string {
	return (biValue) => strPrefix + biValue.toString(nRadix).toUpperCase();
}
const fnHex = MakeFormatter(16, "0x");
const fnBin = MakeFormatter(2, "0b");
console.log("3)", fnHex(255n), fnBin(5n));

// 4) [JS] A closure can keep private state
function MakeCounter(): () => number {
	let nCount = 0; // only the returned function can see this
	return () => {
		nCount += 1;
		return nCount;
	};
}
const fnNext = MakeCounter();
fnNext();
fnNext();
console.log("4) counter after 3 calls =", fnNext());

// 5) [JS + TS] A table of functions : an array of [name, function] pairs
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
