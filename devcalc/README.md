**English** · [한국어](README.ko.md)

# DevCalc

The developer calculator that this lesson series builds. Each lesson adds one more part.

## Current stage: Lv10 one file (lessons 01–15)

```bash
node devcalc/src/main.ts 255
# HEX : 0xFF
# DEC : 255
# BIN : 0b1111_1111

node devcalc/src/main.ts 255 --lower --no-prefix   # options: --no-group --lower --no-prefix
node devcalc/src/main.ts 0xFFFF_FFFF               # input: 255, -0xFF, 0b1010, 0o17, 1_000
node devcalc/src/main.ts "1Fh + 4K - 'A'"          # also 1'000 (separator), 1Fh (hex), 4K 16M 1G 2T (sizes), 'A' 'AB' '\n' (characters)
node devcalc/src/main.ts "(0xFF + 1) << 4"         # whole expressions: + - * / % ** & | ^ << >> >>>, ( ), unary - ~
node devcalc/src/main.ts "0xFF + 1" --bits=8       # word size: --bits=8|16|32|64|128 (wraps, adds INT)
node devcalc/src/main.ts "'Hi' << 8" --all        # all rows: HEX DEC BIN INT OCT CHAR
node devcalc/src/main.ts "0xFF; ans << 8"          # several expressions with ";", ans = previous result
node devcalc/src/main.ts "rol(0x81, 1)" --bits=8   # functions: abs min max bit popcount clz ctz log2 bswap rol ror align
node devcalc/src/main.ts "mask = 0xFF00; 0x1234 & mask"   # variables (kept until the program ends)
node devcalc/src/main.ts "0xFF + 1" --copy         # copy the HEX result to the clipboard
node devcalc/src/main.ts --repl                    # interactive: history, vars, copy, help, help <function>, exit

npm run web     # web page: http://127.0.0.1:5173/devcalc/web/ (bit grid, preview, Esc, ArrowUp/ArrowDown history, help)
npm run build:web   # static web page → dist/web/ (GitHub Pages: https://cyberkdh.github.io/DH.Study.TypeScript/devcalc/web/)
npm run build:single  # after build:web : the same page as one file → dist/web/DevCalc.html (double-click, no server)

npm test        # check-pairs, check-names, then the DevCalc tests on Vitest
npm run test:watch  # Vitest watch mode
```

## History

| Lesson | Added |
|---|---|
| [01](../lessons/01-basic-types/README.md) | `core/Format.ts` (ToHex/ToBin/ToDec), command-line `main.ts` |
| [02](../lessons/02-functions-objects/README.md) | `IFormatOptions` (grouping, case, prefix), `GroupDigits`, function table in `main.ts` |
| [03](../lessons/03-unions-narrowing/README.md) | `core/Parse.ts` (`ParseInteger`, `TParseResult`): sign, `0x`/`0o`/`0b`, `_` separators, error reasons |
| [04](../lessons/04-classes-errors/README.md) | `core/WordSize.ts` (`CWordSize`), `core/Calculator.ts` (`CCalculator`, `CCalcError`), `--bits`, zero padding, `Main()` + `process.exitCode` |
| [05](../lessons/05-generics/README.md) | `core/Result.ts` (`TResult<T, E>`), `core/History.ts` (`CHistory<T>`), `core/Evaluate.ts` (calculation moved out of `main.ts`), `;` and `ans` |
| [06](../lessons/06-modules-async/README.md) | `core/index.ts` (one entry point, no `node:` imports), `cli/Clipboard.ts` (`--copy`), `cli/Repl.ts` (`--repl`), async `Main()` |
| [07](../lessons/07-browser-dom/README.md) | `web/` (`index.html`, `style.css`, `App.ts`): the same core in the browser, copy buttons, history in `localStorage`. `tools/serve.ts` dev server |
| [08](../lessons/08-advanced-types/README.md) | `OPERATOR_TABLE` in `core/Calculator.ts` (`satisfies`, `TOperator` from its keys, `OperatorName`), typed switches in `main.ts` (`TSwitch`, `` `--bits=${TWordBits}` ``) |
| [09](../lessons/09-testing-tooling/README.md) | Tests run on Vitest (`vitest.config.ts`), `tests/Names.test.ts`, `tools/check-names.ts` in `npm test`, `noUnusedLocals` / `noUnusedParameters`, `web/App.ts` `o` → `oSaved` |
| [10](../lessons/10-lexer-parser/README.md) | `core/Lexer.ts` (`Lex`, sticky regexes), `core/Parser.ts` (`TNode`, `Parse` by precedence climbing, `ToText`, depth limit), `nPrecedence` in `OPERATOR_TABLE`, `Evaluate` walks the tree: whole expressions everywhere, overflow note names the value that did not fit, `tests/Parser.test.ts` |
| [11](../lessons/11-regex-literal-types/README.md) | `core/Literal.ts` (`ParseLiteral`: `1'000` `1Fh` `4K`; `ParseChar`: `'A'` `'AB'` `'\n'`), `**` (right-associative), `>>>`, arithmetic `>>` with a word size, `UNARY_TABLE` (`-` `~`), the `-2 ** 2` error, `SplitExpressions`, `tests/Literal.test.ts` |
| [12](../lessons/12-bigint-words/README.md) | `core/Output.ts` (`OUTPUT_ROWS` with `satisfies`, `ROW_ORDER`, `OutputRows`, `OutputHelp`): one row table for the command line and the web page, `ToOct`, `ToChar`, `--all`, 128-bit words (`OWORD`), `tests/Output.test.ts` |
| [13](../lessons/13-functions-scope/README.md) | `core/Functions.ts` (`FUNCTION_TABLE`: 12 functions, `bNeedsWord` union, `CallFunction`, `FunctionHelp` overloads), `name`/`assign`/`comma` tokens, `call`/`variable`/`assign` nodes, `Evaluate` reads a `ReadonlyMap` and returns `strAssign`, REPL `vars` and `help <function>`, `tests/Functions.test.ts` |
| [14](../lessons/14-events-accessibility/README.md) | `web/BitGrid.ts` (`CBitGrid`: one button per bit, delegated click and keydown, roving tabindex, `aria-pressed`), live preview, Esc and ArrowUp/ArrowDown in the box, history items as buttons, help panel (`<details>`), `role="status"` announcements |
| [15](../lessons/15-bundling-release/README.md) | `tools/build-single.ts` (`tsc --noEmit`, esbuild bundle, CSS and JS inlined, checks) → `dist/web/DevCalc.html`, `build:single` in `package.json` and `pages.yml`, build line on the page (`declare const DEVCALC_BUILD`), `Web.test.ts` checks the tags the build replaces |

Each lesson's state is tagged in git: `git checkout lesson-01`
