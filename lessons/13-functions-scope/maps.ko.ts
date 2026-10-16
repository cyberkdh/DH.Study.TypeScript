//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 13-functions-scope / maps (맵)
//	History			: 2026-10-15 CYBERKDH Initial (최초 작성)
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// 이름 → 값 보관하기 : 일반 객체 (plain object) 에는 함정이 있고, Map 에는 없음

const arrWord = ["mask", "constructor", "mask", "toString"];

// 1) [JS] 사전 (dictionary) 으로 쓴 일반 객체는 Object.prototype 의 키를 이미 "가지고" 있음
const oCount: Record<string, number> = {};
for (const strWord of arrWord) {
	oCount[strWord] = (oCount[strWord] ?? 0) + 1; // constructor 와 toString 은 undefined 가 아니라 함수
}
console.log(`1) mask = ${oCount["mask"]} · constructor = ${typeof oCount["constructor"]} "${String(oCount["constructor"]).slice(0, 17)}…"`); // 함수 + 1 이 문자열이 됨

// 2) [JS] in 은 프로토타입 (prototype) 까지 봄. Object.hasOwn 은 객체 자신의 키만 봄
const oVar: Record<string, bigint> = { mask: 0xff00n };
console.log(`2) "toString" in oVar : ${"toString" in oVar} · Object.hasOwn(oVar, "toString") : ${Object.hasOwn(oVar, "toString")}`);

// 3) [JS] "__proto__" 는 보통 키가 아님 : 값을 넣으면 프로토타입이 바뀜 (또는 아무 일도 안 일어남)
const oNames: Record<string, number> = {};
oNames["__proto__"] = 5;
console.log(`3) after oNames["__proto__"] = 5 : keys = [${Object.keys(oNames).join(", ")}]`);

// 4) [JS] Object.create(null) : 프로토타입이 아예 없는 객체. 더 안전하지만 여전히 문자열 키만 가능
const oBare: Record<string, number> = Object.create(null);
oBare["toString"] = 1;
oBare["__proto__"] = 2;
console.log(`4) bare object keys = [${Object.keys(oBare).join(", ")}]`);

// 5) [JS] Map : 어떤 키든 가능, 자체 size, 키는 처음 넣은 순서대로
const mapVar = new Map<string, bigint>();
for (const [strName, biValue] of [["mask", 0xff00n], ["toString", 1n], ["__proto__", 2n], ["mask", 0xf0n]] as const) {
	mapVar.set(strName, biValue); // 두 번째 "mask" 는 값만 바꾸고 위치는 그대로
}
console.log(`5) size = ${mapVar.size} · keys = [${[...mapVar.keys()].join(", ")}] · mask = 0x${mapVar.get("mask")?.toString(16)}`);

// 6) [TS] get() 은 bigint | undefined 를 반환 : 없는 이름을 처리하도록 TS 가 강제함
const biMask = mapVar.get("mask");
// const biBad: bigint = mapVar.get("mask"); // ← 주석 해제 → TS2322 (Type 'bigint | undefined' is not assignable to type 'bigint')
// console.log(biMask + 1n); // ← 주석 해제 → TS18048 ('biMask' is possibly 'undefined')
if (biMask !== undefined) {
	console.log(`6) mask + 1 = 0x${(biMask + 1n).toString(16)} · x ?? 0 = ${mapVar.get("x") ?? 0n}`);
}

// 7) [JS] 키는 === 로 비교됨. 이름은 들어오는 곳에서 한 번 정규화 (normalize) 함 (DevCalc : 소문자)
function SetVar(mapTarget: Map<string, bigint>, strName: string, biValue: bigint): void {
	mapTarget.set(strName.toLowerCase(), biValue);
}
SetVar(mapVar, "MASK", 0xffn);
console.log(`7) "Mask" → ${mapVar.get("Mask".toLowerCase())} · ${mapVar.size} names · ReadonlyMap blocks set : see below`);
const mapRead: ReadonlyMap<string, bigint> = mapVar;
// mapRead.set("x", 1n); // ← 주석 해제 → TS2339 (Property 'set' does not exist on type 'ReadonlyMap<string, bigint>')
console.log(`7) mapRead has mask : ${mapRead.has("mask")}`);

// 8) non-null 단언 (assertion) ! 은 "undefined 일 수 있음" 검사를 끔. 이름이 틀리면 실행 중에 실패
try {
	console.log(mapVar.get("maks")!.toString(16));
} catch (e) {
	console.log(`8) Expected error: ${String(e)}`);
	console.log('   Why : "maks" is misspelled, so get() returned undefined, and ! hid that from TS.');
	console.log("   Fix : check for undefined (or use ?? with a default) and tell the user which name is missing.");
}
