//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 14-events-accessibility / propagation
//	History			: 2026-10-15 CYBERKDH Initial
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// Where an event travels : capture, target, bubble. target vs currentTarget, closest(), stopPropagation.
// Runs in the browser : npm run web → http://127.0.0.1:5173/lessons/14-events-accessibility/
function Log(...arrPart: unknown[]): void {
	const strLine = arrPart.map(String).join(" ");
	console.log(strLine);
	const elLog = document.getElementById("propagation-log");
	if (elLog !== null) {
		elLog.textContent += strLine + "\n";
	}
}

// "BUTTON#leaf", "SPAN", "null" : enough to tell elements apart in the log
function Describe(oTarget: EventTarget | null): string {
	if (!(oTarget instanceof Element)) {
		return String(oTarget);
	}
	return oTarget.id === "" ? oTarget.tagName : `${oTarget.tagName}#${oTarget.id}`;
}

function ById<T extends HTMLElement>(strId: string, cType: { new (): T; prototype: T }): T {
	const elFound = document.getElementById(strId);
	if (!(elFound instanceof cType)) {
		throw new Error(`#${strId} is missing or is not a ${cType.name}`);
	}
	return elFound;
}

async function RunPropagation(): Promise<void> {
	const elOuter = ById("outer", HTMLDivElement);
	const elInner = ById("inner", HTMLDivElement);
	const elLeaf = ById("leaf", HTMLButtonElement);
	const elMenu = ById("menu", HTMLUListElement);

	// 1) [JS] One click visits three phases : capture (window → down to the target), target, bubble (back up).
	//    { capture: true } listens on the way down. eventPhase : 1 capture, 2 at target, 3 bubble
	const arrPath: string[] = [];
	for (const elBox of [elOuter, elInner]) {
		elBox.addEventListener("click", (oEvent) => arrPath.push(`${elBox.id}(${oEvent.eventPhase})`), { capture: true });
		elBox.addEventListener("click", (oEvent) => arrPath.push(`${elBox.id}(${oEvent.eventPhase})`));
	}
	elLeaf.addEventListener("click", (oEvent) => arrPath.push(`leaf(${oEvent.eventPhase})`));
	document.addEventListener("click", () => {
		if (arrPath.length > 0) {
			Log(`1) ${arrPath.join(" → ")}`); // the last listener on the way up prints the path
			arrPath.length = 0;
		}
	});
	elLeaf.click();
	elInner.click(); // a click on inner itself : leaf is not on the path

	// 2) [JS + TS] Delegation (lesson 07) with closest() : target is what was clicked (maybe the <span> inside),
	//    currentTarget is the element whose listener runs. closest() walks up from target to the first match
	elMenu.addEventListener("click", (oEvent) => {
		const oTarget = oEvent.target;
		// Log(oEvent.currentTarget.id); // ← Uncomment → TS18047 ('oEvent.currentTarget' is possibly 'null')
		const strOld = oTarget instanceof HTMLButtonElement ? oTarget.dataset["cmd"] : undefined; // the lesson 07 way
		const elButton = oTarget instanceof Element ? oTarget.closest<HTMLButtonElement>("button[data-cmd]") : null;
		const strCmd = elButton !== null && elMenu.contains(elButton) ? elButton.dataset["cmd"] : undefined; // closest may go above the menu
		Log(`   target = ${Describe(oTarget)} · currentTarget = ${Describe(oEvent.currentTarget)} · instanceof → ${strOld ?? "missed"} · closest → ${strCmd ?? "none"}`);
	});
	Log("2) delegation : one listener on the menu");
	const elCopy = elMenu.querySelector<HTMLButtonElement>("button[data-cmd='copy']");
	elCopy?.click(); // on the button
	elCopy?.querySelector("span")?.click(); // on the icon inside it : instanceof misses it

	// 3) [JS] The menu's one listener also handles a button added later : no new addEventListener
	const elItem = document.createElement("li");
	const elPaste = document.createElement("button");
	elPaste.type = "button";
	elPaste.dataset["cmd"] = "paste";
	elPaste.textContent = "paste";
	elItem.append(elPaste);
	elMenu.append(elItem);
	Log("3) a button added after the listener :");
	elPaste.click();

	// 4) [JS] stopPropagation : the parents never hear it. Delegated listeners above (menus, logging) miss it too
	const elParent = document.createElement("div"); // not on the page : events still travel inside it
	const elChild = document.createElement("button");
	elParent.append(elChild);
	let nParentHeard = 0;
	elParent.addEventListener("click", () => nParentHeard++);
	elChild.addEventListener("click", (oEvent) => {
		if (oEvent.shiftKey) {
			oEvent.stopPropagation();
		}
	});
	elChild.click();
	elChild.dispatchEvent(new MouseEvent("click", { bubbles: true, shiftKey: true }));
	Log(`4) 2 clicks, the second with stopPropagation : the parent heard ${nParentHeard}`);

	// 5) [JS] currentTarget is set only while a listener runs. After an await it is null
	const elLate = document.createElement("button");
	elLate.id = "late";
	const oDone = new Promise<void>((fnResolve) => {
		elLate.addEventListener("click", async (oEvent) => {
			const elBefore = oEvent.currentTarget as HTMLButtonElement; // read before the first await : fine
			await Promise.resolve(); // e.g. await navigator.clipboard.writeText(...)
			try {
				const elAfter = oEvent.currentTarget as HTMLButtonElement; // as hides the null from TS
				Log(elAfter.id);
			} catch (e) {
				Log(`5) before await : ${Describe(elBefore)} · after await : ${Describe(oEvent.currentTarget)}`);
				Log(`   Expected error: ${String(e)}`);
				Log("   Why : the event finished travelling at the await, so the browser cleared currentTarget. as HTMLButtonElement hid the null.");
				Log("   Fix : copy currentTarget (or the values you need) into a const before the first await.");
			}
			fnResolve();
		});
	});
	elLate.click();
	await oDone;
	Log("   now click inside the boxes and the menu yourself");
}

// 6) [JS] In Node there is no document : explain instead of crashing
if (typeof document === "undefined") {
	console.log("This example runs in the browser (it uses document).");
	console.log("  npm run web  →  http://127.0.0.1:5173/lessons/14-events-accessibility/");
} else {
	await RunPropagation();
}
