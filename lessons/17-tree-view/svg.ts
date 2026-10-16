//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 17-tree-view / svg
//	History			: 2026-10-16 CYBERKDH Initial
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// SVG is text : a picture made of tags. This example writes a tree as SVG markup, with no browser.
// Usage : node lessons/17-tree-view/svg.ts                         (prints the markup)
//         node lessons/17-tree-view/svg.ts lessons/17-tree-view/tree.svg   (also saves it)
import { writeFileSync } from "node:fs";
import { Parse, LayoutTree, type ITreeLayout } from "../../devcalc/src/core/index.ts";

const EXPR = "(1 << 4) & 'A'";

const SLOT = 48; // pixels per slot
const LEVEL = 58; // pixels per level
const BOX_HEIGHT = 26;
const PAD = 8;

// [JS] The text goes inside markup, so the characters that mean markup must be written as entities.
// & first : every other entity starts with &, and must not be escaped a second time
function Escape(strText: string): string {
	return strText.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}

// The same rule with & last : what goes wrong
function EscapeWrongOrder(strText: string): string {
	return strText.replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll("&", "&amp;");
}

function BoxWidth(strText: string): number {
	return Math.max(BOX_HEIGHT, Math.round(strText.length * 8.4 + 14));
}

// [JS] Markup from a layout : template literals (lesson 01) and map().join(). Lines first, boxes on top.
// The <style> inside the SVG makes it follow the dark theme too, also when it is shown as an <img>
function ToSvg(oLayout: ITreeLayout, strTitle: string): string {
	const { arrBox } = oLayout;
	const nWidth = oLayout.nWidth * SLOT + PAD * 2;
	const nHeight = (oLayout.nHeight - 1) * LEVEL + BOX_HEIGHT + PAD * 2;
	const CenterX = (nIndex: number): number => PAD + ((arrBox[nIndex]?.nX ?? 0) + 0.5) * SLOT;
	const CenterY = (nIndex: number): number => PAD + BOX_HEIGHT / 2 + (arrBox[nIndex]?.nY ?? 0) * LEVEL;

	const arrLine = arrBox.flatMap((oBox, nIndex) =>
		oBox.arrChild.map((nChild) => `  <line x1="${CenterX(nIndex)}" y1="${CenterY(nIndex) + BOX_HEIGHT / 2}" x2="${CenterX(nChild)}" y2="${CenterY(nChild) - BOX_HEIGHT / 2}"/>`),
	);
	const arrGroup = arrBox.map((oBox, nIndex) => {
		const nBox = BoxWidth(oBox.strLabel);
		return `  <g transform="translate(${CenterX(nIndex)} ${CenterY(nIndex)})"><rect x="${-nBox / 2}" y="${-BOX_HEIGHT / 2}" width="${nBox}" height="${BOX_HEIGHT}" rx="5"/><text>${Escape(oBox.strLabel)}</text></g>`;
	});
	return [
		`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${nWidth} ${nHeight}" width="${nWidth}" height="${nHeight}" role="img">`,
		`  <title>${Escape(strTitle)}</title>`,
		"  <style>",
		"    line { stroke: #8c959f; stroke-width: 1.5 } rect { fill: #ffffff; stroke: #59636e }",
		"    text { fill: #1f2328; font: 14px ui-monospace, Consolas, monospace; text-anchor: middle; dominant-baseline: central }",
		"    @media (prefers-color-scheme: dark) { rect { fill: #0d1117; stroke: #9198a1 } text { fill: #e6edf3 } line { stroke: #656c76 } }",
		"  </style>",
		...arrLine,
		...arrGroup,
		"</svg>",
		"",
	].join("\n");
}

// 1) The labels of this tree, as they go into the markup
const oParsed = Parse(EXPR);
if (!oParsed.bOk) {
	throw new Error(oParsed.vError.strWhy); // EXPR is fixed and valid : this does not happen
}
const oLayout = LayoutTree(oParsed.vValue);
console.log(`1) ${EXPR}`);
for (const oBox of oLayout.arrBox) {
	console.log(`   ${oBox.strLabel.padEnd(4)} → ${Escape(oBox.strLabel)}`);
}

// 2) The whole picture : a few lines of text
const strSvg = ToSvg(oLayout, `Tree of ${EXPR}`);
console.log(`2) ${strSvg.length} characters :`);
for (const strLine of strSvg.trimEnd().split("\n")) {
	console.log(`   ${strLine}`);
}

// 3) Escaping in the wrong order turns the entities into text
console.log(`3) Expected problem: "<<" escaped with & last → ${EscapeWrongOrder("<<")} (the page shows &lt;&lt; instead of <<)`);
console.log("   Why : &lt; was made first, then its & was escaped again into &amp;lt;.");
console.log("   Fix : escape & first, as Escape() does. In the browser, textContent does all of this for you.");

// 4) [JS] An argument → save the file. writeFileSync writes UTF-8 (a shell's > may not)
const strFile = process.argv[2];
if (strFile === undefined) {
	console.log("4) Add a file name to save it : node lessons/17-tree-view/svg.ts tree.svg");
} else {
	writeFileSync(strFile, strSvg, "utf8");
	console.log(`4) saved : ${strFile} (open it in a browser, or show it with <img src="...">)`);
}
