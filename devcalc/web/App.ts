//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: devcalc / web / App (DevCalc in the browser)
//	History			: 2026-10-15 CYBERKDH Initial - Lesson 07 DevCalc step, Lv4
//					  2026-10-15 CYBERKDH Lesson 09: o → oSaved (found by tools/check-names.ts)
//					  2026-10-15 CYBERKDH Lesson 10: overflow note shows the value that did not fit
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// The same core as the command line (lesson 06 made it free of node: imports).
// Only this file knows about the DOM : the core still returns values, the page shows them.
import { ToBin, ToDec, ToHex, CWordSize, IsWordBits, Evaluate, CHistory, type IFormatOptions, type TFormatter, type IEvaluation, type IEvalError } from "../src/core/index.ts";

const STORAGE_KEY = "devcalc.history";
const HISTORY_SIZE = 20;

// Every element the page needs, checked once at start-up
function ById<T extends HTMLElement>(strId: string, cType: { new (): T; prototype: T }): T {
	const elFound = document.getElementById(strId);
	if (!(elFound instanceof cType)) {
		throw new Error(`#${strId} is missing or is not a ${cType.name}`);
	}
	return elFound;
}

const elForm = ById("calc-form", HTMLFormElement);
const elExpr = ById("expr", HTMLInputElement);
const elBits = ById("bits", HTMLSelectElement);
const elError = ById("error", HTMLDivElement);
const elErrorTitle = ById("error-title", HTMLElement);
const elErrorWhy = ById("error-why", HTMLSpanElement);
const elErrorFix = ById("error-fix", HTMLSpanElement);
const elOut = ById("out", HTMLTableElement);
const elNote = ById("note", HTMLParagraphElement);
const elHistory = ById("history", HTMLOListElement);
const elClear = ById("clear", HTMLButtonElement);
const elStatus = ById("status", HTMLParagraphElement);

// localStorage holds strings, and JSON has no bigint : keep the numbers as decimal text
interface ISavedEval {
	strExpr: string;
	strValue: string;
	strExact: string;
	bOverflow: boolean;
}

// JSON.parse returns any : check every field before trusting it
function IsSavedEval(vValue: unknown): vValue is ISavedEval {
	if (typeof vValue !== "object" || vValue === null) {
		return false;
	}
	const oSaved = vValue as Record<string, unknown>;
	return typeof oSaved.strExpr === "string" && typeof oSaved.strValue === "string" && typeof oSaved.strExact === "string" && typeof oSaved.bOverflow === "boolean";
}

const oHistory = new CHistory<IEvaluation>(HISTORY_SIZE);

function LoadHistory(): void {
	try {
		const vParsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
		if (!Array.isArray(vParsed)) {
			return;
		}
		for (const vItem of vParsed) {
			if (IsSavedEval(vItem)) {
				oHistory.Add({ strExpr: vItem.strExpr, biValue: BigInt(vItem.strValue), biExact: BigInt(vItem.strExact), bOverflow: vItem.bOverflow });
			}
		}
	} catch {
		oHistory.Clear(); // blocked storage, broken JSON or a bad number : start empty
	}
}

function SaveHistory(): void {
	const arrSaved: ISavedEval[] = [...oHistory].map((oEval) => ({
		strExpr: oEval.strExpr,
		strValue: String(oEval.biValue),
		strExact: String(oEval.biExact),
		bOverflow: oEval.bOverflow,
	}));
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(arrSaved));
	} catch {
		elStatus.textContent = "The history could not be saved (storage is blocked or full).";
	}
}

// The selected word size : "" means no limit
function CurrentWord(): CWordSize | undefined {
	const nBits = Number(elBits.value);
	return IsWordBits(nBits) ? new CWordSize(nBits) : undefined;
}

// Same function table as the command line
const arrRow: [string, TFormatter][] = [
	["HEX", ToHex],
	["DEC", ToDec],
	["BIN", ToBin],
];

