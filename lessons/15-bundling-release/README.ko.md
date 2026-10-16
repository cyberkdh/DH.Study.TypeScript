[English](README.md) · **한국어**

[← 이전: 14. DOM 심화](../14-events-accessibility/README.ko.md) · [목차](../../README.ko.md)

# 15. 번들러와 빌드 — esbuild 로 HTML 파일 하나 만들기

> 시리즈: DH.Study.TypeScript · 15강 (2부, 마지막 강의)
> 환경: Node.js v24 · TypeScript 7 · Vitest 5 · esbuild 0.28 · VS Code · 브라우저

## 목표

이 강의를 마치면 다음을 할 수 있다.

- [ ] 모듈 파일 15 개로 된 페이지가 왜 느리게 시작하고, 왜 `file://` 로 열리지 않는지 설명한다
- [ ] TypeScript 시작 파일(Entry file)을 esbuild 로 번들(Bundle)한다: 명령줄에서, 그리고 스크립트에서
- [ ] esbuild 가 하는 일 (타입 지우기, import 따라가기, 트리 셰이킹(Tree shaking), 압축(Minify)) 과 하지 않는 일 (타입 검사) 을 구별한다
- [ ] 옵션 객체에 `satisfies BuildOptions` 로 타입을 붙이고, 빌드 때 정해지는 상수를 `declare const` 로 선언한다
- [ ] 두 함정 없이 CSS 와 JS 를 HTML 파일 하나에 넣는다: `replace()` 의 `$&`, 문자열 속 `</script>`
- [ ] 더블클릭으로 열리는 DevCalc 파일 하나를 만든다: `npm run build:single`

## 이 강의의 목차

