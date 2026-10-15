//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 05-generics / history
//	History			: 2026-10-15 CYBERKDH Initial
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// 1) [JS + TS] CHistory<T> : keeps the last nCapacity items, the oldest one drops out (ring buffer)
class CHistory<T> {
	readonly nCapacity: number;
	readonly #arrItem: T[] = [];

	constructor(nCapacity: number) {
		if (!Number.isInteger(nCapacity) || nCapacity < 1) {
			throw new RangeError(`capacity must be a positive integer, got ${nCapacity}`);
		}
		this.nCapacity = nCapacity;
	}

	get nCount(): number {
		return this.#arrItem.length;
	}

	// 2) [JS + TS] Add : when full, remove the oldest first
	Add(vItem: T): void {
		if (this.#arrItem.length === this.nCapacity) {
			this.#arrItem.shift();
		}
		this.#arrItem.push(vItem);
	}

	// 3) [JS + TS] At : 0 is the oldest, -1 is the newest (like Array.prototype.at)
	At(nIndex: number): T | undefined {
		return this.#arrItem.at(nIndex);
	}

	Latest(): T | undefined {
		return this.At(-1);
	}

	// 4) [TS] Find : the predicate gets T, so the caller's types flow in
	Find(fnTest: (vItem: T) => boolean): T | undefined {
		for (let nIndex = this.#arrItem.length - 1; nIndex >= 0; nIndex--) {
			const vItem = this.#arrItem[nIndex];
			if (vItem !== undefined && fnTest(vItem)) {
				return vItem;
			}
		}
		return undefined;
	}

	// 5) [JS + TS] An iterator : for...of and [...spread] work on CHistory
	*[Symbol.iterator](): IterableIterator<T> {
		yield* this.#arrItem;
	}
}

// 6) [JS + TS] Using it with an object type
interface IEntry {
	readonly strExpr: string;
	readonly biValue: bigint;
}
const oHistory = new CHistory<IEntry>(3);
for (const [strExpr, biValue] of [
	["0xFF + 1", 0x100n],
	["ans * 2", 0x200n],
	["0b1010", 10n],
	["ans << 4", 160n],
] as const) {
	oHistory.Add({ strExpr, biValue });
}
console.log(`6) count = ${oHistory.nCount} / capacity = ${oHistory.nCapacity} (the first entry dropped out)`);
for (const oEntry of oHistory) {
	console.log(`   ${oEntry.strExpr.padEnd(10)} = ${oEntry.biValue}`);
}
console.log("   oldest =", oHistory.At(0)?.strExpr, "/ newest =", oHistory.Latest()?.strExpr);
console.log("   first value > 100 from newest =", oHistory.Find((oEntry) => oEntry.biValue > 100n)?.strExpr);
console.log("   spread values =", [...oHistory].map((oEntry) => oEntry.biValue));

try {
	new CHistory<string>(0);
} catch (e) {
	console.log("   Expected error:", (e as Error).message);
	console.log("   Why : a history that holds nothing makes no sense.");
	console.log("   Fix : pass 1 or more, e.g. new CHistory<string>(20).");
}
