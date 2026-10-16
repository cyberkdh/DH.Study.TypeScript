//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: devcalc / web / TreeView (The syntax tree as an SVG drawing)
//	History			: 2026-10-16 CYBERKDH Initial - Lesson 17 DevCalc step, Lv12
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// Lesson 17: draws a layout (core/Tree.ts) at one step of the calculation. It keeps no state :
// App.ts says which step, and the whole drawing is made again. Types only from the core :
// "import type" is erased, so this file adds nothing to the bundle but its own code.
import type { IStep, ITreeLayout } from "../src/core/index.ts";

// SVG elements live in their own namespace. document.createElement("rect") makes an HTML element
// called "rect" that draws nothing : createElementNS with this URI makes a real SVGRectElement
const SVG_NS = "http://www.w3.org/2000/svg";

const CHAR_WIDTH = 8.4; // ui-monospace at 14px : close enough to size the boxes
const BOX_HEIGHT = 26;
const LEVEL_HEIGHT = 58; // from one level to the next
const SLOT_MIN = 40; // the narrowest slot, so 1-character leaves are not crowded
const PAD = 8;

function BoxWidth(strText: string): number {
	return Math.max(BOX_HEIGHT, strText.length * CHAR_WIDTH + 14);
}

export class CTreeView {
	readonly #elHost: HTMLElement;

	constructor(elHost: HTMLElement) {
		this.#elHost = elHost;
	}

	// The tree at step nAt : the steps before it are done (their value in place of the part, the
	// parts under them faded), step nAt is highlighted. nAt = arrStep.length → everything is done
	Show(oLayout: ITreeLayout | undefined, arrStep: readonly IStep[], nAt: number, strExpr: string): void {
		if (oLayout === undefined) {
			this.#elHost.replaceChildren();
			return;
		}
		const { arrBox } = oLayout;
		const mapDone = new Map(arrStep.slice(0, nAt).map((oStep) => [oStep.oNode, oStep.biValue] as const));
		const oFocus = arrStep[nAt]?.oNode;
		const arrText = arrBox.map((oBox) => {
			const biDone = mapDone.get(oBox.oNode);
			return biDone === undefined ? oBox.strLabel : String(biDone);
		});

		// One slot width for the whole tree : wide enough for the longest text at any step
		const arrLongest = [...arrBox.map((oBox) => oBox.strLabel), ...arrStep.map((oStep) => String(oStep.biValue))];
		const nSlot = Math.max(SLOT_MIN, ...arrLongest.map((strText) => BoxWidth(strText) + 8));
		const nWidth = oLayout.nWidth * nSlot + PAD * 2;
		const nHeight = (oLayout.nHeight - 1) * LEVEL_HEIGHT + BOX_HEIGHT + PAD * 2;
		const CenterX = (nIndex: number): number => PAD + ((arrBox[nIndex]?.nX ?? 0) + 0.5) * nSlot;
		const CenterY = (nIndex: number): number => PAD + BOX_HEIGHT / 2 + (arrBox[nIndex]?.nY ?? 0) * LEVEL_HEIGHT;

		// Faded : under a part that is already done. arrBox is post-order (the root last),
		// so walking it backwards meets every parent before its children
		const arrFaded = arrBox.map(() => false);
		for (let nIndex = arrBox.length - 1; nIndex >= 0; nIndex--) {
			const oBox = arrBox[nIndex];
			const bHide = (arrFaded[nIndex] ?? false) || (oBox !== undefined && mapDone.has(oBox.oNode));
			for (const nChild of oBox?.arrChild ?? []) {
				arrFaded[nChild] = bHide;
			}
		}

		const elSvg = Svg("svg", { class: "tree", viewBox: `0 0 ${nWidth} ${nHeight}`, width: String(nWidth), height: String(nHeight), role: "img" });
		const elTitle = Svg("title", {});
		elTitle.textContent = `Tree of ${strExpr}`; // the name screen readers read for role="img"
		elSvg.append(elTitle);

		// The lines first, so the boxes are drawn on top of them
		arrBox.forEach((oBox, nIndex) => {
			for (const nChild of oBox.arrChild) {
				const elLine = Svg("line", {
					x1: String(CenterX(nIndex)),
					y1: String(CenterY(nIndex) + BOX_HEIGHT / 2),
					x2: String(CenterX(nChild)),
					y2: String(CenterY(nChild) - BOX_HEIGHT / 2),
				});
				elLine.classList.toggle("faded", arrFaded[nChild] ?? false);
				elSvg.append(elLine);
			}
		});

		arrBox.forEach((oBox, nIndex) => {
			const strText = arrText[nIndex] ?? "";
			const nBox = BoxWidth(strText);
			const elGroup = Svg("g", { transform: `translate(${CenterX(nIndex)} ${CenterY(nIndex)})` });
			elGroup.classList.toggle("done", mapDone.has(oBox.oNode));
			elGroup.classList.toggle("focus", oBox.oNode === oFocus);
			elGroup.classList.toggle("faded", arrFaded[nIndex] ?? false);
			const elText = Svg("text", { "text-anchor": "middle", "dominant-baseline": "central" });
			elText.textContent = strText; // textContent : the text is user input, never markup
			elGroup.append(Svg("rect", { x: String(-nBox / 2), y: String(-BOX_HEIGHT / 2), width: String(nBox), height: String(BOX_HEIGHT), rx: "5" }), elText);
			elSvg.append(elGroup);
		});

		this.#elHost.replaceChildren(elSvg);
	}
}

// [TS] The DOM types map tag names to element types (SVGElementTagNameMap), so Svg("line") is an
// SVGLineElement : K is the tag name as a literal type, and the return type looks it up (lesson 08)
function Svg<K extends keyof SVGElementTagNameMap>(strTag: K, oAttr: Readonly<Record<string, string>>): SVGElementTagNameMap[K] {
	const elNew = document.createElementNS(SVG_NS, strTag);
	for (const [strName, strValue] of Object.entries(oAttr)) {
		elNew.setAttribute(strName, strValue);
	}
	return elNew;
}
