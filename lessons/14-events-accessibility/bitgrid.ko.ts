//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 14-events-accessibility / bitgrid (직접 만들기: 비트 그리드)
//	History			: 2026-10-15 CYBERKDH Initial (최초 작성)
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// 직접 만들기 : 16 비트 그리드. 비트마다 버튼 하나 (반복문으로 생성), 모든 버튼에 리스너 하나,
// 화살표 키로 이동, 상태는 aria-pressed. 상태는 값 하나뿐 : 버튼은 값을 따라감.
// 브라우저에서 실행 : npm run web → http://127.0.0.1:5173/lessons/14-events-accessibility/?ko
function Log(...arrPart: unknown[]): void {
	const strLine = arrPart.map(String).join(" ");
	console.log(strLine);
	const elLog = document.getElementById("bitgrid-log");
	if (elLog !== null) {
		elLog.textContent += strLine + "\n";
	}
}

const GRID_BITS = 16;
const GRID_COLUMNS = 8; // index.html 의 grid-template-columns 와 같은 수

// 1) [JS] 순수 함수 : DOM 이 없어 테스트하기 쉬움
function ToggleBit(biValue: bigint, nBit: number): bigint {
	return biValue ^ (1n << BigInt(nBit));
}

function IsBitSet(biValue: bigint, nBit: number): boolean {
	return ((biValue >> BigInt(nBit)) & 1n) === 1n;
}

function Hex(biValue: bigint): string {
	return "0x" + biValue.toString(16).toUpperCase().padStart(GRID_BITS / 4, "0");
}

// 2) [JS + TS] 그리드를 클래스로. # 필드는 JavaScript 자체의 private (05강)
class CBitGrid {
	readonly #elGrid: HTMLElement;
	readonly #arrButton: HTMLButtonElement[] = []; // [0] 은 비트 15 (왼쪽), 마지막은 비트 0 (오른쪽)
	readonly #fnChange: (biValue: bigint) => void;
	#biValue = 0n;

