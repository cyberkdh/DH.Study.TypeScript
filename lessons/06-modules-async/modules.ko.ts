//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 06-modules-async / modules (import 의 모든 형태)
//	History			: 2026-10-15 CYBERKDH Initial (최초 작성)
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// 1) [JS] 이름 있는 가져오기 (named import) : 이름이 export 와 같아야 함. 경로에 .ts 확장자를 그대로 씀
import { Add, ToHex, MAX_BITS } from "./math-lib.ko.ts";

// 2) [JS] as 로 이름 바꾸기 : 이름 충돌을 피함
import { Add as AddBig } from "./math-lib.ko.ts";

// 3) [JS] 네임스페이스 가져오기 (namespace import) : 전부를 하나의 객체로
import * as MathLib from "./math-lib.ko.ts";

// 4) [JS] 기본 가져오기 (default import) : 중괄호 없음, 이름은 마음대로
import DescribeRange from "./math-lib.ko.ts";

// 5) [TS] 타입 전용 가져오기 (type-only import) : 완전히 지워짐 (verbatimModuleSyntax 는 여기서 "type" 을 요구)
import type { IRange, ESign } from "./math-lib.ko.ts";
// import { IRange } from "./math-lib.ko.ts"; // ← 주석을 풀면 빨간 줄 TS1484 (IRange 는 타입 : import type 을 써야 함)

// 6) [JS] Node 내장 모듈은 node: 접두어를 씀
import { basename } from "node:path";

console.log("1) Add =", ToHex(Add(0xf0n, 0x0fn)), "/ MAX_BITS =", MAX_BITS);
console.log("2) AddBig =", AddBig(1n, 2n));
console.log("3) MathLib keys =", Object.keys(MathLib).sort().join(", "));

const eSign: ESign = "unsigned";
const oByte: IRange = MathLib.RangeOf(8, eSign);
console.log("4) default import =", DescribeRange(oByte));
console.log("5) types are gone at run time : MathLib has no IRange =", !("IRange" in MathLib));
console.log("6) this folder =", basename(import.meta.dirname));

// 7) [JS] 동적 가져오기 (dynamic import) : 코드가 그 줄에 도달할 때 모듈을 읽고, Promise 를 돌려줌
const oLib = await import("./math-lib.ko.ts");
console.log("7) dynamic import : same module object =", oLib === MathLib, "/ ToHex(4095n) =", oLib.ToHex(4095n));

// 8) [JS] 없는 파일 : 정적 import 는 첫 줄이 실행되기도 전에 파일 전체가 실패하고, 동적 import 는 reject 됨
//    (변수에 담긴 경로는 TS 가 검사하지 않음 : await import("./no-such-file.ts") 라고 쓰면 TS2307)
const strMissing = "./no-such-file.ts";
try {
	await import(strMissing);
} catch (e) {
	console.log("8) Expected error:", (e as NodeJS.ErrnoException).code);
	console.log("   Why : the file does not exist, so the dynamic import's Promise rejected.");
	console.log("   Fix : check the path. With a literal path TS checks it for you (TS2307).");
}
