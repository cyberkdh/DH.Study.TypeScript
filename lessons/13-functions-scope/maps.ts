//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 13-functions-scope / maps
//	History			: 2026-10-15 CYBERKDH Initial
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// Keeping names → values : a plain object has traps, a Map does not

const arrWord = ["mask", "constructor", "mask", "toString"];

// 1) [JS] A plain object as a dictionary already "has" keys from Object.prototype
const oCount: Record<string, number> = {};
for (const strWord of arrWord) {
	oCount[strWord] = (oCount[strWord] ?? 0) + 1; // constructor and toString are functions, not undefined
}
console.log(`1) mask = ${oCount["mask"]} · constructor = ${typeof oCount["constructor"]} "${String(oCount["constructor"]).slice(0, 17)}…"`); // the function + 1 became text

// 2) [JS] in also looks at the prototype. Object.hasOwn looks at the object's own keys only
const oVar: Record<string, bigint> = { mask: 0xff00n };
console.log(`2) "toString" in oVar : ${"toString" in oVar} · Object.hasOwn(oVar, "toString") : ${Object.hasOwn(oVar, "toString")}`);

// 3) [JS] "__proto__" is not a normal key : setting it changes the prototype (or does nothing)
const oNames: Record<string, number> = {};
oNames["__proto__"] = 5;
console.log(`3) after oNames["__proto__"] = 5 : keys = [${Object.keys(oNames).join(", ")}]`);

// 4) [JS] Object.create(null) : an object with no prototype at all. Safer, but still only string keys
const oBare: Record<string, number> = Object.create(null);
oBare["toString"] = 1;
oBare["__proto__"] = 2;
console.log(`4) bare object keys = [${Object.keys(oBare).join(", ")}]`);

// 5) [JS] Map : any key, its own size, keys in the order they were first set
const mapVar = new Map<string, bigint>();
for (const [strName, biValue] of [["mask", 0xff00n], ["toString", 1n], ["__proto__", 2n], ["mask", 0xf0n]] as const) {
	mapVar.set(strName, biValue); // the second "mask" replaces the value, the position stays
}
console.log(`5) size = ${mapVar.size} · keys = [${[...mapVar.keys()].join(", ")}] · mask = 0x${mapVar.get("mask")?.toString(16)}`);

// 6) [TS] get() returns bigint | undefined : TS makes you handle a missing name
const biMask = mapVar.get("mask");
// const biBad: bigint = mapVar.get("mask"); // ← Uncomment → TS2322 (Type 'bigint | undefined' is not assignable to type 'bigint')
// console.log(biMask + 1n); // ← Uncomment → TS18048 ('biMask' is possibly 'undefined')
if (biMask !== undefined) {
	console.log(`6) mask + 1 = 0x${(biMask + 1n).toString(16)} · x ?? 0 = ${mapVar.get("x") ?? 0n}`);
}

// 7) [JS] Keys are compared with ===. Normalize names once, at the door (DevCalc : lower case)
function SetVar(mapTarget: Map<string, bigint>, strName: string, biValue: bigint): void {
	mapTarget.set(strName.toLowerCase(), biValue);
}
SetVar(mapVar, "MASK", 0xffn);
console.log(`7) "Mask" → ${mapVar.get("Mask".toLowerCase())} · ${mapVar.size} names · ReadonlyMap blocks set : see below`);
const mapRead: ReadonlyMap<string, bigint> = mapVar;
// mapRead.set("x", 1n); // ← Uncomment → TS2339 (Property 'set' does not exist on type 'ReadonlyMap<string, bigint>')
console.log(`7) mapRead has mask : ${mapRead.has("mask")}`);

// 8) The non-null assertion ! turns "possibly undefined" off. A wrong name then fails at run time
try {
	console.log(mapVar.get("maks")!.toString(16));
} catch (e) {
	console.log(`8) Expected error: ${String(e)}`);
	console.log('   Why : "maks" is misspelled, so get() returned undefined, and ! hid that from TS.');
	console.log("   Fix : check for undefined (or use ?? with a default) and tell the user which name is missing.");
}
