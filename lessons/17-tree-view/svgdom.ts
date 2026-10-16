//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 17-tree-view / svgdom
//	History			: 2026-10-16 CYBERKDH Initial
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// SVG in the DOM : elements made from code instead of markup text. The namespace, a typed helper,
// textContent, and a tree drawn from DevCalc's layout.
// Runs in the browser : npm run web → http://127.0.0.1:5173/lessons/17-tree-view/
import { Parse, LayoutTree } from "../../devcalc/src/core/index.ts";

const SVG_NS = "http://www.w3.org/2000/svg";

function Log(...arrPart: unknown[]): void {
	const strLine = arrPart.map(String).join(" ");
	console.log(strLine);
	const elLog = document.getElementById("log");
	if (elLog !== null) {
		elLog.textContent += strLine + "\n";
	}
}

// [TS] SVGElementTagNameMap maps each tag name to its element type ("line" → SVGLineElement).
// K is the tag as a literal type, and the return type looks it up (lesson 08) : no "as" needed
function Svg<K extends keyof SVGElementTagNameMap>(strTag: K, oAttr: Readonly<Record<string, string | number>> = {}): SVGElementTagNameMap[K] {
	const elNew = document.createElementNS(SVG_NS, strTag);
	for (const [strName, vValue] of Object.entries(oAttr)) {
		elNew.setAttribute(strName, String(vValue));
	}
	return elNew;
}

function RunSvgDom(): void {
	const elTry = document.getElementById("try");
	const elDrawing = document.getElementById("drawing");
	if (elTry === null || elDrawing === null) {
		throw new Error("#try or #drawing is missing from index.html");
	}
	const elTrySvg = Svg("svg", { viewBox: "0 0 200 40", width: 200, height: 40 });
	elTry.append(elTrySvg);

	// 1) [JS] createElement makes HTML elements. "rect" is not an HTML tag, so the result is an
	//    unknown HTML element : put inside an <svg>, it draws nothing and throws nothing
	const elWrong = document.createElement("rect");
	elWrong.setAttribute("width", "80");
	elWrong.setAttribute("height", "30");
	elTrySvg.append(elWrong);
	Log(`1) Expected problem: createElement("rect") → ${elWrong.constructor.name}, instanceof SVGRectElement = ${elWrong instanceof SVGRectElement}`);
	Log(`   namespaceURI = ${elWrong.namespaceURI}`);
	Log("   Why : the tag name alone does not say SVG. createElement always makes HTML elements, and the browser ignores an HTML <rect> inside <svg>.");
	Log('   Fix : createElementNS("http://www.w3.org/2000/svg", "rect"). Markup text (innerHTML, a .svg file) gets the namespace from <svg>.');
	elWrong.remove();

	const elRight = Svg("rect", { x: 4, y: 4, width: 80, height: 30, rx: 5, class: "box" });
	elTrySvg.append(elRight);
	Log(`   createElementNS → ${elRight.constructor.name}, instanceof SVGRectElement = ${elRight instanceof SVGRectElement}`);
	Log(`   namespaceURI = ${elRight.namespaceURI}`);

	// 2) [TS] Svg("line") is typed SVGLineElement, so .x1 exists. Attributes are text; the
	//    properties read them back as numbers (an SVGAnimatedLength, base value in pixels)
	const elLine = Svg("line", { x1: 100, y1: 20, x2: 190, y2: 20 });
	elTrySvg.append(elLine);
	Log(`2) Svg("line") : x1 attribute = "${elLine.getAttribute("x1")}" (${typeof elLine.getAttribute("x1")}), x1.baseVal.value = ${elLine.x1.baseVal.value} (${typeof elLine.x1.baseVal.value})`);
	// elLine.cx; // ← Uncomment → red squiggle TS2339 (Property 'cx' does not exist on type 'SVGLineElement')

	// 3) [JS] textContent puts text in as text : "<<" stays two characters, the serialized markup
	//    has the entities. innerHTML would read "<b>" as a tag (lesson 07)
	const elText = Svg("text", { x: 44, y: 24, "text-anchor": "middle" });
	elText.textContent = "<<";
	elTrySvg.append(elText);
	Log(`3) textContent = "${elText.textContent}" (${elText.textContent.length} characters) · markup = ${elText.outerHTML}`);

	// 4) A real tree : DevCalc's layout (slots and levels) → pixels. Lines first, so the boxes cover their ends
	const EXPR = "y = (1 << 4) & 'A'";
	const oParsed = Parse(EXPR);
	if (!oParsed.bOk) {
		throw new Error(oParsed.vError.strWhy); // EXPR is fixed and valid : this does not happen
	}
	const oLayout = LayoutTree(oParsed.vValue);
	const SLOT = 48;
	const LEVEL = 58;
	const nWidth = oLayout.nWidth * SLOT + 16;
	const nHeight = (oLayout.nHeight - 1) * LEVEL + 26 + 16;
	const CenterX = (nIndex: number): number => 8 + ((oLayout.arrBox[nIndex]?.nX ?? 0) + 0.5) * SLOT;
	const CenterY = (nIndex: number): number => 21 + (oLayout.arrBox[nIndex]?.nY ?? 0) * LEVEL;

	const elTree = Svg("svg", { viewBox: `0 0 ${nWidth} ${nHeight}`, width: nWidth, height: nHeight, role: "img" });
	const elTitle = Svg("title");
	elTitle.textContent = `Tree of ${EXPR}`; // the name a screen reader reads for role="img"
	elTree.append(elTitle);
	oLayout.arrBox.forEach((oBox, nIndex) => {
		for (const nChild of oBox.arrChild) {
			elTree.append(Svg("line", { x1: CenterX(nIndex), y1: CenterY(nIndex) + 13, x2: CenterX(nChild), y2: CenterY(nChild) - 13 }));
		}
	});
	oLayout.arrBox.forEach((oBox, nIndex) => {
		const nBox = Math.max(26, oBox.strLabel.length * 8.4 + 14);
		const elGroup = Svg("g", { transform: `translate(${CenterX(nIndex)} ${CenterY(nIndex)})` });
		const elLabel = Svg("text", { "text-anchor": "middle", "dominant-baseline": "central" });
		elLabel.textContent = oBox.strLabel;
		elGroup.append(Svg("rect", { x: -nBox / 2, y: -13, width: nBox, height: 26, rx: 5 }), elLabel);
		elTree.append(elGroup);
	});
	elDrawing.replaceChildren(elTree);
	Log(`4) ${EXPR} : ${elTree.querySelectorAll("g").length} boxes, ${elTree.querySelectorAll("line").length} lines, ${nWidth} × ${nHeight} px`);
	Log(`   title = "${elTitle.textContent}" · the labels : ${[...elTree.querySelectorAll("text")].map((elOne) => elOne.textContent).join(" ")}`);
}

// 5) [JS] In Node there is no document : explain instead of crashing
if (typeof document === "undefined") {
	console.log("This example runs in the browser (it uses document).");
	console.log("  npm run web  →  http://127.0.0.1:5173/lessons/17-tree-view/");
} else {
	RunSvgDom();
}
