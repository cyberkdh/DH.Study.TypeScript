//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 08-advanced-types / mapped
//	History			: 2026-10-15 CYBERKDH Initial
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// Mapped types : go through the keys of a type and make a new property for each one
interface ISettings {
	nBits: number;
	bGroup: boolean;
	strPrefix: string;
}

const DEFAULTS: ISettings = { nBits: 32, bGroup: true, strPrefix: "0x" };

// 1) [TS] { [K in keyof T]: ... } : one property per key. This is how Partial<T> is written
type TMyPartial<T> = { [K in keyof T]?: T[K] };
const oSome: TMyPartial<ISettings> = { nBits: 8 };
console.log("1) TMyPartial :", JSON.stringify({ ...DEFAULTS, ...oSome }));

// 2) [TS] Modifiers : + adds, - removes readonly and ?
type TFrozen<T> = { readonly [K in keyof T]: T[K] };
type TComplete<T> = { -readonly [K in keyof T]-?: T[K] };
const oFrozen: TFrozen<ISettings> = DEFAULTS;
// oFrozen.nBits = 8; // ← Uncomment → red squiggle TS2540 (Cannot assign to 'nBits' because it is a read-only property)
const oComplete: TComplete<TMyPartial<ISettings>> = { ...DEFAULTS }; // ? removed : every key is needed again
console.log("2) modifiers :", oFrozen.nBits, Object.keys(oComplete).length);

// 3) [TS] Change the value type : one check function per setting, each with the right parameter type
type TValidators<T> = { [K in keyof T]: (vValue: T[K]) => string | undefined };
const VALIDATORS: TValidators<ISettings> = {
	nBits: (nValue) => ([8, 16, 32, 64].includes(nValue) ? undefined : "use 8, 16, 32 or 64"), // nValue : number
	bGroup: () => undefined, // any boolean is fine
	strPrefix: (strValue) => (strValue.length <= 2 ? undefined : "use at most 2 characters"), // strValue : string
};
// Leave one out → TS2741 (Property 'strPrefix' is missing). Add a new setting to ISettings → the same error, until you add its check

function Validate(oSettings: ISettings): string[] {
	const arrProblem: string[] = [];
	for (const strKey of Object.keys(VALIDATORS) as (keyof ISettings)[]) {
		const fnCheck = VALIDATORS[strKey] as (vValue: unknown) => string | undefined; // the key is only known at run time
		const strProblem = fnCheck(oSettings[strKey]);
		if (strProblem !== undefined) {
			arrProblem.push(`${strKey} : ${strProblem}`);
		}
	}
	return arrProblem;
}
console.log("3) DEFAULTS problems =", Validate(DEFAULTS).length);
for (const strProblem of Validate({ nBits: 12, bGroup: false, strPrefix: "hex:" })) {
	console.log("   Expected error:", strProblem);
}
console.log("   Why : each check got its own value type from TValidators<ISettings>, so the rules are typed.");
console.log("   Fix : use one of the allowed values (nBits 8/16/32/64, strPrefix with 2 characters or less)");

// 4) [TS] Rename keys with as : "nBits" → "GetNBits". Capitalize is a built-in string type (literal.ts)
type TGetters<T> = { [K in keyof T as `Get${Capitalize<K & string>}`]: () => T[K] };
function MakeGetters<T extends object>(oSource: T): TGetters<T> {
	const arrEntry = Object.entries(oSource).map(([strKey, vValue]) => [`Get${strKey[0]?.toUpperCase()}${strKey.slice(1)}`, () => vValue]);
	return Object.fromEntries(arrEntry) as TGetters<T>; // TS can't follow names built at run time : one cast, in one place
}
const oGetters = MakeGetters(DEFAULTS);
console.log("4) getters :", Object.keys(oGetters).join(", "), "/ GetNBits() =", oGetters.GetNBits());
// oGetters.GetBits(); // ← Uncomment → red squiggle TS2551 (Property 'GetBits' does not exist ... Did you mean 'GetNBits'?)

// 5) [TS] Drop keys with as never : keep only the properties of one type
type TOnlyOfType<T, V> = { [K in keyof T as T[K] extends V ? K : never]: T[K] };
type TFlagSettings = TOnlyOfType<ISettings, boolean>; // { bGroup: boolean }
const oFlags: TFlagSettings = { bGroup: false };
// const oFlagsBad: TFlagSettings = { bGroup: false, nBits: 8 }; // ← Uncomment → red squiggle TS2353 (Object literal may only specify known properties)
console.log("5) only booleans :", JSON.stringify(oFlags));

// 6) [TS] Over a union of strings (not keyof) : one property per name
type ERadix = "HEX" | "DEC" | "BIN";
type TRadixText = { [K in ERadix]: string }; // the same as Record<ERadix, string>
const oText: TRadixText = { HEX: (255).toString(16), DEC: (255).toString(10), BIN: (255).toString(2) };
console.log("6) union keys :", JSON.stringify(oText));
