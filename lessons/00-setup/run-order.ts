//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 00-setup / run-order
//	History			: 2026-10-14 CYBERKDH Initial
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// There is no main(). node runs the top-level code of the file it is given, from top to bottom.

// 1) Imports are linked before any code runs → run-order-lib.ts prints first
import { Add } from "./run-order-lib.ts";

console.log("[run-order.ts] top-level code, import.meta.main =", import.meta.main);

// 2) Functions run only when called
function PrintSum(): void {
	console.log("[run-order.ts] PrintSum() called: 1 + 2 =", Add(1, 2));
}
PrintSum();

// 3) The whole file is parsed before it runs. A syntax error stops everything, even line 1.
//    new Function() parses a code string the same way, so the error can be caught here.
try {
	const strCode = 'console.log("line 1 runs?"); const biBad = 1.5n;';
	const fnCode = new Function(strCode);
	fnCode(); // Never reached
} catch (e) {
	console.log("Expected error:", (e as Error).name + ":", (e as Error).message);
	console.log('Why : 1.5n is a syntax error, so "line 1 runs?" is never printed. Parsing comes first.');
	console.log("Fix : bigint literals must be integers, e.g. 15n.");
}

console.log("[run-order.ts] last line");
