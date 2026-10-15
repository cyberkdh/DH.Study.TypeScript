//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 04-classes-errors / classes (클래스 기본)
//	History			: 2026-10-15 CYBERKDH Initial (최초 작성)
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// 1) [JS + TS] 클래스 (class) : 필드, 생성자 (constructor), 메서드. 필드를 타입과 함께 선언하는 부분은 [TS].
class CRegister {
	strName: string;
	biValue: bigint;

	constructor(strName: string, biValue = 0n) {
		this.strName = strName; // "this." 는 필수 (C# 은 생략 가능)
		this.biValue = biValue;
	}

	ToString(): string {
		return `${this.strName} = 0x${this.biValue.toString(16).toUpperCase()}`;
	}
}
const oAx = new CRegister("AX", 255n);
console.log("1)", oAx.ToString(), "/ typeof =", typeof oAx);

// 2) [TS] 매개변수 프로퍼티 (parameter properties) 는 이 저장소에서 쓰지 않음 (erasableSyntaxOnly)
// class CShort { constructor(private nBits: number) {} } // ← 주석을 풀면 빨간 줄 TS1294 (지울 수 없는 문법)
// 이 문법은 코드 (this.nBits = nBits) 를 만들어 내므로 node 가 타입만 지워서는 실행할 수 없음. 필드를 선언하고 대입할 것.
console.log("2) declare fields, then assign them in the constructor");

// 3) [TS] private 와 [JS] #private 비교
class CCounter {
	private nTsPrivate = 0; // TS 만 검사 — 실행 중에는 일반 프로퍼티
	#nJsPrivate = 0; // 실행 중에도 실제로 숨겨짐

	Increment(): number {
		this.nTsPrivate++;
		this.#nJsPrivate++;
		return this.#nJsPrivate;
	}
}
const oCounter = new CCounter();
oCounter.Increment();
// oCounter.nTsPrivate; // ← 주석을 풀면 빨간 줄 TS2341 (private)
console.log("3) Object.keys =", Object.keys(oCounter), "/ JSON =", JSON.stringify(oCounter));

// 4) [JS + TS] readonly 필드, 게터 (getter), 정적 멤버 (static)
class CWordSize {
	static readonly MAX_BITS = 64;
	readonly nBits: number;

	constructor(nBits: number) {
		this.nBits = nBits;
	}

	get nBytes(): number {
		return this.nBits / 8;
	}

	get biMax(): bigint {
		return (1n << BigInt(this.nBits)) - 1n;
	}
}
const oWord = new CWordSize(16);
// oWord.nBits = 32; // ← 주석을 풀면 빨간 줄 TS2540 (읽기 전용)
console.log("4) nBits =", oWord.nBits, "/ nBytes =", oWord.nBytes, "/ biMax =", oWord.biMax, "/ MAX_BITS =", CWordSize.MAX_BITS);

// 5) [JS] 객체에서 꺼낸 메서드는 "this" 를 잃음
const fnToString = oAx.ToString;
try {
	fnToString();
} catch (e) {
	console.log("5) Expected error:", (e as Error).message);
	console.log("   Why : fnToString() is called without an object, so \"this\" is undefined.");
	console.log("   Fix : wrap it — () => oAx.ToString() — or use oAx.ToString.bind(oAx).");
}
const fnBound = () => oAx.ToString();
console.log("   arrow wrapper:", fnBound());
