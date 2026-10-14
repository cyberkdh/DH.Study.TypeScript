//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 01-basic-types / primitives
//	History			: 2026-10-14 CYBERKDH 최초 작성
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// 1) 타입 표기(Type Annotation) : 변수 이름 뒤에 ": 타입"
const strName: string = "DevCalc";
const nBits: number = 64;
const bSigned: boolean = true;

// 2) 타입 추론(Type Inference) : 값을 보고 TS 가 타입을 정함 → 대부분 표기 생략
const strVersion = "0.1.0"; // string 으로 추론 (마우스를 올려 확인해 보기)
let nCount = 0; // number
nCount += 1;
// nCount = "1";            // ← 주석을 풀면 빨간 줄: string 은 number 에 넣을 수 없음

// 3) number 는 C# 의 double 하나뿐 (int, long, float 구분 없음)
console.log("0.1 + 0.2 =", 0.1 + 0.2); // 0.30000000000000004
console.log("7 / 2 =", 7 / 2); // 3.5  (C# 의 int 나눗셈과 다름)
console.log("Math.trunc(7 / 2) =", Math.trunc(7 / 2)); // 3

// 4) 진법 리터럴(Literal) 과 toString(진법)
const nMask = 0xff;
console.log("0xff =", nMask, "/ 16진수:", nMask.toString(16), "/ 2진수:", nMask.toString(2));

// 5) 배열(Array) 과 튜플(Tuple)
const arrBits: number[] = [8, 16, 32, 64];
const arrPair: [string, number] = ["WORD", 16]; // 길이와 각 자리 타입이 고정
console.log(arrBits, arrPair);

// noUncheckedIndexedAccess 옵션 때문에 arrBits[0] 의 타입은 number | undefined
const nFirst = arrBits[0];
if (nFirst !== undefined) {
	console.log("첫 번째 비트 수:", nFirst * 2);
}

console.log(strName, strVersion, nBits, bSigned, nCount);
