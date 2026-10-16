[English](README.md) · **한국어**

[← 이전: 13. 함수 표와 스코프](../13-functions-scope/README.ko.md) · [목차](../../README.ko.md) · [다음: 15. 번들러와 빌드 →](../15-bundling-release/README.ko.md)

# 14. DOM 심화 — 이벤트, 키보드, 접근성

> 시리즈: DH.Study.TypeScript · 14강 (2부)
> 환경: Node.js v24 · TypeScript 7 · Vitest 5 · VS Code · 브라우저 (Edge, Chrome, Firefox)

## 목표

이 강의를 마치면 다음을 할 수 있다.

- [ ] 클릭 하나가 캡처(Capture), 타깃(Target), 버블(Bubble) 단계를 지나는 것을 따라가고, `target` 과 `currentTarget` 을 구별한다
- [ ] 위임된 리스너(Delegated listener) 하나와 `closest()` 로 많은 버튼을, 나중에 추가된 버튼까지 처리한다
- [ ] `key` 와 `code` 를 읽고, IME 에 속한 키(`isComposing`)는 건너뛰고, 단축키 표에 `satisfies` 로 타입을 붙인다
- [ ] 키보드로 포커스(Focus)를 옮기고 (로빙 탭인덱스(Roving tabindex)), 부모가 알아야 할 때는 `focusin` 을 쓴다
- [ ] 마우스 없이도, 화면 낭독기(Screen reader)로도 쓸 수 있는 페이지를 만든다: 진짜 `<button>`, `aria-pressed`, `aria-label`, `role="status"`, `<details>`
- [ ] DevCalc 의 비트 그리드(Bit grid), 실시간 미리보기(Preview), 기록 키, 도움말 패널을 쓴다

## 이 강의의 목차

