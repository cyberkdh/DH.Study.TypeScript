[English](README.md) · **한국어**

# DevCalc

이 강의 시리즈의 최종 결과물인 개발자용 계산기. 강의가 진행될 때마다 부품이 하나씩 추가된다.

## 현재 단계: Lv5 수식 전체 (01~10강)

```bash
node devcalc/src/main.ts 255
# HEX : 0xFF
# DEC : 255
# BIN : 0b1111_1111

node devcalc/src/main.ts 255 --lower --no-prefix   # 옵션: --no-group --lower --no-prefix
node devcalc/src/main.ts 0xFFFF_FFFF               # 입력: 255, -0xFF, 0b1010, 0o17, 1_000
node devcalc/src/main.ts "(0xFF + 1) << 4"         # 수식 전체: + - * / % & | ^ << >>, ( ), 단항 -
node devcalc/src/main.ts "0xFF + 1" --bits=8       # 워드 크기: --bits=8|16|32|64 (잘라 내고 INT 표시)
node devcalc/src/main.ts "0xFF; ans << 8"          # ";" 로 여러 수식, ans = 직전 결과
node devcalc/src/main.ts "0xFF + 1" --copy         # HEX 결과를 클립보드에 복사
node devcalc/src/main.ts --repl                    # 대화형: history, copy, help, exit

npm run web     # 웹 페이지: http://127.0.0.1:5173/devcalc/web/
npm run build:web   # 정적 웹 페이지 → dist/web/ (GitHub Pages: https://cyberkdh.github.io/DH.Study.TypeScript/devcalc/web/)

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

강의별 상태는 git 태그(Tag)로 볼 수 있다: `git checkout lesson-01`
