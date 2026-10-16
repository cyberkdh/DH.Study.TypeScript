[English](README.md) · **한국어**

[← 이전: 16. 트리와 재귀](../16-trees-steps/README.ko.md) · [목차](../../README.ko.md)

# 17. 트리 그리기 — TypeScript 로 만드는 SVG

> 시리즈: DH.Study.TypeScript · 17강 (3부)
> 환경: Node.js v24 · TypeScript 7 · Vitest 5 · VS Code · 브라우저

## 목표

이 강의를 마치면 다음을 할 수 있다.

- [ ] 간단한 규칙 (잎은 다음 칸, 부모는 자식들의 가운데) 으로 트리의 모든 노드 자리를 정하고, 배치(Layout)를 그리기(Drawing)와 나눈다
- [ ] 기본 SVG 를 읽고 쓴다: `viewBox`, `line`, `rect`, `text`, `transform` 이 붙은 `g`, `title`, `style`
- [ ] 마크업에 넣을 글자를 올바른 순서로 이스케이프(Escape)하고, `textContent` 에는 왜 이스케이프가 필요 없는지 말한다
- [ ] 코드에서 `createElementNS` 로 SVG 요소를 만들고, `SVGElementTagNameMap` 으로 도우미 함수에 타입을 붙인다
- [ ] CSS 변수로 SVG 를 꾸미고 (`fill`, `stroke`), 화면 낭독기(Screen reader)가 그림을 읽을 수 있게 한다 (`role="img"`, `<title>`, `aria-current`)
- [ ] DevCalc 의 트리를 보여준다: 명령줄의 `--tree`, 페이지에서 고른 단계를 따라가는 Tree 패널

## 이 강의의 목차