1. [이벤트가 이동하는 길](#1-이벤트가-이동하는-길)
2. [위임](#2-위임)
3. [키보드](#3-키보드)
4. [포커스](#4-포커스)
5. [접근성 : 페이지가 말도 한다](#5-접근성--페이지가-말도-한다)
6. [따라하기](#6-따라하기)
7. [직접 만들기 — 16 비트 그리드](#7-직접-만들기--16-비트-그리드)
8. [DevCalc 스텝 — Lv9 비트 그리드와 키보드](#8-devcalc-스텝--lv9-비트-그리드와-키보드)
9. [정리](#정리)
10. [다음으로 갈 곳](#다음으로-갈-곳)

이 강의의 예제 파일: [index.html](index.html) · [propagation.ko.ts](propagation.ko.ts) · [keyboard.ko.ts](keyboard.ko.ts) · [focus.ko.ts](focus.ko.ts) · [bitgrid.ko.ts](bitgrid.ko.ts)

> 예제는 한국어 주석판(`x.ko.ts`)을 링크한다. 같은 코드의 영어 주석판은 `x.ts` 다. 페이지 주소 끝에 `?ko` 를 붙이면 한국어 주석판을 불러온다.

> 문법 표시: **[JS]** = JavaScript 문법 (TS 없이도 있음) · **[TS]** = TypeScript 가 더한 타입 문법 (지우면 JS) · 자세한 구분은 [00강 7-3](../00-setup/README.ko.md#7-3-ts-문법--js-문법--타입-문법)

07강에서 DevCalc 를 브라우저에 올렸다: 폼(Form), submit 이벤트, 복사 버튼들을 위한 위임된 리스너 하나. 식을 끝까지 입력하고 Enter 를 누르는 마우스 사용자에게는 그걸로 충분하다. 개발자가 하루 종일 켜 두는 계산기에는 더 필요하다: 클릭 한 번으로 비트 하나 뒤집기, 입력하는 동안 결과 보기, ArrowUp 으로 직전 식 다시 부르기, 그리고 이 모두를 마우스 없이 하기. 강의 끝에는 이렇게 된다:

```
DevCalc Lv9 · web          (워드 크기 8-bit)

0xA5
= 0xA5                     ← 입력하는 동안 보이는 미리보기

Bits
[1][0][1][0] [0][1][0][1]  ← 비트 0 클릭 → "0xA5 ^ bit(0)" → 0xA4
```

이 강의는 브라우저에서 실행한다. 개발 서버(Dev server)를 한 번 켜 두고 계속 둔다:

```
> npm run web
http://127.0.0.1:5173/lessons/14-events-accessibility/?ko   ← 예제 (?ko : 한국어 주석판)
http://127.0.0.1:5173/devcalc/web/                          ← DevCalc
```

각 예제는 결과를 페이지와 개발자 도구 콘솔(DevTools console, F12)에 쓴다. `node` 로 실행하면 여는 방법만 출력한다. 출력은 영어 그대로다.

---

## 1. 이벤트가 이동하는 길

### 1-1. 캡처, 타깃, 버블

**[JS]** 버튼을 클릭해도 일이 버튼에서만 일어나지 않는다. 이벤트는 세 단계로 이동한다:

```
window → document → … → outer → inner        캡처  (eventPhase 1, 위에서 아래로)
                                  leaf        타깃  (eventPhase 2)
window ← document ← … ← outer ← inner        버블  (eventPhase 3, 아래에서 위로)
```

`addEventListener("click", fn)` 은 버블 단계에서 듣는다. `addEventListener("click", fn, { capture: true })` 는 내려가는 길에서 듣는다. [propagation.ko.ts](propagation.ko.ts) 는 겹친 상자 세 개에 둘 다 달고 가장 안쪽을 클릭한다:

```
1) outer(1) → inner(1) → leaf(2) → inner(3) → outer(3)
```

대부분의 코드는 버블만 있으면 된다. 캡처는 부모가 이벤트를 먼저 봐야 하는 드문 경우를 위한 것이다 (예: 대화상자가 열린 동안 클릭 막기).

### 1-2. `target` 과 `currentTarget`

**[JS]** 두 속성은 서로 다른 질문에 답한다:

| | 뜻 | 버튼 안의 `<span>` 을 클릭했을 때 `#menu` 의 리스너에서 |
|---|---|---|
| `target` | 이벤트가 시작된 곳 | `<span>` |
| `currentTarget` | 지금 실행 중인 리스너의 주인 | `#menu` |

**[TS]** `currentTarget` 의 타입은 `EventTarget | null` 이고, 그 `null` 은 정말 일어난다: 브라우저는 리스너가 실행되는 동안에만 값을 넣어 둔다. `await` 뒤에는 이벤트가 이동을 마친 뒤라 `currentTarget` 이 `null` 이다:

```ts
elLate.addEventListener("click", async (oEvent) => {
	const elBefore = oEvent.currentTarget as HTMLButtonElement; // 첫 await 전에 읽기 : 괜찮다
	await Promise.resolve();                                    // 예: await navigator.clipboard.writeText(...)
	const elAfter = oEvent.currentTarget as HTMLButtonElement;  // as 가 TS 에게서 null 을 숨긴다
	Log(elAfter.id);                                            // TypeError : 이제 currentTarget 은 null
});
```

```
5) before await : BUTTON#late · after await : null
   Expected error: TypeError: Cannot read properties of null (reading 'id')
```

필요한 것은 첫 `await` 전에 `const` 에 복사해 둔다. 07강의 복사 버튼이 `strText` 로 바로 그렇게 한다.

### 1-3. `stopPropagation`

**[JS]** `oEvent.stopPropagation()` 은 이동을 끝낸다: 어떤 부모도 이벤트를 듣지 못한다. 깔끔해 보이지만 조용한 버그를 만든다. 위쪽의 위임된 리스너 — 메뉴, 클릭 기록, "바깥을 클릭하면 팝업 닫기" — 도 모두 놓치기 때문이다:

```
4) 2 clicks, the second with stopPropagation : the parent heard 1
```

자식에서 이벤트를 멈추기보다 부모에서 `target` 을 확인하는 쪽을 택한다.

---

## 2. 위임

### 2-1. 많은 자식에 리스너 하나

**[JS]** 07강에서 위임(Delegation)을 소개했다: 버튼마다 하나가 아니라 부모에 리스너 하나. 최대 128 개 버튼이 있는 비트 그리드에서 그 두 장점이 드러난다:

- 버튼이 몇 개든 **리스너는 하나**;
- **나중에 만든 버튼에는 아무것도 필요 없다**: 워드 크기가 바뀌어 그리드를 다시 만들어도 리스너를 더하지 않는다.

```
3) a button added after the listener :
   target = BUTTON · currentTarget = UL#menu · instanceof → paste · closest → paste
```

### 2-2. `instanceof` 대신 `closest()`

**[JS + TS]** `target` 은 클릭된 가장 안쪽 요소다. 버튼 안에 아이콘이나 `<span>` 이 있으면 `target` 은 그 `<span>` 이고, `oEvent.target instanceof HTMLButtonElement` 같은 검사는 놓친다:

```
   target = SPAN · currentTarget = UL#menu · instanceof → missed · closest → copy
```

`closest(selector)` 는 그 요소(자기 자신 포함)부터 위로 올라가며 처음 맞는 것을 찾는다:

```ts
const elButton = oEvent.target instanceof Element
	? oEvent.target.closest<HTMLButtonElement>("button[data-cmd]")
	: null;
if (elButton !== null && elMenu.contains(elButton)) {
	Run(elButton.dataset["cmd"]);
}
```

- `oEvent.target instanceof Element` 는 `EventTarget | null` 을 좁혀서(Narrowing) `closest` 를 쓸 수 있게 한다 (TS).
- `closest<HTMLButtonElement>(…)` 는 `HTMLButtonElement | null` 을 반환한다. 타입 인자는 `querySelector<…>` (07강) 처럼 여러분의 약속이다.
- `contains` 는 찾는 범위를 메뉴 안으로 묶는다: `closest` 는 메뉴를 *둘러싼* 버튼도 찾아낼 수 있다.

---

## 3. 키보드

### 3-1. `key` 와 `code`

**[JS]** `keydown` 이벤트는 키의 이름을 두 가지로 준다:

| | 뜻 | `a` | Shift+`a` | 한글 자판에서 `a` |
|---|---|---|---|---|
| `key` | 문자 또는 키 이름 | `"a"` | `"A"` | `"ㅁ"` |
| `code` | 키보드 위의 자리 | `"KeyA"` | `"KeyA"` | `"KeyA"` |

의미에는 `key` 를 쓴다 (`"Enter"`, `"Escape"`, `"ArrowUp"`, 입력된 글자). Ctrl 과 함께 쓰는 단축키에는 `code` 를 써서 자판 배열과 상관없이 Ctrl+K 가 동작하게 한다:

```ts
if ((oEvent.ctrlKey || oEvent.metaKey) && oEvent.code === "KeyK") { … } // metaKey : macOS 의 ⌘
```

### 3-2. 타입 있는 단축키 표

**[TS]** 13강의 표는 키에도 쓸 수 있다. 유니온이 키 이름을 정하고, `satisfies` 가 모든 키에 처리 함수가 있는지, 엉뚱한 키가 끼어들지 않았는지 검사한다:

```ts
type EShortcut = "Enter" | "Escape" | "ArrowUp" | "ArrowDown";

const SHORTCUTS = {
	Enter: () => `run "${elInput.value}"`,
	Escape: () => { elInput.value = ""; return "cleared the box"; },
	ArrowUp: () => …,
	ArrowDown: () => …,
} satisfies Record<EShortcut, () => string>;

function IsShortcut(strKey: string): strKey is EShortcut {
	return Object.hasOwn(SHORTCUTS, strKey); // in 이 아니다 : 13강 2-2
}
```

`ArrowDown` 을 빼면 TS2741 이 빠진 키를 알려 준다. 키 이름을 틀리면 (`"Esc"`) TS2322 가 막는다 — 브라우저는 `"Escape"` 라고 하니 실제로 자주 빠지는 함정이다.

### 3-3. IME : `isComposing`

**[JS]** 한국어, 일본어, 중국어 입력은 IME (입력기, Input method editor) 를 거친다. 글자를 조합하는 동안 키는 IME 의 것이다: `한` 을 완성하는 Enter 도 `key = "Enter"` 인 `keydown` 을 일으킨다. 검사가 없으면 계산기가 반쯤 입력된 식을 실행한다. Enter 에 반응하는 keydown 처리 함수의 첫 줄:

```ts
if (oEvent.isComposing) {
	return; // IME 가 아직 조합 중 : 이 Enter 는 글자를 완성할 뿐이다
}
```

```
6) Ctrl+K, and Enter while the IME is composing
   Ctrl+k     code = KeyK       → cleared · defaultPrevented = true
   Enter      code = Enter      → ignored : the IME is still composing (this Enter only finishes the syllable)
```

### 3-4. `preventDefault` 는 취소 가능한 이벤트에만

**[JS]** `preventDefault()` 는 브라우저의 기본 동작을 막는다: ArrowUp 이 커서를 입력란 맨 앞으로 옮기는 것, Ctrl+K 가 검색창을 여는 것. 실제 키에서 온 이벤트는 취소할 수 있다(Cancelable). `new KeyboardEvent(…)` 로 만든 이벤트는 따로 말하지 않으면 취소할 수 없다 — 테스트에서 흔히 놀라는 부분이다:

```
7) the same Ctrl+K, made with new KeyboardEvent() only
   Expected problem: preventDefault() was called, but defaultPrevented = false
```

코드로 이벤트를 만들 때는 `{ bubbles: true, cancelable: true }` 를 넘긴다. 그래도 글자가 입력되지는 않는다 (`isTrusted` 가 `false`): 글자는 실제 키만 입력한다.

### 3-5. 함수 선언과 좁히기

**[TS]** [keyboard.ko.ts](keyboard.ko.ts) 의 함정 하나 더. `if (!(elInput instanceof HTMLInputElement)) return;` 다음부터 `elInput` 은 `HTMLInputElement` 다 — 하지만 그 아래 `function` 선언 안에서는 아니다. 선언은 끌어올려지므로(13강 3-2) 검사보다 먼저 실행될 수 있고, 그래서 TS 는 좁힌 결과를 잊는다 (TS18047 `'elInput' is possibly 'null'`). `const` 화살표 함수는 그 줄보다 먼저 실행될 수 없으니 좁힌 결과가 유지된다:

```ts
const Handle = (oEvent: KeyboardEvent): string => { … elInput.value … }; // OK
```

---

## 4. 포커스

### 4-1. 무엇이 포커스를 받는가

**[JS]** 키보드 사용자는 Tab 으로 이동한다. Tab 은 컨트롤 — `<button>`, `<input>`, `<select>`, `<a href>`, … — 과 `tabindex="0"` 이 있는 요소에서 멈춘다. 클릭 리스너가 달린 `<div>` 는 버튼처럼 보여도 키보드에게는 보이지 않는다. 그 위의 `focus()` 는 아무 일도 하지 않고, 아무 말도 하지 않는다:

```
5) Expected problem: after elPlain.focus(), activeElement is still BUTTON "group"
   with tabindex="-1" → activeElement = DIV#plain
```

| `tabindex` | Tab 이 멈추나? | `focus()` 가 되나? |
|---|---|---|
| (없음, 컨트롤) | 예 | 예 |
| (없음, `<div>`) | 아니오 | 아니오 |
| `0` | 예, 페이지 순서대로 | 예 |
| `-1` | 아니오 | 예 |
| `1`, `2`, … | 예, 다른 모든 것보다 먼저 | 예 — 피한다: 페이지 순서를 깨뜨린다 |

규칙: 사용자가 누르는 것이면 `<button type="button">` 으로 만든다. 그러면 Enter 와 Space 가 공짜로 클릭이 된다.

### 4-2. `focus` 와 `focusin`

**[JS]** `focus` 와 `blur` 는 버블되지 않고, `focusin` 과 `focusout` 은 버블된다. 자기 버튼 중 하나라도 포커스를 받는 순간을 알고 싶은 툴바는 `focusin` 을 듣는다:

```
1) focus a button inside : the toolbar heard "focus" 0, "focusin" 1 · activeElement = BUTTON "group"
```

`document.activeElement` 는 지금 포커스를 가진 요소다.

### 4-3. 로빙 탭인덱스

**[JS]** 버튼 4 개짜리 툴바, 64 개짜리 그리드에 Tab 을 64 번 누르게 하면 안 된다. 흔히 쓰는 방법: 버튼 하나만 `tabindex="0"` (Tab 이 거기서 멈춤), 나머지는 모두 `-1`. 화살표 키가 `0` 과 포커스를 함께 옮긴다:

```
2) tabindex = [0 -1 -1 -1]
   ArrowRight → tabindex = [-1 0 -1 -1] · focus = BUTTON "upper"
   End        → tabindex = [-1 -1 -1 0] · focus = BUTTON "signed"
   ArrowRight → tabindex = [0 -1 -1 -1] · focus = BUTTON "group"
```

Tab 은 그룹을 떠나고, Shift+Tab 으로 다시 들어오면 있던 버튼으로 돌아온다.

---

## 5. 접근성 : 페이지가 말도 한다

화면 낭독기는 페이지를 소리 내어 읽고, 사용자가 그 위에서 동작하게 해 준다. 읽는 것은 픽셀이 아니라 HTML 이다. 일의 대부분은 알맞은 요소를 고르는 것이고, `aria-*` 속성은 빈 곳을 채운다.

### 5-1. 토글 버튼 : `aria-pressed`

**[JS + TS]** 비트는 켜지거나 꺼지는 버튼이다. `aria-pressed="true"` / `"false"` 가 버튼을 토글 버튼으로 만든다 ("bit 4, 토글 버튼, 눌림"). 스타일도 그 속성에 건다. 그러면 보이는 모습과 읽어 주는 내용이 서로 다를 수 없다:

```css
button[aria-pressed="true"] { background: var(--on); font-weight: 600; }
```

```ts
elButton.setAttribute("aria-pressed", String(bSet)); // 문자열 : "true" 또는 "false"
// elButton.ariaPressed = false;                      // TS2322 : ariaPressed 는 string | null
```

### 5-2. 이름 : `aria-label`

**[JS]** `1` 만 보이는 버튼은 "1, 버튼" 으로 읽힌다. `aria-label="bit 4"` 가 이름을 준다. `title` 은 마우스 툴팁을 더하지만 믿을 만한 이름은 아니다.

### 5-3. 실시간 알림 : `role="status"`

**[JS]** 페이지에 결과가 나타나도 **라이브 영역(Live region)** 에 있지 않으면 읽어 주지 않는다. 요소에 `role="status"` (정중한 알림: 낭독기가 읽던 것을 마친 뒤 읽음) 를 달고 그 글자를 바꾸면 알려 준다:

```
3) click group → pressed : [group] · status : "group on"
```

DevCalc 는 계산할 때마다 눈에는 보이지 않는 `role="status"` 문단에 `0xA5 = 0xA5` 를 넣는다. `.sr-only` 는 눈에게서만 숨기고, 화면 낭독기에게서는 숨기지 않는다.

### 5-4. `<details>` : 코드 없는 패널

**[JS]** `<details><summary>Help</summary>…</details>` 는 마우스, Enter, Space 로 열고 닫히며 "Help, 접힘" 으로 읽힌다. `toggle` 이벤트는 `open` 이 바뀌고 *조금 뒤에* 온다:

```
4) right after open = true : toggle heard = false
   after await : toggle heard = true, open = true
```

> 접근성은 따로 붙이는 기능이 아니다. 이 절의 규칙은 키보드 사용자, 휴대폰 사용자, 그리고 여러분의 테스트에도 도움이 된다: `getByRole("button", { name: "bit 4" })` 는 버튼에 이름이 있어야만 동작한다.

---

## 6. 따라하기

http://127.0.0.1:5173/lessons/14-events-accessibility/?ko 를 연다. 페이지가 네 파일을 실행한 뒤 여러분을 기다린다.

### [propagation.ko.ts](propagation.ko.ts) — 단계, target 과 currentTarget, 위임, stopPropagation, await

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

두 번째 `1)` 줄은 `inner` 자체를 클릭한 것이다: inner 의 리스너 두 개가 모두 타깃 단계(2)에서 실행된다.

해 볼 것:

- `Log(oEvent.currentTarget.id);` 앞의 `//` 를 지우면 → TS18047 `'oEvent.currentTarget' is possibly 'null'`.
- 메뉴 버튼 안의 글자를 클릭하고, 이어서 버튼 가장자리를 클릭해 본다 → `target` 은 바뀌고, `closest` 는 같은 버튼을 찾는다.
- 1) 절에서 첫 번째 리스너의 `, { capture: true }` 를 지우면 → 첫 줄이 `leaf(2) → inner(3) → inner(3) → outer(3) → outer(3)` 이 된다: 내려가는 길은 아무도 듣지 않는다.

### [keyboard.ko.ts](keyboard.ko.ts) — key 와 code, 단축키 표, Ctrl+K, IME, cancelable

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

해 볼 것:

- `const eTypo: EShortcut = "Esc";` 앞의 `//` 를 지우면 → TS2322 `Type '"Esc"' is not assignable to type 'EShortcut'`.
- `SHORTCUTS` 에서 `ArrowDown` 행을 지우면 → TS2741: 표가 더 이상 모든 `EShortcut` 을 덮지 못한다.
- 입력란을 클릭하고 한글 입력으로 바꿔 `한` 을 입력한 뒤 Enter 를 누른다 → 기록에 먼저 "ignored" 가 찍히고, 다음 Enter 가 실행된다.
- `const Handle = (…) => {` 를 `function Handle(…) {` 로 바꾸면 → `elInput` 에 TS18047 (3-5 절).

### [focus.ko.ts](focus.ko.ts) — focusin, 로빙 탭인덱스, aria-pressed, role=status, details, 포커스 가능한 div

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

해 볼 것:

- `elButton.ariaPressed = false;` 앞의 `//` 를 지우면 → TS2322 `Type 'boolean' is not assignable to type 'string'`.
- 페이지 맨 위에서 Tab 을 눌러 본다 → 툴바에서 네 번이 아니라 한 번 멈춘다. Shift+Tab 으로 나갔다가 Tab 으로 다시 들어와 본다.
- Windows: 내레이터(Narrator, Ctrl+Win+Enter) 를 켜고 툴바 버튼을 누른다 → "group, 토글 버튼, 눌림", 이어서 "group on".

---

## 7. 직접 만들기 — 16 비트 그리드

[bitgrid.ko.ts](bitgrid.ko.ts) 는 2~5 절을 한데 모은다: 비트마다 하나씩 버튼 16 개를, `#private` 필드(05강)가 있는 클래스에 담는다.

```ts
function ToggleBit(biValue: bigint, nBit: number): bigint {
	return biValue ^ (1n << BigInt(nBit)); // 순수 함수 : DOM 이 없어 테스트하기 쉽다
}

class CBitGrid {
	readonly #elGrid: HTMLElement;
	readonly #arrButton: HTMLButtonElement[] = []; // [0] 이 비트 15 (왼쪽), 마지막이 비트 0 (오른쪽)
	#biValue = 0n;

	constructor(elGrid: HTMLElement, fnChange: (biValue: bigint) => void) {
		// <button type="button" data-bit="n" aria-label="bit n"> × 16
		elGrid.addEventListener("click", (oEvent) => this.#OnClick(oEvent));     // 위임 : 버튼 16 개에 리스너 2 개
		elGrid.addEventListener("keydown", (oEvent) => this.#OnKeyDown(oEvent));
		this.#Focusable(0);                                                       // 로빙 탭인덱스
	}

	SetValue(biValue: bigint): void {
		if (biValue < 0n || biValue >= 1n << BigInt(GRID_BITS)) {
			throw new RangeError(`${Hex(biValue)} does not fit in ${GRID_BITS} bits`); // 먼저 검사, 바꾸기는 그 뒤
		}
		this.#biValue = biValue;
		this.#Render(); // 버튼에 쓰는 유일한 곳 : textContent 와 aria-pressed
		…
	}
}
```

- **한 방향**: 클릭은 새 값을 계산해 `SetValue` 를 부르고, `SetValue` 가 그린다. 버튼은 진짜 값을 갖고 있지 않으니 값과 어긋날 수 없다.
- 화살표 키는 이동 방법을 담은 `Map` 에서 온다 (Left / Right ±1, Up / Down ±8 = 한 줄, Home, End). Enter 와 Space 는 없다: `<button>` 위에서 실제 키를 누르면 이미 클릭이 된다.

### 실행해 보기

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

해 볼 것:

- `MOVES` 에 `["PageDown", (nAt) => nAt + 8]` 을 더하면 → 바로 동작한다. 13강 함수 표에 행 하나를 더한 것과 같다.
- `SetValue` 에서 `this.#biValue = biValue;` 를 `if` 위로 옮기면 → 9) 는 여전히 예외를 던지지만, 이제 그리드가 `0x12345` 를 보여 준다고 말한다. 버튼은 아직 `0xF00F` 인데: 값과 화면이 어긋난다.
- Tab 으로 그리드에 들어가 몇 개 비트에서 Space 를 누른 뒤 ArrowDown → 포커스는 한 줄 내려가고, 값은 바뀌지 않는다.

---

## 8. DevCalc 스텝 — Lv9 비트 그리드와 키보드

### 바뀐 것

| 파일 | 변경 |
|---|---|
| `devcalc/web/BitGrid.ts` | 새 파일: `CBitGrid` — 비트마다 버튼 하나 (8~128 개), 위임된 click 과 keydown, 로빙 탭인덱스, `aria-pressed`, `aria-label`. import 없음 |
| `devcalc/web/App.ts` | 그리드, 실시간 미리보기 (`Preview`), 입력란의 Esc / ArrowUp / ArrowDown (`Recall`), 버튼이 된 기록 항목, 도움말 패널, `role="status"` 알림. 제목 `Lv9` |
| `devcalc/web/index.html` | `<output id="preview">`, Bits 영역, `<details id="help">`, `<p id="announce" role="status" class="sr-only">` |
| `devcalc/web/style.css` | 16 열 그리드, `[aria-pressed="true"]`, `:focus-visible`, `.sr-only`, details 와 미리보기 |
| `devcalc/tests/Web.test.ts` | `App.ts` 는 코어와 `BitGrid.ts` 를 import, `BitGrid.ts` 는 아무것도 import 하지 않음 |

코어(`devcalc/src/core/`)는 바뀌지 않았다: 새로운 것은 모두 페이지에 있다.

### 비트 그리드

워드 크기를 고르면 그리드가 마지막 결과를 그 비트 수로 보여 준다. 그리드는 값을 갖고 있지 않다. 비트 *n* 을 클릭하면 입력할 때와 같은 `Calculate` 로 식 `value ^ bit(n)` 을 실행한다:

```ts
const oGrid = new CBitGrid(elGrid, (nBit) => {
	const oWord = CurrentWord();
	const biValue = oWord?.ToUnsigned(oHistory.Latest()?.biValue ?? 0n) ?? 0n;
	Calculate(`${ToHex(biValue)} ^ bit(${nBit})`);
});
```

그래서 클릭은 입력한 식이 얻는 모든 것을 공짜로 얻는다: 결과 행, 기록 (`0xA5 ^ bit(0) = 0xA4`), `ans`, 알림, 한 번 더 클릭하면 되돌리기. `bit(n)` 은 13강의 내장 함수다.

`Show(biValue, nBits)` 는 워드 크기가 바뀔 때만 버튼을 새로 만들고, 아니면 `textContent` 와 `aria-pressed` 만 고친다. 그래서 방금 클릭한 버튼이 포커스를 잃지 않는다. 워드 크기가 없으면 그리드는 숨고 이유를 말한다: 크기 제한이 없는 수에는 정해진 비트 개수가 없다.

### 입력하는 동안 미리보기

`input` 이벤트는 바뀔 때마다 — 입력, 붙여넣기, 지우기 — 일어난다. `Preview` 는 변수의 **복사본**으로 입력란을 계산하므로, `mask = 0x0F; mask | 0x30` 은 `mask` 를 만들지 않고 `= 0x3F` 를 보여 준다:

```ts
function Preview(strInput: string): string {
	const mapCopy = new Map(mapVar); // 아무것도 남기지 않는다
	…
	return oResult.bOk ? `= ${ToHex(…)}` : `… ${oResult.vError.strTitle}`;
}
```

### 키

| 키 | 어디서 | 하는 일 |
|---|---|---|
| Enter | 입력란 | 실행 (전과 같이 폼의 submit) |
| Esc | 입력란 | 입력란, 미리보기, 오류를 지움 |
| ArrowUp / ArrowDown | 입력란 | REPL 처럼 기록을 오감. 가장 최근을 지나면 → 빈 입력란 |
| Tab | 어디서나 | 페이지 순서대로 이동. 그리드 전체가 한 번의 멈춤 |
| 화살표 키, Home, End | 그리드 | 비트 사이를 이동 |
| Space / Enter | 비트 | 그 비트를 뒤집음 |

입력란의 keydown 은 `if (oEvent.isComposing) return;` 으로 시작한다 (3-3 절). 기록 항목은 이제 `<button>` 이고 (4-1 절), `closest` 를 쓰는 위임된 리스너 하나가 처리한다 (2-2 절).

### 도움말

`<details>` 안에 연산자, 13강의 `FunctionHelp()`, 변수, 키를 담는다 — REPL 의 `help` 와 같은 표에서 채우므로 둘이 어긋날 수 없다.

### 확인

헤드리스 브라우저(Headless browser)로 페이지를 직접 조작해 확인했다: 그리드, 미리보기, 키, 워드 크기, 도움말.

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

`npm run build:web` 은 이제 `dist/web/devcalc/web/BitGrid.js` 도 만든다.

해 볼 것:

- 16-bit 를 고르고 `0x1234` 를 입력한 뒤 Tab 으로 그리드까지 간다 → 몇 개 비트에서 Space 를 누르고 기록을 본다.
- `ans = 1` 을 입력하고 Enter 를 누르기 전에 미리보기를 본다.
- `GRID_COLUMNS` 와 `style.css` 의 16 을 8 로 바꾸면 → ArrowUp / ArrowDown 이 8 칸씩 움직인다.

---

## 정리

- **[JS]** 이벤트는 캡처 → 타깃 → 버블로 이동한다. `target` 은 시작된 곳, `currentTarget` 은 지금 실행 중인 리스너의 주인이며 `await` 뒤에는 `null` 이다. `stopPropagation` 은 모든 부모에게서 이벤트를 숨긴다. 피한다.
- **[JS + TS]** 위임: 부모에 리스너 하나, 버튼을 찾을 때는 `closest()` (클릭이 안쪽 `<span>` 에 떨어질 수 있다), 범위 안에 머물 때는 `contains()`. 나중에 만든 버튼에는 아무것도 필요 없다.
- **[JS]** `key` 는 의미, `code` 는 자리. `isComposing` 인 키는 건너뛴다. `preventDefault` 는 취소 가능한 이벤트에서만 동작한다. **[TS]** 유니온 + `satisfies Record<…>` 로 단축키 표에 타입을 붙인다. 끌어올려지는 `function` 이 잃는 좁히기를 `const` 화살표 함수는 지킨다.
- **[JS]** 진짜 `<button>` 을 쓴다. 로빙 `tabindex` 는 그룹에 Tab 멈춤을 하나만 준다. `focusin` 은 버블되고 `focus` 는 되지 않는다.
- **[JS]** `aria-pressed`, `aria-label`, `role="status"`, `<details>` 는 눈에 보이는 것을 화면 낭독기에게 알려 준다. `[aria-pressed]` 에 스타일을 걸면 둘이 어긋날 수 없다.
- DevCalc Lv9: 비트 그리드 (버튼 8~128 개, 리스너 2 개), 실시간 미리보기, Esc 와 기록 키, 도움말 패널, 알림. 코어는 바뀌지 않았다.

## 다음으로 갈 곳

[15강](../15-bundling-release/README.ko.md) 은 esbuild 로 DevCalc 를 HTML 파일 하나로 묶는다: 서버도, 설치도 없이 USB 메모리에서 바로 연다.

---

[← 이전: 13. 함수 표와 스코프](../13-functions-scope/README.ko.md) · [목차](../../README.ko.md) · [다음: 15. 번들러와 빌드 →](../15-bundling-release/README.ko.md)
