//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 05-generics / result
//	History			: 2026-10-15 CYBERKDH Initial
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// 1) [TS] TResult<T, E> : success with a value, or failure with an error. E defaults to string
type TResult<T, E = string> = { bOk: true; vValue: T } | { bOk: false; vError: E };
const oSample: TResult<number> = { bOk: false, vError: "not ready" }; // E = string (default)
console.log("1) TResult sample =", oSample);

// 2) [JS + TS] Small helpers that build each side
function Ok<T>(vValue: T): { bOk: true; vValue: T } {
	return { bOk: true, vValue };
}
function Err<E>(vError: E): { bOk: false; vError: E } {
	return { bOk: false, vError };
}
console.log("2) Ok =", Ok(255n), "/ Err =", Err("bad input"));

// 3) [JS + TS] A function that returns TResult instead of throwing
function ParseHex(strText: string): TResult<bigint> {
	if (!/^0x[0-9a-f]+$/i.test(strText)) {
		return Err(`"${strText}" is not a hex number`);
	}
	return Ok(BigInt(strText));
}

for (const strText of ["0xFF", "0xZZ"]) {
	const oResult = ParseHex(strText);
	if (oResult.bOk) {
		console.log(`3) ${strText} → value ${oResult.vValue}`); // narrowed : vValue exists
	} else {
		console.log(`3) ${strText} → error: ${oResult.vError}`); // narrowed : vError exists
	}
	// console.log(oResult.vValue); // ← Uncomment → red squiggle TS2339 (vValue only exists when bOk is true)
}

// 4) [TS] A custom error type for E : more than a string
interface IParseError {
	readonly strInput: string;
	readonly nPosition: number;
}
function ParseBin(strText: string): TResult<bigint, IParseError> {
	const nBad = [...strText].findIndex((strChar) => strChar !== "0" && strChar !== "1");
	if (strText === "" || nBad >= 0) {
		return Err({ strInput: strText, nPosition: nBad });
	}
	return Ok(BigInt("0b" + strText));
}
const oBin = ParseBin("10201");
console.log("4) ParseBin =", oBin.bOk ? oBin.vValue : `bad char at ${oBin.vError.nPosition} in "${oBin.vError.strInput}"`);

// 5) [TS] MapResult : change the value only when it is Ok, keep the error as it is
function MapResult<T, U, E>(oResult: TResult<T, E>, fnMap: (vValue: T) => U): TResult<U, E> {
	return oResult.bOk ? Ok(fnMap(oResult.vValue)) : oResult;
}
const oHexText = MapResult(ParseHex("0xff"), (biValue) => "0x" + biValue.toString(16).toUpperCase());
const oBadText = MapResult(ParseHex("hello"), (biValue) => "0x" + biValue.toString(16).toUpperCase());
console.log("5) MapResult =", oHexText, "/", oBadText);

// 6) [JS + TS] throw vs TResult : C# has both too (exceptions and int.TryParse)
//    - throw   : rare problems, the caller may forget to catch, the type does not show it
//    - TResult : expected problems (user input), the type forces the caller to check bOk
const arrInput = ["0x10", "0x20", "0xG0"];
const arrResult = arrInput.map(ParseHex);
const arrError = arrResult.filter((oItem) => !oItem.bOk);
console.log(`6) ${arrInput.length} inputs, ${arrError.length} error(s) — nothing was thrown`);
