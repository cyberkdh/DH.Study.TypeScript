**English** · [한국어](README.ko.md)

[← Previous: 08. Advanced Types](../08-advanced-types/README.md) · [Contents](../../README.md) · [Next: 10. (Challenge) Lexer and Parser →](../10-lexer-parser/README.md)

# 09. Testing and Tooling — node:test, Mocks, Vitest and a Naming Checker

> Series: DH.Study.TypeScript · Lesson 09
> Environment: Node.js v24 · TypeScript 7 · Vitest 5 · VS Code

## Goals

After this lesson you can:

- [ ] Write tests with `node:test` : `test`, `describe` / `it`, `assert` (`equal`, `deepEqual`, `throws`, `rejects`), async tests, `skip` / `todo`
- [ ] Read a test report, and know what makes a test file fail (exit code 1)
- [ ] Replace a dependency in a test : pass a fake in first, then `mock.fn`, `mock.method`, `mock.timers`
- [ ] Move tests to Vitest, and translate between `assert` and `expect`
- [ ] Check your own project rules with a small tool when the linter doesn't support your TypeScript version

## Contents

1. [node:test](#1-nodetest)
2. [Test doubles](#2-test-doubles)
3. [Vitest](#3-vitest)
4. [Linting with TypeScript 7](#4-linting-with-typescript-7)
5. [Try it](#5-try-it)
6. [Build it — a naming-rule checker](#6-build-it--a-naming-rule-checker)
7. [DevCalc step — Vitest and the naming check in npm test](#7-devcalc-step--vitest-and-the-naming-check-in-npm-test)
8. [Summary](#summary)

Example files for this lesson: [testing-basics.ts](testing-basics.ts) · [mocking.ts](mocking.ts) · [naming.ts](naming.ts)

> Each example has a Korean-comment twin (`x.ko.ts`) with the same code. The Korean lesson ([README.ko.md](README.ko.md)) uses those.

> Syntax tags: **[JS]** = JavaScript syntax (exists without TS) · **[TS]** = type syntax that TypeScript adds (erase it and you get JS) · details in [lesson 00, 7-3](../00-setup/README.md#7-3-ts-syntax--js-syntax--type-syntax)

DevCalc has had tests since lesson 04 (`devcalc/tests/*.test.ts`, run by `npm test` and by CI on every push). Until now they were only shown, not explained. This lesson explains how they work, moves them to Vitest, and adds a check for this repository's naming rules.

Testing is mostly **[JS]**: `test`, `assert` and mocks are plain functions. TypeScript helps in two places: a fake must have the right shape (an interface), and a mock knows the type of the function it replaces.

---

## 1. node:test

Node has a test runner built in. Nothing to install.

```ts
import { describe, it, test } from "node:test";
import assert from "node:assert/strict";

test("ToHex(255n) is 0xFF", () => {
	assert.equal(ToHex(255n), "0xFF");
});
```

- A test is a function. It **passes when it returns without throwing**, and fails when it throws. `assert` is just a set of functions that throw an `AssertionError` when the check is false.
- Import `node:assert/strict`, not `node:assert`. In strict mode `equal` is `===` (the non-strict one is `==`, so `1 == "1"` would pass).

> **C#** : `test(...)` ≈ a `[Fact]` (xUnit) / `[Test]` (NUnit) method, `assert.equal` ≈ `Assert.Equal`, `assert.throws` ≈ `Assert.Throws<T>`. There are no attributes: a test is registered by calling a function.

### 1-1. The asserts you need most

| Assert | Passes when | Example |
|---|---|---|
| `equal(a, b)` | `a === b` | `assert.equal(ToHex(0n), "0x0")` |
| `deepEqual(a, b)` | same contents (arrays, objects, Map, Set) | `assert.deepEqual(arrHex, ["0x1", "0xA"])` |
| `ok(v)` | `v` is truthy | `assert.ok(arrHex.length === 3)` |
| `throws(fn, check)` | `fn()` throws, and the error matches | `assert.throws(() => ToHex(-1n), RangeError)` |
| `rejects(promise, check)` | the promise rejects, and the error matches | `await assert.rejects(ParseLater("4x"), SyntaxError)` |
| `match(str, re)` | the string matches | `assert.match(strOut, /0xFF/)` |

`check` can be an error class, a regular expression for the message, or an object: `{ name: "RangeError", message: "negative value" }`.

Two arrays with the same contents are **not** `equal` — they are two objects. Use `deepEqual`.

### 1-2. describe and it

`describe(name, fn)` groups tests; the report indents them. `it` is the same function as `test` under another name. Use whichever reads better.

### 1-3. Async tests

Make the function `async` (or return a promise). The runner waits for it.

```ts
test("async", async () => {
	assert.equal(await ParseLater("42"), 42n);
	await assert.rejects(ParseLater("4x"), SyntaxError);
});
```

Don't forget the `await` before `assert.rejects`. Without it the test function ends first and is reported ✔ **before the check has run**. If the check then fails, the test stays ✔; node only adds a note that the test "generated asynchronous activity after the test ended" (and exits with code 1).

### 1-4. skip, todo, only

```ts
test("copy to the clipboard", { skip: "needs a desktop session" }, () => { ... });
test.todo("ToHex with a word size (--bits)");
```

Skipped and todo tests appear in the report (`﹣`, `# TODO`) but are not failures. `{ only: true }` runs only the marked tests when node is started with `--test-only`.

### 1-5. The report and the exit code

A file that imports `node:test` runs its tests when you run the file: `node testing-basics.ts`. To run many files: `node --test "devcalc/tests/**/*.test.ts"` (this is what `npm test` did until this lesson).

```
✔ 1) ToHex(255n) is 0xFF (0.6773ms)
▶ 2) ToHex
  ✔ zero (0.0917ms)
...
ℹ tests 8
ℹ pass 6
ℹ fail 0
```

If any test fails, the report lists it with the `AssertionError` (expected and actual values, file and line), and **node exits with code 1**. That exit code is what makes `npm test` and CI fail. Try it in [testing-basics.ts](testing-basics.ts): remove the `//` in front of the last line.

```
✖ 6) fails
  AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:

  '0xA' !== '0xa'
```

The times in parentheses change on every run.

---

## 2. Test doubles

Code that writes to the clipboard, reads the clock or waits for a timer is hard to test. A test double stands in for the real thing.

### 2-1. Pass a fake in (dependency injection)

Try this first. If the function asks for an interface instead of reaching for the real object, the test can pass anything with the same shape:

```ts
interface IClipboard {
	Write(strText: string): Promise<void>;
}

async function CopyResult(biValue: bigint, oClipboard: IClipboard): Promise<string> { ... }

const arrWritten: string[] = [];
const oFake: IClipboard = {
	Write: async (strText) => {
		arrWritten.push(strText);
	},
};
assert.equal(await CopyResult(255n, oFake), "copied 0xFF");
assert.deepEqual(arrWritten, ["0xFF"]);
```

**[TS]** checks the fake: a `Write` that takes a number is TS2322. No library needed. DevCalc already works this way: `Evaluate` gets a `CHistory` and returns a value instead of printing (lessons 05–06), so the tests don't need any mocks.

> **C#** : the same idea as constructor injection with an interface (`IClipboard`) and a hand-written fake. TypeScript's structural typing means the fake doesn't have to say `implements IClipboard` — the right shape is enough.

### 2-2. mock.fn, mock.method, mock.timers

When you can't change the code, `node:test` can record and replace functions:

| Tool | What it does | Example |
|---|---|---|
| `mock.fn(impl?)` | a function that records every call | `fnLog.mock.callCount()`, `fnLog.mock.calls[0]?.arguments` |
| `t.mock.method(obj, "Name", impl)` | replaces one method on an object | `t.mock.method(oStamp, "Now", () => 0)` |
| `t.mock.timers.enable(...)` + `tick(ms)` | fake `setTimeout` / `setInterval` / `Date` | 300 ms pass in no time |

- Use `t.mock` (the test context passed as `t`) rather than the global `mock`: everything it replaced is put back when the test ends.
- The mock is typed from what it replaces. `t.mock.method(oStamp, "Later", ...)` is TS2769 — `"Later"` is not a key of `CStamp`.
- `mock.fn<(strLine: string) => void>()` — with no body, the type argument says what the calls look like.

---

## 3. Vitest

`node:test` is enough for this project, so why Vitest? It is the most used runner in the Vite / front-end world, its `expect` style is what you will read in other projects, and it has a good watch mode and readable failure output. It runs `.ts` files itself.

### 3-1. Install and configure

```bash
npm install -D vitest
```

```ts
// vitest.config.ts
import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		include: ["devcalc/tests/**/*.test.ts"],
	},
});
```

| Command | What it does |
|---|---|
| `npx vitest run` | run once (CI, `npm test`) |
| `npx vitest` | **watch mode** : re-runs the tests affected by each file you save (`npm run test:watch`) |
| `npx vitest run --reporter=verbose` | one line per test |

### 3-2. Moving the DevCalc tests

Vitest treats any thrown error as a failure, so `node:assert` keeps working. Moving DevCalc's 7 test files took **one line per file**:

```ts
import { test } from "node:test";   // before
import { test } from "vitest";      // after
import assert from "node:assert/strict";   // unchanged
```

New tests use Vitest's own `expect`. The two styles side by side:

| node:assert | Vitest expect |
|---|---|
| `assert.equal(a, b)` | `expect(a).toBe(b)` |
| `assert.deepEqual(a, b)` | `expect(a).toEqual(b)` |
| `assert.ok(v)` | `expect(v).toBeTruthy()` |
| `assert.throws(fn, RangeError)` | `expect(fn).toThrow(RangeError)` |
| `await assert.rejects(p, SyntaxError)` | `await expect(p).rejects.toThrow(SyntaxError)` |
| `assert.match(str, /re/)` | `expect(str).toMatch(/re/)` |
| `mock.fn()` | `vi.fn()` → `expect(fn).toHaveBeenCalledWith("a")` |
| `t.mock.method(o, "Now", ...)` | `vi.spyOn(o, "Now").mockReturnValue(0)` |
| `t.mock.timers.enable()` + `tick(300)` | `vi.useFakeTimers()` + `vi.advanceTimersByTime(300)` |

A failing `expect` shows the line of the test (from a temporary test file):

```
 FAIL  devcalc/tests/Tmp.test.ts > fails
AssertionError: expected '0xA' to be '0xa' // Object.is equality

Expected: "0xa"
Received: "0xA"

 ❯ devcalc/tests/Tmp.test.ts:23:21
```

> The lesson examples stay on `node:test`, so you can run them with `node file.ts` like every other example. A Vitest test file can only be run by `vitest`.

---

## 4. Linting with TypeScript 7

A linter finds code that compiles but is probably wrong or breaks a team rule. The usual choice is ESLint with **typescript-eslint**. At the time of writing typescript-eslint supports TypeScript up to 6.0 (its peer dependency is `typescript <6.1.0`), and this project uses TypeScript 7. Installing it would mean forcing past that check and using a tool on a compiler it was not built for, so this lesson does something else:

| What a linter would check | What this project uses |
|---|---|
| unused variables, imports, parameters | `tsc` : `noUnusedLocals`, `noUnusedParameters` (added to `tsconfig.json` in this lesson) |
| a missing `case`, falling through | `tsc` : `noFallthroughCasesInSwitch`, and `AssertNever` (lesson 03) |
| `arr[0]` that may be `undefined` | `tsc` : `noUncheckedIndexedAccess` |
| `enum`, `namespace` | `tsc` : `erasableSyntaxOnly` |
| this repository's naming rules | **`tools/check-names.ts`** (sections 6 and 7) |
| `x.ts` and `x.ko.ts` have the same code | `tools/check-pairs.ts` |

Both tools and `tsc` run in `npm test` / `npm run typecheck`, so CI checks them on every push. When typescript-eslint supports TypeScript 7, adding it is a normal `npm install -D eslint typescript-eslint` and an `eslint.config.js`.

> Formatting (tabs, quotes) is a different job: a formatter such as Prettier rewrites the file. This repository keeps its format by hand (tabs, double quotes); `.vscode/settings.json` only fixes line endings (LF) and the encoding (UTF-8).

---

## 5. Try it

### [testing-basics.ts](testing-basics.ts) — test, describe / it, assert, async, skip / todo, a failing assert

```
> node lessons/09-testing-tooling/testing-basics.ts
✔ 1) ToHex(255n) is 0xFF (0.6773ms)
▶ 2) ToHex
  ✔ zero (0.0917ms)
  ✔ throws RangeError for a negative value (0.3708ms)
✔ 2) ToHex (0.6081ms)
✔ 3) deepEqual (0.3281ms)
✔ 4) async : await the value, rejects for the error (0.1955ms)
﹣ 5) copy to the clipboard (0.0795ms) # needs a desktop session
✔ 5) ToHex with a word size (--bits) (0.059ms) # TODO
✔ 6) a failing assert (caught here, so the file still passes) (0.5935ms)
ℹ Expected error: Expected values to be strictly equal:
ℹ   actual "0xA", expected "0xa"
ℹ Why : ToHex writes upper-case digits; a test without the try would fail
ℹ Fix : expect "0xA" (or change ToHex if lower case is what you want)
ℹ tests 8
ℹ suites 1
ℹ pass 6
ℹ fail 0
ℹ cancelled 0
ℹ skipped 1
ℹ todo 1
ℹ duration_ms 8.3338
```

`t.diagnostic(...)` prints a line (`ℹ`) in the report under the test. Things to try:

- Remove the `//` in front of the last line → `✖ 6) fails`, and `echo $?` (bash) / `$LASTEXITCODE` (PowerShell) shows `1`.
- Remove the `await` in front of `assert.rejects` in test 4, and change `SyntaxError` to `RangeError` (a check that must fail). Test 4 is still `✔`, and the report adds `generated asynchronous activity after the test ended`. Put the `await` back → `✖ 4)`, as it should be.
- Change the options of the first test 5 from `{ skip: ... }` to `{ only: true }` and run `node --test-only lessons/09-testing-tooling/testing-basics.ts` → only that test runs.

### [mocking.ts](mocking.ts) — a fake passed in, mock.fn, mock.method, mock.timers

```
> node lessons/09-testing-tooling/mocking.ts
✔ 1) injection : a fake clipboard keeps what was written (0.9369ms)
✔ 2) mock.fn : count the calls and read the arguments (0.354ms)
✔ 3) mock.method : a fixed time (0.6956ms)
✔ 4) mock.timers : 300 ms pass in no time (0.5451ms)
✔ 5) a failing fake (the error is caught here) (0.5067ms)
ℹ Expected error: clipboard is locked (0x1)
ℹ Why : the fake throws; CopyResult does not catch, so the error reaches the caller
ℹ Fix : a test can expect it : await assert.rejects(CopyResult(1n, oBroken), /locked/)
ℹ tests 5
ℹ suites 0
ℹ pass 5
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 9.1229
```

Things to try: in test 4, change `tick(1)` to `tick(0)` → the test fails, because only 299 ms have passed. Remove the `//` in front of the `oBad` line → TS2322 in the editor.

### [naming.ts](naming.ts) — see section 6

---

## 6. Build it — a naming-rule checker

This repository names things by type (the [naming table](../../README.md#naming-convention)): `CCalculator`, `IResult`, `ERadix`, `TResult`, `ParseNumber`, `strName`, `MAX_BITS`. A reviewer can miss a `const value`. A tool can't.

### Test first

Write down what the checker must find before writing it. Each test is red until its rule exists:

```ts
test("each rule finds its bad name", () => {
	const arrBad = ["class Calc {}", "interface Result {}", 'type Radix = "hex";', "type Pair = [number];", "function to_hex() {}", "let total = 0;"];
	const arrFound = arrBad.map((strLine) => CheckNames(strLine).map((oIssue) => oIssue.strName));
	assert.deepEqual(arrFound, [["Calc"], ["Result"], ["Radix"], ["Pair"], ["to_hex"], ["total"]]);
});
```

### One rule is data

```ts
interface INameRule {
	reFind: RegExp; // group 1 is the name
	reGood: RegExp;
	strRule: string;
}

const RULES: readonly INameRule[] = [
	{ reFind: /\bclass\s+(\w+)/, reGood: /^C[A-Z]/, strRule: "class starts with C" },
	{ reFind: /\binterface\s+(\w+)/, reGood: /^I[A-Z]/, strRule: "interface starts with I" },
	...
];
```

The checker goes through every line and every rule. Adding a rule is adding a row — the same idea as the operator table in lesson 08.

```
> node lessons/09-testing-tooling/naming.ts
5) line 1 Calculator : class starts with C
5) line 2 TRadixName : string union starts with E
5) line 4 value      : variable has a prefix or is UPPER_CASE
5) a string : Expected error: a false alarm [ 'bad' ]
   Why : the line is not parsed, so the word class inside the string is read as a declaration.
   Fix : blank out strings and comments first (BlankNonCode in tools/check-names.ts)
▶ CheckNames
  ✔ good names : no problems (0.9971ms)
  ✔ each rule finds its bad name (0.2604ms)
  ✔ line numbers start at 1, comments are skipped (0.1585ms)
✔ CheckNames (2.1506ms)
ℹ tests 3
ℹ suites 1
ℹ pass 3
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 8.0399
```

The last case is the limit of a regular expression: it does not know that `"class bad"` is a string. The full version in [tools/check-names.ts](../../tools/check-names.ts) first blanks out comments, strings, template literals and regular expressions (`BlankNonCode`), and also checks methods (PascalCase) and getters (named like variables). It is still not a parser — it skips names in destructuring and parameters — but it is small enough to read in one sitting.

> **C#** : in .NET the same job is done by `.editorconfig` naming rules or a Roslyn analyzer, which see the real syntax tree. A regex checker is the cheap version; it is enough for a few clear rules.

---

## 7. DevCalc step — Vitest and the naming check in npm test

### What changed

| File | Change |
|---|---|
| `package.json` | `vitest` in devDependencies. `test` = `check-pairs` → `check-names` → `vitest run`. New `test:watch`, `names` |
| `vitest.config.ts` | new: runs `devcalc/tests/**/*.test.ts` |
| `devcalc/tests/*.test.ts` (7 files) | `import { test } from "vitest"` (asserts unchanged) |
| `devcalc/tests/Names.test.ts` | new: the checker's tests, written with `expect` |
| `tools/check-names.ts` | new: the naming checker (devcalc and tools) |
| `tsconfig.json` | `noUnusedLocals`, `noUnusedParameters` |
| `devcalc/web/App.ts` | `const o` → `const oSaved` |

### The checker's first find

The first run of `check-names` on DevCalc found one real problem — a prefix with no name after it:

```
FAIL devcalc\web\App.ts:51 o : variable has a type prefix (strName, nIdx) or is UPPER_CASE
check-names : 23 files, 1 problems
```

```ts
const oSaved = vValue as Record<string, unknown>; // was : const o
```

It also found two false alarms in its first version: getters (`get nCount()` is used like a property, so it is named like a variable) and `as const` (not a declaration). Both became test cases in `Names.test.ts` before the fix.

### Tests with expect

```ts
import { describe, expect, test } from "vitest";
import { BlankNonCode, CheckSource } from "../../tools/check-names.ts";

test("an issue has the line and the rule", () => {
	expect(CheckSource("const nOk = 1;\nlet value = 2;")).toEqual([
		{ nLine: 2, strName: "value", strRule: expect.stringContaining("prefix") },
	]);
});
```

`expect.stringContaining(...)` inside `toEqual` checks part of a value — handy when the exact message may change.

### Checked

```
> npm test
check-pairs : 47 pairs, 0 failed
check-names : 24 files, 0 problems

 RUN  v5.0.4 D:/mydata/blog/projects/DH.Study.TypeScript/projectroot

 Test Files  8 passed (8)
      Tests  32 passed (32)
```

- The 28 tests from before all pass unchanged on Vitest, plus 4 new ones. CI (`.github/workflows/ci.yml`) needed no change: it runs `npm ci`, `npm run typecheck` and `npm test`.
- `tsc` passes with the two new options.
- DevCalc's output (command line and web page) is the same as before; only a variable name changed.

Things to try:

- `npm run test:watch`, then change `"0xFF"` to `"0xff"` in `devcalc/tests/Format.test.ts` and save. Only that file runs again.
- `node tools/check-names.ts lessons` — it finds `TRadixName` and `TSign` in lesson 03: unions of string literals that the naming table says should start with `E`. They were written before the rule was checked by a tool. Renaming them is a good exercise (both `.ts` and `.ko.ts`, and the README).
- Add a rule to `tools/check-names.ts`: a `const` that holds a `RegExp` must start with `RE_` or `re`. Write the test in `Names.test.ts` first.

---

## Summary

- A test is a function that passes when it doesn't throw. `node:test` gives `test`, `describe` / `it`, `skip` / `todo`; `node:assert/strict` gives `equal`, `deepEqual`, `throws`, `rejects`. A failure makes node exit with code 1, which fails `npm test` and CI.
- Await async checks (`await assert.rejects(...)`).
- Prefer passing a fake in through an interface. When you can't, `mock.fn`, `t.mock.method` and `t.mock.timers` record and replace — and are typed.
- Vitest runs the same `assert`-based tests; its own style is `expect(...).toBe / toEqual / toThrow` and `vi.fn / vi.spyOn / vi.useFakeTimers`. Watch mode re-runs what changed.
- typescript-eslint doesn't support TypeScript 7 yet. `tsc`'s strict and unused options plus two small tools (`check-pairs`, `check-names`) cover what this project needs, and all of it runs in CI.

**Next → [10. (Challenge) Lexer and Parser](../10-lexer-parser/README.md)**: DevCalc reads whole expressions like `(0xFF + 1) << 4` — a tokenizer, a recursive parser and a syntax tree made of discriminated unions.

---

[← Previous: 08. Advanced Types](../08-advanced-types/README.md) · [Contents](../../README.md) · [Next: 10. (Challenge) Lexer and Parser →](../10-lexer-parser/README.md)
