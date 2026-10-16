**English** · [한국어](README.ko.md)

[← Previous: 15. Bundling and Build](../15-bundling-release/README.md) · [Contents](../../README.md)

# 16. Trees and Recursion — Watching a Calculation Step by Step

> Series: DH.Study.TypeScript · Lesson 16 (Part 3)
> Environment: Node.js v24 · TypeScript 7 · Vitest 5 · VS Code · a browser

## Goals

After this lesson you can:

- [ ] Draw the tree the parser builds for an expression, and explain how precedence and `( )` decide its shape
- [ ] Walk a tree three ways (pre-order, in-order, post-order) and say why post-order is the order of the work
- [ ] Rewrite an immutable tree one step at a time with spread copies, and explain structural sharing
- [ ] Tell `readonly` (a compile-time promise) from `Object.freeze` (a run-time lock)
- [ ] Pass a listener function into a recursive walk, and key a `Map` by objects instead of text
- [ ] Show DevCalc's calculation one part at a time: `--steps` on the command line, a Steps panel on the page

## Contents

1. [An expression is a tree](#1-an-expression-is-a-tree)
2. [Three ways to walk a tree](#2-three-ways-to-walk-a-tree)
3. [Steps by rewriting](#3-steps-by-rewriting)
4. [Steps by listening](#4-steps-by-listening)
5. [Try it](#5-try-it)
6. [DevCalc step — Lv11 calculation steps](#6-devcalc-step--lv11-calculation-steps)
7. [Summary](#summary)
8. [Where next](#where-next)

Example files for this lesson: [tree.ts](tree.ts) · [rewrite.ts](rewrite.ts) · [listen.ts](listen.ts)

> Each example has a Korean-comment twin (`x.ko.ts`) with the same code. The Korean lesson ([README.ko.md](README.ko.md)) uses those.

> Syntax tags: **[JS]** = JavaScript syntax (exists without TS) · **[TS]** = type syntax that TypeScript adds (erase it and you get JS) · details in [lesson 00, 7-3](../00-setup/README.md#7-3-ts-syntax--js-syntax--type-syntax)

DevCalc says `10 + 30 * (100 + 2) / 10 + 20` is 336, but not how it got there. School teaches it as a chain of smaller and smaller expressions, the innermost part first. This lesson makes DevCalc show that chain:

```
> node devcalc/src/main.ts "10 + 30 * (100 + 2) / 10 + 20" --steps
Steps : 5
  10 + 30 * (100 + 2) / 10 + 20   100 + 2 = 102
  10 + 30 * 102 / 10 + 20         30 * 102 = 3060
  10 + 3060 / 10 + 20             3060 / 10 = 306
  10 + 306 + 20                   10 + 306 = 316
  316 + 20                        316 + 20 = 336
  336
HEX : 0x150
DEC : 336
BIN : 0b1_0101_0000
```

The parser from lesson 10 already did the hard part: it turned the text into a tree. Everything here is about reading that tree.

---

## 1. An expression is a tree

[tree.ts](tree.ts) parses the example with DevCalc's own `Parse` and draws the result:

```
1) 10 + 30 * (100 + 2) / 10 + 20
   +
   ├─ +
   │  ├─ 10
   │  └─ /
   │     ├─ *
   │     │  ├─ 30
   │     │  └─ +
   │     │     ├─ 100
   │     │     └─ 2
   │     └─ 10
   └─ 20
```

- Every operator is a node with two children; every number is a **leaf** (a node with no children).
- The **root** (top) is the last `+`: the operator that is calculated last.
- The `( )` are gone. They did their job while parsing: they put `100 + 2` deep in the tree, under the `*`. The shape now says what the parentheses said.
- `*` and `/` are deeper than the `+` that surround them because they bind tighter (precedence). `30 * … / 10` has `*` under `/` because both have the same precedence and are read left to right.

### 1-1. Drawing it: a recursive function

```ts
function Draw(oNode: TNode, strIndent: string, bLast: boolean, bRoot: boolean): void {
	console.log(bRoot ? `   ${Label(oNode)}` : `   ${strIndent}${bLast ? "└─ " : "├─ "}${Label(oNode)}`);
	const arrChild = Children(oNode);
	const strNext = bRoot ? "" : strIndent + (bLast ? "   " : "│  ");
	arrChild.forEach((oChild, nIndex) => Draw(oChild, strNext, nIndex === arrChild.length - 1, false));
}
```

**[JS]** `Draw` prints one node, then calls itself for each child with a longer indent. A tree is a recursive shape (a node holds nodes), so a recursive function fits it: there is no need to know how deep it goes. The **base case** (where the recursion stops) is a leaf: `Children()` returns `[]` and `forEach` does nothing.

### 1-2. One label per kind: a switch that can't forget

```ts
function Label(oNode: TNode): string {
	switch (oNode.eKind) {
		case "number":
			return oNode.strText;
		…
		default: {
			const oNever: never = oNode; // every kind was handled above, so nothing is left
			return oNever;
		}
	}
}
```

**[TS]** `TNode` is the discriminated union from lesson 10 (lesson 03 for the idea). After the cases, TypeScript has narrowed `oNode` down to nothing: the type `never`. If someone adds a new kind to `TNode` and forgets `Label`, the `never` line becomes a red squiggle (TS2322) instead of a silent `undefined` at run time.

`oNode.strText` is new in this lesson: the number node now keeps the text as it was typed (`0xFF`, `'A'`, `4K`), so a drawing can show it the same way.

---

## 2. Three ways to walk a tree

```ts
function PreOrder(oNode: TNode): string[] {
	return [Label(oNode), ...Children(oNode).flatMap(PreOrder)]; // the node, then its children
}

function PostOrder(oNode: TNode): string[] {
	return [...Children(oNode).flatMap(PostOrder), Label(oNode)]; // the children, then the node
}
```

```
2) pre-order  : + + 10 / * 30 + 100 2 10 20
   in-order   : ((10 + ((30 * (100 + 2)) / 10)) + 20)
   post-order : 10 30 100 2 + * 10 / + 20 +
```

The three visit the same nodes. They differ only in **when the node itself is written down**: before its children (pre), between them (in), or after them (post).

- **in-order** is how people write: `left op right`. With a `( )` around every operator it gives back an expression; DevCalc's `ToText` from lesson 10 is an in-order walk.
- **post-order** is the order of the work. A `+` can only be calculated after both of its sides are numbers, so it must come after its children. This is also how lesson 10's `Evaluate` works: it calls itself on both children first, then applies the operator.
- **[JS]** `flatMap` maps each child to a list and joins the lists. `[...a, x]` and `[x, ...a]` are the whole difference between post-order and pre-order.

### 2-1. Post-order, read with a stack

The post-order list can be calculated without the tree: a number goes on a stack, an operator takes two off and puts the result back.

```
3)  100 + 2    = 102   stack : [10, 30, 102]
3)   30 * 102  = 3060  stack : [10, 3060]
3) 3060 / 10   = 306   stack : [10, 306]
3)   10 + 306  = 316   stack : [316]
3)  316 + 20   = 336   stack : [336]
   result : 336
```

These are the five steps from the top of this lesson, in the same order. Old HP calculators worked like this (RPN: you typed `10 30 100 2 + * …`), and so do many virtual machines. So "show the steps" means: **show the post-order calculations**.

---

## 3. Steps by rewriting

The first idea: calculate one part, get a new, smaller tree, print it, and repeat until only a number is left. [rewrite.ts](rewrite.ts) builds a small tree type of its own to try it.

### 3-1. readonly all the way down

```ts
type TOp = "+" | "-" | "*" | "/";
type TExpr = { readonly eKind: "num"; readonly biValue: bigint } | { readonly eKind: "bin"; readonly strOp: TOp; readonly oLeft: TExpr; readonly oRight: TExpr };

const FIRST = Bin(Bin(Num(10n), "+", Bin(Bin(Num(30n), "*", Bin(Num(100n), "+", Num(2n))), "/", Num(10n))), "+", Num(20n));
// FIRST.eKind = "num"; // ← Uncomment → red squiggle TS2540 (Cannot assign to 'eKind' because it is a read-only property)
```

**[TS]** `TExpr` refers to itself: a recursive type (lesson 10). Every property is `readonly`, so no step can change a tree by accident: each step has to build a new one.

### 3-2. One step: copy the path, share the rest

```ts
function ReduceOnce(oExpr: TExpr): TExpr {
	if (oExpr.eKind === "num") {
		return oExpr; // nothing left to do
	}
	const { oLeft, oRight } = oExpr;
	if (oLeft.eKind === "num" && oRight.eKind === "num") {
		return Num(Apply(oLeft.biValue, oExpr.strOp, oRight.biValue)); // the base case : one calculation
	}
	if (oLeft.eKind === "bin") {
		return { ...oExpr, oLeft: ReduceOnce(oLeft) };
	}
	return { ...oExpr, oRight: ReduceOnce(oRight) };
}
```

`ReduceOnce` goes down to the first node whose two children are numbers (left side first) and replaces it with its value. **[JS]** `{ ...oExpr, oLeft: … }` copies the node with one property changed. Only the nodes on the path down are copied; the rest of the new tree is **the same objects** as the old one (**structural sharing**):

```
1) 10 + 30 * (100 + 2) / 10 + 20
   10 + 30 * 102 / 10 + 20
   10 + 3060 / 10 + 20
   10 + 306 + 20
   316 + 20
   336
2) FIRST after all the steps : 10 + 30 * (100 + 2) / 10 + 20
   right part (20) is the same object : true
   left part is the same object       : false
```

The first tree is untouched after all the steps. The first step changed something inside the left part, so the left part is a new object; the `20` on the right was not on the path, so both trees point at the same `20`.

### 3-3. Fewest parentheses

The tree has no `( )`, so `Show()` has to put back only the ones that matter: a child needs them when it binds looser than its parent, or equally tight on the right side (`8 - (4 - 2)` is not `8 - 4 - 2`):

```ts
const strLeft = oExpr.oLeft.eKind === "bin" && PRECEDENCE[oExpr.oLeft.strOp] < nMine ? `(${Show(oExpr.oLeft)})` : Show(oExpr.oLeft);
const strRight = oExpr.oRight.eKind === "bin" && PRECEDENCE[oExpr.oRight.strOp] <= nMine ? `(${Show(oExpr.oRight)})` : Show(oExpr.oRight);
```

That is why `(100 + 2)` keeps its `( )` in the first line, and why there are none after it is gone.

### 3-4. readonly is a promise, Object.freeze is a lock

```
3) readonly, written through as : 2
   Expected error: TypeError: Cannot assign to read only property 'biValue' of object '#<Object>'
   Why : Object.freeze made the property read-only at run time, not just in the types.
   Fix : build a new object instead ({ ...oFrozen, biValue: 2n }) : the way ReduceOnce works.
```

**[TS]** `readonly` exists only in the types. `(oLoose as { biValue: bigint }).biValue = 2n` compiles (the `as` tells TypeScript to look away, lesson 12), and the object really changes. **[JS]** `Object.freeze()` locks the object at run time: in a module (always strict mode) writing to it throws. `readonly` catches mistakes while you type; `freeze` catches them while the program runs, at a small cost. Neither goes deeper than one level: `freeze` on the root does not freeze the children.

### 3-5. Why DevCalc does not do it this way

Rewriting works for `+ - * /`. For DevCalc it would be a second calculator: word sizes and wrapping, unsigned results, `**` and its errors, functions, variables, `ans`, assignment. Every rule would have to be written twice, and the steps could one day disagree with the answer. The next section avoids that.

---

## 4. Steps by listening

DevCalc's `Evaluate` already visits every node in post-order and calculates it. Instead of calculating again, let it **tell us** each time.

### 4-1. A listener is a function type

```ts
// devcalc/src/core/Evaluate.ts
export type TStepListener = (oNode: TNode, oResult: ICalcResult) => void;
```

`EvaluateTree(strExpr, oTree, oWord, biAns, mapVar, fnStep)` is `Evaluate` for a tree that is already parsed, with one more, optional argument. Inside the walk every case ends with `Heard(oNode, oResult, oContext)`, which calls `oContext.fnStep?.(oNode, oResult)` and returns the result unchanged. **[JS]** `?.()` calls the function only when there is one, so `Evaluate` without a listener works exactly as before.

[listen.ts](listen.ts) passes a listener that prints what it hears:

```ts
const fnPrint: TStepListener = (oNode, oResult) => {
	console.log(`   heard ${ToText(oNode).padEnd(15)} = ${oResult.biValue}`);
};
EvaluateTree("1 + 2 * 3", oTree, undefined, undefined, undefined, fnPrint);
```

```
1) 1 + 2 * 3
   heard 1               = 1
   heard 2               = 2
   heard 3               = 3
   heard (2 * 3)         = 6
   heard (1 + (2 * 3))   = 7
```

Post-order, children first, as section 2 said. **[TS]** Because `fnPrint` is annotated with `TStepListener`, `oNode` and `oResult` get their types without writing them (contextual typing, lesson 02).

This is the same idea as an `addEventListener` callback (lesson 07): the code that knows *when* something happens calls the code that knows *what to do* with it. The calculator does not know about steps, and the steps do not know how to calculate.

### 4-2. A Map keyed by objects

To draw a step, DevCalc has to remember which parts are already done. The obvious key is the part's text, and it is wrong:

```
2) left  (1 + 1) done?  by node : true  by text : true
   right (1 + 1) done?  by node : false by text : true ← wrong : it was not calculated yet
```

`(1 + 1) * (1 + 1)` has two `1 + 1` nodes. After the left one is calculated, a `Map<string, bigint>` says the right one is done too, because the texts are equal. **[JS]** A `Map` can use **any value as a key**, objects included, and compares object keys by identity (`===`): the same object, not an equal-looking one. A `Map<TNode, bigint>` keeps the two apart. A plain object `{}` can't do this: its keys become strings (lesson 13).

### 4-3. Explain: listen, then draw the whole tree

`devcalc/src/core/Steps.ts` puts it together:

```ts
// Keyed by the node object itself : two "1 + 1" in one tree are two different keys
const mapValue = new Map<TNode, bigint>(); // every part calculated so far
const mapDone = new Map<TNode, bigint>(); // only the steps : a number as typed keeps its text (0xFF, 'A')
const arrStep: IStep[] = [];
const oResult = EvaluateTree(strTrim, oRoot, oWord, biAns, mapVar, (oNode, oCalc) => {
	mapValue.set(oNode, oCalc.biValue);
	const strNote = NoteFor(oNode, oCalc, mapValue, oWord);
	if (!IsStep(oNode, strNote)) {
		return;
	}
	const { strText, nStart, nEnd } = Draw(oRoot, mapDone, oNode);
	arrStep.push({ strExpr: strText, nStart, nEnd, strWork: WorkFor(oNode, oCalc.biValue, mapDone), strNote });
	mapDone.set(oNode, oCalc.biValue);
});
```

- Each time a part is calculated, `Draw` draws the **whole** tree once, with every part in `mapDone` drawn as its number. That is the line of the step. Then the part itself goes into `mapDone`, so the next line shows its value.
- `Draw` also returns where the part is in the line (`nStart`, `nEnd`), so the page can highlight it.
- A number as typed (`0xFF`) is not a step, and neither is `-5`, unless the word size changed it (300 in 8 bits is 44).
- The tree is never changed, and the answer is the one `Evaluate` gives: the steps can't disagree with it.

More from [listen.ts](listen.ts), with `( )` placed by precedence and associativity (`**` is right-associative), and notes where a value may surprise:

```
   2 ** 3 ** 2 : right-associative, so the right part first
   2 ** 3 ** 2   3 ** 2 = 9
   2 ** 9        2 ** 9 = 512
   512
   (0xF0 >>> 4) * 20 + 7 / 2 in 8 bits : notes for a wrap and a dropped remainder
   (0xF0 >>> 4) * 20 + 7 / 2   0xF0 >>> 4 = 15
   15 * 20 + 7 / 2             15 * 20 = 44   (300 does not fit in 8 bits, wrapped to 44)
   44 + 7 / 2                  7 / 2 = 3   (integer division : remainder 1 dropped)
   44 + 3                      44 + 3 = 47
   47
   1 / (2 - 2) : no steps, the same error Evaluate gives
   Cannot calculate: "1 / (2 - 2)" : division by zero
```

---

## 5. Try it

Run the three examples:

```
> node lessons/16-trees-steps/tree.ts
1) 10 + 30 * (100 + 2) / 10 + 20
   +
   ├─ +
   │  ├─ 10
   │  └─ /
   │     ├─ *
   │     │  ├─ 30
   │     │  └─ +
   │     │     ├─ 100
   │     │     └─ 2
   │     └─ 10
   └─ 20
2) pre-order  : + + 10 / * 30 + 100 2 10 20
   in-order   : ((10 + ((30 * (100 + 2)) / 10)) + 20)
   post-order : 10 30 100 2 + * 10 / + 20 +
3)  100 + 2    = 102   stack : [10, 30, 102]
3)   30 * 102  = 3060  stack : [10, 3060]
3) 3060 / 10   = 306   stack : [10, 306]
3)   10 + 306  = 316   stack : [316]
3)  316 + 20   = 336   stack : [336]
   result : 336
```

```
> node lessons/16-trees-steps/rewrite.ts
1) 10 + 30 * (100 + 2) / 10 + 20
   10 + 30 * 102 / 10 + 20
   10 + 3060 / 10 + 20
   10 + 306 + 20
   316 + 20
   336
2) FIRST after all the steps : 10 + 30 * (100 + 2) / 10 + 20
   right part (20) is the same object : true
   left part is the same object       : false
3) readonly, written through as : 2
   Expected error: TypeError: Cannot assign to read only property 'biValue' of object '#<Object>'
   Why : Object.freeze made the property read-only at run time, not just in the types.
   Fix : build a new object instead ({ ...oFrozen, biValue: 2n }) : the way ReduceOnce works.
```

```
> node lessons/16-trees-steps/listen.ts
1) 1 + 2 * 3
   heard 1               = 1
   heard 2               = 2
   heard 3               = 3
   heard (2 * 3)         = 6
   heard (1 + (2 * 3))   = 7
2) left  (1 + 1) done?  by node : true  by text : true
   right (1 + 1) done?  by node : false by text : true ← wrong : it was not calculated yet
3) 10 + 30 * (100 + 2) / 10 + 20
   10 + 30 * (100 + 2) / 10 + 20   100 + 2 = 102
   10 + 30 * 102 / 10 + 20         30 * 102 = 3060
   10 + 3060 / 10 + 20             3060 / 10 = 306
   10 + 306 + 20                   10 + 306 = 316
   316 + 20                        316 + 20 = 336
   336
   2 ** 3 ** 2 : right-associative, so the right part first
   2 ** 3 ** 2   3 ** 2 = 9
   2 ** 9        2 ** 9 = 512
   512
   (0xF0 >>> 4) * 20 + 7 / 2 in 8 bits : notes for a wrap and a dropped remainder
   (0xF0 >>> 4) * 20 + 7 / 2   0xF0 >>> 4 = 15
   15 * 20 + 7 / 2             15 * 20 = 44   (300 does not fit in 8 bits, wrapped to 44)
   44 + 7 / 2                  7 / 2 = 3   (integer division : remainder 1 dropped)
   44 + 3                      44 + 3 = 47
   47
   1 / (2 - 2) : no steps, the same error Evaluate gives
   Cannot calculate: "1 / (2 - 2)" : division by zero
```

Things to try:

- In tree.ts, change `EXPR` to `(10 + 30) * 2` → the `+` moves under the `*`, and the post-order list ends with `*`.
- In tree.ts, add `| { readonly eKind: "test" }` to `TNode` in `devcalc/src/core/Parser.ts` → `Label` gets a red squiggle on the `never` line (remove it again afterwards).
- In rewrite.ts, uncomment `FIRST.eKind = "num";` → TS2540.
- In rewrite.ts, set `FIRST` to `Bin(Num(8n), "-", Bin(Num(4n), "-", Num(2n)))` → `8 - (4 - 2)`, `8 - 2`, `6`. Then change `<=` to `<` in `strRight` → the first line reads `8 - 4 - 2`: a different expression with a different answer (2).
- In listen.ts, add `PrintSteps("(1 + 1) * (1 + 1)");` → two separate `1 + 1 = 2` steps, the left one first: the Map keyed by node tells them apart.

---

## 6. DevCalc step — Lv11 calculation steps

### What changed

| File | Change |
|---|---|
| `devcalc/src/core/Parser.ts` | the number node keeps `strText`, the text as typed |
| `devcalc/src/core/Evaluate.ts` | `TStepListener`, `EvaluateTree()` (a parsed tree, optional listener), `Heard()` in every case of the walk. `Evaluate()` = `Parse` + `EvaluateTree` |
| `devcalc/src/core/Steps.ts` | new: `Explain()` → `IExplanation` (`arrStep`, `strLast`, `oEval`); `IStep` (`strExpr`, `nStart`/`nEnd`, `strWork`, `strNote`); fewest `( )`, notes for a dropped remainder and a wrap |
| `devcalc/src/core/index.ts` | exports `EvaluateTree`, `TStepListener`, `Explain`, `IExplanation`, `IStep` |
| `devcalc/src/main.ts` | `--steps` |
| `devcalc/web/index.html` | Steps panel (`<details id="steps-box">` with an `<ol>`), title `Lv11` |
| `devcalc/web/App.ts` | `ShowSteps()`: one line per step, the part calculated next in a `<mark>` |
| `devcalc/web/style.css` | `--mark` colour (light and dark), `.steps` |
| `devcalc/tests/Steps.test.ts` | new: 9 tests |

The calculation rules did not change: `Explain` and `Evaluate` run the same walk.

### The page

```ts
// devcalc/web/App.ts
const elMark = document.createElement("mark");
elMark.textContent = strExpr.slice(nStart, nEnd);
const elCode = document.createElement("code");
elCode.append(strExpr.slice(0, nStart), elMark, strExpr.slice(nEnd));
```

The expression is user input, so the line is built from text nodes (`append` with strings, `textContent`), never `innerHTML` (lesson 07). `<mark>` is the HTML element for "highlighted for reference": screen readers can announce it, and it gets the `--mark` colour in both themes.

The first two lines of the panel for the example (the `[ ]` stands for the highlight):

```
10 + 30 * [(100 + 2)] / 10 + 20     100 + 2 = 102
10 + [30 * 102] / 10 + 20           30 * 102 = 3060
```

The last line is `336` in bold. With `--bits=8` (or 8 bits chosen on the page) the notes appear after the work, in brackets.

### Tests

`devcalc/tests/Steps.test.ts` checks: the example's lines, works and highlighted parts; the same value as `Evaluate` for `1 + 2 * 3`, `2 ** 3 ** 2`, `8 - 4 - 2`, `(0xFF + 1) << 4`, `~0x0F & 0xFF`, `max(3, 1 + 1) * -2`; only the `( )` the tree needs (`(2 - 5) ** 2` → `(-3) ** 2`, because `-3 ** 2` is an error); literals as typed; names, functions and assignment (`x → 21`, `y = 84`); the notes; the same errors as `Evaluate`; and that the listener hears the nodes in post-order without changing the tree.

```
> npm test
check-pairs : 73 pairs, 0 failed
check-names : 38 files, 0 problems

 Test Files  13 passed (13)
      Tests  88 passed (88)
```

### Checked

The page was opened through a local server in a headless browser: the title is `DevCalc Lv11 · web`, the example shows 5 steps with the right parts highlighted, 8 bits shows the wrap note, and `<b>1</b>` shows the error, empties the panel and creates no `<b>` element. `npm run build:single` puts the panel into `DevCalc.html` as well.

Things to try:

- `node devcalc/src/main.ts "x = 3; y = x * x + 1" --steps` → `x = 3` has no steps (3 is typed as it is), the second expression has 4: `x → 3` twice, `3 * 3 = 9`, `9 + 1 = 10`, then `y = 10`.
- `node devcalc/src/main.ts "-0x80 / 3" --bits=8 --steps` → `-0x80 = 128   (-128 as 8-bit unsigned)`, then `128 / 3 = 42   (integer division : remainder 2 dropped)`. DevCalc's words are unsigned (lesson 12), so the answer is 42, not -42.
- On the page, type `popcount(0xF0) << 2` and press Enter → the function call is one step, then the shift.

---

## Summary

- **[JS]** An expression is a tree: operators are nodes, numbers are leaves. Precedence and `( )` decide the shape while parsing; after that the `( )` are gone.
- **[JS]** A recursive function fits a recursive shape. Pre-, in- and post-order differ only in when the node is written. **Post-order is the order of the work**, and a stack is enough to calculate it.
- **[TS]** A `never` line at the end of a switch makes forgetting a new kind a compile error. A recursive type with `readonly` everywhere makes every change build a new tree.
- **[JS]** `{ ...oExpr, oLeft: … }` copies the path and shares the rest (structural sharing). `readonly` is checked by the compiler only; `Object.freeze` throws at run time, one level deep.
- **[JS]** A listener (a function passed in) lets the calculator report each part without knowing about steps. A `Map` keyed by objects compares by identity: two equal-looking parts stay two keys.
- DevCalc Lv11: `Explain()` → `--steps` and the Steps panel, the next part highlighted, always the same answer as `Evaluate`.

## Where next

Ideas built on what this lesson made:

- **A tree view**: draw `Children()` as nested boxes or an SVG tree on the page, and highlight the node of the current step.
- **Step through**: ◀ ▶ buttons that show one step at a time, with the keyboard patterns from lesson 14.
- **Floating point bits**: DevCalc works on integers. A lesson on IEEE 754 (`0.1 + 0.2`, sign, exponent and fraction bits, `DataView` and `Float64Array`) would show why `0.1 + 0.2 !== 0.3`.

---

[← Previous: 15. Bundling and Build](../15-bundling-release/README.md) · [Contents](../../README.md)