	constructor(elGrid: HTMLElement, fnChange: (biValue: bigint) => void) {
		this.#elGrid = elGrid;
		this.#fnChange = fnChange;
		for (let nBit = GRID_BITS - 1; nBit >= 0; nBit--) {
			const elButton = document.createElement("button");
			elButton.type = "button";
			elButton.dataset["bit"] = String(nBit);
			elButton.setAttribute("aria-label", `bit ${nBit}`); // 화면 낭독기는 "bit 4, 토글 버튼, 눌림" 처럼 읽음
			this.#arrButton.push(elButton);
		}
		elGrid.replaceChildren(...this.#arrButton);
		// 3) [JS] 버튼 16 개에 리스너 두 개 : 위임 (강의 2절)
		elGrid.addEventListener("click", (oEvent) => this.#OnClick(oEvent));
		elGrid.addEventListener("keydown", (oEvent) => this.#OnKeyDown(oEvent));
		this.#Focusable(0);
		this.#Render();
	}

	get biValue(): bigint {
		return this.#biValue;
	}

	// 4) [JS] 바꾸기 전에 검사 : 맞지 않는 값은 거부하고 그리드는 그대로 둠
	SetValue(biValue: bigint): void {
		if (biValue < 0n || biValue >= 1n << BigInt(GRID_BITS)) {
			throw new RangeError(`${Hex(biValue)} does not fit in ${GRID_BITS} bits`);
		}
		this.#biValue = biValue;
		this.#Render();
		this.#fnChange(biValue);
	}

	// 버튼에 보이는 내용을 글자로 : "1111 0000 0000 1111"
	Shown(): string {
		const strBits = this.#arrButton.map((elButton) => elButton.textContent).join("");
		return strBits.replace(/(.{4})(?=.)/g, "$1 ");
	}

	Focus(nBit: number): void {
		this.#arrButton[GRID_BITS - 1 - nBit]?.focus();
	}

	// 값 → 모든 버튼. 버튼에 쓰는 유일한 곳
	#Render(): void {
		for (const elButton of this.#arrButton) {
			const bSet = IsBitSet(this.#biValue, Number(elButton.dataset["bit"]));
			elButton.textContent = bSet ? "1" : "0";
			elButton.setAttribute("aria-pressed", String(bSet));
		}
	}

	#ButtonOf(oEvent: Event): HTMLButtonElement | undefined {
		const elButton = oEvent.target instanceof Element ? oEvent.target.closest<HTMLButtonElement>("button[data-bit]") : null;
		return elButton !== null && this.#elGrid.contains(elButton) ? elButton : undefined;
	}

	#OnClick(oEvent: MouseEvent): void {
		const elButton = this.#ButtonOf(oEvent);
		if (elButton !== undefined) {
			this.#Focusable(this.#arrButton.indexOf(elButton));
			this.SetValue(ToggleBit(this.#biValue, Number(elButton.dataset["bit"])));
		}
	}

	// 5) [JS] 화살표 키는 버튼 하나씩, 위 / 아래는 한 줄씩 이동. Enter 와 Space 는 버튼에 맡김 :
	//    <button> 에서 실제 키를 누르면 이미 클릭이 되고, 나머지는 위의 click 리스너가 처리
	#OnKeyDown(oEvent: KeyboardEvent): void {
		const elButton = this.#ButtonOf(oEvent);
		const fnMove = MOVES.get(oEvent.key);
		if (elButton === undefined || fnMove === undefined) {
			return;
		}
		oEvent.preventDefault();
		const nNext = Math.min(GRID_BITS - 1, Math.max(0, fnMove(this.#arrButton.indexOf(elButton))));
		this.#Focusable(nNext);
		this.#arrButton[nNext]?.focus();
	}

	// 로빙 tabindex : Tab 은 그리드의 버튼 하나에서만 멈춤
	#Focusable(nIndex: number): void {
		this.#arrButton.forEach((elButton, nAt) => {
			elButton.tabIndex = nAt === nIndex ? 0 : -1;
		});
	}
}

// 키 → 새 인덱스. 객체가 아니라 Map : 여기서 "toString" 은 키가 아님 (13강)
const MOVES = new Map<string, (nAt: number) => number>([
	["ArrowLeft", (nAt) => nAt - 1],
	["ArrowRight", (nAt) => nAt + 1],
	["ArrowUp", (nAt) => nAt - GRID_COLUMNS],
	["ArrowDown", (nAt) => nAt + GRID_COLUMNS],
	["Home", () => 0],
	["End", () => GRID_BITS - 1],
]);

function RunBitGrid(): void {
	const elGrid = document.getElementById("grid");
	const elValue = document.getElementById("grid-value");
	if (elGrid === null || !(elValue instanceof HTMLOutputElement)) {
		Log("#grid or #grid-value is missing : open this file through index.html");
		return;
	}
	const oGrid = new CBitGrid(elGrid, (biValue) => {
		elValue.value = `${Hex(biValue)} = ${biValue}`;
	});
	const ClickBit = (nBit: number): void => elGrid.querySelector<HTMLButtonElement>(`button[data-bit="${nBit}"]`)?.click();

	// 6) 사용자와 같은 방식으로 코드에서 클릭
	for (const nBit of [0, 4, 7, 4]) {
		ClickBit(nBit);
		Log(`6) click bit ${String(nBit).padStart(2)} → ${Hex(oGrid.biValue)} · ${oGrid.Shown()}`);
	}

	// 7) 바깥에서 값이 바뀜 (DevCalc 에서는 새 결과) → 버튼이 따라감
	oGrid.SetValue(0xf00fn);
	Log(`7) SetValue(0xF00F)  → ${Hex(oGrid.biValue)} · ${oGrid.Shown()} · bit 12 aria-pressed = ${elGrid.querySelector('[data-bit="12"]')?.getAttribute("aria-pressed")}`);

	// 8) 화살표 키 : 포커스는 움직이고 값은 그대로
	oGrid.Focus(15);
	for (const strKey of ["ArrowRight", "ArrowRight", "ArrowDown", "End", "ArrowRight"]) {
		document.activeElement?.dispatchEvent(new KeyboardEvent("keydown", { key: strKey, bubbles: true, cancelable: true }));
		Log(`8) ${strKey.padEnd(10)} → focus = ${document.activeElement?.getAttribute("aria-label")}`);
	}

	// 9) 맞지 않는 값
	try {
		oGrid.SetValue(0x12345n);
	} catch (e) {
		Log(`9) Expected error: ${String(e)}`);
		Log(`   Why : 0x12345 needs 17 bits and the grid has ${GRID_BITS}. SetValue checks first, so the grid still shows ${Hex(oGrid.biValue)}.`);
		Log("   Fix : wrap it to the word size first (value & 0xFFFF), as DevCalc does with --bits.");
	}
	Log("   now click the bits, or Tab to the grid and use the arrow keys and Space");
}

// 10) [JS] Node 에는 document 가 없음 : 에러로 멈추는 대신 안내 메시지 출력
if (typeof document === "undefined") {
	console.log("This example runs in the browser (it uses document).");
	console.log("  npm run web  →  http://127.0.0.1:5173/lessons/14-events-accessibility/");
} else {
	RunBitGrid();
}
