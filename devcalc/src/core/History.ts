//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: devcalc / core / History (Generic ring buffer of recent items)
//	History			: 2026-10-15 CYBERKDH Initial - Lesson 05 DevCalc step
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// Keeps the last nCapacity items; when full, the oldest one drops out
export class CHistory<T> {
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

	Add(vItem: T): void {
		if (this.#arrItem.length === this.nCapacity) {
			this.#arrItem.shift();
		}
		this.#arrItem.push(vItem);
	}

	// 0 is the oldest, -1 is the newest (like Array.prototype.at)
	At(nIndex: number): T | undefined {
		return this.#arrItem.at(nIndex);
	}

	Latest(): T | undefined {
		return this.At(-1);
	}

	// Searches from the newest to the oldest
	Find(fnTest: (vItem: T) => boolean): T | undefined {
		for (let nIndex = this.#arrItem.length - 1; nIndex >= 0; nIndex--) {
			const vItem = this.#arrItem[nIndex];
			if (vItem !== undefined && fnTest(vItem)) {
				return vItem;
			}
		}
		return undefined;
	}

	Clear(): void {
		this.#arrItem.length = 0;
	}

	*[Symbol.iterator](): IterableIterator<T> {
		yield* this.#arrItem;
	}
}
