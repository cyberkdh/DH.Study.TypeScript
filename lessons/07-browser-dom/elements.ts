//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 07-browser-dom / elements
//	History			: 2026-10-15 CYBERKDH Initial
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// Runs in the browser : npm run web → http://127.0.0.1:5173/lessons/07-browser-dom/
// Writes what it does into the grey box of section 1 (and the DevTools console).
function Log(...arrPart: unknown[]): void {
	const strLine = arrPart.map(String).join(" ");
	console.log(strLine);
	const elLog = document.getElementById("elements-log");
	if (elLog !== null) {
		elLog.textContent += strLine + "\n";
	}
}

// 2) [TS] A helper : find one element and check its type at run time, or throw with a clear message
function QueryOne<T extends Element>(strSelector: string, cType: { new (): T; prototype: T }): T {
	const elFound = document.querySelector(strSelector);
	if (!(elFound instanceof cType)) {
		throw new Error(`${strSelector} : expected ${cType.name}, found ${elFound === null ? "nothing" : elFound.tagName}`);
	}
	return elFound; // narrowed to T by instanceof
}

function RunElements(): void {
	// 1) [JS + TS] querySelector returns Element | null : the element may not exist
	const elTitle = document.querySelector("#title"); // Element | null
	// elTitle.textContent = "x"; // ← Uncomment → red squiggle TS18047 ('elTitle' is possibly 'null')
	if (elTitle !== null) {
		Log("1) #title text =", elTitle.textContent);
	}
	const elAny = document.querySelector("#expr"); // Element : TS can't know it is an <input>
	// Log(elAny?.value); // ← Uncomment → red squiggle TS2339 (Property 'value' does not exist on type 'Element')
	Log("   #expr is an", elAny?.tagName, "but TS only knows: Element");

	// 2) [TS] Three ways to get the right type
	const elByTag = document.querySelector("input"); // a tag name : HTMLInputElement | null (from the tag map)
	const elByGeneric = document.querySelector<HTMLInputElement>("#expr"); // generic : you promise the type
	const elChecked = QueryOne("#expr", HTMLInputElement); // checked at run time : safest
	Log("2) value =", elByTag?.value, elByGeneric?.value, elChecked.value);
	try {
		QueryOne("#title", HTMLInputElement);
	} catch (e) {
		Log("   Expected error:", (e as Error).message);
		Log("   Why : #title is a <p>, not an <input>. A cast (as / <T>) would have hidden this.");
		Log("   Fix : check the selector and the HTML. QueryOne finds it at the first run.");
	}

	// 3) [JS] textContent puts plain text. innerHTML parses HTML : never give it user input
	const strUserInput = "<img src=x onerror=alert(1)>";
	elChecked.value = strUserInput;
	const elSafe = document.createElement("p");
	elSafe.textContent = elChecked.value; // shown as text, nothing runs
	Log("3) textContent keeps it as text :", elSafe.textContent, "/ child elements =", elSafe.children.length);
	elChecked.value = "0xFF";

	// 4) [JS + TS] Create elements. createElement("tr") returns HTMLTableRowElement (from the tag name)
	const elBody = QueryOne("#result tbody", HTMLTableSectionElement);
	const arrRow: [string, string][] = [
		["HEX", "0xFF"],
		["DEC", "255"],
	];
	for (const [strLabel, strValue] of arrRow) {
		const elRow = document.createElement("tr");
		elRow.insertCell().textContent = strLabel;
		elRow.insertCell().textContent = strValue;
		elBody.append(elRow);
	}
	Log("4) rows added =", elBody.rows.length);

	// 5) [JS] Classes, data-* attributes (dataset), attributes
	const elTitleP = QueryOne("#title", HTMLParagraphElement);
	elTitleP.classList.add("highlight");
	Log("5) class =", elTitleP.className, "/ has highlight =", elTitleP.classList.contains("highlight"));
	for (const elItem of document.querySelectorAll<HTMLLIElement>("#regs li")) {
		// dataset values are string | undefined : the attribute may be missing
		const biValue = BigInt(elItem.dataset["value"] ?? "0");
		Log(`   ${elItem.dataset["reg"]} = ${biValue} (data-value="${elItem.getAttribute("data-value")}")`);
	}

	// 6) [JS] Remove : the element leaves the page
	const elRegs = QueryOne("#regs", HTMLUListElement);
	elRegs.lastElementChild?.remove();
	Log("6) after remove : li count =", elRegs.children.length);
}

// 7) [JS] In Node there is no document : explain instead of crashing
if (typeof document === "undefined") {
	console.log("This example runs in the browser (it uses document).");
	console.log("  npm run web  →  http://127.0.0.1:5173/lessons/07-browser-dom/");
} else {
	RunElements();
}
