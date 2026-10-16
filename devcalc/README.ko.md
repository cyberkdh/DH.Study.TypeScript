[English](README.md) · **한국어**

# DevCalc

이 강의 시리즈의 최종 결과물인 개발자용 계산기. 강의가 진행될 때마다 부품이 하나씩 추가된다.

## 현재 단계: Lv12 트리 보기 (01~17강)

```bash
node devcalc/src/main.ts 255
# HEX : 0xFF
# DEC : 255
# BIN : 0b1111_1111

node devcalc/src/main.ts 255 --lower --no-prefix   # 옵션: --no-group --lower --no-prefix
node devcalc/src/main.ts 0xFFFF_FFFF               # 입력: 255, -0xFF, 0b1010, 0o17, 1_000
node devcalc/src/main.ts "1Fh + 4K - 'A'"          # 1'000 (자릿수 구분), 1Fh (16진), 4K 16M 1G 2T (크기), 'A' 'AB' '\n' (문자) 도 가능
node devcalc/src/main.ts "(0xFF + 1) << 4"         # 수식 전체: + - * / % ** & | ^ << >> >>>, ( ), 단항 - ~
node devcalc/src/main.ts "0xFF + 1" --bits=8       # 워드 크기: --bits=8|16|32|64|128 (잘라 내고 INT 표시)
node devcalc/src/main.ts "'Hi' << 8" --all        # 모든 행: HEX DEC BIN INT OCT CHAR
node devcalc/src/main.ts "0xFF; ans << 8"          # ";" 로 여러 수식, ans = 직전 결과
node devcalc/src/main.ts "rol(0x81, 1)" --bits=8   # 함수: abs min max bit popcount clz ctz log2 bswap rol ror align
node devcalc/src/main.ts "mask = 0xFF00; 0x1234 & mask"   # 변수 (프로그램이 끝날 때까지 보관)
node devcalc/src/main.ts "0xFF + 1" --copy         # HEX 결과를 클립보드에 복사
node devcalc/src/main.ts "10 + 30 * (100 + 2) / 10 + 20" --steps   # 계산 과정을 한 부분씩
node devcalc/src/main.ts "(1 << 4) & 'A'" --tree   # 결과 앞에 파서가 만든 트리
node devcalc/src/main.ts --repl                    # 대화형: history, vars, copy, help, help <함수>, exit

npm run web     # 웹 페이지: http://127.0.0.1:5173/devcalc/web/ (비트 그리드, 계산 과정, 트리, 미리보기, Esc, ArrowUp/ArrowDown 기록, 도움말)
npm run build:web   # 정적 웹 페이지 → dist/web/ (GitHub Pages: https://cyberkdh.github.io/DH.Study.TypeScript/devcalc/web/)
npm run build:single  # build:web 다음에 : 같은 페이지를 파일 하나로 → dist/web/DevCalc.html (더블클릭, 서버 없음)

npm test        # check-pairs, check-names 다음에 Vitest 로 DevCalc 테스트
npm run test:watch  # Vitest 감시 모드
```

## 진행 기록