1. [왜 번들하는가](#1-왜-번들하는가)
2. [esbuild](#2-esbuild)
3. [번들러가 코드에 하는 일](#3-번들러가-코드에-하는-일)
4. [HTML 파일 하나](#4-html-파일-하나)
5. [따라하기](#5-따라하기)
6. [직접 만들기 — 비트 그리드를 파일 하나로](#6-직접-만들기--비트-그리드를-파일-하나로)
7. [DevCalc 스텝 — Lv10 파일 하나](#7-devcalc-스텝--lv10-파일-하나)
8. [정리](#정리)
9. [다음으로 갈 곳](#다음으로-갈-곳)

이 강의의 예제 파일: [modules.ko.ts](modules.ko.ts) · [esbuild.ko.ts](esbuild.ko.ts) · [inline.ko.ts](inline.ko.ts) · [single.ko.ts](single.ko.ts)

> 예제는 한국어 주석판(`x.ko.ts`)을 링크한다. 같은 코드의 영어 주석판은 `x.ts` 다.

> 문법 표시: **[JS]** = JavaScript 문법 (TS 없이도 있음) · **[TS]** = TypeScript 가 더한 타입 문법 (지우면 JS) · 자세한 구분은 [00강 7-3](../00-setup/README.ko.md#7-3-ts-문법--js-문법--타입-문법)

DevCalc 웹 페이지는 잘 돌아가지만, 웹 서버 뒤에서만 그렇다: 개발할 때는 `npm run web`, 배포한 뒤에는 GitHub Pages. `dist/web` 을 USB 메모리에 복사해서 `index.html` 을 더블클릭하면 빈 페이지가 나온다. 이 강의는 페이지를 어디서나 열리는 **파일 하나**로 바꾼다:

```
> npm run build:web && npm run build:single
…
[4] checks ok · 29.7 KB · one file · built 2026-10-16 · esbuild 0.28.2
Done : dist/web/DevCalc.html (double-click it : no server needed)
```

예제는 00~13강처럼 `node` 로 실행한다. 결과물 (`dist/single/bitgrid.html`, `dist/web/DevCalc.html`) 만 브라우저에서 연다.

---

## 1. 왜 번들하는가

### 1-1. 브라우저는 import 를 물결(Wave) 단위로 찾는다

`<script type="module" src="./App.ts">` 는 파일 하나를 요청한다. 그 파일을 읽은 뒤에야 브라우저는 `import … from "../src/core/index.ts"` 를 보고, 그걸 요청해서 읽고, import 12 개를 더 찾는다. [modules.ko.ts](modules.ko.ts) 가 DevCalc 를 같은 방식으로 따라간다:

```
1) the browser loads App.ts, reads it, and only then asks for what it imports
   wave 1 : web/App.ts
   wave 2 : src/core/index.ts, web/BitGrid.ts
   wave 3 : src/core/Format.ts, src/core/Parse.ts, src/core/Literal.ts, … (12 files)
2) 15 files, 75.4 KB, 3 waves : at 100 ms a round trip, 300 ms before App.ts can run
```

내 컴퓨터에서는 왕복(Round trip) 한 번이 1 ms 라서 느낄 수 없다. 서버에서 먼 휴대폰에서는 물결마다 왕복 한 번씩을 다 기다려야 코드가 시작된다.

### 1-2. `file://` 은 모듈을 불러오지 않는다

브라우저는 `file://` 페이지를 각각 별도의 출처(Origin)로 보고, 모듈 스크립트는 `fetch()` 와 같은 규칙을 따른다: 다른 파일을 불러올 수 없다. 더블클릭한 `index.html` 이 빈 이유이고, 07강에서 서버가 필요했던 이유다 (DevTools: `Access to script at '…/App.js' from origin 'null' has been blocked by CORS policy`).

### 1-3. 번들러 : 많은 파일이 들어가서 파일 하나가 나온다

**번들러(Bundler)** 는 시작 파일을 읽고, 빌드할 때 모든 import 를 따라가서, 모든 코드를 파일 하나에 쓴다. 각 모듈은 자기가 import 하는 모듈 뒤에 온다:

```
3) a bundler writes them into one file in this order (each one after what it imports) :
   Format.ts → Parse.ts → Literal.ts → WordSize.ts → Output.ts → Calculator.ts → Result.ts → History.ts → Lexer.ts → Functions.ts → Parser.ts → Evaluate.ts → index.ts → BitGrid.ts → App.ts
```

`import` 줄은 사라진다: 이름이 이미 같은 파일 안에 있다. 요청 한 번, 물결 없음, `file://` 에서 더 불러올 것도 없음.

### 1-4. 맨 이름은 패키지다

`import "./x.ts"` 는 경로다. `import "x"` (`./` 도 `/` 도 없음) 는 **맨 지정자(Bare specifier)**, 곧 패키지 이름이다. Node 는 `node_modules` 에서 찾지만, 브라우저는 찾을 곳이 없다:

```
4) Expected error: Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'devcalc'
   Why : "devcalc/src/core/index.ts" has no ./ in front, so it is read as a package name, not a path. A browser says "Failed to resolve module specifier".
   Fix : write a relative path ("./" or "../"), or let a bundler resolve the names at build time.
```

번들러가 있는 또 하나의 이유다: `import { build } from "esbuild"` 는 Node 스크립트에서 동작하고, 번들러는 같은 줄을 브라우저가 실행할 수 있는 코드로 바꿀 수 있다.

---

## 2. esbuild

### 2-1. 설치하고 명령줄로 해 보기

esbuild 는 Go 로 작성된 번들러다: 작은 실행 파일 하나, TypeScript 에 플러그인 필요 없음. `typescript`, `vitest` 처럼 개발 의존성(devDependency)이다:

```
> npm install --save-dev esbuild
> npx esbuild devcalc/web/App.ts --bundle --format=esm --minify --outfile=dist/esb-test/app.js

  dist\esb-test\app.js  23.8kb

Done in 3ms
```

`--bundle` 이 import 를 따라간다 (없으면 파일 하나만 변환). 파일 15 개에 3 ms.

### 2-2. 같은 일을 스크립트에서

한 번 부를 때는 명령줄로 충분하다. 파일을 복사하고 검사까지 하는 빌드는 스크립트가 편하고, 옵션은 타입 있는 객체다 ([esbuild.ko.ts](esbuild.ko.ts)):

```ts
import { build, transform, type BuildOptions } from "esbuild";

const BASE_OPTIONS = {
	entryPoints: [resolve(ROOT_DIR, "devcalc/web/App.ts")],
	bundle: true,
	write: false,      // 결과를 메모리에 : oResult.outputFiles[0].text
	format: "esm",
	metafile: true,    // 어떤 파일이 들어갔는지도 알려줌
	logLevel: "silent",
} satisfies BuildOptions;

const oPlain = await build(BASE_OPTIONS);
```

### 2-3. [TS] 왜 `satisfies` 인가

타입이 없으면 TypeScript 는 객체 안의 `format: "esm"` 을 `format: string` 으로 넓힌다 (Widening) — 나중에 객체가 바뀔 수 있으니까. `build()` 는 `"iife" | "cjs" | "esm"` 을 원한다:

```ts
const oLoose = { format: "esm" };
await build(oLoose);
// TS2345: Argument of type '{ format: string; }' is not assignable … Type 'string' is not assignable to type 'Format | undefined'.
```

`satisfies BuildOptions` (12강) 는 객체를 `BuildOptions` 에 맞춰 검사**하면서 리터럴 타입을 유지한다**. `formt: "esm"` 이나 `format: "es"` 같은 오타는 쓴 자리에서 오류가 되고, `{ ...BASE_OPTIONS, minify: true }` 도 여전히 `format: "esm"` 이다.

### 2-4. esbuild 는 타입을 지울 뿐 검사하지 않는다

```
1) transform : "const nBits = \"8\";\nconsole.log(nBits);\n"
   no error : esbuild only erases types, so run tsc --noEmit before you bundle
```

`const nBits: number = "8"` 은 타입 오류인데, esbuild 는 그냥 빌드한다. 그래서 esbuild 가 빠르다 — 그리고 그래서 이 프로젝트의 모든 빌드는 `tsc --noEmit` 을 먼저 실행한다. 일을 나눈다: **tsc 는 검사, esbuild 는 빌드.**

---

## 3. 번들러가 코드에 하는 일

### 3-1. 트리 셰이킹 (Tree shaking)

`devcalc/src/core/index.ts` 는 코어 함수를 모두 export 한다. `App.ts` 는 그중 일부만 쓰고, esbuild 는 파일뿐 아니라 이름까지 따라간다:

```
3) FunctionHelp kept
3) ParseInteger kept
3) OutputHelp   dropped (App.ts never uses it)
3) ToBin        dropped (App.ts never uses it)
```

`OutputHelp` 는 명령줄의 `--help` 글이라 페이지는 보여주지 않는다. 이게 안전한 이유는 코어 파일들이 맨 위 수준(Top level)에서 정의만 하기 때문이다 — import 할 때 실행되는 코드가 없으니, 안 쓰는 함수를 빼도 다른 것은 바뀌지 않는다.

### 3-2. 압축 (Minify)

```
4) minify : 44.3 KB → 23.6 KB (53%)
   starts : var Ue={nRadix:16,strPrefix:"0x"…
```

지역 이름은 한두 글자가 되고, 공백과 주석은 사라진다. 속성 이름 (`nRadix`, `strPrefix`) 은 남는다: 다른 코드가 이름으로 읽을 수 있으니까. 동작은 같다 — 7절에서 압축된 DevCalc 를 14강과 같은 헤드리스 테스트로 확인한다.

### 3-3. 형식 (Format) : `esm` 또는 `iife`

```
5) esm  starts : var Ue={nRadix:16,st…
   iife starts : "use strict";(()=>{v…
```

| 형식 | 불러오는 법 | 참고 |
|---|---|---|
| `esm` | `<script type="module">` | strict 모드와 `defer` 가 저절로; `import` / `export` 가능 |
| `iife` | `<script>` | `(() => { … })()` 로 감싸서 이름이 밖으로 새지 않음 |

DevCalc 는 `esm` 을 쓴다: `App.ts` 의 맨 위 코드는 페이지가 다 파싱된 상태 (`defer`) 를 기대하고, `type="module"` 이 그걸 준다.

### 3-4. [TS] `define` 과 `declare const` : 빌드가 주는 값

`define` 은 빌드할 때 이름을 값으로 바꾼다. TypeScript 는 그 이름이 있는지 모르니 `declare` 로 알려준다 — JS 를 전혀 만들지 않는 **[TS]** 줄이다:

```ts
declare const __BUILD__: string;
console.log(typeof __BUILD__ === "string" ? __BUILD__ : "dev");
```

```
6) define : "console.log(\"2026-10-15\");" ← the check and the dev branch are gone
```

`minify` 를 켜면 esbuild 는 `typeof "2026-10-15" === "string"` 이 언제나 참인 걸 알고 나머지를 지운다. 빌드하지 않았을 때 없는 이름에 `typeof` 를 하면 `ReferenceError` 가 아니라 `"undefined"` 다. 그래서 같은 파일이 `npm run web` 에서도 그대로 돈다.

### 3-5. 빌드할 때 나는 오류

```
7) Expected error: Could not resolve "./nope.ts"
   Why : the bundler follows every import at build time, and ./nope.ts does not exist.
   Fix : correct the path. The mistake shows up at build time, not when a user opens the page.
```

실패한 `build()` 가 던지는 오류에는 `errors` 배열이 있고, 문제마다 객체가 하나씩 (`text`, `location`) 들어 있다. `catch` 의 `e` 는 `unknown` 이라서 (04강) 예제는 `as { errors?: … }` 와 기본값으로 좁힌다.

---

## 4. HTML 파일 하나

번들은 `.js` 파일 하나지만, `index.html` 과 `style.css` 까지 하면 여전히 세 파일이고, `<script type="module" src="./app.js">` 는 여전히 `file://` 에서 불러올 수 없다. CSS 를 `<style>` 에, JS 를 `<script>` 에 넣으면 페이지는 다른 게 필요 없다. 각각 `replace()` 한 번이면 될 것 같다. [inline.ko.ts](inline.ko.ts) 가 함정 두 개를 보여준다.

### 4-1. 함정 1 : 바꿀 문자열은 패턴이다

```
1) the JS line we put in : const strTag = "bits".replace(/\w+/, "<$&>");
   the line in the page  : const strTag = "bits".replace(/\w+/, "</*JS*/>");
   $& became "/*JS*/" : replace() read our code as a replacement pattern ($&, $1, $$, $` …)
```

`strHtml.replace(strMarker, strCode)` 에서 두 번째 인자는 **치환 패턴(Replacement pattern)** 이다: `$&` 는 "찾은 부분", `$$` 는 `$`. 우리 JS 에 `$&` 가 있었고, `replace()` 가 우리 코드를 바꿨다. 오류도 없다 — 그냥 틀린 프로그램이 된다. 압축된 코드에는 `$` 이름이 가득하다 (DevCalc 번들에 115 개).

해결: **함수**를 넘긴다. 함수가 돌려준 값은 그대로 쓰인다:

```ts
return strHtml.replace(strMarker, () => strSafe);
```

### 4-2. 함정 2 : 문자열 속 `</script>` 가 스크립트를 끝낸다

HTML 파서는 JavaScript 를 모른다. `<script>` 안에서 처음 나온 `</script` 에서 멈춘다 — 문자열 한가운데라도:

```
2) the browser runs only : "const strHelp = \"use <script>"
   Expected error: SyntaxError: Invalid or unexpected token
   Why : the string stops in the middle, and the rest of the file shows up on the page as text.
   Fix : write <\/script instead of </script. In a JS string \/ is just /, and the parser no longer sees an end tag.
```

```ts
const strSafe = strCode.replace(/<\/(script|style)/gi, "<\\/$1"); // </script → <\/script, </style → <\/style
```

여기서는 치환 패턴이 *의도한 것*이다: `$1` 은 찾은 그대로의 `script` 나 `style` (`gi`: 대소문자 무관). CSS 의 `</style>` 에도 같은 함정이 있다.

```
3) with Inline() the page has :
   const strTag = "bits".replace(/\w+/, "<$&>");
   const strHelp = "use <script><\/script> for code";
   and it runs : ["<bits>","use <script></script> for code"]
4) script tags in the page : 1 (only the real one)
```

esbuild 는 출력하는 문자열 안의 `</script` 를 이미 `<\/script` 로 쓴다. 그래도 `Inline()` 이 한 번 더 처리한다: esbuild 가 만들지 않은 코드를 위해, 그리고 나중 버전이 그렇게 하지 않을 경우를 위해.

---

## 5. 따라하기

`node lessons/15-bundling-release/modules.ko.ts` 로 실행한다 (이어서 `esbuild.ko.ts`, `inline.ko.ts`). 출력은 1~4절에 있다. 해 볼 것:

- [modules.ko.ts](modules.ko.ts): `WAVE_MS` 를 300 으로 (느린 모바일 연결) → `900 ms before App.ts can run`.
- [esbuild.ko.ts](esbuild.ko.ts): `oLoose` 두 줄의 주석을 해제 → TS2345 (2-3절). 이어서 `{ format: "esm" }` 뒤에 `satisfies BuildOptions` 를 붙이면 → 오류가 사라진다.
- [esbuild.ko.ts](esbuild.ko.ts): 1절의 `loader: "ts"` 를 `loader: "js"` 로 → `ERROR: Expected ";" but found ":"`: JavaScript 로 읽으면 `: number` 는 문법 오류다.
- [inline.ko.ts](inline.ko.ts): `Inline()` 에서 `() => strSafe` 를 `strSafe` 로 → 3) 줄에 다시 `"</*JS*/>"` 가 나오고, 결과도 `["</*JS*/>", …]` 가 된다.

---

## 6. 직접 만들기 — 비트 그리드를 파일 하나로

[single.ko.ts](single.ko.ts) 는 2~4절을 14강의 비트 그리드에 모은다: 번들 → 넣기 → 검사 → 쓰기.

```ts
const oResult = await build({ entryPoints: [ENTRY_FILE], bundle: true, write: false, format: "esm", minify: true, target: "es2022", logLevel: "silent" });
const strJs = oResult.outputFiles[0]?.text ?? "";

const strPage = Inline(Inline(TEMPLATE_HTML, CSS_MARK, STYLE_CSS), JS_MARK, strJs);
const arrCheck: [string, boolean][] = [
	["markers replaced", !strPage.includes(CSS_MARK) && !strPage.includes(JS_MARK)],
	["one </script>", (strPage.match(/<\/script/gi) ?? []).length === 1],
	…
];
```

- 템플릿은 템플릿 리터럴이고, `<script type="module">` 안에 `${JS_MARK}`, `<style>` 안에 `${CSS_MARK}` 가 있다. 표시(Marker)는 주석 (`/*INLINE:JS*/`) 이라서 템플릿은 그대로도 올바른 HTML 과 CSS 다.
- `Inline()` 은 표시가 없으면 예외를 던진다: `replace()` 만 쓰면 페이지가 그대로 돌아오고, 스크립트 없는 페이지로 빌드가 "성공" 해 버린다.
- `target: "es2022"` 는 브라우저가 이해하는 문법을 esbuild 에 알려서, 그보다 새로운 문법이 결과에 남지 않게 한다.

### 실행

```
> node lessons/15-bundling-release/single.ko.ts
1) bundle : lessons/14-events-accessibility/bitgrid.ts → 3121 chars of JS
2) check markers replaced   ok
2) check one </script>      ok
2) check no .ts file left   ok
2) check no import left     ok
3) wrote dist/single/bitgrid.html : 3.7 KB, 1 file
   open it from Explorer (file://) : the grid works, and the log shows lesson 14's lines 6) to 9)
4) Expected error: Error: marker /*INLINE:JS*/ not found in the template
   Why : someone changed the template and the marker went with it. replace() alone would return the page unchanged, silently.
   Fix : put /*INLINE:JS*/ back inside <script type="module">. Inline() checks so the build stops instead.
