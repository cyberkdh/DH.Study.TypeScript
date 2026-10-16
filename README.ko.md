[English](README.md) · **한국어**

# DH.Study.TypeScript

TypeScript 를 순서대로 배우면서, 마지막에는 **개발자용 계산기(DevCalc)** 를 직접 완성하는 강의 저장소.

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/cyberkdh/DH.Study.TypeScript?quickstart=1)

## 목차

| 강 | 제목 | 배우는 것 | DevCalc 스텝 | 상태 |
|---|---|---|---|---|
| 00 | [개발 환경 구성](lessons/00-setup/README.ko.md) | 실행 3가지 방법, VS Code 디버깅, TS → JS | — | ✅ |
| 01 | [기본 타입과 bigint](lessons/01-basic-types/README.ko.md) | 타입 표기·추론, `number` 의 한계, `bigint`, `any`/`unknown` | Lv1 진법 변환 (ToHex/ToBin/ToDec) | ✅ |
| 02 | [함수와 객체](lessons/02-functions-objects/README.ko.md) | 함수 타입, `interface`/`type` | 자릿수 묶기, 출력 옵션 | ✅ |
| 03 | [유니온과 타입 좁히기](lessons/03-unions-narrowing/README.ko.md) | 유니온(Union), 타입 좁히기(Narrowing), 판별 유니온 | Lv2 입력 형식 해석 `0x`/`0b`/`1_000` | ✅ |
| 04 | [클래스와 에러 처리](lessons/04-classes-errors/README.ko.md) | 클래스(Class), 예외(Exception) | Lv3 워드 크기, 두 수 계산 | ✅ |
| 05 | [제네릭](lessons/05-generics/README.ko.md) | 제네릭(Generics) | `TResult<T, E>`, 히스토리 | ✅ |
| 06 | [모듈과 비동기](lessons/06-modules-async/README.ko.md) | 모듈(Module), `async`/`await` | core 분리, 클립보드, REPL | ✅ |
| 07 | [브라우저와 DOM](lessons/07-browser-dom/README.ko.md) | DOM, 이벤트(Event), 폼(Form) | Lv4 웹 페이지 | ✅ |
| 08 | [고급 타입](lessons/08-advanced-types/README.ko.md) | 유틸리티·매핑·조건부·템플릿 리터럴 타입 | 타입이 지정된 연산자 표 | ✅ |
| 09 | [테스트와 도구](lessons/09-testing-tooling/README.ko.md) | node:test, 모의 객체, Vitest, ESLint 없이 린트 | Vitest, 이름 규칙 검사 | ✅ |
| 10 | [(도전) 렉서와 파서](lessons/10-lexer-parser/README.ko.md) | 재귀, 재귀 타입, 렉서(Lexer), 파서(Parser) | Lv5 수식 계산 | ✅ |
| **2부** | | | | |
| 11 | [정규식과 리터럴 타입](lessons/11-regex-literal-types/README.ko.md) | 정규식(Regex: 그룹, 플래그, 전후방 탐색), 리터럴·템플릿 리터럴 타입 | Lv6 `1Fh` `1'000` `4K` `'A'`, `~` `**` `>>>` | ✅ |
| 12 | [bigint 와 고정 크기 워드](lessons/12-bigint-words/README.ko.md) | bigint 심화, `asIntN`/`asUintN`, 2의 보수, 바이트 순서, 타입 표기 vs `as` vs `satisfies` | Lv7 OCT·CHAR 행 (`--all`), 128 비트, 출력 표 하나 | ✅ |
| 13 | [함수 표와 스코프](lessons/13-functions-scope/README.ko.md) | 오버로드(Overload), 타입 있는 함수 표, `Map` 과 객체, 블록 스코프(Block scope), TDZ, 클로저(Closure) | Lv8 내장 함수 (`popcount` `rol` `bswap` …), 변수 (`mask = 0xFF00`) | ✅ |
| 14 | [DOM 심화](lessons/14-events-accessibility/README.ko.md) | 캡처(Capture)와 버블(Bubble), `closest()` 로 위임(Delegation), `key` 와 `code`, IME, 로빙 탭인덱스(Roving tabindex), `aria-*` | Lv9 클릭하는 비트 그리드, 실시간 미리보기, 기록 키, 도움말 패널 | ✅ |
| 15 | [번들러와 빌드](lessons/15-bundling-release/README.ko.md) | 모듈 물결(Wave)과 `file://`, esbuild (명령줄과 API), 트리 셰이킹(Tree shaking), 압축(Minify), `satisfies BuildOptions`, `define` + `declare const`, 넣기의 함정 (`$&`, `</script>`) | Lv10 HTML 파일 하나 (`npm run build:single`), 더블클릭으로 열림 | ✅ |
| **3부** | | | | |
| 16 | [트리와 재귀](lessons/16-trees-steps/README.ko.md) | 트리 그리기와 순회 (전위/중위/후위), 후위 순서를 스택으로 계산, 바뀌지 않는 다시 쓰기와 구조 공유(Structural sharing), `readonly` 와 `Object.freeze`, `never` 검사, 리스너(Listener) 콜백, 객체를 키로 쓰는 `Map` | Lv11 계산 과정 (`--steps`, 웹 Steps 패널) | ✅ |

