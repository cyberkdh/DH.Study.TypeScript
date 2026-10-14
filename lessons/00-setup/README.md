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

> For the purpose of the whole series and the final goal (DevCalc), see the [root README](../../README.md#purpose).

## Contents

1. [Prerequisites](#1-prerequisites) — your PC or the browser (Codespaces)
2. [Project layout](#2-project-layout)
3. [Key tsconfig.json options](#3-key-tsconfigjson-options)
4. [Three ways to run a .ts file](#4-three-ways-to-run-a-ts-file)
5. [Debugging in VS Code](#5-debugging-in-vs-code)
6. [Running and debugging from the command line](#6-running-and-debugging-from-the-command-line)
7. [What TS looks like after compiling to JS](#7-what-ts-looks-like-after-compiling-to-js)
8. [Summary](#summary)
- Appendix: [A. Adding Node.js to PATH](#appendix-a-adding-nodejs-to-path) · [B. Setting the Node path in VS Code only](#appendix-b-setting-the-node-path-in-vs-code-only) · [C. VS Code settings in this repo](#appendix-c-vs-code-settings-in-this-repo)

Example files for this lesson: [hello.ts](hello.ts) · [greeter.ts](greeter.ts) · [enum-sample.ts](enum-sample.ts)

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
│  │  ├─ hello.ts      ← examples sit right next to the lesson text
│  │  ├─ greeter.ts
│  │  └─ enum-sample.ts
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

Running [enum-sample.ts](enum-sample.ts) with ① fails:

```
SyntaxError [ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX]: TypeScript enum is not supported in strip-only mode
```

An `enum` is not just a type; it **generates a runtime object (JavaScript code)**. Method ①, which only *erases* things, can't handle it.

> ⚠️ ① and ③ **do not type-check**. Find type errors through the red squiggles in the editor or with `npm run typecheck`.

## 5. Debugging in VS Code

### launch.json configurations

| Configuration | What it does |
|---|---|
| ① Current TS file (Node directly) | Runs the open `.ts` file directly. Fastest |
| ② Current TS file (tsc build, then run) | Builds via `preLaunchTask` → runs the JS in `dist`, breakpoints mapped to TS via source maps |
| ③ Current TS file (tsx) | Supports all TS syntax |
| ④ Attach to running Node (Attach :9229) | Attaches to a process started with `--inspect-brk` → [6-2](#6-2-debugging-from-the-command-line-attach) |

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
| ③ tsx | `npx tsx lessons/00-setup/enum-sample.ts` | Supports all TS syntax |
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

TypeScript compiles to **JavaScript**, not HTML. Run `npm run build` and open `dist/` to see it.

| TS (`lessons/00-setup/*.ts`) | JS (`dist/lessons/00-setup/*.js`) | Change |
|---|---|---|
| `export interface IPerson { strName: string; nAge: number; }` | *(nothing)* | `interface` is type-only → removed entirely |
| `function Greet(oPerson: IPerson): string` | `function Greet(oPerson)` | Type annotations removed |
| `const arrPeople: IPerson[] = [...]` | `const arrPeople = [...]` | Type annotation removed |
| `import { Greet, type IPerson } from "./greeter.ts"` | `import { Greet } from "./greeter.js"` | Type import removed, `.ts` → `.js` |
| `enum Color { Red = "RED", ... }` | `var Color; (function (Color) { Color["Red"] = "RED"; ... })(Color \|\| (Color = {}));` | **New code is generated** |
| Header comment | kept | Comments are preserved |
| — | `//# sourceMappingURL=hello.js.map` | Source map link for debugging |

Key points:

- Most TS syntax becomes JS **just by erasing it** → which is why `node hello.ts` (type stripping) works.
- Only syntax that must **generate new JS code**, like `enum`, is the exception → the reason method ① failed.
- Types do not exist at runtime. Type checking happens only at compile/edit time.

> C# view: after compiling C#, type information remains in IL and you can use reflection. In TypeScript, types **disappear completely** (type erasure).

## Summary

- While learning, use **① Node directly** for speed, and **③ tsx** when you need `enum` and the like.
- For real output (deployment), use **② a tsc build**.
- Type checking is separate from running → make `npm run typecheck` a habit.
- Debug with F5 (launch), `--inspect-brk` + Attach, or the JavaScript Debug Terminal — whichever you like.
- TS compiles to JS, and the types disappear along the way.

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
| `.vscode/launch.json` | Debug configurations ①–④ |
| `.vscode/tasks.json` | `tsc: build`, `tsc: watch` tasks |
| `.vscode/settings.json` | `typescript.tsdk` → the editor uses the project's TypeScript (7.x) |
| `.vscode/extensions.json` | Recommended extensions: ESLint, Prettier, Pretty TypeScript Errors |
| `.devcontainer/devcontainer.json` | Codespaces: installs Node.js 24, runs `npm ci`, installs recommended extensions |

- Prompts you'll see on first open:
  - "This workspace contains a TypeScript version…" → **Allow** (use the project's TypeScript)
  - "Do you want to install the recommended extensions…" → **Install**

---

[Contents](../../README.md) · [Next: 01. Basic Types and bigint →](../01-basic-types/README.md)
