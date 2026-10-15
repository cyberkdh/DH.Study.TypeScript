//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: devcalc / core / Result (Generic success-or-failure value)
//	History			: 2026-10-15 CYBERKDH Initial - Lesson 05 DevCalc step
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// Success with a value, or failure with an error (discriminated union on bOk)
export type TResult<T, E = string> = { readonly bOk: true; readonly vValue: T } | { readonly bOk: false; readonly vError: E };

export function Ok<T>(vValue: T): { readonly bOk: true; readonly vValue: T } {
	return { bOk: true, vValue };
}

export function Err<E>(vError: E): { readonly bOk: false; readonly vError: E } {
	return { bOk: false, vError };
}

// Changes the value only when it is Ok; an error passes through unchanged
export function MapResult<T, U, E>(oResult: TResult<T, E>, fnMap: (vValue: T) => U): TResult<U, E> {
	return oResult.bOk ? Ok(fnMap(oResult.vValue)) : oResult;
}
