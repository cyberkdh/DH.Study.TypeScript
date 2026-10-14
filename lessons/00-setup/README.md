# 00. 개발 환경 구성 — VS Code에서 TypeScript 실행 & 디버깅

> 시리즈: DH.Study.TypeScript · 1주차
> 환경: Windows · Node.js v24.15.0 · TypeScript 7.0.2 · VS Code

## 목표 (Goals)

이 강의를 마치면 다음을 할 수 있다.

- [ ] `.ts` 파일을 세 가지 방법(Node 직접, 빌드 후, tsx)으로 실행하고 차이를 설명한다
- [ ] VS Code 에서 F5 로 중단점(Breakpoint)을 걸고 변수·호출 스택(Call Stack)을 확인한다
- [ ] 명령줄(Command Line)에서 `--inspect-brk` 로 디버깅한다
- [ ] TS 가 JS 로 바뀔 때 무엇이 사라지는지(타입 소거, Type Erasure) 직접 확인한다

> 시리즈 전체의 목적과 최종 목표(DevCalc)는 [루트 README](../../README.md#목적-purpose) 참고.

## 이 글에서 다루는 것

- TypeScript 프로젝트 기본 파일 (`package.json`, `tsconfig.json`)
- `.ts` 파일을 실행하는 세 가지 방법과 차이
- VS Code에서 F5로 중단점(Breakpoint) 디버깅하기

---

## 1. 준비물

| 도구 | 버전 | 비고 |
|---|---|---|
| Node.js | 24.x | `node -v` 로 확인. PATH 에 등록되어 있어야 VS Code 디버거가 찾을 수 있음 |
| VS Code | 최신 | TypeScript 언어 서비스(Language Service) 기본 내장 |

```bash
npm install -D typescript tsx @types/node
```

- `typescript` : 컴파일러 `tsc`. 7.x 부터는 Go 로 다시 작성된 네이티브(Native) 버전이라 빌드가 매우 빠르다.
- `tsx` : TypeScript 를 바로 실행해 주는 러너(Runner).
- `@types/node` : `process`, `fs` 같은 Node.js API 의 타입 정의.

## 2. 프로젝트 구조

```
projectroot/
├─ .vscode/
│  ├─ launch.json      ← 디버그 구성
│  ├─ tasks.json       ← tsc 빌드 작업
│  └─ settings.json    ← 프로젝트 TypeScript 버전 사용
├─ lessons/
│  └─ 00-setup/
│     ├─ README.md        ← 이 강의
│     └─ examples/
│        ├─ hello.ts
│        ├─ greeter.ts
│        └─ enum-sample.ts
├─ devcalc/            ← (예정) 강의마다 자라는 최종 앱
├─ tools/              ← (예정) 채점 스크립트 등
├─ package.json
└─ tsconfig.json
```

> **이름 규칙**: 이 저장소는 헝가리언 표기법(Hungarian Notation)을 쓴다. 예제의 `IPerson`(인터페이스), `strName`(string), `nAge`(number), `oPerson`(객체), `arrPeople`(배열), `Greet`(함수는 PascalCase). 전체 표는 [루트 README](../../README.md#이름-규칙-naming-convention) 참고.

## 3. tsconfig.json 핵심 옵션

| 옵션 | 값 | 의미 |
|---|---|---|
| `module` / `moduleResolution` | `nodenext` | Node.js 의 ES 모듈(ESM) 규칙 그대로 사용 |
| `strict` | `true` | 엄격한 타입 검사. 공부할 때는 무조건 켜기 |
| `noUncheckedIndexedAccess` | `true` | `arr[0]` 의 타입을 `T \| undefined` 로 → 안전한 코드 습관 |
| `rewriteRelativeImportExtensions` | `true` | `import "./a.ts"` 를 빌드 시 `./a.js` 로 바꿔 줌 |
| `verbatimModuleSyntax` | `true` | 타입만 가져올 때 `import type` 을 쓰도록 강제 |
| `sourceMap` | `true` | 빌드된 JS ↔ 원본 TS 위치 매핑 → 디버깅에 필요 |

> C# 개발자 관점: `tsconfig.json` ≈ `.csproj`, `tsc` ≈ `csc`/`dotnet build`, `strict` ≈ Nullable 참조 형식(Nullable Reference Types) 활성화.

## 4. .ts 파일을 실행하는 세 가지 방법

| 방법 | 명령 | 빌드 | enum / namespace | 특징 |
|---|---|---|---|---|
| ① Node 직접 실행 | `node hello.ts` | 불필요 | ❌ | Node 22.18+/24 의 타입 제거(Type Stripping). 타입 부분만 공백으로 지움 |
| ② tsc 빌드 후 실행 | `npm run build` → `node dist/.../hello.js` | 필요 | ✅ | 실제 배포 방식. 타입 검사까지 수행 |
| ③ tsx | `node --import tsx hello.ts` | 불필요 | ✅ | 내부적으로 esbuild 로 변환. 모든 문법 지원 |

`enum-sample.ts` 를 ① 로 실행하면 다음 오류가 난다.

```
SyntaxError [ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX]: TypeScript enum is not supported in strip-only mode
```

`enum` 은 타입만 있는 게 아니라 **런타임 객체(JavaScript 코드)를 생성**하기 때문이다. "지우기만" 하는 ① 방식으로는 처리할 수 없다.

> ⚠️ ①, ③ 은 **타입 검사를 하지 않는다**. 타입 오류는 에디터 빨간 줄 또는 `npm run typecheck` 로 확인한다.

## 5. VS Code 디버깅

### launch.json 구성

| 구성 이름 | 동작 |
|---|---|
| ① 현재 TS 파일 (Node 직접 실행) | 열린 `.ts` 파일을 바로 실행. 가장 빠름 |
| ② 현재 TS 파일 (tsc 빌드 후 실행) | `preLaunchTask` 로 빌드 → `dist` 의 JS 실행, 소스맵으로 TS 에 중단점 매핑 |
| ③ 현재 TS 파일 (tsx) | 모든 TS 문법 지원 |
| ④ 실행 중인 Node 에 연결 (Attach :9229) | 명령줄에서 `--inspect-brk` 로 띄운 프로세스에 연결 → [6-2](#6-2-명령줄에서-디버깅--inspect-brk--연결attach) |

### 따라 하기

1. VS Code 에서 **`projectroot` 폴더를 연다** (`.vscode` 폴더가 루트에 있어야 인식됨).
2. `lessons/00-setup/examples/greeter.ts` 의 `return strMessage;` 줄 왼쪽 여백을 클릭 → 빨간 점(중단점).
3. `lessons/00-setup/examples/hello.ts` 를 열고 `Ctrl+Shift+D` → 구성 선택 → `F5`.
4. 멈춘 상태에서 확인할 것
   - **변수(Variables)** 패널: `oPerson`, `strMessage` 값
   - **호출 스택(Call Stack)**: `hello.ts` → `Greet`
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
- 해결: 실행할 `.ts` 파일(예: `lessons/00-setup/examples/hello.ts`)을 열고 **그 탭에 포커스를 둔 상태**로 F5.
- VS2022 의 "시작 프로젝트(Startup Project)" 개념이 아니라 "지금 보고 있는 파일" 을 실행하는 방식이라, 예제 파일이 많은 학습용 저장소에 잘 맞는다.

**`Can't find Node.js binary "node"` / 터미널에서 `node` 인식 안 됨**

- 원인: Node.js 설치 폴더가 PATH 에 없음 (zip 으로 받아 압축만 푼 경우 흔함).
- 해결: 사용자 환경 변수 `Path` 에 Node.js 폴더 추가 → **VS Code 완전히 종료 후 재시작** (실행 중인 프로그램은 바뀐 PATH 를 모름).
- 주의: 창 하나만 닫았다 열면 안 된다. VS Code 는 메인 프로세스 하나가 모든 창을 관리하므로, **모든 창을 `File > Exit` 로 닫아** `Code.exe` 가 완전히 내려가야 새 PATH 를 읽는다.

```powershell
node -v   # v24.x 가 나오면 OK
```

- VS Code 를 끌 수 없는 상황이면 → [부록 B](#부록-b-vs-code-설정만으로-node-경로-지정-재시작-불필요) 처럼 VS Code 설정으로 해결.

## 6. 명령줄(Command Line)에서 실행 & 디버깅

VS Code 없이 cmd / PowerShell 만으로도 모든 작업이 가능하다. 아래는 `projectroot` 폴더 기준.

### 6-1. 실행 / 빌드 / 타입 검사

| 목적 | 명령 | 비고 |
|---|---|---|
| ① Node 직접 실행 | `node lessons/00-setup/examples/hello.ts` | 빌드 없음, 타입 검사 없음 |
| ② 빌드 후 실행 | `npm run build` → `node dist/lessons/00-setup/examples/hello.js` | `dist/` 에 `.js` + `.js.map` 생성 |
| ③ tsx 실행 | `npx tsx lessons/00-setup/examples/enum-sample.ts` | 모든 TS 문법 지원 |
| 파일 저장 시 자동 재실행 | `node --watch lessons/00-setup/examples/hello.ts` | Node 내장 감시 모드(Watch Mode) |
| 타입 검사 | `npm run typecheck` | `tsc --noEmit` — 파일 생성 없이 오류만 확인 |
| 타입 검사 (감시) | `npm run typecheck:watch` | 저장할 때마다 다시 검사 |
| 빌드 결과 삭제 | `npm run clean` | `dist/` 삭제 |

> `npx` = `node_modules/.bin` 에 설치된 도구를 실행. 전역 설치(`npm i -g`) 없이 프로젝트에 고정된 버전을 쓸 수 있다.

### 6-2. 명령줄에서 디버깅 — `--inspect-brk` + 연결(Attach)

1. 디버그 모드로 실행 (첫 줄에서 멈춘 채 디버거를 기다림)

   ```cmd
   node --inspect-brk lessons/00-setup/examples/hello.ts
   ```
   ```
   Debugger listening on ws://127.0.0.1:9229/...
   ```

2. 디버거 연결 — 둘 중 하나
   - **VS Code**: 디버그 구성 `④ 실행 중인 Node 에 연결 (Attach :9229)` 선택 → F5
   - **Chrome / Edge**: 주소창에 `chrome://inspect` (Edge 는 `edge://inspect`) → Remote Target 의 `inspect` 클릭

| 옵션 | 동작 |
|---|---|
| `--inspect` | 디버거 포트만 열고 바로 실행 (서버처럼 오래 도는 프로그램용) |
| `--inspect-brk` | 첫 줄에서 멈춤 (짧은 스크립트용) |
| `--inspect-brk=9230` | 포트 변경 |

> VS2022 의 "프로세스에 연결(Attach to Process)" 과 같은 개념이다.

### 6-3. 더 간단한 방법 — JavaScript 디버그 터미널

VS Code 터미널 오른쪽 `+` 옆 `∨` → **JavaScript Debug Terminal**.
이 터미널에서 `node lessons/00-setup/examples/hello.ts` 처럼 평소대로 실행하면 **자동으로 디버거가 붙는다**. launch.json 이 필요 없다.

## 정리

- 공부할 때는 **① Node 직접 실행** 으로 빠르게, `enum` 등이 필요하면 **③ tsx**.
- 실제 결과물(배포)은 **② tsc 빌드**.
- 타입 검사는 실행과 별개 → `npm run typecheck` 습관화.
- 디버깅은 F5(launch) / `--inspect-brk` + Attach / JavaScript Debug Terminal 중 편한 것으로.

---

## 7. TS → JS 변환 결과 직접 보기

TypeScript 는 HTML 이 아니라 **JavaScript** 로 변환된다. `npm run build` 후 `dist/` 를 열어 보면 확인할 수 있다.

| TS (`lessons/00-setup/examples/*.ts`) | JS (`dist/lessons/00-setup/examples/*.js`) | 변화 |
|---|---|---|
| `export interface IPerson { strName: string; nAge: number; }` | *(없음)* | `interface` 는 타입 전용 → 통째로 삭제 |
| `function Greet(oPerson: IPerson): string` | `function Greet(oPerson)` | 타입 표기(Type Annotation) 삭제 |
| `const arrPeople: IPerson[] = [...]` | `const arrPeople = [...]` | 타입 표기 삭제 |
| `import { Greet, type IPerson } from "./greeter.ts"` | `import { Greet } from "./greeter.js"` | 타입 import 삭제, 확장자 `.ts` → `.js` |
| `enum Color { Red = "RED", ... }` | `var Color; (function (Color) { Color["Red"] = "RED"; ... })(Color \|\| (Color = {}));` | **실제 코드가 새로 생성됨** |
| 헤더 주석 | 그대로 유지 | 주석은 보존 |
| — | `//# sourceMappingURL=hello.js.map` | 디버깅용 소스맵 연결 |

핵심:

- 대부분의 TS 문법은 **지우기만 하면 JS** 가 된다 → 그래서 `node hello.ts` 처럼 타입 제거(Type Stripping) 실행이 가능.
- `enum` 처럼 **JS 코드를 새로 만들어야 하는 문법**만 예외 → ① Node 직접 실행에서 오류가 난 이유.
- 타입은 실행 시점(Runtime)에는 존재하지 않는다. 타입 검사는 오직 컴파일/에디터 단계의 일.

> C# 관점: C# 은 컴파일 후에도 IL 에 타입 정보가 남아 리플렉션(Reflection) 가능. TypeScript 는 타입이 **완전히 사라진다** (타입 소거, Type Erasure).

## 부록 A. Node.js PATH 등록 (zip 설치 버전)

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

## 부록 B. VS Code 설정만으로 Node 경로 지정 (재시작 불필요)

다른 작업 때문에 VS Code 를 완전히 끌 수 없을 때, **사용자 설정**에 아래를 추가하면 즉시 적용된다.

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

## 부록 C. 저장소에 포함된 VS Code 설정 (`.vscode/`)

| 파일 | 내용 |
|---|---|
| `launch.json` | 디버그 구성 ①~④ |
| `tasks.json` | `tsc: build`, `tsc: watch` 작업 |
| `settings.json` | `typescript.tsdk` → 에디터가 프로젝트의 TypeScript(7.x) 를 사용 |
| `extensions.json` | 추천 확장(Extension): ESLint, Prettier, Pretty TypeScript Errors |

- 처음 열면 나오는 알림
  - "This workspace contains a TypeScript version…" → **Allow** (프로젝트 TypeScript 사용)
  - "Do you want to install the recommended extensions…" → **Install** (추천 확장 설치)
