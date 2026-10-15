**English** · [한국어](README.ko.md)

[← Previous: 06. Modules and Async](../06-modules-async/README.md) · [Contents](../../README.md) · [Next: 08. Advanced Types →](../08-advanced-types/README.md)

# 07. Browser and DOM — Elements, Events, Forms and localStorage

> Series: DH.Study.TypeScript · Lesson 07
> Environment: Node.js v24 · TypeScript 7 · VS Code · any modern browser (Edge, Chrome, Firefox)

## Goals

After this lesson you can:

- [ ] Explain how a `.ts` file reaches the browser, and run this lesson's pages with `npm run web`
- [ ] Find elements and get the right type : `querySelector` by tag, generic, or checked with `instanceof`
- [ ] Explain why `textContent` is safe and `innerHTML` is not
- [ ] Listen to events, know which event type TS gives you (`PointerEvent`, `KeyboardEvent`, `SubmitEvent` ...), and use delegation, `preventDefault`, `once` and `AbortController`
- [ ] Read a form with `FormData`, and keep data in `localStorage` (strings only, may throw)
- [ ] Give DevCalc a web page (Lv4) on the same `core/` as the command line

## Contents

1. [TypeScript in the browser](#1-typescript-in-the-browser)
2. [Elements — find, create, change](#2-elements--find-create-change)
3. [Events](#3-events)
4. [Forms and localStorage](#4-forms-and-localstorage)
5. [Try it](#5-try-it)
6. [Build it — a radix converter](#6-build-it--a-radix-converter)
7. [DevCalc step — the web page (Lv4)](#7-devcalc-step--the-web-page-lv4)
8. [Summary](#summary)

Example files for this lesson: [index.html](index.html) · [elements.ts](elements.ts) · [events.ts](events.ts) · [forms.ts](forms.ts) · [radix.ts](radix.ts)

> Each example has a Korean-comment twin (`x.ko.ts`) with the same code. The Korean lesson ([README.ko.md](README.ko.md)) uses those.

> Syntax tags: **[JS]** = JavaScript syntax (exists without TS) · **[TS]** = type syntax that TypeScript adds (erase it and you get JS) · details in [lesson 00, 7-3](../00-setup/README.md#7-3-ts-syntax--js-syntax--type-syntax)

---

## 1. TypeScript in the browser

### 1-1. Browsers run JavaScript only

`node file.ts` works because Node erases the types first (lesson 00). A browser can't do that. Someone has to turn `.ts` into `.js` before the browser sees it:

| Way | Who erases the types | Used in |
|---|---|---|
| `tsc` → `dist/*.js`, then open the .js | `tsc` (lesson 00) | small projects without tools |
| A dev server that converts on request | the server | **this lesson** ([tools/serve.ts](../../tools/serve.ts)) |
| A bundler (Vite, esbuild ...) | the bundler | real web apps |

This repository adds a small dev server with no new packages. When the browser asks for a `.ts` file, it erases the types with Node's own `stripTypeScriptTypes()` (the same thing `node file.ts` does) and sends JavaScript:

```
> npm run web
Dev server running. Open in the browser:
  http://127.0.0.1:5173/lessons/07-browser-dom/      lesson 07 examples (add ?ko for Korean comments)
  http://127.0.0.1:5173/devcalc/web/                 DevCalc web
Stop : Ctrl+C
```

- It listens on `127.0.0.1` only, so other computers can't reach it. It refuses `..`, hidden folders (`.git`) and `node_modules`.
- Port in use? It says so: `Why : port 5173 is already in use`. Pick another port: `PORT=8080 npm run web` (bash) or `$env:PORT=8080; npm run web` (PowerShell).
- Import paths keep `.ts` (lesson 06), so the browser asks for `.ts` files and gets them converted too.
- Like `node file.ts`, it only **erases** types. It doesn't type-check. Keep the red squiggles in VS Code (or `npm run typecheck`) as your check.

### 1-2. The page loads a module

```html
<script type="module" src="./App.ts"></script>
```

`type="module"` makes the file an ES module (lesson 06): `import` works, top-level `await` works, and it runs after the HTML is parsed. Without `type="module"`, `import` is a syntax error.

### 1-3. Types for the DOM: `lib`

`document`, `HTMLInputElement` and `localStorage` are not JavaScript. They are browser APIs. Their types come from `lib` in [tsconfig.json](../../tsconfig.json):

```jsonc
"lib": ["es2024", "DOM", "DOM.Iterable"],
```

This lesson added `DOM` (`document`, `HTMLElement` ...) and `DOM.Iterable` (`for...of` over a `NodeList`). The same tsconfig checks the Node files too, so `document` now type-checks everywhere, even in Node, where it doesn't exist. That's why every example starts by checking:

```ts
if (typeof document === "undefined") {
	console.log("This example runs in the browser (it uses document).");
} else {
	RunElements();
}
```

> Bigger projects use two tsconfig files (one with `DOM` for the web, one without for Node) so TS catches `document` in Node code. One file keeps this course simple.

### 1-4. DevTools

`F12` in the browser. **Console** shows `console.log` output and errors (with the `.ts` file name). **Elements** shows the live page. Every example here writes to the page's grey box *and* to the console.

---

## 2. Elements — find, create, change

### 2-1. querySelector returns `Element | null`

```ts
const elTitle = document.querySelector("#title"); // Element | null
// elTitle.textContent = "x";                     // TS18047 : 'elTitle' is possibly 'null'
if (elTitle !== null) {
	Log("1) #title text =", elTitle.textContent);
}
```

The element may not exist (wrong id, script ran too early), so TS makes you check `null` first (`strictNullChecks`, lesson 01).

### 2-2. Getting the right element type

`querySelector("#expr")` gives `Element`. `Element` has no `value` (TS2339): TS can't know from `"#expr"` that it's an `<input>`. Three ways to tell it:

```ts
const elByTag = document.querySelector("input"); // a tag name : HTMLInputElement | null
const elByGeneric = document.querySelector<HTMLInputElement>("#expr"); // generic : you promise the type
const elChecked = QueryOne("#expr", HTMLInputElement); // checked at run time : safest
```

| Way | Checked at run time? | When |
|---|---|---|
| Tag name (`"input"`, `"tr"`) | ✅ (the tag decides) | selector is a tag name |
| Generic `<HTMLInputElement>` / `as HTMLInputElement` | ❌ a promise | you control the HTML and it's simple |
| `instanceof` check | ✅ | everything else, and in helpers |

The helper, a generic function (lesson 05) that takes a class:

```ts
function QueryOne<T extends Element>(strSelector: string, cType: { new (): T; prototype: T }): T {
	const elFound = document.querySelector(strSelector);
	if (!(elFound instanceof cType)) {
		throw new Error(`${strSelector} : expected ${cType.name}, found ${elFound === null ? "nothing" : elFound.tagName}`);
	}
	return elFound; // narrowed to T by instanceof
}
```

`{ new (): T; prototype: T }` means "a class that makes a T". `HTMLInputElement` is a real class at run time, so `instanceof` works and narrows to `T`. A wrong selector fails at once, with the selector in the message, not three functions later as `undefined`.

> **C#** : like `obj as TextBox` vs `(TextBox)obj` vs `if (obj is TextBox tb)`. TS's `as` is closer to a C# cast that is **never** checked: it's erased.

`getElementById` returns `HTMLElement | null` (always an HTML element, but which one is unknown).

### 2-3. textContent vs innerHTML

```ts
const strUserInput = "<img src=x onerror=alert(1)>";
elSafe.textContent = strUserInput; // shown as text, nothing runs
// elSafe.innerHTML = strUserInput; // parsed as HTML : the onerror code RUNS (XSS)
```

`textContent` puts text. `innerHTML` parses HTML, and HTML can run code. Never pass user input (or anything from a URL or storage) to `innerHTML`. Build elements with `createElement` instead:

```ts
const elRow = document.createElement("tr"); // HTMLTableRowElement (from the tag name)
elRow.insertCell().textContent = strLabel;
elBody.append(elRow);
```

### 2-4. Classes, data-*, remove

```ts
elTitleP.classList.add("highlight"); // also remove, toggle, contains
const biValue = BigInt(elItem.dataset["value"] ?? "0"); // <li data-value="0x1234"> → "0x1234"
elRegs.lastElementChild?.remove();
```

`dataset` reads `data-*` attributes. Values are `string | undefined` (the attribute may be missing), so `?? "0"` gives a default.

---

## 3. Events

### 3-1. addEventListener: the name picks the type

```ts
elButton.addEventListener("click", (oEvent) => {
	// oEvent : PointerEvent (a MouseEvent with pointer details)
	Log(`1) click #${nCount} : button = ${oEvent.button}, isTrusted = ${oEvent.isTrusted}`);
	// Log(oEvent.key); // TS2339 : Property 'key' does not exist on type 'PointerEvent'
});
```

TS looks the event name up in a map (`HTMLElementEventMap`) and gives the handler the right type. You never write it:

| Event name | Type |
|---|---|
| `"click"` | `PointerEvent` |
| `"keydown"`, `"keyup"` | `KeyboardEvent` (`key`, `ctrlKey` ...) |
| `"input"` | `InputEvent` (every change while typing) |
| `"change"` | `Event` (when the value is committed, e.g. focus leaves) |
| `"submit"` | `SubmitEvent` |

`element.click()` and `dispatchEvent(...)` fire events from code: the examples use them so the output appears without you clicking. Those events have `isTrusted = false`.

> **C#** : `button.Click += (sender, e) => ...`. Here: `addEventListener("click", (e) => ...)`, and the name is a string that TS checks against the map.

### 3-2. Delegation: one listener on the parent

```ts
elOps.addEventListener("click", (oEvent) => {
	const elTarget = oEvent.target; // EventTarget | null
	if (!(elTarget instanceof HTMLButtonElement)) {
		return; // a click between the buttons
	}
	Log(`3) operator button : data-op = "${elTarget.dataset["op"]}"`);
});
```

Events **bubble**: a click on a button also reaches its parent. One listener on the parent handles every button, including ones added later. `target` is the element that was clicked, typed as `EventTarget | null`, so narrow it with `instanceof`.

### 3-3. preventDefault, once, AbortController

```ts
elLink.addEventListener("click", (oEvent) => oEvent.preventDefault()); // the link doesn't navigate

elTest.addEventListener("click", OnClick, { once: true }); // removed after the first call

const oController = new AbortController();
elTest.addEventListener("click", OnClick, { signal: oController.signal });
oController.abort(); // removes every listener added with this signal
```

`AbortController` / `AbortSignal` is what lesson 06 compared to C#'s `CancellationToken`. The same signal also cancels `fetch`: one way to say "stop" for many things.

### 3-4. Custom events

```ts
document.addEventListener("devcalc:result", (oEvent) => {
	const biValue = (oEvent as CustomEvent<bigint>).detail;
});
document.dispatchEvent(new CustomEvent<bigint>("devcalc:result", { detail: 255n }));
```

TS doesn't know your own event names, so the handler gets plain `Event`. One cast (`as CustomEvent<bigint>`) reads `detail`.

---

## 4. Forms and localStorage

### 4-1. Reading a form

```ts
elForm.addEventListener("submit", (oEvent) => {
	oEvent.preventDefault(); // without it, the browser reloads the page
	const oData = new FormData(elForm);
	const strA = FieldText(oData, "a");
	const nBits = elBits.valueAsNumber; // a number for type="number" (NaN when empty)
});

function FieldText(oData: FormData, strName: string): string {
	const vValue = oData.get(strName); // FormDataEntryValue | null = string | File | null
	return typeof vValue === "string" ? vValue.trim() : "";
}
```

- `submit` fires for Enter in a field and for a submit button. `requestSubmit()` does the same from code.
- Input boxes always hold **text**. `"0xFF"` → `BigInt("0xFF")`. A bad value throws `SyntaxError`, so catch it and mark the field.
- `elForm.elements.namedItem("a")` returns `Element | RadioNodeList | null`: narrow with `instanceof HTMLInputElement`.

### 4-2. localStorage

```ts
localStorage.setItem("lesson07.form", JSON.stringify(oForm)); // strings only
const strJson = localStorage.getItem("lesson07.form"); // string | null : null = never saved
```

| Point | Why it matters |
|---|---|
| Strings only | `JSON.stringify` objects. JSON has no `bigint` (lesson 06) : store it as text |
| `getItem` is `string \| null` | the first visit has nothing |
| It can **throw** | blocked by privacy settings, or full (about 5 MB) : wrap in `try` |
| `JSON.parse` returns `any` | the data may be old or edited by hand : check it (section 7) |
| Per site (origin) | `127.0.0.1:5173` and `127.0.0.1:8080` are different storages |

DevTools → **Application** → Local Storage shows and edits it.

> **C#** : like a tiny `Dictionary<string, string>` saved to disk per web site.

---

## 5. Try it

Start the server and open the page:

```
npm run web
```

→ <http://127.0.0.1:5173/lessons/07-browser-dom/> (Korean comments: add `?ko`, same code and output)

Each section runs one file. In Node, the files only print a hint:

```
> node lessons/07-browser-dom/elements.ts
This example runs in the browser (it uses document).
  npm run web  →  http://127.0.0.1:5173/lessons/07-browser-dom/
```

### [elements.ts](elements.ts) — find, type, textContent, create, dataset, remove

```
1) #title text = DevCalc
   #expr is an INPUT but TS only knows: Element
2) value = 0xFF 0xFF 0xFF
   Expected error: #title : expected HTMLInputElement, found P
   Why : #title is a <p>, not an <input>. A cast (as / <T>) would have hidden this.
   Fix : check the selector and the HTML. QueryOne finds it at the first run.
3) textContent keeps it as text : <img src=x onerror=alert(1)> / child elements = 0
4) rows added = 2
5) class = highlight / has highlight = true
   AX = 4660 (data-value="0x1234")
   BX = 255 (data-value="0xFF")
6) after remove : li count = 1
```

Things to try: uncomment the TS18047 and TS2339 lines. In DevTools → Console, type `document.querySelector("#title").innerHTML = "<b>bold</b>"` and compare with `textContent`.

### [events.ts](events.ts) — click, keydown, delegation, preventDefault, once / signal, custom event

```
1) click #1 : button = 0, isTrusted = false
1) click #2 : button = 0, isTrusted = false
2) Enter pressed : value = "0xFF", ctrl = false
3) operator button : data-op = "+"
3) operator button : data-op = "&"
3) operator button : data-op = "<<"
4) link click : defaultPrevented = true (the page stays here)
5) once : runs on the first click only
   with signal : heard 1 of 2 clicks (aborted after the first)
