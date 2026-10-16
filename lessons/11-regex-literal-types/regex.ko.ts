//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 11-regex-literal-types / regex (정규식)
//	History			: 2026-10-15 CYBERKDH Initial (최초 작성)
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// 정규식 (regular expression) : "텍스트가 어떻게 생겼는지" 를 적는 작은 언어. JavaScript 에 내장되어 있음

// 1) [JS] 리터럴 /.../플래그 는 파일을 읽을 때 검사되고, new RegExp(문자열) 은 실행 중에 만들어짐
const RE_HEX = /^0x[0-9a-f]+$/i; // i : 대소문자 무시 (ignore case)
const reHexToo = new RegExp("^0x[0-9a-f]+$", "i"); // 문자열로 만든 같은 정규식 (문자열 안에서는 역슬래시를 두 번 써야 함)
console.log("1)", RE_HEX.test("0xFF"), reHexToo.test("0xff"), RE_HEX.test("0xFG"));
console.log("1) source / flags :", RE_HEX.source, RE_HEX.flags);
// const RE_BAD = /(0x/; // ← 주석을 풀면 빨간 줄 TS1005 (')' expected) : TS 는 정규식 리터럴도 검사함

// 2) [JS] 문자 클래스 (class) 와 수량자 (quantifier). 탐욕 (greedy, * +) 은 최대한 많이, 게으른 (lazy, *? +?) 은 최소한으로
const strTag = "<b>bold</b>";
console.log("2) greedy :", /<.+>/.exec(strTag)?.[0]);
console.log("2) lazy   :", /<.+?>/.exec(strTag)?.[0]);
console.log("2) \\d{2,4} in 12345 :", /\d{2,4}/.exec("12345")?.[0], "· [^0-9]+ in ab12 :", /[^0-9]+/.exec("ab12")?.[0]);

// 3) [JS + TS] 그룹 (group). ( ) 는 번호로, (?<이름> ) 은 이름으로 캡처. TS 에서 캡처는 모두 string | undefined
const RE_SIZE = /^(?<digits>[0-9]+)(?<unit>[KMGT])$/i;
const oSize = RE_SIZE.exec("16M");
if (oSize !== null) {
	console.log("3) [0] [1] [2] :", oSize[0], oSize[1], oSize[2], "· index :", oSize.index);
	const strUnit: string = oSize.groups?.unit ?? "?"; // groups 도, 각 이름도 없을 수 있음 : ?. 와 ??
	console.log("3) groups.digits / unit :", oSize.groups?.digits, strUnit);
}
console.log("3) no match → null :", RE_SIZE.exec("16X"));

// 4) [JS] g 플래그 : 일치하는 것을 모두 찾음. matchAll 은 그룹까지 줌
const strLog = "id=12 port=8080 bits=64";
console.log("4) match + g :", strLog.match(/\d+/g));
for (const oPair of strLog.matchAll(/(?<key>[a-z]+)=(?<value>\d+)/g)) {
	console.log(`4) ${oPair.groups?.key} → ${oPair.groups?.value} at ${oPair.index}`);
}
console.log("4) replace + g :", "a-b-c".replace(/-/g, " + "), "· split :", "1, 2,3 ,  4".split(/\s*,\s*/));

// 5) [JS] 전방 탐색 (lookahead, (?= )) 과 후방 탐색 (lookbehind, (?<= )) 은 주변을 확인만 하고 가져가지 않음
const RE_THOUSANDS = /\B(?=(\d{3})+(?!\d))/g; // 뒤에 끝까지 3자리 묶음이 이어지는 위치
console.log("5) 1234567 →", "1234567".replace(RE_THOUSANDS, ","));
console.log("5) after $ :", "cost $42 and 7".match(/(?<=\$)\d+/)?.[0]);

// 6) [JS] u 플래그 : . 과 길이를 코드 포인트 (code point) 단위로 세고, \p{...} 클래스를 쓸 수 있음
const strEmoji = "😀";
console.log("6) length :", strEmoji.length, "· /^.$/ :", /^.$/.test(strEmoji), "· /^.$/u :", /^.$/u.test(strEmoji));
console.log("6) \\p{Script=Hangul} :", "DevCalc 계산기".match(/\p{Script=Hangul}+/u)?.[0]);

// 7) g + test() 함정 : g 정규식은 호출 사이에 lastIndex 를 기억함
const RE_DIGIT_G = /\d/g;
console.log("7) Expected surprise :", RE_DIGIT_G.test("7"), RE_DIGIT_G.test("7"), RE_DIGIT_G.test("7"));
console.log("   Why : test() with g starts at lastIndex (1 after the first match), fails, and resets it to 0.");
console.log("   Fix : no g flag for test(), or set lastIndex = 0 first. DevCalc's sticky (y) regexes always set it.");

// 8) 사용자 입력으로 만든 정규식은 잘못될 수 있음 : 실행 중의 SyntaxError
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

// 해결 : 특수 문자마다 앞에 역슬래시를 붙여서, 텍스트가 자기 자신하고만 일치하게 함 (이스케이프, escape)
function EscapeRegExp(strText: string): string {
	return strText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& = 일치한 전체
}
const strPlain = "1+1=2 (ok)";
console.log("8) escaped :", EscapeRegExp(strPlain), "→", new RegExp(EscapeRegExp(strPlain)).test("so 1+1=2 (ok)"));
// ES2025 부터는 RegExp.escape(strPlain) 가 같은 일을 함 (Node 24 에 있음; "lib": ["es2025"] 로 TS 에 알려 줌)
