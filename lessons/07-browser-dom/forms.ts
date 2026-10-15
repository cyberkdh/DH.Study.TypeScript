//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 07-browser-dom / forms
//	History			: 2026-10-15 CYBERKDH Initial
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// Runs in the browser : npm run web → http://127.0.0.1:5173/lessons/07-browser-dom/
function Log(...arrPart: unknown[]): void {
	const strLine = arrPart.map(String).join(" ");
	console.log(strLine);
	const elLog = document.getElementById("forms-log");
	if (elLog !== null) {
		elLog.textContent += strLine + "\n";
	}
}

const STORAGE_KEY = "lesson07.form";

// 1) [TS] What we keep in localStorage. Storage holds strings only, so bigint goes in as text
interface ISavedForm {
	readonly strA: string;
	readonly strOp: string;
	readonly strB: string;
}

// 2) [JS + TS] localStorage can throw (blocked by privacy settings, full), and getItem returns string | null
function LoadSaved(): ISavedForm | undefined {
	try {
		const strJson = localStorage.getItem(STORAGE_KEY);
		return strJson === null ? undefined : (JSON.parse(strJson) as ISavedForm);
	} catch {
		return undefined; // no storage, or broken JSON : start empty
	}
}

function Save(oForm: ISavedForm): void {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(oForm));
	} catch (e) {
		Log("   Could not save:", (e as Error).name);
	}
}

// 3) [JS + TS] FormData.get returns FormDataEntryValue | null (= string | File | null) : narrow to string
function FieldText(oData: FormData, strName: string): string {
	const vValue = oData.get(strName);
	return typeof vValue === "string" ? vValue.trim() : "";
}

// Input boxes always give strings. BigInt() reads 255, 0xFF, 0b1010, 0o17 and throws SyntaxError otherwise
function ToBigInt(strText: string): bigint {
	const bNegative = strText.startsWith("-");
	const biValue = BigInt(strText.slice(bNegative ? 1 : 0).replaceAll("_", ""));
	return bNegative ? -biValue : biValue;
}

function Calculate(biA: bigint, strOp: string, biB: bigint): bigint {
	switch (strOp) {
		case "+":
			return biA + biB;
		case "&":
			return biA & biB;
		case "<<":
			return biA << biB;
		default:
			throw new Error(`unknown operator "${strOp}"`);
	}
}

function RunForms(): void {
	const elForm = document.querySelector<HTMLFormElement>("#calc-form");
	const elOut = document.querySelector<HTMLOutputElement>("#calc-out");
	const elBits = document.querySelector<HTMLInputElement>("#bits");
	if (elForm === null || elOut === null || elBits === null) {
		Log("Expected elements are missing : open this file through index.html");
		return;
	}

	// 4) [JS] Restore the last input. On the first visit there is nothing yet
	const oSaved = LoadSaved();
	Log("4) last visit :", oSaved === undefined ? "nothing saved yet" : `${oSaved.strA} ${oSaved.strOp} ${oSaved.strB}`);

	// 5) [JS + TS] submit → SubmitEvent. Without preventDefault the browser reloads the page
	elForm.addEventListener("submit", (oEvent) => {
		oEvent.preventDefault();
		const oData = new FormData(elForm);
		const oInput: ISavedForm = { strA: FieldText(oData, "a"), strOp: FieldText(oData, "op"), strB: FieldText(oData, "b") };
		// valueAsNumber : a number for type="number" (NaN when empty), no Number() needed
		const nBits = elBits.valueAsNumber;
		const elA = elForm.elements.namedItem("a");
		try {
			const biMask = (1n << BigInt(nBits)) - 1n;
			const biResult = Calculate(ToBigInt(oInput.strA), oInput.strOp, ToBigInt(oInput.strB)) & biMask;
			elOut.value = `0x${biResult.toString(16).toUpperCase()}`;
			elOut.className = "ok";
			if (elA instanceof HTMLInputElement) {
				elA.classList.remove("invalid");
			}
			Save(oInput);
			Log(`5) ${oInput.strA} ${oInput.strOp} ${oInput.strB} (${nBits}-bit) = ${elOut.value} / saved`);
		} catch (e) {
			elOut.value = (e as Error).name;
			elOut.className = "error";
			if (elA instanceof HTMLInputElement) {
				elA.classList.add("invalid");
			}
			Log(`   Expected error: ${(e as Error).name} : ${(e as Error).message}`);
			Log("   Why : an input box always holds text, and BigInt() could not read it.");
			Log("   Fix : type 255, 0xFF, 0b1010 or 0o17. The red outline marks the field.");
		}
	});

	// 6) [JS] Fill the form from code and submit it like the user would (requestSubmit fires "submit")
	const elA = elForm.elements.namedItem("a");
	const elOp = elForm.elements.namedItem("op");
	if (elA instanceof HTMLInputElement && elOp instanceof HTMLSelectElement) {
		elOp.value = "&";
		elForm.requestSubmit(); // 0xFF & 1
		elA.value = "0xFF";
		elOp.value = "<<";
		elForm.requestSubmit(); // 0xFF << 1 in 8 bits
		elA.value = "0xZZ";
		elForm.requestSubmit(); // error
		elA.value = "0xFF";
		elOp.value = "+";
	}

	// 7) [JS] What is stored : a string. Reload the page and 4) shows it
	try {
		Log("7) localStorage =", localStorage.getItem(STORAGE_KEY));
	} catch (e) {
		Log("7) localStorage is blocked here:", (e as Error).name);
	}
}

// 8) [JS] In Node there is no document : explain instead of crashing
if (typeof document === "undefined") {
	console.log("This example runs in the browser (it uses document and localStorage).");
	console.log("  npm run web  →  http://127.0.0.1:5173/lessons/07-browser-dom/");
} else {
	RunForms();
}
