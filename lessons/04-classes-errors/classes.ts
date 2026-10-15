//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 04-classes-errors / classes
//	History			: 2026-10-15 CYBERKDH Initial
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// 1) [JS + TS] class : fields, constructor, methods. The field declarations with types are [TS].
class CRegister {
	strName: string;
	biValue: bigint;

	constructor(strName: string, biValue = 0n) {
		this.strName = strName; // "this." is required (C# lets you leave it out)
		this.biValue = biValue;
	}

	ToString(): string {
		return `${this.strName} = 0x${this.biValue.toString(16).toUpperCase()}`;
	}
}
const oAx = new CRegister("AX", 255n);
console.log("1)", oAx.ToString(), "/ typeof =", typeof oAx);

// 2) [TS] Parameter properties are not used in this repo (erasableSyntaxOnly)
// class CShort { constructor(private nBits: number) {} } // ← Uncomment → red squiggle TS1294 (not erasable)
// They generate code (this.nBits = nBits), so node can't just erase them. Declare the field and assign it.
console.log("2) declare fields, then assign them in the constructor");

// 3) [TS] private vs [JS] #private
class CCounter {
	private nTsPrivate = 0; // checked by TS only — a normal property at runtime
	#nJsPrivate = 0; // really hidden at runtime

	Increment(): number {
		this.nTsPrivate++;
		this.#nJsPrivate++;
		return this.#nJsPrivate;
	}
}
const oCounter = new CCounter();
oCounter.Increment();
// oCounter.nTsPrivate; // ← Uncomment → red squiggle TS2341 (private)
console.log("3) Object.keys =", Object.keys(oCounter), "/ JSON =", JSON.stringify(oCounter));

// 4) [JS + TS] readonly field, getter, static member
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
// oWord.nBits = 32; // ← Uncomment → red squiggle TS2540 (read-only)
console.log("4) nBits =", oWord.nBits, "/ nBytes =", oWord.nBytes, "/ biMax =", oWord.biMax, "/ MAX_BITS =", CWordSize.MAX_BITS);

// 5) [JS] A method taken out of its object loses "this"
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
