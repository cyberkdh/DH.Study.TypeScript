//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 14-events-accessibility / bitgrid
//	History			: 2026-10-15 CYBERKDH Initial
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// Build it : a 16-bit grid. One button per bit, made in a loop, one listener for all of them,
// arrow keys to move, aria-pressed for the state. The value is the only state : the buttons follow it.
// Runs in the browser : npm run web → http://127.0.0.1:5173/lessons/14-events-accessibility/
function Log(...arrPart: unknown[]): void {
	const strLine = arrPart.map(String).join(" ");
	console.log(strLine);
	const elLog = document.getElementById("bitgrid-log");
	if (elLog !== null) {
		elLog.textContent += strLine + "\n";
	}
}

const GRID_BITS = 16;
const GRID_COLUMNS = 8; // the same number as grid-template-columns in index.html

// 1) [JS] Pure functions : no DOM, easy to test
function ToggleBit(biValue: bigint, nBit: number): bigint {
	return biValue ^ (1n << BigInt(nBit));
}

function IsBitSet(biValue: bigint, nBit: number): boolean {
	return ((biValue >> BigInt(nBit)) & 1n) === 1n;
}

function Hex(biValue: bigint): string {
	return "0x" + biValue.toString(16).toUpperCase().padStart(GRID_BITS / 4, "0");
}

// 2) [JS + TS] The grid as a class. # fields are private in JavaScript itself (lesson 05)
class CBitGrid {
	readonly #elGrid: HTMLElement;
	readonly #arrButton: HTMLButtonElement[] = []; // [0] is bit 15 (left), the last is bit 0 (right)
	readonly #fnChange: (biValue: bigint) => void;
	#biValue = 0n;

	constructor(elGrid: HTMLElement, fnChange: (biValue: bigint) => void) {
		this.#elGrid = elGrid;
		this.#fnChange = fnChange;
		for (let nBit = GRID_BITS - 1; nBit >= 0; nBit--) {
			const elButton = document.createElement("button");
			elButton.type = "button";
			elButton.dataset["bit"] = String(nBit);
			elButton.setAttribute("aria-label", `bit ${nBit}`); // a screen reader says "bit 4, toggle button, pressed"
			this.#arrButton.push(elButton);
		}
		elGrid.replaceChildren(...this.#arrButton);
		// 3) [JS] Two listeners for all 16 buttons : delegation (section 2 of the lesson)
		elGrid.addEventListener("click", (oEvent) => this.#OnClick(oEvent));
		elGrid.addEventListener("keydown", (oEvent) => this.#OnKeyDown(oEvent));
		this.#Focusable(0);
		this.#Render();
	}

	get biValue(): bigint {
		return this.#biValue;
	}

	// 4) [JS] Check before changing : a value that does not fit is refused, the grid stays as it was
	SetValue(biValue: bigint): void {
		if (biValue < 0n || biValue >= 1n << BigInt(GRID_BITS)) {
			throw new RangeError(`${Hex(biValue)} does not fit in ${GRID_BITS} bits`);
		}
		this.#biValue = biValue;
		this.#Render();
		this.#fnChange(biValue);
	}

	// What the buttons show, as text : "1111 0000 0000 1111"
	Shown(): string {
		const strBits = this.#arrButton.map((elButton) => elButton.textContent).join("");
		return strBits.replace(/(.{4})(?=.)/g, "$1 ");
	}

	Focus(nBit: number): void {
		this.#arrButton[GRID_BITS - 1 - nBit]?.focus();
	}

	// The value → every button. The only place that writes to the buttons
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

	// 5) [JS] Arrow keys move by one button, Up / Down by one row. Enter and Space are left to the button :
	//    a real key press on a <button> already clicks it, and the click listener above does the rest
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

	// Roving tabindex : Tab stops at one button of the grid
	#Focusable(nIndex: number): void {
		this.#arrButton.forEach((elButton, nAt) => {
			elButton.tabIndex = nAt === nIndex ? 0 : -1;
		});
	}
}

// key → new index. A Map, not an object : "toString" is not a key here (lesson 13)
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

	// 6) Click from code, the same way the user would
	for (const nBit of [0, 4, 7, 4]) {
		ClickBit(nBit);
		Log(`6) click bit ${String(nBit).padStart(2)} → ${Hex(oGrid.biValue)} · ${oGrid.Shown()}`);
	}

	// 7) The value changes from outside (in DevCalc : a new result) → the buttons follow
	oGrid.SetValue(0xf00fn);
	Log(`7) SetValue(0xF00F)  → ${Hex(oGrid.biValue)} · ${oGrid.Shown()} · bit 12 aria-pressed = ${elGrid.querySelector('[data-bit="12"]')?.getAttribute("aria-pressed")}`);

	// 8) Arrow keys : focus moves, the value does not
	oGrid.Focus(15);
	for (const strKey of ["ArrowRight", "ArrowRight", "ArrowDown", "End", "ArrowRight"]) {
		document.activeElement?.dispatchEvent(new KeyboardEvent("keydown", { key: strKey, bubbles: true, cancelable: true }));
		Log(`8) ${strKey.padEnd(10)} → focus = ${document.activeElement?.getAttribute("aria-label")}`);
	}

	// 9) A value that does not fit
	try {
		oGrid.SetValue(0x12345n);
	} catch (e) {
		Log(`9) Expected error: ${String(e)}`);
		Log(`   Why : 0x12345 needs 17 bits and the grid has ${GRID_BITS}. SetValue checks first, so the grid still shows ${Hex(oGrid.biValue)}.`);
		Log("   Fix : wrap it to the word size first (value & 0xFFFF), as DevCalc does with --bits.");
	}
	Log("   now click the bits, or Tab to the grid and use the arrow keys and Space");
}

// 10) [JS] In Node there is no document : explain instead of crashing
if (typeof document === "undefined") {
	console.log("This example runs in the browser (it uses document).");
	console.log("  npm run web  →  http://127.0.0.1:5173/lessons/14-events-accessibility/");
} else {
	RunBitGrid();
}
