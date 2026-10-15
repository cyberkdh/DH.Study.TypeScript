//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 05-generics / history (계산 기록 만들기)
//	History			: 2026-10-15 CYBERKDH Initial (최초 작성)
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// 1) [JS + TS] CHistory<T> : 마지막 nCapacity 개만 보관, 가장 오래된 것이 빠짐 (링 버퍼, ring buffer)
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

	// 2) [JS + TS] Add : 가득 찼으면 가장 오래된 것부터 지움
	Add(vItem: T): void {
		if (this.#arrItem.length === this.nCapacity) {
			this.#arrItem.shift();
		}
		this.#arrItem.push(vItem);
	}

	// 3) [JS + TS] At : 0 은 가장 오래된 것, -1 은 가장 최근 것 (Array.prototype.at 처럼)
	At(nIndex: number): T | undefined {
		return this.#arrItem.at(nIndex);
	}

	Latest(): T | undefined {
		return this.At(-1);
	}

	// 4) [TS] Find : 조건 함수 (predicate) 가 T 를 받으므로 호출하는 쪽의 타입이 그대로 전달됨
	Find(fnTest: (vItem: T) => boolean): T | undefined {
		for (let nIndex = this.#arrItem.length - 1; nIndex >= 0; nIndex--) {
			const vItem = this.#arrItem[nIndex];
			if (vItem !== undefined && fnTest(vItem)) {
				return vItem;
			}
		}
		return undefined;
	}

	// 5) [JS + TS] 이터레이터 (iterator) : CHistory 에 for...of 와 [...spread] 를 쓸 수 있음
	*[Symbol.iterator](): IterableIterator<T> {
		yield* this.#arrItem;
	}
}

// 6) [JS + TS] 객체 타입과 함께 쓰기
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
