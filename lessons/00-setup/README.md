**English** · [한국어](README.ko.md)

[Contents](../../README.md) · [Next: 01. Basic Types and bigint →](../01-basic-types/README.md)

# 00. Development Setup — Running and Debugging TypeScript in VS Code

> Series: DH.Study.TypeScript · Lesson 00
> Environment: Windows · Node.js v24.15.0 · TypeScript 7.0.2 · VS Code

## Goals

After this lesson you can:

- [ ] Run a `.ts` file in three ways (Node directly, after a build, tsx) and explain the differences
- [ ] Set a breakpoint with F5 in VS Code and inspect variables and the call stack
- [ ] Debug from the command line with `--inspect-brk`
- [ ] See for yourself what disappears when TS becomes JS (type erasure)
- [ ] Explain the order in which a file runs without `main()`

> For the purpose of the whole series and the final goal (DevCalc), see the [root README](../../README.md#purpose).

## Contents

1. [Prerequisites](#1-prerequisites) — your PC or the browser (Codespaces)
2. [Project layout](#2-project-layout)
3. [Key tsconfig.json options](#3-key-tsconfigjson-options)
4. [Three ways to run a .ts file](#4-three-ways-to-run-a-ts-file)
5. [Debugging in VS Code](#5-debugging-in-vs-code)
6. [Running and debugging from the command line](#6-running-and-debugging-from-the-command-line)
7. [What TS looks like after compiling to JS](#7-what-ts-looks-like-after-compiling-to-js) — TS syntax = JS syntax + type syntax ([7-3](#7-3-ts-syntax--js-syntax--type-syntax))
8. [How JS runs — there is no main](#8-how-js-runs--there-is-no-main)
9. [Summary](#summary)
- Appendix: [A. Adding Node.js to PATH](#appendix-a-adding-nodejs-to-path) · [B. Setting the Node path in VS Code only](#appendix-b-setting-the-node-path-in-vs-code-only) · [C. VS Code settings in this repo](#appendix-c-vs-code-settings-in-this-repo)

Example files for this lesson: [hello.ts](hello.ts) · [greeter.ts](greeter.ts) · [enum-sample.ts](enum-sample.ts) · [run-order.ts](run-order.ts) · [run-order-lib.ts](run-order-lib.ts)

> Every example runs with `node file.ts` **to the end without errors**. When an error is part of the lesson, the example catches it and prints **why** it happened (`Expected error:` / `Why :`).

---

## 1. Prerequisites

### Option A. Install on your PC

| Tool | Version | Notes |
|---|---|---|
| Node.js | 24.x | Check with `node -v`. It must be on PATH for the VS Code debugger to find it |
| VS Code | latest | Ships with the TypeScript language service |

```bash
git clone https://github.com/cyberkdh/DH.Study.TypeScript.git
cd DH.Study.TypeScript
npm install
```

Dev tools listed in `package.json`:

- `typescript` : the `tsc` compiler. From 7.x it is a native version rewritten in Go, so builds are very fast.
- `tsx` : a runner that executes TypeScript directly.
- `@types/node` : type definitions for Node.js APIs such as `process` and `fs`.

### Option B. No install — in the browser (GitHub Codespaces)

The GitHub website lets you **read** code but not **run** it. With Codespaces, VS Code opens inside your browser with Node.js 24 ready, so you can run and debug right away.

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/cyberkdh/DH.Study.TypeScript?quickstart=1)

1. Click the button above (GitHub sign-in required) → VS Code opens in the browser after 1–2 minutes
2. `npm install` runs automatically (configured in `.devcontainer/devcontainer.json`)
3. In the terminal run `node lessons/00-setup/hello.ts`, or open a file and press `F5`

> Personal accounts get a monthly free quota. When you're done, stop or delete the codespace at [github.com/codespaces](https://github.com/codespaces).

## 2. Project layout

```
projectroot/
├─ .vscode/
│  ├─ launch.json      ← debug configurations
│  ├─ tasks.json       ← tsc build tasks
│  └─ settings.json    ← use the project's TypeScript version
├─ .devcontainer/      ← Codespaces environment
├─ lessons/
│  ├─ 00-setup/
│  │  ├─ README.md     ← this lesson (English, default)
│  │  ├─ README.ko.md  ← Korean version
│  │  ├─ hello.ts      ← examples sit right next to the lesson text (English comments)
│  │  ├─ hello.ko.ts   ← same code, Korean comments
│  │  ├─ greeter.ts / greeter.ko.ts
│  │  ├─ enum-sample.ts / enum-sample.ko.ts
│  │  ├─ run-order.ts / run-order.ko.ts
│  │  └─ run-order-lib.ts / run-order-lib.ko.ts
│  └─ 01-basic-types/
├─ devcalc/            ← the final app, growing every lesson (from lesson 01)
├─ package.json
└─ tsconfig.json
```

> **Naming**: this repo uses Hungarian notation. In the examples: `IPerson` (interface), `strName` (string), `nAge` (number), `oPerson` (object), `arrPeople` (array), `Greet` (functions are PascalCase). Full table in the [root README](../../README.md#naming-convention).

## 3. Key tsconfig.json options

| Option | Value | Meaning |
|---|---|---|
| `module` / `moduleResolution` | `nodenext` | Follow Node.js ES module (ESM) rules exactly |
| `strict` | `true` | Strict type checking. Always on while learning |
| `noUncheckedIndexedAccess` | `true` | `arr[0]` has type `T \| undefined` → safer habits |
| `rewriteRelativeImportExtensions` | `true` | Rewrites `import "./a.ts"` to `./a.js` when building |
| `verbatimModuleSyntax` | `true` | Forces `import type` for type-only imports |
| `erasableSyntaxOnly` | `true` | Allows only syntax that runs by erasing types → no `enum` / `namespace` (red squiggle). Every `.ts` here runs with `node` |
| `sourceMap` | `true` | Maps built JS back to the original TS → needed for debugging |

> From a C# developer's view: `tsconfig.json` ≈ `.csproj`, `tsc` ≈ `csc`/`dotnet build`, `strict` ≈ enabling nullable reference types.

## 4. Three ways to run a .ts file

| Method | Command | Build | enum / namespace | Notes |
|---|---|---|---|---|
| ① Node directly | `node hello.ts` | No | ❌ | Type stripping in Node 22.18+/24. Type parts are replaced with whitespace |
| ② Build with tsc, then run | `npm run build` → `node dist/.../hello.js` | Yes | ✅ | How you ship. Also type-checks |
| ③ tsx | `node --import tsx hello.ts` | No | ✅ | Transforms with esbuild internally. Supports all syntax |

Running [hello.ts](hello.ts) with ①:

```
> node lessons/00-setup/hello.ts
Hello, Hong Gildong (age 30)
Hello, TypeScript (age 14)
Node.js v24.15.0
```

[greeter.ts](greeter.ts) only defines `Greet()`. Run by itself, it tells you where to look:

```
> node lessons/00-setup/greeter.ts
greeter.ts only defines Greet(); it is used by hello.ts.
Run: node lessons/00-setup/hello.ts
```

`enum` is the one thing to watch out for. An `enum` is not just a type; it **generates a runtime object (JavaScript code)**. Method ①, which only *erases* things, can't run it:

```
SyntaxError [ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX]: TypeScript enum is not supported in strip-only mode
```

So this repo **doesn't use `enum` at all**. `erasableSyntaxOnly` in tsconfig.json flags an `enum` with a red squiggle as soon as you type it. [enum-sample.ts](enum-sample.ts) shows the replacement: a plain object + `as const` + a union type. It runs the same with ①, ② and ③:

```ts
const COLOR = { Red: "RED", Green: "GREEN" } as const;
type EColor = (typeof COLOR)[keyof typeof COLOR]; // "RED" | "GREEN"
```

```
> node lessons/00-setup/enum-sample.ts
RED GREEN
color = GREEN
color = RED
```

> The same pattern becomes DevCalc's `EBase = "HEX" | "DEC" | "BIN"` later.

> ⚠️ ① and ③ **do not type-check**. Find type errors through the red squiggles in the editor or with `npm run typecheck`.

## 5. Debugging in VS Code

### launch.json configurations

| Configuration | What it does |
|---|---|
| ① Current TS file (Node directly) | Runs the open `.ts` file directly. Fastest |
| ② Current TS file (tsc build, then run) | Builds via `preLaunchTask` → runs the JS in `dist`, breakpoints mapped to TS via source maps |
| ③ Current TS file (tsx) | Supports all TS syntax |
| ④ Attach to running Node (Attach :9229) | Attaches to a process started with `--inspect-brk` → [6-2](#6-2-debugging-from-the-command-line-attach) |
| ⑤ Current TS file (show generated JS, then run) | Prints the JS that tsc made, then runs it → [7-1](#7-1-see-the-generated-js-then-run-it--npm-run-js) |

### Try it

1. In VS Code, **open the `projectroot` folder** (`.vscode` must be at the root to be picked up).
2. Click in the left margin of the `return strMessage;` line in `lessons/00-setup/greeter.ts` → a red dot (breakpoint).
3. Open `lessons/00-setup/hello.ts`, press `Ctrl+Shift+D` → choose a configuration → `F5`.
4. While paused, check:
   - **Variables** panel: the values of `oPerson` and `strMessage`
   - **Call Stack**: `hello.ts` → `Greet`
   - **Debug Console**: type an expression such as `oPerson.strName.length`

| Key | Action |
|---|---|
| F5 | Start / Continue |
| F10 | Step Over |
| F11 | Step Into |
| Shift+F11 | Step Out |
| Shift+F5 | Stop |

> Same shortcuts as Visual Studio 2022/2026.

### Troubleshooting

**`Variable ${file} can not be resolved. Please open an editor.`**

- Cause: `"program": "${file}"` means **the file currently open in the editor**. If no file is open, it has no value.
- Fix: open the `.ts` file you want to run (e.g. `lessons/00-setup/hello.ts`) and press F5 **with that tab focused**.
- Unlike Visual Studio's "Startup Project", this runs "the file you are looking at", which suits a learning repo with many example files.

**`Can't find Node.js binary "node"` / `node` not recognized in the terminal**

- Cause: the Node.js folder is not on PATH (common when Node was installed from a zip).
- Fix: add the Node.js folder to the user `Path` variable → **fully quit and restart VS Code** (running programs don't see the new PATH). See [Appendix A](#appendix-a-adding-nodejs-to-path).
- Note: closing a single window is not enough. One main VS Code process manages all windows, so **close every window with `File > Exit`** so that `Code.exe` exits completely and reads the new PATH.

```powershell
node -v   # v24.x means OK
```

- If you can't quit VS Code → set it in VS Code settings as in [Appendix B](#appendix-b-setting-the-node-path-in-vs-code-only).

## 6. Running and debugging from the command line

Everything also works from cmd / PowerShell without VS Code. Paths below are relative to `projectroot`.

### 6-1. Run / build / type-check

| Purpose | Command | Notes |
|---|---|---|
| ① Node directly | `node lessons/00-setup/hello.ts` | No build, no type check |
| ② Build, then run | `npm run build` → `node dist/lessons/00-setup/hello.js` | Creates `.js` + `.js.map` in `dist/` |
| ③ tsx | `npx tsx lessons/00-setup/hello.ts` | Transforms with esbuild |
| Re-run on save | `node --watch lessons/00-setup/hello.ts` | Node's built-in watch mode |
| Type check | `npm run typecheck` | `tsc --noEmit` — reports errors without writing files |
| Type check (watch) | `npm run typecheck:watch` | Re-checks on every save |
| Delete build output | `npm run clean` | Removes `dist/` |

> `npx` runs a tool installed in `node_modules/.bin`, so you use the project's pinned version without a global install (`npm i -g`).

### 6-2. Debugging from the command line (Attach)

1. Start in debug mode (pauses on the first line and waits for a debugger)

   ```cmd
   node --inspect-brk lessons/00-setup/hello.ts
   ```
   ```
   Debugger listening on ws://127.0.0.1:9229/...
   ```

2. Attach a debugger — either one
   - **VS Code**: choose `④ Attach to running Node (Attach :9229)` → F5
   - **Chrome / Edge**: open `chrome://inspect` (`edge://inspect` in Edge) → click `inspect` under Remote Target

| Option | Behavior |
|---|---|
| `--inspect` | Opens the debug port and runs immediately (for long-running programs like servers) |
| `--inspect-brk` | Pauses on the first line (for short scripts) |
| `--inspect-brk=9230` | Use a different port |

> Same idea as "Attach to Process" in Visual Studio.

### 6-3. Even simpler — JavaScript Debug Terminal

In the VS Code terminal panel, click `∨` next to `+` → **JavaScript Debug Terminal**.
Run things as usual, e.g. `node lessons/00-setup/hello.ts`, and **the debugger attaches automatically**. No launch.json needed.

## 7. What TS looks like after compiling to JS

TypeScript compiles to **JavaScript**, not HTML. `node file.ts` converts in memory only and leaves no file, so use the command below to **see** the JS.

### 7-1. See the generated JS, then run it — `npm run js`

`npm run js -- <file.ts>` ([tools/show-js.ts](../../tools/README.md)) does three things in a row: **[1]** build with tsc → **[2]** print the generated `.js` → **[3]** run that `.js` with node.

**From the terminal**

| Where you are | Command |
|---|---|
| `projectroot` | `npm run js -- lessons/00-setup/enum-sample.ts` |
| This lesson folder (`lessons/00-setup`) | `npm run js -- enum-sample.ts` |
| Without npm | `node tools/show-js.ts lessons/00-setup/enum-sample.ts` |
| Windows bat (`projectroot`) | `ts2js.bat lessons\00-setup\enum-sample.ts` |
| Windows bat (this lesson folder) | `..\..\ts2js.bat enum-sample.ts` |

> `--` tells npm that what follows is passed to the script. Don't leave it out.

**With F5 (VS Code)**

1. Open [enum-sample.ts](enum-sample.ts) in the editor
2. `Ctrl+Shift+D` → choose **⑤ Current TS file (show generated JS, then run)**
3. `F5` → the result appears in the terminal

**Output**

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
console.log(COLOR.Red, COLOR.Green); // RED GREEN
console.log(Describe(COLOR.Green)); // color = GREEN
console.log(Describe("RED")); // color = RED  (a plain string literal works too)
export {};
// Describe("BLUE"); // ← Uncomment: red squiggle, "BLUE" is not an EColor
----------------------------------------------------------------------

[3] node dist/lessons/00-setup/enum-sample.js
RED GREEN
color = GREEN
color = RED
```

**Compare side by side in the editor**

1. Run it once (above)
2. `Ctrl+P` → type `enum-sample.js` → open the one under `dist/`
3. `Ctrl+\` to split the editor → `.ts` on one side, `.js` on the other

Compare with [enum-sample.ts](enum-sample.ts): `as const`, the whole `type EColor = ...` line and the parameter type `: EColor` are gone. Everything else is the same code. Try `npm run js -- lessons/00-setup/hello.ts` too: `"./greeter.ts"` becomes `"./greeter.js"`.

> The `.js` is written only to `dist/`, never next to the lesson files. If you delete a `.ts`, its old `.js` stays in `dist/` → `npm run clean`.

### 7-2. What changes


| TS (`lessons/00-setup/*.ts`) | JS (`dist/lessons/00-setup/*.js`) | Change |
|---|---|---|
| `export interface IPerson { strName: string; nAge: number; }` | *(nothing)* | `interface` is type-only → removed entirely |
| `function Greet(oPerson: IPerson): string` | `function Greet(oPerson)` | Type annotations removed |
| `const arrPeople: IPerson[] = [...]` | `const arrPeople = [...]` | Type annotation removed |
| `import { Greet, type IPerson } from "./greeter.ts"` | `import { Greet } from "./greeter.js"` | Type import removed, `.ts` → `.js` |
| `const COLOR = { ... } as const;` | `const COLOR = { ... };` | Only `as const` removed |
| Header comment | kept | Comments are preserved |
| — | `//# sourceMappingURL=hello.js.map` | Source map link for debugging |

Key points:

- Most TS syntax becomes JS **just by erasing it** → which is why `node hello.ts` (type stripping) works.
- Only syntax that must **generate new JS code**, like `enum`, is the exception → method ① can't run it, so this repo doesn't use it (`erasableSyntaxOnly`).
- Types do not exist at runtime. Type checking happens only at compile/edit time.

> C# view: after compiling C#, type information remains in IL and you can use reflection. In TypeScript, types **disappear completely** (type erasure).

### 7-3. TS syntax = JS syntax + type syntax

TypeScript syntax is **all of JavaScript's syntax plus type syntax**. So more than half of what you learn as "TS syntax" is really modern JS (ES2015+) syntax.

```
┌──────────────── TypeScript ────────────────┐
│  ┌──────── JavaScript (ES2024) ────────┐   │
│  │ const / let, function, import,      │   │
│  │ 1n, destructuring, class, async ... │   │
│  └─────────────────────────────────────┘   │
│  + type syntax :  : T, interface, type ... │
└────────────────────────────────────────────┘
```

| Syntax | Kind | At runtime |
|---|---|---|
| `const` / `let`, `function`, `import` / `export`, `class` | **JS** | kept |
| `1n` (bigint), `0xff`, `1_000`, destructuring `const { a } = o` | **JS** | kept |
| no `main()`, top-level code runs, `import.meta.main` | **JS** (Node) | kept |
| `: string`, `: number[]` type annotations | **TS** | gone |
| `interface`, `type`, unions `"A" \| "B"`, `as const`, `import type` | **TS** | gone |
| `any` / `unknown` / `never`, literal types, `@ts-expect-error` | **TS** | gone |

Every lesson in this series tags each piece of syntax with **[JS]** / **[TS]**. Example code comments are tagged too, as in `// 1) [JS] ...`.

- **[JS]** = syntax that JavaScript has without TS. It runs as is in browsers and Node.
- **[TS]** = type syntax that TypeScript adds. It is used only for checking; erase it and you get JS (type erasure, 7-2).
- **[JS + TS]** = a mix of both (e.g. the function body is JS, the parameter types are TS).

## 8. How JS runs — there is no main

**[JS]**

C / C# / Java start at `main()`. JS / TS have **no entry point function**. node runs the **top-level code** of the file you give it (`node file.ts`, the entry module) from top to bottom.

| Language | Where it starts |
|---|---|
| C / C++ | `int main()` |
| C# / Java | `static void Main()` / `public static void main()` |
| Python | top-level code of the file (by convention `if __name__ == "__main__":`) |
| **JS / TS** | **top-level code of the file** |

### 8-1. Run order — [run-order.ts](run-order.ts)

```
> node lessons/00-setup/run-order.ts
[run-order-lib.ts] top-level code, import.meta.main = false
[run-order.ts] top-level code, import.meta.main = true
[run-order.ts] PrintSum() called: 1 + 2 = 3
Expected error: SyntaxError: Invalid or unexpected token
Why : 1.5n is a syntax error, so "line 1 runs?" is never printed. Parsing comes first.
Fix : bigint literals must be integers, e.g. 15n.
[run-order.ts] last line
```

1. **`import` first**: all imports are linked before any code runs → the top-level code of `run-order-lib.ts` prints first.
2. **Then top to bottom**: functions are only defined; they run **when called** (`PrintSum()`).
3. **The whole file is parsed before it runs**: with a syntax error, **not even line 1 runs**. The example parses a code string with `new Function()` so it can catch and show that error. (This is why an `enum` in the same file can't be caught with `try`/`catch`.)

### 8-2. "Was this file run directly?" — `import.meta.main`

```ts
if (import.meta.main) {
	// only when run directly with node (false when imported)
}
```

- Same role as Python's `if __name__ == "__main__":` (Node 24).
- [greeter.ts](greeter.ts) and [run-order-lib.ts](run-order-lib.ts) use it to print a note when run by themselves. Try `node lessons/00-setup/run-order-lib.ts`.
- You can write `function Main() { ... }` and call `Main();` on the last line like C#, but that is just a style, not a language rule.

### 8-3. So is it an interpreter?

**From the user's side, yes.** It runs the source directly and there is no build output like an exe. That is why it is called a script language, like Python.

**Inside the engine, it is not a pure interpreter.** node's V8 engine works like this:

```
source → parse → bytecode → run by the Ignition interpreter
                        └ code that runs often → JIT compile (Maglev / TurboFan) → machine code
```

| Language | How it runs |
|---|---|
| C / C++ | compiled to machine code in advance (AOT, ahead-of-time) → exe |
| C# / Java | compiled to bytecode (IL / bytecode) → JIT at run time |
| Python | bytecode → interpreter (CPython) |
| **JS** | **runs the source directly → bytecode interpreter + JIT** |

> Where TS fits: `tsc` is not a compiler that makes machine code. It is a **TS → JS transpiler + type checker**. `node hello.ts` strips the types and runs the result the way shown above.
## Summary

- While learning, use **① Node directly**. Every example in this repo runs that way.
- For real output (deployment), use **② a tsc build**.
- Type checking is separate from running → make `npm run typecheck` a habit.
- Debug with F5 (launch), `--inspect-brk` + Attach, or the JavaScript Debug Terminal — whichever you like.
- TS syntax = JS syntax + type syntax. Lessons tag them as **[JS]** / **[TS]**.
- TS compiles to JS, and the types disappear along the way. See it with `npm run js -- <file.ts>`.
- There is no `main()`. Imports first → then top-level code from top to bottom. Use `import.meta.main` to check if a file was run directly.

**Next → [01. Basic Types and bigint](../01-basic-types/README.md)**: learn types properly and build DevCalc's first part (radix conversion).

---

## Appendix A. Adding Node.js to PATH

If you downloaded Node.js as a zip instead of the installer (msi) and extracted it to e.g. `D:\sdks\nodejs\node-v24.15.0-win-x64`, you must add it to PATH yourself.

**Current window only** (gone when the window closes)

```cmd
:: cmd
set PATH=D:\sdks\nodejs\node-v24.15.0-win-x64;%PATH%
```
```powershell
# PowerShell
$env:Path = "D:\sdks\nodejs\node-v24.15.0-win-x64;" + $env:Path
```

**Permanently, in the user PATH** (PowerShell)

```powershell
$nodeDir  = "D:\sdks\nodejs\node-v24.15.0-win-x64"
$userPath = [Environment]::GetEnvironmentVariable("Path", "User")
if (($userPath -split ';') -notcontains $nodeDir) {
    [Environment]::SetEnvironmentVariable("Path", "$userPath;$nodeDir", "User")
}
```

Or via the GUI: `Win + R` → `sysdm.cpl` → Advanced → Environment Variables → edit the user `Path` → New.

> ⚠️ Don't use `setx PATH "...;%PATH%"`. It writes the combined system + user PATH into the user PATH and may truncate it at 1024 characters.

> After a permanent change, **restart programs that are already running** (VS Code, cmd windows, …).

## Appendix B. Setting the Node path in VS Code only

When you can't fully quit VS Code because of other work, add the following to your **user settings**; it takes effect immediately without a restart.

`Ctrl+Shift+P` → `Preferences: Open User Settings (JSON)`

```jsonc
// Node.js (D:\sdks) - use node in terminals/tasks/debugger without restarting VS Code
"terminal.integrated.env.windows": {
    "Path": "D:\\sdks\\nodejs\\node-v24.15.0-win-x64;${env:Path}"
},
"debug.javascript.defaultRuntimeExecutable": {
    "pwa-node": "D:\\sdks\\nodejs\\node-v24.15.0-win-x64\\node.exe"
}
```

| Setting | Applies to |
|---|---|
| `terminal.integrated.env.windows` | **Newly opened** integrated terminals and npm tasks (including `preLaunchTask`) |
| `debug.javascript.defaultRuntimeExecutable` | Every Node debug configuration without its own `runtimeExecutable` |

- Why **user settings** and not the repo's `.vscode/settings.json`: the Node install path differs per PC, so it must not be pushed to GitHub.
- Existing terminals are not affected; close them with the trash icon and open new ones.

## Appendix C. VS Code settings in this repo

| File | Contents |
|---|---|
| `.vscode/launch.json` | Debug configurations ①–⑤ |
| `.vscode/tasks.json` | `tsc: build`, `tsc: watch` tasks |
| `.vscode/settings.json` | `typescript.tsdk` → the editor uses the project's TypeScript (7.x) |
| `.vscode/extensions.json` | Recommended extensions: ESLint, Prettier, Pretty TypeScript Errors |
| `.devcontainer/devcontainer.json` | Codespaces: installs Node.js 24, runs `npm ci`, installs recommended extensions |

- Prompts you'll see on first open:
  - "This workspace contains a TypeScript version…" → **Allow** (use the project's TypeScript)
  - "Do you want to install the recommended extensions…" → **Install**

---

[Contents](../../README.md) · [Next: 01. Basic Types and bigint →](../01-basic-types/README.md)
