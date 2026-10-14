//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 01-basic-types / primitives
//	History			: 2026-10-14 CYBERKDH Initial (최초 작성)
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// 1) Type annotation : ": type" after the variable name
//    타입 표기 (Type Annotation) : 변수 이름 뒤에 ": 타입"
const strName: string = "DevCalc";
const nBits: number = 64;
const bSigned: boolean = true;

// 2) Type inference : TS works out the type from the value → usually leave the annotation out
//    타입 추론 (Type Inference) : 값을 보고 TS 가 타입을 정함 → 대부분 표기 생략
const strVersion = "0.1.0"; // inferred as string (hover to check) / string 으로 추론 (마우스를 올려 확인)
let nCount = 0; // number
nCount += 1;
// nCount = "1";            // ← Uncomment → red squiggle (string is not number) / 주석을 풀면 빨간 줄 (string 은 number 에 못 넣음)

// 3) number is just C#'s double (no separate int, long or float)
//    number 는 C# 의 double 하나뿐 (int, long, float 구분 없음)
console.log("0.1 + 0.2 =", 0.1 + 0.2); // 0.30000000000000004
console.log("7 / 2 =", 7 / 2); // 3.5  (unlike C# int division / C# 의 int 나눗셈과 다름)
console.log("Math.trunc(7 / 2) =", Math.trunc(7 / 2)); // 3

// 4) Radix literals and toString(radix)
//    진법 리터럴과 toString(진법)
const nMask = 0xff;
console.log("0xff =", nMask, "/ hex:", nMask.toString(16), "/ bin:", nMask.toString(2));

// 5) Arrays and tuples
//    배열 (Array) 과 튜플 (Tuple)
const arrBits: number[] = [8, 16, 32, 64];
const arrPair: [string, number] = ["WORD", 16]; // Fixed length and per-slot types / 길이와 자리별 타입 고정
console.log(arrBits, arrPair);

// Because of noUncheckedIndexedAccess, arrBits[0] has type number | undefined
// noUncheckedIndexedAccess 옵션 때문에 arrBits[0] 의 타입은 number | undefined
const nFirst = arrBits[0];
if (nFirst !== undefined) {
	console.log("first bits x 2:", nFirst * 2);
}

console.log(strName, strVersion, nBits, bSigned, nCount);
