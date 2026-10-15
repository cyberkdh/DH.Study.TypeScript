[English](README.md) · **한국어**

[← 이전: 05. 제네릭](../05-generics/README.ko.md) · [목차](../../README.ko.md) · [다음: 07. 브라우저와 DOM →](../07-browser-dom/README.ko.md)

# 06. 모듈과 비동기 — import/export, Promise, 파일, 클립보드

> 시리즈: DH.Study.TypeScript · 06강
> 환경: Node.js v24 · TypeScript 7 · VS Code

## 목표

이 강의를 마치면 다음을 할 수 있다.

- [ ] `export` / `import` 로 코드를 파일로 나누고, 모든 import 형태(이름, `as`, `* as`, 기본(Default), `import type`, 동적(Dynamic))를 안다
- [ ] `verbatimModuleSyntax` 가 타입에 `import type` 을 요구하는 이유를 설명한다
- [ ] `Promise<T>` 를 읽고 `async` / `await` 를 쓰며, 동기 코드·마이크로태스크(Microtask)·타이머(Timer)의 실행 순서를 예측한다
- [ ] `Promise.all`, `allSettled`, `race` 로 작업을 병렬(Parallel)로 실행하고 시간 제한(Timeout)을 건다
- [ ] `node:fs/promises` 로 파일을 읽고 쓰며, `bigint` 를 JSON 에 저장하고, `ENOENT` 를 처리한다
- [ ] 이벤트 API(`child_process.spawn`)를 Promise 로 감싸 클립보드(Clipboard)에 복사한다
- [ ] DevCalc 에 코어 진입점 하나(`core/index.ts`), `--copy`, 대화형 모드(`--repl`)를 넣는다

## 이 강의의 목차

