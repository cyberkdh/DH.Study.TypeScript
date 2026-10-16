**English** · [한국어](README.ko.md)

[← Previous: 13. Function Tables and Scope](../13-functions-scope/README.md) · [Contents](../../README.md) · [Next: 15. Bundling and Build →](../15-bundling-release/README.md)

# 14. DOM in Depth — Events, Keyboard and Accessibility

> Series: DH.Study.TypeScript · Lesson 14 (Part 2)
> Environment: Node.js v24 · TypeScript 7 · Vitest 5 · VS Code · a browser (Edge, Chrome or Firefox)

## Goals

After this lesson you can:

- [ ] Follow one click through capture, target and bubble, and tell `target` from `currentTarget`
- [ ] Handle many buttons with one delegated listener and `closest()`, including buttons added later
- [ ] Read `key` and `code`, skip keys that belong to the IME (`isComposing`), and type a shortcut table with `satisfies`
- [ ] Move focus with the keyboard (roving `tabindex`), and use `focusin` when a parent needs to know
- [ ] Make a page usable without a mouse and with a screen reader: real `<button>`s, `aria-pressed`, `aria-label`, `role="status"`, `<details>`
- [ ] Use DevCalc's bit grid, live preview, history keys and help panel

## Contents

1. [How an event travels](#1-how-an-event-travels)
2. [Delegation](#2-delegation)
3. [The keyboard](#3-the-keyboard)
4. [Focus](#4-focus)
5. [Accessibility : the page also speaks](#5-accessibility--the-page-also-speaks)
6. [Try it](#6-try-it)
7. [Build it — a 16-bit grid](#7-build-it--a-16-bit-grid)
8. [DevCalc step — Lv9 bit grid and keyboard](#8-devcalc-step--lv9-bit-grid-and-keyboard)
9. [Summary](#summary)
10. [Where next](#where-next)

Example files for this lesson: [index.html](index.html) · [propagation.ts](propagation.ts) · [keyboard.ts](keyboard.ts) · [focus.ts](focus.ts) · [bitgrid.ts](bitgrid.ts)

> Each example has a Korean-comment twin (`x.ko.ts`) with the same code. The Korean lesson ([README.ko.md](README.ko.md)) uses those: open the page with `?ko`.

> Syntax tags: **[JS]** = JavaScript syntax (exists without TS) · **[TS]** = type syntax that TypeScript adds (erase it and you get JS) · details in [lesson 00, 7-3](../00-setup/README.md#7-3-ts-syntax--js-syntax--type-syntax)

Lesson 07 put DevCalc in the browser with a form, a submit event and one delegated listener for the copy buttons. That is enough for a mouse user who types a whole expression and presses Enter. A calculator that a developer keeps open all day needs more: flip one bit with a click, see the result while typing, call back the last expression with ArrowUp, and do all of it without a mouse. At the end:

```
DevCalc Lv9 · web          (word size 8-bit)

0xA5
= 0xA5                     ← the preview, while typing

Bits
[1][0][1][0] [0][1][0][1]  ← click bit 0 → "0xA5 ^ bit(0)" → 0xA4
```

This lesson runs in the browser. Start the dev server once, and keep it running:

```
> npm run web
http://127.0.0.1:5173/lessons/14-events-accessibility/      ← the examples (add ?ko for the Korean comments)
http://127.0.0.1:5173/devcalc/web/                          ← DevCalc
```

Each example writes its output on the page and in the DevTools console (F12). Running one with `node` only prints how to open it.

---

## 1. How an event travels

### 1-1. Capture, target, bubble

**[JS]** A click on a button does not happen only to the button. The event travels in three phases:

```
window → document → … → outer → inner        capture  (eventPhase 1, top down)
                                  leaf        target   (eventPhase 2)
window ← document ← … ← outer ← inner        bubble   (eventPhase 3, bottom up)
```

`addEventListener("click", fn)` listens in the bubble phase. `addEventListener("click", fn, { capture: true })` listens on the way down. [propagation.ts](propagation.ts) adds both to three nested boxes and clicks the innermost:

```
1) outer(1) → inner(1) → leaf(2) → inner(3) → outer(3)
```

Most code only needs bubbling. Capture is for the rare case where a parent must see the event first (for example, to block clicks while a dialog is open).

### 1-2. `target` and `currentTarget`

**[JS]** Two properties, two different questions:

| | Means | In a listener on `#menu` when the `<span>` inside a button is clicked |
|---|---|---|
| `target` | where the event started | the `<span>` |
| `currentTarget` | whose listener is running now | `#menu` |

**[TS]** `currentTarget` is typed `EventTarget | null`, and TS is right about the `null`: the browser sets it only while a listener runs. After an `await` the event has finished travelling, and `currentTarget` is `null`:

```ts
elLate.addEventListener("click", async (oEvent) => {
	const elBefore = oEvent.currentTarget as HTMLButtonElement; // read before the first await : fine
	await Promise.resolve();                                    // e.g. await navigator.clipboard.writeText(...)
	const elAfter = oEvent.currentTarget as HTMLButtonElement;  // as hides the null from TS
	Log(elAfter.id);                                            // TypeError : currentTarget is null now
});
```

```
5) before await : BUTTON#late · after await : null
   Expected error: TypeError: Cannot read properties of null (reading 'id')
```

Copy what you need into a `const` before the first `await`. Lesson 07's copy button does exactly that with `strText`.

### 1-3. `stopPropagation`

**[JS]** `oEvent.stopPropagation()` ends the trip: no parent hears the event. It looks tidy and causes quiet bugs, because every delegated listener above — a menu, click logging, "close the popup when you click outside" — misses it too:

```
4) 2 clicks, the second with stopPropagation : the parent heard 1
```

Prefer checking `target` in the parent over stopping the event in the child.

---

## 2. Delegation

### 2-1. One listener for many children

**[JS]** Lesson 07 introduced delegation: one listener on the parent instead of one per button. Its two advantages show up in a bit grid with up to 128 buttons:

- **one listener**, however many buttons there are;
- **buttons made later need nothing**: rebuilding the grid for a new word size does not add listeners.

```
3) a button added after the listener :
   target = BUTTON · currentTarget = UL#menu · instanceof → paste · closest → paste
```

### 2-2. `closest()` instead of `instanceof`

**[JS + TS]** `target` is the innermost element that was clicked. When a button holds an icon or a `<span>`, `target` is that `<span>`, and a check like `oEvent.target instanceof HTMLButtonElement` misses:

```
   target = SPAN · currentTarget = UL#menu · instanceof → missed · closest → copy
```

`closest(selector)` walks up from the element (itself included) to the first match:

```ts
const elButton = oEvent.target instanceof Element
	? oEvent.target.closest<HTMLButtonElement>("button[data-cmd]")
	: null;
if (elButton !== null && elMenu.contains(elButton)) {
	Run(elButton.dataset["cmd"]);
}
```

- `oEvent.target instanceof Element` narrows `EventTarget | null` so `closest` exists (TS).
- `closest<HTMLButtonElement>(…)` returns `HTMLButtonElement | null`; the type argument is a promise from you, like `querySelector<…>` (lesson 07).
- `contains` keeps the search inside the menu: `closest` would also find a matching button *around* the menu.

---

## 3. The keyboard

### 3-1. `key` and `code`

**[JS]** A `keydown` event carries two names for the key:

| | Is | `a` | Shift+`a` | `a` with the Korean layout |
|---|---|---|---|---|
| `key` | the character or the key's name | `"a"` | `"A"` | `"ㅁ"` |
| `code` | the place on the keyboard | `"KeyA"` | `"KeyA"` | `"KeyA"` |

Use `key` for meaning (`"Enter"`, `"Escape"`, `"ArrowUp"`, a typed letter). Use `code` for shortcuts with Ctrl, so Ctrl+K works whatever the layout:

```ts
if ((oEvent.ctrlKey || oEvent.metaKey) && oEvent.code === "KeyK") { … } // metaKey : ⌘ on macOS
```

### 3-2. A typed shortcut table

**[TS]** Lesson 13's tables work for keys too. A union names the keys, and `satisfies` checks that every key has a handler and no extra key sneaks in:

```ts
type EShortcut = "Enter" | "Escape" | "ArrowUp" | "ArrowDown";

const SHORTCUTS = {
	Enter: () => `run "${elInput.value}"`,
	Escape: () => { elInput.value = ""; return "cleared the box"; },
	ArrowUp: () => …,
	ArrowDown: () => …,
} satisfies Record<EShortcut, () => string>;

function IsShortcut(strKey: string): strKey is EShortcut {
	return Object.hasOwn(SHORTCUTS, strKey); // not "in" : lesson 13, section 2-2
}
```

Leave out `ArrowDown` and TS2741 names the missing key. Misspell a key (`"Esc"`) and TS2322 stops you — a real trap, since the browser says `"Escape"`.

### 3-3. The IME : `isComposing`

**[JS]** Korean, Japanese and Chinese input goes through an IME (input method editor). While a syllable is being built, the keys belong to the IME: the Enter that finishes `한` also fires `keydown` with `key = "Enter"`. Without a check, the calculator runs a half-typed expression. The first line of every keydown handler that reacts to Enter:

```ts
if (oEvent.isComposing) {
	return; // the IME is still composing : this Enter only finishes the syllable
}
```

```
6) Ctrl+K, and Enter while the IME is composing
   Ctrl+k     code = KeyK       → cleared · defaultPrevented = true
   Enter      code = Enter      → ignored : the IME is still composing (this Enter only finishes the syllable)
```

### 3-4. `preventDefault` needs a cancelable event

**[JS]** `preventDefault()` stops the browser's own action: ArrowUp moving the cursor to the start of the box, Ctrl+K opening the search bar. Events from real keys are cancelable. An event you make with `new KeyboardEvent(…)` is not, unless you say so — a common surprise in tests:

```
7) the same Ctrl+K, made with new KeyboardEvent() only
   Expected problem: preventDefault() was called, but defaultPrevented = false
```

Pass `{ bubbles: true, cancelable: true }` when you make events in code. They still don't type letters (`isTrusted` is `false`): only real keys do.

### 3-5. Function declarations and narrowing

**[TS]** One more trap from [keyboard.ts](keyboard.ts). After `if (!(elInput instanceof HTMLInputElement)) return;`, `elInput` is an `HTMLInputElement` — but not inside a `function` declaration further down. A declaration is hoisted (lesson 13, 3-2) and could run before the check, so TS forgets the narrowing (TS18047 `'elInput' is possibly 'null'`). A `const` arrow can't run before its line, and keeps it:

```ts
const Handle = (oEvent: KeyboardEvent): string => { … elInput.value … }; // OK
```

---

## 4. Focus

### 4-1. What can take focus

**[JS]** Keyboard users move with Tab. Tab stops at controls — `<button>`, `<input>`, `<select>`, `<a href>`, … — and at elements with `tabindex="0"`. A `<div>` with a click listener looks like a button and is invisible to the keyboard; `focus()` on it does nothing, and says nothing:

```
5) Expected problem: after elPlain.focus(), activeElement is still BUTTON "group"
   with tabindex="-1" → activeElement = DIV#plain
```

| `tabindex` | Tab stops? | `focus()` works? |
|---|---|---|
| (not set, a control) | yes | yes |
| (not set, a `<div>`) | no | no |
| `0` | yes, in page order | yes |
| `-1` | no | yes |
| `1`, `2`, … | yes, before everything else | yes — avoid: it breaks the page order |

Rule: if users press it, make it a `<button type="button">`. Enter and Space then click it for free.

### 4-2. `focus` vs `focusin`

**[JS]** `focus` and `blur` don't bubble; `focusin` and `focusout` do. A toolbar that wants to know when any of its buttons gets focus listens to `focusin`:

```
1) focus a button inside : the toolbar heard "focus" 0, "focusin" 1 · activeElement = BUTTON "group"
```

`document.activeElement` is the element that has focus now.

### 4-3. Roving tabindex

**[JS]** A toolbar with 4 buttons, or a grid with 64, should not cost 64 Tab presses. The common pattern: one button has `tabindex="0"` (Tab stops there), every other one `-1`. Arrow keys move both the `0` and the focus:

```
2) tabindex = [0 -1 -1 -1]
   ArrowRight → tabindex = [-1 0 -1 -1] · focus = BUTTON "upper"
   End        → tabindex = [-1 -1 -1 0] · focus = BUTTON "signed"
   ArrowRight → tabindex = [0 -1 -1 -1] · focus = BUTTON "group"
```

Tab leaves the group, and Shift+Tab back in returns to the button you were on.

---

## 5. Accessibility : the page also speaks

A screen reader reads the page aloud and lets the user act on it. It reads the HTML, not the pixels. Most of the work is choosing the right element; `aria-*` attributes fill the gaps.

### 5-1. Toggle buttons : `aria-pressed`

**[JS + TS]** A bit is a button that is on or off. `aria-pressed="true"` / `"false"` makes it a toggle button ("bit 4, toggle button, pressed"). Style the attribute, so the look and what is read aloud can never disagree:

```css
button[aria-pressed="true"] { background: var(--on); font-weight: 600; }
```

```ts
elButton.setAttribute("aria-pressed", String(bSet)); // a string : "true" or "false"
// elButton.ariaPressed = false;                      // TS2322 : ariaPressed is a string | null
```

### 5-2. Names : `aria-label`

**[JS]** A button that shows only `1` is read as "1, button". `aria-label="bit 4"` gives it a name. A `title` adds a mouse tooltip, but is not a reliable name.

### 5-3. Live messages : `role="status"`

**[JS]** A result appearing on the page is not read aloud unless it is in a **live region**. `role="status"` (polite: it waits for the reader to finish) on an element, and changing its text, announces it:

```
3) click group → pressed : [group] · status : "group on"
```

DevCalc puts `0xA5 = 0xA5` in a visually hidden `role="status"` paragraph after each calculation. `.sr-only` hides it from the eyes, not from screen readers.

### 5-4. `<details>` : a panel with no code

**[JS]** `<details><summary>Help</summary>…</details>` opens and closes by mouse, Enter and Space, and is read as "Help, collapsed". The `toggle` event comes a moment *after* `open` changes:

```
4) right after open = true : toggle heard = false
   after await : toggle heard = true, open = true
```

> Accessibility is not a separate feature. Every rule in this section also helps keyboard users, people on a phone, and your own tests: `getByRole("button", { name: "bit 4" })` works only when the button has a name.

---

## 6. Try it

Open http://127.0.0.1:5173/lessons/14-events-accessibility/ (or `?ko`). The page runs the four files and then waits for you.

### [propagation.ts](propagation.ts) — phases, target vs currentTarget, delegation, stopPropagation, await

```
1) outer(1) → inner(1) → leaf(2) → inner(3) → outer(3)
1) outer(1) → inner(2) → inner(2) → outer(3)
2) delegation : one listener on the menu
   target = BUTTON · currentTarget = UL#menu · instanceof → copy · closest → copy
   target = SPAN · currentTarget = UL#menu · instanceof → missed · closest → copy
3) a button added after the listener :
   target = BUTTON · currentTarget = UL#menu · instanceof → paste · closest → paste
4) 2 clicks, the second with stopPropagation : the parent heard 1
5) before await : BUTTON#late · after await : null
   Expected error: TypeError: Cannot read properties of null (reading 'id')
   Why : the event finished travelling at the await, so the browser cleared currentTarget. as HTMLButtonElement hid the null.
   Fix : copy currentTarget (or the values you need) into a const before the first await.
   now click inside the boxes and the menu yourself
```

The second line `1)` clicks `inner` itself: its two listeners both run in the target phase (2).

Things to try:

- Remove the `//` in front of `Log(oEvent.currentTarget.id);` → TS18047 `'oEvent.currentTarget' is possibly 'null'`.
- Click the text inside a menu button, then the button's edge → `target` changes, `closest` finds the same button.
- In section 1, delete `, { capture: true }` from the first listener → the first line becomes `leaf(2) → inner(3) → inner(3) → outer(3) → outer(3)`: nobody hears the way down.

### [keyboard.ts](keyboard.ts) — key vs code, a shortcut table, Ctrl+K, the IME, cancelable

```
4) key vs code : the same physical key
   a          code = KeyA       → not a shortcut : the browser types it
   Shift+A    code = KeyA       → not a shortcut : the browser types it
   ㅁ          code = KeyA       → not a shortcut : the browser types it
5) the shortcut table
   ArrowUp    code = ArrowUp    → recall [2] "popcount(mask)"
   ArrowUp    code = ArrowUp    → recall [1] "mask = 0xFF00"
   ArrowDown  code = ArrowDown  → recall [2] "popcount(mask)"
   Enter      code = Enter      → run "popcount(mask)"
   Escape     code = Escape     → cleared the box
6) Ctrl+K, and Enter while the IME is composing
   Ctrl+k     code = KeyK       → cleared · defaultPrevented = true
   Enter      code = Enter      → ignored : the IME is still composing (this Enter only finishes the syllable)
7) the same Ctrl+K, made with new KeyboardEvent() only
   Ctrl+k     code = KeyK       → cleared · defaultPrevented = false
   Expected problem: preventDefault() was called, but defaultPrevented = false
   Why : this KeyboardEvent was made without cancelable: true, so preventDefault() did nothing.
   Fix : pass { cancelable: true } when you make events in tests. Events from real keys are cancelable.
   now click the box and press the keys yourself
```

Things to try:

- Remove the `//` in front of `const eTypo: EShortcut = "Esc";` → TS2322 `Type '"Esc"' is not assignable to type 'EShortcut'`.
- Delete the `ArrowDown` row from `SHORTCUTS` → TS2741: the table no longer covers every `EShortcut`.
- Click the box, switch to Korean input, type `한` and press Enter → the log says "ignored" first; the next Enter runs.
- Change `const Handle = (…) => {` to `function Handle(…) {` → TS18047 on `elInput` (section 3-5).

### [focus.ts](focus.ts) — focusin, roving tabindex, aria-pressed, role=status, details, a focusable div

```
1) focus a button inside : the toolbar heard "focus" 0, "focusin" 1 · activeElement = BUTTON "group"
2) tabindex = [0 -1 -1 -1]
   ArrowRight → tabindex = [-1 0 -1 -1] · focus = BUTTON "upper"
   ArrowRight → tabindex = [-1 -1 0 -1] · focus = BUTTON "prefix"
   End        → tabindex = [-1 -1 -1 0] · focus = BUTTON "signed"
   ArrowRight → tabindex = [0 -1 -1 -1] · focus = BUTTON "group"
   ArrowLeft  → tabindex = [-1 -1 -1 0] · focus = BUTTON "signed"
3) click group → pressed : [group] · status : "group on"
3) click prefix → pressed : [group, prefix] · status : "prefix on"
3) click group → pressed : [prefix] · status : "group off"
4) right after open = true : toggle heard = false
   after await : toggle heard = true, open = true
5) Expected problem: after elPlain.focus(), activeElement is still BUTTON "group"
   Why : only controls (button, input, a href ...) and elements with tabindex can take focus. Others ignore focus().
   Fix : use a real <button> for things users press. For focus from code only, add tabindex="-1".
   with tabindex="-1" → activeElement = DIV#plain
   now press Tab into the toolbar, then the arrow keys, Enter and Space
```

Things to try:

- Remove the `//` in front of `elButton.ariaPressed = false;` → TS2322 `Type 'boolean' is not assignable to type 'string'`.
- Press Tab from the top of the page → one stop in the toolbar, not four. Then Shift+Tab out and Tab back in.
- Windows: turn on Narrator (Ctrl+Win+Enter) and press a toolbar button → "group, toggle button, pressed", then "group on".

---

## 7. Build it — a 16-bit grid

[bitgrid.ts](bitgrid.ts) puts sections 2–5 together: 16 buttons, one per bit, in a class with `#private` fields (lesson 05).

```ts
function ToggleBit(biValue: bigint, nBit: number): bigint {
	return biValue ^ (1n << BigInt(nBit)); // pure : no DOM, easy to test
}

class CBitGrid {
	readonly #elGrid: HTMLElement;
	readonly #arrButton: HTMLButtonElement[] = []; // [0] is bit 15 (left), the last is bit 0 (right)
	#biValue = 0n;

	constructor(elGrid: HTMLElement, fnChange: (biValue: bigint) => void) {
		// 16 × <button type="button" data-bit="n" aria-label="bit n">
		elGrid.addEventListener("click", (oEvent) => this.#OnClick(oEvent));     // delegation : 2 listeners for 16 buttons
		elGrid.addEventListener("keydown", (oEvent) => this.#OnKeyDown(oEvent));
		this.#Focusable(0);                                                       // roving tabindex
	}

	SetValue(biValue: bigint): void {
		if (biValue < 0n || biValue >= 1n << BigInt(GRID_BITS)) {
			throw new RangeError(`${Hex(biValue)} does not fit in ${GRID_BITS} bits`); // check first, change after
		}
		this.#biValue = biValue;
		this.#Render(); // the only place that writes to the buttons : textContent and aria-pressed
		…
	}
}
```

- **One direction**: a click computes a new value and calls `SetValue`; `SetValue` renders. The buttons never hold the truth, so they can't disagree with it.
- Arrow keys come from a `Map` of moves (Left / Right ±1, Up / Down ±8 = one row, Home, End). Enter and Space are not in it: a real key press on a `<button>` already clicks it.

### Run it

```
6) click bit  0 → 0x0001 · 0000 0000 0000 0001
6) click bit  4 → 0x0011 · 0000 0000 0001 0001
6) click bit  7 → 0x0091 · 0000 0000 1001 0001
6) click bit  4 → 0x0081 · 0000 0000 1000 0001
7) SetValue(0xF00F)  → 0xF00F · 1111 0000 0000 1111 · bit 12 aria-pressed = true
8) ArrowRight → focus = bit 14
8) ArrowRight → focus = bit 13
8) ArrowDown  → focus = bit 5
8) End        → focus = bit 0
8) ArrowRight → focus = bit 0
9) Expected error: RangeError: 0x12345 does not fit in 16 bits
   Why : 0x12345 needs 17 bits and the grid has 16. SetValue checks first, so the grid still shows 0xF00F.
   Fix : wrap it to the word size first (value & 0xFFFF), as DevCalc does with --bits.
   now click the bits, or Tab to the grid and use the arrow keys and Space
```

Things to try:

- Add `["PageDown", (nAt) => nAt + 8]` to `MOVES` → it works at once, like a new row in lesson 13's function table.
- In `SetValue`, move `this.#biValue = biValue;` above the `if` → section 9 still throws, but now says the grid shows `0x12345`, while the buttons still show `0xF00F`: value and screen disagree.
- Tab to the grid, press Space on a few bits, then ArrowDown → the focus moves one row; the value does not change.

---

## 8. DevCalc step — Lv9 bit grid and keyboard

### What changed

| File | Change |
|---|---|
| `devcalc/web/BitGrid.ts` | new: `CBitGrid` — one button per bit (8 to 128), delegated click and keydown, roving tabindex, `aria-pressed`, `aria-label`. No imports |
| `devcalc/web/App.ts` | the grid, a live preview (`Preview`), Esc / ArrowUp / ArrowDown in the box (`Recall`), history items as buttons, the help panel, `role="status"` announcements; title `Lv9` |
| `devcalc/web/index.html` | `<output id="preview">`, the Bits section, `<details id="help">`, `<p id="announce" role="status" class="sr-only">` |
| `devcalc/web/style.css` | the 16-column grid, `[aria-pressed="true"]`, `:focus-visible`, `.sr-only`, details and preview |
| `devcalc/tests/Web.test.ts` | `App.ts` imports the core and `BitGrid.ts`; `BitGrid.ts` imports nothing |

The core (`devcalc/src/core/`) did not change: everything new is in the page.

### The bit grid

Choose a word size, and the grid shows the latest result in that many bits. The grid does not keep the value. A click on bit *n* runs the expression `value ^ bit(n)` through the same `Calculate` as typing:

```ts
const oGrid = new CBitGrid(elGrid, (nBit) => {
	const oWord = CurrentWord();
	const biValue = oWord?.ToUnsigned(oHistory.Latest()?.biValue ?? 0n) ?? 0n;
	Calculate(`${ToHex(biValue)} ^ bit(${nBit})`);
});
```

So a click gets everything a typed expression gets for free: the result rows, the history (`0xA5 ^ bit(0) = 0xA4`), `ans`, the announcement, undo by clicking again. `bit(n)` is lesson 13's built-in function.

`Show(biValue, nBits)` builds new buttons only when the word size changes; otherwise it only updates `textContent` and `aria-pressed`, so the button you just clicked keeps the focus. With no word size the grid hides and says why: an unlimited number has no fixed set of bits.

### Preview while typing

The `input` event fires on every change — typing, paste, delete. `Preview` evaluates the box with a **copy** of the variables, so `mask = 0x0F; mask | 0x30` shows `= 0x3F` without creating `mask`:

```ts
function Preview(strInput: string): string {
	const mapCopy = new Map(mapVar); // nothing is kept
	…
	return oResult.bOk ? `= ${ToHex(…)}` : `… ${oResult.vError.strTitle}`;
}
```

### Keys

| Key | Where | Does |
|---|---|---|
| Enter | the box | run (the form's submit, as before) |
| Esc | the box | clear the box, the preview and the error |
| ArrowUp / ArrowDown | the box | walk the history, like the REPL; past the newest → an empty box |
| Tab | anywhere | through the page in order; the whole grid is one stop |
| Arrow keys, Home, End | the grid | move between bits |
| Space / Enter | a bit | flip it |

The box's keydown starts with `if (oEvent.isComposing) return;` (section 3-3). History items are now `<button>`s (section 4-1), handled by one delegated listener with `closest` (section 2-2).

### Help

`<details>` with the operators, `FunctionHelp()` from lesson 13, variables and the keys — filled from the same tables as the REPL's `help`, so they can't drift apart.

### Checked

The page was driven in a headless browser: the grid, preview, keys, word sizes and help.

```
grid at start (8-bit, empty history) : 00000000 · buttons 8
preview "0xF0 +" → "… Invalid expression: "0xF0 +""
preview "mask = 0x0F; mask | 0x30" → "= 0x3F"
vars after preview only : mask kept? … Invalid input: "mask"
after 0xA5 : grid 10100101 · pressed 4 · announce : 0xA5 = 0xA5 · preview : ''
click bit 0 : grid 10100100 · focus = bit 0 · history : 0xA5 = 0xA5 | 0xA5 ^ bit(0) = 0xA4
ArrowLeft x2 → focus = bit 2 · tabindex 0 count = 1
32-bit : buttons 32 · grid 00000000 00000000 00000000 10100000 · aria-label bits 31 to 0
no limit : grid hidden = true · note : Choose a word size to see the bits.
ArrowUp → box '0xA4 ^ bit(2)' preview '= 0xA0'
ArrowDown x3 → box '' (empty after the newest)
Esc while composing → box '0xZZ'
Esc → box '' · error hidden = true · preview ''
```

```
> npm test
check-pairs : 66 pairs, 0 failed
check-names : 35 files, 0 problems

 Test Files  12 passed (12)
      Tests  78 passed (78)
```

`npm run build:web` now also writes `dist/web/devcalc/web/BitGrid.js`.

Things to try:

- Choose 16-bit, type `0x1234`, and press Tab until the grid → Space on a few bits, and watch the history.
- Type `ans = 1` and look at the preview before pressing Enter.
- In `GRID_COLUMNS` and `style.css`, change 16 to 8 → ArrowUp / ArrowDown now move by 8.

---

## Summary

- **[JS]** An event travels capture → target → bubble. `target` is where it started, `currentTarget` whose listener runs — and `null` after an `await`. `stopPropagation` hides the event from every parent; avoid it.
- **[JS + TS]** Delegation: one listener on the parent, `closest()` to find the button (the click may land on a `<span>` inside), `contains()` to stay inside. Buttons made later need nothing.
- **[JS]** `key` is the meaning, `code` the place. Skip `isComposing` keys. `preventDefault` works only on cancelable events. **[TS]** A union + `satisfies Record<…>` types a shortcut table; a `const` arrow keeps narrowing that a hoisted `function` loses.
- **[JS]** Use real `<button>`s. Roving `tabindex` gives a group one Tab stop. `focusin` bubbles, `focus` doesn't.
- **[JS]** `aria-pressed`, `aria-label`, `role="status"` and `<details>` tell screen readers what the eyes see. Style `[aria-pressed]` so the two can't disagree.
- DevCalc Lv9: a bit grid (8–128 buttons, two listeners), a live preview, Esc and history keys, a help panel, announcements. The core did not change.

## Where next

[Lesson 15](../15-bundling-release/README.md) packs DevCalc into one HTML file with esbuild: no server, no install, open it from a USB stick.

---

[← Previous: 13. Function Tables and Scope](../13-functions-scope/README.md) · [Contents](../../README.md) · [Next: 15. Bundling and Build →](../15-bundling-release/README.md)
