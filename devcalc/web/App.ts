//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: devcalc / web / App (DevCalc in the browser)
//	History			: 2026-10-15 CYBERKDH Initial - Lesson 07 DevCalc step, Lv4
//					  2026-10-15 CYBERKDH Lesson 09: o → oSaved (found by tools/check-names.ts)
//					  2026-10-15 CYBERKDH Lesson 10: overflow note shows the value that did not fit
//					  2026-10-15 CYBERKDH Lesson 11: SplitExpressions (a ; inside ';' does not split)
//					  2026-10-15 CYBERKDH Lesson 12: every row from OutputRows() (OCT, CHAR), 128-bit, Lv7
//					  2026-10-15 CYBERKDH Lesson 13: functions and variables (kept while the page is open), Lv8
//					  2026-10-15 CYBERKDH Lesson 14: bit grid, preview while typing, Esc / ArrowUp / ArrowDown, help panel, history buttons, Lv9
//					  2026-10-15 CYBERKDH Lesson 15: build label (DEVCALC_BUILD, set by tools/build-single.ts), Lv10
//					  2026-10-16 CYBERKDH Lesson 16: steps panel (Explain), the part calculated next in a <mark>, Lv11
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// The same core as the command line (lesson 06 made it free of node: imports).
// Only the web/ files know about the DOM : the core still returns values, the page shows them.
import { ToHex, CWordSize, IsWordBits, Evaluate, Explain, CHistory, OutputRows, SplitExpressions, FunctionHelp, OperatorHelp, type IFormatOptions, type IEvaluation, type IEvalError, type IExplanation } from "../src/core/index.ts";
import { CBitGrid } from "./BitGrid.ts";

declare const DEVCALC_BUILD: string; // set only by tools/build-single.ts (see the end of this file)

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
const elPreview = ById("preview", HTMLOutputElement);
const elGrid = ById("grid", HTMLDivElement);
const elGridNote = ById("grid-note", HTMLParagraphElement);
const elHelpText = ById("help-text", HTMLPreElement);
const elAnnounce = ById("announce", HTMLParagraphElement);
const elBuild = ById("build", HTMLParagraphElement);
const elSteps = ById("steps", HTMLOListElement);
const elStepsNote = ById("steps-note", HTMLParagraphElement);

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
const mapVar = new Map<string, bigint>(); // lesson 13 : mask = 0xFF00. Not saved : a reload starts without variables

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
	for (const { eRow, strText } of OutputRows(oEval.biValue, oOptions, oWord, true)) {
		AddRow(elBody, eRow, strText); // lesson 12 : the same table as the command line, with every row
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

// Lesson 16: one line per step : the expression with the part calculated next in a <mark>, then the work.
// Text nodes only (append, textContent), never innerHTML : an expression is user input
function ShowSteps(oExplain: IExplanation | undefined): void {
	const arrItem = (oExplain?.arrStep ?? []).map(({ strExpr, nStart, nEnd, strWork, strNote }) => {
		const elMark = document.createElement("mark");
		elMark.textContent = strExpr.slice(nStart, nEnd);
		const elCode = document.createElement("code");
		elCode.append(strExpr.slice(0, nStart), elMark, strExpr.slice(nEnd));
		const elWork = document.createElement("span");
		elWork.className = "muted";
		elWork.textContent = strNote === "" ? strWork : `${strWork}  (${strNote})`;
		const elItem = document.createElement("li");
		elItem.append(elCode, elWork);
		return elItem;
	});
	if (oExplain !== undefined) {
		const elCode = document.createElement("code");
		elCode.textContent = oExplain.strLast;
		const elItem = document.createElement("li");
		elItem.append(elCode);
		arrItem.push(elItem);
	}
	elSteps.replaceChildren(...arrItem);
	elStepsNote.textContent =
		oExplain === undefined ? "Run an expression to see how it is calculated, one part at a time." : `${oExplain.arrStep.length} step(s), in the order DevCalc calculates them : ( ) first, then by precedence, left to right.`;
}

// Lesson 14: a <button> in each line, so Tab reaches it and Enter or Space picks it (an <li> can't take focus)
function ShowHistory(): void {
	const arrItem = [...oHistory].map((oEval) => {
		const elButton = document.createElement("button");
		elButton.type = "button";
		elButton.textContent = `${oEval.strExpr} = ${ToHex(oEval.biValue)}`;
		elButton.dataset.expr = oEval.strExpr;
		const elItem = document.createElement("li");
		elItem.append(elButton);
		return elItem;
	});
	elHistory.replaceChildren(...arrItem);
}

// Lesson 14: the grid shows the latest value at the chosen word size. A click on bit n runs "value ^ bit(n)"
const oGrid = new CBitGrid(elGrid, (nBit) => {
	const oWord = CurrentWord();
	const biValue = oWord?.ToUnsigned(oHistory.Latest()?.biValue ?? 0n) ?? 0n;
	Calculate(`${ToHex(biValue)} ^ bit(${nBit})`);
});

function ShowGrid(): void {
	const oWord = CurrentWord();
	elGrid.hidden = oWord === undefined;
	elGridNote.textContent = oWord === undefined ? "Choose a word size to see the bits." : "Click a bit (or Tab to it and press Space) to flip it. Arrow keys move.";
	if (oWord !== undefined) {
		oGrid.Show(oWord.ToUnsigned(oHistory.Latest()?.biValue ?? 0n), oWord.nBits);
	}
}

// Lesson 14: the value while typing. Nothing is kept : a copy of the variables, no history
function Preview(strInput: string): string {
	if (strInput.trim() === "") {
		return "";
	}
	const oWord = CurrentWord();
	const mapCopy = new Map(mapVar);
	let biAns = oHistory.Latest()?.biValue;
	for (const strOne of SplitExpressions(strInput)) {
		const oResult = Evaluate(strOne, oWord, biAns, mapCopy);
		if (!oResult.bOk) {
			return `… ${oResult.vError.strTitle}`;
		}
		if (oResult.vValue.strAssign !== undefined) {
			mapCopy.set(oResult.vValue.strAssign, oResult.vValue.biValue);
		}
		biAns = oResult.vValue.biValue;
	}
	return `= ${ToHex(biAns ?? 0n)}`;
}

// "a; b; c" runs in order and stops at the first error, like the command line
function Calculate(strInput: string): void {
	const oWord = CurrentWord();
	const arrExpr = SplitExpressions(strInput); // lesson 11 : ';' is not a separator
	for (const strOne of arrExpr) {
		const oResult = Explain(strOne, oWord, oHistory.Latest()?.biValue, mapVar); // lesson 16 : the evaluation and its steps
		if (!oResult.bOk) {
			ShowError(oResult.vError);
			ShowSteps(undefined);
			break;
		}
		const oEval = oResult.vValue.oEval;
		if (oEval.strAssign !== undefined) {
			mapVar.set(oEval.strAssign, oEval.biValue);
		}
		ShowError(undefined);
		oHistory.Add(oEval);
		ShowResult(oEval, oWord);
		ShowSteps(oResult.vValue);
		elAnnounce.textContent = `${oEval.strExpr} = ${ToHex(oEval.biValue)}`; // read aloud by screen readers
	}
	ShowHistory();
	ShowGrid();
	SaveHistory();
	elPreview.value = "";
	nRecall = oHistory.nCount;
}

// Lesson 14: ArrowUp / ArrowDown in the box walk the history, like the REPL. nCount = "after the newest"
let nRecall = 0;

function Recall(nStep: number): void {
	nRecall = Math.min(oHistory.nCount, Math.max(0, nRecall + nStep));
	elExpr.value = oHistory.At(nRecall)?.strExpr ?? ""; // after the newest → an empty box
	elPreview.value = Preview(elExpr.value);
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
	const elButton = oEvent.target instanceof Element ? oEvent.target.closest<HTMLButtonElement>("button[data-expr]") : null;
	if (elButton?.dataset.expr !== undefined) {
		elExpr.value = elButton.dataset.expr;
		elPreview.value = Preview(elExpr.value);
		elExpr.focus();
	}
});

