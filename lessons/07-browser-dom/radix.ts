//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 07-browser-dom / radix
//	History			: 2026-10-15 CYBERKDH Initial
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// Build it : a radix converter that updates while you type.
// Runs in the browser : npm run web → http://127.0.0.1:5173/lessons/07-browser-dom/
function Log(...arrPart: unknown[]): void {
	const strLine = arrPart.map(String).join(" ");
	console.log(strLine);
	const elLog = document.getElementById("radix-log");
	if (elLog !== null) {
		elLog.textContent += strLine + "\n";
	}
}

// 1) [TS] Every element the converter needs, found once. A missing one stops here with its id
interface IRadixView {
	readonly elInput: HTMLInputElement;
	readonly elHex: HTMLElement;
	readonly elDec: HTMLElement;
	readonly elBin: HTMLElement;
	readonly elError: HTMLElement;
}

function ById<T extends HTMLElement>(strId: string, cType: { new (): T; prototype: T }): T {
	const elFound = document.getElementById(strId);
	if (!(elFound instanceof cType)) {
		throw new Error(`#${strId} is missing or is not a ${cType.name}`);
	}
	return elFound;
}

// 2) [JS + TS] Pure functions : no DOM inside, so they are easy to test (lesson 09)
type TParsed = { readonly bOk: true; readonly biValue: bigint } | { readonly bOk: false; readonly strError: string };

function ParseNumber(strText: string): TParsed {
	const strTrim = strText.trim().replaceAll("_", "");
	if (strTrim === "") {
		return { bOk: false, strError: "type a number" };
	}
	const bNegative = strTrim.startsWith("-");
	try {
		const biValue = BigInt(bNegative ? strTrim.slice(1) : strTrim);
		return { bOk: true, biValue: bNegative ? -biValue : biValue };
	} catch {
		return { bOk: false, strError: `"${strText.trim()}" is not an integer (255, 0xFF, 0b1010, 0o17)` };
	}
}

function Radix(biValue: bigint, nBase: number, strPrefix: string): string {
	const strSign = biValue < 0n ? "-" : "";
	const biAbs = biValue < 0n ? -biValue : biValue;
	return strSign + strPrefix + biAbs.toString(nBase).toUpperCase();
}

// 3) [JS] Update the page from the current input : the only place that writes to the view
function Render(oView: IRadixView): void {
	const oParsed = ParseNumber(oView.elInput.value);
	if (!oParsed.bOk) {
		oView.elHex.textContent = oView.elDec.textContent = oView.elBin.textContent = "";
		oView.elError.textContent = oParsed.strError;
		oView.elInput.classList.add("invalid");
		return;
	}
	oView.elHex.textContent = Radix(oParsed.biValue, 16, "0x");
	oView.elDec.textContent = Radix(oParsed.biValue, 10, "");
	oView.elBin.textContent = Radix(oParsed.biValue, 2, "0b");
	oView.elError.textContent = "";
	oView.elInput.classList.remove("invalid");
}

function RunRadix(): void {
	const oView: IRadixView = {
		elInput: ById("radix-input", HTMLInputElement),
		elHex: ById("radix-hex", HTMLTableCellElement),
		elDec: ById("radix-dec", HTMLTableCellElement),
		elBin: ById("radix-bin", HTMLTableCellElement),
		elError: ById("radix-error", HTMLParagraphElement),
	};

	// 4) [JS] "input" fires on every change (typing, paste, delete). "change" only when the box loses focus
	oView.elInput.addEventListener("input", () => Render(oView));
	Render(oView);

	// 5) [JS] Type a few values from code, the same way the user would
	for (const strTyped of ["0xFF", "0b1010_1010", "-0x10", "12a", "4096"]) {
		oView.elInput.value = strTyped;
		oView.elInput.dispatchEvent(new Event("input"));
		const strShown = oView.elError.textContent === "" ? `${oView.elHex.textContent} / ${oView.elDec.textContent} / ${oView.elBin.textContent}` : `error : ${oView.elError.textContent}`;
		Log(`5) ${strTyped.padEnd(12)} → ${strShown}`);
	}
	Log("   your turn : type in the box above");
}

// 6) [JS] In Node there is no document : explain instead of crashing
if (typeof document === "undefined") {
	console.log("This example runs in the browser (it uses document).");
	console.log("  npm run web  →  http://127.0.0.1:5173/lessons/07-browser-dom/");
} else {
	RunRadix();
}