1. [모듈 — import 와 export](#1-모듈--import-와-export)
2. [Promise 와 async / await](#2-promise-와-async--await)
3. [여러 개를 동시에 — all, allSettled, race](#3-여러-개를-동시에--all-allsettled-race)
4. [파일과 다른 프로그램](#4-파일과-다른-프로그램)
5. [따라하기](#5-따라하기)
6. [직접 만들기 — 클립보드에 복사](#6-직접-만들기--클립보드에-복사)
7. [DevCalc 스텝 — 코어 진입점, --copy, --repl](#7-devcalc-스텝--코어-진입점---copy---repl)
8. [정리](#정리)

이 강의의 예제 파일: [math-lib.ko.ts](math-lib.ko.ts) · [modules.ko.ts](modules.ko.ts) · [promises.ko.ts](promises.ko.ts) · [files.ko.ts](files.ko.ts) · [clipboard.ko.ts](clipboard.ko.ts)

> 예제는 한국어 주석판(`x.ko.ts`)을 링크한다. 같은 코드의 영어 주석판은 `x.ts` 다.

> 문법 표시: **[JS]** = JavaScript 문법 (TS 없이도 있음) · **[TS]** = TypeScript 가 더한 타입 문법 (지우면 JS) · 자세한 구분은 [00강 7-3](../00-setup/README.ko.md#7-3-ts-문법--js-문법--타입-문법)

---

## 1. 모듈 — import 와 export

### 1-1. 파일 하나가 모듈 하나

**[JS]**

이 프로젝트의 `package.json` 에는 `"type": "module"` 이 있으므로 모든 `.ts` 파일이 **ES 모듈(ES Module)** 이다. 모듈은 자기만의 스코프(Scope)를 가진다. 한 파일 맨 위의 `const` 는 **export** 하고 다른 파일에서 **import** 하지 않으면 보이지 않는다.

| C# | TS / JS |
|---|---|
| `namespace` + `public` / `internal` | 파일이 단위. `export` = 공개, `export` 없음 = 파일 전용 |
| `using DevCalc.Core;` | `import { ToHex } from "./core/Format.ts";` — 가져올 이름과 파일을 하나하나 적는다 |
| 어셈블리 참조 (Assembly Reference) | `package.json` 의 패키지 (`import x from "pkg"`) |
| 정적 생성자 (Static Constructor) | 모듈의 최상위 코드. 처음 import 될 때 **한 번** 실행 |

강의 파일마다 `ToHex` 같은 같은 이름을 다시 쓸 수 있는 것도 이 때문이다. 파일마다 스코프가 따로다.

### 1-2. export

**[JS]** ([math-lib.ko.ts](math-lib.ko.ts))

```ts
export const MAX_BITS = 64;                     // 이름 있는 내보내기 (named export)
export function ToHex(biValue: bigint): string { ... }
const SEPARATOR = " .. ";                       // export 하지 않음 : 이 파일 전용

export interface IRange { readonly biMin: bigint; readonly biMax: bigint; }   // [TS] 타입 내보내기
export type ESign = "signed" | "unsigned";

export default function Describe(oRange: IRange): string { ... }   // 기본 내보내기 : 최대 하나
```

### 1-3. import

**[JS]** ([modules.ko.ts](modules.ko.ts))

```ts
import { Add, ToHex, MAX_BITS } from "./math-lib.ko.ts";   // 이름 : export 와 같아야 함
import { Add as AddBig } from "./math-lib.ko.ts";          // 이름 바꾸기
import * as MathLib from "./math-lib.ko.ts";               // 전부를 객체 하나로 : MathLib.ToHex
import DescribeRange from "./math-lib.ko.ts";              // 기본 : 중괄호 없음, 이름은 마음대로
import { basename } from "node:path";                      // Node 내장 모듈 : node: 접두어
```

- 경로에 `.ts` 를 그대로 쓴다. Node 는 파일을 그대로 실행하고, TS 도 받아 준다 (빌드할 때 `rewriteRelativeImportExtensions` 가 `.js` 로 바꾼다).
- 상대 경로는 `./` 나 `../` 로 시작한다. 그냥 이름(`"vitest"`)은 패키지다.
- 같은 파일을 여러 번 import 해도 **한 번만** 읽는다. import 하는 쪽 모두가 같은 모듈 객체를 받는다.
- 이 시리즈는 이름 있는 export 를 선호한다. 이름이 고정되므로 검색과 이름 바꾸기(Rename)가 모든 곳에서 통한다. 기본 export 는 아무 이름으로나 import 할 수 있다.

### 1-4. `import type`

**[TS]**

```ts
import type { IRange, ESign } from "./math-lib.ko.ts";
// import { IRange } from "./math-lib.ko.ts";   // TS1484
```

```
error TS1484: 'IRange' is a type and must be imported using a type-only import when 'verbatimModuleSyntax' is enabled.
```

(이 줄의 주석을 풀면 `IRange` 를 두 번 import 하게 되므로 TS2300 "Duplicate identifier" 도 함께 나온다.)

타입은 지워진다 (00강). `verbatimModuleSyntax` 의 규칙은 단순하다. 적은 그대로 실행되고, 타입 문법만 빠진다. 그냥 `import { IRange }` 라고 쓰면 JS 에 그대로 남아, 실행 시점에는 없는 export 를 `math-lib` 에 요구하게 된다. `import type` 은 통째로 지워진다. 섞어 쓸 수도 있다: `import { Evaluate, type IEvaluation } from "./core/index.ts";`.

### 1-5. 동적 `import()`

**[JS]**

```ts
const oLib = await import("./math-lib.ko.ts");   // 코드가 이 줄에 도달할 때 읽음, Promise 를 반환
```

필요할 때만 읽고 싶을 때 쓴다 (큰 모듈, 실행 중에 고르는 플러그인). 없는 파일은 catch 할 수 있는 reject 된 Promise 가 된다 (`ERR_MODULE_NOT_FOUND`). 정적 `import` 라면 없는 파일 때문에 프로그램 첫 줄이 실행되기도 전에 전체가 멈춘다. 경로가 리터럴(Literal)이면 동적 import 도 TS 가 검사한다 (TS2307).

## 2. Promise 와 async / await

### 2-1. Promise<T>

**[JS + TS]**

`Promise<T>` 는 나중에 도착하는 값이다. C# 의 `Task<T>` 와 비슷하다. **이행(Fulfilled, T 값과 함께)** 또는 **거부(Rejected, 에러와 함께)** 로 끝난다.

```ts
function Delay<T>(nMs: number, vValue: T): Promise<T> {
	return new Promise((fnResolve) => {
		setTimeout(() => fnResolve(vValue), nMs);
	});
}
```

`new Promise(...)` 는 예전 콜백(Callback) API 를 감쌀 때 쓴다. 대부분은 함수가 돌려주는 Promise 를 **쓰기만** 한다.

### 2-2. 실행 순서: 동기, 마이크로태스크, 타이머

**[JS]**

```ts
setTimeout(() => console.log("c) setTimeout 0"), 0);
Promise.resolve().then(() => console.log("b) then"));
console.log("a) synchronous");
```

a, b, c 순서로 출력된다. JS 는 **스레드 하나(Single Thread)** 와 이벤트 루프(Event Loop)로 돈다.

1. 지금 실행 중인 동기 코드를 끝까지 실행
2. 그다음 모든 **마이크로태스크** (Promise 콜백, `await` 다음 코드)
3. 그다음 **태스크(Task)** 하나 (타이머, I/O 이벤트), 그리고 다시 1부터

그래서 실행 중인 코드에 다른 코드가 끼어들지 않고, 락(Lock)도 없다. 대신 긴 반복문은 타이머와 화면(07강)까지 모두 막는다.

### 2-3. async / await

**[JS + TS]**

```ts
async function ReadRegister(strName: string): Promise<bigint> {
	await Delay(5, undefined);
	if (strName === "ZZ") {
		throw new Error(`unknown register "${strName}"`);   // → reject 된 Promise
	}
	return 0xffn;                                          // → Promise<bigint>
}

const biAx = await ReadRegister("AX");   // 최상위 await (Top-level await) : ES 모듈에서 허용
try {
	await ReadRegister("ZZ");
} catch (e) { ... }                      // try / catch 가 await 와 함께 동작
```

C# 과 거의 같다. `async` 는 함수가 Promise 를 반환하게 하고, `await` 는 스레드를 막지 않고 기다린다. 다른 점:

| C# | TS / JS |
|---|---|
| `Task<T>` | `Promise<T>` |
| `async void` (피할 것) | 아무도 await 하지 않는 `async` 함수의 Promise (피할 것) |
| `ConfigureAwait`, `SynchronizationContext` | 없음 : 스레드가 하나 |
| `CancellationToken` | `AbortSignal` (`AbortController`) |
| `Task.Delay(ms)` | `new Promise(r => setTimeout(r, ms))` 또는 `node:timers/promises` 의 `await setTimeout(ms)` |
| 최상위 문(Top-level statements)에서 `await` | ES 모듈의 최상위 `await` |

### 2-4. await 를 잊으면

**[TS]**

```ts
const vForgot = ReadRegister("AX");        // bigint 가 아니라 Promise<bigint>
// const biWrong: bigint = ReadRegister("AX");   // TS2322
```

```
error TS2322: Type 'Promise<bigint>' is not assignable to type 'bigint'.
```

여기서는 타입이 달라서 TS 가 잡아 준다. 모두 잡지는 못한다. `await` 없이 `ReadRegister("AX");` 만 적어도 컴파일된다. 그 Promise 가 reject 되면 Node 가 **처리되지 않은 거부(Unhandled Rejection)** 를 알리고 프로그램을 끝낸다. 모든 Promise 는 await 하거나, await 할 쪽에 넘긴다.

## 3. 여러 개를 동시에 — all, allSettled, race

**[JS]**

```ts
const arrValue = await Promise.all([Delay(30, 1n), Delay(30, 2n), Delay(30, 3n)]);   // 약 30 ms, 90 ms 아님
const arrSettled = await Promise.allSettled([ReadRegister("AX"), ReadRegister("ZZ")]);
const strWinner = await Promise.race([Delay(50, "slow"), Delay(5, "fast")]);
```

| JS | C# | 결과 |
|---|---|---|
| `Promise.all` | `Task.WhenAll` | 모든 값, 또는 **첫** 에러 |
| `Promise.allSettled` | — | 각각 `{ status: "fulfilled", value }` / `{ status: "rejected", reason }` |
| `Promise.race` | `Task.WhenAny` | 가장 먼저 끝난 것 (값이든 에러든) |
| `Promise.any` | — | 가장 먼저 **성공한** 것 |

작업은 함수를 **호출할 때** 시작한다. await 할 때가 아니다. `await A(); await B();` 는 하나씩 차례로, `await Promise.all([A(), B()])` 는 함께 실행한다.

타임아웃(Timeout)은 작업과 타이머를 경쟁시키는(race) 방식이다.

```ts
async function WithTimeout<T>(oWork: Promise<T>, nMs: number): Promise<T> {
	let oTimer: NodeJS.Timeout | undefined;
	const oTimeout = new Promise<never>((_, fnReject) => {
		oTimer = setTimeout(() => fnReject(new Error(`timed out after ${nMs} ms`)), nMs);
	});
	try {
		return await Promise.race([oWork, oTimeout]);
	} finally {
		clearTimeout(oTimer);   // 안 하면 Node 가 종료 전에 이 타이머를 기다림
	}
}
```

`Promise<never>` = 이행되지 않고 거부만 되는 Promise. `never` 는 어떤 `T` 에도 들어가므로 race 의 결과는 여전히 `Promise<T>` 다.

## 4. 파일과 다른 프로그램

### 4-1. node:fs/promises

**[JS]** ([files.ko.ts](files.ko.ts))

```ts
import { mkdtemp, writeFile, readFile, appendFile, readdir, stat, rm } from "node:fs/promises";

await writeFile(strFile, "0xFF + 1 = 256\n", "utf8");
const strText = await readFile(strFile, "utf8");   // "utf8" 이 없으면 Buffer (바이트) 를 받음
```

`File.ReadAllTextAsync` 와 비슷하다. 동기 버전(`node:fs` 의 `readFileSync`)도 있다. 작은 스크립트에서는 괜찮지만 이벤트 루프를 막는다 (2-2절).

### 4-2. JSON 과 bigint

**[JS + TS]**

```ts
JSON.stringify({ biValue: 1n });   // TypeError: Do not know how to serialize a BigInt
```

JSON 에는 bigint 가 없다. `biValue.toString()` 으로 저장하고 `BigInt(strValue)` 로 되읽는다. `JSON.parse` 는 `any` 를 반환하므로 타입을 붙인다: `JSON.parse(strText) as ISaved[]`. TS 는 이 캐스트를 데이터 확인 없이 그대로 받아들인다. 사용자가 고칠 수 있는 파일이라면 모양을 검사한다 (03강 가드).

### 4-3. code 가 있는 에러

**[JS + TS]**

```ts
try {
	await readFile(join(strDir, "missing.txt"), "utf8");
} catch (e) {
	const strCode = (e as NodeJS.ErrnoException).code;
	if (strCode !== "ENOENT") {
		throw e;   // 권한, 디스크 : 여기서 숨길 일이 아님
	}
	// "없음" : 예를 들어 빈 히스토리로 시작
}
```

Node 의 시스템 에러에는 `code` 문자열(`ENOENT`, `EACCES`, `EEXIST`...)이 있다. `IOException.HResult` 와 비슷하지만 읽을 수 있는 글자다. 예상한 것만 잡고 나머지는 다시 던진다.

### 4-4. 다른 프로그램 실행

**[JS]**

`node:child_process` 로 프로그램을 시작한다. `spawn` 은 Promise 를 반환하지 않고 **이벤트**(`"error"`, `"close"`)로 알린다. 6절에서 이것을 Promise 로 감싼다.

## 5. 따라하기

각 파일을 열고 `F5` 를 누르거나 명령줄에서 실행한다. 실행할 수 없는 환경이면 아래 결과와 코드를 함께 읽는다.

### [modules.ko.ts](modules.ko.ts) — 모든 import 형태, import type, 동적 import

```
> node lessons/06-modules-async/modules.ko.ts
1) Add = 0xFF / MAX_BITS = 64
2) AddBig = 3n
3) MathLib keys = Add, MAX_BITS, RangeOf, ToHex, default
4) default import = 0x0 .. 0xFF
5) types are gone at run time : MathLib has no IRange = true
6) this folder = 06-modules-async
7) dynamic import : same module object = true / ToHex(4095n) = 0xFFF
8) Expected error: ERR_MODULE_NOT_FOUND
   Why : the file does not exist, so the dynamic import's Promise rejected.
   Fix : check the path. With a literal path TS checks it for you (TS2307).
```

3) 에 `SEPARATOR` 가 없다. export 하지 않았기 때문이다. [math-lib.ko.ts](math-lib.ko.ts) 를 직접 실행하면 안내만 출력한다 (`import.meta.main`, 00강).

해 볼 것: TS1484 줄의 주석을 풀어 보자. `import { SEPARATOR } from "./math-lib.ko.ts";` 를 적어 보자 (TS2614: export 된 멤버 `SEPARATOR` 가 없음).

### [promises.ko.ts](promises.ko.ts) — 순서, async / await, all / allSettled / race, 시간 제한

```
> node lessons/06-modules-async/promises.ko.ts
2) order :
   a) synchronous code runs first
   b) then : a microtask, runs when the current code is done
   c) setTimeout 0 : a timer, runs last
3) await ReadRegister = 255n
4) Expected error: unknown register "ZZ"
   Why : the async function threw, so its Promise rejected and await rethrew it here.
   Fix : catch it around the await, or let it reach a caller that can.
5) Promise.all = [ 1n, 2n, 3n ] / ran in parallel = true
6) allSettled = fulfilled, rejected
   race = fast
7) without await : a Promise object
8) Expected error: timed out after 20 ms
   Why : the work took longer than the limit.
   Fix : raise the limit, or tell the user and let them retry.
```

해 볼 것: 5) 를 `await Delay(30, ...)` 세 줄로 바꾸고 걸린 시간을 출력해 보자. 8) 의 제한 `20` 을 `500` 으로 바꾸면 작업이 먼저 끝나 에러가 출력되지 않는다. 이때 `clearTimeout` 이 없으면 Node 는 쓰지 않은 500 ms 타이머를 기다린 뒤에 끝난다.

### [files.ko.ts](files.ko.ts) — 쓰기, 읽기, JSON, 폴더 목록, ENOENT, 정리

```
> node lessons/06-modules-async/files.ko.ts
2) temp folder created : devcalc-XXXXXX
3) read back : "0xFF + 1 = 256\nans * 2 = 512\n"
4) JSON round trip : 0xFF + 1 = 256n
   Expected error: Do not know how to serialize a BigInt
   Why : JSON has no bigint type.
   Fix : save biValue.toString() and read it back with BigInt(text).
5) history.json  60 bytes
5) history.txt   29 bytes
6) Expected error: ENOENT
   Why : the file does not exist (ENOENT = Error NO ENTry).
   Fix : treat it as empty on the first run, e.g. start with an empty history.
7) temp folder removed
```

모든 작업은 OS 임시 폴더 아래의 새 폴더에서 하고, 그 폴더는 `finally` 에서 지운다. (실제 이름은 끝에 무작위 6글자가 붙는다. 여기서는 `XXXXXX` 로 표시했다.)

## 6. 직접 만들기 — 클립보드에 복사

**[JS + TS]**

Node 에는 클립보드 API 가 없다. 대신 OS 마다 입력을 복사해 주는 작은 프로그램이 있다: `clip` (Windows), `pbcopy` (macOS), `wl-copy` / `xclip` / `xsel` (Linux). 전체 코드: [clipboard.ko.ts](clipboard.ko.ts).

```ts
interface ICommand {
	readonly strFile: string;
	readonly arrArg: readonly string[];
}

function ClipboardCommands(strPlatform: NodeJS.Platform): ICommand[] {
	switch (strPlatform) {
		case "win32":  return [{ strFile: "clip", arrArg: [] }];
		case "darwin": return [{ strFile: "pbcopy", arrArg: [] }];
		default:       return [{ strFile: "wl-copy", ... }, { strFile: "xclip", ... }, { strFile: "xsel", ... }];
	}
}

// 이벤트 API → Promise
function RunWithInput(oCommand: ICommand, strInput: string): Promise<void> {
	return new Promise((fnResolve, fnReject) => {
		const oChild = spawn(oCommand.strFile, oCommand.arrArg, { stdio: ["pipe", "ignore", "ignore"] });
		oChild.on("error", fnReject);   // 시작할 수 없음 (설치 안 됨)
		oChild.on("close", (nCode) => (nCode === 0 ? fnResolve() : fnReject(new Error(`exited with code ${nCode}`))));
		oChild.stdin.end(strInput);     // 텍스트를 쓰고 stdin 을 닫음
	});
}

// 하나가 성공할 때까지 차례로 시도
async function CopyToClipboard(strText: string): Promise<string> {
	const arrError: string[] = [];
	for (const oCommand of ClipboardCommands(process.platform)) {
		try {
			await RunWithInput(oCommand, strText);
			return oCommand.strFile;
		} catch (e) {
			arrError.push(...);
		}
	}
	throw new Error(`no clipboard program worked (${arrError.join(", ")})`);
}
```

- `ClipboardCommands` 는 안에서 `process.platform` 을 읽지 않고 플랫폼을 매개변수로 받는다. 그래서 테스트가 한 컴퓨터에서 모든 OS 를 확인할 수 있다.
- `for...of` 안의 `await` 는 시도를 **하나씩 차례로** 실행한다. 여기서는 그게 맞다 (첫 성공에서 멈춤).
- `"error"` 와 `"close"` 이벤트가 `fnReject` / `fnResolve` 가 된다. 콜백이나 이벤트 API 를 감싸는 일반적인 방법이다.

```
> node lessons/06-modules-async/clipboard.ko.ts
5) copied "0xFF" with clip : paste it somewhere (Ctrl+V / Cmd+V)
6) Expected error: ENOENT
   Why : the program is not installed, so it could not be started.
   Fix : CopyToClipboard tries the next command, and reports all of them if none works.
```

이 예제는 실제로 클립보드 내용을 바꾼다. macOS 에서는 `pbcopy`, Linux 에서는 처음 성공한 프로그램 이름이 나온다. 데스크톱이 없으면 (SSH, 컨테이너, Codespaces) 5) 에 `Could not copy:` 와 모든 시도가 출력된다. `node lessons/06-modules-async/clipboard.ko.ts 0x1F` 처럼 다른 텍스트를 복사할 수 있다.

## 7. DevCalc 스텝 — 코어 진입점, --copy, --repl

새 파일:

| 파일 | 내용 |
|---|---|
| [devcalc/src/core/index.ts](../../devcalc/src/core/index.ts) | 배럴(Barrel) : 코어가 제공하는 모든 것을 다시 내보냄 |
| [devcalc/src/cli/Clipboard.ts](../../devcalc/src/cli/Clipboard.ts) | 6절의 코드, 테스트를 위해 `ClipboardCommands` 를 export |
| [devcalc/src/cli/Repl.ts](../../devcalc/src/cli/Repl.ts) | `RunRepl(fnLine)` : 입력-계산-출력 반복 (REPL) |
| [devcalc/tests/Cli.test.ts](../../devcalc/tests/Cli.test.ts) | 코어에 `node:` import 없음, 클립보드 명령, 파이프 입력으로 `--repl` |

### core/ 와 cli/

```
devcalc/src/
├── core/        ← 순수한 계산 : node: import 없음, Node 와 브라우저에서 모두 실행
│   ├── index.ts ← 단 하나의 진입점
│   └── Format.ts, Parse.ts, WordSize.ts, Calculator.ts, Result.ts, History.ts, Evaluate.ts
├── cli/         ← Node 전용 : 클립보드 (child_process), REPL (readline)
└── main.ts      ← 명령줄 : 옵션, 출력
```

```ts
// core/index.ts — 배럴 파일
export { ToBin, ToDec, ToHex, GroupDigits, type IFormatOptions, type TFormatter } from "./Format.ts";
export { Evaluate, type IEvaluation, type IEvalError, type TEvalResult } from "./Evaluate.ts";
...

// main.ts — import 네 줄이 한 줄로
import { ToBin, ToDec, ToHex, CWordSize, IsWordBits, Evaluate, CHistory, type IFormatOptions, type TFormatter, type IEvaluation } from "./core/index.ts";
```

`export { ... } from` 은 배럴 자신의 스코프로 가져오지 않고 다시 내보낸다. 07강에서는 웹 페이지가 같은 `core/index.ts` 를 import 한다. `core/` 에 `node:` import 가 섞여 들어가지 않도록 테스트가 지킨다.

```ts
test("core: no Node-only imports, so it can run in the browser", async () => {
	for (const strName of await readdir(CORE_DIR)) {
		const strCode = await readFile(join(CORE_DIR, strName), "utf8");
		assert.doesNotMatch(strCode, /from\s+["']node:/, `${strName} imports a node: module`);
	}
});
```

### async Main, --copy

복사는 다른 프로그램을 기다려야 하므로 `Main` 이 `async` 가 됐다.

```ts
async function Main(): Promise<number> {
	if (bRepl) { ... }
	const nCode = Calculate(strExpr);
	if (nCode === 0 && bCopy) {
		await CopyLatest();   // 마지막 결과의 HEX 를 복사
	}
	return nCode;
}

process.exitCode = await Main();   // 최상위 await
```

```
> node devcalc/src/main.ts "0xFF + 1" --copy
HEX : 0x100
DEC : 256
BIN : 0b1_0000_0000
Copied: 0x100
```

클립보드 프로그램이 없는 것은 에러가 아니다. DevCalc 는 `Could not copy: ...` 를 출력하고 종료 코드는 0 그대로다. 계산은 성공했으니까.

### --repl

```ts
// cli/Repl.ts
export async function RunRepl(fnLine: (strLine: string) => Promise<boolean>): Promise<void> {
	const bTerminal = process.stdin.isTTY === true;
	const oReader = createInterface({ input: process.stdin, output: process.stdout, terminal: bTerminal });
	...
	for await (const strLine of oReader) {   // 입력이 끝날 때까지 한 줄씩
		...
		if (!(await fnLine(strLine.trim()))) {
			break;                            // "exit"
		}
	}
}
```

- `for await...of` 는 **비동기 이터러블(Async Iterable)** 을 돈다. 각 단계에서 다음 줄을 기다린다. C# 의 `IAsyncEnumerable<T>` 에 대한 `await foreach` 와 같다.
- `RunRepl` 은 DevCalc 를 모른다. 콜백(main.ts 의 `RunLine`)을 받으므로 테스트하고 다시 쓰기 쉽다.
- 입력이 파이프(Pipe, 파일이나 테스트)로 들어오면 터미널이 입력한 글자를 보여 주지 않는다. 그래서 `RunRepl` 이 프롬프트 뒤에 각 줄을 직접 출력한다.

```
> node devcalc/src/main.ts --repl --bits=16
DevCalc REPL : type "help" for commands, "exit" to quit (16-bit)
devcalc> 0xFF
HEX : 0x00FF
DEC : 255
BIN : 0b0000_0000_1111_1111
INT : 255 (16-bit signed)
devcalc> ans << 8
HEX : 0xFF00
DEC : 65,280
BIN : 0b1111_1111_0000_0000
INT : -256 (16-bit signed)
devcalc> history
 1) 0xFF = 0x00FF
 2) ans << 8 = 0xFF00
devcalc> 0xG
Invalid input: "0xG"
Why : "g" is not a valid hex digit
Fix : use an integer like 255, -0xFF, 0b1010, 0o17 or 1_000.
devcalc> copy
Copied: 0xFF00
devcalc> exit
```

에러가 나도 REPL 은 끝나지 않는다. `ans` 와 `history` 는 줄에서 줄로 이어진다. 명령: `help`, `history`, `copy`, `exit` / `quit`. `Ctrl+C` 나 `Ctrl+D` (Windows 는 `Ctrl+Z` 후 Enter) 로도 끝난다.

테스트는 파이프로 REPL 에 입력을 넣는다.

```ts
const oRun = spawnSync(process.execPath, [MAIN_FILE, "--repl"], {
	input: "0xFF\nans + 1\n0xG\nhistory\nexit\n0x1\n",
	encoding: "utf8",
});
assert.match(oRun.stdout, /devcalc> ans \+ 1\nHEX : 0x100\n/);
```

```
> npm test
check-pairs : 35 pairs, 0 failed
...
✔ core: no Node-only imports, so it can run in the browser
✔ core/index.ts: exports what main.ts needs
✔ ClipboardCommands: one program per OS, several on Linux
✔ --repl: reads piped lines, keeps ans between lines, stops at exit
...
ℹ pass 25
```

## 정리

- `import` / `export` 가 있는 파일은 자기 스코프를 가진 모듈이다. `export` = 공개. 경로에 `.ts` 를 쓴다. Node 내장 모듈은 `node:`.
- 이름 있는 export 를 선호한다. 타입에는 `import type` (`verbatimModuleSyntax`, TS1484). `await import()` 는 필요할 때 읽는다.
- `Promise<T>` ≈ `Task<T>`. `async` / `await` 와 `try` / `catch` 는 C# 처럼 동작한다. 스레드 하나: 동기 코드, 마이크로태스크, 타이머 순.
- `Promise.all` (병렬, 첫 에러), `allSettled` (모든 결과), `race` (가장 먼저 끝난 것, 예: 시간 제한). 호출이 작업을 시작하고, await 는 기다리기만 한다.
- 파일은 `node:fs/promises`. JSON 에는 bigint 가 없다. `e.code` (`ENOENT`) 를 확인하고 나머지는 다시 던진다.
- `new Promise((fnResolve, fnReject) => ...)` 로 이벤트 / 콜백 API 를 `await` 할 수 있게 만든다.
- DevCalc: `core/` (순수, 진입점 하나) 와 `cli/` (Node 전용), `--copy`, `for await` 를 쓴 `--repl`.

**다음 → [07. 브라우저와 DOM](../07-browser-dom/README.ko.md)**: 같은 TypeScript 를 브라우저에서 — DOM, 이벤트, 폼(Form), `localStorage`. DevCalc 에 같은 `core/` 위에 만든 웹 페이지(Lv4)가 생긴다.

---

[← 이전: 05. 제네릭](../05-generics/README.ko.md) · [목차](../../README.ko.md) · [다음: 07. 브라우저와 DOM →](../07-browser-dom/README.ko.md)
