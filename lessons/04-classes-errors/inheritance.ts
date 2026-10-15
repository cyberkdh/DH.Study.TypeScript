//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 04-classes-errors / inheritance
//	History			: 2026-10-15 CYBERKDH Initial
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// 1) [TS] abstract class : can't be created with new; subclasses fill in the abstract members
abstract class CFormatter {
	readonly strLabel: string;

	constructor(strLabel: string) {
		this.strLabel = strLabel;
	}

	abstract Format(biValue: bigint): string;

	Show(biValue: bigint): string {
		return `${this.strLabel} : ${this.Format(biValue)}`;
	}
}
// new CFormatter("X"); // ← Uncomment → red squiggle TS2511 (abstract class)
console.log("1) CFormatter is abstract : only its subclasses can be created");

// 2) [JS + TS] extends, super(...) and override
class CHexFormatter extends CFormatter {
	constructor() {
		super("HEX"); // must run before "this" is used
	}

	override Format(biValue: bigint): string {
		return "0x" + biValue.toString(16).toUpperCase();
	}
}

class CLowerHexFormatter extends CHexFormatter {
	override Format(biValue: bigint): string {
		return super.Format(biValue).toLowerCase(); // call the parent's version
	}
	// Remove "override" above → red squiggle TS4114 (noImplicitOverride : say it on purpose)
}

const arrFormatter: CFormatter[] = [new CHexFormatter(), new CLowerHexFormatter()];
for (const oFormatter of arrFormatter) {
	console.log("2)", oFormatter.Show(255n), `(${oFormatter.constructor.name})`);
}

// 3) [TS] implements : the class promises to have the interface's members
interface IResettable {
	Reset(): void;
}
class CAccumulator implements IResettable {
	#biTotal = 0n;

	Add(biValue: bigint): this {
		this.#biTotal += biValue;
		return this; // return this → calls can be chained
	}

	Reset(): void {
		this.#biTotal = 0n;
	}

	get biTotal(): bigint {
		return this.#biTotal;
	}
}
const oAcc = new CAccumulator().Add(0xf0n).Add(0x0fn);
console.log("3) total =", oAcc.biTotal);
oAcc.Reset();
console.log("   after Reset =", oAcc.biTotal);

// 4) [JS + TS] instanceof : narrows to a class (classes exist at runtime, interfaces don't)
function Describe(vItem: CFormatter | IResettable): string {
	if (vItem instanceof CFormatter) {
		return vItem.Show(10n); // CFormatter here
	}
	return "something resettable";
}
console.log("4)", Describe(new CHexFormatter()), "/", Describe(oAcc));
// vItem instanceof IResettable ← impossible : an interface is erased, nothing is left at runtime

// 5) [TS] Classes are structural too : an object with the same shape passes the type check
const oFake: CHexFormatter = { strLabel: "FAKE", Format: () => "?", Show: () => "fake" };
console.log("5) TS accepted oFake / instanceof CHexFormatter =", oFake instanceof CHexFormatter);