```

`dist/single/bitgrid.html` 을 더블클릭: 버튼 16 개, 그리고 14강과 같은 기록 (`6) click bit  0 → 0x0001 …` 부터 `9) Expected error: RangeError …` 까지). 서버는 돌고 있지 않다.

해 볼 것:

- `TEMPLATE_HTML` 에서 `${JS_MARK}` 를 지우면 → 빌드가 `Error: marker /*INLINE:JS*/ not found in the template` 에서 멈추고 아무것도 쓰지 않는다.
- `minify: true` 를 빼면 → 파일이 커지고, 안에서 14강 코드를 읽을 수 있다 — 타입도 주석도 없이.

---

## 7. DevCalc 스텝 — Lv10 파일 하나

### 바뀐 것

| 파일 | 변경 |
|---|---|
| `tools/build-single.ts` | 새 파일: `[1]` `tsc --noEmit -p tsconfig.web.json` → `[2]` esbuild 번들 (esm, es2022, minify, `define`) → `[3]` style.css 와 번들을 index.html 에 넣기 → `[4]` 검사 → `dist/web/DevCalc.html` |
| `package.json` | `build:single` 스크립트; devDependencies 에 `esbuild` |
| `devcalc/web/App.ts` | `declare const DEVCALC_BUILD: string;` 과 페이지 맨 아래 빌드 줄; 제목 `Lv10` |
| `devcalc/web/index.html` | `<p id="build" class="muted">`, 제목 `Lv10` |
| `devcalc/tests/Web.test.ts` | index.html 에 build-single.ts 가 바꾸는 `<link>`, `<script>` 태그가 정확히 있고, `</script>` 는 하나뿐 |
| `.github/workflows/pages.yml` | `build:web` 다음에 `npm run build:single` 실행 |
| `tools/README.ko.md` | `build-single.ts` 절 |

코어는 바뀌지 않았고, 페이지의 나머지도 그대로다.

### `build-single.ts`

표시 대신 index.html 에 이미 있는 태그 두 개를 바꾼다. 그래서 페이지는 `npm run web` 에서도 그대로 동작한다:

```ts
const STR_STYLE_LINK = '<link rel="stylesheet" href="./style.css" />';
const STR_SCRIPT_TAG = '<script type="module" src="./App.ts"></script>';

