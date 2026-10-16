//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 17-tree-view / svgdom (코드로 만드는 SVG 요소)
//	History			: 2026-10-16 CYBERKDH Initial (최초 작성)
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// DOM 속의 SVG : 마크업 글자 대신 코드로 만드는 요소. 네임스페이스 (namespace), 타입이 붙은 도우미 함수,
// textContent, 그리고 DevCalc 의 배치로 그린 트리.
// 브라우저에서 실행 : npm run web → http://127.0.0.1:5173/lessons/17-tree-view/?ko
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

// [TS] SVGElementTagNameMap 은 태그 이름마다 요소 타입을 대응시킨다 ("line" → SVGLineElement).
// K 는 태그의 리터럴 타입이고, 반환 타입이 그것으로 찾아본다 (08강) : "as" 가 필요 없다
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

	// 1) [JS] createElement 는 HTML 요소를 만든다. "rect" 는 HTML 태그가 아니므로 결과는 알 수 없는
	//    HTML 요소 : <svg> 안에 넣어도 아무것도 그리지 않고, 오류도 내지 않는다
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

	// 2) [TS] Svg("line") 의 타입은 SVGLineElement 라서 .x1 이 있다. 속성 (attribute) 은 글자이고,
	//    프로퍼티는 그것을 숫자로 읽어 준다 (SVGAnimatedLength, 기본값은 픽셀)
	const elLine = Svg("line", { x1: 100, y1: 20, x2: 190, y2: 20 });
	elTrySvg.append(elLine);
	Log(`2) Svg("line") : x1 attribute = "${elLine.getAttribute("x1")}" (${typeof elLine.getAttribute("x1")}), x1.baseVal.value = ${elLine.x1.baseVal.value} (${typeof elLine.x1.baseVal.value})`);
	// elLine.cx; // ← 주석 해제 → 빨간 밑줄 TS2339 (Property 'cx' does not exist on type 'SVGLineElement')

	// 3) [JS] textContent 는 글자를 글자로 넣는다 : "<<" 는 두 글자 그대로이고, 직렬화한 마크업에는
	//    엔티티가 들어 있다. innerHTML 이라면 "<b>" 를 태그로 읽는다 (07강)
	const elText = Svg("text", { x: 44, y: 24, "text-anchor": "middle" });
	elText.textContent = "<<";
	elTrySvg.append(elText);
	Log(`3) textContent = "${elText.textContent}" (${elText.textContent.length} characters) · markup = ${elText.outerHTML}`);

	// 4) 진짜 트리 : DevCalc 의 배치 (칸과 층) → 픽셀. 선을 먼저 그려서 상자가 선 끝을 덮게 한다
	const EXPR = "y = (1 << 4) & 'A'";
	const oParsed = Parse(EXPR);
	if (!oParsed.bOk) {
		throw new Error(oParsed.vError.strWhy); // EXPR 은 고정된 올바른 식 : 여기에 오지 않는다
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
	elTitle.textContent = `Tree of ${EXPR}`; // role="img" 일 때 화면 낭독기가 읽는 이름
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

// 5) [JS] Node 에는 document 가 없다 : 멈추지 말고 설명한다
if (typeof document === "undefined") {
	console.log("This example runs in the browser (it uses document).");
	console.log("  npm run web  →  http://127.0.0.1:5173/lessons/17-tree-view/");
} else {
	RunSvgDom();
}