function AddRow(elBody: HTMLTableSectionElement, strLabel: string, strText: string): void {
	const elRow = elBody.insertRow();
	elRow.insertCell().textContent = strLabel;
	elRow.insertCell().textContent = strText;
	const elCopy = document.createElement("button");
	elCopy.type = "button";
	elCopy.textContent = "copy";
	elCopy.dataset.copy = strText;
	elRow.insertCell().append(elCopy);
}

function ShowResult(oEval: IEvaluation, oWord: CWordSize | undefined): void {
	const oOptions: IFormatOptions = { bGroup: true, nBits: oWord?.nBits };
	const elBody = elOut.tBodies[0] ?? elOut.createTBody();
	elBody.replaceChildren();
	for (const [strLabel, fnFormat] of arrRow) {
		AddRow(elBody, strLabel, fnFormat(oEval.biValue, oOptions));
	}
	if (oWord !== undefined) {
		AddRow(elBody, "INT", ToDec(oWord.ToSigned(oEval.biValue), oOptions));
	}
	elNote.textContent = oWord !== undefined && oEval.bOverflow ? `${oEval.biExact} does not fit in ${oWord.nBits} bits (${oWord.strName}), so it wrapped to ${oWord.ToUnsigned(oEval.biExact)}.` : "";
}

function ShowError(oError: IEvalError | undefined): void {
	elError.hidden = oError === undefined;
	elExpr.classList.toggle("invalid", oError !== undefined);
	elErrorTitle.textContent = oError?.strTitle ?? "";
	elErrorWhy.textContent = oError?.strWhy ?? "";
	elErrorFix.textContent = oError?.strFix ?? "";
}

function ShowHistory(): void {
	const arrItem = [...oHistory].map((oEval) => {
		const elItem = document.createElement("li");
		elItem.textContent = `${oEval.strExpr} = ${ToHex(oEval.biValue)}`;
		elItem.dataset.expr = oEval.strExpr;
		return elItem;
	});
	elHistory.replaceChildren(...arrItem);
}

// "a; b; c" runs in order and stops at the first error, like the command line
function Calculate(strInput: string): void {
	const oWord = CurrentWord();
	const arrExpr = strInput
		.split(";")
		.map((strPart) => strPart.trim())
		.filter((strPart) => strPart !== "");
	if (arrExpr.length === 0) {
		arrExpr.push(strInput);
	}
	for (const strOne of arrExpr) {
		const oResult = Evaluate(strOne, oWord, oHistory.Latest()?.biValue);
		if (!oResult.bOk) {
			ShowError(oResult.vError);
			break;
		}
		ShowError(undefined);
		oHistory.Add(oResult.vValue);
		ShowResult(oResult.vValue, oWord);
	}
	ShowHistory();
	SaveHistory();
}

// Events : submit (Enter or "="), one delegated listener for all copy buttons, history clicks
elForm.addEventListener("submit", (oEvent) => {
	oEvent.preventDefault();
	elStatus.textContent = "";
	Calculate(elExpr.value);
	elExpr.select();
});

elOut.addEventListener("click", async (oEvent) => {
	if (!(oEvent.target instanceof HTMLButtonElement) || oEvent.target.dataset.copy === undefined) {
		return;
	}
	const strText = oEvent.target.dataset.copy;
	try {
		await navigator.clipboard.writeText(strText); // a Promise : only on https or localhost, after a user action
		elStatus.textContent = `Copied: ${strText}`;
	} catch (e) {
		elStatus.textContent = `Could not copy: ${(e as Error).message}`;
	}
});

elHistory.addEventListener("click", (oEvent) => {
	if (oEvent.target instanceof HTMLLIElement && oEvent.target.dataset.expr !== undefined) {
		elExpr.value = oEvent.target.dataset.expr;
		elExpr.focus();
	}
});

elClear.addEventListener("click", () => {
	oHistory.Clear();
	ShowHistory();
	SaveHistory();
});

LoadHistory();
ShowHistory();
const oLatest = oHistory.Latest();
if (oLatest !== undefined) {
	ShowResult(oLatest, CurrentWord());
}
document.body.dataset.done = "true"; // ready (used by the headless check)