const strStyled = Inline(strHtml, STR_STYLE_LINK, "<style>", "</style>", strCss);
const strPage = Inline(strStyled, STR_SCRIPT_TAG, '<script type="module">', "</script>", strJs);
```

누가 그 태그 중 하나를 고치면 빌드는 `devcalc/web/index.html has no …` 로 실패하고, `Web.test.ts` 의 새 테스트는 그보다 먼저 `npm test` 에서 실패한다.

빌드 표시는 `define` 에서 온다:

```ts
// tools/build-single.ts
define: { DEVCALC_BUILD: JSON.stringify(STR_BUILD) },  // "one file · built 2026-10-16 · esbuild 0.28.2"

// devcalc/web/App.ts
declare const DEVCALC_BUILD: string;
elBuild.textContent = typeof DEVCALC_BUILD === "string" ? DEVCALC_BUILD : "modules (not bundled) · npm run build:single makes one file";
```

이름이 `__DEVCALC_BUILD__` 가 아니라 `DEVCALC_BUILD` 인 이유: `npm run names` (09강) 는 대문자(UPPER_CASE)는 받지만 맨 앞의 `_` 는 받지 않는다.

### 실행

```
> npm run build:web && npm run build:single
[1] tsc --noEmit -p tsconfig.web.json
[2] esbuild devcalc/web/App.ts  →  one module
    15 files → 23.7 KB
