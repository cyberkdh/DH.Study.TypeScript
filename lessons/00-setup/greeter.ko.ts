//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 00-setup / greeter
//	History			: 2026-10-14 CYBERKDH Initial (최초 작성)
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

import { basename, join, relative } from "node:path";

export interface IPerson {
	strName: string;
	nAge: number;
}

export function Greet(oPerson: IPerson): string {
	const strMessage = `Hello, ${oPerson.strName} (age ${oPerson.nAge})`;
	return strMessage; // ← 중단점 걸어 보기
}

// 이 파일만 단독 실행했을 때 출력이 어디 있는지 알려 준다.
if (import.meta.main) {
	// 현재 폴더 기준 hello.ko.ts (빌드 후에는 hello.ko.js)
	const strHello = relative(process.cwd(), join(import.meta.dirname, basename(import.meta.filename).replace("greeter", "hello")));
	console.log("greeter.ko.ts only defines Greet(); it is used by hello.ko.ts.");
	console.log(`Run: node ${strHello}`);
}