## 공부하는 방법

1. **환경 준비** — 둘 중 하나
   - 내 PC: `git clone` → `npm install` ([00강 1장](lessons/00-setup/README.ko.md#1-준비물))
   - 설치 없이: 위의 **Open in GitHub Codespaces** 버튼 → 브라우저에서 VS Code 가 열림
2. **위 목차 순서대로** 강의를 연다. 각 강의는 같은 순서로 되어 있다.
   - **목표** → **이 강의의 목차** → 본문 → **따라하기**(예제 실행) → **DevCalc 스텝** → **정리** → 다음 강의 링크
3. 예제 파일은 강의 글 **바로 옆**에 있다. 파일을 열고 `F5` 로 실행·디버깅한다.
   - 실행할 수 없을 때는 강의 글에 적힌 **실행 결과**를 보며 읽어도 된다.
4. 강의 맨 위·아래의 `← 이전 · 목차 · 다음 →` 링크로 이동한다.
5. 강의별 완성 코드는 git 태그(Tag)로 볼 수 있다: `git checkout lesson-01`

> GitHub 웹 페이지에서는 코드를 **읽을** 수는 있지만 **실행**할 수는 없다. 실행은 내 PC 또는 Codespaces 에서 한다.
> 07강부터 DevCalc 는 웹 페이지도 있다: `npm run web` 을 실행하고 <http://127.0.0.1:5173/devcalc/web/> 를 연다.
> 설치 없이 바로 써 보려면: <https://cyberkdh.github.io/DH.Study.TypeScript/devcalc/web/> (GitHub Pages, `main` 에 push 할 때마다 다시 빌드됨).

> 모든 강의는 영어판(`README.md`, 기본)과 한국어판(`README.ko.md`)이 있다. 예제 코드도 두 벌이다: `x.ts` (영어 주석) 와 `x.ko.ts` (한국어 주석). 코드는 같고 주석만 다르며, `npm test` 가 둘의 코드가 같은지 검사한다. 프로그램 출력은 영어다.

## 목적 (Purpose)

**웹에서 동작하는 도구를, C# 개발자에게 가장 익숙한 방식으로 만들 수 있게 되는 것.**

- 브라우저(웹)에서 돌아가는 언어는 사실상 JavaScript 하나다. 그래서 고를 수 있는 것은 "JS 냐 TS 냐" 뿐이다.
- TypeScript = JavaScript + 정적 타입(Static Type). 실행하기 전에 실수를 잡아 준다.
  - 예: `1n + 1` 은 JS 에서는 실행 중에 `TypeError` 가 나지만, TS 에서는 코드를 쓰는 순간 빨간 줄이 생긴다.
- 설계자가 C# 과 같은 Anders Hejlsberg 라서 문법·도구·사고방식이 C# 개발자에게 익숙하다.
- 역할 분담: Windows 데스크톱은 C#/WPF, 웹·크로스플랫폼·설치 없는 도구는 TypeScript.
- 공부한 내용은 블로그로 정리한다. 각 강의 README 가 곧 블로그 글이다.

## 목표 (Goals)

| 구분 | 목표 |
|---|---|
| 최종 결과물 | **DevCalc** 완성: 개발자용 계산기 (입력 하나 → HEX/DEC/BIN 동시 표시, 브라우저에서 동작) |
| 언어 | 기본 타입부터 제네릭(Generics)·고급 타입(Advanced Types)까지 읽고 쓸 수 있다 |
| 도구 | VS Code 디버깅(Debugging), `tsc` 빌드, 테스트(node:test → Vitest), ESLint 를 스스로 설정하고 쓴다 |
| 습관 | 강의마다 예제를 직접 실행하고 디버거(F5)로 값을 확인한다 |
| 기록 | 강의마다 블로그에 옮길 수 있는 README 를 남긴다 |

### DevCalc 단계별 목표

입문자가 처음부터 파서(Parser)까지 만들기는 어렵다. 그래서 **단계마다 동작하는 작은 계산기**를 만들고, 어려운 부분은 마지막 선택 과제로 둔다.

| 단계 | 결과 | 강 |
|---|---|---|
| Lv1 진법 변환기 | 숫자 하나 → HEX/DEC/BIN 출력 | 01~02 |
| Lv2 입력 형식 | `0xFF`, `0b1010`, `1_000` 해석 | 03 |
| Lv3 두 수 계산 | `0xFF & 0x0F`, 워드 크기(Word Size), 에러 처리 | 04~06 |
| Lv4 웹 화면 | 브라우저에서 입력·결과 표시 | 07~09 |
| Lv5 (선택) 수식 계산 | `(3 + 2) * 10` — 렉서(Lexer) + 파서(Parser) | 10 |
| Lv6 개발자용 리터럴과 연산자 | `1Fh`, `1'000`, `4K`, `'A'`, `~0 >>> 4`, `2 ** 10` | 11 |
| Lv7 모든 출력 형식 | HEX DEC BIN INT OCT CHAR, 128 비트 워드 | 12 |
| Lv8 함수와 변수 | `popcount(x)`, `rol(x, n)`, `mask = 0xFF00; 0x1234 & mask` | 13 |
| Lv9 비트 그리드와 키보드 | 비트를 클릭해 뒤집기, 입력하는 동안 미리보기, ArrowUp 으로 기록, 마우스 없이 사용 | 14 |
| Lv10 파일 하나 | `dist/web/DevCalc.html` : 페이지 전체가 파일 하나, 서버 없이 USB 메모리에서도 동작 | 15 |
| Lv11 계산 과정 | `10 + 30 * (100 + 2) / 10 + 20` → `10 + 30 * 102 / 10 + 20` → … → `336`, 다음 부분 강조 | 16 |

> Lv3 까지만 해도 "쓸 만한 개발자용 진법 변환 계산기"가 된다.

## 명령 모음

```bash
npm install                                # 처음 한 번
node lessons/00-setup/hello.ko.ts          # 예제 실행 (다른 강의도 같은 방식)
npm run typecheck                          # 타입 검사
npm run build                              # dist/ 로 빌드
npm run devcalc -- 255                     # DevCalc 실행
npm test                                   # check-pairs, check-names, DevCalc 테스트 (Vitest)
npm run js -- lessons/00-setup/hello.ko.ts # 변환된 JS 를 보여 주고 실행
```

Windows (cmd / PowerShell) 에서는 `projectroot` 의 bat 파일 두 개로 `node` / `npm` 명령을 직접 치지 않고 같은 일을 할 수 있다:

```bat
runts.bat lessons\00-setup\hello.ko.ts        # .ts 를 바로 실행 (node 타입 제거)
ts2js.bat lessons\00-setup\enum-sample.ko.ts  # npm run js 와 같음: 빌드 → JS 출력 → 실행
```

## 저장소 구조

```
├─ lessons/
│  └─ NN-주제/
│     ├─ README.md      강의 (English, 기본)
│     ├─ README.ko.md   강의 (한국어)
│     ├─ x.ts           예제, 영어 주석
│     └─ x.ko.ts        같은 예제, 한국어 주석
├─ devcalc/             최종 앱 (강의가 진행되며 기능이 늘어남)
├─ tools/               보조 스크립트 (show-js.ts: TS → JS 변환 보기, check-pairs.ts: x.ts 와 x.ko.ts 코드 비교)
├─ runts.bat            .ts 바로 실행 (Windows)
├─ ts2js.bat            TS → JS 변환 보고 실행 (Windows)
└─ .devcontainer/       Codespaces 환경
```

## 이름 규칙 (Naming Convention)

이 저장소는 **헝가리언 표기법(Hungarian Notation)** 을 사용한다.

| 접두어 | 의미 | 예 |
|---|---|---|
| `C` | 클래스 | `CCalculator` |
| `I` | 인터페이스 | `IPerson` |
| `E` | 문자열 유니온 타입 | `EBase = "HEX" \| "DEC"` |
| `T` | 그 밖의 타입 별칭 | `TResult` |
| `m_` / `g_` | 멤버 / 전역 | `m_nValue`, `g_oApp` |
| `n` `bi` `str` `b` | number, bigint, string, boolean | `nAge`, `biValue`, `strName`, `bOk` |
| `arr` `map` `set` `re` `fn` | 배열, Map, Set, RegExp, 함수 | `arrPeople`, `fnCallback` |
| `el` / `o` | DOM 요소 / 그 밖의 객체 | `elInput`, `oPerson` |
| `v` | `any` / `unknown` (variant) | `vInput` |

- 함수·메서드는 PascalCase (`Greet`), 상수는 UPPER_CASE (`MAX_BITS`)
- DOM·Node 등 외부 API 는 원래 이름(camelCase) 그대로 사용
