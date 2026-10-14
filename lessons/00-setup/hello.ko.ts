//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 00-setup / hello
//	History			: 2026-10-14 CYBERKDH Initial (최초 작성)
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

import { Greet, type IPerson } from "./greeter.ko.ts";

const arrPeople: IPerson[] = [
	{ strName: "Hong Gildong", nAge: 30 },
	{ strName: "TypeScript", nAge: 14 },
];

for (const oPerson of arrPeople) {
	console.log(Greet(oPerson)); // ← F11 로 Greet 안으로 들어가 보기
}

console.log(`Node.js ${process.version}`);
