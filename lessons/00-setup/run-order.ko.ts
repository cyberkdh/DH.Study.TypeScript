//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 00-setup / run-order
//	History			: 2026-10-14 CYBERKDH Initial (최초 작성)
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// main() 이 없다. node 는 넘겨받은 파일의 최상위 코드를 위에서 아래로 실행한다.

// 1) import 는 코드 실행 전에 연결된다 → run-order-lib.ko.ts 가 먼저 출력
import { Add } from "./run-order-lib.ko.ts";

console.log("[run-order.ko.ts] top-level code, import.meta.main =", import.meta.main);

// 2) 함수는 호출할 때만 실행된다
function PrintSum(): void {
	console.log("[run-order.ko.ts] PrintSum() called: 1 + 2 =", Add(1, 2));
}
PrintSum();

// 3) 실행 전에 파일 전체를 먼저 파싱한다. 문법 오류가 있으면 첫 줄도 실행되지 않는다.
//    new Function() 도 코드 문자열을 똑같이 파싱하므로 여기서 오류를 잡아 보여 줄 수 있다.
try {
	const strCode = 'console.log("line 1 runs?"); const biBad = 1.5n;';
	const fnCode = new Function(strCode);
	fnCode(); // 여기까지 오지 못함
} catch (e) {
	console.log("Expected error:", (e as Error).name + ":", (e as Error).message);
	console.log('Why : 1.5n is a syntax error, so "line 1 runs?" is never printed. Parsing comes first.');
	console.log("Fix : bigint literals must be integers, e.g. 15n.");
}

console.log("[run-order.ko.ts] last line");
