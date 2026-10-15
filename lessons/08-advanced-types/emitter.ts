//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 08-advanced-types / emitter
//	History			: 2026-10-15 CYBERKDH Initial
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// Build it : a typed event emitter. The event names and their arguments come from one type

// 1) [TS] The event map : event name → tuple of arguments (labels make the hints readable)
type TEventMap = Record<string, unknown[]>;
type TListener<A extends unknown[]> = (...arrArg: A) => void;

// 2) [TS] A mapped type : one optional Set of listeners per event name
type TListeners<TEvents extends TEventMap> = { [K in keyof TEvents]?: Set<TListener<TEvents[K]>> };

// 3) [JS + TS] The class : K extends keyof TEvents links the name to its arguments
class CEmitter<TEvents extends TEventMap> {
	#oListeners: TListeners<TEvents> = {};

	// Returns a function that removes the listener again (unsubscribe)
	On<K extends keyof TEvents>(eName: K, fnListener: TListener<TEvents[K]>): () => void {
		let setListener = this.#oListeners[eName];
		if (setListener === undefined) {
			setListener = new Set();
			this.#oListeners[eName] = setListener;
		}
		setListener.add(fnListener);
		return () => {
			setListener.delete(fnListener);
		};
	}

	// Returns how many listeners were called
	Emit<K extends keyof TEvents>(eName: K, ...arrArg: TEvents[K]): number {
		const setListener = this.#oListeners[eName];
		if (setListener === undefined) {
			return 0;
		}
		for (const fnListener of [...setListener]) {
			fnListener(...arrArg);
		}
		return setListener.size;
	}
}

// 4) [TS] The events of a small calculator. A type alias, not an interface (see 7)
type TCalcEvents = {
	evaluated: [strExpr: string, biValue: bigint];
	error: [strTitle: string, strWhy: string, strFix: string];
	cleared: [];
};

// 5) [JS + TS] A tiny calculator that only reports through events : "a + b" or "a << b"
const RE_EXPR = /^\s*(\S+)\s*(\+|<<)\s*(\S+)\s*$/;
function Evaluate(oEmitter: CEmitter<TCalcEvents>, strExpr: string): void {
	const arrMatch = RE_EXPR.exec(strExpr);
	if (arrMatch === null) {
		oEmitter.Emit("error", `cannot read "${strExpr}"`, "only 'a + b' and 'a << b' are supported", "write it like 0xFF + 1");
		return;
	}
	const [, strLeft = "", strOp, strRight = ""] = arrMatch;
	try {
		const biLeft = BigInt(strLeft);
		const biRight = BigInt(strRight);
		oEmitter.Emit("evaluated", strExpr, strOp === "+" ? biLeft + biRight : biLeft << biRight);
	} catch (e) {
		oEmitter.Emit("error", (e as Error).name, (e as Error).message, "use numbers like 255, 0xFF or 0b1010");
	}
}

const oEmitter = new CEmitter<TCalcEvents>();
const arrHistory: string[] = [];

// The listener's parameters are typed from TCalcEvents. No annotations needed
const fnStopLog = oEmitter.On("evaluated", (strExpr, biValue) => {
	console.log(`   ${strExpr} = ${biValue} (0x${biValue.toString(16).toUpperCase()})`);
});
oEmitter.On("evaluated", (strExpr) => arrHistory.push(strExpr));
oEmitter.On("error", (strTitle, strWhy, strFix) => {
	console.log("   Expected error:", strTitle);
	console.log("   Why :", strWhy);
	console.log("   Fix :", strFix);
});
oEmitter.On("cleared", () => {
	arrHistory.length = 0;
});

console.log("1) two listeners on evaluated :");
Evaluate(oEmitter, "0xFF + 1");
Evaluate(oEmitter, "1 << 8");
console.log("2) error event :");
Evaluate(oEmitter, "0xFF * 2");
Evaluate(oEmitter, "0xZZ + 1");
console.log("3) history :", arrHistory.join(" | "));

fnStopLog(); // unsubscribe the printing listener
Evaluate(oEmitter, "2 + 2");
console.log("4) after unsubscribe : nothing printed, history =", arrHistory.length);
console.log("5) Emit(cleared) called", oEmitter.Emit("cleared"), "listener, history =", arrHistory.length);

// 6) [TS] Mistakes the editor catches
// oEmitter.Emit("evaluated", "1 + 1"); // ← Uncomment → red squiggle TS2554 (Expected 3 arguments, but got 2)
// oEmitter.Emit("evaluated", "1 + 1", 2); // ← Uncomment → red squiggle TS2345 (Argument of type 'number' is not assignable to parameter of type 'bigint')
// oEmitter.On("evaluate", () => {}); // ← Uncomment → red squiggle TS2345 (Argument of type '"evaluate"' is not assignable to parameter of type 'keyof TCalcEvents')

// 7) [TS] Why a type alias : an interface has no index signature, so it does not fit Record<string, unknown[]>
interface ICalcEvents {
	cleared: [];
}
// const oBad = new CEmitter<ICalcEvents>(); // ← Uncomment → red squiggle TS2344 (Index signature for type 'string' is missing in type 'ICalcEvents')
const oInterfaceOk = new CEmitter<Pick<ICalcEvents, keyof ICalcEvents>>(); // Pick makes a mapped (alias-like) type, which fits
console.log("7) interface via Pick :", oInterfaceOk.Emit("cleared"), "listeners");
