[English](README.md) · **한국어**

[목차](../../README.ko.md) · [다음: 01. 기본 타입과 bigint →](../01-basic-types/README.ko.md)

# 00. 개발 환경 구성 — VS Code에서 TypeScript 실행 & 디버깅

> 시리즈: DH.Study.TypeScript · 00강
> 환경: Windows · Node.js v24.15.0 · TypeScript 7.0.2 · VS Code

## 목표

이 강의를 마치면 다음을 할 수 있다.

- [ ] `.ts` 파일을 세 가지 방법(Node 직접, 빌드 후, tsx)으로 실행하고 차이를 설명한다
- [ ] VS Code 에서 F5 로 중단점(Breakpoint)을 걸고 변수·호출 스택(Call Stack)을 확인한다
- [ ] 명령줄(Command Line)에서 `--inspect-brk` 로 디버깅한다
- [ ] TS 가 JS 로 바뀔 때 무엇이 사라지는지(타입 소거, Type Erasure) 직접 확인한다
- [ ] `main()` 없이 파일이 어떤 순서로 실행되는지 설명한다

> 시리즈 전체의 목적과 최종 목표(DevCalc)는 [루트 README](../../README.ko.md#목적-purpose) 참고.

## 이 강의의 목차

1. [준비물](#1-준비물) — 내 PC 또는 브라우저(Codespaces)
2. [프로젝트 구조](#2-프로젝트-구조)
3. [tsconfig.json 핵심 옵션](#3-tsconfigjson-핵심-옵션)
4. [.ts 파일을 실행하는 세 가지 방법](#4-ts-파일을-실행하는-세-가지-방법)
5. [VS Code 디버깅](#5-vs-code-디버깅)
6. [명령줄에서 실행과 디버깅](#6-명령줄에서-실행과-디버깅)
7. [TS 를 JS 로 변환한 결과 보기](#7-ts-를-js-로-변환한-결과-보기) — TS 문법 = JS 문법 + 타입 문법 ([7-3](#7-3-ts-문법--js-문법--타입-문법))
8. [JS 는 어떻게 실행되나 — main 이 없다](#8-js-는-어떻게-실행되나--main-이-없다)
9. [정리](#정리)
- 부록: [A. Node.js PATH 등록](#부록-a-nodejs-path-등록) · [B. VS Code 설정만으로 Node 경로 지정](#부록-b-vs-code-설정만으로-node-경로-지정) · [C. 저장소의 VS Code 설정](#부록-c-저장소의-vs-code-설정)

이 강의의 예제 파일: [hello.ko.ts](hello.ko.ts) · [greeter.ko.ts](greeter.ko.ts) · [enum-sample.ko.ts](enum-sample.ko.ts) · [run-order.ko.ts](run-order.ko.ts) · [run-order-lib.ko.ts](run-order-lib.ko.ts)

> 모든 예제는 `node 파일.ts` 로 **오류 없이 끝까지** 실행된다. 오류를 보여 주는 것이 목적인 예제는 오류를 잡아서 **왜** 났는지 출력한다 (`Expected error:` / `Why :`).

---

## 1. 준비물

### 방법 A. 내 PC 에 설치

| 도구 | 버전 | 비고 |
|---|---|---|
| Node.js | 24.x | `node -v` 로 확인. PATH 에 등록되어 있어야 VS Code 디버거가 찾을 수 있음 |
| VS Code | 최신 | TypeScript 언어 서비스(Language Service) 기본 내장 |

```bash
git clone https://github.com/cyberkdh/DH.Study.TypeScript.git
cd DH.Study.TypeScript
npm install
```

`package.json` 에 들어 있는 개발 도구:

- `typescript` : 컴파일러 `tsc`. 7.x 부터는 Go 로 다시 작성된 네이티브(Native) 버전이라 빌드가 매우 빠르다.
- `tsx` : TypeScript 를 바로 실행해 주는 러너(Runner).
- `@types/node` : `process`, `fs` 같은 Node.js API 의 타입 정의.

### 방법 B. 설치 없이 브라우저에서 (GitHub Codespaces)

GitHub 페이지에서는 코드를 **읽을** 수만 있고 **실행**할 수는 없다. 대신 Codespaces 를 쓰면 브라우저 안에서 VS Code 가 열리고 Node.js 24 가 준비된 상태로 바로 실행·디버깅할 수 있다.

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/cyberkdh/DH.Study.TypeScript?quickstart=1)

1. 위 버튼 클릭 (GitHub 로그인 필요) → 1~2분 뒤 브라우저에 VS Code 가 열림
2. `npm install` 은 자동으로 실행됨 (`.devcontainer/devcontainer.json` 설정)
3. 터미널에서 `node lessons/00-setup/hello.ko.ts`, 또는 파일을 열고 `F5`

> 개인 계정은 매달 무료 사용량이 있다. 다 쓰고 나면 [github.com/codespaces](https://github.com/codespaces) 에서 Codespace 를 중지/삭제해 두자.

## 2. 프로젝트 구조

```
projectroot/
├─ .vscode/
│  ├─ launch.json      ← 디버그 구성
│  ├─ tasks.json       ← tsc 빌드 작업
│  └─ settings.json    ← 프로젝트 TypeScript 버전 사용
├─ .devcontainer/      ← Codespaces 환경 설정
├─ lessons/
│  ├─ 00-setup/
│  │  ├─ README.md     ← 이 강의 (English, 기본)
│  │  ├─ README.ko.md  ← 한국어판 (지금 보고 있는 문서)
│  │  ├─ hello.ts      ← 예제는 강의 글 바로 옆에 (영어 주석)
│  │  ├─ hello.ko.ts   ← 같은 코드, 한국어 주석
│  │  ├─ greeter.ts / greeter.ko.ts
│  │  ├─ enum-sample.ts / enum-sample.ko.ts
│  │  ├─ run-order.ts / run-order.ko.ts
│  │  └─ run-order-lib.ts / run-order-lib.ko.ts
│  └─ 01-basic-types/
├─ devcalc/            ← 강의마다 자라는 최종 앱 (01강부터)
├─ package.json
└─ tsconfig.json
```

> **이름 규칙**: 이 저장소는 헝가리언 표기법(Hungarian Notation)을 쓴다. 예제의 `IPerson`(인터페이스), `strName`(string), `nAge`(number), `oPerson`(객체), `arrPeople`(배열), `Greet`(함수는 PascalCase). 전체 표는 [루트 README](../../README.ko.md#이름-규칙-naming-convention) 참고.

## 3. tsconfig.json 핵심 옵션

| 옵션 | 값 | 의미 |
|---|---|---|
| `module` / `moduleResolution` | `nodenext` | Node.js 의 ES 모듈(ESM) 규칙 그대로 사용 |
| `strict` | `true` | 엄격한 타입 검사. 공부할 때는 무조건 켜기 |
| `noUncheckedIndexedAccess` | `true` | `arr[0]` 의 타입을 `T \| undefined` 로 → 안전한 코드 습관 |
| `rewriteRelativeImportExtensions` | `true` | `import "./a.ts"` 를 빌드 시 `./a.js` 로 바꿔 줌 |
| `verbatimModuleSyntax` | `true` | 타입만 가져올 때 `import type` 을 쓰도록 강제 |
| `erasableSyntaxOnly` | `true` | 타입만 지우면 실행되는 문법만 허용 → `enum` / `namespace` 금지 (빨간 줄). 이 저장소의 모든 `.ts` 는 `node` 로 실행된다 |
| `sourceMap` | `true` | 빌드된 JS ↔ 원본 TS 위치 매핑 → 디버깅에 필요 |

> C# 개발자 관점: `tsconfig.json` ≈ `.csproj`, `tsc` ≈ `csc`/`dotnet build`, `strict` ≈ Nullable 참조 형식(Nullable Reference Types) 활성화.

## 4. .ts 파일을 실행하는 세 가지 방법

| 방법 | 명령 | 빌드 | enum / namespace | 특징 |
|---|---|---|---|---|
| ① Node 직접 실행 | `node hello.ko.ts` | 불필요 | ❌ | Node 22.18+/24 의 타입 제거(Type Stripping). 타입 부분만 공백으로 지움 |
| ② tsc 빌드 후 실행 | `npm run build` → `node dist/.../hello.ko.js` | 필요 | ✅ | 실제 배포 방식. 타입 검사까지 수행 |
| ③ tsx | `node --import tsx hello.ko.ts` | 불필요 | ✅ | 내부적으로 esbuild 로 변환. 모든 문법 지원 |

[hello.ko.ts](hello.ko.ts) 를 ① 로 실행한 결과:

```
> node lessons/00-setup/hello.ko.ts
Hello, Hong Gildong (age 30)
Hello, TypeScript (age 14)
Node.js v24.15.0
```

[greeter.ko.ts](greeter.ko.ts) 는 `Greet()` 를 정의만 한다. 단독으로 실행하면 어디를 실행해야 하는지 알려 준다.

```
> node lessons/00-setup/greeter.ko.ts
greeter.ko.ts only defines Greet(); it is used by hello.ko.ts.
Run: node lessons/00-setup/hello.ko.ts
```

주의할 것은 `enum` 하나다. `enum` 은 타입만 있는 게 아니라 **런타임 객체(JavaScript 코드)를 생성**한다. "지우기만" 하는 ① 방식으로는 실행할 수 없다.

```
SyntaxError [ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX]: TypeScript enum is not supported in strip-only mode
```

그래서 이 저장소는 **`enum` 을 쓰지 않는다**. tsconfig.json 의 `erasableSyntaxOnly` 가 `enum` 을 쓰는 순간 빨간 줄로 알려 준다. [enum-sample.ko.ts](enum-sample.ko.ts) 는 대신 쓰는 방법을 보여 준다: 일반 객체 + `as const` + 유니온 타입(Union Type). ①, ②, ③ 어느 방법으로도 똑같이 실행된다.

```ts
const COLOR = { Red: "RED", Green: "GREEN" } as const;
type EColor = (typeof COLOR)[keyof typeof COLOR]; // "RED" | "GREEN"
```

```
> node lessons/00-setup/enum-sample.ko.ts
RED GREEN
color = GREEN
color = RED
```

> 같은 방식이 나중에 DevCalc 의 `EBase = "HEX" | "DEC" | "BIN"` 이 된다.

> ⚠️ ①, ③ 은 **타입 검사를 하지 않는다**. 타입 오류는 에디터 빨간 줄 또는 `npm run typecheck` 로 확인한다.

## 5. VS Code 디버깅

### launch.json 구성

| 구성 이름 | 동작 |
|---|---|
| ① Current TS file (Node directly) | 열린 `.ts` 파일을 바로 실행. 가장 빠름 |
| ② Current TS file (tsc build, then run) | `preLaunchTask` 로 빌드 → `dist` 의 JS 실행, 소스맵으로 TS 에 중단점 매핑 |
| ③ Current TS file (tsx) | 모든 TS 문법 지원 |
| ④ Attach to running Node (Attach :9229) | 명령줄에서 `--inspect-brk` 로 띄운 프로세스에 연결 → [6-2](#6-2-명령줄에서-디버깅-attach) |
| ⑤ Current TS file (show generated JS, then run) | tsc 가 만든 JS 를 출력한 뒤 실행 → [7-1](#7-1-변환된-js-를-보고-실행하기--npm-run-js) |

### 따라 하기

1. VS Code 에서 **`projectroot` 폴더를 연다** (`.vscode` 폴더가 루트에 있어야 인식됨).
2. `lessons/00-setup/greeter.ko.ts` 의 `return strMessage;` 줄 왼쪽 여백을 클릭 → 빨간 점(중단점).
3. `lessons/00-setup/hello.ko.ts` 를 열고 `Ctrl+Shift+D` → 구성 선택 → `F5`.
4. 멈춘 상태에서 확인할 것
   - **변수(Variables)** 패널: `oPerson`, `strMessage` 값
   - **호출 스택(Call Stack)**: `hello.ko.ts` → `Greet`
   - **디버그 콘솔(Debug Console)**: `oPerson.strName.length` 같은 식 입력

| 단축키 | 동작 |
|---|---|
| F5 | 시작 / 계속(Continue) |
| F10 | 프로시저 단위 실행(Step Over) |
| F11 | 한 단계씩 코드 실행(Step Into) |
| Shift+F11 | 프로시저 나가기(Step Out) |
| Shift+F5 | 중지 |

> VS2022/2026 의 디버깅 단축키와 동일하다.

### 트러블슈팅 (Troubleshooting)

**`Variable ${file} can not be resolved. Please open an editor.`**

- 원인: 구성의 `"program": "${file}"` 은 **현재 에디터에 열려 있는 파일**을 뜻한다. 열린 파일 없이 F5 를 누르면 값을 채울 수 없다.
- 해결: 실행할 `.ts` 파일(예: `lessons/00-setup/hello.ko.ts`)을 열고 **그 탭에 포커스를 둔 상태**로 F5.
- VS2022 의 "시작 프로젝트(Startup Project)" 개념이 아니라 "지금 보고 있는 파일" 을 실행하는 방식이라, 예제 파일이 많은 학습용 저장소에 잘 맞는다.

**`Can't find Node.js binary "node"` / 터미널에서 `node` 인식 안 됨**

- 원인: Node.js 설치 폴더가 PATH 에 없음 (zip 으로 받아 압축만 푼 경우 흔함).
- 해결: 사용자 환경 변수 `Path` 에 Node.js 폴더 추가 → **VS Code 완전히 종료 후 재시작** (실행 중인 프로그램은 바뀐 PATH 를 모름). 방법은 [부록 A](#부록-a-nodejs-path-등록).
- 주의: 창 하나만 닫았다 열면 안 된다. VS Code 는 메인 프로세스 하나가 모든 창을 관리하므로, **모든 창을 `File > Exit` 로 닫아** `Code.exe` 가 완전히 내려가야 새 PATH 를 읽는다.

```powershell
node -v   # v24.x 가 나오면 OK
```

- VS Code 를 끌 수 없는 상황이면 → [부록 B](#부록-b-vs-code-설정만으로-node-경로-지정) 처럼 VS Code 설정으로 해결.

## 6. 명령줄에서 실행과 디버깅

VS Code 없이 cmd / PowerShell 만으로도 모든 작업이 가능하다. 아래는 `projectroot` 폴더 기준.

### 6-1. 실행 / 빌드 / 타입 검사

| 목적 | 명령 | 비고 |
|---|---|---|
| ① Node 직접 실행 | `node lessons/00-setup/hello.ko.ts` | 빌드 없음, 타입 검사 없음 |
| ② 빌드 후 실행 | `npm run build` → `node dist/lessons/00-setup/hello.ko.js` | `dist/` 에 `.js` + `.js.map` 생성 |
| ③ tsx 실행 | `npx tsx lessons/00-setup/hello.ko.ts` | esbuild 로 변환 |
| 파일 저장 시 자동 재실행 | `node --watch lessons/00-setup/hello.ko.ts` | Node 내장 감시 모드(Watch Mode) |
| 타입 검사 | `npm run typecheck` | `tsc --noEmit` — 파일 생성 없이 오류만 확인 |
| 타입 검사 (감시) | `npm run typecheck:watch` | 저장할 때마다 다시 검사 |
| 빌드 결과 삭제 | `npm run clean` | `dist/` 삭제 |

> `npx` = `node_modules/.bin` 에 설치된 도구를 실행. 전역 설치(`npm i -g`) 없이 프로젝트에 고정된 버전을 쓸 수 있다.

### 6-2. 명령줄에서 디버깅 (Attach)

1. 디버그 모드로 실행 (첫 줄에서 멈춘 채 디버거를 기다림)

   ```cmd
   node --inspect-brk lessons/00-setup/hello.ko.ts
   ```
   ```
   Debugger listening on ws://127.0.0.1:9229/...
   ```

2. 디버거 연결 — 둘 중 하나
   - **VS Code**: 디버그 구성 `④ Attach to running Node (Attach :9229)` 선택 → F5
   - **Chrome / Edge**: 주소창에 `chrome://inspect` (Edge 는 `edge://inspect`) → Remote Target 의 `inspect` 클릭

| 옵션 | 동작 |
|---|---|
| `--inspect` | 디버거 포트만 열고 바로 실행 (서버처럼 오래 도는 프로그램용) |
| `--inspect-brk` | 첫 줄에서 멈춤 (짧은 스크립트용) |
| `--inspect-brk=9230` | 포트 변경 |

> VS2022 의 "프로세스에 연결(Attach to Process)" 과 같은 개념이다.

### 6-3. 더 간단한 방법 — JavaScript 디버그 터미널

VS Code 터미널 오른쪽 `+` 옆 `∨` → **JavaScript Debug Terminal**.
이 터미널에서 `node lessons/00-setup/hello.ko.ts` 처럼 평소대로 실행하면 **자동으로 디버거가 붙는다**. launch.json 이 필요 없다.

## 7. TS 를 JS 로 변환한 결과 보기

TypeScript 는 HTML 이 아니라 **JavaScript** 로 변환된다. `node 파일.ts` 는 메모리에서만 변환하고 파일을 남기지 않으므로, JS 를 **눈으로 보려면** 아래 명령을 쓴다.

### 7-1. 변환된 JS 를 보고 실행하기 — `npm run js`

`npm run js -- <파일.ts>` ([tools/show-js.ts](../../tools/README.ko.md)) 는 세 단계를 차례로 보여 준다: **[1]** tsc 로 빌드 → **[2]** 만들어진 `.js` 출력 → **[3]** 그 `.js` 를 node 로 실행.

**터미널에서**

| 현재 위치 | 명령 |
|---|---|
| `projectroot` | `npm run js -- lessons/00-setup/enum-sample.ko.ts` |
| 이 강의 폴더 (`lessons/00-setup`) | `npm run js -- enum-sample.ko.ts` |
| npm 없이 | `node tools/show-js.ts lessons/00-setup/enum-sample.ko.ts` |
| Windows bat (`projectroot`) | `ts2js.bat lessons\00-setup\enum-sample.ko.ts` |
| Windows bat (이 강의 폴더) | `..\..\ts2js.bat enum-sample.ko.ts` |

> `--` 는 npm 에게 "뒤는 스크립트에 넘길 값" 이라고 알려 주는 구분자다. 빼면 안 된다.

**F5 로 (VS Code)**

1. [enum-sample.ko.ts](enum-sample.ko.ts) 를 에디터에서 연다
2. `Ctrl+Shift+D` → 디버그 구성 **⑤ Current TS file (show generated JS, then run)** 선택
3. `F5` → 터미널에 결과가 나온다

**실행 결과**

```
> npm run js -- lessons/00-setup/enum-sample.ko.ts
[1] tsc : lessons/00-setup/enum-sample.ko.ts  →  dist/lessons/00-setup/enum-sample.ko.js

[2] Generated JavaScript (dist/lessons/00-setup/enum-sample.ko.js)
----------------------------------------------------------------------
const COLOR = {
    Red: "RED",
    Green: "GREEN",
};
function Describe(eColor) {
    return `color = ${eColor}`;
}
console.log(COLOR.Red, COLOR.Green); // RED GREEN
console.log(Describe(COLOR.Green)); // color = GREEN
console.log(Describe("RED")); // color = RED  (문자열 리터럴도 가능)
export {};
// Describe("BLUE"); // ← 주석을 풀면 빨간 줄
----------------------------------------------------------------------

[3] node dist/lessons/00-setup/enum-sample.ko.js
RED GREEN
color = GREEN
color = RED
```

**에디터에서 나란히 비교하기**

1. 위 방법으로 한 번 실행
2. `Ctrl+P` → `enum-sample.ko.js` 입력 → `dist/` 쪽 파일 열기
3. `Ctrl+\` 로 화면 분할 → 한쪽은 `.ts`, 한쪽은 `.js`

[enum-sample.ko.ts](enum-sample.ko.ts) 와 비교해 보면 `as const`, `type EColor = ...` 줄 전체, 매개변수 타입 `: EColor` 만 사라지고 나머지는 같은 코드다. `npm run js -- lessons/00-setup/hello.ko.ts` 도 해 보자: `"./greeter.ko.ts"` 가 `"./greeter.ko.js"` 로 바뀐다.

> `.js` 는 `dist/` 에만 만들어지고 강의 폴더에는 생기지 않는다. `.ts` 를 지워도 예전 `.js` 는 `dist/` 에 남는다 → `npm run clean`.

### 7-2. 무엇이 바뀌나


| TS (`lessons/00-setup/*.ts`) | JS (`dist/lessons/00-setup/*.js`) | 변화 |
|---|---|---|
| `export interface IPerson { strName: string; nAge: number; }` | *(없음)* | `interface` 는 타입 전용 → 통째로 삭제 |
| `function Greet(oPerson: IPerson): string` | `function Greet(oPerson)` | 타입 표기(Type Annotation) 삭제 |
| `const arrPeople: IPerson[] = [...]` | `const arrPeople = [...]` | 타입 표기 삭제 |
| `import { Greet, type IPerson } from "./greeter.ko.ts"` | `import { Greet } from "./greeter.ko.js"` | 타입 import 삭제, 확장자 `.ts` → `.js` |
| `const COLOR = { ... } as const;` | `const COLOR = { ... };` | `as const` 만 삭제 |
| 헤더 주석 | 그대로 유지 | 주석은 보존 |
| — | `//# sourceMappingURL=hello.ko.js.map` | 디버깅용 소스맵 연결 |

핵심:

- 대부분의 TS 문법은 **지우기만 하면 JS** 가 된다 → 그래서 `node hello.ko.ts` 처럼 타입 제거(Type Stripping) 실행이 가능.
- `enum` 처럼 **JS 코드를 새로 만들어야 하는 문법**만 예외 → ① 로 실행할 수 없으므로 이 저장소에서는 쓰지 않는다 (`erasableSyntaxOnly`).
- 타입은 실행 시점(Runtime)에는 존재하지 않는다. 타입 검사는 오직 컴파일/에디터 단계의 일.

> C# 관점: C# 은 컴파일 후에도 IL 에 타입 정보가 남아 리플렉션(Reflection) 가능. TypeScript 는 타입이 **완전히 사라진다** (타입 소거, Type Erasure).

### 7-3. TS 문법 = JS 문법 + 타입 문법

TypeScript 문법은 **JavaScript 문법 전체에 타입 문법을 더한 것**이다. 그래서 "TS 문법" 으로 배우는 것의 절반 이상은 사실 현대 JS(ES2015+) 문법이다.

```
┌──────────────── TypeScript ────────────────┐
│  ┌──────── JavaScript (ES2024) ────────┐   │
│  │ const / let, function, import,      │   │
│  │ 1n, 구조 분해, class, async ...     │   │
│  └─────────────────────────────────────┘   │
│  + 타입 문법 :  : T, interface, type, ...  │
└────────────────────────────────────────────┘
```

| 문법 | 구분 | 실행하면 |
|---|---|---|
| `const` / `let`, `function`, `import` / `export`, `class` | **JS** | 그대로 |
| `1n`(bigint), `0xff`, `1_000`, 구조 분해 `const { a } = o` | **JS** | 그대로 |
| `main()` 없음, 최상위 코드 실행, `import.meta.main` | **JS** (Node) | 그대로 |
| `: string`, `: number[]` 타입 표기 | **TS** | 사라짐 |
| `interface`, `type`, 유니온 `"A" \| "B"`, `as const`, `import type` | **TS** | 사라짐 |
| `any` / `unknown` / `never`, 리터럴 타입, `@ts-expect-error` | **TS** | 사라짐 |

이 시리즈는 강의마다 각 문법에 **[JS]** / **[TS]** 표시를 붙인다. 예제 코드 주석에도 `// 1) [JS] ...` 처럼 표시한다.

- **[JS]** = TS 없이 JavaScript 에도 있는 문법. 브라우저·Node 어디서나 그대로 실행된다.
- **[TS]** = TypeScript 가 더한 타입 문법. 검사할 때만 쓰이고, 지우면 JS 가 된다 (7-2 의 타입 소거).
- **[JS + TS]** = 둘이 섞인 것 (예: 함수 본문은 JS, 매개변수 타입은 TS).

## 8. JS 는 어떻게 실행되나 — main 이 없다

**[JS]**

C / C# / Java 는 `main()` 에서 시작한다. JS / TS 에는 **진입점 함수(Entry Point Function)가 없다**. `node 파일.ts` 로 넘긴 파일(진입 모듈, Entry Module)의 **최상위 코드(Top-level Code)** 를 위에서 아래로 실행한다.

| 언어 | 시작 위치 |
|---|---|
| C / C++ | `int main()` |
| C# / Java | `static void Main()` / `public static void main()` |
| Python | 파일 최상위 코드 (관례로 `if __name__ == "__main__":`) |
| **JS / TS** | **파일 최상위 코드** |

### 8-1. 실행 순서 — [run-order.ko.ts](run-order.ko.ts)

```
> node lessons/00-setup/run-order.ko.ts
[run-order-lib.ko.ts] top-level code, import.meta.main = false
[run-order.ko.ts] top-level code, import.meta.main = true
[run-order.ko.ts] PrintSum() called: 1 + 2 = 3
Expected error: SyntaxError: Invalid or unexpected token
Why : 1.5n is a syntax error, so "line 1 runs?" is never printed. Parsing comes first.
Fix : bigint literals must be integers, e.g. 15n.
[run-order.ko.ts] last line
```

1. **`import` 가 먼저**: 코드 실행 전에 `import` 를 모두 연결(Link)한다 → `run-order-lib.ko.ts` 의 최상위 코드가 먼저 출력된다.
2. **그다음 위에서 아래로**: 함수는 정의만 해 두고, **호출할 때** 실행된다 (`PrintSum()`).
3. **실행 전에 파일 전체를 파싱**: 문법 오류(Syntax Error)가 있으면 **첫 줄도 실행되지 않는다**. 예제는 `new Function()` 으로 코드 문자열을 파싱시켜 이 오류를 잡아 보여 준다. (같은 파일에 `enum` 을 쓰면 `try`/`catch` 로도 못 잡는 이유가 이것이다.)

### 8-2. "이 파일이 직접 실행되었나?" — `import.meta.main`

```ts
if (import.meta.main) {
	// node 로 직접 실행했을 때만 (import 될 때는 false)
}
```

- Python 의 `if __name__ == "__main__":` 와 같은 역할 (Node 24).
- [greeter.ko.ts](greeter.ko.ts) 와 [run-order-lib.ko.ts](run-order-lib.ko.ts) 가 이 방식으로 "단독 실행하면 안내문 출력" 을 한다. `node lessons/00-setup/run-order-lib.ko.ts` 로 확인해 보자.
- C# 처럼 `function Main() { ... }` 을 만들고 마지막 줄에서 `Main();` 을 호출해도 되지만, 언어 규칙이 아니라 스타일(Style)일 뿐이다.

### 8-3. 그럼 인터프리터(Interpreter)인가?

**쓰는 입장에서는 그렇다.** 소스를 바로 실행하고, exe 같은 빌드 결과물이 없다. 그래서 Python 과 같은 스크립트 언어(Script Language)로 분류한다.

**엔진 내부는 순수 인터프리터가 아니다.** node 의 V8 엔진은:

```
소스 → 파싱(Parse) → 바이트코드(Bytecode) → Ignition 인터프리터로 실행
                                     └ 자주 실행되는 코드 → JIT 컴파일(Maglev / TurboFan) → 기계어(Machine Code)
```

| 언어 | 실행 방식 |
|---|---|
| C / C++ | 미리 기계어로 컴파일 (AOT, Ahead-Of-Time) → exe |
| C# / Java | 바이트코드(IL / Bytecode)로 컴파일 → 실행 시 JIT |
| Python | 바이트코드 → 인터프리터 (CPython) |
| **JS** | **소스 그대로 실행 → 바이트코드 인터프리터 + JIT** |

> TS 의 위치: `tsc` 는 기계어를 만드는 컴파일러가 아니라 **TS → JS 트랜스파일러(Transpiler) + 타입 검사기(Type Checker)** 다. `node hello.ko.ts` 는 타입만 지우고(Type Stripping) 위 방식으로 실행한다.
## 정리

- 공부할 때는 **① Node 직접 실행**. 이 저장소의 모든 예제는 이 방법으로 실행된다.
- 실제 결과물(배포)은 **② tsc 빌드**.
- 타입 검사는 실행과 별개 → `npm run typecheck` 습관화.
- 디버깅은 F5(launch) / `--inspect-brk` + Attach / JavaScript Debug Terminal 중 편한 것으로.
- TS 문법 = JS 문법 + 타입 문법. 강의에서는 **[JS]** / **[TS]** 로 구분해 표시한다.
- TS 는 JS 로 변환되고, 그 과정에서 타입은 사라진다. `npm run js -- <파일.ts>` 로 직접 확인.
- `main()` 은 없다. `import` 먼저 → 최상위 코드를 위에서 아래로. 직접 실행 여부는 `import.meta.main`.

**다음 강의 → [01. 기본 타입과 bigint](../01-basic-types/README.ko.md)**: 타입을 본격적으로 배우고 DevCalc 의 첫 부품(진법 변환)을 만든다.

---

## 부록 A. Node.js PATH 등록

Node.js 를 설치 프로그램(msi) 대신 zip 으로 받아 `D:\sdks\nodejs\node-v24.15.0-win-x64` 처럼 풀어 둔 경우, PATH 를 직접 등록해야 한다.

**현재 창에서만 임시 적용** (창을 닫으면 사라짐)

```cmd
:: cmd
set PATH=D:\sdks\nodejs\node-v24.15.0-win-x64;%PATH%
```
```powershell
# PowerShell
$env:Path = "D:\sdks\nodejs\node-v24.15.0-win-x64;" + $env:Path
```

**사용자 PATH 에 영구 등록** (PowerShell)

```powershell
$nodeDir  = "D:\sdks\nodejs\node-v24.15.0-win-x64"
$userPath = [Environment]::GetEnvironmentVariable("Path", "User")
if (($userPath -split ';') -notcontains $nodeDir) {
    [Environment]::SetEnvironmentVariable("Path", "$userPath;$nodeDir", "User")
}
```

또는 GUI: `Win + R` → `sysdm.cpl` → 고급 → 환경 변수 → 사용자 변수 `Path` 편집 → 새로 만들기.

> ⚠️ `setx PATH "...;%PATH%"` 는 쓰지 말 것. 시스템+사용자 PATH 가 합쳐진 값을 사용자 PATH 에 덮어쓰고, 1024자에서 잘릴 수 있다.

> 영구 등록 후에는 **이미 실행 중인 프로그램(VS Code, cmd 창 등)을 다시 시작**해야 반영된다.

## 부록 B. VS Code 설정만으로 Node 경로 지정

다른 작업 때문에 VS Code 를 완전히 끌 수 없을 때, **사용자 설정**에 아래를 추가하면 재시작 없이 즉시 적용된다.

`Ctrl+Shift+P` → `Preferences: Open User Settings (JSON)`

```jsonc
// Node.js (D:\sdks) - VS Code 재시작 없이 터미널/작업(Task)/디버거에서 node 사용
"terminal.integrated.env.windows": {
    "Path": "D:\\sdks\\nodejs\\node-v24.15.0-win-x64;${env:Path}"
},
"debug.javascript.defaultRuntimeExecutable": {
    "pwa-node": "D:\\sdks\\nodejs\\node-v24.15.0-win-x64\\node.exe"
}
```

| 설정 | 적용 대상 |
|---|---|
| `terminal.integrated.env.windows` | **새로 여는** 통합 터미널, npm 작업(Task, `preLaunchTask` 포함) |
| `debug.javascript.defaultRuntimeExecutable` | `runtimeExecutable` 을 지정하지 않은 모든 Node 디버그 구성 |

- 저장소의 `.vscode/settings.json` 이 아니라 **사용자 설정**에 넣는 이유: PC 마다 Node 설치 경로가 다르므로 GitHub 에 올리면 안 되는 값이다.
- 기존 터미널에는 적용되지 않으니 휴지통 아이콘으로 닫고 새로 열 것.

## 부록 C. 저장소의 VS Code 설정

| 파일 | 내용 |
|---|---|
| `.vscode/launch.json` | 디버그 구성 ①~⑤ |
| `.vscode/tasks.json` | `tsc: build`, `tsc: watch` 작업 |
| `.vscode/settings.json` | `typescript.tsdk` → 에디터가 프로젝트의 TypeScript(7.x) 를 사용 |
| `.vscode/extensions.json` | 추천 확장(Extension): ESLint, Prettier, Pretty TypeScript Errors |
| `.devcontainer/devcontainer.json` | Codespaces 환경: Node.js 24 설치, `npm ci` 자동 실행, 추천 확장 설치 |

- 처음 열면 나오는 알림
  - "This workspace contains a TypeScript version…" → **Allow** (프로젝트 TypeScript 사용)
  - "Do you want to install the recommended extensions…" → **Install** (추천 확장 설치)

---

[목차](../../README.ko.md) · [다음: 01. 기본 타입과 bigint →](../01-basic-types/README.ko.md)