6) custom event : detail = 255 (0xFF)
   now click the buttons yourself : the lines above get added again
```

Click **Click me** yourself: `isTrusted = true`. Press Ctrl+Enter in the text box: `ctrl = true`.

Things to try: uncomment the TS2339 line. Remove `oEvent.preventDefault()` and click the link: the URL gets `#docs`.

### [forms.ts](forms.ts) — FormData, submit, valueAsNumber, localStorage

First visit:

```
4) last visit : nothing saved yet
5) 0xFF & 1 (8-bit) = 0x1 / saved
5) 0xFF << 1 (8-bit) = 0xFE / saved
   Expected error: SyntaxError : Cannot convert 0xZZ to a BigInt
   Why : an input box always holds text, and BigInt() could not read it.
   Fix : type 255, 0xFF, 0b1010 or 0o17. The red outline marks the field.
7) localStorage = {"strA":"0xFF","strOp":"<<","strB":"1"}
```

Reload (`F5`): the first line becomes `4) last visit : 0xFF << 1`.

Things to try: change bits to 16 and submit `0xFF << 1` (= `0x1FE`). DevTools → Application → Local Storage: delete `lesson07.form` and reload.

---

## 6. Build it — a radix converter

[radix.ts](radix.ts) : type a number, see HEX / DEC / BIN at once. The parts are split on purpose:

