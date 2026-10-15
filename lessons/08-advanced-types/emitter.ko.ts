//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 08-advanced-types / emitter (직접 만들기: 타입이 지정된 이벤트 이미터)
//	History			: 2026-10-15 CYBERKDH Initial (최초 작성)
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// 직접 만들기 : 타입이 지정된 이벤트 이미터 (event emitter). 이벤트 이름과 인수가 한 타입에서 나옴

// 1) [TS] 이벤트 맵 : 이벤트 이름 → 인수 튜플 (튜플 요소에 이름을 붙이면 힌트가 읽기 쉬움)
type TEventMap = Record<string, unknown[]>;
type TListener<A extends unknown[]> = (...arrArg: A) => void;

// 2) [TS] 매핑된 타입 : 이벤트 이름마다 선택적인 리스너 Set 하나
type TListeners<TEvents extends TEventMap> = { [K in keyof TEvents]?: Set<TListener<TEvents[K]>> };

// 3) [JS + TS] 클래스 : K extends keyof TEvents 가 이름과 인수를 연결
class CEmitter<TEvents extends TEventMap> {
	#oListeners: TListeners<TEvents> = {};

	// 리스너를 다시 지우는 함수를 반환 (구독 해제, unsubscribe)
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

	// 호출한 리스너 수를 반환
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

// 4) [TS] 작은 계산기의 이벤트. interface 가 아니라 type 별칭 (7 참고)
type TCalcEvents = {
	evaluated: [strExpr: string, biValue: bigint];
	error: [strTitle: string, strWhy: string, strFix: string];
	cleared: [];
};

// 5) [JS + TS] 이벤트로만 알리는 아주 작은 계산기 : "a + b" 또는 "a << b"
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

// 리스너의 매개변수 타입은 TCalcEvents 에서 옴. 타입 표기 필요 없음
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

fnStopLog(); // 출력하는 리스너의 구독 해제
Evaluate(oEmitter, "2 + 2");
console.log("4) after unsubscribe : nothing printed, history =", arrHistory.length);
console.log("5) Emit(cleared) called", oEmitter.Emit("cleared"), "listener, history =", arrHistory.length);

// 6) [TS] 에디터가 잡아 주는 실수
// oEmitter.Emit("evaluated", "1 + 1"); // ← 주석을 풀면 빨간 줄 TS2554 (인수 3개가 필요한데 2개를 받음)
// oEmitter.Emit("evaluated", "1 + 1", 2); // ← 주석을 풀면 빨간 줄 TS2345 ('number' 타입 인수는 'bigint' 타입 매개변수에 대입할 수 없음)
// oEmitter.On("evaluate", () => {}); // ← 주석을 풀면 빨간 줄 TS2345 ('"evaluate"' 타입 인수는 'keyof TCalcEvents' 타입 매개변수에 대입할 수 없음)

// 7) [TS] 왜 type 별칭인가 : interface 에는 인덱스 시그니처 (index signature) 가 없어서 Record<string, unknown[]> 에 맞지 않음
interface ICalcEvents {
	cleared: [];
}
// const oBad = new CEmitter<ICalcEvents>(); // ← 주석을 풀면 빨간 줄 TS2344 (ICalcEvents 타입에 'string' 인덱스 시그니처가 없음)
const oInterfaceOk = new CEmitter<Pick<ICalcEvents, keyof ICalcEvents>>(); // Pick 은 매핑된 (별칭 같은) 타입을 만들기 때문에 통과
console.log("7) interface via Pick :", oInterfaceOk.Emit("cleared"), "listeners");
