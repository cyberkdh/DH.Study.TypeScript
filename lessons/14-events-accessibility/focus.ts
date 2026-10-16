//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 14-events-accessibility / focus
//	History			: 2026-10-15 CYBERKDH Initial
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// Focus and accessibility : focus vs focusin, tabindex, a toolbar with arrow keys (roving tabindex),
// aria-pressed, a live status line, and <details>.
// Runs in the browser : npm run web → http://127.0.0.1:5173/lessons/14-events-accessibility/
function Log(...arrPart: unknown[]): void {
	const strLine = arrPart.map(String).join(" ");
	console.log(strLine);
	const elLog = document.getElementById("focus-log");
	if (elLog !== null) {
		elLog.textContent += strLine + "\n";
	}
}

// BODY, DIV#plain, BUTTON "upper"
function Describe(elTarget: Element | null): string {
	if (elTarget === null || elTarget === document.body) {
		return String(elTarget?.tagName ?? null);
	}
	return elTarget.id !== "" ? `${elTarget.tagName}#${elTarget.id}` : `${elTarget.tagName} "${elTarget.textContent.trim()}"`;
}

function ById<T extends HTMLElement>(strId: string, cType: { new (): T; prototype: T }): T {
	const elFound = document.getElementById(strId);
	if (!(elFound instanceof cType)) {
		throw new Error(`#${strId} is missing or is not a ${cType.name}`);
	}
	return elFound;
}

// The next index for a key, or undefined when the key does not move. The ends wrap around
function NextIndex(strKey: string, nAt: number, nCount: number): number | undefined {
	switch (strKey) {
		case "ArrowRight":
		case "ArrowDown":
			return (nAt + 1) % nCount;
		case "ArrowLeft":
		case "ArrowUp":
			return (nAt - 1 + nCount) % nCount;
		case "Home":
			return 0;
		case "End":
			return nCount - 1;
		default:
			return undefined;
	}
}

async function RunFocus(): Promise<void> {
	const elToolbar = ById("toolbar", HTMLDivElement);
	const elPlain = ById("plain", HTMLDivElement);
	const elHelp = ById("help", HTMLDetailsElement);
	const elStatus = ById("focus-status", HTMLParagraphElement);
	const arrButton = [...elToolbar.querySelectorAll<HTMLButtonElement>("button[data-flag]")];

	// 1) [JS] "focus" and "blur" do not bubble, "focusin" and "focusout" do : a parent listens with focusin
	let nFocus = 0;
	let nFocusIn = 0;
	elToolbar.addEventListener("focus", () => nFocus++);
	elToolbar.addEventListener("focusin", () => nFocusIn++);
	arrButton[0]?.focus();
	Log(`1) focus a button inside : the toolbar heard "focus" ${nFocus}, "focusin" ${nFocusIn} · activeElement = ${Describe(document.activeElement)}`);

	// 2) [JS] Roving tabindex : one button has tabindex 0 (Tab stops there), the rest -1 (focus from code only).
	//    Tab enters and leaves the toolbar in one step. Arrow keys move inside it
	function SetActive(nIndex: number): void {
		arrButton.forEach((elButton, nAt) => {
			elButton.tabIndex = nAt === nIndex ? 0 : -1;
		});
		arrButton[nIndex]?.focus();
	}
	SetActive(0);

	elToolbar.addEventListener("keydown", (oEvent) => {
		const elFrom = oEvent.target instanceof Element ? oEvent.target.closest<HTMLButtonElement>("button[data-flag]") : null;
		const nAt = elFrom === null ? -1 : arrButton.indexOf(elFrom);
		const nNext = nAt === -1 ? undefined : NextIndex(oEvent.key, nAt, arrButton.length);
		if (nNext === undefined) {
			return; // Tab, Enter, Space ... : the browser handles them
		}
		oEvent.preventDefault(); // no page scroll for the arrow keys
		SetActive(nNext);
	});

	const TabIndexes = (): string => arrButton.map((elButton) => elButton.tabIndex).join(" ");
	Log(`2) tabindex = [${TabIndexes()}]`);
	for (const strKey of ["ArrowRight", "ArrowRight", "End", "ArrowRight", "ArrowLeft"]) {
		document.activeElement?.dispatchEvent(new KeyboardEvent("keydown", { key: strKey, bubbles: true, cancelable: true }));
		Log(`   ${strKey.padEnd(10)} → tabindex = [${TabIndexes()}] · focus = ${Describe(document.activeElement)}`);
	}

	// 3) [JS + TS] aria-pressed makes a button a toggle for screen readers. The CSS styles [aria-pressed="true"],
	//    so the attribute is the one place the state lives. role="status" reads new text aloud without moving focus
	for (const elButton of arrButton) {
		elButton.setAttribute("aria-pressed", "false");
		// elButton.ariaPressed = false; // ← Uncomment → TS2322 (Type 'boolean' is not assignable to type 'string')
	}
	elToolbar.addEventListener("click", (oEvent) => {
		const elButton = oEvent.target instanceof Element ? oEvent.target.closest<HTMLButtonElement>("button[data-flag]") : null;
		if (elButton === null) {
			return;
		}
		const bOn = elButton.getAttribute("aria-pressed") !== "true";
		elButton.setAttribute("aria-pressed", String(bOn));
		SetActive(arrButton.indexOf(elButton)); // a click moves the Tab stop too
		elStatus.textContent = `${elButton.dataset["flag"]} ${bOn ? "on" : "off"}`;
	});
	const Pressed = (): string => arrButton.filter((elButton) => elButton.getAttribute("aria-pressed") === "true").map((elButton) => elButton.dataset["flag"]).join(", ");
	for (const nIndex of [0, 2, 0]) {
		arrButton[nIndex]?.click();
		Log(`3) click ${arrButton[nIndex]?.dataset["flag"]} → pressed : [${Pressed()}] · status : "${elStatus.textContent}"`);
	}

	// 4) [JS] <details> opens and closes with no code, from the mouse and the keyboard. "toggle" comes a moment later
	let bHeard = false;
	const oToggled = new Promise<void>((fnResolve) => {
		elHelp.addEventListener(
			"toggle",
			() => {
				bHeard = true;
				fnResolve();
			},
			{ once: true },
		);
	});
	elHelp.open = true;
	Log(`4) right after open = true : toggle heard = ${bHeard}`);
	await oToggled;
	Log(`   after await : toggle heard = ${bHeard}, open = ${elHelp.open}`);

	// 5) A <div> is not focusable. focus() on it does nothing and says nothing
	elPlain.focus();
	Log(`5) Expected problem: after elPlain.focus(), activeElement is still ${Describe(document.activeElement)}`);
	Log("   Why : only controls (button, input, a href ...) and elements with tabindex can take focus. Others ignore focus().");
	Log('   Fix : use a real <button> for things users press. For focus from code only, add tabindex="-1".');
	elPlain.tabIndex = -1;
	elPlain.focus();
	Log(`   with tabindex="-1" → activeElement = ${Describe(document.activeElement)}`);
	Log("   now press Tab into the toolbar, then the arrow keys, Enter and Space");
}

// 6) [JS] In Node there is no document : explain instead of crashing
if (typeof document === "undefined") {
	console.log("This example runs in the browser (it uses document).");
	console.log("  npm run web  →  http://127.0.0.1:5173/lessons/14-events-accessibility/");
} else {
	await RunFocus();
}