```ts
// 1) all elements, checked once
interface IRadixView {
	readonly elInput: HTMLInputElement;
	readonly elHex: HTMLElement;
	// ...
}
const oView: IRadixView = {
	elInput: ById("radix-input", HTMLInputElement),
	elHex: ById("radix-hex", HTMLTableCellElement),
	// ...
};

// 2) pure functions : no DOM inside → easy to test (lesson 09)
function ParseNumber(strText: string): TParsed { ... }
function Radix(biValue: bigint, nBase: number, strPrefix: string): string { ... }

// 3) the only function that writes to the page
function Render(oView: IRadixView): void { ... }

// 4) "input" : every change, while typing
oView.elInput.addEventListener("input", () => Render(oView));
```

`TParsed` is a discriminated union (lesson 04): `{ bOk: true; biValue } | { bOk: false; strError }`.

Output (the code types five values by itself):

```
5) 0xFF         → 0xFF / 255 / 0b11111111
5) 0b1010_1010  → 0xAA / 170 / 0b10101010
5) -0x10        → -0x10 / -16 / -0b10000
5) 12a          → error : "12a" is not an integer (255, 0xFF, 0b1010, 0o17)
5) 4096         → 0x1000 / 4096 / 0b1000000000000
   your turn : type in the box above
```

