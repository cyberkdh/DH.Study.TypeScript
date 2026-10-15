**English** · [한국어](README.ko.md)

# DevCalc

The developer calculator that this lesson series builds. Each lesson adds one more part.

## Current stage: Lv5 whole expressions (lessons 01–10)

```bash
node devcalc/src/main.ts 255
# HEX : 0xFF
# DEC : 255
# BIN : 0b1111_1111

node devcalc/src/main.ts 255 --lower --no-prefix   # options: --no-group --lower --no-prefix
node devcalc/src/main.ts 0xFFFF_FFFF               # input: 255, -0xFF, 0b1010, 0o17, 1_000
node devcalc/src/main.ts "(0xFF + 1) << 4"         # whole expressions: + - * / % & | ^ << >>, ( ), unary -
node devcalc/src/main.ts "0xFF + 1" --bits=8       # word size: --bits=8|16|32|64 (wraps, adds INT)
node devcalc/src/main.ts "0xFF; ans << 8"          # several expressions with ";", ans = previous result
node devcalc/src/main.ts "0xFF + 1" --copy         # copy the HEX result to the clipboard
node devcalc/src/main.ts --repl                    # interactive: history, copy, help, exit

npm run web     # web page (Lv4): http://127.0.0.1:5173/devcalc/web/

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

Each lesson's state is tagged in git: `git checkout lesson-01`
