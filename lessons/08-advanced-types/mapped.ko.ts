//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 08-advanced-types / mapped (매핑된 타입)
//	History			: 2026-10-15 CYBERKDH Initial (최초 작성)
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// 매핑된 타입 (mapped types) : 타입의 키를 순회하며 키마다 새 프로퍼티를 만듦
interface ISettings {
	nBits: number;
	bGroup: boolean;
	strPrefix: string;
}

const DEFAULTS: ISettings = { nBits: 32, bGroup: true, strPrefix: "0x" };

// 1) [TS] { [K in keyof T]: ... } : 키마다 프로퍼티 하나. Partial<T> 도 이렇게 작성됨
type TMyPartial<T> = { [K in keyof T]?: T[K] };
const oSome: TMyPartial<ISettings> = { nBits: 8 };
console.log("1) TMyPartial :", JSON.stringify({ ...DEFAULTS, ...oSome }));

// 2) [TS] 수정자 (modifiers) : + 는 readonly 와 ? 를 더하고, - 는 뺌
type TFrozen<T> = { readonly [K in keyof T]: T[K] };
type TComplete<T> = { -readonly [K in keyof T]-?: T[K] };
const oFrozen: TFrozen<ISettings> = DEFAULTS;
// oFrozen.nBits = 8; // ← 주석을 풀면 빨간 줄 TS2540 (nBits 는 읽기 전용 프로퍼티라 대입할 수 없음)
const oComplete: TComplete<TMyPartial<ISettings>> = { ...DEFAULTS }; // ? 가 빠짐 : 모든 키가 다시 필요
console.log("2) modifiers :", oFrozen.nBits, Object.keys(oComplete).length);

// 3) [TS] 값 타입 바꾸기 : 설정마다 검사 함수 하나, 각각 알맞은 매개변수 타입
type TValidators<T> = { [K in keyof T]: (vValue: T[K]) => string | undefined };
const VALIDATORS: TValidators<ISettings> = {
	nBits: (nValue) => ([8, 16, 32, 64].includes(nValue) ? undefined : "use 8, 16, 32 or 64"), // nValue : number
	bGroup: () => undefined, // boolean 이면 무엇이든 괜찮음
	strPrefix: (strValue) => (strValue.length <= 2 ? undefined : "use at most 2 characters"), // strValue : string
};
// 하나를 빼면 → TS2741 (strPrefix 프로퍼티가 없음). ISettings 에 새 설정을 더해도 → 그 검사를 추가할 때까지 같은 에러

function Validate(oSettings: ISettings): string[] {
	const arrProblem: string[] = [];
	for (const strKey of Object.keys(VALIDATORS) as (keyof ISettings)[]) {
		const fnCheck = VALIDATORS[strKey] as (vValue: unknown) => string | undefined; // 키는 실행 시점에만 알 수 있음
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

// 4) [TS] as 로 키 이름 바꾸기 : "nBits" → "GetNBits". Capitalize 는 내장 문자열 타입 (literal.ko.ts)
type TGetters<T> = { [K in keyof T as `Get${Capitalize<K & string>}`]: () => T[K] };
function MakeGetters<T extends object>(oSource: T): TGetters<T> {
	const arrEntry = Object.entries(oSource).map(([strKey, vValue]) => [`Get${strKey[0]?.toUpperCase()}${strKey.slice(1)}`, () => vValue]);
	return Object.fromEntries(arrEntry) as TGetters<T>; // 실행 시점에 만든 이름은 TS 가 따라가지 못함 : 캐스트 한 번, 한 곳에서만
}
const oGetters = MakeGetters(DEFAULTS);
console.log("4) getters :", Object.keys(oGetters).join(", "), "/ GetNBits() =", oGetters.GetNBits());
// oGetters.GetBits(); // ← 주석을 풀면 빨간 줄 TS2551 (GetBits 프로퍼티가 없음 ... GetNBits 를 뜻했나요?)

// 5) [TS] as never 로 키 빼기 : 특정 타입의 프로퍼티만 남김
type TOnlyOfType<T, V> = { [K in keyof T as T[K] extends V ? K : never]: T[K] };
type TFlagSettings = TOnlyOfType<ISettings, boolean>; // { bGroup: boolean }
const oFlags: TFlagSettings = { bGroup: false };
// const oFlagsBad: TFlagSettings = { bGroup: false, nBits: 8 }; // ← 주석을 풀면 빨간 줄 TS2353 (객체 리터럴에는 알려진 프로퍼티만 쓸 수 있음)
console.log("5) only booleans :", JSON.stringify(oFlags));

// 6) [TS] 문자열 유니온을 순회 (keyof 가 아님) : 이름마다 프로퍼티 하나
type ERadix = "HEX" | "DEC" | "BIN";
type TRadixText = { [K in ERadix]: string }; // Record<ERadix, string> 과 같음
const oText: TRadixText = { HEX: (255).toString(16), DEC: (255).toString(10), BIN: (255).toString(2) };
console.log("6) union keys :", JSON.stringify(oText));