Things to try: listen to `"change"` instead of `"input"` and see when it updates. Add an OCT row (`Radix(v, 8, "0o")`).

---

## 7. DevCalc step — the web page (Lv4)

New files:

| File | Contents |
|---|---|
| [devcalc/web/index.html](../../devcalc/web/index.html) | the page : expression box, word size, result table, history |
| [devcalc/web/style.css](../../devcalc/web/style.css) | light / dark styles |
| [devcalc/web/App.ts](../../devcalc/web/App.ts) | the only file that touches the DOM |
| [devcalc/tests/Web.test.ts](../../devcalc/tests/Web.test.ts) | App.ts imports only the core, serve.ts paths |
| [tools/serve.ts](../../tools/serve.ts) | the dev server from section 1 |

Open <http://127.0.0.1:5173/devcalc/web/> with `npm run web` running.

### The same core

```ts
// devcalc/web/App.ts — the same import as main.ts
import { ToBin, ToDec, ToHex, CWordSize, IsWordBits, Evaluate, CHistory, type IFormatOptions, type TFormatter, type IEvaluation, type IEvalError } from "../src/core/index.ts";
```

```
devcalc/
├── src/core/   ← calculation : used by both, unchanged in this lesson
├── src/cli/    ← Node only (clipboard program, readline)
├── src/main.ts ← command line : prints with console.log
└── web/App.ts  ← browser : writes to the page
```