1. [픽셀보다 좌표가 먼저](#1-픽셀보다-좌표가-먼저)
2. [SVG 는 글자다](#2-svg-는-글자다)
3. [DOM 속의 SVG](#3-dom-속의-svg)
4. [따라하기](#4-따라하기)
5. [DevCalc 스텝 — Lv12 트리 보기](#5-devcalc-스텝--lv12-트리-보기)
6. [정리](#정리)
7. [다음으로 갈 곳](#다음으로-갈-곳)

이 강의의 예제 파일: [layout.ko.ts](layout.ko.ts) · [svg.ko.ts](svg.ko.ts) · [svgdom.ko.ts](svgdom.ko.ts) (브라우저, [index.html](index.html))

> 예제는 한국어 주석판(`x.ko.ts`)을 링크한다. 같은 코드의 영어 주석판은 `x.ts` 다.

> 문법 표시: **[JS]** = JavaScript 문법 (TS 없이도 있음) · **[TS]** = TypeScript 가 더한 타입 문법 (지우면 JS) · 자세한 구분은 [00강 7-3](../00-setup/README.ko.md#7-3-ts-문법--js-문법--타입-문법)

16강은 트리를 `├─` 와 `└─` 로, 옆으로 누운 채 한 줄에 노드 하나씩 출력했다. 터미널에서는 그것으로 충분하지만, 트리는 그림이다: 위에 뿌리, 아래에 자식, 그 사이의 선. 이 강의는 트리를 그린다. 먼저 글자로, 그다음 SVG 로. 그리고 DevCalc 페이지의 Steps 옆에 놓는다:

![svg.ts 가 그린 (1 << 4) & 'A' 의 트리](tree.svg)

(이 그림은 2 절의 [svg.ko.ts](svg.ko.ts) 가 쓴 [tree.svg](tree.svg) 다.)

---

## 1. 픽셀보다 좌표가 먼저

트리 그리기는 두 가지 일이다: 상자를 **어디에** 둘지 (배치), 그리고 **어떻게** 보일지 (그리기). 둘을 나누어 두면 배치 하나를 여러 방법으로 그릴 수 있다: 터미널에서는 글자로, 페이지에서는 SVG 로, 어떤 크기로든.

### 1-1. 규칙

- **y** 는 깊이다: 뿌리는 0 층, 그 자식은 1 층, 이런 식.
- **x** 는 잎에서 나온다: 잎마다 왼쪽부터 다음 빈 칸 (0, 1, 2, …) 을 차지하므로, 두 잎은 절대 겹치지 않는다.
- **부모** 는 첫째 자식과 마지막 자식의 가운데에 선다. 그래서 언제나 자식들 위에 있다.

[layout.ko.ts](layout.ko.ts) 는 이 규칙을 자식 먼저 도는 재귀 순회 하나로 쓴다:

```ts
function Layout(oRoot: TNode): IBox[] {
	const arrBox: IBox[] = [];
	let nNextLeaf = 0;
	function Place(oNode: TNode, nY: number): number {
		const arrChild = NodeChildren(oNode).map((oChild) => Place(oChild, nY + 1));
		let nX = nNextLeaf;
		if (arrChild.length === 0) {
			nNextLeaf += 1; // 잎 : 다음 빈 칸
		} else {
			const arrChildX = arrChild.map((nChild) => arrBox[nChild]?.nX ?? 0);
			nX = (Math.min(...arrChildX) + Math.max(...arrChildX)) / 2; // 부모 : 자식들의 가운데
		}
		arrBox.push({ strLabel: NodeLabel(oNode), nX, nY, arrChild });
		return arrBox.length - 1;
	}
	Place(oRoot, 0);
	return arrBox;
}
```

- **[JS]** 자식이 부모 **보다 먼저** 놓인다: 16강의 후위 순회(Post-order). 부모는 자식들의 x 가 필요하므로 자식을 기다려야 한다.
- **[JS]** `nNextLeaf` 는 `Place` 바깥에 있고 모든 호출이 함께 쓴다: 클로저(Closure, 13강). 이 카운터가 비결의 전부다: 잎을 만나는 순서대로 칸을 나눠 준다.
- `arrChild` 는 객체가 아니라 `arrBox` 안의 **인덱스** 를 담는다: 목록이 평평하므로, 그리는 쪽은 선을 위해 한 번, 상자를 위해 한 번 돌면 된다.

```
1) 1 + 2 * 3
   #  label  x     y  children
   0  1      0     1  []
   1  2      1     2  []
   2  3      2     2  []
   3  *      1.5   1  [1, 2]
   4  +      0.75  0  [0, 3]
```

`*` 는 `2` (1) 와 `3` (2) 사이인 1.5 에 있다. `+` 는 `1` (0) 과 `*` (1.5) 사이인 0.75 에 있다. 좌표는 픽셀이 아니라 칸과 층이다: 한 칸이 얼마나 클지는 그리는 쪽이 정한다.

`NodeLabel` 과 `NodeChildren` 은 DevCalc 의 새 파일 `devcalc/src/core/Tree.ts` 에서 온다: 16강의 `Label` 과 `Children` 을 코어로 옮겨서, 명령줄과 페이지가 함께 쓴다.

### 1-2. 어떤 그리기든: 글자로 만든 그림

좌표를 확인하려고 `Picture()` 는 이름표를 글자 격자에 놓는다: 한 칸 = 6 열, 한 층 = 2 줄 (상자 줄 하나, 연결선 줄 하나). 연결선은 자식이 있는 쪽에 따라 `/`, `\`, `|` 다.

```
2) 10 + 30 * (100 + 2) / 10 + 20
                        [+]
                    /          \
              [+]                 [20]
           /       \
    [10]              [/]
                    /      \
                [*]         [10]
               /   \
          [30]      [+]
                    /  \
                [100]  [2]
```

같은 식을 옆으로 누인 16강의 트리와 비교해 보자: 같은 노드가 이제 서 있다. 이름표를 `[ ]` 로 감싼 것은 연산자 `/` 가 연결선으로 보이지 않게 하려는 것이다.

```
3) same places as LayoutTree : true · 6 slots × 6 levels
   in pixels (a slot 48 wide, a level 58 high) : 288 × 316
   x = in-order position instead : 11 columns
```

- DevCalc 의 `LayoutTree()` 도 같은 자리를 주고, `nWidth` (잎 칸의 수) 와 `nHeight` (층의 수) 도 돌려준다: 그리는 쪽이 그림 크기를 정하는 데 꼭 필요한 값이다.
- 겹치지 않는 다른 규칙: 노드마다 자기 열을 준다. x = 중위 순회(In-order, 16강)에서의 위치. 더 간단하지만 연산자마다 열을 차지하므로 트리가 거의 두 배 넓다 (6 열 대신 11 열).

### 1-3. 아무것도 없는 것의 가운데

```
4) Expected problem: a leaf placed like a parent → x = NaN
   Why : Math.min() of nothing is Infinity, Math.max() of nothing is -Infinity. Infinity + -Infinity is NaN, and no error is thrown.
   Fix : handle the base case first : a leaf takes the next free slot (the if in Place).
```

**[JS]** 인자 없는 `Math.min()` 과 `Math.max()` 는 예외를 던지지 않는다: `Infinity` 와 `-Infinity` (어떤 수와 비교해도 지는 값) 를 돌려준다. 둘의 평균은 `NaN` 이고, `NaN` 은 조용히 모든 좌표로 퍼져서 SVG 는 아무것도 그리지 않게 된다. 잎을 위한 `if` 는 재귀의 기저 사례(Base case)이고, 여기서는 숫자를 유한하게 지키는 역할도 한다.

---

## 2. SVG 는 글자다

**SVG** (Scalable Vector Graphics) 는 HTML 이 페이지를 태그로 적듯이 그림을 태그로 적는다. 확대해도 흐려지지 않고, CSS 로 꾸밀 수 있으며, 글자를 쓸 수 있는 프로그램이면 무엇이든 만들 수 있다. [svg.ko.ts](svg.ko.ts) 는 브라우저 없이 `(1 << 4) & 'A'` 의 트리를 쓴다:

```
1) (1 << 4) & 'A'
   1    → 1
   4    → 4
   <<   → &lt;&lt;
   'A'  → &#39;A&#39;
   &    → &amp;
2) 1256 characters :
   <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 158" width="160" height="158" role="img">
     <title>Tree of (1 &lt;&lt; 4) &amp; &#39;A&#39;</title>
     <style>
       line { stroke: #8c959f; stroke-width: 1.5 } rect { fill: #ffffff; stroke: #59636e }
       text { fill: #1f2328; font: 14px ui-monospace, Consolas, monospace; text-anchor: middle; dominant-baseline: central }
       @media (prefers-color-scheme: dark) { rect { fill: #0d1117; stroke: #9198a1 } text { fill: #e6edf3 } line { stroke: #656c76 } }
     </style>
     <line x1="56" y1="92" x2="32" y2="124"/>
     <line x1="56" y1="92" x2="80" y2="124"/>
     <line x1="92" y1="34" x2="56" y2="66"/>
     <line x1="92" y1="34" x2="128" y2="66"/>
     <g transform="translate(32 137)"><rect x="-13" y="-13" width="26" height="26" rx="5"/><text>1</text></g>
     <g transform="translate(80 137)"><rect x="-13" y="-13" width="26" height="26" rx="5"/><text>4</text></g>
     <g transform="translate(56 79)"><rect x="-15.5" y="-13" width="31" height="26" rx="5"/><text>&lt;&lt;</text></g>
     <g transform="translate(128 79)"><rect x="-19.5" y="-13" width="39" height="26" rx="5"/><text>&#39;A&#39;</text></g>
     <g transform="translate(92 21)"><rect x="-13" y="-13" width="26" height="26" rx="5"/><text>&amp;</text></g>
   </svg>
```

### 2-1. 이 그림의 태그들

| 부분 | 하는 일 |
|---|---|
| `xmlns="http://www.w3.org/2000/svg"` | "이것은 SVG 태그다" 라고 알린다. `.svg` 파일에는 꼭 필요하고, HTML 페이지 안에서는 `<svg>` 태그가 스스로 정한다 |
| `viewBox="0 0 160 158"` | 그림 자신의 좌표: x 는 0 부터 160, y 는 0 부터 158, **y 는 아래로 커진다**. `width`/`height` 는 화면에서의 크기이고, 둘이 다르면 그림이 늘거나 줄어든다 |
| `<line x1 y1 x2 y2>` | 두 점 사이의 직선. 선을 먼저 쓴다: 뒤에 오는 태그가 위에 그려지므로 상자가 선 끝을 덮는다 |
| `<g transform="translate(x y)">` | (0, 0) 을 (x, y) 로 옮긴 그룹. 상자마다 자기 중심을 기준으로 그리므로, rect 는 언제나 `-너비/2, -13` 에 있다 |
| `<rect x y width height rx>` | 사각형. `rx` 는 모서리를 둥글게 한다 |
| `<text>` | 글자. `text-anchor: middle` 과 `dominant-baseline: central` 이 (0, 0) 의 가운데에 맞춘다 |
| `<title>` | 그림의 이름. `role="img"` 와 함께 화면 낭독기가 읽고, 브라우저는 툴팁으로 보여 준다 |
| `<style>` | 그림 안의 CSS. SVG 는 `background` 와 `border` 대신 `fill` (안쪽) 과 `stroke` (테두리) 를 쓴다 |

`@media (prefers-color-scheme: dark)` 규칙 덕분에 이 강의 맨 위의 그림은 `<img>` (페이지의 CSS 를 볼 수 없음) 로 보여도 다크 테마를 따른다.

상자 너비는 이름표 길이에서 나온다 (14 px 고정폭 글꼴 한 글자에 `8.4` 픽셀, 그리고 여유). 어림값이다: 브라우저라면 글자를 정확히 잴 수 있지만 (`getBBox()`), Node 에서 쓰는 파일에는 잴 글꼴이 없고, 짧은 이름표에는 어림값으로 충분하다.

### 2-2. 이스케이프: & 가 먼저

이름표는 마크업 **안에** 들어가고, 거기서 `<<`, `&`, `'` 는 뜻이 있다. 그래서 엔티티(Entity) (`&lt;`, `&amp;`, `&#39;`) 로 써야 한다:

```ts
function Escape(strText: string): string {
	return strText.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}
```

```
3) Expected problem: "<<" escaped with & last → &amp;lt;&amp;lt; (the page shows &lt;&lt; instead of <<)
   Why : &lt; was made first, then its & was escaped again into &amp;lt;.
   Fix : escape & first, as Escape() does. In the browser, textContent does all of this for you.
```

**[JS]** 모든 엔티티는 `&` 로 시작한다. `&` 를 마지막에 바꾸면 방금 만든 엔티티의 `&` 까지 바꿔서, 읽는 쪽은 `&lt;` 를 글자로 보게 된다. 아예 이스케이프하지 않으면 더 나쁘다: `<<` 가 태그를 시작해서 파일이 깨진다. DevCalc 의 이름표는 사용자 입력 (`'A'`, 변수 이름) 이므로, 이것은 07강의 "사용자 글자에는 절대 `innerHTML` 을 쓰지 않는다" 와 같은 규칙을 반대쪽에서 본 것이다.

### 2-3. 파일로 저장하기

```
> node lessons/17-tree-view/svg.ko.ts lessons/17-tree-view/tree.svg
…
4) saved : lessons/17-tree-view/tree.svg (open it in a browser, or show it with <img src="...">)
```

**[JS]** `writeFileSync(strFile, strSvg, "utf8")` 가 파일을 직접 쓴다. 출력된 마크업을 `>` 로 돌려도 되는 셸이 있지만, Windows PowerShell 5 는 기본으로 UTF-16 으로 쓰고, `.svg` 파일은 UTF-8 이어야 한다.

---

## 3. DOM 속의 SVG

페이지는 DOM 호출로도 SVG 를 만들 수 있다: 마크업 글자도, 이스케이프도 없이. [svgdom.ko.ts](svgdom.ko.ts) 는 브라우저에서 실행된다:

```
> npm run web
→ http://127.0.0.1:5173/lessons/17-tree-view/?ko      (?ko 를 붙이면 svgdom.ko.ts)
```

Node 에서는 어디서 열지만 알려 준다:

```
> node lessons/17-tree-view/svgdom.ko.ts
This example runs in the browser (it uses document).
  npm run web  →  http://127.0.0.1:5173/lessons/17-tree-view/
```

페이지의 로그:

```
1) Expected problem: createElement("rect") → HTMLUnknownElement, instanceof SVGRectElement = false
   namespaceURI = http://www.w3.org/1999/xhtml
   Why : the tag name alone does not say SVG. createElement always makes HTML elements, and the browser ignores an HTML <rect> inside <svg>.
   Fix : createElementNS("http://www.w3.org/2000/svg", "rect"). Markup text (innerHTML, a .svg file) gets the namespace from <svg>.
   createElementNS → SVGRectElement, instanceof SVGRectElement = true
   namespaceURI = http://www.w3.org/2000/svg
2) Svg("line") : x1 attribute = "100" (string), x1.baseVal.value = 100 (number)
3) textContent = "<<" (2 characters) · markup = <text x="44" y="24" text-anchor="middle">&lt;&lt;</text>
4) y = (1 << 4) & 'A' : 6 boxes, 5 lines, 160 × 216 px
   title = "Tree of y = (1 << 4) & 'A'" · the labels : 1 4 << 'A' & y =
```

### 3-1. 네임스페이스

**[JS]** `document.createElement("rect")` 는 이름이 `rect` 인 **HTML** 요소를 만든다. HTML 에는 그런 태그가 없으므로 `HTMLUnknownElement` 다: `<svg>` 안에 들어갈 수는 있지만 아무것도 그리지 않고, 왜 그런지 알려 주는 오류도 없다. SVG 요소는 URI 로 이름 붙인 자기 **네임스페이스(Namespace)** 에 살고, `createElementNS(SVG_NS, "rect")` 로 만들어야 한다. (URI 는 이름일 뿐이다: 거기서 아무것도 내려받지 않는다.)

### 3-2. 타입이 붙은 도우미: SVGElementTagNameMap

```ts
function Svg<K extends keyof SVGElementTagNameMap>(strTag: K, oAttr: Readonly<Record<string, string | number>> = {}): SVGElementTagNameMap[K] {
	const elNew = document.createElementNS(SVG_NS, strTag);
	for (const [strName, vValue] of Object.entries(oAttr)) {
		elNew.setAttribute(strName, String(vValue));
	}
	return elNew;
}
```

**[TS]** DOM 타입에는 SVG 태그 이름마다 요소 타입을 대응시키는 인터페이스가 있다: `SVGElementTagNameMap` (`"line"` → `SVGLineElement`, `"rect"` → `SVGRectElement`, …). `K extends keyof …` 는 `K` 를 태그 이름의 리터럴 타입으로 만들고, `SVGElementTagNameMap[K]` 는 요소 타입을 찾아본다 (인덱스 접근 타입(Indexed access type), 08강). 그래서 `Svg("line")` 은 `as` 없이 `SVGLineElement` 이고, `Svg("lin")` 처럼 틀린 태그 이름은 컴파일 오류다. `document.createElementNS` 자체도 SVG 네임스페이스에 대해 같은 방식으로 타입이 붙어 있어서, 반환할 때 캐스트가 필요 없다.

```ts
// elLine.cx; // ← 주석 해제 → 빨간 밑줄 TS2339 (Property 'cx' does not exist on type 'SVGLineElement')
```

### 3-3. 속성은 글자, 프로퍼티는 숫자

`setAttribute("x1", "100")` 은 글자를 저장한다. **[JS]** 요소의 프로퍼티 `elLine.x1.baseVal.value` 는 그것을 숫자로 읽어 준다 (`SVGAnimatedLength`: SVG 의 길이는 애니메이션될 수 있고, `baseVal` 은 애니메이션 없는 값이다). 쓸 때는 속성(Attribute)이 보통이고, 읽을 때는 프로퍼티(Property)가 편하다.

### 3-4. textContent 는 이미 안전하다

`elText.textContent = "<<"` 는 마크업이 아니라 두 글자를 넣는다. 요소를 직렬화하면 (`outerHTML`) 브라우저가 엔티티를 스스로 쓴다: `&lt;&lt;`. 그래서 DOM 방식에는 `Escape()` 가 필요 없다: 07강과 같은 규칙이고, DevCalc 의 트리 보기가 `textContent` 만 쓰는 이유다.

### 3-5. 그림의 이름

화면 낭독기에게 그림은 그냥 도형들이다. `<svg>` 의 `role="img"` 는 "이것은 이미지 하나" 라고 말하고, 첫 자식 `<title>` 이 이름 ("Tree of y = …") 을 준다. 페이지의 스타일은 인라인 `<svg>` 안까지 닿는다: [index.html](index.html) 은 선, 상자, 글자를 페이지의 나머지와 같은 CSS 변수로 칠하므로, 다크 테마에 더 할 일이 없다.

---

## 4. 따라하기

```
> node lessons/17-tree-view/layout.ko.ts
1) 1 + 2 * 3
   #  label  x     y  children
   0  1      0     1  []
   1  2      1     2  []
   2  3      2     2  []
   3  *      1.5   1  [1, 2]
   4  +      0.75  0  [0, 3]
2) 10 + 30 * (100 + 2) / 10 + 20
                        [+]
                    /          \
              [+]                 [20]
           /       \
    [10]              [/]
                    /      \
                [*]         [10]
               /   \
          [30]      [+]
                    /  \
                [100]  [2]
3) same places as LayoutTree : true · 6 slots × 6 levels
   in pixels (a slot 48 wide, a level 58 high) : 288 × 316
   x = in-order position instead : 11 columns
4) Expected problem: a leaf placed like a parent → x = NaN
   Why : Math.min() of nothing is Infinity, Math.max() of nothing is -Infinity. Infinity + -Infinity is NaN, and no error is thrown.
   Fix : handle the base case first : a leaf takes the next free slot (the if in Place).
```

```
> node lessons/17-tree-view/svg.ko.ts
1) (1 << 4) & 'A'
   …  (2 절)
3) Expected problem: "<<" escaped with & last → &amp;lt;&amp;lt; (the page shows &lt;&lt; instead of <<)
   Why : &lt; was made first, then its & was escaped again into &amp;lt;.
   Fix : escape & first, as Escape() does. In the browser, textContent does all of this for you.
4) Add a file name to save it : node lessons/17-tree-view/svg.ts tree.svg
```

svgdom.ko.ts 는: `npm run web` 후 `http://127.0.0.1:5173/lessons/17-tree-view/?ko` 를 연다 (로그는 3 절).

해 볼 것:

- layout.ko.ts 에서 `SMALL` 을 `max(1, 2, 3) - 4` 로 바꾼다 → `max()` 는 자식이 셋이고 가운데 자식 위 (x = 1) 에 선다. `-` 는 `max()` (1) 와 `4` (3) 사이인 2 에 선다.
- layout.ko.ts 에서 `if (arrChild.length === 0)` 갈래를 지워 모든 노드를 부모처럼 놓는다 → 1 절이 온통 `NaN` 을 출력하고, 아무것도 예외를 던지지 않는다.
- svg.ko.ts 의 `ToSvg` 에서 `Escape` 를 `EscapeWrongOrder` 로 바꾸고, 파일로 저장해 브라우저로 연다 → 상자에 `&lt;&lt;` 와 `&amp;` 가 보인다.
- svg.ko.ts 에서 `width="${nWidth}"` 를 `width="${nWidth * 3}"` 로 (높이도 같이) 바꾼다 → 그림이 세 배 커지고도 선명하다: `viewBox` 는 그대로이고 화면 크기만 바뀌었다.
- svgdom.ko.ts 에서 `elLine.cx;` 주석을 푼다 → TS2339. 그다음 `Svg("line", …)` 을 `Svg("circle", …)` 로 바꾼다 → 밑줄이 사라지고 (`cx` 는 원의 중심), 대신 `elLine.x1` 에 밑줄이 생긴다.

---

## 5. DevCalc 스텝 — Lv12 트리 보기

```
> node devcalc/src/main.ts "(1 << 4) & 'A'" --tree
Tree :
  &
  ├─ <<
  │  ├─ 1
  │  └─ 4
  └─ 'A'
HEX : 0x0
DEC : 0
BIN : 0b0
```

페이지에서는 Steps 패널 아래의 Tree 패널이 같은 트리를 그린다. Steps 의 줄은 이제 모두 버튼이다: 단계를 고르면 트리가 계산의 그 순간을 보여 준다.

| 4 단계 중 1 단계 | 4 단계 중 3 단계 |
|---|---|
| `+` 강조: 다음에 계산된다. 아직 끝난 것이 없다 | `40` 과 `240` 은 끝남 (파란 상자, 값으로 표시), 그 아래는 흐리게. 다음은 `*` |

(식은 `y = (10 + 30) * max(0xF0, 'A') >> 2` 다.)

### 바뀐 것

| 파일 | 바뀐 내용 |
|---|---|
| `devcalc/src/core/Tree.ts` | 새 파일: `NodeLabel()`, `NodeChildren()` (16강의 `Label`/`Children`), `LayoutTree()` → `ITreeLayout` (후위 순서의 `arrBox`, `nWidth`, `nHeight`), `TreeLines()` (`├─ └─` 글자) |
| `devcalc/src/core/Steps.ts` | `IStep` 에 `oNode` (그 단계의 노드) 와 `biValue`, `IExplanation` 에 `oRoot` |
| `devcalc/src/core/index.ts` | `LayoutTree`, `TreeLines`, `NodeLabel`, `NodeChildren`, `ITreeLayout`, `ITreeBox` 내보내기 |
| `devcalc/src/main.ts` | `--tree`: 결과 앞에 트리를 출력 (계산이 실패해도) |
| `devcalc/web/TreeView.ts` | 새 파일: `CTreeView.Show(oLayout, arrStep, nAt, strExpr)` 가 `nAt` 단계의 SVG 를 그린다 |
| `devcalc/web/App.ts` | 단계 줄마다 `<button data-step>`; `ShowExplanation()` 이 배치를 한 번 만들고, `ShowTree(nAt)` 가 한 단계를 그린다; 목록에 클릭 리스너 하나 |
| `devcalc/web/index.html` | Tree 패널 (`<details id="tree-box">`), 제목 `Lv12` |
| `devcalc/web/style.css` | 단계 버튼과 `[aria-current="step"]`; 트리의 `line`, `rect`, `text`, `.focus`, `.done`, `.faded` |
| `devcalc/tests/Tree.test.ts` | 새 파일: 테스트 6 개 |
| `devcalc/tests/Web.test.ts` | App.ts 가 `./TreeView.ts` 를 가져와도 됨; TreeView.ts 는 코어의 타입만 가져옴 |

코어는 여전히 DOM 을 모른다: `LayoutTree` 는 칸과 층을 돌려주고, 그것을 픽셀로 바꾸는 것은 `web/TreeView.ts` 뿐이다.

### 페이지

`CTreeView.Show` 는 고른 단계 (`nAt`) 에 맞춰 트리 전체를 다시 그린다:

- **done (끝남)**: `nAt` 앞의 단계들. 상자가 이름표 대신 값을 보여 준다 (`+` 대신 `40`). 16강의 노드를 키로 쓰는 `Map` 과 같은 생각이다: `IStep.oNode` 가 배치 속의 바로 그 노드 객체이므로 `new Map(arrStep.slice(0, nAt).map((oStep) => [oStep.oNode, oStep.biValue]))` 로 충분하다.
- **focus (다음)**: `arrStep[nAt].oNode`, 다음에 계산되는 부분 (Steps 가 `<mark>` 로 강조하는 그 부분).
- **faded (흐리게)**: 끝난 상자 아래의 모든 것. `arrBox` 는 후위 순서 (뿌리가 마지막) 이므로, **거꾸로** 도는 반복은 모든 부모를 자식보다 먼저 만나서 "흐리게" 를 한 번에 내려보낼 수 있다.
- `nAt = arrStep.length` (마지막 줄, 결과) 는 모두 끝난 모습을 보여 준다.

```ts
// devcalc/web/TreeView.ts
for (let nIndex = arrBox.length - 1; nIndex >= 0; nIndex--) {
	const oBox = arrBox[nIndex];
	const bHide = (arrFaded[nIndex] ?? false) || (oBox !== undefined && mapDone.has(oBox.oNode));
	for (const nChild of oBox?.arrChild ?? []) {
		arrFaded[nChild] = bHide;
	}
}
```

상태는 각 `<g>` 의 CSS 클래스 (`done`, `focus`, `faded`) 일 뿐이고, 색은 style.css 에 페이지의 변수로 있다:

```css
.tree .focus rect {
	fill: var(--mark);
	stroke: var(--fg);
	stroke-width: 2;
}
.tree .done rect {
	fill: var(--panel);
	stroke: var(--accent);
	stroke-width: 2;
}
.tree .faded {
	opacity: 0.3;
}
```

단계 고르기:

```ts
// devcalc/web/App.ts
elSteps.addEventListener("click", (oEvent) => {
	const elButton = oEvent.target instanceof Element ? oEvent.target.closest<HTMLButtonElement>("button[data-step]") : null;
	if (elButton?.dataset.step !== undefined) {
		ShowTree(Number(elButton.dataset.step));
	}
});
```

- 모든 줄에 리스너 하나 (이벤트 위임(Event delegation), 14강). 줄은 식마다 새로 만들어지므로, 버튼마다 리스너를 달면 매번 다시 달아야 한다.
- `<button>` 이므로 Tab 으로 닿고 Enter 나 Space 로 고를 수 있다. 키 처리 코드를 따로 쓸 필요가 없다 (14강).
- **[JS + TS]** `ShowTree` 는 고른 줄에 `aria-current="step"` 을 붙이고 나머지에서는 뗀다. 화면 낭독기는 "현재 단계" 라고 알리고, CSS 는 `[aria-current="step"]` 을 꾸민다: 상태가 사는 곳은 속성 하나뿐이다. 값이 중요하다: 빈 `aria-current=""` 는 *false* 라는 뜻이다.
- `TreeView.ts` 는 코어에서 타입만 가져온다 (`import type { IStep, ITreeLayout }`). 타입은 지워지므로 이 파일은 번들에 자기 코드만 더한다. 테스트가 그대로 지켜 준다.
- 배치는 식마다 한 번 만든다 (`ShowExplanation`). 단계를 고르면 다시 그리기만 한다.

### 테스트

`devcalc/tests/Tree.test.ts` 가 확인하는 것: 모든 종류 노드의 이름표와 자식 (`y = -x * max(0xF0, 'A') + ans`); `1 + 2 * 3` 의 자리 (`1@0,1 2@1,2 3@2,2 *@1.5,1 +@0.75,0`); 자식이 하나면 부모 바로 아래 (`-(~5)`); 16강 예제에서 한 자리에 상자 두 개가 없음 (6 × 6); 단계가 배치의 노드를 가리킴; `TreeLines`; 그리고 계산이 실패해도 `--tree` (`1 / 0` 은 트리, 그다음 오류, 종료 코드 1).

```
> npm test
check-pairs : 76 pairs, 0 failed
check-names : 41 files, 0 problems

 Test Files  14 passed (14)
      Tests  95 passed (95)
```

### 확인

페이지를 로컬 서버로, 그리고 한 파일 `DevCalc.html` (`npm run build:single`) 로 헤드리스(Headless) 브라우저에서 열었다: 제목은 `DevCalc Lv12 · web`; `y = (10 + 30) * max(0xF0, 'A') >> 2` 의 트리는 상자 10 개, 1 단계는 `+` 강조, 3 단계는 `40` 과 `240` 이 끝나고 그 아래 잎 네 개가 흐리며 `*` 가 강조된다. 첫 식을 입력하기 전에는 패널에 안내 문장만 있다. 강의 페이지는 `?ko` 로도 똑같이 그려진다.

해 볼 것:

- `node devcalc/src/main.ts "y = -x * max(0xF0, 'A') + 1" --tree` → 트리가 출력되고, 그다음 `Invalid input: "x"`: 파서는 `x` 를 몰라도 되지만, 계산은 알아야 한다.
- 페이지에서 `(1 + 1) * (1 + 1)` 을 입력하고 2 단계를 고른다 → **오른쪽** `+` 만 강조되고, 왼쪽은 이미 `2` 다: 16강의 노드를 키로 쓰는 `Map` 이 눈에 보인다.
- 페이지에서 Tab 을 눌러 Steps 의 줄에 포커스를 두고 Enter → 트리가 따라온다.

---

## 정리

- 그리기는 두 가지 일이다: **배치** (칸과 층) 와 **그리기** (픽셀, 글자). 배치 하나, 그리는 쪽은 여럿.
- **[JS]** 잎은 함께 쓰는 카운터 (클로저) 에서 다음 칸을 받고, 부모는 자식들의 가운데에 선다: 후위 순회 한 번. 아무것도 없는 `Math.min()` 은 `Infinity` 이므로 잎의 경우를 먼저 다룬다.
- **[JS]** SVG 는 글자다: `viewBox` (y 는 아래로 커짐), `line`, `g` + `translate`, `rect`, `text`, `title`, `fill`/`stroke` 를 쓰는 `style`. 마크업 안의 글자는 이스케이프하되 `&` 가 먼저.
- **[JS]** DOM 에서 SVG 는 SVG 네임스페이스와 함께 `createElementNS` 로 만든다. `createElement` 는 조용한 `HTMLUnknownElement` 를 만든다. `textContent` 는 이스케이프가 필요 없다.
- **[TS]** `Svg<K extends keyof SVGElementTagNameMap>` 은 `SVGElementTagNameMap[K]` 를 돌려준다: 태그 이름이 요소 타입을 정하고, `as` 가 없다.
- **[JS + TS]** `role="img"` + `<title>` 이 그림에 이름을 붙인다. `aria-current="step"` 은 보여 주는 단계를 표시하고, CSS 는 같은 속성을 꾸민다.
- DevCalc Lv12: 코어의 `LayoutTree()` / `TreeLines()`, `--tree`, 그리고 Steps 에서 고른 단계를 따라가는 Tree 패널.

## 다음으로 갈 곳

이 강의에서 만든 것 위에 올릴 아이디어:

- **한 단계씩 넘기기**: `nAt` 을 하나씩 움직이는 ◀ ▶ 버튼 (과 화살표 키) 으로, 트리를 슬라이드 쇼처럼 넘겨 본다.
- **트리 누르기**: 상자마다 포커스를 받을 수 있게 하고, 고르면 그 부분의 값과 글자를 보여 준다.
- **내보내기**: 그림을 직렬화해서 (`XMLSerializer`) `.svg` 파일로 내려받는 "SVG 저장" 버튼. svg.ts 의 브라우저판.

---

[← 이전: 16. 트리와 재귀](../16-trees-steps/README.ko.md) · [목차](../../README.ko.md)
