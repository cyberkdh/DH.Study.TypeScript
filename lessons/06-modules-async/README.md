**English** · [한국어](README.ko.md)

[← Previous: 05. Generics](../05-generics/README.md) · [Contents](../../README.md) · [Next: 07. Browser and DOM →](../07-browser-dom/README.md)

# 06. Modules and Async — import/export, Promise, Files and the Clipboard

> Series: DH.Study.TypeScript · Lesson 06
> Environment: Node.js v24 · TypeScript 7 · VS Code

## Goals

After this lesson you can:

- [ ] Split code into files with `export` / `import`, and know every import form (named, `as`, `* as`, default, `import type`, dynamic)
- [ ] Explain why `verbatimModuleSyntax` wants `import type` for types
- [ ] Read `Promise<T>`, write `async` / `await`, and predict the order of synchronous code, microtasks and timers
- [ ] Run work in parallel with `Promise.all`, `allSettled` and `race`, and add a timeout
- [ ] Read and write files with `node:fs/promises`, store `bigint` in JSON, and handle `ENOENT`
- [ ] Wrap an event API (`child_process.spawn`) in a Promise and copy text to the clipboard
- [ ] Give DevCalc one core entry point (`core/index.ts`), `--copy` and an interactive mode (`--repl`)

## Contents

