**English** · [한국어](README.ko.md)

[← Previous: 09. Testing and Tooling](../09-testing-tooling/README.md) · [Contents](../../README.md) · Next: none (last lesson)

# 10. (Challenge) Lexer and Parser — Recursion, Syntax Trees and Whole Expressions

> Series: DH.Study.TypeScript · Lesson 10
> Environment: Node.js v24 · TypeScript 7 · Vitest 5 · VS Code

## Goals

After this lesson you can:

- [ ] Write a recursive function with a base case, and know when the call stack runs out (and what to do then)
- [ ] Describe recursive data with a recursive type (`interface` or discriminated union) and walk it with a `switch`
- [ ] Turn text into tokens with a lexer (a scanning loop, or sticky regexes), keeping the column for errors
- [ ] Turn tokens into a syntax tree with a recursive descent parser, and calculate the tree
- [ ] Handle precedence and associativity with a table (precedence climbing)

## Contents

1. [Recursion](#1-recursion)
2. [Lexer](#2-lexer)
3. [Syntax tree](#3-syntax-tree)
4. [Recursive descent parser](#4-recursive-descent-parser)
5. [Try it](#5-try-it)
6. [Build it — precedence climbing](#6-build-it--precedence-climbing)
7. [DevCalc step — Lv5 whole expressions](#7-devcalc-step--lv5-whole-expressions)
8. [Summary](#summary)
9. [Where next](#where-next)

Example files for this lesson: [recursion.ts](recursion.ts) · [lexer.ts](lexer.ts) · [parser.ts](parser.ts) · [precedence.ts](precedence.ts)

> Each example has a Korean-comment twin (`x.ko.ts`) with the same code. The Korean lesson ([README.ko.md](README.ko.md)) uses those.

> Syntax tags: **[JS]** = JavaScript syntax (exists without TS) · **[TS]** = type syntax that TypeScript adds (erase it and you get JS) · details in [lesson 00, 7-3](../00-setup/README.md#7-3-ts-syntax--js-syntax--type-syntax)

Until now DevCalc read at most `a op b`: one number, an operator, one number. `1 + 2 + 3` was an error. This lesson teaches it to read **any** expression — `(0xFF + 1) << 4`, `-ans * 2`, `1 | 2 ^ 3 & 4` — the way a compiler reads code: text → **tokens** (lexer) → **syntax tree** (parser) → value (evaluator).

```
"(1 + 2) * 3"  ──Lex──▶  ( 1 + 2 ) * 3 end  ──Parse──▶      *       ──Calc──▶  9
                                                           ├─ +
                                                           │  ├─ 1
                                                           │  └─ 2
                                                           └─ 3
```

This is the challenge lesson: everything from the earlier lessons (unions and narrowing, classes, `Result`, tests) comes together. The new idea is only one: **recursion**.

---

## 1. Recursion

A recursive function calls itself. It needs two parts:

- a **base case** — an input small enough to answer directly (stop here);
- a **step** — make the problem smaller and call yourself on the smaller part.

```ts
function SumDigits(biValue: bigint): bigint {
	if (biValue < 10n) {
		return biValue; // base case : one digit
	}
	return (biValue % 10n) + SumDigits(biValue / 10n); // step : the last digit + the sum of the rest
}
```

`SumDigits(987n)` calls `SumDigits(98n)`, which calls `SumDigits(9n)`. Each call **waits** on the call stack for the one inside it; then they finish in reverse order (9 → 17 → 24). The example prints this.

> **C#** : nothing new — recursion works the same. You can't count on tail-call elimination in either, so deep recursion overflows in both. C# kills the process (`StackOverflowException` can't be caught); JavaScript throws a `RangeError` you *can* catch.

### 1-1. Recursive types

Recursion is most useful when the **data** is recursive: a folder holds folders, an expression holds expressions. **[TS]** A type may refer to itself:

```ts
interface IFolder {
	strName: string;
	arrChild: IFolder[]; // the interface refers to itself
}

type TExpr = { eKind: "number"; nValue: number } | { eKind: "add"; oLeft: TExpr; oRight: TExpr };
```

Recursive data is walked by a recursive function — one call per node, and the shape of the code follows the shape of the type:

```ts
function Calc(oExpr: TExpr): number {
	switch (oExpr.eKind) {
		case "number":
			return oExpr.nValue; // base case : a leaf
		case "add":
			return Calc(oExpr.oLeft) + Calc(oExpr.oRight); // step : the two smaller trees
	}
}
```

There is no `default` and no final `return`: every case of the union returns, and TS knows it (lesson 03's exhaustiveness). Add a third kind to `TExpr` and `Calc` gets a red squiggle until you handle it.

### 1-2. When the stack runs out

Every waiting call takes stack space. Two ways to run out:

| Cause | Example | Fix |
|---|---|---|
| No base case (a bug) | `Forever(n)` calls `Forever(n + 1)` | a base case that is always reached |
| Correct, but the input is too deep | a folder chain 100,000 levels deep | a loop with your own stack, or a depth limit |

Both throw `RangeError: Maximum call stack size exceeded` (around ten thousand calls in Node, depending on the frame size). For input you don't control — text a user types — that matters: `((((((…1` with 100,000 parentheses must give an error message, not a crash. DevCalc's parser has a depth limit for exactly that (section 7).

The loop version replaces the call stack with an array:

```ts
function CountFoldersLoop(oFolder: IFolder): number {
	const arrTodo: IFolder[] = [oFolder];
	let nCount = 0;
	for (let oNext = arrTodo.pop(); oNext !== undefined; oNext = arrTodo.pop()) {
		nCount++;
		arrTodo.push(...oNext.arrChild);
	}
	return nCount;
}
```

Use recursion when the depth is small and known (a syntax tree a person typed, a folder tree); use the loop when the depth can be huge.

---

## 2. Lexer

A **lexer** (tokenizer, scanner) turns text into **tokens**: the words of the language. `12 + 3*(40 - 1)` becomes `12`, `+`, `3`, `*`, `(`, `40`, `-`, `1`, `)`. After this step, nobody looks at single characters, spaces or digits again.

**[TS]** A token is a discriminated union — each kind has only the fields it needs:

```ts
type EOp = "+" | "-" | "*" | "/";

type TToken =
	| { eKind: "number"; nValue: number; nCol: number }
	| { eKind: "operator"; strOp: EOp; nCol: number }
	| { eKind: "open" | "close" | "end"; nCol: number };
```

- `nCol` (1-based column) is kept so that errors can say **where**.
- The list always ends with an `end` token. The parser can then always look one token ahead without checking the length.

### 2-1. The scanning loop

**[JS]** Look at the character at `nPos`, read one whole token, move `nPos` past it:

```ts
while (nPos < strExpr.length) {
	const strChar = strExpr.charAt(nPos);
	const nCol = nPos + 1;
	if (strChar === " ") {
		nPos++; // spaces only separate tokens
	} else if (IsDigit(strChar)) {
		const nStart = nPos;
		while (IsDigit(strExpr.charAt(nPos))) {
			nPos++;
		}
		arrToken.push({ eKind: "number", nValue: Number(strExpr.slice(nStart, nPos)), nCol });
	} else if (IsOp(strChar)) {
		arrToken.push({ eKind: "operator", strOp: strChar, nCol }); // IsOp is a type guard : strChar is EOp here
		nPos++;
	}
	// ... ( ) , or an error with nCol
}
```

`IsOp(strChar): strChar is EOp` is a type guard (lesson 03): after it, `strChar` is `EOp`, so it fits the `strOp` field without a cast.

### 2-2. Sticky regexes

**[JS]** With many token kinds the loop gets long. A regex can read one token, but a normal `g` regex **searches ahead**; the `y` (sticky) flag matches only **at** `lastIndex`:

```ts
const RE_NUMBER_Y = /\d+/y;
RE_NUMBER_Y.lastIndex = 0;
RE_NUMBER_Y.exec("ab12"); // null : nothing AT column 1 (a /g regex would find "12" at column 3)
```

That is exactly what a lexer needs: "is there a number *here*?". DevCalc's lexer is four sticky regexes (section 7).

> **C#** : `Regex.Match(text, startat)` searches ahead like `g`; the sticky equivalent is the `\G` anchor (`new Regex(@"\G\d+")`). Roslyn's lexer, like most real ones, is a hand-written loop over characters.

---

## 3. Syntax tree

Tokens are flat; an expression is not. `1 + 2 * 3` means `1 + (2 * 3)`. The **syntax tree** (AST, abstract syntax tree) makes the grouping visible — what is lower in the tree is calculated first:

```
1 + 2 * 3        (1 + 2) * 3      8 - 4 - 2
+                *                -
├─ 1             ├─ +             ├─ -
└─ *             │  ├─ 1          │  ├─ 8
   ├─ 2          │  └─ 2          │  └─ 4
   └─ 3          └─ 3             └─ 2
```

- Parentheses are gone from the tree: they only decided its shape.
- `8 - 4 - 2` is `(8 - 4) - 2` = 2, not `8 - (4 - 2)` = 6. Operators of the same level group **left to right** (left-associative).

**[TS]** The tree is a recursive discriminated union:

```ts
type TNode =
	| { eKind: "number"; nValue: number }
	| { eKind: "negate"; oOperand: TNode }
	| { eKind: "binary"; strOp: EOp; oLeft: TNode; oRight: TNode };
```

Calculating it is the `Calc` of section 1-1 with more cases: a leaf is its value; a node calculates its children first, then itself.

> **C#** : this is what Roslyn gives you (`SyntaxTree`, `BinaryExpressionSyntax`), and what `System.Linq.Expressions` builds from a lambda (`BinaryExpression`, `Expression.Add`). In C# the node kinds are classes in a hierarchy; in TS a union of plain objects with `eKind` is enough — and the compiler checks every `switch`.

---

## 4. Recursive descent parser

A **parser** turns tokens into the tree. The rules are written as a **grammar** — one line per rule, and `{ }` means "repeat":

```
expression = term   { ("+" | "-") term }
term       = factor { ("*" | "/") factor }
factor     = number | "-" factor | "(" expression ")"
```

A **recursive descent** parser has one function per rule. Each one calls the rule below it; `factor` calls `expression` again for `( )` — that is the recursion.

```ts
#ParseExpression(): TNode {
	let oLeft = this.#ParseTerm();
	while (this.#Peek() === "+" || this.#Peek() === "-") {
		const strOp = this.#Next() as EOp;
		oLeft = { eKind: "binary", strOp, oLeft, oRight: this.#ParseTerm() }; // the loop makes 8 - 4 - 2 = (8 - 4) - 2
	}
	return oLeft;
}

#ParseFactor(): TNode {
	const strToken = this.#Next();
	if (/^\d+$/.test(strToken)) {
		return { eKind: "number", nValue: Number(strToken) };
	}
	if (strToken === "-") {
		return { eKind: "negate", oOperand: this.#ParseFactor() };
	}
	if (strToken === "(") {
		const oInside = this.#ParseExpression(); // recursion : a whole expression inside ( )
		if (this.#Next() !== ")") {
			throw new SyntaxError(`expected ")"`);
		}
		return oInside;
	}
	throw new SyntaxError(`expected a number, "-" or "(", found ...`);
}
```

- **Precedence comes from the order of the rules.** `term` is called *inside* `expression`, so `*` is grouped before `+` reaches it.
- **Left-associativity comes from the loop.** Each turn wraps the tree built so far (`oLeft`) in a new node.
- **Errors**: each rule knows which tokens may come next. Anything else is a syntax error, found at the first token that doesn't fit. After the top rule, the next token must be the end (`1 2` is an error).

> **C#** : `#` fields are private at run time (lesson 04). `throw new SyntaxError` inside the parser is fine: it never leaves `Parse` in DevCalc, which turns it into a `Result` (section 7).

---

## 5. Try it

### [recursion.ts](recursion.ts) — base case and step, recursive types, a stack overflow, the loop version

```
> node lessons/10-lexer-parser/recursion.ts
1) SumDigits(9876n) = 30n
   SumDigits(987)
      SumDigits(98)
         SumDigits(9)
         → 9
      → 17
   → 24
2) devcalc/
2)    src/
2)       core/
2)       cli/
2)    tests/
2)    web/
2) CountFolders = 6
3) Calc(1 + (2 + 3)) = 6
4) Expected error: RangeError: Maximum call stack size exceeded
   Why : Forever never stops calling itself, and each waiting call takes stack space.
   Fix : every recursive function needs a base case that is always reached.
5) Expected error: RangeError: Maximum call stack size exceeded
   Why : the input is deeper than the call stack.
   Fix : a loop with your own stack (below), or a depth limit for input you don't control.
5) CountFoldersLoop(deep chain) = 100001
5) CountFoldersLoop(ROOT)       = 6
```

Things to try:

- Change `100_000` to `1_000` in section 5 → `CountFolders` succeeds. Find the smallest depth that fails on your machine (`node --stack-size=2000 ...` raises the limit — a workaround, not a fix).
- Remove the `//` in front of `const oBad: TExpr = ...` → red squiggle TS2322 (`Property 'oRight' is missing ...`).
- Add `{ eKind: "multiply"; oLeft: TExpr; oRight: TExpr }` to `TExpr` → `Calc` is red (TS2366, not all paths return) until you add the case.

### [lexer.ts](lexer.ts) — a token union, the scanning loop, g vs y, errors with a column

```
> node lessons/10-lexer-parser/lexer.ts
2) "12 + 3*(40 - 1)" → [number 12] [op +] [number 3] [op *] [(] [number 40] [op -] [number 1] [)] [end]
2) "7/2" → [number 7] [op /] [number 2] [end]
2) "" → [end]
3) /\d+/g at 0 in "ab12" : 12 (skipped ahead to column 3)
3) /\d+/y at 0 in "ab12" : undefined (nothing AT column 1 : what a lexer wants)
3) /\d+/y at 2 in "ab12" : 12
4) Expected error: unexpected character "$" at column 5
   2 + $3
       ^
4) Expected error: unexpected character "%" at column 8
   2 ** 3 % 4
          ^
   Why : the lexer knows digits, + - * / ( ) and spaces. ** is read as * *, and % is unknown.
   Fix : the parser rejects * *; DevCalc's lexer reads a run of operator characters (devcalc/src/core/Lexer.ts).
```

Things to try:

- Remove the `//` in front of `const oBad: TToken = ...` → TS2322 (`Type '"%"' is not assignable to type 'EOp'`). Add `"%"` to `EOp` and `IsOp` → `2 ** 3 % 4` lexes.
- Remove `case "end":` in `ShowToken` → TS2366. The switch is checked against the union.

### [parser.ts](parser.ts) — a syntax tree, recursive descent, a tree printer, syntax errors

```
> node lessons/10-lexer-parser/parser.ts
3) 1 + 2 * 3 = 7
   +
   ├─ 1
   └─ *
      ├─ 2
      └─ 3
3) (1 + 2) * 3 = 9
   *
   ├─ +
   │  ├─ 1
   │  └─ 2
   └─ 3
3) 8 - 4 - 2 = 2
   -
   ├─ -
   │  ├─ 8
   │  └─ 4
   └─ 2
3) -(2 + 3) * 4 = -20
   *
   ├─ -
   │  └─ +
   │     ├─ 2
   │     └─ 3
   └─ 4
4) Expected error: "1 + * 2" → SyntaxError: expected a number, "-" or "(", found "*"
4) Expected error: "(1 + 2" → SyntaxError: expected ")"
4) Expected error: "1 2" → SyntaxError: expected an operator or the end, found "2"
   Why : each rule says which token may come next; anything else is a syntax error.
   Fix : fix the input. A real parser also reports the column (devcalc/src/core/Parser.ts).
```

`-(2 + 3) * 4` shows that unary minus binds tighter than `*`: `factor` handles `-`, so the `-` node is below `*`.

Things to try:

- Swap the two rules: make `#ParseExpression` look for `*` `/` and `#ParseTerm` for `+` `-` → `1 + 2 * 3 = 9`. The order of the rules *is* the precedence.
- Change the `while` in `#ParseExpression` to an `if` → the program stops at `8 - 4 - 2` with `SyntaxError: expected an operator or the end, found "-"`. The loop is what reads a chain.
- Remove the `//` in front of `const oBad: TNode = ...` → TS2322.

### [precedence.ts](precedence.ts) — see section 6

---

## 6. Build it — precedence climbing

Recursive descent needs one function per precedence level. C has 10 levels for its binary operators; DevCalc has 6. **Precedence climbing** replaces them with **one function and a table**:

```ts
type EAssoc = "left" | "right";

const TABLE: TTable = {
	"+": { nPrecedence: 1, eAssoc: "left", fnApply: (nLeft, nRight) => nLeft + nRight },
	"-": { nPrecedence: 1, eAssoc: "left", fnApply: (nLeft, nRight) => nLeft - nRight },
	"*": { nPrecedence: 2, eAssoc: "left", fnApply: (nLeft, nRight) => nLeft * nRight },
	"/": { nPrecedence: 2, eAssoc: "left", fnApply: (nLeft, nRight) => nLeft / nRight },
	"**": { nPrecedence: 3, eAssoc: "right", fnApply: (nLeft, nRight) => nLeft ** nRight }, // 2 ** 3 ** 2 = 2 ** (3 ** 2)
};
```

### The one function

```ts
// Reads one operand, then every operator whose precedence is at least nMin
function Expression(nMin: number, nDepth: number): number {
	let nLeft = Operand(nDepth);
	for (;;) {
		const strOp = arrToken[nPos] ?? "";
		const oInfo = oTable[strOp];
		if (oInfo === undefined || oInfo.nPrecedence < nMin) {
			break; // not an operator, or one that binds looser : the caller takes it
		}
		nPos++;
		// left : the right side may only take tighter operators. right : the same operator may repeat there
		const nNextMin = oInfo.eAssoc === "left" ? oInfo.nPrecedence + 1 : oInfo.nPrecedence;
		const nRight = Expression(nNextMin, nDepth + 1);
		nLeft = oInfo.fnApply(nLeft, nRight);
	}
	return nLeft;
}
```

How to read it:

- `Expression(nMin)` means "read an expression, but stop at any operator **looser** than `nMin`".
- After an operator with precedence `p`, the right side is read with `nMin = p + 1`: it may only take **tighter** operators. So in `1 + 2 * 3`, the right side of `+` (min 2) takes `* 3`; in `8 - 4 - 2`, the right side of the first `-` (min 2) stops before the second `-`, and the loop picks it up → `(8 - 4) - 2`.
- A right-associative operator uses `nMin = p`: the same operator may continue on the right → `2 ** (3 ** 2)`.

This example calculates while it parses — no tree. DevCalc builds a tree instead, with the same function (section 7).

### Run it

```
> node lessons/10-lexer-parser/precedence.ts
2) 1 + 2 * 3   = 7
2) (1 + 2) * 3 = 9
2) 8 - 4 - 2   = 2
2) 2 ** 3 ** 2 = 512
2) 2 * 3 ** 2  = 18
3) Trace of 1 + 2 * 3
   Expression(min 1) at "1"
      Expression(min 2) at "2"
         Expression(min 3) at "3"
      2 * 3
   1 + 6
4) Expected error (a wrong answer, not an exception): 8 - 4 - 2 = 6
   Why : right-associative reads it as 8 - (4 - 2) = 6, but - is left-associative : (8 - 4) - 2 = 2.
   Fix : only ** (and assignment =) are right-associative; keep - left. A test catches this.
5) 1 + 17 % 5 * 2 = 5
```

The trace shows the recursion: `*` is calculated inside the call that `+` made for its right side (min 2), so `2 * 3` finishes before `1 + 6`.

The table is data: output 4) shows a wrong table gives a wrong answer **without any error** — that is why the DevCalc parser has tests for precedence and associativity. Output 5) adds `%` with one row; the parser doesn't change.

> **C#** : C#'s precedence table is in the language specification ("Operator precedence and associativity"). Hand-written parsers — Roslyn's and the TypeScript compiler's among them — read binary operators with a precedence loop like `Expression(nMin)`.

---

## 7. DevCalc step — Lv5 whole expressions

### What changed

| File | Change |
|---|---|
| `devcalc/src/core/Lexer.ts` | new: `Lex(strExpr)` → `TResult<TToken[], IEvalError>`. Four sticky regexes (space, number, name, operator run) |
| `devcalc/src/core/Parser.ts` | new: `TNode`, `Parse(strExpr)` (precedence climbing, depth limit), `ToText(oNode)` |
| `devcalc/src/core/Calculator.ts` | `nPrecedence` column in `OPERATOR_TABLE`, `OperatorPrecedence(strOp)` |
| `devcalc/src/core/Evaluate.ts` | `Evaluate` = `Parse` → `Walk` (recursion). Was: split into `a op b` with a regex |
| `devcalc/src/core/index.ts` | exports `Lex`, `Parse`, `ToText`, `OperatorPrecedence` |
| `devcalc/src/main.ts`, `devcalc/web/App.ts` | usage `"<expression>"`; the overflow note shows the value that did not fit |
| `devcalc/tests/Parser.test.ts` | new: 7 tests (lexer, precedence, associativity, errors, depth) |
| `devcalc/tests/Evaluate.test.ts` | `1 + 2 + 3` is no longer an error; 2 new tests |

The command line, the REPL, `;` with `ans`, `--bits`, `--copy` and the web page are unchanged — they all call `Evaluate()`, so they all read whole expressions now.

### Precedence

The same order as C and JavaScript (and C#), so an expression copied from code gives the same answer:

| Precedence | Operators | Example |
|---|---|---|
| 6 (tightest) | `*` `/` `%` | `1 + 2 * 3` = 7 |
| 5 | `+` `-` | `1 << 2 + 3` = `1 << 5` = 32 |
| 4 | `<<` `>>` | |
| 3 | `&` | `1 \| 2 ^ 3 & 4` = `1 \| (2 ^ (3 & 4))` = 3 |
| 2 | `^` | |
| 1 (loosest) | `\|` | |

All are left-associative. Unary `-` binds tighter than all of them: `-2 * 3` is `(-2) * 3`.

```
> node devcalc/src/main.ts "(0xFF + 1) << 4"
HEX : 0x1000
DEC : 4,096
BIN : 0b1_0000_0000_0000

> node devcalc/src/main.ts "1 << 2 + 3"
HEX : 0x20
DEC : 32
BIN : 0b10_0000

> node devcalc/src/main.ts "-(0x10 - 1) * 2"
HEX : -0x1E
DEC : -30
BIN : -0b1_1110
```

`1 << 2 + 3` = 32 surprises people in every C-like language — `+` binds tighter than `<<`. Add parentheses when in doubt.

### The lexer : four sticky regexes

```ts
const RE_SPACE = /\s+/y;
const RE_NUMBER = /[0-9][0-9A-Za-z_]*/y; // 0xFF, 1_000, 12a (ParseInteger says what is wrong)
const RE_NAME = /[A-Za-z_][0-9A-Za-z_]*/y;
const RE_OPERATOR = /[*/%&|^<>=!~]+|[+-]/y; // a run, so ** and >>> are read whole (and rejected); + and - stand alone : 2*-1
```

- A number is read generously (`12a`, `0x1G`) and handed to `ParseInteger` from lesson 03, so the messages for bad numbers are the ones you already know.
- Operator characters are read as a **run**: `**` is one token and gets the message `Invalid operator: "**"` — not a confusing "expected a number, found `*`". `+` and `-` stand alone, so `2*-1` is `2 * -1`.
- The only name is `ans` (any case).

### The parser : precedence climbing on TOperator

```ts
#Expression(nMinPrecedence: number): TNode {
	let oLeft = this.#Unary();
	for (;;) {
		const oNext = this.#Peek();
		if (oNext.eKind !== "operator" || OperatorPrecedence(oNext.strText) < nMinPrecedence) {
			return oLeft;
		}
		this.#nPos++;
		const oRight = this.#Expression(OperatorPrecedence(oNext.strText) + 1);
		oLeft = { eKind: "binary", strOp: oNext.strText, oLeft, oRight };
	}
}
```

It is section 6's function with the table from `Calculator.ts`, building a `TNode` instead of a number. Because the token's `strText` is a `TOperator` (narrowed by `eKind === "operator"`), `OperatorPrecedence` and the tree node accept it without a cast.

Inside, errors are thrown as a private `CParseError`; `Parse()` catches it and returns an `Err` with the column. Callers never see an exception for bad input:

```
> node devcalc/src/main.ts "(1 + 2"
Invalid expression: "(1 + 2"
Why : expected ")" for the "(" at column 1, found the end
Fix : e.g. "(0xFF + 1) << 4". Operators: + - * / % & | ^ << >>

> node devcalc/src/main.ts "1 2"
Invalid expression: "1 2"
Why : expected an operator or the end, found "2" at column 3
Fix : e.g. "(0xFF + 1) << 4". Operators: + - * / % & | ^ << >>

> node devcalc/src/main.ts "2 ** 3"
Invalid operator: "**"
Why : supported operators are + - * / % & | ^ << >>
Fix : e.g. "(0xFF + 1) << 4" (quote the expression).

> node devcalc/src/main.ts "(1 + 1) / (1 - 1)"
Cannot calculate: "(1 + 1) / (1 - 1)"
Why : division by zero
Fix : the right side of / must not be 0.
```

**The depth limit.** `(` and unary `-` nest by recursion. `MAX_DEPTH = 100` turns `((((…` and `-----…1` into an error message instead of a `RangeError` (section 1-2). A test checks 100 levels (OK), 101 (error) and 5,000 minus signs (error, no crash).

### Evaluate : walking the tree

```ts
function Walk(oNode: TNode, oCalc: CCalculator, oWord: CWordSize | undefined, biAns: bigint): ICalcResult {
	switch (oNode.eKind) {
		case "number":
			return Wrap(oNode.biValue, oWord);
		case "ans":
			return Wrap(biAns, oWord);
		case "negate": {
			const oOperand = Walk(oNode.oOperand, oCalc, oWord, biAns);
			return KeepOverflow(Wrap(-oOperand.biValue, oWord), [oOperand]);
		}
		case "binary": {
			const oLeft = Walk(oNode.oLeft, oCalc, oWord, biAns);
			const oRight = Walk(oNode.oRight, oCalc, oWord, biAns);
			return KeepOverflow(oCalc.Calculate(oLeft.biValue, oNode.strOp, oRight.biValue), [oLeft, oRight]);
		}
	}
}
```

Each binary node uses the `CCalculator` from lesson 04 — the same checks (division by zero, shift range) and the same wrapping. With `--bits`, **every** value is wrapped as it is calculated, like a programmer calculator (or C's fixed-size integers). The note now names the first value that did not fit:

```
> node devcalc/src/main.ts "(0xFF + 1) | 0" --bits=8
HEX : 0x00
DEC : 0
BIN : 0b0000_0000
INT : 0 (8-bit signed)
Note: 256 does not fit in 8 bits (BYTE), so it wrapped to 0.

> node devcalc/src/main.ts "-2 * -3" --bits=8
HEX : 0x06
DEC : 6
BIN : 0b0000_0110
INT : 6 (8-bit signed)
Note: 64262 does not fit in 8 bits (BYTE), so it wrapped to 6.
```

Before lesson 10 the note printed the *final* value, which for `(0xFF + 1) | 0` would say "0 does not fit". The second case shows the word is unsigned inside: `-2` is stored as 254 and `-3` as 253, and `254 * 253 = 64262`. Its low 8 bits are 6 — the right answer. That is two's complement: the low bits of `+ - *` are the same whether you read the bits as signed or unsigned.

### Checked

```
> npm test
check-pairs : 51 pairs, 0 failed
check-names : 27 files, 0 problems

 RUN  v5.0.4 D:/mydata/blog/projects/DH.Study.TypeScript/projectroot

 Test Files  9 passed (9)
      Tests  41 passed (41)
```

```ts
test("precedence follows C / JavaScript", () => {
	expect(Grouped("1 + 2 * 3")).toBe("(1 + (2 * 3))");
	expect(Grouped("1 << 2 + 3")).toBe("(1 << (2 + 3))");
	expect(Grouped("1 | 2 ^ 3 & 4")).toBe("(1 | (2 ^ (3 & 4)))");
});
```

`ToText` prints the tree with every binary node in parentheses, so a test can check the **shape** of the tree in one string.

- The DevCalc outputs shown in lessons 04–09 are unchanged. What changed is what used to be an error: `1 + 2 + 3` is now 6, and `3 ** 2` / `1 +` get the new messages.
- The web page reads whole expressions too: `(0xFF + 1) << 4` in the input box works without any change to `App.ts` except the note.

Things to try:

- Add `~` (bitwise NOT) as a unary operator: a `"bitnot"` node kind (or reuse `"negate"` with an operator field), a case in `#Unary`, a case in `Walk`. TS shows every `switch` you forgot.
- Add `**` to `OPERATOR_TABLE` with precedence 7. The lexer already reads it as one token. What is missing for `2 ** 3 ** 2` = 512? (Hint: section 6, `eAssoc`.)
- Add a `--tree` option that prints `ToText(oTree)` before the result, so you can see how DevCalc grouped your expression.

---

## Summary

- A recursive function needs a base case that is always reached, and a step that makes the input smaller. Every waiting call takes stack space: for input you don't control, add a depth limit or use a loop with your own stack.
- **[TS]** Types can refer to themselves. A recursive discriminated union describes a syntax tree, and a `switch` over `eKind` walks it — the compiler checks every case.
- A lexer turns text into tokens (kind, text, column) and always ends with an `end` token. A scanning loop or sticky (`y`) regexes read one token at the current position.
- A recursive descent parser has one function per grammar rule; precedence comes from the order of the rules, left-associativity from the loop. Precedence climbing does the same with one function and a table.
- DevCalc Lv5: `Evaluate` = `Lex` → `Parse` → `Walk`. Whole expressions with C precedence, errors with columns, and a depth limit — everywhere `Evaluate` is used.

## Where next

This was the last lesson of the series. DevCalc now has a lexer, a parser, an evaluator, a command line, a REPL, a web page, tests and CI — all in strict TypeScript, without a build step.

Some directions from here:

- **Extend DevCalc** with the "Things to try" of this lesson: `~`, `**`, `--tree`, then variables (`x = 0xFF; x << 4`) — a new token kind, a new node kind and a `Map<string, bigint>`.
- **Read real parsers**: the TypeScript compiler's own `scanner.ts` and `parser.ts` use the same ideas (a scanning loop, recursive descent, precedence from a table), at a much larger scale.
- **Go back to lesson 08** and type the tree in a different way: `Extract<TNode, { eKind: "binary" }>` gives one node kind; a mapped type over `TNode["eKind"]` can type a table of node handlers.

---

[← Previous: 09. Testing and Tooling](../09-testing-tooling/README.md) · [Contents](../../README.md) · Next: none (last lesson)