// Lesson 14: "input" fires on every change (typing, paste, delete) → the preview follows
elExpr.addEventListener("input", () => {
	elPreview.value = Preview(elExpr.value);
});

// Lesson 14: Esc clears, ArrowUp / ArrowDown recall. Enter is the form's submit. Keys that finish
// a Korean syllable (isComposing) belong to the IME, not to DevCalc
elExpr.addEventListener("keydown", (oEvent) => {
	if (oEvent.isComposing) {
		return;
	}
	if (oEvent.key === "Escape") {
		elExpr.value = "";
		elPreview.value = "";
		ShowError(undefined);
	} else if (oEvent.key === "ArrowUp" || oEvent.key === "ArrowDown") {
		oEvent.preventDefault(); // the cursor stays where it is
		Recall(oEvent.key === "ArrowUp" ? -1 : 1);
	}
});

elBits.addEventListener("change", () => {
	ShowGrid();
	elPreview.value = Preview(elExpr.value);
});

elClear.addEventListener("click", () => {
	oHistory.Clear();
	ShowHistory();
	SaveHistory();
});

// Lesson 14: the help panel (<details>) is filled from the same tables as the REPL's help
elHelpText.textContent = [
	`Operators : ${OperatorHelp()}`,
	"Functions :",
	...FunctionHelp()
		.split(" ")
		.map((strName) => `  ${FunctionHelp(strName) ?? strName}`),
	"Variables : name = expression (kept until the page is reloaded), ans = the last result",
	"Keys      : Enter run · Esc clear · ArrowUp / ArrowDown history · Tab moves between the parts of the page",
].join("\n");

LoadHistory();
ShowHistory();
const oLatest = oHistory.Latest();
if (oLatest !== undefined) {
	ShowResult(oLatest, CurrentWord());
}
ShowGrid();
ShowSteps(undefined);
nRecall = oHistory.nCount;
// Lesson 15: tools/build-single.ts puts a text in place of DEVCALC_BUILD (esbuild define).
// Without that build the name does not exist, and typeof of a missing name is "undefined", not an error
elBuild.textContent = typeof DEVCALC_BUILD === "string" ? DEVCALC_BUILD : "modules (not bundled) · npm run build:single makes one file";
document.body.dataset.done = "true"; // ready (used by the headless check)
