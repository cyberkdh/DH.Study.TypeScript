//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 04-classes-errors / inheritance (상속과 인터페이스 구현)
//	History			: 2026-10-15 CYBERKDH Initial (최초 작성)
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// 1) [TS] 추상 클래스 (abstract class) : new 로 만들 수 없음. 추상 멤버는 하위 클래스가 채움
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
// new CFormatter("X"); // ← 주석을 풀면 빨간 줄 TS2511 (추상 클래스)
console.log("1) CFormatter is abstract : only its subclasses can be created");

// 2) [JS + TS] extends, super(...), override
class CHexFormatter extends CFormatter {
	constructor() {
		super("HEX"); // "this" 를 쓰기 전에 먼저 호출해야 함
	}

	override Format(biValue: bigint): string {
		return "0x" + biValue.toString(16).toUpperCase();
	}
}

class CLowerHexFormatter extends CHexFormatter {
	override Format(biValue: bigint): string {
		return super.Format(biValue).toLowerCase(); // 부모 클래스의 메서드 호출
	}
	// 위의 "override" 를 지우면 빨간 줄 TS4114 (noImplicitOverride : 재정의는 의도적으로 표시)
}

const arrFormatter: CFormatter[] = [new CHexFormatter(), new CLowerHexFormatter()];
for (const oFormatter of arrFormatter) {
	console.log("2)", oFormatter.Show(255n), `(${oFormatter.constructor.name})`);
}

// 3) [TS] implements : 인터페이스의 멤버를 구현하겠다는 선언
interface IResettable {
	Reset(): void;
}
class CAccumulator implements IResettable {
	#biTotal = 0n;

	Add(biValue: bigint): this {
		this.#biTotal += biValue;
		return this; // this 를 돌려주면 → 호출을 이어 쓸 수 있음 (메서드 체이닝, method chaining)
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

// 4) [JS + TS] instanceof : 클래스로 좁히기 (클래스는 실행 중에도 있고, 인터페이스는 없음)
function Describe(vItem: CFormatter | IResettable): string {
	if (vItem instanceof CFormatter) {
		return vItem.Show(10n); // 여기서는 CFormatter
	}
	return "something resettable";
}
console.log("4)", Describe(new CHexFormatter()), "/", Describe(oAcc));
// vItem instanceof IResettable ← 불가능 : 인터페이스는 지워져서 실행 중에는 아무것도 남지 않음

// 5) [TS] 클래스도 구조적 타입 (structural typing) : 모양이 같은 객체는 타입 검사를 통과함
const oFake: CHexFormatter = { strLabel: "FAKE", Format: () => "?", Show: () => "fake" };
console.log("5) TS accepted oFake / instanceof CHexFormatter =", oFake instanceof CHexFormatter);
