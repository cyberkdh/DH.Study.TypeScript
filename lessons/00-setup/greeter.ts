//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 00-setup / greeter
//	History			: 2026-10-14 CYBERKDH 최초 작성
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

export interface IPerson {
	strName: string;
	nAge: number;
}

export function Greet(oPerson: IPerson): string {
	const strMessage = `안녕하세요, ${oPerson.strName}님 (${oPerson.nAge}세)`;
	return strMessage; // ← 중단점(Breakpoint) 걸어 보기
}
