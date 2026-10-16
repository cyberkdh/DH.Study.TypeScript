//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 15-bundling-release / inline (HTML 하나에 CSS와 JS 넣기)
//	History			: 2026-10-15 CYBERKDH Initial (최초 작성)
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// HTML 파일 하나 : CSS 는 <style> 안에, JS 는 <script> 안에 넣는다. replace() 한 번이면 될 것 같지만
// 함정 두 개 때문에 두 줄이 더 필요하다.
const TEMPLATE_HTML = "<style>/*CSS*/</style>\n<script type=\"module\">/*JS*/</script>";
const STYLE_CSS = "b { color: teal; }";
const APP_JS = 'const strTag = "bits".replace(/\\w+/, "<$&>");\nconst strHelp = "use <script></script> for code";';

// 1) [JS] 함정 1 : replace() 의 두 번째 인자가 문자열이면 패턴이다. $& 는 "찾은 부분" 이라는 뜻
const strNaive = TEMPLATE_HTML.replace("/*CSS*/", STYLE_CSS).replace("/*JS*/", APP_JS);
Log("1) the JS line we put in : " + (APP_JS.split("\n")[0] ?? ""));
Log("   the line in the page  : " + (strNaive.split("\n")[1]?.replace('<script type="module">', "") ?? ""));
Log('   $& became "/*JS*/" : replace() read our code as a replacement pattern ($&, $1, $$, $` …)');

// 2) [JS] 함정 2 : HTML 파서는 JS 문자열 안이라도 처음 나온 </script 에서 스크립트를 끝낸다
const nOpen = strNaive.indexOf(">", strNaive.indexOf("<script")) + 1;
const strSeen = strNaive.slice(nOpen, strNaive.indexOf("</script", nOpen));
Log("2) the browser runs only : " + JSON.stringify(strSeen.split("\n")[1]));
try {
	new Function(strSeen); // 브라우저처럼 파싱해 봄
} catch (e) {
	Log(`   Expected error: ${String(e)}`);
	Log("   Why : the string stops in the middle, and the rest of the file shows up on the page as text.");
	Log("   Fix : write <\\/script instead of </script. In a JS string \\/ is just /, and the parser no longer sees an end tag.");
}

// 3) [JS] 해결 : 두 번째 인자가 함수면 패턴으로 읽지 않는다
function Inline(strHtml: string, strMarker: string, strCode: string): string {
	if (!strHtml.includes(strMarker)) {
		throw new Error(`marker ${strMarker} not found in the template`);
	}
	const strSafe = strCode.replace(/<\/(script|style)/gi, "<\\/$1"); // </script → <\/script, </style → <\/style
	return strHtml.replace(strMarker, () => strSafe);
}

const strPage = Inline(Inline(TEMPLATE_HTML, "/*CSS*/", STYLE_CSS), "/*JS*/", APP_JS);
const nStart = strPage.indexOf(">", strPage.indexOf("<script")) + 1;
const strScript = strPage.slice(nStart, strPage.indexOf("</script", nStart));
Log("3) with Inline() the page has :");
for (const strLine of strScript.split("\n")) {
	Log("   " + strLine);
}
const fnScript = new Function(strScript + "\nreturn [strTag, strHelp];") as () => string[];
Log("   and it runs : " + JSON.stringify(fnScript()));

// 4) [JS] esbuild 는 출력 문자열 안의 </script 를 이미 <\/script 로 쓴다. 직접 붙여 넣는 코드를 위해 Inline() 도 처리
Log("4) script tags in the page : " + (strPage.match(/<\/script/g) ?? []).length + " (only the real one)");

function Log(strLine: string): void {
	console.log(strLine);
}
