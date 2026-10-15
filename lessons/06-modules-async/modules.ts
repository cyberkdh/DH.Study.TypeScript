//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 06-modules-async / modules
//	History			: 2026-10-15 CYBERKDH Initial
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// 1) [JS] Named imports : the names must match the exports. The path keeps its .ts extension
import { Add, ToHex, MAX_BITS } from "./math-lib.ts";

// 2) [JS] Rename with as : avoids a name clash
import { Add as AddBig } from "./math-lib.ts";

// 3) [JS] A namespace import : everything as one object
import * as MathLib from "./math-lib.ts";

// 4) [JS] The default import : no braces, and you choose the name
import DescribeRange from "./math-lib.ts";

// 5) [TS] Type-only imports : erased completely (verbatimModuleSyntax requires "type" here)
import type { IRange, ESign } from "./math-lib.ts";
// import { IRange } from "./math-lib.ts"; // ← Uncomment → red squiggle TS1484 (IRange is a type : use import type)

// 6) [JS] Node's built-in modules use the node: prefix
import { basename } from "node:path";

console.log("1) Add =", ToHex(Add(0xf0n, 0x0fn)), "/ MAX_BITS =", MAX_BITS);
console.log("2) AddBig =", AddBig(1n, 2n));
console.log("3) MathLib keys =", Object.keys(MathLib).sort().join(", "));

const eSign: ESign = "unsigned";
const oByte: IRange = MathLib.RangeOf(8, eSign);
console.log("4) default import =", DescribeRange(oByte));
console.log("5) types are gone at run time : MathLib has no IRange =", !("IRange" in MathLib));
console.log("6) this folder =", basename(import.meta.dirname));

// 7) [JS] A dynamic import : loads a module when the code reaches it, and returns a Promise
const oLib = await import("./math-lib.ts");
console.log("7) dynamic import : same module object =", oLib === MathLib, "/ ToHex(4095n) =", oLib.ToHex(4095n));

// 8) [JS] A missing file : a static import stops the whole file before line 1, a dynamic one rejects
//    (a path in a variable is not checked by TS : await import("./no-such-file.ts") would be TS2307)
const strMissing = "./no-such-file.ts";
try {
	await import(strMissing);
} catch (e) {
	console.log("8) Expected error:", (e as NodeJS.ErrnoException).code);
	console.log("   Why : the file does not exist, so the dynamic import's Promise rejected.");
	console.log("   Fix : check the path. With a literal path TS checks it for you (TS2307).");
}
