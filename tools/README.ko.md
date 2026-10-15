[English](README.md) · **한국어**

# tools

공부를 돕는 보조 스크립트. 강의 예제나 DevCalc 에 속하지 않는다.

## show-js.ts — .ts 가 JavaScript 로 어떻게 바뀌는지 보기

`node 파일.ts` 는 TS 를 **메모리에서만** JS 로 바꾸기 때문에 JS 를 볼 수 없다. `show-js.ts` 는 세 단계로 보여 준다.

1. **[1]** `tsc` 로 빌드 → `.js` 가 `dist/` 에 만들어진다
2. **[2]** 만들어진 `.js` 를 출력
3. **[3]** 그 `.js` 를 node 로 실행

### 터미널에서 실행

| 현재 위치 | 명령 |
|---|---|
| `projectroot` | `npm run js -- lessons/00-setup/hello.ko.ts` |
| 강의 폴더 (예: `lessons/00-setup`) | `npm run js -- hello.ko.ts` |
| npm 없이 | `node tools/show-js.ts lessons/00-setup/hello.ko.ts` |
| Windows bat | `ts2js.bat lessons\00-setup\hello.ko.ts` (PowerShell 에서는 `.\ts2js.bat ...`) |

> `--` 는 npm 에게 "뒤는 스크립트에 넘길 값" 이라고 알려 주는 구분자다. 빼면 안 된다.
> 파일을 주지 않으면 `lessons/00-setup/hello.ts` 를 예시로 보여 준다.

### F5 로 실행 (VS Code)

1. 보고 싶은 `.ts` 파일을 연다
2. `Ctrl+Shift+D` → **⑤ Current TS file (show generated JS, then run)** 선택
3. `F5` → 터미널에 결과가 나온다

### 출력

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
...
----------------------------------------------------------------------

[3] node dist/lessons/00-setup/enum-sample.ko.js
RED GREEN
color = GREEN
color = RED
```

### 에디터에서 나란히 비교

1. 위 방법으로 한 번 실행
2. `Ctrl+P` → `enum-sample.ko.js` 입력 → `dist/` 쪽 파일 열기
3. `Ctrl+\` 로 화면 분할 → 한쪽은 `.ts`, 한쪽은 `.js`

타입 부분(`as const`, `type EColor = ...`, `: EColor`)만 사라지고 나머지는 같은 코드다.

> `.ts` 를 지워도 예전 `.js` 는 `dist/` 에 남는다 → `npm run clean`.

## check-pairs.ts — x.ts 와 x.ko.ts 를 같게 유지

강의 예제는 모두 한 쌍이다: `x.ts` (영어 주석) 와 `x.ko.ts` (한국어 주석). 코드는 같아야 한다. `check-pairs.ts` 는 주석을 빼고, 공백을 무시하고, `.ko.ts` 를 `.ts` 로 읽은 뒤 두 파일을 줄 단위로 비교한다.

```bash
npm run pairs          # 검사만
npm test               # check-pairs, check-names 다음에 Vitest 로 DevCalc 테스트 (CI 에서도 실행)
```

```
> npm run pairs
check-pairs : 15 pairs, 0 failed
```

한쪽 파일의 코드만 고치면:

```
FAIL lessons\01-basic-types\bigint.ts : code differs from the .ko.ts file
  .ts    : console.log("7n / 2n =", 7n / 2n);
  .ko.ts : console.log("7n / 2n =", 7n / 3n);
check-pairs : 15 pairs, 1 failed
```

> 예제를 고칠 때는 두 파일의 코드를 똑같이 고친다. 주석만 달라도 된다.

## check-names.ts — 이름 규칙 검사

이 저장소는 타입에 따라 이름을 짓는다 ([이름 규칙 표](../README.ko.md#이름-규칙-naming-convention)). `check-names.ts` 는 모든 `.ts` 파일을 읽어 주석, 문자열, 정규식을 비운 뒤 선언마다 검사한다: class 는 `C`, interface 는 `I`, 문자열 리터럴 유니온은 `E`, 그 밖의 타입 별칭은 `E` 나 `T`, 함수와 메서드는 PascalCase, 변수는 타입 접두어 (`strName`, `nIdx`, `m_`/`g_` 허용) 또는 UPPER_CASE. [09강](../lessons/09-testing-tooling/README.ko.md#6-직접-만들기--이름-규칙-검사기) 에서 만들었다.

```bash
npm run names                      # devcalc 와 tools (npm test 에도 포함)
node tools/check-names.ts lessons  # 아무 폴더나 .ts 파일
```

```
> npm run names
check-names : 24 files, 0 problems
```

문제가 있으면 파일, 줄, 규칙을 보여 주고 종료 코드는 1 이다:

```
FAIL devcalc\web\App.ts:51 o : variable has a type prefix (strName, nIdx) or is UPPER_CASE
check-names : 23 files, 1 problems
```

> 파서가 아니라 정규식 검사기다: 구조 분해한 이름과 매개변수는 검사하지 않는다.

## serve.ts — 브라우저 강의용 로컬 개발 서버

브라우저는 TypeScript 를 실행할 수 없다. `serve.ts` 는 이 폴더를 제공하면서, `.ts` 파일을 요청받으면 Node 자체의 `stripTypeScriptTypes()` (`node 파일.ts` 와 같은 일) 로 타입을 지우고 JavaScript 를 보낸다. 패키지가 필요 없다. [07강](../lessons/07-browser-dom/README.ko.md)부터 쓴다.

```
> npm run web
Dev server running. Open in the browser:
  http://127.0.0.1:5173/lessons/07-browser-dom/      lesson 07 examples (add ?ko for Korean comments)
  http://127.0.0.1:5173/devcalc/web/                 DevCalc web
Stop : Ctrl+C
```

- `127.0.0.1` 에서만 접속을 받는다. `..`, 숨김 폴더(`.git`), `node_modules` 는 거부한다 (403).
- 다른 포트: `PORT=8080 npm run web` (bash) 또는 `$env:PORT=8080; npm run web` (PowerShell).
- 타입 검사는 하지 **않는다**: VS Code 나 `npm run typecheck` 를 쓴다.
- `Cache-Control: no-store` : 새로 고치면 언제나 최신 코드를 받는다.
