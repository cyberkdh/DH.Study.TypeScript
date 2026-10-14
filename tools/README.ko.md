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
| `projectroot` | `npm run js -- lessons/00-setup/hello.ts` |
| 강의 폴더 (예: `lessons/00-setup`) | `npm run js -- hello.ts` |
| npm 없이 | `node tools/show-js.ts lessons/00-setup/hello.ts` |
| Windows bat | `ts2js.bat lessons\00-setup\hello.ts` (PowerShell 에서는 `.\ts2js.bat ...`) |

> `--` 는 npm 에게 "뒤는 스크립트에 넘길 값" 이라고 알려 주는 구분자다. 빼면 안 된다.
> 파일을 주지 않으면 `lessons/00-setup/hello.ts` 를 예시로 보여 준다.

### F5 로 실행 (VS Code)

1. 보고 싶은 `.ts` 파일을 연다
2. `Ctrl+Shift+D` → **⑤ Current TS file (show generated JS, then run)** 선택
3. `F5` → 터미널에 결과가 나온다

### 출력

```
> npm run js -- lessons/00-setup/enum-sample.ts
[1] tsc : lessons/00-setup/enum-sample.ts  →  dist/lessons/00-setup/enum-sample.js

[2] Generated JavaScript (dist/lessons/00-setup/enum-sample.js)
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

[3] node dist/lessons/00-setup/enum-sample.js
RED GREEN
color = GREEN
color = RED
```

### 에디터에서 나란히 비교

1. 위 방법으로 한 번 실행
2. `Ctrl+P` → `enum-sample.js` 입력 → `dist/` 쪽 파일 열기
3. `Ctrl+\` 로 화면 분할 → 한쪽은 `.ts`, 한쪽은 `.js`

타입 부분(`as const`, `type EColor = ...`, `: EColor`)만 사라지고 나머지는 같은 코드다.

> `.ts` 를 지워도 예전 `.js` 는 `dist/` 에 남는다 → `npm run clean`.
