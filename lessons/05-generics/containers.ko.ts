//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 05-generics / containers (제네릭 컨테이너)
//	History			: 2026-10-15 CYBERKDH Initial (최초 작성)
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// 1) [TS] 제네릭 인터페이스 (generic interface) : 모양은 하나, 내용물은 무엇이든
interface IBox<T> {
	readonly vValue: T;
	readonly strLabel: string;
}
const oHex: IBox<bigint> = { vValue: 0xffn, strLabel: "HEX" };
const oFlags: IBox<boolean[]> = { vValue: [true, false], strLabel: "flags" };
console.log("1) IBox =", oHex.strLabel, oHex.vValue, "/", oFlags.strLabel, oFlags.vValue);

// 2) [JS + TS] 제네릭 클래스 (generic class) : C# 의 Stack<T> 같은 스택
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
// oStack.Push("2"); // ← 주석을 풀면 빨간 줄 TS2345 (string 은 bigint 가 아님)
console.log("2) CStack : count =", oStack.nCount, "/ peek =", oStack.Peek(), "/ pop =", oStack.Pop(), "/ count =", oStack.nCount);

// 3) [JS + TS] 내장 제네릭 (built-in generics) : Array<T>, Map<K, V>, Set<T>
const arrValue: Array<bigint> = [1n, 2n]; // bigint[] 와 같음
const mapRegister = new Map<string, bigint>([
	["AX", 0x1234n],
	["BX", 0xffn],
]);
const setSeen = new Set<string>(["HEX", "DEC", "HEX"]);
const biAx = mapRegister.get("AX"); // bigint | undefined : 키가 없을 수도 있음
console.log("3) Array =", arrValue.length, "/ Map AX =", biAx, "/ Map CX =", mapRegister.get("CX"), "/ Set size =", setSeen.size);

// 4) [TS] Record<K, V> : 키가 K 인 객체 타입
type ERadixName = "HEX" | "DEC" | "BIN";
const RADIX_BASE: Record<ERadixName, number> = { HEX: 16, DEC: 10, BIN: 2 };
// const oPartial: Record<ERadixName, number> = { HEX: 16 }; // ← 주석을 풀면 빨간 줄 TS2739 (DEC, BIN 이 빠짐)
console.log("4) Record =", RADIX_BASE);

// 5) [TS] ReadonlyArray<T> / ReadonlyMap<K, V> : 데이터를 넘기되 넘겨받은 쪽이 바꾸지 못하게
function Total(arrItem: ReadonlyArray<bigint>): bigint {
	// arrItem.push(0n); // ← 주석을 풀면 빨간 줄 TS2339 (readonly bigint[] 에는 'push' 가 없음)
	let biSum = 0n;
	for (const biItem of arrItem) {
		biSum += biItem;
	}
	return biSum;
}
const mapReadOnly: ReadonlyMap<string, bigint> = mapRegister;
// mapReadOnly.set("CX", 0n); // ← 주석을 풀면 빨간 줄 TS2339 (ReadonlyMap 에는 'set' 이 없음)
console.log("5) Total =", Total([1n, 2n, 3n]), "/ ReadonlyMap has AX =", mapReadOnly.has("AX"));

// 6) [JS] 실행 시점에는 타입이 사라짐 : CStack<bigint> 와 CStack<string> 은 같은 클래스
const oText = new CStack<string>();
console.log("6) same class at run time =", oText.constructor === oStack.constructor, "/ C# would make two types");
