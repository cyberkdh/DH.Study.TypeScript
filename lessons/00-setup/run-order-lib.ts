//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 00-setup / run-order-lib
//	History			: 2026-10-14 CYBERKDH Initial (최초 작성)
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// Top-level code : runs when this file is first imported (before the importing file's own code)
// 최상위 코드 : 이 파일이 처음 import 될 때 실행 (import 한 파일의 코드보다 먼저)
console.log("[run-order-lib.ts] top-level code, import.meta.main =", import.meta.main);

export function Add(nA: number, nB: number): number {
	return nA + nB;
}

// Run by itself (node run-order-lib.ts) → import.meta.main is true
// 단독 실행 (node run-order-lib.ts) → import.meta.main 이 true
if (import.meta.main) {
	console.log("[run-order-lib.ts] run directly. It is meant to be imported by run-order.ts.");
}
