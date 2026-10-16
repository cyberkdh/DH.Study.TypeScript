**English** · [한국어](README.ko.md)

# DH.Study.TypeScript

Learn TypeScript step by step, and finish by building a **developer calculator (DevCalc)** yourself.

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/cyberkdh/DH.Study.TypeScript?quickstart=1)

## Contents

| # | Title | What you learn | DevCalc step | Status |
|---|---|---|---|---|
| 00 | [Development Setup](lessons/00-setup/README.md) | 3 ways to run `.ts`, VS Code debugging, TS → JS | — | ✅ |
| 01 | [Basic Types and bigint](lessons/01-basic-types/README.md) | Annotation & inference, limits of `number`, `bigint`, `any`/`unknown` | Lv1 radix conversion (ToHex/ToBin/ToDec) | ✅ |
| 02 | [Functions and Objects](lessons/02-functions-objects/README.md) | Function types, `interface`/`type` | Digit grouping, output options | ✅ |
| 03 | [Unions and Narrowing](lessons/03-unions-narrowing/README.md) | Union types, narrowing, discriminated unions | Lv2 input parsing `0x`/`0b`/`1_000` | ✅ |
| 04 | [Classes and Errors](lessons/04-classes-errors/README.md) | Classes, exceptions | Lv3 word size, two-operand math | ✅ |
| 05 | [Generics](lessons/05-generics/README.md) | Generics | `TResult<T, E>`, history | ✅ |
| 06 | [Modules and Async](lessons/06-modules-async/README.md) | Modules, `async`/`await` | Split core, clipboard, REPL | ✅ |
| 07 | [Browser and DOM](lessons/07-browser-dom/README.md) | DOM, events, forms | Lv4 web page | ✅ |
| 08 | [Advanced Types](lessons/08-advanced-types/README.md) | Utility, mapped, conditional, template literal types | Typed operator table | ✅ |
| 09 | [Testing and Tooling](lessons/09-testing-tooling/README.md) | node:test, mocks, Vitest, lint without ESLint | Vitest, naming-rule check | ✅ |
| 10 | [(Challenge) Lexer and Parser](lessons/10-lexer-parser/README.md) | Recursion, recursive types, lexer, parser | Lv5 expression evaluation | ✅ |
| **Part 2** | | | | |
| 11 | [Regular Expressions and Literal Types](lessons/11-regex-literal-types/README.md) | Regex (groups, flags, lookaround), literal and template literal types | Lv6 `1Fh` `1'000` `4K` `'A'`, `~` `**` `>>>` | ✅ |
| 12 | [bigint and Fixed-Size Words](lessons/12-bigint-words/README.md) | bigint in depth, `asIntN`/`asUintN`, two's complement, byte order, annotation vs `as` vs `satisfies` | Lv7 OCT and CHAR rows (`--all`), 128-bit, one output table | ✅ |
| 13 | [Function Tables and Scope](lessons/13-functions-scope/README.md) | Overloads, a typed function table, `Map` vs object, block scope, TDZ, closures | Lv8 built-in functions (`popcount` `rol` `bswap` …), variables (`mask = 0xFF00`) | ✅ |
| 14 | [DOM in Depth](lessons/14-events-accessibility/README.md) | Capture and bubble, delegation with `closest()`, `key` vs `code`, IME, roving tabindex, `aria-*` | Lv9 clickable bit grid, live preview, history keys, help panel | ✅ |
| 15 | [Bundling and Build](lessons/15-bundling-release/README.md) | Module waves and `file://`, esbuild (CLI and API), tree shaking, minify, `satisfies BuildOptions`, `define` + `declare const`, inlining traps (`$&`, `</script>`) | Lv10 one HTML file (`npm run build:single`), opens with a double-click | ✅ |
| **Part 3** | | | | |
| 16 | [Trees and Recursion](lessons/16-trees-steps/README.md) | Drawing and walking a tree (pre/in/post-order), a stack for post-order, immutable rewriting and structural sharing, `readonly` vs `Object.freeze`, `never` checks, listener callbacks, `Map` keyed by objects | Lv11 calculation steps (`--steps`, web Steps panel) | ✅ |
| 17 | [Drawing a Tree](lessons/17-tree-view/README.md) | Layout before drawing (leaf slots, a parent in the middle), SVG as text (`viewBox`, `line`, `rect`, `text`, `g`), escaping with `&` first, `createElementNS` and `SVGElementTagNameMap`, `role="img"` + `<title>`, `aria-current` | Lv12 tree view (`--tree`, web Tree panel that follows the picked step) | ✅ |

## How to study