This is why lesson 06 moved the core away from `node:` imports. `Evaluate` returns a `TResult` and never prints, so the command line prints it and the page shows it, with no change to the core. A test keeps `App.ts` honest:

```ts
test("web/App.ts: imports only the core (the browser has no node: modules)", async () => {
	const strCode = await readFile(APP_FILE, "utf8");
	const arrFrom = [...strCode.matchAll(/from\s+["']([^"']+)["']/g)].map((arrMatch) => arrMatch[1]);
	assert.deepEqual(arrFrom, ["../src/core/index.ts"]);
});
```

### What the page does

| Feature | How |
|---|---|
| `0xFF + 1; ans * 2` and `ans` | the same loop as `Calculate` in main.ts, with `CHistory` |
| Word size | `<select>` → `IsWordBits(Number(value))` → `CWordSize` or none |
| Result table | `insertRow` / `insertCell` / `textContent` (never `innerHTML`) |
| Copy buttons | one delegated listener, `navigator.clipboard.writeText` |
| Error box | the same title / Why / Fix as the command line |
| History | click a line to reuse it. Kept in `localStorage` |

### bigint in localStorage

```ts
interface ISavedEval {
	strExpr: string;
	strValue: string; // bigint as decimal text
	strExact: string;
	bOverflow: boolean;
}

// JSON.parse returns any : check every field before trusting it
function IsSavedEval(vValue: unknown): vValue is ISavedEval {
	if (typeof vValue !== "object" || vValue === null) {
		return false;
	}
	const oSaved = vValue as Record<string, unknown>;
	return typeof oSaved.strExpr === "string" && typeof oSaved.strValue === "string" && typeof oSaved.strExact === "string" && typeof oSaved.bOverflow === "boolean";
}
```