[3] index.html + style.css + module  →  dist/web/DevCalc.html
[4] checks ok · 29.7 KB · one file · built 2026-10-16 · esbuild 0.28.2
Done : dist/web/DevCalc.html (double-click it : no server needed)
```

`build:web` 이 먼저 `dist/web` 을 비우므로 `build:single` 은 그다음에 실행한다. GitHub Pages 에서는 모듈 버전 옆의 `https://cyberkdh.github.io/DH.Study.TypeScript/DevCalc.html` 에 있다.

### 확인

헤드리스 브라우저로 `DevCalc.html` 을 `file://` 로 열고, 12~14강과 같은 스크립트로 조작했다:

```
16-bit 'A' + 1 : HEX 0x0042 | DEC 66 | BIN 0b0000_0000_0100_0010 | INT 66 | OCT 0o000_102 | CHAR 'B'
popcount(mask) : HEX 0x0008 | DEC 8 | …
128-bit ~0 : HEX 0xFFFF_FFFF_FFFF_FFFF_FFFF_FFFF_FFFF_FFFF | … · grid buttons 128
rol without word : error shown true ·  Cannot calculate: "rol(1, 1)" …
one file · built 2026-10-16 · esbuild 0.28.2 | h1 DevCalc Lv10 · web
click bit 0 : grid 10100100 · focus = bit 0 · …
ArrowUp → box '0xA4 ^ bit(2)' preview '= 0xA0'
Esc → box '' · error hidden = true · preview ''
```