1. [Modules — import and export](#1-modules--import-and-export)
2. [Promise and async / await](#2-promise-and-async--await)
3. [Several at once — all, allSettled, race](#3-several-at-once--all-allsettled-race)
4. [Files and other programs](#4-files-and-other-programs)
5. [Try it](#5-try-it)
6. [Build it — copy to the clipboard](#6-build-it--copy-to-the-clipboard)
7. [DevCalc step — one core entry, --copy and --repl](#7-devcalc-step--one-core-entry---copy-and---repl)
8. [Summary](#summary)

Example files for this lesson: [math-lib.ts](math-lib.ts) · [modules.ts](modules.ts) · [promises.ts](promises.ts) · [files.ts](files.ts) · [clipboard.ts](clipboard.ts)

> Each example has a Korean-comment twin (`x.ko.ts`) with the same code. The Korean lesson ([README.ko.md](README.ko.md)) uses those.

> Syntax tags: **[JS]** = JavaScript syntax (exists without TS) · **[TS]** = type syntax that TypeScript adds (erase it and you get JS) · details in [lesson 00, 7-3](../00-setup/README.md#7-3-ts-syntax--js-syntax--type-syntax)

---

## 1. Modules — import and export

### 1-1. A file is a module

**[JS]**

This project's `package.json` has `"type": "module"`, so every `.ts` file is an **ES module**. A module has its own scope: a `const` at the top of one file is invisible in another file unless it is **exported** and then **imported**.

| C# | TS / JS |
|---|---|
| `namespace` + `public` / `internal` | the file is the unit. `export` = public, no `export` = private to the file |
| `using DevCalc.Core;` | `import { ToHex } from "./core/Format.ts";` — you name each thing and the file |
| an assembly reference | a package in `package.json` (`import x from "pkg"`) |
| static constructor | the module's top-level code, run **once** on first import |

That's also why lesson files can reuse names like `ToHex`: each file is its own scope.

### 1-2. export

**[JS]** ([math-lib.ts](math-lib.ts))

```ts
export const MAX_BITS = 64;                     // named export
export function ToHex(biValue: bigint): string { ... }
const SEPARATOR = " .. ";                       // not exported : private to this file

export interface IRange { readonly biMin: bigint; readonly biMax: bigint; }   // [TS] type export
export type ESign = "signed" | "unsigned";

export default function Describe(oRange: IRange): string { ... }   // default export : at most one
```

### 1-3. import

**[JS]** ([modules.ts](modules.ts))

```ts
import { Add, ToHex, MAX_BITS } from "./math-lib.ts";   // named : names must match
import { Add as AddBig } from "./math-lib.ts";          // rename
import * as MathLib from "./math-lib.ts";               // everything as one object : MathLib.ToHex
import DescribeRange from "./math-lib.ts";              // default : no braces, any name
import { basename } from "node:path";                   // Node's built-in modules : node: prefix
```

- The path keeps `.ts`. Node runs the file as it is, and TS accepts it (`rewriteRelativeImportExtensions` turns it into `.js` when you build).
- A relative path starts with `./` or `../`. A bare name (`"vitest"`) is a package.
- Importing the same file many times loads it **once**. Every importer gets the same module object.
- This series prefers named exports: the name is fixed, so search and rename work everywhere. Default exports can be imported under any name.

### 1-4. `import type`

**[TS]**

```ts
import type { IRange, ESign } from "./math-lib.ts";
// import { IRange } from "./math-lib.ts";   // TS1484
```

```
error TS1484: 'IRange' is a type and must be imported using a type-only import when 'verbatimModuleSyntax' is enabled.
```

(Uncommenting that line also shows TS2300 "Duplicate identifier", because `IRange` is then imported twice.)

Types are erased (lesson 00). With `verbatimModuleSyntax` the rule is simple: what you write is what runs, minus the type syntax. A plain `import { IRange }` would stay in the JS and ask `math-lib.ts` for an export that doesn't exist at run time. `import type` is erased completely. Mixed imports are fine: `import { Evaluate, type IEvaluation } from "./core/index.ts";`.

### 1-5. Dynamic `import()`

**[JS]**

```ts
const oLib = await import("./math-lib.ts");   // loads when the code reaches this line, returns a Promise
```

Use it to load something only when it's needed (a big module, a plugin chosen at run time). A missing file is a rejected Promise you can catch (`ERR_MODULE_NOT_FOUND`). With a static `import`, a missing file stops the whole program before its first line runs. With a literal path, TS checks dynamic imports too (TS2307).

## 2. Promise and async / await

### 2-1. Promise<T>

**[JS + TS]**

A `Promise<T>` is a value that arrives later, like C#'s `Task<T>`. It ends **fulfilled** (with a T) or **rejected** (with an error).

```ts
function Delay<T>(nMs: number, vValue: T): Promise<T> {
	return new Promise((fnResolve) => {
		setTimeout(() => fnResolve(vValue), nMs);
	});
}
```

`new Promise(...)` is how you wrap an older callback API. Most of the time you only **use** Promises that functions return.

### 2-2. The order: sync, microtasks, timers

**[JS]**

```ts
setTimeout(() => console.log("c) setTimeout 0"), 0);
Promise.resolve().then(() => console.log("b) then"));
console.log("a) synchronous");
```

Prints a, b, c. JS runs on **one thread** with an event loop:

1. the current synchronous code runs to the end
2. then all **microtasks** (Promise callbacks, the code after `await`)
3. then the next **task** (a timer, an I/O event), and again from 1

So nothing interrupts your code halfway, and there are no locks. But a long loop blocks everything, including timers and the UI (lesson 07).

### 2-3. async / await

**[JS + TS]**

```ts
async function ReadRegister(strName: string): Promise<bigint> {
	await Delay(5, undefined);
	if (strName === "ZZ") {
		throw new Error(`unknown register "${strName}"`);   // → a rejected Promise
	}
	return 0xffn;                                          // → Promise<bigint>
}

const biAx = await ReadRegister("AX");   // top-level await : allowed in ES modules
try {
	await ReadRegister("ZZ");
} catch (e) { ... }                      // try / catch works with await
```

Almost the same as C#: `async` makes the function return a Promise, and `await` waits without blocking the thread. Differences:

| C# | TS / JS |
|---|---|
| `Task<T>` | `Promise<T>` |
| `async void` (avoid) | `async` function whose Promise nobody awaits (avoid) |
| `ConfigureAwait`, `SynchronizationContext` | none : one thread |
| `CancellationToken` | `AbortSignal` (`AbortController`) |
| `Task.Delay(ms)` | `new Promise(r => setTimeout(r, ms))` or `await setTimeout(ms)` from `node:timers/promises` |
| top-level statements may use `await` | top-level `await` in ES modules |

### 2-4. A forgotten await

**[TS]**

```ts
const vForgot = ReadRegister("AX");        // Promise<bigint>, not bigint
// const biWrong: bigint = ReadRegister("AX");   // TS2322
```

```
error TS2322: Type 'Promise<bigint>' is not assignable to type 'bigint'.
```

Here TS catches it, because the types differ. It can't catch everything: `ReadRegister("AX");` alone, without `await`, compiles. If that Promise rejects, Node reports an **unhandled rejection** and ends the program. Await every Promise, or hand it to someone who does.

## 3. Several at once — all, allSettled, race

**[JS]**

```ts
const arrValue = await Promise.all([Delay(30, 1n), Delay(30, 2n), Delay(30, 3n)]);   // ≈ 30 ms, not 90
const arrSettled = await Promise.allSettled([ReadRegister("AX"), ReadRegister("ZZ")]);
const strWinner = await Promise.race([Delay(50, "slow"), Delay(5, "fast")]);
```

| JS | C# | Result |
|---|---|---|
| `Promise.all` | `Task.WhenAll` | all values, or the **first** error |
| `Promise.allSettled` | — | `{ status: "fulfilled", value }` / `{ status: "rejected", reason }` for each |
| `Promise.race` | `Task.WhenAny` | the first to settle (value or error) |
| `Promise.any` | — | the first to **succeed** |

The work starts when you **call** the functions, not when you await. `await A(); await B();` runs them one after the other. `await Promise.all([A(), B()])` runs them together.

A timeout is a race against a timer:

```ts
async function WithTimeout<T>(oWork: Promise<T>, nMs: number): Promise<T> {
	let oTimer: NodeJS.Timeout | undefined;
	const oTimeout = new Promise<never>((_, fnReject) => {
		oTimer = setTimeout(() => fnReject(new Error(`timed out after ${nMs} ms`)), nMs);
	});
	try {
		return await Promise.race([oWork, oTimeout]);
	} finally {
		clearTimeout(oTimer);   // or Node waits for the timer before it exits
	}
}
```

`Promise<never>` = a Promise that never fulfills, only rejects. `never` fits into any `T`, so the race is still `Promise<T>`.

## 4. Files and other programs

### 4-1. node:fs/promises

**[JS]** ([files.ts](files.ts))

```ts
import { mkdtemp, writeFile, readFile, appendFile, readdir, stat, rm } from "node:fs/promises";

await writeFile(strFile, "0xFF + 1 = 256\n", "utf8");
const strText = await readFile(strFile, "utf8");   // without "utf8" you get a Buffer (bytes)
```

Like `File.ReadAllTextAsync`. There are synchronous versions (`readFileSync` in `node:fs`). They're fine in a small script, but they block the event loop (section 2-2).

### 4-2. JSON and bigint

**[JS + TS]**

```ts
JSON.stringify({ biValue: 1n });   // TypeError: Do not know how to serialize a BigInt
```

JSON has no bigint. Store `biValue.toString()` and read it back with `BigInt(strValue)`. `JSON.parse` returns `any`, so give it a type: `JSON.parse(strText) as ISaved[]`. TS trusts that cast without checking the data. For files a user could edit, check the shape (lesson 03 guards).

### 4-3. Errors with a code

**[JS + TS]**

```ts
try {
	await readFile(join(strDir, "missing.txt"), "utf8");
} catch (e) {
	const strCode = (e as NodeJS.ErrnoException).code;
	if (strCode !== "ENOENT") {
		throw e;   // permissions, disk : not ours to hide
	}
	// "not found" : e.g. start with an empty history
}
```

Node's system errors carry a `code` string (`ENOENT`, `EACCES`, `EEXIST`...), like `IOException.HResult` but readable. Catch the one you expect and rethrow the rest.

### 4-4. Running another program

**[JS]**

`node:child_process` starts programs. `spawn` doesn't return a Promise. It reports through **events** (`"error"`, `"close"`). Section 6 wraps that in a Promise.

## 5. Try it

Open each file and press `F5`, or run it from the command line. If you can't run code, read the code alongside the output below.

### [modules.ts](modules.ts) — every import form, import type, dynamic import

```
> node lessons/06-modules-async/modules.ts
1) Add = 0xFF / MAX_BITS = 64
2) AddBig = 3n
3) MathLib keys = Add, MAX_BITS, RangeOf, ToHex, default
4) default import = 0x0 .. 0xFF
5) types are gone at run time : MathLib has no IRange = true
6) this folder = 06-modules-async
7) dynamic import : same module object = true / ToHex(4095n) = 0xFFF
8) Expected error: ERR_MODULE_NOT_FOUND
   Why : the file does not exist, so the dynamic import's Promise rejected.
   Fix : check the path. With a literal path TS checks it for you (TS2307).
```

`SEPARATOR` isn't in 3): it isn't exported. Running [math-lib.ts](math-lib.ts) itself only prints a hint (`import.meta.main`, lesson 00).

Things to try: uncomment the TS1484 line. Try `import { SEPARATOR } from "./math-lib.ts";` (TS2614: no exported member `SEPARATOR`).

### [promises.ts](promises.ts) — order, async / await, all / allSettled / race, timeout

```
> node lessons/06-modules-async/promises.ts
2) order :
   a) synchronous code runs first
   b) then : a microtask, runs when the current code is done
   c) setTimeout 0 : a timer, runs last
3) await ReadRegister = 255n
4) Expected error: unknown register "ZZ"
   Why : the async function threw, so its Promise rejected and await rethrew it here.
   Fix : catch it around the await, or let it reach a caller that can.
5) Promise.all = [ 1n, 2n, 3n ] / ran in parallel = true
6) allSettled = fulfilled, rejected
   race = fast
7) without await : a Promise object
8) Expected error: timed out after 20 ms
   Why : the work took longer than the limit.
   Fix : raise the limit, or tell the user and let them retry.
```

Things to try: in 5), change it to three separate `await Delay(30, ...)` lines and print the time. In 8), change the limit `20` to `500`: the work wins the race and no error is printed. Without `clearTimeout`, Node would then wait for the unused 500 ms timer before it exits.

### [files.ts](files.ts) — write, read, JSON, folder list, ENOENT, cleanup

```
> node lessons/06-modules-async/files.ts
2) temp folder created : devcalc-XXXXXX
3) read back : "0xFF + 1 = 256\nans * 2 = 512\n"
4) JSON round trip : 0xFF + 1 = 256n
   Expected error: Do not know how to serialize a BigInt
   Why : JSON has no bigint type.
   Fix : save biValue.toString() and read it back with BigInt(text).
5) history.json  60 bytes
5) history.txt   29 bytes
6) Expected error: ENOENT
   Why : the file does not exist (ENOENT = Error NO ENTry).
   Fix : treat it as empty on the first run, e.g. start with an empty history.
7) temp folder removed
```

Everything happens in a new folder under the OS temp folder, which is removed in `finally`. (The real name ends in 6 random characters, shown here as `XXXXXX`.)

## 6. Build it — copy to the clipboard

**[JS + TS]**

Node has no clipboard API. Every OS ships a small program that copies its input: `clip` (Windows), `pbcopy` (macOS), `wl-copy` / `xclip` / `xsel` (Linux). Full code: [clipboard.ts](clipboard.ts).

```ts
interface ICommand {
	readonly strFile: string;
	readonly arrArg: readonly string[];
}

function ClipboardCommands(strPlatform: NodeJS.Platform): ICommand[] {
	switch (strPlatform) {
		case "win32":  return [{ strFile: "clip", arrArg: [] }];
		case "darwin": return [{ strFile: "pbcopy", arrArg: [] }];
		default:       return [{ strFile: "wl-copy", ... }, { strFile: "xclip", ... }, { strFile: "xsel", ... }];
	}
}

// An event API → a Promise
function RunWithInput(oCommand: ICommand, strInput: string): Promise<void> {
	return new Promise((fnResolve, fnReject) => {
		const oChild = spawn(oCommand.strFile, oCommand.arrArg, { stdio: ["pipe", "ignore", "ignore"] });
		oChild.on("error", fnReject);   // could not start (not installed)
		oChild.on("close", (nCode) => (nCode === 0 ? fnResolve() : fnReject(new Error(`exited with code ${nCode}`))));
		oChild.stdin.end(strInput);     // write the text, then close stdin
	});
}

// Try each one until one works
async function CopyToClipboard(strText: string): Promise<string> {
	const arrError: string[] = [];
	for (const oCommand of ClipboardCommands(process.platform)) {
		try {
			await RunWithInput(oCommand, strText);
			return oCommand.strFile;
		} catch (e) {
			arrError.push(...);
		}
	}
	throw new Error(`no clipboard program worked (${arrError.join(", ")})`);
}
```

- `ClipboardCommands` takes the platform as a parameter instead of reading `process.platform` inside. Tests can then check every OS on one machine.
- `await` inside a `for...of` loop runs the attempts **one after another**, which is what we want here (stop at the first success).
- The `"error"` and `"close"` events become `fnReject` / `fnResolve`. This is the general recipe for any callback or event API.

```
> node lessons/06-modules-async/clipboard.ts
5) copied "0xFF" with clip : paste it somewhere (Ctrl+V / Cmd+V)
6) Expected error: ENOENT
   Why : the program is not installed, so it could not be started.
   Fix : CopyToClipboard tries the next command, and reports all of them if none works.
```

This example really replaces your clipboard. On macOS it prints `pbcopy`, and on Linux the first program that works. Without a desktop (SSH, a container, Codespaces) 5) prints `Could not copy:` with every attempt. `node lessons/06-modules-async/clipboard.ts 0x1F` copies other text.

## 7. DevCalc step — one core entry, --copy and --repl

New files:

| File | Contents |
|---|---|
| [devcalc/src/core/index.ts](../../devcalc/src/core/index.ts) | barrel : re-exports everything the core offers |
| [devcalc/src/cli/Clipboard.ts](../../devcalc/src/cli/Clipboard.ts) | section 6, with `ClipboardCommands` exported for tests |
| [devcalc/src/cli/Repl.ts](../../devcalc/src/cli/Repl.ts) | `RunRepl(fnLine)` : the read-eval-print loop |
| [devcalc/tests/Cli.test.ts](../../devcalc/tests/Cli.test.ts) | core has no `node:` imports, clipboard commands, `--repl` with piped input |

### core/ and cli/

```
devcalc/src/
├── core/        ← pure calculation : no node: imports, runs in Node and in the browser
│   ├── index.ts ← the one entry point
│   └── Format.ts, Parse.ts, WordSize.ts, Calculator.ts, Result.ts, History.ts, Evaluate.ts
├── cli/         ← Node only : clipboard (child_process), REPL (readline)
└── main.ts      ← command line : flags, printing
```

```ts
// core/index.ts — a barrel file
export { ToBin, ToDec, ToHex, GroupDigits, type IFormatOptions, type TFormatter } from "./Format.ts";
export { Evaluate, type IEvaluation, type IEvalError, type TEvalResult } from "./Evaluate.ts";
...

// main.ts — one import line instead of four
import { ToBin, ToDec, ToHex, CWordSize, IsWordBits, Evaluate, CHistory, type IFormatOptions, type TFormatter, type IEvaluation } from "./core/index.ts";
```

`export { ... } from` re-exports without importing into the barrel's own scope. In lesson 07 the web page imports the same `core/index.ts`. A test makes sure no `node:` import sneaks into `core/`:

```ts
test("core: no Node-only imports, so it can run in the browser", async () => {
	for (const strName of await readdir(CORE_DIR)) {
		const strCode = await readFile(join(CORE_DIR, strName), "utf8");
		assert.doesNotMatch(strCode, /from\s+["']node:/, `${strName} imports a node: module`);
	}
});
```

### async Main, --copy

`Main` is now `async`, because copying waits for another program:

```ts
async function Main(): Promise<number> {
	if (bRepl) { ... }
	const nCode = Calculate(strExpr);
	if (nCode === 0 && bCopy) {
		await CopyLatest();   // copies the HEX of the latest result
	}
	return nCode;
}

process.exitCode = await Main();   // top-level await
```

```
> node devcalc/src/main.ts "0xFF + 1" --copy
HEX : 0x100
DEC : 256
BIN : 0b1_0000_0000
Copied: 0x100
```

No clipboard program is not an error: DevCalc prints `Could not copy: ...` and the exit code stays 0. The calculation worked.

### --repl

```ts
// cli/Repl.ts
export async function RunRepl(fnLine: (strLine: string) => Promise<boolean>): Promise<void> {
	const bTerminal = process.stdin.isTTY === true;
	const oReader = createInterface({ input: process.stdin, output: process.stdout, terminal: bTerminal });
	...
	for await (const strLine of oReader) {   // one line at a time, until the input ends
		...
		if (!(await fnLine(strLine.trim()))) {
			break;                            // "exit"
		}
	}
}
```

- `for await...of` loops over an **async iterable**: each step waits for the next line. C#: `await foreach` over `IAsyncEnumerable<T>`.
- `RunRepl` doesn't know about DevCalc. It gets a callback (`RunLine` in main.ts), so it is easy to test and reuse.
- When the input is piped (a file, a test), the terminal doesn't show what was typed, so `RunRepl` echoes each line after the prompt itself.

```
> node devcalc/src/main.ts --repl --bits=16
DevCalc REPL : type "help" for commands, "exit" to quit (16-bit)
devcalc> 0xFF
HEX : 0x00FF
DEC : 255
BIN : 0b0000_0000_1111_1111
INT : 255 (16-bit signed)
devcalc> ans << 8
HEX : 0xFF00
DEC : 65,280
BIN : 0b1111_1111_0000_0000
INT : -256 (16-bit signed)
devcalc> history
 1) 0xFF = 0x00FF
 2) ans << 8 = 0xFF00
devcalc> 0xG
Invalid input: "0xG"
Why : "g" is not a valid hex digit
Fix : use an integer like 255, -0xFF, 0b1010, 0o17 or 1_000.
devcalc> copy
Copied: 0xFF00
devcalc> exit
```

An error doesn't end the REPL. `ans` and `history` carry over from line to line. Commands: `help`, `history`, `copy`, `exit` / `quit`. `Ctrl+C` or `Ctrl+D` (`Ctrl+Z`, Enter on Windows) also ends it.

The test feeds the REPL through a pipe:

```ts
const oRun = spawnSync(process.execPath, [MAIN_FILE, "--repl"], {
	input: "0xFF\nans + 1\n0xG\nhistory\nexit\n0x1\n",
	encoding: "utf8",
});
assert.match(oRun.stdout, /devcalc> ans \+ 1\nHEX : 0x100\n/);
```

```
> npm test
check-pairs : 35 pairs, 0 failed
...
✔ core: no Node-only imports, so it can run in the browser
✔ core/index.ts: exports what main.ts needs
✔ ClipboardCommands: one program per OS, several on Linux
✔ --repl: reads piped lines, keeps ans between lines, stops at exit
...
ℹ pass 25
```

## Summary

- A file with `import` / `export` is a module with its own scope. `export` = public. Paths keep `.ts`. Node's own modules use `node:`.
- Prefer named exports. `import type` for types (`verbatimModuleSyntax`, TS1484). `await import()` loads on demand.
- `Promise<T>` ≈ `Task<T>`. `async` / `await` and `try` / `catch` work like C#. One thread: sync code, then microtasks, then timers.
- `Promise.all` (parallel, first error), `allSettled` (every result), `race` (first to settle, e.g. a timeout). Calling starts the work. Awaiting only waits.
- `node:fs/promises` for files. JSON has no bigint. Check `e.code` (`ENOENT`) and rethrow the rest.
- `new Promise((fnResolve, fnReject) => ...)` turns an event / callback API into something you can `await`.
- DevCalc: `core/` (pure, one entry point) and `cli/` (Node only), `--copy`, `--repl` with `for await`.

**Next → [07. Browser and DOM](../07-browser-dom/README.md)**: the same TypeScript in the browser — the DOM, events, forms and `localStorage`. DevCalc gets a web page (Lv4) built on the same `core/`.

---

[← Previous: 05. Generics](../05-generics/README.md) · [Contents](../../README.md) · [Next: 07. Browser and DOM →](../07-browser-dom/README.md)
