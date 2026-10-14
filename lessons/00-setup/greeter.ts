//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 00-setup / greeter
//	History			: 2026-10-14 CYBERKDH Initial (최초 작성)
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

export interface IPerson {
	strName: string;
	nAge: number;
}

export function Greet(oPerson: IPerson): string {
	const strMessage = `Hello, ${oPerson.strName} (age ${oPerson.nAge})`;
	return strMessage; // ← Set a breakpoint here / 중단점 걸어 보기
}