콘솔 오류 없음. `npm run web` 으로 열면 맨 아래 줄은 `modules (not bundled) · npm run build:single makes one file` 이다. 기록은 `localStorage` 에 남고, `file://` 페이지에도 `localStorage` 가 있다.

```
> npm test
check-pairs : 70 pairs, 0 failed
check-names : 36 files, 0 problems

 Test Files  12 passed (12)
      Tests  79 passed (79)
```

해 볼 것:

- `dist/web/DevCalc.html` 을 아무 데나 (바탕 화면, USB 메모리) 복사해서 더블클릭.
- `index.html` 에서 `href="./style.css" />` 를 `href="./style.css">` 로 → `npm test` 가 실패하고, `npm run build:single` 은 `devcalc/web/index.html has no <link rel="stylesheet" href="./style.css" />` 에서 멈춘다.
- `devcalc/web/App.ts` 끝에 `const nBits: number = "8";` 를 추가 → 빌드가 esbuild 전에 [1] 단계에서 TS2322 로 멈춘다 (확인한 뒤 다시 지운다).

---

## 정리

- **[JS]** 모듈 페이지는 import 를 물결 단위로, 물결마다 왕복 한 번씩 불러오고, `file://` 에서는 아예 불러오지 못한다. 맨 이름 (`"esbuild"`) 은 패키지라서 번들러나 Node 만 찾을 수 있다.
- **[JS]** esbuild 는 import 를 따라가 파일 하나를 쓰고, 안 쓰는 함수를 빼고 (트리 셰이킹), 이름을 줄인다 (압축). **타입은 검사하지 않는다**: `tsc --noEmit` 을 먼저.
- **[TS]** `satisfies BuildOptions` 는 옵션을 검사하고 `"esm"` 을 리터럴로 유지한다. `declare const NAME: string` 은 `define` 이 넣어 줄 값을 TypeScript 에 알려주고, 값이 없을 때도 `typeof NAME` 은 안전하다.
- **[JS]** 넣기 (Inlining): `replace()` 에 함수를 넘겨 `$&` 가 코드로 남게 하고, `<\/script` 로 써서 문자열이 태그를 끝내지 못하게 한다. 쓰기 전에 결과를 검사한다.
- DevCalc Lv10: `npm run build:single` → `dist/web/DevCalc.html`. 더블클릭, USB 메모리, GitHub Pages 어디서나 도는 30 KB 파일 하나.

## 다음으로 갈 곳

이것이 마지막 강의다. DevCalc 는 `ToHex(255)` (01강) 에서 시작해 식, 128 비트 워드, 함수, 변수, 비트 그리드, 파일 하나짜리 빌드까지 갖춘 계산기가 되었다 — 터미널과 브라우저에서 같은 코어로.

- [DevCalc README](../../devcalc/README.ko.md): 할 수 있는 일 전부와 강의별 이력.
- 혼자 이어 갈 아이디어: 명령줄의 `--json` 출력, 페이지의 다크/라이트 전환, 변수를 `localStorage` 에 저장, "C 리터럴로 복사" 버튼. 모두 강의의 패턴에 맞는다: 코어에 순수 함수, 테스트, 그다음 페이지.

---

[← 이전: 14. DOM 심화](../14-events-accessibility/README.ko.md) · [목차](../../README.ko.md)
