//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 00-setup / hello
//	History			: 2026-10-14 CYBERKDH Initial
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

import { Greet, type IPerson } from "./greeter.ts";

const arrPeople: IPerson[] = [
	{ strName: "Hong Gildong", nAge: 30 },
	{ strName: "TypeScript", nAge: 14 },
];

for (const oPerson of arrPeople) {
	console.log(Greet(oPerson)); // ← Press F11 to step into Greet
}

console.log(`Node.js ${process.version}`);
