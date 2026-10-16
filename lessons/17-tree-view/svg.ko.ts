//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 17-tree-view / svg (트리를 SVG 마크업 문자열로)
//	History			: 2026-10-16 CYBERKDH Initial (최초 작성)
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// SVG 는 글자다 : 태그로 만든 그림. 이 예제는 브라우저 없이 트리를 SVG 마크업으로 쓴다.
// 사용법 : node lessons/17-tree-view/svg.ko.ts                         (마크업 출력)
//          node lessons/17-tree-view/svg.ko.ts lessons/17-tree-view/tree.svg   (파일로도 저장)
import { writeFileSync } from "node:fs";
import { Parse, LayoutTree, type ITreeLayout } from "../../devcalc/src/core/index.ts";

const EXPR = "(1 << 4) & 'A'";

const SLOT = 48; // 한 칸의 픽셀
const LEVEL = 58; // 한 층의 픽셀
const BOX_HEIGHT = 26;
const PAD = 8;

// [JS] 글자가 마크업 안에 들어가므로, 마크업 뜻을 가진 문자는 엔티티 (entity) 로 써야 한다.
// & 가 먼저 : 다른 엔티티가 모두 & 로 시작하므로, 그것을 한 번 더 바꾸면 안 된다
function Escape(strText: string): string {
	return strText.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}

// 같은 규칙인데 & 를 마지막에 : 무엇이 잘못되나
function EscapeWrongOrder(strText: string): string {
	return strText.replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll("&", "&amp;");
}

function BoxWidth(strText: string): number {
	return Math.max(BOX_HEIGHT, Math.round(strText.length * 8.4 + 14));
}

// [JS] 배치 → 마크업 : 템플릿 리터럴 (01강) 과 map().join(). 선을 먼저, 상자를 그 위에.
// SVG 안의 <style> 덕분에 <img> 로 보여도 다크 테마를 따른다
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

// 1) 이 트리의 이름표가 마크업에 들어가는 모습
const oParsed = Parse(EXPR);
if (!oParsed.bOk) {
	throw new Error(oParsed.vError.strWhy); // EXPR 은 고정된 올바른 식 : 여기에 오지 않는다
}
const oLayout = LayoutTree(oParsed.vValue);
console.log(`1) ${EXPR}`);
for (const oBox of oLayout.arrBox) {
	console.log(`   ${oBox.strLabel.padEnd(4)} → ${Escape(oBox.strLabel)}`);
}

// 2) 그림 전체 : 글자 몇 줄
const strSvg = ToSvg(oLayout, `Tree of ${EXPR}`);
console.log(`2) ${strSvg.length} characters :`);
for (const strLine of strSvg.trimEnd().split("\n")) {
	console.log(`   ${strLine}`);
}

// 3) 순서가 틀린 이스케이프는 엔티티를 글자로 만들어 버린다
console.log(`3) Expected problem: "<<" escaped with & last → ${EscapeWrongOrder("<<")} (the page shows &lt;&lt; instead of <<)`);
console.log("   Why : &lt; was made first, then its & was escaped again into &amp;lt;.");
console.log("   Fix : escape & first, as Escape() does. In the browser, textContent does all of this for you.");

// 4) [JS] 인자가 있으면 → 파일로 저장. writeFileSync 는 UTF-8 로 쓴다 (셸의 > 는 아닐 수 있음)
const strFile = process.argv[2];
if (strFile === undefined) {
	console.log("4) Add a file name to save it : node lessons/17-tree-view/svg.ts tree.svg");
} else {
	writeFileSync(strFile, strSvg, "utf8");
	console.log(`4) saved : ${strFile} (open it in a browser, or show it with <img src="...">)`);
}
