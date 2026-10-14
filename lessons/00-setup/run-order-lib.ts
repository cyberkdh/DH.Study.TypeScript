//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 00-setup / run-order-lib
//	History			: 2026-10-14 CYBERKDH Initial
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// Top-level code : runs when this file is first imported (before the importing file's own code)
console.log("[run-order-lib.ts] top-level code, import.meta.main =", import.meta.main);

export function Add(nA: number, nB: number): number {
	return nA + nB;
}

// Run by itself (node run-order-lib.ts) → import.meta.main is true
if (import.meta.main) {
	console.log("[run-order-lib.ts] run directly. It is meant to be imported by run-order.ts.");
}