1. **Set up** — pick one
   - Your PC: `git clone` → `npm install` ([Lesson 00, section 1](lessons/00-setup/README.md#1-prerequisites))
   - No install: click **Open in GitHub Codespaces** above → VS Code opens in your browser
2. Open the lessons **in the order above**. Every lesson has the same layout:
   - **Goals** → **Contents** → body → **Try it** (run the examples) → **DevCalc step** → **Summary** → link to the next lesson
3. Example files sit **right next to** the lesson text. Open one and press `F5` to run and debug it.
   - If you can't run code, read along with the **output** shown in the lesson.
4. Use the `← Previous · Contents · Next →` links at the top and bottom of each lesson.
5. Each lesson's finished code is tagged in git: `git checkout lesson-01`

> On the GitHub website you can **read** the code but not **run** it. Run it on your PC or in Codespaces.
> From lesson 07, DevCalc also has a web page: run `npm run web` and open <http://127.0.0.1:5173/devcalc/web/>.
> Or try it without installing anything: <https://cyberkdh.github.io/DH.Study.TypeScript/devcalc/web/> (GitHub Pages, rebuilt on every push to `main`).

> Every lesson has an English version (`README.md`, default) and a Korean version (`README.ko.md`). The examples come in pairs too: `x.ts` (English comments) and `x.ko.ts` (Korean comments). The code is the same, only the comments differ, and `npm test` checks that the code of each pair matches. Program output is in English.

## Purpose

**To build tools that run on the web, in the way that feels most familiar to a C# developer.**

- The only language that runs natively in the browser is JavaScript, so the real choice is "JS or TS".
- TypeScript = JavaScript + static types. It catches mistakes before the code runs.
  - Example: `1n + 1` throws a `TypeError` at runtime in JS, but in TS you get a red squiggle the moment you type it.
- TypeScript was designed by Anders Hejlsberg, who also designed C#, so its syntax, tooling and way of thinking feel familiar.
- Division of roles: C#/WPF for Windows desktop, TypeScript for web, cross-platform and install-free tools.
- The material will also become a blog series. Each lesson README is a blog post.

## Goals

| Area | Goal |
|---|---|
| Final result | Finish **DevCalc**: a developer calculator (one input → HEX/DEC/BIN at once, runs in the browser) |
| Language | Read and write TypeScript, from basic types to generics and advanced types |
| Tooling | Set up and use VS Code debugging, `tsc` builds, testing (node:test → Vitest) and ESLint |
| Habit | Run every example yourself and inspect values in the debugger (F5) |
| Record | Leave a README per lesson that can be moved to a blog |

### DevCalc milestones

Building a parser from scratch is hard for a beginner, so we build **a small working calculator at every stage** and leave the hardest part as an optional challenge.

| Stage | Result | Lessons |
|---|---|---|
| Lv1 Radix converter | One number → HEX/DEC/BIN | 01–02 |
| Lv2 Input formats | Parse `0xFF`, `0b1010`, `1_000` | 03 |
| Lv3 Two-operand math | `0xFF & 0x0F`, word size, error handling | 04–06 |
| Lv4 Web UI | Input and results in the browser | 07–09 |
| Lv5 (optional) Expressions | `(3 + 2) * 10` — lexer + parser | 10 |
| Lv6 Programmer literals and operators | `1Fh`, `1'000`, `4K`, `'A'`, `~0 >>> 4`, `2 ** 10` | 11 |
| Lv7 Every output format | HEX DEC BIN INT OCT CHAR, 128-bit words | 12 |
| Lv8 Functions and variables | `popcount(x)`, `rol(x, n)`, `mask = 0xFF00; 0x1234 & mask` | 13 |
| Lv9 Bit grid and keyboard | Click a bit to flip it, preview while typing, ArrowUp for history, no mouse needed | 14 |
| Lv10 One file | `dist/web/DevCalc.html` : the whole page in one file, no server, works from a USB stick | 15 |
| Lv11 Calculation steps | `10 + 30 * (100 + 2) / 10 + 20` → `10 + 30 * 102 / 10 + 20` → … → `336`, the next part highlighted | 16 |
| Lv12 Tree view | The expression drawn as an SVG tree; pick a step and the finished parts show their values | 17 |

> Even stopping at Lv3 gives you a genuinely useful radix calculator.

## Commands

```bash
npm install                                # once
node lessons/00-setup/hello.ts             # run an example (same for every lesson)
npm run typecheck                          # type check
npm run build                              # build to dist/
npm run devcalc -- 255                     # run DevCalc
npm test                                   # check-pairs, check-names, DevCalc tests (Vitest)
npm run js -- lessons/00-setup/hello.ts    # Show the generated JS, then run it
```

On Windows (cmd / PowerShell), two bat files in `projectroot` do the same without typing `node` or `npm`:

```bat
runts.bat lessons\00-setup\hello.ts        # run a .ts directly (node type stripping)
ts2js.bat lessons\00-setup\enum-sample.ts  # same as npm run js: build, show the JS, run it
```

## Repository layout

```
├─ lessons/
│  └─ NN-topic/
│     ├─ README.md      lesson (English, default)
│     ├─ README.ko.md   lesson (Korean)
│     ├─ x.ts           examples, English comments
│     └─ x.ko.ts        the same examples, Korean comments
├─ devcalc/             the final app (grows every lesson)
├─ tools/               helper scripts (show-js.ts: see TS → JS, check-pairs.ts: x.ts = x.ko.ts)
├─ runts.bat            run a .ts directly (Windows)
├─ ts2js.bat            show TS → JS, then run (Windows)
└─ .devcontainer/       Codespaces environment
```

## Naming convention

This repository uses **Hungarian notation**.

| Prefix | Meaning | Example |
|---|---|---|
| `C` | class | `CCalculator` |
| `I` | interface | `IPerson` |
| `E` | string-union type | `EBase = "HEX" \| "DEC"` |
| `T` | other type alias | `TResult` |
| `m_` / `g_` | member / global | `m_nValue`, `g_oApp` |
| `n` `bi` `str` `b` | number, bigint, string, boolean | `nAge`, `biValue`, `strName`, `bOk` |
| `arr` `map` `set` `re` `fn` | array, Map, Set, RegExp, function | `arrPeople`, `fnCallback` |
| `el` / `o` | DOM element / other object | `elInput`, `oPerson` |
| `v` | `any` / `unknown` (variant) | `vInput` |

- Functions and methods use PascalCase (`Greet`); constants use UPPER_CASE (`MAX_BITS`).
- External APIs (DOM, Node) keep their original camelCase names.
