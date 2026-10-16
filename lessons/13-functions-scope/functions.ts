//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 13-functions-scope / functions
//	History			: 2026-10-15 CYBERKDH Initial
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// Functions beyond lesson 02 : overloads, arity (.length), fewer parameters are fine, void callbacks, a table of typed functions

// 1) [TS] Overloads : several call shapes, one body. Callers see only the shapes, not the body's signature
function Describe(): string;
function Describe(strName: string): string | undefined;
function Describe(strName?: string): string | undefined {
	const HELP: Record<string, string> = { rol: "rotate left", ror: "rotate right" };
	if (strName === undefined) {
		return Object.keys(HELP).join(" ");
	}
	return Object.hasOwn(HELP, strName) ? HELP[strName] : undefined;
}
const strAll: string = Describe(); // the first overload : always a string
const strOne = Describe("rol"); // the second : string | undefined
console.log(`1) Describe() = "${strAll}" · Describe("rol") = "${strOne}" · Describe("xyz") = ${Describe("xyz")}`);
// Describe(1, 2); // ← Uncomment → TS2554 (Expected 0-1 arguments, but got 2)
// Describe(42); // ← Uncomment → TS2345 (Argument of type 'number' is not assignable to parameter of type 'string')

// 2) [JS] .length counts the parameters before the first default or rest parameter
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
// Rol(1n); // ← Uncomment → TS2554 (Expected 2 arguments, but got 1)

// 3) [TS] A function with fewer parameters fits a type that passes more : the extra arguments are ignored
type TVisit = (biValue: bigint, nIndex: number, arrAll: readonly bigint[]) => void;
const fnPrint: TVisit = (biValue) => console.log(`3) visit ${biValue}`); // uses only the first one
[1n, 2n].forEach(fnPrint);
// const fnTooMany: (biValue: bigint) => void = (biValue: bigint, nWidth: number) => {}; // ← Uncomment → TS2322 (Type '(biValue: bigint, nWidth: number) => void' is not assignable to type '(biValue: bigint) => void')

// 4) [TS] A void callback may return something : the caller promises to ignore it
const arrSeen: bigint[] = [];
[3n, 4n].forEach((biValue) => arrSeen.push(biValue)); // push returns the new length, and that is fine
console.log(`4) seen = ${arrSeen.join(", ")}`);

// 5) [TS] A table of functions with different arity : a discriminated union types each row's parameters
interface IUnary {
	readonly nArgs: 1;
	readonly fnApply: (biX: bigint) => bigint;
}
interface IBinary {
	readonly nArgs: 2;
	readonly fnApply: (biX: bigint, biN: bigint) => bigint;
}
const TABLE = {
	neg: { nArgs: 1, fnApply: (biX) => -biX }, // biX : bigint, from IUnary
	shl: { nArgs: 2, fnApply: (biX, biN) => biX << biN }, // biX, biN : bigint, from IBinary
} satisfies Record<string, IUnary | IBinary>;
function Call(strName: keyof typeof TABLE, arrArg: readonly bigint[]): bigint {
	const oSpec: IUnary | IBinary = TABLE[strName];
	if (arrArg.length !== oSpec.nArgs) {
		throw new Error(`${strName} takes ${oSpec.nArgs} argument(s), found ${arrArg.length}`);
	}
	const [biX = 0n, biN = 0n] = arrArg; // the count was checked above
	return oSpec.nArgs === 1 ? oSpec.fnApply(biX) : oSpec.fnApply(biX, biN); // narrowed by nArgs
}
console.log(`5) neg(5) = ${Call("neg", [5n])} · shl(1, 4) = ${Call("shl", [1n, 4n])}`);

// 6) An argument list from user input can be too short. Spread does not check the count
const fnShl = TABLE.shl.fnApply as (...arrArg: bigint[]) => bigint; // as : "trust me", and the count is lost
try {
	console.log(fnShl(...[1n]));
} catch (e) {
	console.log(`6) Expected error: ${String(e)}`);
	console.log("   Why : shl(1) was called with one argument, so biN is undefined, and 1n << undefined mixes a bigint with undefined.");
	console.log("   Fix : check the count first, the way Call() does above (DevCalc : CheckArgCount).");
}
