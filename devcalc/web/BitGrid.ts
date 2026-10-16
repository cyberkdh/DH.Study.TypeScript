//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: devcalc / web / BitGrid (One button per bit of the current value)
//	History			: 2026-10-15 CYBERKDH Initial - Lesson 14 DevCalc step, Lv9
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// Lesson 14: the bit grid. It shows a value and reports clicks; it does not keep the value.
// App.ts turns a click on bit n into the expression "value ^ bit(n)", so the new value comes from
// Evaluate like every other result, goes into the history, and comes back here through Show().
// No imports : this file only needs the DOM.

const GRID_COLUMNS = 16; // the same number as grid-template-columns in style.css

// key → how the index of the focused button changes. A Map : "toString" is not a key (lesson 13)
const MAP_MOVE = new Map<string, (nAt: number, nLast: number) => number>([
	["ArrowLeft", (nAt) => nAt - 1],
	["ArrowRight", (nAt) => nAt + 1],
	["ArrowUp", (nAt) => nAt - GRID_COLUMNS],
	["ArrowDown", (nAt) => nAt + GRID_COLUMNS],
	["Home", () => 0],
	["End", (_nAt, nLast) => nLast],
]);

export class CBitGrid {
	readonly #elGrid: HTMLElement;
	readonly #fnToggle: (nBit: number) => void;
	#arrButton: HTMLButtonElement[] = []; // [0] is the highest bit (left), the last is bit 0 (right)
	#nFocusable = 0; // roving tabindex : the one button Tab stops at

	constructor(elGrid: HTMLElement, fnToggle: (nBit: number) => void) {
		this.#elGrid = elGrid;
		this.#fnToggle = fnToggle;
		// Two listeners for up to 128 buttons, added once : the buttons are made again when the word size changes
		elGrid.addEventListener("click", (oEvent) => {
			const elButton = this.#ButtonOf(oEvent);
			if (elButton !== undefined) {
				this.#SetFocusable(this.#arrButton.indexOf(elButton));
				this.#fnToggle(Number(elButton.dataset["bit"]));
			}
		});
		elGrid.addEventListener("keydown", (oEvent) => this.#OnKeyDown(oEvent));
	}

	// Shows biValue (already unsigned, 0 .. 2^nBits - 1). New buttons only when the size changes,
	// so the focused button keeps its focus after a click
	Show(biValue: bigint, nBits: number): void {
		if (nBits !== this.#arrButton.length) {
			this.#Build(nBits);
		}
		for (const elButton of this.#arrButton) {
			const bSet = ((biValue >> BigInt(elButton.dataset["bit"] ?? 0)) & 1n) === 1n;
			elButton.textContent = bSet ? "1" : "0";
			elButton.setAttribute("aria-pressed", String(bSet)); // the CSS styles [aria-pressed="true"]
		}
	}

	#Build(nBits: number): void {
		this.#arrButton = [];
		for (let nBit = nBits - 1; nBit >= 0; nBit--) {
			const elButton = document.createElement("button");
			elButton.type = "button";
			elButton.dataset["bit"] = String(nBit);
			elButton.title = `bit ${nBit}`;
			elButton.setAttribute("aria-label", `bit ${nBit}`);
			elButton.classList.toggle("nibble", nBit % 4 === 0 && nBit !== 0); // a gap after every 4 bits
			this.#arrButton.push(elButton);
		}
		this.#elGrid.replaceChildren(...this.#arrButton);
		this.#elGrid.setAttribute("aria-label", `bits ${nBits - 1} to 0`);
		this.#SetFocusable(0);
	}

	#ButtonOf(oEvent: Event): HTMLButtonElement | undefined {
		const elButton = oEvent.target instanceof Element ? oEvent.target.closest<HTMLButtonElement>("button[data-bit]") : null;
		return elButton !== null && this.#elGrid.contains(elButton) ? elButton : undefined;
	}

	// Arrow keys move the focus. Enter and Space are left to the <button> : they click it
	#OnKeyDown(oEvent: KeyboardEvent): void {
		const elButton = this.#ButtonOf(oEvent);
		const fnMove = MAP_MOVE.get(oEvent.key);
		if (elButton === undefined || fnMove === undefined) {
			return;
		}
		oEvent.preventDefault(); // no page scroll
		const nLast = this.#arrButton.length - 1;
		this.#SetFocusable(Math.min(nLast, Math.max(0, fnMove(this.#arrButton.indexOf(elButton), nLast))));
		this.#arrButton[this.#nFocusable]?.focus();
	}

	#SetFocusable(nIndex: number): void {
		this.#nFocusable = nIndex;
		this.#arrButton.forEach((elButton, nAt) => {
			elButton.tabIndex = nAt === nIndex ? 0 : -1;
		});
	}
}
