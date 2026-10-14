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
| 03 | Unions and Narrowing | Union types, narrowing | Lv2 input parsing `0x`/`0b`/`1_000` | Coming soon |
| 04 | Classes and Errors | Classes, exceptions | Lv3 word size, two-operand math | Coming soon |
| 05 | Generics | Generics | `TResult<T, E>`, history | Coming soon |
| 06 | Modules and Async | Modules, `async`/`await` | Split core, clipboard | Coming soon |
| 07 | Browser and DOM | DOM, events | Lv4 web UI | Coming soon |
| 08 | Advanced Types | Utility, mapped, conditional types | Type-safe function table | Coming soon |
| 09 | Testing and Tooling | Vitest, ESLint | Tests, naming-rule linting | Coming soon |
| 10 | (Challenge) Lexer and Parser | Recursion, discriminated unions | Lv5 expression evaluation | Coming soon |

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
> DevCalc gets a web UI in lesson 07, so you can then try it in the browser.

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

> Even stopping at Lv3 gives you a genuinely useful radix calculator.

## Commands

```bash
npm install                                # once
node lessons/00-setup/hello.ts             # run an example (same for every lesson)
npm run typecheck                          # type check
npm run build                              # build to dist/
npm run devcalc -- 255                     # run DevCalc
npm test                                   # DevCalc tests
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
