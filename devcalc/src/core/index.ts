//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: devcalc / core / index (Public entry point of the core)
//	History			: 2026-10-15 CYBERKDH Initial - Lesson 06 DevCalc step
//					  2026-10-15 CYBERKDH Lesson 08: OperatorName
//					  2026-10-15 CYBERKDH Lesson 10: Lex, Parse, ToText, OperatorPrecedence
//					  2026-10-15 CYBERKDH Lesson 11: Literal.ts (ParseLiteral, ParseChar), unary operators, OperatorAssoc, OperatorHelp, SplitExpressions
//					  2026-10-15 CYBERKDH Lesson 12: ToOct, ToChar, Output.ts (OutputRows, OutputHelp), WORD_BITS
//					  2026-10-15 CYBERKDH Lesson 13: Functions.ts (CallFunction, FunctionHelp, IsFunction, TFunction)
//					  2026-10-16 CYBERKDH Lesson 16: EvaluateTree, TStepListener, Steps.ts (Explain, IStep, IExplanation)
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// A barrel file : one import path for everything the core offers.
// The core has no node: imports, so the same files run in Node and in the browser (lesson 07).
export { ToBin, ToDec, ToHex, ToOct, ToChar, GroupDigits, type IFormatOptions, type TFormatter } from "./Format.ts";
export { ParseInteger, type TParseResult } from "./Parse.ts";
export { ParseLiteral, ParseChar, type EUnit } from "./Literal.ts";
export { CWordSize, IsWordBits, WORD_BITS, type TWordBits } from "./WordSize.ts";
export { OutputRows, OutputHelp, ROW_ORDER, type ERow, type IOutputRow } from "./Output.ts";
export {
	CCalculator,
	CCalcError,
	IsOperator,
	IsUnaryOperator,
	OperatorList,
	OperatorHelp,
	OperatorName,
	OperatorPrecedence,
	OperatorAssoc,
	type ICalcResult,
	type TOperator,
	type TUnaryOperator,
} from "./Calculator.ts";
export { Ok, Err, MapResult, type TResult } from "./Result.ts";
export { CHistory } from "./History.ts";
export { Lex, SplitExpressions, type TToken } from "./Lexer.ts";
export { CallFunction, CheckArgCount, FunctionHelp, FunctionUsage, IsFunction, type TFunction } from "./Functions.ts";
export { Parse, ToText, type TNode } from "./Parser.ts";
export { Evaluate, EvaluateTree, type IEvaluation, type IEvalError, type TEvalResult, type TStepListener } from "./Evaluate.ts";
export { Explain, type IExplanation, type IStep } from "./Steps.ts";
