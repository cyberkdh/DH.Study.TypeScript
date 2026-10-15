//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 05-generics / containers
//	History			: 2026-10-15 CYBERKDH Initial
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// 1) [TS] A generic interface : one shape, any content
interface IBox<T> {
	readonly vValue: T;
	readonly strLabel: string;
}
const oHex: IBox<bigint> = { vValue: 0xffn, strLabel: "HEX" };
const oFlags: IBox<boolean[]> = { vValue: [true, false], strLabel: "flags" };
console.log("1) IBox =", oHex.strLabel, oHex.vValue, "/", oFlags.strLabel, oFlags.vValue);

// 2) [JS + TS] A generic class : a stack, like C# Stack<T>
class CStack<T> {
	readonly #arrItem: T[] = [];

	get nCount(): number {
		return this.#arrItem.length;
	}

	Push(vItem: T): void {
		this.#arrItem.push(vItem);
	}

	Pop(): T | undefined {
		return this.#arrItem.pop();
	}

	Peek(): T | undefined {
		return this.#arrItem[this.#arrItem.length - 1];
	}
}
const oStack = new CStack<bigint>();
oStack.Push(1n);
oStack.Push(0xffn);
// oStack.Push("2"); // ← Uncomment → red squiggle TS2345 (string is not bigint)
console.log("2) CStack : count =", oStack.nCount, "/ peek =", oStack.Peek(), "/ pop =", oStack.Pop(), "/ count =", oStack.nCount);

// 3) [JS + TS] Built-in generics : Array<T>, Map<K, V>, Set<T>
const arrValue: Array<bigint> = [1n, 2n]; // same as bigint[]
const mapRegister = new Map<string, bigint>([
	["AX", 0x1234n],
	["BX", 0xffn],
]);
const setSeen = new Set<string>(["HEX", "DEC", "HEX"]);
const biAx = mapRegister.get("AX"); // bigint | undefined : the key may be missing
console.log("3) Array =", arrValue.length, "/ Map AX =", biAx, "/ Map CX =", mapRegister.get("CX"), "/ Set size =", setSeen.size);

// 4) [TS] Record<K, V> : an object type whose keys are K
type ERadixName = "HEX" | "DEC" | "BIN";
const RADIX_BASE: Record<ERadixName, number> = { HEX: 16, DEC: 10, BIN: 2 };
// const oPartial: Record<ERadixName, number> = { HEX: 16 }; // ← Uncomment → red squiggle TS2739 (DEC, BIN are missing)
console.log("4) Record =", RADIX_BASE);

// 5) [TS] ReadonlyArray<T> / ReadonlyMap<K, V> : hand out data without letting callers change it
function Total(arrItem: ReadonlyArray<bigint>): bigint {
	// arrItem.push(0n); // ← Uncomment → red squiggle TS2339 ('push' does not exist on readonly bigint[])
	let biSum = 0n;
	for (const biItem of arrItem) {
		biSum += biItem;
	}
	return biSum;
}
const mapReadOnly: ReadonlyMap<string, bigint> = mapRegister;
// mapReadOnly.set("CX", 0n); // ← Uncomment → red squiggle TS2339 ('set' does not exist on ReadonlyMap)
console.log("5) Total =", Total([1n, 2n, 3n]), "/ ReadonlyMap has AX =", mapReadOnly.has("AX"));

// 6) [JS] The types are gone at run time : CStack<bigint> and CStack<string> are the same class
const oText = new CStack<string>();
console.log("6) same class at run time =", oText.constructor === oStack.constructor, "/ C# would make two types");
