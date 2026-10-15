[English](README.md) · **한국어**

[← 이전: 08. 고급 타입](../08-advanced-types/README.ko.md) · [목차](../../README.ko.md) · [다음: 10. (도전) 렉서와 파서 →](../10-lexer-parser/README.ko.md)

# 09. 테스트와 도구 — node:test, 모의 객체, Vitest, 이름 규칙 검사기

> 시리즈: DH.Study.TypeScript · 09강
> 환경: Node.js v24 · TypeScript 7 · Vitest 5 · VS Code

## 목표

이 강의를 마치면 다음을 할 수 있다.

- [ ] `node:test` 로 테스트를 쓴다 : `test`, `describe` / `it`, `assert` (`equal`, `deepEqual`, `throws`, `rejects`), 비동기 테스트, `skip` / `todo`
- [ ] 테스트 보고서(Report)를 읽고, 무엇이 테스트 파일을 실패(종료 코드 1)시키는지 안다
- [ ] 테스트에서 의존 대상을 바꿔 끼운다 : 먼저 가짜를 넘기고(주입), 그다음 `mock.fn`, `mock.method`, `mock.timers`
- [ ] 테스트를 Vitest 로 옮기고, `assert` 와 `expect` 를 서로 바꿔 쓴다
- [ ] 린터(Linter)가 내 TypeScript 버전을 지원하지 않을 때, 작은 도구로 프로젝트 규칙을 검사한다

## 이 강의의 목차

