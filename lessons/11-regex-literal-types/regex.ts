//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 11-regex-literal-types / regex
//	History			: 2026-10-15 CYBERKDH Initial
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// Regular expressions : a small language for "what text looks like". JavaScript has them built in

// 1) [JS] A literal /.../flags is checked when the file is read; new RegExp(text) is built at run time
const RE_HEX = /^0x[0-9a-f]+$/i; // i : ignore case
const reHexToo = new RegExp("^0x[0-9a-f]+$", "i"); // the same regex, from a string (a backslash must be doubled there)
console.log("1)", RE_HEX.test("0xFF"), reHexToo.test("0xff"), RE_HEX.test("0xFG"));
console.log("1) source / flags :", RE_HEX.source, RE_HEX.flags);
// const RE_BAD = /(0x/; // ← Uncomment → red squiggle TS1005 (')' expected) : TS checks regex literals too

// 2) [JS] Classes and quantifiers. Greedy (*, +) takes as much as it can; lazy (*?, +?) as little
const strTag = "<b>bold</b>";
console.log("2) greedy :", /<.+>/.exec(strTag)?.[0]);
console.log("2) lazy   :", /<.+?>/.exec(strTag)?.[0]);
console.log("2) \\d{2,4} in 12345 :", /\d{2,4}/.exec("12345")?.[0], "· [^0-9]+ in ab12 :", /[^0-9]+/.exec("ab12")?.[0]);

// 3) [JS + TS] Groups. ( ) captures by number, (?<name> ) by name. Every capture is string | undefined in TS
const RE_SIZE = /^(?<digits>[0-9]+)(?<unit>[KMGT])$/i;
const oSize = RE_SIZE.exec("16M");
if (oSize !== null) {
	console.log("3) [0] [1] [2] :", oSize[0], oSize[1], oSize[2], "· index :", oSize.index);
	const strUnit: string = oSize.groups?.unit ?? "?"; // groups may be missing, and so may each name : ?. and ??
	console.log("3) groups.digits / unit :", oSize.groups?.digits, strUnit);
}
console.log("3) no match → null :", RE_SIZE.exec("16X"));

// 4) [JS] The g flag : find every match. matchAll gives the groups too
const strLog = "id=12 port=8080 bits=64";
console.log("4) match + g :", strLog.match(/\d+/g));
for (const oPair of strLog.matchAll(/(?<key>[a-z]+)=(?<value>\d+)/g)) {
	console.log(`4) ${oPair.groups?.key} → ${oPair.groups?.value} at ${oPair.index}`);
}
console.log("4) replace + g :", "a-b-c".replace(/-/g, " + "), "· split :", "1, 2,3 ,  4".split(/\s*,\s*/));

// 5) [JS] Lookahead (?= ) and lookbehind (?<= ) check what is around, without taking it
const RE_THOUSANDS = /\B(?=(\d{3})+(?!\d))/g; // a position followed by groups of 3 digits up to the end
console.log("5) 1234567 →", "1234567".replace(RE_THOUSANDS, ","));
console.log("5) after $ :", "cost $42 and 7".match(/(?<=\$)\d+/)?.[0]);

// 6) [JS] The u flag : . and lengths count code points, and \p{...} classes work
const strEmoji = "😀";
console.log("6) length :", strEmoji.length, "· /^.$/ :", /^.$/.test(strEmoji), "· /^.$/u :", /^.$/u.test(strEmoji));
console.log("6) \\p{Script=Hangul} :", "DevCalc 계산기".match(/\p{Script=Hangul}+/u)?.[0]);

// 7) The g + test() trap : a g regex remembers lastIndex between calls
const RE_DIGIT_G = /\d/g;
console.log("7) Expected surprise :", RE_DIGIT_G.test("7"), RE_DIGIT_G.test("7"), RE_DIGIT_G.test("7"));
console.log("   Why : test() with g starts at lastIndex (1 after the first match), fails, and resets it to 0.");
console.log("   Fix : no g flag for test(), or set lastIndex = 0 first. DevCalc's sticky (y) regexes always set it.");

// 8) A regex built from user input can be invalid : that is a run-time SyntaxError
function SafeRegExp(strPattern: string): RegExp | undefined {
	try {
		return new RegExp(strPattern);
	} catch (e) {
		console.log(`8) Expected error: ${String(e)}`);
		return undefined;
	}
}
SafeRegExp("(0x");
console.log("   Why : ( opens a group, and nothing closes it.");

// Fix : put a backslash before every special character, so the text matches only itself
function EscapeRegExp(strText: string): string {
	return strText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& = the whole match
}
const strPlain = "1+1=2 (ok)";
console.log("8) escaped :", EscapeRegExp(strPlain), "→", new RegExp(EscapeRegExp(strPlain)).test("so 1+1=2 (ok)"));
// RegExp.escape(strPlain) does the same from ES2025 (Node 24 has it; "lib": ["es2025"] lets TS know)
