//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 13-functions-scope / functions (함수)
//	History			: 2026-10-15 CYBERKDH Initial (최초 작성)
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// 02강 다음 단계의 함수 : 오버로드 (overload), 인자 개수 (arity, .length), 매개변수가 적어도 되는 경우, void 콜백, 타입 있는 함수 표

// 1) [TS] 오버로드 : 호출 모양은 여러 개, 본문은 하나. 호출하는 쪽에는 본문 시그니처 (signature) 가 아니라 모양들만 보임
function Describe(): string;
function Describe(strName: string): string | undefined;
function Describe(strName?: string): string | undefined {
	const HELP: Record<string, string> = { rol: "rotate left", ror: "rotate right" };
	if (strName === undefined) {
		return Object.keys(HELP).join(" ");
	}
	return Object.hasOwn(HELP, strName) ? HELP[strName] : undefined;
}
const strAll: string = Describe(); // 첫 번째 오버로드 : 항상 string
const strOne = Describe("rol"); // 두 번째 : string | undefined
console.log(`1) Describe() = "${strAll}" · Describe("rol") = "${strOne}" · Describe("xyz") = ${Describe("xyz")}`);
// Describe(1, 2); // ← 주석 해제 → TS2554 (Expected 0-1 arguments, but got 2)
// Describe(42); // ← 주석 해제 → TS2345 (Argument of type 'number' is not assignable to parameter of type 'string')

// 2) [JS] .length 는 첫 기본값 (default) 매개변수나 나머지 (rest) 매개변수 앞까지만 셈
function Rol(biX: bigint, biN: bigint): bigint {
	return biX << biN;
}
function Align(biX: bigint, biN = 16n): bigint {
	return ((biX + biN - 1n) / biN) * biN;
}
function Min(...arrValue: bigint[]): bigint {
	return arrValue.reduce((biMin, biValue) => (biValue < biMin ? biValue : biMin));
}
console.log(`2) Rol.length = ${Rol.length} · Align.length = ${Align.length} · Min.length = ${Min.length}`);
// Rol(1n); // ← 주석 해제 → TS2554 (Expected 2 arguments, but got 1)

// 3) [TS] 매개변수가 더 적은 함수는 인자를 더 넘기는 타입에 들어감 : 남는 인자는 무시됨
type TVisit = (biValue: bigint, nIndex: number, arrAll: readonly bigint[]) => void;
const fnPrint: TVisit = (biValue) => console.log(`3) visit ${biValue}`); // 첫 번째만 사용
[1n, 2n].forEach(fnPrint);
// const fnTooMany: (biValue: bigint) => void = (biValue: bigint, nWidth: number) => {}; // ← 주석 해제 → TS2322 (Type '(biValue: bigint, nWidth: number) => void' is not assignable to type '(biValue: bigint) => void')

// 4) [TS] void 콜백 (callback) 은 무언가를 반환해도 됨 : 호출하는 쪽이 그 값을 무시하겠다는 약속
const arrSeen: bigint[] = [];
[3n, 4n].forEach((biValue) => arrSeen.push(biValue)); // push 는 새 길이를 반환하지만 문제없음
console.log(`4) seen = ${arrSeen.join(", ")}`);

// 5) [TS] 인자 개수가 다른 함수들의 표 : 구별된 유니온 (discriminated union) 이 행마다 매개변수 타입을 정해 줌
interface IUnary {
	readonly nArgs: 1;
	readonly fnApply: (biX: bigint) => bigint;
}
interface IBinary {
	readonly nArgs: 2;
	readonly fnApply: (biX: bigint, biN: bigint) => bigint;
}
const TABLE = {
	neg: { nArgs: 1, fnApply: (biX) => -biX }, // biX : bigint, IUnary 에서 옴
	shl: { nArgs: 2, fnApply: (biX, biN) => biX << biN }, // biX, biN : bigint, IBinary 에서 옴
} satisfies Record<string, IUnary | IBinary>;
function Call(strName: keyof typeof TABLE, arrArg: readonly bigint[]): bigint {
	const oSpec: IUnary | IBinary = TABLE[strName];
	if (arrArg.length !== oSpec.nArgs) {
		throw new Error(`${strName} takes ${oSpec.nArgs} argument(s), found ${arrArg.length}`);
	}
	const [biX = 0n, biN = 0n] = arrArg; // 개수는 위에서 확인함
	return oSpec.nArgs === 1 ? oSpec.fnApply(biX) : oSpec.fnApply(biX, biN); // nArgs 로 좁혀짐 (narrowing)
}
console.log(`5) neg(5) = ${Call("neg", [5n])} · shl(1, 4) = ${Call("shl", [1n, 4n])}`);

// 6) 사용자 입력에서 온 인자 목록은 짧을 수 있음. 펼치기 (spread) 는 개수를 검사하지 않음
const fnShl = TABLE.shl.fnApply as (...arrArg: bigint[]) => bigint; // as : "믿어 줘", 그리고 개수 정보가 사라짐
try {
	console.log(fnShl(...[1n]));
} catch (e) {
	console.log(`6) Expected error: ${String(e)}`);
	console.log("   Why : shl(1) was called with one argument, so biN is undefined, and 1n << undefined mixes a bigint with undefined.");
	console.log("   Fix : check the count first, the way Call() does above (DevCalc : CheckArgCount).");
}