1. [node:test](#1-nodetest)
2. [테스트 대역](#2-테스트-대역)
3. [Vitest](#3-vitest)
4. [TypeScript 7 에서의 린트](#4-typescript-7-에서의-린트)
5. [따라하기](#5-따라하기)
6. [직접 만들기 — 이름 규칙 검사기](#6-직접-만들기--이름-규칙-검사기)
7. [DevCalc 스텝 — npm test 에 Vitest 와 이름 검사](#7-devcalc-스텝--npm-test-에-vitest-와-이름-검사)
8. [정리](#정리)

이 강의의 예제 파일: [testing-basics.ko.ts](testing-basics.ko.ts) · [mocking.ko.ts](mocking.ko.ts) · [naming.ko.ts](naming.ko.ts)

> 예제는 한국어 주석판(`x.ko.ts`)을 링크한다. 같은 코드의 영어 주석판은 `x.ts` 다.

> 문법 표시: **[JS]** = JavaScript 문법 (TS 없이도 있음) · **[TS]** = TypeScript 가 더한 타입 문법 (지우면 JS) · 자세한 구분은 [00강 7-3](../00-setup/README.ko.md#7-3-ts-문법--js-문법--타입-문법)

DevCalc 에는 04강부터 테스트가 있었다 (`devcalc/tests/*.test.ts`, `npm test` 로 실행하고 push 할 때마다 CI 도 실행). 지금까지는 보여 주기만 하고 설명하지 않았다. 이 강의에서는 그 동작 원리를 설명하고, 테스트를 Vitest 로 옮기고, 이 저장소의 이름 규칙 검사를 더한다.

테스트는 대부분 **[JS]** 다: `test`, `assert`, 모의 객체는 평범한 함수다. TypeScript 는 두 곳에서 돕는다: 가짜 객체(Fake)는 interface 에 맞아야 하고, 모의 함수(Mock)는 자기가 바꿔 끼운 함수의 타입을 안다.

---

## 1. node:test

Node 에는 테스트 실행기(Test runner)가 들어 있다. 설치할 것이 없다.

```ts
import { describe, it, test } from "node:test";
import assert from "node:assert/strict";

test("ToHex(255n) is 0xFF", () => {
	assert.equal(ToHex(255n), "0xFF");
});
```

- 테스트는 함수다. **예외 없이 끝나면 통과**, 예외를 던지면 실패다. `assert` 는 검사가 거짓이면 `AssertionError` 를 던지는 함수 모음일 뿐이다.
- `node:assert` 가 아니라 `node:assert/strict` 를 import 하자. strict 모드에서 `equal` 은 `===` 다 (strict 가 아닌 것은 `==` 라서 `1 == "1"` 도 통과한다).

> **C#** : `test(...)` ≈ `[Fact]` (xUnit) / `[Test]` (NUnit) 메서드, `assert.equal` ≈ `Assert.Equal`, `assert.throws` ≈ `Assert.Throws<T>`. 특성(Attribute)이 없다: 함수를 호출하는 것으로 테스트가 등록된다.

### 1-1. 가장 많이 쓰는 assert

| Assert | 통과 조건 | 예 |
|---|---|---|
| `equal(a, b)` | `a === b` | `assert.equal(ToHex(0n), "0x0")` |
| `deepEqual(a, b)` | 내용이 같음 (배열, 객체, Map, Set) | `assert.deepEqual(arrHex, ["0x1", "0xA"])` |
| `ok(v)` | `v` 가 truthy | `assert.ok(arrHex.length === 3)` |
| `throws(fn, check)` | `fn()` 이 예외를 던지고, 에러가 맞음 | `assert.throws(() => ToHex(-1n), RangeError)` |
| `rejects(promise, check)` | 프로미스가 거부되고, 에러가 맞음 | `await assert.rejects(ParseLater("4x"), SyntaxError)` |
| `match(str, re)` | 문자열이 정규식에 맞음 | `assert.match(strOut, /0xFF/)` |

`check` 자리에는 에러 클래스, 메시지용 정규식, 또는 객체 `{ name: "RangeError", message: "negative value" }` 를 쓸 수 있다.

내용이 같은 두 배열은 `equal` 이 **아니다** — 객체 두 개이기 때문이다. `deepEqual` 을 쓰자.

### 1-2. describe 와 it

`describe(이름, fn)` 은 테스트를 묶는다. 보고서에서 들여쓰기로 보인다. `it` 은 `test` 의 별칭(Alias)이다. 읽기 좋은 쪽을 쓰면 된다.

### 1-3. 비동기 테스트

함수를 `async` 로 만들면 (또는 프로미스를 반환하면) 실행기가 기다린다.

```ts
test("async", async () => {
	assert.equal(await ParseLater("42"), 42n);
	await assert.rejects(ParseLater("4x"), SyntaxError);
});
```

`assert.rejects` 앞의 `await` 를 빠뜨리지 말자. 빠뜨리면 테스트 함수가 먼저 끝나서 **검사가 실행되기도 전에** ✔ 로 보고된다. 그 뒤 검사가 실패해도 테스트는 ✔ 그대로이고, node 는 "generated asynchronous activity after the test ended" (테스트가 끝난 뒤 비동기 작업이 있었음) 라는 안내만 덧붙인다 (종료 코드는 1).

### 1-4. skip, todo, only

```ts
test("copy to the clipboard", { skip: "needs a desktop session" }, () => { ... });
test.todo("ToHex with a word size (--bits)");
```

skip 과 todo 테스트는 보고서에 나오지만 (`﹣`, `# TODO`) 실패가 아니다. `{ only: true }` 는 node 를 `--test-only` 로 실행했을 때 표시한 테스트만 실행한다.

### 1-5. 보고서와 종료 코드

`node:test` 를 import 한 파일은 그 파일을 실행하면 테스트가 돈다: `node testing-basics.ko.ts`. 여러 파일은 `node --test "devcalc/tests/**/*.test.ts"` (이 강의 전까지 `npm test` 가 하던 일).

```
✔ 1) ToHex(255n) is 0xFF (0.6773ms)
▶ 2) ToHex
  ✔ zero (0.0917ms)
...
ℹ tests 8
ℹ pass 6
ℹ fail 0
```

테스트가 하나라도 실패하면 보고서가 그 `AssertionError` (기대값과 실제값, 파일과 줄) 를 보여 주고 **node 는 종료 코드 1 로 끝난다**. 이 종료 코드 때문에 `npm test` 와 CI 가 실패한다. [testing-basics.ko.ts](testing-basics.ko.ts) 의 마지막 줄 앞 `//` 를 지워서 해 보자.

```
✖ 6) fails
  AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:

  '0xA' !== '0xa'
```

괄호 안의 시간은 실행할 때마다 바뀐다.

---

## 2. 테스트 대역

클립보드에 쓰거나, 시계를 읽거나, 타이머를 기다리는 코드는 테스트하기 어렵다. 테스트 대역(Test double)이 실제 객체 대신 그 자리를 채운다.

### 2-1. 가짜 객체 넘기기 (의존성 주입)

가장 먼저 시도할 방법이다. 함수가 진짜 객체를 직접 가져다 쓰는 대신 interface 를 요구하면, 테스트는 모양만 같으면 무엇이든 넘길 수 있다:

```ts
interface IClipboard {
	Write(strText: string): Promise<void>;
}

async function CopyResult(biValue: bigint, oClipboard: IClipboard): Promise<string> { ... }

const arrWritten: string[] = [];
const oFake: IClipboard = {
	Write: async (strText) => {
		arrWritten.push(strText);
	},
};
assert.equal(await CopyResult(255n, oFake), "copied 0xFF");
assert.deepEqual(arrWritten, ["0xFF"]);
```

**[TS]** 가 가짜 객체를 검사한다: 숫자를 받는 `Write` 는 TS2322. 라이브러리가 필요 없다. DevCalc 는 이미 이렇게 되어 있다: `Evaluate` 는 `CHistory` 를 받고, 출력하는 대신 값을 반환한다 (05~06강). 그래서 테스트에 모의 객체가 필요 없다.

> **C#** : interface (`IClipboard`) 를 쓰는 생성자 주입과 직접 만든 가짜 객체와 같은 방식이다. TypeScript 는 구조적 타이핑(Structural typing)이라서 가짜 객체가 `implements IClipboard` 라고 밝힐 필요가 없다 — 모양만 맞으면 된다.

### 2-2. mock.fn, mock.method, mock.timers

코드를 바꿀 수 없을 때는 `node:test` 가 함수를 기록하고 바꿔 끼워 준다:

| 도구 | 하는 일 | 예 |
|---|---|---|
| `mock.fn(impl?)` | 모든 호출을 기록하는 함수 | `fnLog.mock.callCount()`, `fnLog.mock.calls[0]?.arguments` |
| `t.mock.method(obj, "Name", impl)` | 객체의 메서드 하나를 바꿔 끼움 | `t.mock.method(oStamp, "Now", () => 0)` |
| `t.mock.timers.enable(...)` + `tick(ms)` | 가짜 `setTimeout` / `setInterval` / `Date` | 300 ms 가 순식간에 지나감 |

- 전역 `mock` 보다 `t.mock` (`t` 로 넘어오는 테스트 컨텍스트) 을 쓰자: 바꿔 끼운 것을 테스트가 끝나면 모두 되돌려 놓는다.
- 모의 함수는 바꿔 끼운 대상에서 타입을 얻는다. `t.mock.method(oStamp, "Later", ...)` 는 TS2769 — `"Later"` 는 `CStamp` 의 키가 아니다.
- `mock.fn<(strLine: string) => void>()` — 본문이 없으면 타입 인수가 호출 모양을 알려 준다.

---

## 3. Vitest

이 프로젝트에는 `node:test` 로 충분한데 왜 Vitest 인가? Vite / 프런트엔드 세계에서 가장 많이 쓰는 실행기이고, 다른 프로젝트에서 읽게 될 코드가 `expect` 스타일이며, 감시 모드(Watch mode)와 읽기 쉬운 실패 출력이 좋다. `.ts` 파일도 스스로 실행한다.

### 3-1. 설치와 설정

```bash
npm install -D vitest
```

```ts
// vitest.config.ts
import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		include: ["devcalc/tests/**/*.test.ts"],
	},
});
```

| 명령 | 하는 일 |
|---|---|
| `npx vitest run` | 한 번 실행 (CI, `npm test`) |
| `npx vitest` | **감시 모드** : 파일을 저장할 때마다 영향받는 테스트를 다시 실행 (`npm run test:watch`) |
| `npx vitest run --reporter=verbose` | 테스트마다 한 줄 |

### 3-2. DevCalc 테스트 옮기기

Vitest 는 던져진 에러는 무엇이든 실패로 친다. 그래서 `node:assert` 가 그대로 동작한다. DevCalc 테스트 파일 7개를 옮기는 데 **파일마다 한 줄**이면 됐다:

```ts
import { test } from "node:test";   // 전
import { test } from "vitest";      // 후
import assert from "node:assert/strict";   // 그대로
```

새 테스트는 Vitest 의 `expect` 를 쓴다. 두 스타일을 나란히 보면:

| node:assert | Vitest expect |
|---|---|
| `assert.equal(a, b)` | `expect(a).toBe(b)` |
| `assert.deepEqual(a, b)` | `expect(a).toEqual(b)` |
| `assert.ok(v)` | `expect(v).toBeTruthy()` |
| `assert.throws(fn, RangeError)` | `expect(fn).toThrow(RangeError)` |
| `await assert.rejects(p, SyntaxError)` | `await expect(p).rejects.toThrow(SyntaxError)` |
| `assert.match(str, /re/)` | `expect(str).toMatch(/re/)` |
| `mock.fn()` | `vi.fn()` → `expect(fn).toHaveBeenCalledWith("a")` |
| `t.mock.method(o, "Now", ...)` | `vi.spyOn(o, "Now").mockReturnValue(0)` |
| `t.mock.timers.enable()` + `tick(300)` | `vi.useFakeTimers()` + `vi.advanceTimersByTime(300)` |

실패한 `expect` 는 테스트의 줄을 보여 준다 (임시 테스트 파일에서 받은 출력):

```
 FAIL  devcalc/tests/Tmp.test.ts > fails
AssertionError: expected '0xA' to be '0xa' // Object.is equality

Expected: "0xa"
Received: "0xA"

 ❯ devcalc/tests/Tmp.test.ts:23:21
```

> 강의 예제는 `node:test` 로 둔다. 그래야 다른 예제처럼 `node file.ts` 로 실행할 수 있다. Vitest 테스트 파일은 `vitest` 로만 실행된다.

---

## 4. TypeScript 7 에서의 린트

린터는 컴파일은 되지만 틀렸을 가능성이 높거나 팀 규칙을 어긴 코드를 찾는다. 보통은 ESLint 와 **typescript-eslint** 를 쓴다. 이 글을 쓰는 시점에 typescript-eslint 는 TypeScript 6.0 까지 지원하고 (피어 의존성(Peer dependency)이 `typescript <6.1.0`), 이 프로젝트는 TypeScript 7 을 쓴다. 설치하려면 그 검사를 강제로 우회해야 하고, 지원 대상이 아닌 컴파일러에서 도구를 쓰게 된다. 그래서 이 강의는 다른 방법을 쓴다:

| 린터가 검사할 것 | 이 프로젝트가 쓰는 것 |
|---|---|
| 쓰지 않는 변수, import, 매개변수 | `tsc` : `noUnusedLocals`, `noUnusedParameters` (이 강의에서 `tsconfig.json` 에 추가) |
| 빠진 `case`, 다음 case 로 넘어감 (Fall-through) | `tsc` : `noFallthroughCasesInSwitch`, 그리고 `AssertNever` (03강) |
| `undefined` 일 수 있는 `arr[0]` | `tsc` : `noUncheckedIndexedAccess` |
| `enum`, `namespace` | `tsc` : `erasableSyntaxOnly` |
| 이 저장소의 이름 규칙 | **`tools/check-names.ts`** (6, 7 절) |
| `x.ts` 와 `x.ko.ts` 의 코드가 같음 | `tools/check-pairs.ts` |

두 도구와 `tsc` 는 `npm test` / `npm run typecheck` 에서 실행되므로 push 할 때마다 CI 가 검사한다. typescript-eslint 가 TypeScript 7 을 지원하게 되면, 평범하게 `npm install -D eslint typescript-eslint` 와 `eslint.config.js` 를 더하면 된다.

> 포맷(탭, 따옴표)은 다른 일이다: Prettier 같은 포매터(Formatter)가 파일을 다시 쓴다. 이 저장소는 포맷을 손으로 지킨다 (탭, 큰따옴표). `.vscode/settings.json` 은 줄 끝 (LF) 과 인코딩 (UTF-8) 만 정한다.

---

## 5. 따라하기

### [testing-basics.ko.ts](testing-basics.ko.ts) — test, describe / it, assert, 비동기, skip / todo, 실패하는 assert

```
> node lessons/09-testing-tooling/testing-basics.ko.ts
✔ 1) ToHex(255n) is 0xFF (0.6773ms)
▶ 2) ToHex
  ✔ zero (0.0917ms)
  ✔ throws RangeError for a negative value (0.3708ms)
✔ 2) ToHex (0.6081ms)
✔ 3) deepEqual (0.3281ms)
✔ 4) async : await the value, rejects for the error (0.1955ms)
﹣ 5) copy to the clipboard (0.0795ms) # needs a desktop session
✔ 5) ToHex with a word size (--bits) (0.059ms) # TODO
✔ 6) a failing assert (caught here, so the file still passes) (0.5935ms)
ℹ Expected error: Expected values to be strictly equal:
ℹ   actual "0xA", expected "0xa"
ℹ Why : ToHex writes upper-case digits; a test without the try would fail
ℹ Fix : expect "0xA" (or change ToHex if lower case is what you want)
ℹ tests 8
ℹ suites 1
ℹ pass 6
ℹ fail 0
ℹ cancelled 0
ℹ skipped 1
ℹ todo 1
ℹ duration_ms 8.3338
```

`t.diagnostic(...)` 은 보고서에서 그 테스트 아래에 한 줄 (`ℹ`) 을 출력한다. 해 볼 것:

- 마지막 줄 앞의 `//` 를 지우면 → `✖ 6) fails`, 그리고 `echo $?` (bash) / `$LASTEXITCODE` (PowerShell) 가 `1` 을 보여 준다.
- 테스트 4 의 `assert.rejects` 앞 `await` 를 지우고, `SyntaxError` 를 `RangeError` 로 바꿔 보자 (반드시 실패해야 하는 검사). 테스트 4 는 여전히 `✔` 이고, 보고서에 `generated asynchronous activity after the test ended` 가 붙는다. `await` 를 되돌리면 → 예상대로 `✖ 4)`.
- 첫 번째 테스트 5 의 옵션을 `{ skip: ... }` 에서 `{ only: true }` 로 바꾸고 `node --test-only lessons/09-testing-tooling/testing-basics.ko.ts` 를 실행 → 그 테스트만 실행된다.

### [mocking.ko.ts](mocking.ko.ts) — 넘겨준 가짜, mock.fn, mock.method, mock.timers

```
> node lessons/09-testing-tooling/mocking.ko.ts
✔ 1) injection : a fake clipboard keeps what was written (0.9369ms)
✔ 2) mock.fn : count the calls and read the arguments (0.354ms)
✔ 3) mock.method : a fixed time (0.6956ms)
✔ 4) mock.timers : 300 ms pass in no time (0.5451ms)
✔ 5) a failing fake (the error is caught here) (0.5067ms)
ℹ Expected error: clipboard is locked (0x1)
ℹ Why : the fake throws; CopyResult does not catch, so the error reaches the caller
ℹ Fix : a test can expect it : await assert.rejects(CopyResult(1n, oBroken), /locked/)
ℹ tests 5
ℹ suites 0
ℹ pass 5
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 9.1229
```

해 볼 것: 테스트 4 의 `tick(1)` 을 `tick(0)` 으로 바꾸면 → 299 ms 밖에 지나지 않았으므로 테스트가 실패한다. `oBad` 줄 앞의 `//` 를 지우면 → 편집기에 TS2322.

### [naming.ko.ts](naming.ko.ts) — 6 절 참고

---

## 6. 직접 만들기 — 이름 규칙 검사기

이 저장소는 타입에 따라 이름을 짓는다 ([이름 규칙 표](../../README.ko.md#이름-규칙-naming-convention)): `CCalculator`, `IResult`, `ERadix`, `TResult`, `ParseNumber`, `strName`, `MAX_BITS`. 리뷰하는 사람은 `const value` 를 놓칠 수 있다. 도구는 놓치지 않는다.

### 테스트 먼저

만들기 전에 검사기가 찾아야 할 것을 먼저 적는다. 각 테스트는 그 규칙이 생길 때까지 빨간색이다:

```ts
test("each rule finds its bad name", () => {
	const arrBad = ["class Calc {}", "interface Result {}", 'type Radix = "hex";', "type Pair = [number];", "function to_hex() {}", "let total = 0;"];
	const arrFound = arrBad.map((strLine) => CheckNames(strLine).map((oIssue) => oIssue.strName));
	assert.deepEqual(arrFound, [["Calc"], ["Result"], ["Radix"], ["Pair"], ["to_hex"], ["total"]]);
});
```

### 규칙 하나는 데이터

```ts
interface INameRule {
	reFind: RegExp; // 그룹 1 이 이름
	reGood: RegExp;
	strRule: string;
}

const RULES: readonly INameRule[] = [
	{ reFind: /\bclass\s+(\w+)/, reGood: /^C[A-Z]/, strRule: "class starts with C" },
	{ reFind: /\binterface\s+(\w+)/, reGood: /^I[A-Z]/, strRule: "interface starts with I" },
	...
];
```

검사기는 모든 줄과 모든 규칙을 순회한다. 규칙을 더하는 것은 행을 더하는 것이다 — 08강의 연산자 표와 같은 생각이다.

```
> node lessons/09-testing-tooling/naming.ko.ts
5) line 1 Calculator : class starts with C
5) line 2 TRadixName : string union starts with E
5) line 4 value      : variable has a prefix or is UPPER_CASE
5) a string : Expected error: a false alarm [ 'bad' ]
   Why : the line is not parsed, so the word class inside the string is read as a declaration.
   Fix : blank out strings and comments first (BlankNonCode in tools/check-names.ts)
▶ CheckNames
  ✔ good names : no problems (0.9971ms)
  ✔ each rule finds its bad name (0.2604ms)
  ✔ line numbers start at 1, comments are skipped (0.1585ms)
✔ CheckNames (2.1506ms)
ℹ tests 3
ℹ suites 1
ℹ pass 3
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 8.0399
```

마지막 사례가 정규식의 한계다: `"class bad"` 가 문자열이라는 것을 모른다. [tools/check-names.ts](../../tools/check-names.ts) 의 전체 버전은 먼저 주석, 문자열, 템플릿 리터럴, 정규식을 비우고 (`BlankNonCode`), 메서드 (PascalCase) 와 getter (변수처럼 이름 짓기) 도 검사한다. 여전히 파서는 아니지만 — 구조 분해(Destructuring)와 매개변수의 이름은 건너뛴다 — 한 번에 읽을 수 있을 만큼 작다.

> **C#** : .NET 에서는 `.editorconfig` 의 이름 규칙이나 Roslyn 분석기(Analyzer)가 같은 일을 하며, 실제 구문 트리(Syntax tree)를 본다. 정규식 검사기는 그 간이 버전이다. 분명한 규칙 몇 개에는 이것으로 충분하다.

---

## 7. DevCalc 스텝 — npm test 에 Vitest 와 이름 검사

### 바뀐 것

| 파일 | 변경 |
|---|---|
| `package.json` | devDependencies 에 `vitest`. `test` = `check-pairs` → `check-names` → `vitest run`. 새 `test:watch`, `names` |
| `vitest.config.ts` | 새 파일: `devcalc/tests/**/*.test.ts` 를 실행 |
| `devcalc/tests/*.test.ts` (7 개) | `import { test } from "vitest"` (assert 는 그대로) |
| `devcalc/tests/Names.test.ts` | 새 파일: 검사기의 테스트, `expect` 로 작성 |
| `tools/check-names.ts` | 새 파일: 이름 규칙 검사기 (devcalc 와 tools) |
| `tsconfig.json` | `noUnusedLocals`, `noUnusedParameters` |
| `devcalc/web/App.ts` | `const o` → `const oSaved` |

### 검사기가 처음 찾은 것

DevCalc 에 `check-names` 를 처음 돌렸을 때 실제 문제 하나를 찾았다 — 접두어만 있고 이름이 없는 변수:

```
FAIL devcalc\web\App.ts:51 o : variable has a type prefix (strName, nIdx) or is UPPER_CASE
check-names : 23 files, 1 problems
```

```ts
const oSaved = vValue as Record<string, unknown>; // 전 : const o
```

첫 버전은 오탐(False alarm)도 두 가지 냈다: getter (`get nCount()` 는 프로퍼티처럼 쓰이므로 변수처럼 이름 짓는다) 와 `as const` (선언이 아님). 둘 다 고치기 전에 `Names.test.ts` 의 테스트 사례가 되었다.

### expect 로 쓴 테스트

```ts
import { describe, expect, test } from "vitest";
import { BlankNonCode, CheckSource } from "../../tools/check-names.ts";

test("an issue has the line and the rule", () => {
	expect(CheckSource("const nOk = 1;\nlet value = 2;")).toEqual([
		{ nLine: 2, strName: "value", strRule: expect.stringContaining("prefix") },
	]);
});
```

`toEqual` 안의 `expect.stringContaining(...)` 은 값의 일부만 검사한다 — 정확한 문구가 바뀔 수 있을 때 편하다.

### 확인한 것

```
> npm test
check-pairs : 47 pairs, 0 failed
check-names : 24 files, 0 problems

 RUN  v5.0.4 D:/mydata/blog/projects/DH.Study.TypeScript/projectroot

 Test Files  8 passed (8)
      Tests  32 passed (32)
```

- 전부터 있던 테스트 28 개가 Vitest 에서 바꾸지 않은 채 모두 통과하고, 새 테스트 4 개가 더해졌다. CI (`.github/workflows/ci.yml`) 는 바꿀 것이 없었다: `npm ci`, `npm run typecheck`, `npm test` 를 실행한다.
- 새 옵션 두 개를 켜고도 `tsc` 가 통과한다.
- DevCalc 의 출력 (명령줄과 웹 페이지) 은 전과 같다. 변수 이름 하나만 바뀌었다.

해 볼 것:

- `npm run test:watch` 를 실행한 채로 `devcalc/tests/Format.test.ts` 의 `"0xFF"` 를 `"0xff"` 로 바꾸고 저장해 보자. 그 파일만 다시 실행된다.
- `node tools/check-names.ts lessons` — 03강의 `TRadixName` 과 `TSign` 을 찾는다: 이름 규칙 표에 따르면 `E` 로 시작해야 하는 문자열 리터럴 유니온이다. 규칙을 도구로 검사하기 전에 쓴 이름이다. 이름을 바꿔 보는 것은 좋은 연습이다 (`.ts` 와 `.ko.ts`, 그리고 README 모두).
- `tools/check-names.ts` 에 규칙을 더해 보자: `RegExp` 를 담는 `const` 는 `RE_` 나 `re` 로 시작해야 한다. `Names.test.ts` 에 테스트부터 쓰자.

---

## 정리

- 테스트는 예외를 던지지 않으면 통과하는 함수다. `node:test` 는 `test`, `describe` / `it`, `skip` / `todo` 를, `node:assert/strict` 는 `equal`, `deepEqual`, `throws`, `rejects` 를 준다. 실패하면 node 가 종료 코드 1 로 끝나고, 그래서 `npm test` 와 CI 가 실패한다.
- 비동기 검사는 await 하자 (`await assert.rejects(...)`).
- interface 를 통해 가짜 객체를 넘기는 방법을 먼저 쓰자. 그럴 수 없을 때 `mock.fn`, `t.mock.method`, `t.mock.timers` 가 기록하고 바꿔 끼운다 — 타입도 있다.
- Vitest 는 `assert` 로 쓴 테스트를 그대로 실행한다. 고유 스타일은 `expect(...).toBe / toEqual / toThrow` 와 `vi.fn / vi.spyOn / vi.useFakeTimers` 다. 감시 모드는 바뀐 것만 다시 실행한다.
- typescript-eslint 는 아직 TypeScript 7 을 지원하지 않는다. `tsc` 의 strict 와 unused 옵션, 그리고 작은 도구 두 개 (`check-pairs`, `check-names`) 가 이 프로젝트에 필요한 것을 맡고, 모두 CI 에서 실행된다.

**다음 → [10. (도전) 렉서와 파서](../10-lexer-parser/README.ko.md)**: DevCalc 가 `(0xFF + 1) << 4` 같은 수식 전체를 읽는다 — 토크나이저(Tokenizer), 재귀 파서(Recursive parser), 판별 유니온으로 만든 구문 트리.

---

[← 이전: 08. 고급 타입](../08-advanced-types/README.ko.md) · [목차](../../README.ko.md) · [다음: 10. (도전) 렉서와 파서 →](../10-lexer-parser/README.ko.md)