`const vParsed: unknown = JSON.parse(...)` turns the `any` into `unknown`, so nothing is used before the type guard (lesson 04) checks it. Broken data (`"strValue":"zz"` → `BigInt` throws) is caught and the history starts empty.

### navigator.clipboard

```ts
await navigator.clipboard.writeText(strText); // Promise<void>
```

The browser decides, not you. It works on `https://` or `localhost` / `127.0.0.1`, in a focused page, after a user action (a click). Otherwise it rejects, for example `Document is not focused`. So the page catches it and shows `Could not copy: ...`, the same rule as `--copy` in lesson 06: a missing clipboard is a note, not a crash.

### Checked

The page was driven by code in a headless Edge (no window):

```
> 0xFF & 0x0F (bits=32)
   HEX : 0x0000_000F
   DEC : 15
   BIN : 0b0000_0000_0000_0000_0000_0000_0000_1111
   INT : 15
> 0xFF + 1; ans * 2 (bits=8)
   HEX : 0x00
   DEC : 0
   BIN : 0b0000_0000
   INT : 0
> 0xZZ (bits=8)
   Invalid input: "0xZZ"
   Why : "z" is not a valid hex digit
   Fix : use an integer like 255, -0xFF, 0b1010, 0o17 or 1_000.
history :
   0xFF & 0x0F = 0xF
   0xFF + 1 = 0x0
   ans * 2 = 0x0
```

After a reload the history is still there. `npm test`:

```
✔ web/App.ts: imports only the core (the browser has no node: modules)
✔ serve ResolvePath: files inside the project only
...
ℹ pass 27
```

Things to try: add an OCT row to the table. Make `Escape` clear the box (`"keydown"`, `oEvent.key === "Escape"`).

---

## Summary

- Browsers run JavaScript only. `npm run web` erases the types on request (like `node file.ts`): no type check, so keep VS Code / `npm run typecheck`.
- `lib: ["DOM", "DOM.Iterable"]` gives `document` and friends. Check `typeof document` when a file can also run in Node.
- `querySelector` → `Element | null`. Get the right type by tag name, generic (a promise), or `instanceof` (checked).
- `textContent` for text, `createElement` for structure. Never `innerHTML` with user input.
- The event name picks the type (`click` → `PointerEvent`, `submit` → `SubmitEvent`). Delegation + `instanceof` on `target`. `preventDefault`, `once`, `AbortController`.
- `FormData.get` → `string | File | null`. Inputs hold text. `localStorage` stores strings, may throw, and `JSON.parse` needs a check.
- DevCalc Lv4: a web page on the same `core/`, only `App.ts` touches the DOM.

**Next → [08. Advanced Types](../08-advanced-types/README.md)**: types made from other types — `keyof`, mapped types, conditional types, template literal types and `satisfies`. DevCalc's operator table becomes fully typed.

---

[← Previous: 06. Modules and Async](../06-modules-async/README.md) · [Contents](../../README.md) · [Next: 08. Advanced Types →](../08-advanced-types/README.md)
