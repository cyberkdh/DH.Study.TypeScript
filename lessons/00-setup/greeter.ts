//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 00-setup / greeter
//	History			: 2026-10-14 CYBERKDH Initial
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

import { basename, join, relative } from "node:path";

export interface IPerson {
	strName: string;
	nAge: number;
}

export function Greet(oPerson: IPerson): string {
	const strMessage = `Hello, ${oPerson.strName} (age ${oPerson.nAge})`;
	return strMessage; // ← Set a breakpoint here
}

// When this file is run by itself, explain where the output is.
if (import.meta.main) {
	// hello.ts (hello.js after build), relative to the current folder
	const strHello = relative(process.cwd(), join(import.meta.dirname, basename(import.meta.filename).replace("greeter", "hello")));
	console.log("greeter.ts only defines Greet(); it is used by hello.ts.");
	console.log(`Run: node ${strHello}`);
}