| 강 | 추가된 것 |
|---|---|
| [01](../lessons/01-basic-types/README.ko.md) | `core/Format.ts` (ToHex/ToBin/ToDec), `main.ts` 명령줄 실행 |
| [02](../lessons/02-functions-objects/README.ko.md) | `IFormatOptions` (자릿수 묶기, 대소문자, 접두어), `GroupDigits`, `main.ts` 함수 표 |
| [03](../lessons/03-unions-narrowing/README.ko.md) | `core/Parse.ts` (`ParseInteger`, `TParseResult`): 부호, `0x`/`0o`/`0b`, `_` 구분자, 오류 이유 |
| [04](../lessons/04-classes-errors/README.ko.md) | `core/WordSize.ts` (`CWordSize`), `core/Calculator.ts` (`CCalculator`, `CCalcError`), `--bits`, 0 채우기, `Main()` + `process.exitCode` |
| [05](../lessons/05-generics/README.ko.md) | `core/Result.ts` (`TResult<T, E>`), `core/History.ts` (`CHistory<T>`), `core/Evaluate.ts` (계산을 `main.ts` 밖으로), `;` 와 `ans` |
| [06](../lessons/06-modules-async/README.ko.md) | `core/index.ts` (진입점 하나, `node:` import 없음), `cli/Clipboard.ts` (`--copy`), `cli/Repl.ts` (`--repl`), async `Main()` |
| [07](../lessons/07-browser-dom/README.ko.md) | `web/` (`index.html`, `style.css`, `App.ts`): 브라우저에서 같은 코어, 복사 버튼, `localStorage` 에 기록 보관. `tools/serve.ts` 개발 서버 |
| [08](../lessons/08-advanced-types/README.ko.md) | `core/Calculator.ts` 의 `OPERATOR_TABLE` (`satisfies`, 키에서 만든 `TOperator`, `OperatorName`), `main.ts` 의 타입이 지정된 명령줄 옵션 (`TSwitch`, `` `--bits=${TWordBits}` ``) |
| [09](../lessons/09-testing-tooling/README.ko.md) | 테스트를 Vitest 로 실행 (`vitest.config.ts`), `tests/Names.test.ts`, `npm test` 에 `tools/check-names.ts`, `noUnusedLocals` / `noUnusedParameters`, `web/App.ts` 의 `o` → `oSaved` |
| [10](../lessons/10-lexer-parser/README.ko.md) | `core/Lexer.ts` (`Lex`, sticky 정규식), `core/Parser.ts` (`TNode`, 우선순위 클라이밍 (Precedence climbing) 방식의 `Parse`, `ToText`, 깊이 제한), `OPERATOR_TABLE` 의 `nPrecedence`, `Evaluate` 가 트리를 순회: 어디서나 수식 전체, 오버플로 안내에 처음 범위를 벗어난 값을 표시, `tests/Parser.test.ts` |
| [11](../lessons/11-regex-literal-types/README.ko.md) | `core/Literal.ts` (`ParseLiteral`: `1'000` `1Fh` `4K`, `ParseChar`: `'A'` `'AB'` `'\n'`), `**` (오른쪽 결합), `>>>`, 워드 크기를 따르는 산술 `>>`, `UNARY_TABLE` (`-` `~`), `-2 ** 2` 오류, `SplitExpressions`, `tests/Literal.test.ts` |
| [12](../lessons/12-bigint-words/README.ko.md) | `core/Output.ts` (`satisfies` 로 검사하는 `OUTPUT_ROWS`, `ROW_ORDER`, `OutputRows`, `OutputHelp`): 명령줄과 웹 페이지가 함께 쓰는 행 표, `ToOct`, `ToChar`, `--all`, 128 비트 워드 (`OWORD`), `tests/Output.test.ts` |
| [13](../lessons/13-functions-scope/README.ko.md) | `core/Functions.ts` (`FUNCTION_TABLE`: 함수 12 개, `bNeedsWord` 유니온, `CallFunction`, 오버로드된 `FunctionHelp`), `name`/`assign`/`comma` 토큰, `call`/`variable`/`assign` 노드, `Evaluate` 는 `ReadonlyMap` 을 읽고 `strAssign` 을 반환, REPL `vars` 와 `help <함수>`, `tests/Functions.test.ts` |
| [14](../lessons/14-events-accessibility/README.ko.md) | `web/BitGrid.ts` (`CBitGrid`: 비트마다 버튼 하나, 위임된 click 과 keydown, 로빙 탭인덱스, `aria-pressed`), 실시간 미리보기, 입력란의 Esc 와 ArrowUp/ArrowDown, 버튼이 된 기록 항목, 도움말 패널 (`<details>`), `role="status"` 알림 |
| [15](../lessons/15-bundling-release/README.ko.md) | `tools/build-single.ts` (`tsc --noEmit`, esbuild 번들, CSS 와 JS 넣기, 검사) → `dist/web/DevCalc.html`, `package.json` 과 `pages.yml` 에 `build:single`, 페이지의 빌드 줄 (`declare const DEVCALC_BUILD`), 빌드가 바꾸는 태그를 `Web.test.ts` 가 확인 |
| [16](../lessons/16-trees-steps/README.ko.md) | `core/Steps.ts` (`Explain`: 단계마다 식 전체, 가장 적은 `( )`, 다음에 계산할 부분, 버린 나머지와 감싸기 메모), `TStepListener` 를 받는 `EvaluateTree`, 숫자 노드의 `strText`, `--steps`, 웹 Steps 패널 (`<mark>`), `tests/Steps.test.ts` |
| [17](../lessons/17-tree-view/README.ko.md) | `core/Tree.ts` (`NodeLabel`, `NodeChildren`, `LayoutTree`: 잎 칸과 층, `TreeLines`), `IStep` 의 `oNode` 와 `biValue`, `IExplanation` 의 `oRoot`, `--tree`, `web/TreeView.ts` (`CTreeView`: SVG 트리, 끝남 / 다음 / 흐리게), `aria-current="step"` 이 붙는 버튼 단계 줄, `tests/Tree.test.ts` |

강의별 상태는 git 태그(Tag)로 볼 수 있다: `git checkout lesson-01`
