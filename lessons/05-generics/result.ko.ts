//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 05-generics / result (TResult 결과 타입)
//	History			: 2026-10-15 CYBERKDH Initial (최초 작성)
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// 1) [TS] TResult<T, E> : 값을 가진 성공, 또는 에러를 가진 실패. E 의 기본값은 string
type TResult<T, E = string> = { bOk: true; vValue: T } | { bOk: false; vError: E };
const oSample: TResult<number> = { bOk: false, vError: "not ready" }; // E = string (기본값)
console.log("1) TResult sample =", oSample);

// 2) [JS + TS] 성공 / 실패 값을 만드는 작은 헬퍼 함수 (helper)
function Ok<T>(vValue: T): { bOk: true; vValue: T } {
	return { bOk: true, vValue };
}
function Err<E>(vError: E): { bOk: false; vError: E } {
	return { bOk: false, vError };
}
console.log("2) Ok =", Ok(255n), "/ Err =", Err("bad input"));

// 3) [JS + TS] throw 대신 TResult 를 반환하는 함수
function ParseHex(strText: string): TResult<bigint> {
	if (!/^0x[0-9a-f]+$/i.test(strText)) {
		return Err(`"${strText}" is not a hex number`);
	}
	return Ok(BigInt(strText));
}

for (const strText of ["0xFF", "0xZZ"]) {
	const oResult = ParseHex(strText);
	if (oResult.bOk) {
		console.log(`3) ${strText} → value ${oResult.vValue}`); // 좁혀짐 (narrowed) : vValue 가 있음
	} else {
		console.log(`3) ${strText} → error: ${oResult.vError}`); // 좁혀짐 (narrowed) : vError 가 있음
	}
	// console.log(oResult.vValue); // ← 주석을 풀면 빨간 줄 TS2339 (vValue 는 bOk 가 true 일 때만 있음)
}

// 4) [TS] E 에 직접 만든 에러 타입 : 문자열보다 많은 정보
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

// 5) [TS] MapResult : Ok 일 때만 값을 바꾸고, 에러는 그대로 둠
function MapResult<T, U, E>(oResult: TResult<T, E>, fnMap: (vValue: T) => U): TResult<U, E> {
	return oResult.bOk ? Ok(fnMap(oResult.vValue)) : oResult;
}
const oHexText = MapResult(ParseHex("0xff"), (biValue) => "0x" + biValue.toString(16).toUpperCase());
const oBadText = MapResult(ParseHex("hello"), (biValue) => "0x" + biValue.toString(16).toUpperCase());
console.log("5) MapResult =", oHexText, "/", oBadText);

// 6) [JS + TS] throw 와 TResult : C# 에도 둘 다 있음 (예외와 int.TryParse)
//    - throw   : 예외적인 문제. 호출하는 쪽이 catch 를 잊을 수 있고, 타입에 드러나지 않음
//    - TResult : 예상되는 문제 (사용자 입력). 타입이 호출하는 쪽에 bOk 검사를 강제함
const arrInput = ["0x10", "0x20", "0xG0"];
const arrResult = arrInput.map(ParseHex);
const arrError = arrResult.filter((oItem) => !oItem.bOk);
console.log(`6) ${arrInput.length} inputs, ${arrError.length} error(s) — nothing was thrown`);
