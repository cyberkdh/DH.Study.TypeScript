# DH.Study.TypeScript

TypeScript 를 순서대로 배우면서, 마지막에는 **개발자용 계산기(DevCalc)** 를 직접 완성하는 강의 저장소.

- 강의 본문 = 각 강의 폴더의 `README.md` (GitHub 에서 바로 읽힘)
- 예제(examples) → 연습문제(exercises) + 테스트 → 정답(solutions) 순서로 진행
- 강의마다 `devcalc/` 에 부품이 하나씩 추가되어 최종 앱이 완성됨

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
| 최종 결과물 | **DevCalc** 완성: 개발자용 계산기 (입력 하나 → HEX/DEC/BIN 동시 표시, 브라우저에서 단일 HTML 로 동작, GitHub Pages 배포) |
| 언어 | 기본 타입부터 제네릭(Generics)·고급 타입(Advanced Types)까지 읽고 쓸 수 있다 |
| 도구 | VS Code 디버깅(Debugging), `tsc` 빌드, 테스트(node:test → Vitest), ESLint 를 스스로 설정하고 쓴다 |
| 습관 | 강의마다 연습문제를 풀고 테스트로 직접 확인한다 |
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
| 배포 | 단일 HTML + GitHub Pages | 11 |

> Lv3 까지만 해도 "쓸 만한 개발자용 진법 변환 계산기"가 된다.

## 시작하기

- Node.js 24 · TypeScript 7 · VS Code

```bash
npm install
npm run typecheck                          # 타입 검사
npm run build                              # dist/ 로 빌드
node lessons/00-setup/examples/hello.ts    # 예제 실행
```

디버깅: VS Code 에서 이 폴더를 열고 `.ts` 파일을 연 뒤 `F5`. 자세한 내용은 [00-setup](lessons/00-setup/README.md).

## 저장소 구조

```
├─ lessons/
│  └─ NN-주제/
│     ├─ README.md     강의 본문
│     ├─ examples/     따라 치는 예제
│     ├─ exercises/    빈칸 문제 (TODO) + 테스트
│     └─ solutions/    정답
├─ devcalc/            최종 앱 (강의마다 자람)
└─ tools/              진도 확인 스크립트 등
```

## 커리큘럼

| 강 | 폴더 | 주제 | DevCalc 스텝 | 상태 |
|---|---|---|---|---|
| 00 | [00-setup](lessons/00-setup/README.md) | 환경 구성, 실행, 디버깅, TS → JS | — | ✅ |
| 01 | 01-basic-types | 기본 타입, `bigint` | ToHex/ToBin/ToDec (Lv1) | |
| 02 | 02-functions-objects | 함수, 객체, `interface`/`type` | 자릿수 묶기, 출력 옵션 | |
| 03 | 03-narrowing | 유니온, 타입 좁히기 | 입력 형식 해석 `0x`/`0b`/`1_000` (Lv2) | |
| 04 | 04-classes-errors | 클래스, 에러 처리 | CWordSize, CCalcError, 두 수 계산 (Lv3) | |
| 05 | 05-generics | 제네릭 | `TResult<T, E>`, 히스토리 | |
| 06 | 06-modules-async | 모듈, 비동기 | core 분리, 클립보드 | |
| 07 | 07-dom | 브라우저, DOM | 웹 화면 (Lv4) | |
| 08 | 08-advanced-types | 고급 타입 | 함수 표 타입 안정성 | |
| 09 | 09-tooling-test | 테스트, 도구 | Vitest, ESLint | |
| 10 | 10-lexer-parser | (도전) 렉서 + 파서 | 수식 계산 (Lv5) | |
| 11 | 11-build-deploy | 빌드, 배포 | 단일 HTML + GitHub Pages | |

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

- 함수·메서드는 PascalCase (`Greet`), 상수는 UPPER_CASE (`MAX_BITS`)
- DOM·Node 등 외부 API 는 원래 이름(camelCase) 그대로 사용
