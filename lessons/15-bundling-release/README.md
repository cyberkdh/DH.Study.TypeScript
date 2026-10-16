**English** · [한국어](README.ko.md)

[← Previous: 14. DOM in Depth](../14-events-accessibility/README.md) · [Contents](../../README.md)

# 15. Bundling and Build — One HTML File with esbuild

> Series: DH.Study.TypeScript · Lesson 15 (Part 2, last lesson)
> Environment: Node.js v24 · TypeScript 7 · Vitest 5 · esbuild 0.28 · VS Code · a browser

## Goals

After this lesson you can:

- [ ] Explain why a page made of 15 module files is slow to start and does not open from `file://`
- [ ] Bundle a TypeScript entry file with esbuild, from the command line and from a script
- [ ] Say what esbuild does (erase types, follow imports, tree shake, minify) and what it does not (check types)
- [ ] Type an options object with `satisfies BuildOptions`, and declare a build-time constant with `declare const`
- [ ] Put CSS and JS inside one HTML file without the two traps: `$&` in `replace()` and `</script>` in a string
- [ ] Build DevCalc as one file that opens with a double-click: `npm run build:single`

## Contents

1. [Why bundle](#1-why-bundle)
2. [esbuild](#2-esbuild)
3. [What a bundler does to your code](#3-what-a-bundler-does-to-your-code)
4. [One HTML file](#4-one-html-file)
5. [Try it](#5-try-it)
6. [Build it — the bit grid as one file](#6-build-it--the-bit-grid-as-one-file)
7. [DevCalc step — Lv10 one file](#7-devcalc-step--lv10-one-file)
8. [Summary](#summary)
9. [Where next](#where-next)

Example files for this lesson: [modules.ts](modules.ts) · [esbuild.ts](esbuild.ts) · [inline.ts](inline.ts) · [single.ts](single.ts)

> Each example has a Korean-comment twin (`x.ko.ts`) with the same code. The Korean lesson ([README.ko.md](README.ko.md)) uses those.

> Syntax tags: **[JS]** = JavaScript syntax (exists without TS) · **[TS]** = type syntax that TypeScript adds (erase it and you get JS) · details in [lesson 00, 7-3](../00-setup/README.md#7-3-ts-syntax--js-syntax--type-syntax)

DevCalc's web page works, but only behind a web server: `npm run web` while you develop, GitHub Pages once it is published. Copy `dist/web` to a USB stick and double-click `index.html`, and you get an empty page. This lesson turns the page into **one file** that opens anywhere:

```
> npm run build:web && npm run build:single
…
[4] checks ok · 29.7 KB · one file · built 2026-10-16 · esbuild 0.28.2
Done : dist/web/DevCalc.html (double-click it : no server needed)
```

The examples run with `node`, like lessons 00–13. Only the results (`dist/single/bitgrid.html`, `dist/web/DevCalc.html`) open in the browser.

---

## 1. Why bundle

### 1-1. The browser finds imports one wave at a time

`<script type="module" src="./App.ts">` asks for one file. Only after reading it does the browser see `import … from "../src/core/index.ts"`, ask for that, read it, and find 12 more imports. [modules.ts](modules.ts) walks DevCalc the same way:

```
1) the browser loads App.ts, reads it, and only then asks for what it imports
   wave 1 : web/App.ts
   wave 2 : src/core/index.ts, web/BitGrid.ts
   wave 3 : src/core/Format.ts, src/core/Parse.ts, src/core/Literal.ts, … (12 files)
2) 15 files, 75.4 KB, 3 waves : at 100 ms a round trip, 300 ms before App.ts can run
```

On your own machine a round trip takes 1 ms and you never notice. On a phone far from the server, every wave costs a full round trip before the code can start.

### 1-2. `file://` does not load modules

Browsers treat each `file://` page as its own origin, and module scripts follow the same rules as `fetch()`: no loading other files. That is why the double-clicked `index.html` is empty, and why lesson 07 needed a server (DevTools: `Access to script at '…/App.js' from origin 'null' has been blocked by CORS policy`).

### 1-3. A bundler: many files in, one file out

A **bundler** reads the entry file, follows every import at build time, and writes all the code into one file, each module after the modules it imports:

```
3) a bundler writes them into one file in this order (each one after what it imports) :
   Format.ts → Parse.ts → Literal.ts → WordSize.ts → Output.ts → Calculator.ts → Result.ts → History.ts → Lexer.ts → Functions.ts → Parser.ts → Evaluate.ts → index.ts → BitGrid.ts → App.ts
```

The `import` lines disappear: the names are already in the same file. One request, no waves, and nothing left to load from `file://`.

### 1-4. Bare names are packages

`import "./x.ts"` is a path. `import "x"` (no `./`, no `/`) is a **bare specifier**: a package name. Node looks for it in `node_modules`; a browser has nowhere to look:

```
4) Expected error: Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'devcalc'
   Why : "devcalc/src/core/index.ts" has no ./ in front, so it is read as a package name, not a path. A browser says "Failed to resolve module specifier".
   Fix : write a relative path ("./" or "../"), or let a bundler resolve the names at build time.
```

This is the other reason bundlers exist: `import { build } from "esbuild"` works in a Node script, and a bundler can turn the same line into code a browser can run.

---

## 2. esbuild

### 2-1. Install and try the command line

esbuild is a bundler written in Go: one small binary, no plugins needed for TypeScript. It is a development dependency, like `typescript` and `vitest`:

```
> npm install --save-dev esbuild
> npx esbuild devcalc/web/App.ts --bundle --format=esm --minify --outfile=dist/esb-test/app.js

  dist\esb-test\app.js  23.8kb

Done in 3ms
```

`--bundle` follows the imports (without it, esbuild converts one file only). 3 ms for 15 files.

### 2-2. The same thing from a script

The command line is fine for one call. A build that also copies and checks files is easier as a script, and the options are a typed object ([esbuild.ts](esbuild.ts)):

```ts
import { build, transform, type BuildOptions } from "esbuild";

const BASE_OPTIONS = {
	entryPoints: [resolve(ROOT_DIR, "devcalc/web/App.ts")],
	bundle: true,
	write: false,      // keep the output in memory : oResult.outputFiles[0].text
	format: "esm",
	metafile: true,    // also report which files went in
	logLevel: "silent",
} satisfies BuildOptions;

const oPlain = await build(BASE_OPTIONS);
```

### 2-3. [TS] Why `satisfies`

Without a type, TypeScript widens `format: "esm"` in an object to `format: string` — the object could change later. `build()` wants `"iife" | "cjs" | "esm"`:

```ts
const oLoose = { format: "esm" };
await build(oLoose);
// TS2345: Argument of type '{ format: string; }' is not assignable … Type 'string' is not assignable to type 'Format | undefined'.
```

`satisfies BuildOptions` (lesson 12) checks the object against `BuildOptions` **and keeps the literal types**. A typo like `formt: "esm"` or `format: "es"` is now an error where you wrote it, and `{ ...BASE_OPTIONS, minify: true }` still has `format: "esm"`.

### 2-4. esbuild erases types, it does not check them

```
1) transform : "const nBits = \"8\";\nconsole.log(nBits);\n"
   no error : esbuild only erases types, so run tsc --noEmit before you bundle
```

`const nBits: number = "8"` is a type error, and esbuild builds it anyway. That is why esbuild is fast — and why every build in this project runs `tsc --noEmit` first. The work is split: **tsc checks, esbuild builds.**

---

## 3. What a bundler does to your code

### 3-1. Tree shaking

`devcalc/src/core/index.ts` exports every core function. `App.ts` does not use all of them, and esbuild follows the names, not just the files:

```
3) FunctionHelp kept
3) ParseInteger kept
3) OutputHelp   dropped (App.ts never uses it)
3) ToBin        dropped (App.ts never uses it)
```

`OutputHelp` is the CLI's `--help` text; the page never shows it. This is safe because the core files only define things at the top level — no code runs on import — so removing an unused function changes nothing else.

### 3-2. Minify

```
4) minify : 44.3 KB → 23.6 KB (53%)
   starts : var Ue={nRadix:16,strPrefix:"0x"…
```

Local names become one or two letters, spaces and comments go. Property names (`nRadix`, `strPrefix`) stay: other code may read them by name. The behaviour is the same — section 7 checks the minified DevCalc with the same headless test as lesson 14.

### 3-3. Format: `esm` or `iife`

```
5) esm  starts : var Ue={nRadix:16,st…
   iife starts : "use strict";(()=>{v…
```

| Format | Load with | Notes |
|---|---|---|
| `esm` | `<script type="module">` | strict mode and `defer` for free; `import` / `export` allowed |
| `iife` | `<script>` | wrapped in `(() => { … })()` so the names stay private |

DevCalc keeps `esm`: `App.ts` uses top-level code that expects the page to be parsed (`defer`), which `type="module"` gives.

### 3-4. [TS] `define` and `declare const`: a value from the build

`define` replaces a name with a value at build time. TypeScript does not know the name exists, so tell it with `declare` — a **[TS]** line that produces no JS at all:

```ts
declare const __BUILD__: string;
console.log(typeof __BUILD__ === "string" ? __BUILD__ : "dev");
```

```
6) define : "console.log(\"2026-10-15\");" ← the check and the dev branch are gone
```

With `minify`, esbuild sees `typeof "2026-10-15" === "string"` is always true and removes the rest. Without the build, `typeof` of a name that does not exist is `"undefined"` (not a `ReferenceError`), so the same file still runs from `npm run web`.

### 3-5. Errors at build time

```
7) Expected error: Could not resolve "./nope.ts"
   Why : the bundler follows every import at build time, and ./nope.ts does not exist.
   Fix : correct the path. The mistake shows up at build time, not when a user opens the page.
```

A failed `build()` throws an error whose `errors` array has one object per problem (`text`, `location`). `e` is `unknown` in a `catch` (lesson 04), so the example narrows it with `as { errors?: … }` and a fallback.

---

## 4. One HTML file

The bundle is one `.js` file, plus `index.html` and `style.css`: still three files, and `<script type="module" src="./app.js">` still can't load from `file://`. Put the CSS in `<style>` and the JS in `<script>`, and the page needs nothing else. It looks like one `replace()` each. [inline.ts](inline.ts) shows the two traps.

### 4-1. Trap 1: the replacement string is a pattern

```
1) the JS line we put in : const strTag = "bits".replace(/\w+/, "<$&>");
   the line in the page  : const strTag = "bits".replace(/\w+/, "</*JS*/>");
   $& became "/*JS*/" : replace() read our code as a replacement pattern ($&, $1, $$, $` …)
```

In `strHtml.replace(strMarker, strCode)`, the second argument is a **replacement pattern**: `$&` means "what matched", `$$` means `$`. Our JS contained `$&`, so `replace()` changed our code. No error — just a wrong program. Minified code is full of `$` names (DevCalc's bundle has 115).

The fix: pass a **function**. What it returns is used as is:

```ts
return strHtml.replace(strMarker, () => strSafe);
```

### 4-2. Trap 2: `</script>` inside a string ends the script

The HTML parser does not know JavaScript. Inside `<script>`, it stops at the first `</script` — even in the middle of a string:

```
2) the browser runs only : "const strHelp = \"use <script>"
   Expected error: SyntaxError: Invalid or unexpected token
   Why : the string stops in the middle, and the rest of the file shows up on the page as text.
   Fix : write <\/script instead of </script. In a JS string \/ is just /, and the parser no longer sees an end tag.
```

```ts
const strSafe = strCode.replace(/<\/(script|style)/gi, "<\\/$1"); // </script → <\/script, </style → <\/style
```

Here the replacement *is* meant as a pattern: `$1` is `script` or `style`, as found (`gi`: any case). The same trap exists for `</style>` in CSS.

```
3) with Inline() the page has :
   const strTag = "bits".replace(/\w+/, "<$&>");
   const strHelp = "use <script><\/script> for code";
   and it runs : ["<bits>","use <script></script> for code"]
4) script tags in the page : 1 (only the real one)
```

esbuild already writes `<\/script` in the strings it outputs. `Inline()` still does it, for code that did not come from esbuild and in case a future version doesn't.

---

## 5. Try it

Run `node lessons/15-bundling-release/modules.ts` (then `esbuild.ts`, `inline.ts`). The outputs are in sections 1–4. Things to try:

- [modules.ts](modules.ts): set `WAVE_MS` to 300 (a slow mobile connection) → `900 ms before App.ts can run`.
- [esbuild.ts](esbuild.ts): uncomment the two `oLoose` lines → TS2345 (section 2-3). Then add `satisfies BuildOptions` after `{ format: "esm" }` → the error is gone.
- [esbuild.ts](esbuild.ts): in section 1, change `loader: "ts"` to `loader: "js"` → `ERROR: Expected ";" but found ":"`: as JavaScript, `: number` is a syntax error.
- [inline.ts](inline.ts): in `Inline()`, replace `() => strSafe` with `strSafe` → line 3) shows `"</*JS*/>"` again, and the result becomes `["</*JS*/>", …]`.

---

## 6. Build it — the bit grid as one file

[single.ts](single.ts) puts sections 2–4 together on lesson 14's bit grid: bundle → inline → check → write.

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

- The template is a template literal with `${JS_MARK}` in `<script type="module">` and `${CSS_MARK}` in `<style>`. The markers are comments (`/*INLINE:JS*/`), so the template is still valid HTML and CSS.
- `Inline()` throws when the marker is missing: `replace()` alone would return the page unchanged and the build would "succeed" with no script in it.
- `target: "es2022"` tells esbuild which syntax the browser understands, so nothing newer is left in the output.

### Run it

```
> node lessons/15-bundling-release/single.ts
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

Double-click `dist/single/bitgrid.html`: 16 buttons, and the same log as lesson 14 (`6) click bit  0 → 0x0001 …` to `9) Expected error: RangeError …`). No server is running.

Things to try:

- Delete `${JS_MARK}` from `TEMPLATE_HTML` → the build stops at `Error: marker /*INLINE:JS*/ not found in the template` and writes nothing.
- Remove `minify: true` → the file grows, and you can read lesson 14's code in it — without types and without comments.

---

## 7. DevCalc step — Lv10 one file

### What changed

| File | Change |
|---|---|
| `tools/build-single.ts` | new: `[1]` `tsc --noEmit -p tsconfig.web.json` → `[2]` esbuild bundle (esm, es2022, minify, `define`) → `[3]` style.css and the bundle into index.html → `[4]` checks → `dist/web/DevCalc.html` |
| `package.json` | `build:single` script; `esbuild` in devDependencies |
| `devcalc/web/App.ts` | `declare const DEVCALC_BUILD: string;` and a build line at the bottom of the page; title `Lv10` |
| `devcalc/web/index.html` | `<p id="build" class="muted">`, title `Lv10` |
| `devcalc/tests/Web.test.ts` | index.html still has the exact `<link>` and `<script>` tags that build-single.ts replaces, and only one `</script>` |
| `.github/workflows/pages.yml` | runs `npm run build:single` after `build:web` |
| `tools/README.md` | `build-single.ts` section |

The core did not change, and neither did the rest of the page.

### `build-single.ts`

Instead of markers, it replaces the two tags index.html already has, so the page still works with `npm run web`:

```ts
const STR_STYLE_LINK = '<link rel="stylesheet" href="./style.css" />';
const STR_SCRIPT_TAG = '<script type="module" src="./App.ts"></script>';

const strStyled = Inline(strHtml, STR_STYLE_LINK, "<style>", "</style>", strCss);
const strPage = Inline(strStyled, STR_SCRIPT_TAG, '<script type="module">', "</script>", strJs);
```

If someone edits one of those tags, the build fails with `devcalc/web/index.html has no …`, and the new test in `Web.test.ts` fails even earlier, in `npm test`.

The build label comes from `define`:

```ts
// tools/build-single.ts
define: { DEVCALC_BUILD: JSON.stringify(STR_BUILD) },  // "one file · built 2026-10-16 · esbuild 0.28.2"

// devcalc/web/App.ts
declare const DEVCALC_BUILD: string;
elBuild.textContent = typeof DEVCALC_BUILD === "string" ? DEVCALC_BUILD : "modules (not bundled) · npm run build:single makes one file";
```

The name is `DEVCALC_BUILD`, not `__DEVCALC_BUILD__`: `npm run names` (lesson 09) accepts UPPER_CASE, but not a leading `_`.

### Run it

```
> npm run build:web && npm run build:single
[1] tsc --noEmit -p tsconfig.web.json
[2] esbuild devcalc/web/App.ts  →  one module
    15 files → 23.7 KB
[3] index.html + style.css + module  →  dist/web/DevCalc.html
[4] checks ok · 29.7 KB · one file · built 2026-10-16 · esbuild 0.28.2
Done : dist/web/DevCalc.html (double-click it : no server needed)
```

`build:web` empties `dist/web` first, so `build:single` runs after it. On GitHub Pages the file is at `https://cyberkdh.github.io/DH.Study.TypeScript/DevCalc.html`, next to the module version.

### Checked

`DevCalc.html` was opened from `file://` in a headless browser and driven with the same scripts as lessons 12–14:

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

No console errors. Through `npm run web` the bottom line says `modules (not bundled) · npm run build:single makes one file`. The history is kept in `localStorage`, which a `file://` page also has.

```
> npm test
check-pairs : 70 pairs, 0 failed
check-names : 36 files, 0 problems

 Test Files  12 passed (12)
      Tests  79 passed (79)
```

Things to try:

- Copy `dist/web/DevCalc.html` anywhere (desktop, USB stick) and double-click it.
- In `index.html`, change `href="./style.css" />` to `href="./style.css">` → `npm test` fails, and `npm run build:single` stops with `devcalc/web/index.html has no <link rel="stylesheet" href="./style.css" />`.
- At the end of `devcalc/web/App.ts`, add `const nBits: number = "8";` → the build stops at step [1] with TS2322, before esbuild runs (remove it again afterwards).

---

## Summary

- **[JS]** A module page loads its imports in waves, one round trip each, and does not load at all from `file://`. A bare name (`"esbuild"`) is a package, which only a bundler or Node can find.
- **[JS]** esbuild follows imports, writes one file, drops unused functions (tree shaking) and shortens names (minify). It **does not check types**: run `tsc --noEmit` first.
- **[TS]** `satisfies BuildOptions` checks the options and keeps `"esm"` a literal. `declare const NAME: string` tells TypeScript about a value `define` will supply; `typeof NAME` is safe when it doesn't.
- **[JS]** Inlining: pass a function to `replace()` so `$&` stays code, and write `<\/script` so a string can't end the tag. Check the result before writing it.
- DevCalc Lv10: `npm run build:single` → `dist/web/DevCalc.html`, one 30 KB file that runs from a double-click, a USB stick or GitHub Pages.

## Where next

This is the last lesson. DevCalc went from `ToHex(255)` (lesson 01) to a calculator with expressions, 128-bit words, functions, variables, a bit grid and a one-file build — with the same core in the terminal and in the browser.

- [DevCalc README](../../devcalc/README.md): everything it can do, and the history by lesson.
- Ideas to continue on your own: a `--json` output for the CLI, a dark/light switch on the page, saving variables in `localStorage`, a "copy as C literal" button. Each one fits in a lesson's pattern: a pure function in the core, a test, then the page.

---

[← Previous: 14. DOM in Depth](../14-events-accessibility/README.md) · [Contents](../../README.md)
