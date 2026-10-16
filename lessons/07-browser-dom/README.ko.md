[English](README.md) · **한국어**

[← 이전: 06. 모듈과 비동기](../06-modules-async/README.ko.md) · [목차](../../README.ko.md) · [다음: 08. 고급 타입 →](../08-advanced-types/README.ko.md)

# 07. 브라우저와 DOM — 요소, 이벤트, 폼, localStorage

> 시리즈: DH.Study.TypeScript · 07강
> 환경: Node.js v24 · TypeScript 7 · VS Code · 최신 브라우저 (Edge, Chrome, Firefox)

## 목표

이 강의를 마치면 다음을 할 수 있다.

- [ ] `.ts` 파일이 브라우저에 어떻게 전달되는지 설명하고, `npm run web` 으로 이 강의의 페이지를 실행한다
- [ ] 요소(Element)를 찾고 올바른 타입을 얻는다 : 태그 이름, 제네릭(Generic), `instanceof` 확인
- [ ] `textContent` 는 안전하고 `innerHTML` 은 위험한 이유를 설명한다
- [ ] 이벤트(Event)를 듣고, TS 가 주는 이벤트 타입(`PointerEvent`, `KeyboardEvent`, `SubmitEvent` ...)을 알며, 위임(Delegation), `preventDefault`, `once`, `AbortController` 를 쓴다
- [ ] `FormData` 로 폼(Form)을 읽고, `localStorage` 에 데이터를 보관한다 (문자열만, throw 할 수 있음)
- [ ] 명령줄과 같은 `core/` 위에 DevCalc 웹 페이지(Lv4)를 만든다

## 이 강의의 목차

