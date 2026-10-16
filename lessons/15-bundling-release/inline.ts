//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 15-bundling-release / inline
//	History			: 2026-10-15 CYBERKDH Initial
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// One HTML file : put the CSS inside <style> and the JS inside <script>. It sounds like one
// replace() call. Two traps make it two lines more.
const TEMPLATE_HTML = "<style>/*CSS*/</style>\n<script type=\"module\">/*JS*/</script>";
const STYLE_CSS = "b { color: teal; }";
const APP_JS = 'const strTag = "bits".replace(/\\w+/, "<$&>");\nconst strHelp = "use <script></script> for code";';

// 1) [JS] Trap 1 : a string as the second argument of replace() is a pattern. $& means "what matched"
const strNaive = TEMPLATE_HTML.replace("/*CSS*/", STYLE_CSS).replace("/*JS*/", APP_JS);
Log("1) the JS line we put in : " + (APP_JS.split("\n")[0] ?? ""));
Log("   the line in the page  : " + (strNaive.split("\n")[1]?.replace('<script type="module">', "") ?? ""));
Log('   $& became "/*JS*/" : replace() read our code as a replacement pattern ($&, $1, $$, $` …)');

// 2) [JS] Trap 2 : the HTML parser ends the script at the first </script, even inside a JS string
const nOpen = strNaive.indexOf(">", strNaive.indexOf("<script")) + 1;
const strSeen = strNaive.slice(nOpen, strNaive.indexOf("</script", nOpen));
Log("2) the browser runs only : " + JSON.stringify(strSeen.split("\n")[1]));
try {
	new Function(strSeen); // parse it the way the browser would
} catch (e) {
	Log(`   Expected error: ${String(e)}`);
	Log("   Why : the string stops in the middle, and the rest of the file shows up on the page as text.");
	Log("   Fix : write <\\/script instead of </script. In a JS string \\/ is just /, and the parser no longer sees an end tag.");
}

// 3) [JS] The fix : a function as the second argument is never read as a pattern
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

// 4) [JS] esbuild already writes <\/script inside strings it outputs. Inline() still does it for code you paste yourself
Log("4) script tags in the page : " + (strPage.match(/<\/script/g) ?? []).length + " (only the real one)");

function Log(strLine: string): void {
	console.log(strLine);
}
