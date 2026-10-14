//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 01-basic-types / bigint
//	History			: 2026-10-14 CYBERKDH 최초 작성 (Initial)
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// 1) number 가 정확하게 표현하는 정수는 2^53 - 1 까지
//    number represents integers exactly only up to 2^53 - 1
console.log("MAX_SAFE_INTEGER =", Number.MAX_SAFE_INTEGER); // 9007199254740991
console.log("2^53 + 1 =", 2 ** 53 + 1); // 9007199254740992  ← 1 이 사라짐! / the 1 is lost!

// 2) bigint : 끝에 n 을 붙이면 크기 제한 없는 정수 (C# 의 BigInteger)
//    bigint : add n at the end for an integer of unlimited size (C# BigInteger)
const biMax64 = 0xffff_ffff_ffff_ffffn; // 64비트 최댓값 / 64-bit max (C# ulong.MaxValue)
console.log("64비트 최댓값 =", biMax64); // 18446744073709551615n
console.log("16진수 =", biMax64.toString(16)); // ffffffffffffffff
console.log("2^53 + 1 =", 2n ** 53n + 1n); // 9007199254740993n  ← 정확함 / exact

// 3) 나눗셈은 정수 나눗셈 (소수점 버림)
//    Division is integer division (fraction discarded)
console.log("7n / 2n =", 7n / 2n); // 3n

// 4) number 와 bigint 는 섞어 쓸 수 없다
//    number and bigint can't be mixed
//    아래 @ts-expect-error : TS 는 다음 줄이 오류임을 미리 안다 (지우면 빨간 줄)
//    The @ts-expect-error below : TS already knows the next line is an error (remove it to see the red squiggle)
// @ts-expect-error
const biWrong = 1n + 1;
console.log(biWrong); // 여기까지 오지 못함: 위에서 TypeError / Never reached: TypeError above

// 위 코드는 일부러 실패시키는 예제 → 아래처럼 한쪽으로 변환해서 섞는다
// The code above fails on purpose → convert one side, as below
// const biRight = 1n + BigInt(1);   // 2n
// const nRight = Number(1n) + 1;    // 2
