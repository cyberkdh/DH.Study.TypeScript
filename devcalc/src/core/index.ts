//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: devcalc / core / index (Public entry point of the core)
//	History			: 2026-10-15 CYBERKDH Initial - Lesson 06 DevCalc step
//					  2026-10-15 CYBERKDH Lesson 08: OperatorName
//					  2026-10-15 CYBERKDH Lesson 10: Lex, Parse, ToText, OperatorPrecedence
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// A barrel file : one import path for everything the core offers.
// The core has no node: imports, so the same files run in Node and in the browser (lesson 07).
export { ToBin, ToDec, ToHex, GroupDigits, type IFormatOptions, type TFormatter } from "./Format.ts";
export { ParseInteger, type TParseResult } from "./Parse.ts";
export { CWordSize, IsWordBits, type TWordBits } from "./WordSize.ts";
export { CCalculator, CCalcError, IsOperator, OperatorList, OperatorName, OperatorPrecedence, type ICalcResult, type TOperator } from "./Calculator.ts";
export { Ok, Err, MapResult, type TResult } from "./Result.ts";
export { CHistory } from "./History.ts";
export { Lex, type TToken } from "./Lexer.ts";
export { Parse, ToText, type TNode } from "./Parser.ts";
export { Evaluate, type IEvaluation, type IEvalError, type TEvalResult } from "./Evaluate.ts";