1. [브라우저의 TypeScript](#1-브라우저의-typescript)
2. [요소 — 찾기, 만들기, 바꾸기](#2-요소--찾기-만들기-바꾸기)
3. [이벤트](#3-이벤트)
4. [폼과 localStorage](#4-폼과-localstorage)
5. [따라하기](#5-따라하기)
6. [직접 만들기 — 진법 변환기](#6-직접-만들기--진법-변환기)
7. [DevCalc 스텝 — 웹 페이지 (Lv4)](#7-devcalc-스텝--웹-페이지-lv4)
8. [정리](#정리)

이 강의의 예제 파일: [index.html](index.html) · [elements.ko.ts](elements.ko.ts) · [events.ko.ts](events.ko.ts) · [forms.ko.ts](forms.ko.ts) · [radix.ko.ts](radix.ko.ts)

> 예제는 한국어 주석판(`x.ko.ts`)을 링크한다. 같은 코드의 영어 주석판은 `x.ts` 다. 페이지 주소 끝에 `?ko` 를 붙이면 한국어 주석판을 불러온다.

> 문법 표시: **[JS]** = JavaScript 문법 (TS 없이도 있음) · **[TS]** = TypeScript 가 더한 타입 문법 (지우면 JS) · 자세한 구분은 [00강 7-3](../00-setup/README.ko.md#7-3-ts-문법--js-문법--타입-문법)

---

## 1. 브라우저의 TypeScript

### 1-1. 브라우저는 JavaScript 만 실행한다

`node 파일.ts` 가 되는 것은 Node 가 먼저 타입을 지우기 때문이다 (00강). 브라우저는 그렇게 못 한다. 브라우저가 보기 전에 누군가 `.ts` 를 `.js` 로 바꿔야 한다.

| 방법 | 타입을 지우는 주체 | 쓰는 곳 |
|---|---|---|
| `tsc` → `dist/*.js` 를 만든 뒤 .js 를 연다 | `tsc` (00강) | 도구 없는 작은 프로젝트 |
| 요청이 올 때 바꿔 주는 개발 서버(Dev server) | 서버 | **이 강의** ([tools/serve.ts](../../tools/serve.ts)) |
| 번들러(Bundler: Vite, esbuild ...) | 번들러 | 실제 웹 앱 |

이 저장소는 새 패키지 없이 작은 개발 서버를 더했다. 브라우저가 `.ts` 파일을 요청하면 Node 자체의 `stripTypeScriptTypes()` (`node 파일.ts` 와 같은 일)로 타입을 지우고 JavaScript 를 보낸다.

```
> npm run web
Dev server running. Open in the browser:
  http://127.0.0.1:5173/lessons/07-browser-dom/      lesson 07 examples (add ?ko for Korean comments)
  http://127.0.0.1:5173/devcalc/web/                 DevCalc web
Stop : Ctrl+C
```

- `127.0.0.1` 에서만 접속을 받기 때문에 다른 컴퓨터는 접속할 수 없다. `..`, 숨김 폴더(`.git`), `node_modules` 는 거부한다.
- 포트(Port)가 이미 쓰이고 있으면 `Why : port 5173 is already in use` 라고 알려 준다. 다른 포트를 쓰자: `PORT=8080 npm run web` (bash) 또는 `$env:PORT=8080; npm run web` (PowerShell).
- import 경로가 `.ts` 를 유지하므로 (06강) 브라우저는 `.ts` 파일을 요청하고, 그것도 변환되어 온다.
- `node 파일.ts` 처럼 타입을 **지우기만** 한다. 타입 검사(Type check)는 하지 않는다. VS Code 의 빨간 줄 (또는 `npm run typecheck`) 을 검사 수단으로 쓰자.

### 1-2. 페이지가 모듈을 불러온다

```html
<script type="module" src="./App.ts"></script>
```

`type="module"` 은 파일을 ES 모듈(06강)로 만든다: `import` 와 최상위 `await` 가 되고, HTML 을 다 읽은 뒤에 실행된다. `type="module"` 이 없으면 `import` 는 문법 에러다.

### 1-3. DOM 의 타입: `lib`

`document`, `HTMLInputElement`, `localStorage` 는 JavaScript 가 아니라 브라우저 API 다. 이 타입들은 [tsconfig.json](../../tsconfig.json) 의 `lib` 에서 온다.

```jsonc
"lib": ["es2024", "DOM", "DOM.Iterable"],
```

이 강의에서 `DOM` (`document`, `HTMLElement` ...) 과 `DOM.Iterable` (`NodeList` 를 `for...of` 로 순회) 을 더했다. 같은 tsconfig 가 Node 파일도 검사하므로, 이제 `document` 는 실제로 없는 Node 코드에서도 타입 검사를 통과한다. 그래서 모든 예제는 먼저 확인한다.

```ts
if (typeof document === "undefined") {
	console.log("This example runs in the browser (it uses document).");
} else {
	RunElements();
}
```

> 큰 프로젝트는 tsconfig 를 두 개 쓴다 (웹용은 `DOM` 포함, Node 용은 제외). 그러면 Node 코드의 `document` 를 TS 가 잡아 준다. 이 과정은 단순하게 하나만 쓴다.

### 1-4. DevTools

브라우저에서 `F12`. **Console** 은 `console.log` 출력과 에러를 (`.ts` 파일 이름과 함께) 보여 주고, **Elements** 는 지금의 페이지를 보여 준다. 여기 모든 예제는 페이지의 회색 상자 *와* 콘솔 양쪽에 출력한다.

---

## 2. 요소 — 찾기, 만들기, 바꾸기

### 2-1. querySelector 는 `Element | null` 을 반환

```ts
const elTitle = document.querySelector("#title"); // Element | null
// elTitle.textContent = "x";                     // TS18047 : 'elTitle' 이 null 일 수 있음
if (elTitle !== null) {
	Log("1) #title text =", elTitle.textContent);
}
```

요소가 없을 수도 있으므로 (잘못된 id, 스크립트가 너무 일찍 실행) TS 는 먼저 `null` 확인을 요구한다 (`strictNullChecks`, 01강).

### 2-2. 올바른 요소 타입 얻기

`querySelector("#expr")` 는 `Element` 를 준다. `Element` 에는 `value` 가 없다 (TS2339). TS 는 `"#expr"` 만 보고 `<input>` 인지 알 수 없다. 알려 주는 방법은 세 가지다.

```ts
const elByTag = document.querySelector("input"); // 태그 이름 : HTMLInputElement | null
const elByGeneric = document.querySelector<HTMLInputElement>("#expr"); // 제네릭 : 타입을 개발자가 보증 (검사 없음)
const elChecked = QueryOne("#expr", HTMLInputElement); // 실행 시점에 확인 : 가장 안전
```

| 방법 | 실행 시점 확인? | 언제 |
|---|---|---|
| 태그 이름 (`"input"`, `"tr"`) | ✅ (태그가 정함) | 선택자가 태그 이름일 때 |
| 제네릭 `<HTMLInputElement>` / `as HTMLInputElement` | ❌ 개발자가 보증할 뿐 | HTML 을 직접 관리하고 단순할 때 |
| `instanceof` 확인 | ✅ | 그 밖의 모든 경우, 헬퍼 함수 안 |

클래스를 받는 제네릭 함수(05강)로 만든 헬퍼 함수:

```ts
function QueryOne<T extends Element>(strSelector: string, cType: { new (): T; prototype: T }): T {
	const elFound = document.querySelector(strSelector);
	if (!(elFound instanceof cType)) {
		throw new Error(`${strSelector} : expected ${cType.name}, found ${elFound === null ? "nothing" : elFound.tagName}`);
	}
	return elFound; // instanceof 로 T 로 좁혀짐
}
```

`{ new (): T; prototype: T }` 는 "T 를 만드는 클래스" 라는 뜻이다. `HTMLInputElement` 는 실행 시점에도 있는 진짜 클래스이므로 `instanceof` 가 동작하고 `T` 로 좁혀진다(Narrowing). 선택자가 틀리면 세 함수를 거친 뒤에 `undefined` 에러가 나는 대신, 그 자리에서 선택자가 담긴 메시지로 실패한다.

> **C#** : `obj as TextBox` / `(TextBox)obj` / `if (obj is TextBox tb)` 와 비슷하다. TS 의 `as` 는 **절대** 검사하지 않는 C# 캐스트에 가깝다: 지워지기 때문이다.

`getElementById` 는 `HTMLElement | null` 을 반환한다 (HTML 요소인 것은 확실하지만 어떤 요소인지는 모름).

### 2-3. textContent vs innerHTML

```ts
const strUserInput = "<img src=x onerror=alert(1)>";
elSafe.textContent = strUserInput; // 텍스트로 보이고, 아무것도 실행되지 않음
// elSafe.innerHTML = strUserInput; // HTML 로 해석 : onerror 코드가 실행됨 (XSS)
```

`textContent` 는 텍스트를 넣는다. `innerHTML` 은 HTML 로 해석하고, HTML 은 코드를 실행할 수 있다. 사용자 입력 (또는 URL, 저장소에서 온 모든 것) 을 `innerHTML` 에 넣지 말자. 대신 `createElement` 로 요소를 만든다.

```ts
const elRow = document.createElement("tr"); // HTMLTableRowElement (태그 이름으로)
elRow.insertCell().textContent = strLabel;
elBody.append(elRow);
```

### 2-4. 클래스, data-*, 지우기

```ts
elTitleP.classList.add("highlight"); // remove, toggle, contains 도 있음
const biValue = BigInt(elItem.dataset["value"] ?? "0"); // <li data-value="0x1234"> → "0x1234"
elRegs.lastElementChild?.remove();
```

`dataset` 은 `data-*` 속성을 읽는다. 값은 `string | undefined` (속성이 없을 수도 있음) 이므로 `?? "0"` 으로 기본값을 준다.

---

## 3. 이벤트

### 3-1. addEventListener: 이름이 타입을 정한다

```ts
elButton.addEventListener("click", (oEvent) => {
	// oEvent : PointerEvent (포인터 정보가 더해진 MouseEvent)
	Log(`1) click #${nCount} : button = ${oEvent.button}, isTrusted = ${oEvent.isTrusted}`);
	// Log(oEvent.key); // TS2339 : PointerEvent 타입에는 key 프로퍼티가 없음
});
```

TS 는 이벤트 이름을 맵(`HTMLElementEventMap`)에서 찾아 핸들러에 맞는 타입을 준다. 직접 적을 필요가 없다.

| 이벤트 이름 | 타입 |
|---|---|
| `"click"` | `PointerEvent` |
| `"keydown"`, `"keyup"` | `KeyboardEvent` (`key`, `ctrlKey` ...) |
| `"input"` | `InputEvent` (입력하는 동안 바뀔 때마다) |
| `"change"` | `Event` (값이 확정될 때, 예: 포커스가 떠날 때) |
| `"submit"` | `SubmitEvent` |

`element.click()` 과 `dispatchEvent(...)` 는 코드에서 이벤트를 발생시킨다. 예제는 직접 클릭하지 않아도 결과가 보이도록 이것을 쓴다. 이런 이벤트는 `isTrusted = false` 다.

> **C#** : `button.Click += (sender, e) => ...`. 여기서는 `addEventListener("click", (e) => ...)` 이고, 이름은 TS 가 맵과 대조하는 문자열이다.

### 3-2. 위임: 부모에 리스너 하나

```ts
elOps.addEventListener("click", (oEvent) => {
	const elTarget = oEvent.target; // EventTarget | null
	if (!(elTarget instanceof HTMLButtonElement)) {
		return; // 버튼 사이를 클릭
	}
	Log(`3) operator button : data-op = "${elTarget.dataset["op"]}"`);
});
```

이벤트는 **버블링(Bubbling)** 한다: 버튼의 클릭은 부모에게도 전달된다. 부모의 리스너 하나가 나중에 추가된 버튼까지 모든 버튼을 처리한다. `target` 은 클릭된 요소이고 타입이 `EventTarget | null` 이므로 `instanceof` 로 좁힌다.

### 3-3. preventDefault, once, AbortController

```ts
elLink.addEventListener("click", (oEvent) => oEvent.preventDefault()); // 링크가 이동하지 않음

elTest.addEventListener("click", OnClick, { once: true }); // 첫 호출 뒤 제거됨

const oController = new AbortController();
elTest.addEventListener("click", OnClick, { signal: oController.signal });
oController.abort(); // 이 signal 로 추가한 모든 리스너를 제거
```

`AbortController` / `AbortSignal` 은 06강에서 C# 의 `CancellationToken` 과 비교했던 그것이다. 같은 signal 로 `fetch` 도 취소한다: 여러 작업을 한 번에 취소하는 방법이다.

### 3-4. 사용자 정의 이벤트

```ts
document.addEventListener("devcalc:result", (oEvent) => {
	const biValue = (oEvent as CustomEvent<bigint>).detail;
});
document.dispatchEvent(new CustomEvent<bigint>("devcalc:result", { detail: 255n }));
```

TS 는 직접 만든 이벤트 이름을 모르므로 핸들러는 일반 `Event` 를 받는다. 캐스트 한 번 (`as CustomEvent<bigint>`) 로 `detail` 을 읽는다.

---

## 4. 폼과 localStorage

### 4-1. 폼 읽기

```ts
elForm.addEventListener("submit", (oEvent) => {
	oEvent.preventDefault(); // 이것이 없으면 브라우저가 페이지를 다시 읽음
	const oData = new FormData(elForm);
	const strA = FieldText(oData, "a");
	const nBits = elBits.valueAsNumber; // type="number" 의 숫자 값 (비어 있으면 NaN)
});

function FieldText(oData: FormData, strName: string): string {
	const vValue = oData.get(strName); // FormDataEntryValue | null = string | File | null
	return typeof vValue === "string" ? vValue.trim() : "";
}
```

- `submit` 은 입력란에서 Enter 를 누르거나 제출 버튼을 누를 때 발생한다. `requestSubmit()` 은 코드에서 같은 일을 한다.
- 입력 상자는 언제나 **텍스트**를 담는다. `"0xFF"` → `BigInt("0xFF")`. 잘못된 값은 `SyntaxError` 를 던지므로 잡아서 입력란을 표시한다.
- `elForm.elements.namedItem("a")` 는 `Element | RadioNodeList | null` 을 반환한다: `instanceof HTMLInputElement` 로 좁힌다.

### 4-2. localStorage

```ts
localStorage.setItem("lesson07.form", JSON.stringify(oForm)); // 문자열만
const strJson = localStorage.getItem("lesson07.form"); // string | null : null = 저장한 적 없음
```

| 요점 | 중요한 이유 |
|---|---|
| 문자열만 | 객체는 `JSON.stringify`. JSON 에는 `bigint` 가 없다 (06강) : 텍스트로 저장 |
| `getItem` 은 `string \| null` | 첫 방문에는 아무것도 없다 |
| **throw** 할 수 있다 | 개인정보 보호 설정으로 차단되거나 용량이 가득 찬 경우 (약 5 MB) : `try` 로 감싼다 |
| `JSON.parse` 는 `any` 를 반환 | 데이터가 오래됐거나 손으로 고쳐졌을 수 있다 : 확인한다 (7절) |
| 사이트(Origin)별 | `127.0.0.1:5173` 과 `127.0.0.1:8080` 은 서로 다른 저장소 |

DevTools → **Application** → Local Storage 에서 보고 고칠 수 있다.

> **C#** : 웹 사이트마다 디스크에 저장되는 작은 `Dictionary<string, string>` 같은 것이다.

---

## 5. 따라하기

서버를 시작하고 페이지를 연다.

```
npm run web
```

→ <http://127.0.0.1:5173/lessons/07-browser-dom/?ko> (`?ko` 를 빼면 영어 주석판, 코드와 출력은 같음)

각 구역은 파일 하나가 실행한다. Node 에서는 안내만 출력한다.

```
> node lessons/07-browser-dom/elements.ko.ts
This example runs in the browser (it uses document).
  npm run web  →  http://127.0.0.1:5173/lessons/07-browser-dom/
```

### [elements.ko.ts](elements.ko.ts) — 찾기, 타입, textContent, 만들기, dataset, 지우기

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

해 볼 것: TS18047 줄과 TS2339 줄의 주석을 풀어 보자. DevTools → Console 에서 `document.querySelector("#title").innerHTML = "<b>bold</b>"` 를 입력하고 `textContent` 와 비교해 보자.

### [events.ko.ts](events.ko.ts) — click, keydown, 위임, preventDefault, once / signal, 사용자 정의 이벤트

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

**Click me** 를 직접 눌러 보자: `isTrusted = true`. 텍스트 상자에서 Ctrl+Enter 를 누르면 `ctrl = true`.

해 볼 것: TS2339 줄의 주석을 풀어 보자. `oEvent.preventDefault()` 를 지우고 링크를 누르면 주소에 `#docs` 가 붙는다.

### [forms.ko.ts](forms.ko.ts) — FormData, submit, valueAsNumber, localStorage

첫 방문:

```
4) last visit : nothing saved yet
5) 0xFF & 1 (8-bit) = 0x1 / saved
5) 0xFF << 1 (8-bit) = 0xFE / saved
   Expected error: SyntaxError : Cannot convert 0xZZ to a BigInt
   Why : an input box always holds text, and BigInt() could not read it.
   Fix : type 255, 0xFF, 0b1010 or 0o17. The red outline marks the field.
7) localStorage = {"strA":"0xFF","strOp":"<<","strB":"1"}
```

새로 고치면 (`F5`) 첫 줄이 `4) last visit : 0xFF << 1` 로 바뀐다.

해 볼 것: bits 를 16 으로 바꾸고 `0xFF << 1` 을 제출해 보자 (= `0x1FE`). DevTools → Application → Local Storage 에서 `lesson07.form` 을 지우고 새로 고쳐 보자.

---

## 6. 직접 만들기 — 진법 변환기

[radix.ko.ts](radix.ko.ts) : 숫자를 입력하면 HEX / DEC / BIN 이 한 번에 보인다. 부분을 일부러 나눴다.

```ts
// 1) 모든 요소를 한 번에 확인
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

// 2) 순수 함수 : 안에 DOM 이 없음 → 테스트하기 쉬움 (09강)
function ParseNumber(strText: string): TParsed { ... }
function Radix(biValue: bigint, nBase: number, strPrefix: string): string { ... }

// 3) 페이지에 쓰는 유일한 함수
function Render(oView: IRadixView): void { ... }

// 4) "input" : 입력하는 동안 바뀔 때마다
oView.elInput.addEventListener("input", () => Render(oView));
```

`TParsed` 는 판별 유니온(Discriminated union, 03강)이다: `{ bOk: true; biValue } | { bOk: false; strError }`.

출력 (코드가 직접 다섯 값을 입력한다):

```
5) 0xFF         → 0xFF / 255 / 0b11111111
5) 0b1010_1010  → 0xAA / 170 / 0b10101010
5) -0x10        → -0x10 / -16 / -0b10000
5) 12a          → error : "12a" is not an integer (255, 0xFF, 0b1010, 0o17)
5) 4096         → 0x1000 / 4096 / 0b1000000000000
   your turn : type in the box above
```

해 볼 것: `"input"` 대신 `"change"` 이벤트를 쓰고 언제 갱신되는지 보자. OCT 행을 더해 보자 (`Radix(v, 8, "0o")`).

---

## 7. DevCalc 스텝 — 웹 페이지 (Lv4)

새 파일:

| 파일 | 내용 |
|---|---|
| [devcalc/web/index.html](../../devcalc/web/index.html) | 페이지 : 식 입력, 워드 크기, 결과 표, 기록 |
| [devcalc/web/style.css](../../devcalc/web/style.css) | 밝은 / 어두운 스타일 |
| [devcalc/web/App.ts](../../devcalc/web/App.ts) | DOM 을 만지는 유일한 파일 |
| [devcalc/tests/Web.test.ts](../../devcalc/tests/Web.test.ts) | App.ts 는 코어만 import, serve.ts 경로 검사 |
| [tools/serve.ts](../../tools/serve.ts) | 1절의 개발 서버 |

`npm run web` 을 실행한 상태에서 <http://127.0.0.1:5173/devcalc/web/> 를 연다.
완성된 페이지 (10강 엔진 포함) 는 온라인에서도 열 수 있다: <https://cyberkdh.github.io/DH.Study.TypeScript/devcalc/web/> — [build-web.ts](../../tools/README.ko.md#build-webts--devcalc-웹-페이지를-정적-파일로) 참고.

### 같은 코어

```ts
// devcalc/web/App.ts — main.ts 와 같은 import
import { ToBin, ToDec, ToHex, CWordSize, IsWordBits, Evaluate, CHistory, type IFormatOptions, type TFormatter, type IEvaluation, type IEvalError } from "../src/core/index.ts";
```

```
devcalc/
├── src/core/   ← 계산 : 양쪽이 같이 씀, 이 강의에서 바뀌지 않음
├── src/cli/    ← Node 전용 (클립보드 프로그램, readline)
├── src/main.ts ← 명령줄 : console.log 로 출력
└── web/App.ts  ← 브라우저 : 페이지에 씀
```

06강에서 코어를 `node:` import 와 떼어 놓은 이유가 이것이다. `Evaluate` 는 `TResult` 를 반환할 뿐 출력하지 않으므로, 코어를 바꾸지 않고도 명령줄은 출력하고 페이지는 화면에 보여 준다. 테스트가 `App.ts` 를 지킨다.

```ts
test("web/App.ts: imports only the core (the browser has no node: modules)", async () => {
	const strCode = await readFile(APP_FILE, "utf8");
	const arrFrom = [...strCode.matchAll(/from\s+["']([^"']+)["']/g)].map((arrMatch) => arrMatch[1]);
	assert.deepEqual(arrFrom, ["../src/core/index.ts"]);
});
```

### 페이지가 하는 일

| 기능 | 방법 |
|---|---|
| `0xFF + 1; ans * 2` 와 `ans` | main.ts 의 `Calculate` 와 같은 반복, `CHistory` 사용 |
| 워드 크기 | `<select>` → `IsWordBits(Number(value))` → `CWordSize` 또는 없음 |
| 결과 표 | `insertRow` / `insertCell` / `textContent` (`innerHTML` 은 쓰지 않음) |
| 복사 버튼 | 위임 리스너 하나, `navigator.clipboard.writeText` |
| 에러 상자 | 명령줄과 같은 title / Why / Fix |
| 기록 | 줄을 클릭하면 다시 씀. `localStorage` 에 보관 |

### localStorage 의 bigint

```ts
interface ISavedEval {
	strExpr: string;
	strValue: string; // bigint 를 10진 텍스트로
	strExact: string;
	bOverflow: boolean;
}

// JSON.parse 는 any 를 반환 : 믿기 전에 모든 필드를 확인
function IsSavedEval(vValue: unknown): vValue is ISavedEval {
	if (typeof vValue !== "object" || vValue === null) {
		return false;
	}
	const oSaved = vValue as Record<string, unknown>;
	return typeof oSaved.strExpr === "string" && typeof oSaved.strValue === "string" && typeof oSaved.strExact === "string" && typeof oSaved.bOverflow === "boolean";
}
```

`const vParsed: unknown = JSON.parse(...)` 로 `any` 를 `unknown` 으로 바꾸면, 타입 가드(Type guard, 03강)가 확인하기 전에는 아무것도 쓸 수 없다. 깨진 데이터 (`"strValue":"zz"` → `BigInt` 가 throw) 는 잡혀서 기록이 빈 상태로 시작한다.

### navigator.clipboard

```ts
await navigator.clipboard.writeText(strText); // Promise<void>
```

정하는 것은 여러분이 아니라 브라우저다. `https://` 나 `localhost` / `127.0.0.1` 에서, 포커스가 있는 페이지에서, 사용자 동작(클릭) 뒤에만 된다. 아니면 reject 한다. 예: `Document is not focused`. 그래서 페이지는 이를 잡아 `Could not copy: ...` 를 보여 준다. 06강의 `--copy` 와 같은 규칙이다: 클립보드가 없으면 안내만 하면 되고, 프로그램이 멈출 일은 아니다.

### 확인한 것

헤드리스(Headless) Edge 에서 코드로 페이지를 조작했다.

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

새로 고쳐도 기록이 남아 있다. `npm test`:

```
✔ web/App.ts: imports only the core (the browser has no node: modules)
✔ serve ResolvePath: files inside the project only
...
ℹ pass 27
```

해 볼 것: 표에 OCT 행을 더해 보자. `Escape` 로 입력 상자를 비우게 해 보자 (`"keydown"`, `oEvent.key === "Escape"`).

---

## 정리

- 브라우저는 JavaScript 만 실행한다. `npm run web` 은 요청이 올 때 타입을 지운다 (`node 파일.ts` 처럼): 타입 검사는 없으니 VS Code / `npm run typecheck` 를 유지한다.
- `lib: ["DOM", "DOM.Iterable"]` 이 `document` 등을 준다. Node 에서도 실행될 수 있는 파일은 `typeof document` 를 확인한다.
- `querySelector` → `Element | null`. 태그 이름, 제네릭 (보증만), `instanceof` (확인) 로 올바른 타입을 얻는다.
- 텍스트는 `textContent`, 구조는 `createElement`. 사용자 입력에 `innerHTML` 은 절대 쓰지 않는다.
- 이벤트 이름이 타입을 정한다 (`click` → `PointerEvent`, `submit` → `SubmitEvent`). 위임 + `target` 의 `instanceof`. `preventDefault`, `once`, `AbortController`.
- `FormData.get` → `string | File | null`. 입력은 텍스트다. `localStorage` 는 문자열을 저장하고, throw 할 수 있으며, `JSON.parse` 결과는 확인이 필요하다.
- DevCalc Lv4: 같은 `core/` 위의 웹 페이지, DOM 은 `App.ts` 만 만진다.

**다음 → [08. 고급 타입](../08-advanced-types/README.ko.md)**: 다른 타입에서 만들어 내는 타입 — `keyof`, 매핑된 타입(Mapped type), 조건부 타입(Conditional type), 템플릿 리터럴 타입(Template literal type), `satisfies`. DevCalc 의 연산자 표가 완전히 타입으로 묶인다.

---

[← 이전: 06. 모듈과 비동기](../06-modules-async/README.ko.md) · [목차](../../README.ko.md) · [다음: 08. 고급 타입 →](../08-advanced-types/README.ko.md)
