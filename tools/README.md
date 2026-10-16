**English** · [한국어](README.ko.md)

# tools

Helper scripts for studying. Not part of the lessons or DevCalc.

## show-js.ts — see how a .ts file becomes JavaScript

`node file.ts` converts TS to JS **in memory only**, so you never see the JS. `show-js.ts` shows it in three steps:

1. **[1]** build with `tsc` → the `.js` is written to `dist/`
2. **[2]** print the generated `.js`
3. **[3]** run that `.js` with node

### Run it from the terminal

| Where you are | Command |
|---|---|
| `projectroot` | `npm run js -- lessons/00-setup/hello.ts` |
| A lesson folder (e.g. `lessons/00-setup`) | `npm run js -- hello.ts` |
| Without npm | `node tools/show-js.ts lessons/00-setup/hello.ts` |
| Windows bat | `ts2js.bat lessons\00-setup\hello.ts` (in PowerShell: `.\ts2js.bat ...`) |

> `--` tells npm that what follows is passed to the script. Don't leave it out.
> With no file, it shows `lessons/00-setup/hello.ts` as an example.

### Run it with F5 (VS Code)

1. Open the `.ts` file you want to see
2. `Ctrl+Shift+D` → choose **⑤ Current TS file (show generated JS, then run)**
3. `F5` → the result appears in the terminal

### Output

```
> npm run js -- lessons/00-setup/enum-sample.ts
[1] tsc : lessons/00-setup/enum-sample.ts  →  dist/lessons/00-setup/enum-sample.js

[2] Generated JavaScript (dist/lessons/00-setup/enum-sample.js)
----------------------------------------------------------------------
const COLOR = {
    Red: "RED",
    Green: "GREEN",
};
function Describe(eColor) {
    return `color = ${eColor}`;
}
...
----------------------------------------------------------------------

[3] node dist/lessons/00-setup/enum-sample.js
RED GREEN
color = GREEN
color = RED
```

### Compare side by side in the editor

1. Run it once (above)
2. `Ctrl+P` → type `enum-sample.js` → open the one under `dist/`
3. `Ctrl+\` to split the editor → `.ts` on one side, `.js` on the other

Only the types are gone (`as const`, `type EColor = ...`, `: EColor`); the rest is the same code.

> Old `.js` files stay in `dist/` even after you delete a `.ts` → `npm run clean`.

## check-pairs.ts — keep x.ts and x.ko.ts the same

Every lesson example is a pair: `x.ts` (English comments) and `x.ko.ts` (Korean comments). The code must be the same. `check-pairs.ts` removes the comments, ignores whitespace, reads `.ko.ts` as `.ts`, and compares the two files line by line.

```bash
npm run pairs          # check only
npm test               # check-pairs, then check-names, then the DevCalc tests on Vitest (also in CI)
```

```
> npm run pairs
check-pairs : 15 pairs, 0 failed
```

If you change the code in one file only:

```
FAIL lessons\01-basic-types\bigint.ts : code differs from the .ko.ts file
  .ts    : console.log("7n / 2n =", 7n / 2n);
  .ko.ts : console.log("7n / 2n =", 7n / 3n);
check-pairs : 15 pairs, 1 failed
```

> When you edit an example, make the same code change in both files. Only the comments may differ.

## check-names.ts — check the naming rules

The repository names things by their type ([naming table](../README.md#naming-convention)). `check-names.ts` reads every `.ts` file, blanks out comments, strings and regexes, and checks each declaration: class `C`, interface `I`, string-literal union `E`, other type alias `E` or `T`, functions and methods PascalCase, variables with a type prefix (`strName`, `nIdx`, `m_`/`g_` allowed) or UPPER_CASE. Built in [lesson 09](../lessons/09-testing-tooling/README.md#6-build-it--a-naming-rule-checker).

```bash
npm run names                      # devcalc and tools (also part of npm test)
node tools/check-names.ts lessons  # any folder or .ts file
```

```
> npm run names
check-names : 24 files, 0 problems
```

A problem shows the file, the line and the rule, and the exit code is 1:

```
FAIL devcalc\web\App.ts:51 o : variable has a type prefix (strName, nIdx) or is UPPER_CASE
check-names : 23 files, 1 problems
```

> It is a regex checker, not a parser: destructured names and parameters are not checked.

## serve.ts — a local dev server for the browser lessons

Browsers can't run TypeScript. `serve.ts` serves this folder and, when a `.ts` file is asked for, erases the types with Node's own `stripTypeScriptTypes()` (the same thing `node file.ts` does) and sends JavaScript. No packages needed. Used from [lesson 07](../lessons/07-browser-dom/README.md).

```
> npm run web
Dev server running. Open in the browser:
  http://127.0.0.1:5173/lessons/07-browser-dom/      lesson 07 examples (add ?ko for Korean comments)
  http://127.0.0.1:5173/devcalc/web/                 DevCalc web
Stop : Ctrl+C
```

- Listens on `127.0.0.1` only. Refuses `..`, hidden folders (`.git`) and `node_modules` (403).
- Another port: `PORT=8080 npm run web` (bash) or `$env:PORT=8080; npm run web` (PowerShell).
- It does **not** type-check: use VS Code or `npm run typecheck`.
- `Cache-Control: no-store` : a reload always gets your latest code.

## build-web.ts — the DevCalc web page as static files

`serve.ts` needs Node running. To put the page on any static host (GitHub Pages), `build-web.ts` compiles it ahead of time:

```
> npm run build:web
[1] tsc -p tsconfig.web.json  →  dist/web/
[2] index.html, style.css  →  dist/web/devcalc/web/
[3] dist/web/index.html  →  devcalc/web/
Done : dist/web/ (open devcalc/web/index.html through any static web server)
```

- `tsconfig.web.json` compiles only `devcalc/web/App.ts` and what it imports (the core). Lessons, tests and tools are not published.
- `rewriteRelativeImportExtensions` turns `import "./x.ts"` into `"./x.js"`, and the build points `index.html` at `App.js`.
- A type error stops the build. `dist/` is not committed (`.gitignore`).
- `.github/workflows/pages.yml` runs `npm test` and this build on every push to `main`, then publishes `dist/web` to <https://cyberkdh.github.io/DH.Study.TypeScript/devcalc/web/>.
  One-time setup in the repository: **Settings → Pages → Source: GitHub Actions**.
- Module scripts that load other files do not run from `file://`: open `dist/web/` through a web server, or use `build-single.ts` below.

## build-single.ts — DevCalc as one HTML file (lesson 15)

`build-web.ts` makes 15 `.js` files that need a web server. `build-single.ts` bundles them with **esbuild** and puts the CSS and JS inside the page, so one file is all you need:

```
> npm run build:web && npm run build:single
[1] tsc --noEmit -p tsconfig.web.json
[2] esbuild devcalc/web/App.ts  →  one module
    15 files → 23.7 KB
[3] index.html + style.css + module  →  dist/web/DevCalc.html
[4] checks ok · 29.7 KB · one file · built 2026-10-16 · esbuild 0.28.2
Done : dist/web/DevCalc.html (double-click it : no server needed)
```

- Run it **after** `build:web` : `build:web` empties `dist/web` first.
- esbuild does not check types, so step [1] runs `tsc --noEmit` before it.
- The bottom line of the page shows the build (`define` replaces `DEVCALC_BUILD`). Through `npm run web` it says `modules (not bundled)`.
- `pages.yml` runs both builds, so the one-file version is also at <https://cyberkdh.github.io/DH.Study.TypeScript/DevCalc.html>.
- How it works, step by step : [lesson 15](../lessons/15-bundling-release/README.md).
