//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 07-browser-dom / events
//	History			: 2026-10-15 CYBERKDH Initial
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// Runs in the browser : npm run web → http://127.0.0.1:5173/lessons/07-browser-dom/
// The code below also "clicks" and "types" once by itself, so the grey box shows the results right away.
function Log(...arrPart: unknown[]): void {
	const strLine = arrPart.map(String).join(" ");
	console.log(strLine);
	const elLog = document.getElementById("events-log");
	if (elLog !== null) {
		elLog.textContent += strLine + "\n";
	}
}

function RunEvents(): void {
	const elButton = document.querySelector<HTMLButtonElement>("#count-btn");
	const elCount = document.querySelector<HTMLSpanElement>("#count");
	const elKey = document.querySelector<HTMLInputElement>("#key-input");
	const elOps = document.querySelector<HTMLParagraphElement>("#ops");
	const elLink = document.querySelector<HTMLAnchorElement>("#docs-link");
	if (elButton === null || elCount === null || elKey === null || elOps === null || elLink === null) {
		Log("Expected elements are missing : open this file through index.html");
		return;
	}

	// 1) [JS + TS] addEventListener : the event name picks the event type ("click" → PointerEvent, a MouseEvent with pointer details)
	let nCount = 0;
	elButton.addEventListener("click", (oEvent) => {
		nCount++;
		elCount.textContent = String(nCount);
		Log(`1) click #${nCount} : button = ${oEvent.button}, isTrusted = ${oEvent.isTrusted}`);
		// Log(oEvent.key); // ← Uncomment → red squiggle TS2339 (Property 'key' does not exist on type 'PointerEvent')
	});
	elButton.click(); // a click from code : isTrusted = false (a real click is true)
	elButton.click();

	// 2) [JS + TS] Keyboard : "keydown" → KeyboardEvent, with key and modifier flags
	elKey.addEventListener("keydown", (oEvent) => {
		if (oEvent.key === "Enter") {
			Log(`2) Enter pressed : value = "${elKey.value}", ctrl = ${oEvent.ctrlKey}`);
		}
	});
	elKey.value = "0xFF";
	elKey.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));

	// 3) [JS + TS] Event delegation : one listener on the parent handles every button inside it.
	//    target is EventTarget | null, so narrow it before using it
	elOps.addEventListener("click", (oEvent) => {
		const elTarget = oEvent.target;
		if (!(elTarget instanceof HTMLButtonElement)) {
			return; // a click between the buttons
		}
		Log(`3) operator button : data-op = "${elTarget.dataset["op"]}"`);
	});
	for (const elOpButton of elOps.querySelectorAll("button")) {
		elOpButton.click();
	}

	// 4) [JS] preventDefault : stop what the browser would do (follow a link, submit a form)
	elLink.addEventListener("click", (oEvent) => {
		oEvent.preventDefault();
		Log(`4) link click : defaultPrevented = ${oEvent.defaultPrevented} (the page stays here)`);
	});
	elLink.click();

	// 5) [JS] Stop listening : { once: true }, or an AbortController for several listeners at once
	const elTest = document.createElement("button"); // not on the page : click() works anyway
	const oController = new AbortController();
	let nHeard = 0;
	elTest.addEventListener("click", () => nHeard++, { signal: oController.signal });
	elTest.addEventListener("click", () => Log("5) once : runs on the first click only"), { once: true });
	elTest.click();
	oController.abort(); // removes the listener added with this signal
	elTest.click();
	Log(`   with signal : heard ${nHeard} of 2 clicks (aborted after the first)`);

	// 6) [JS + TS] A custom event carries your own data in detail. TS doesn't know custom names : cast once
	document.addEventListener("devcalc:result", (oEvent) => {
		const biValue = (oEvent as CustomEvent<bigint>).detail;
		Log(`6) custom event : detail = ${biValue} (0x${biValue.toString(16).toUpperCase()})`);
	});
	document.dispatchEvent(new CustomEvent<bigint>("devcalc:result", { detail: 255n }));
	Log("   now click the buttons yourself : the lines above get added again");
}

// 7) [JS] In Node there is no document : explain instead of crashing
if (typeof document === "undefined") {
	console.log("This example runs in the browser (it uses document).");
	console.log("  npm run web  →  http://127.0.0.1:5173/lessons/07-browser-dom/");
} else {
	RunEvents();
}
