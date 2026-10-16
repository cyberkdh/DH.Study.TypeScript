//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: devcalc / main (Command-line entry point)
//	History			: 2026-10-14 CYBERKDH Initial - Lesson 01 DevCalc step, Lv1
//					  2026-10-14 CYBERKDH Lesson 02: output options, function table
//					  2026-10-15 CYBERKDH Lesson 03: own input parser (sign, 0x/0o/0b, _ separators), Lv2
//					  2026-10-15 CYBERKDH Lesson 04: word size (--bits), two-number calculation, CCalcError, Lv3
//					  2026-10-15 CYBERKDH Lesson 05: Evaluate() + TResult, CHistory, "a; b" and ans
//					  2026-10-15 CYBERKDH Lesson 06: core/index.ts barrel, --copy (cli/Clipboard.ts), --repl (cli/Repl.ts), async Main
//					  2026-10-15 CYBERKDH Lesson 08: typed switches (TSwitch, TBitsFlag template literal type, HasSwitch)
//					  2026-10-15 CYBERKDH Lesson 10: whole expressions (Lv5), overflow note shows the value that did not fit
//					  2026-10-15 CYBERKDH Lesson 11: usage and help show the new input (~ ** >>> 1Fh 1'000 4K 'A'), SplitExpressions, Lv6
//					  2026-10-15 CYBERKDH Lesson 12: rows from OutputRows(), --all adds OCT and CHAR, --bits=128, Lv7
//					  2026-10-15 CYBERKDH Lesson 13: functions and variables (mapVar), REPL "help <function>" and "vars", Lv8
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// Usage : node devcalc/src/main.ts 0xFF [--bits=8] [--no-group] [--lower] [--no-prefix] [--copy] [--all]
//         node devcalc/src/main.ts "'Hi' << 8" --all                (OCT and CHAR rows too)
//         node devcalc/src/main.ts "popcount(0xF0F0)"               (functions : abs min max bit popcount ...)
//         node devcalc/src/main.ts "mask = 0xFF00; 0x1234 & mask"   (variables live until the program ends)
//         node devcalc/src/main.ts "(0xFF + 1) << 4" [--bits=8] ...
//         node devcalc/src/main.ts "~0 >>> 4" --bits=32           (quote it : the shell reads ** and > itself)
//         node devcalc/src/main.ts "0xFF + 1; ans * 2" [--bits=8] ...
//         node devcalc/src/main.ts --repl [--bits=8] ...
import { ToHex, CWordSize, IsWordBits, Evaluate, CHistory, FunctionHelp, OperatorHelp, OutputHelp, OutputRows, SplitExpressions, WORD_BITS, type IFormatOptions, type IEvaluation, type TWordBits } from "./core/index.ts";
import { CopyToClipboard } from "./cli/Clipboard.ts";
import { RunRepl } from "./cli/Repl.ts";

// Split arguments into the expression and the --options
const arrArg = process.argv.slice(2);
const arrFlag = arrArg.filter((strArg) => strArg.startsWith("--"));
let strExpr = arrArg
	.filter((strArg) => !strArg.startsWith("--"))
	.join(" ")
	.trim();

// Lesson 08: the switches are one list; TSwitch is made from it, and --bits=N is a template literal type
const SWITCHES = ["--no-group", "--lower", "--no-prefix", "--copy", "--repl", "--all"] as const;
type TSwitch = (typeof SWITCHES)[number];
type TBitsFlag = `--bits=${TWordBits}`; // "--bits=8" | "--bits=16" | ... | "--bits=128"

function IsSwitch(strFlag: string): strFlag is TSwitch {
	return (SWITCHES as readonly string[]).includes(strFlag);
}

function IsBitsFlag(strFlag: string): strFlag is TBitsFlag {
	return strFlag.startsWith("--bits=") && IsWordBits(Number(strFlag.slice("--bits=".length)));
}

// Only a TSwitch can be asked for : HasSwitch("--no-grop") is a compile error (TS2345)
function HasSwitch(eSwitch: TSwitch): boolean {
	return arrFlag.includes(eSwitch);
}

const strBitsFlag = `--bits=${WORD_BITS.join("|")}`; // lesson 12 : made from the list, so 128 appears by itself
const arrKnownFlag = [...SWITCHES, strBitsFlag];
let oWord: CWordSize | undefined; // undefined = no word size (unlimited)
for (const strFlag of arrFlag) {
	if (IsBitsFlag(strFlag)) {
		oWord = new CWordSize(Number(strFlag.slice("--bits=".length)) as TWordBits); // IsBitsFlag checked the number
		continue;
	}
	if (IsSwitch(strFlag)) {
		continue;
	}
	console.log(`Unknown option: "${strFlag}" (ignored)`);
	console.log(`Why : only ${arrKnownFlag.join(", ")} are supported.`);
}
const bRepl = HasSwitch("--repl");
const bCopy = HasSwitch("--copy");

if (strExpr === "" && !bRepl) {
	console.log(`Usage: node devcalc/src/main.ts <integer> | "<expression>" | "<expr>; <expr>" | --repl [${strBitsFlag}] [--no-group] [--lower] [--no-prefix] [--copy] [--all]`);
	console.log("(no input given, so running the example 255)");
	strExpr = "255";
}

// Lesson 02: the command line groups digits by default; the flags turn things off
const oOptions: IFormatOptions = {
	bGroup: !HasSwitch("--no-group"),
	bUpperCase: !HasSwitch("--lower"),
	bPrefix: !HasSwitch("--no-prefix"),
	nBits: oWord?.nBits,
};

// Lesson 12: the rows come from one table (core/Output.ts), shared with the web page
const bAll = HasSwitch("--all");

function PrintEvaluation(oEval: IEvaluation): void {
	for (const { eRow, strText } of OutputRows(oEval.biValue, oOptions, oWord, bAll)) {
		const strNote = eRow === "INT" && oWord !== undefined ? ` (${oWord.nBits}-bit signed)` : "";
		console.log(`${eRow.padEnd(bAll ? 4 : 3)} : ${strText}${strNote}`);
	}
	if (oWord !== undefined && oEval.bOverflow) {
		console.log(`Note: ${oEval.biExact} does not fit in ${oWord.nBits} bits (${oWord.strName}), so it wrapped to ${oWord.ToUnsigned(oEval.biExact)}.`);
	}
	if (bAll && oWord === undefined && oEval.biValue < 0n) {
		console.log("Note: a negative number has no bytes for CHAR until a word size is chosen (--bits=8|16|...).");
	}
}

// Lesson 05: Evaluate() returns TResult (no printing inside), CHistory<T> keeps the results for "ans".
// "a; b; c" runs in order and stops at the first error. Returns the exit code.
const oHistory = new CHistory<IEvaluation>(20);

// Lesson 13: the variables. Evaluate only reads them; "x = …" comes back as strAssign and is kept here.
// A Map, not an object : any name is safe as a key (toString, __proto__), and keys keep their order
const mapVar = new Map<string, bigint>();

function Calculate(strInput: string): number {
	const arrExpr = SplitExpressions(strInput); // lesson 11 : ';' is not a separator
	for (const [nIndex, strOne] of arrExpr.entries()) {
		if (arrExpr.length > 1) {
			console.log(`${nIndex > 0 ? "\n" : ""}[${nIndex + 1}] ${strOne}`);
		}
		const oResult = Evaluate(strOne, oWord, oHistory.Latest()?.biValue, mapVar);
		if (!oResult.bOk) {
			const { strTitle, strWhy, strFix } = oResult.vError;
			console.log(strTitle);
			console.log(`Why : ${strWhy}`);
			console.log(`Fix : ${strFix}`);
			return 1;
		}
		const { strAssign, biValue } = oResult.vValue;
		if (strAssign !== undefined) {
			mapVar.set(strAssign, biValue);
		}
		oHistory.Add(oResult.vValue);
		PrintEvaluation(oResult.vValue);
	}
	return 0;
}

// Lesson 06: copy the latest result's HEX. A missing clipboard is a note, not a failure
async function CopyLatest(): Promise<void> {
	const oLatest = oHistory.Latest();
	if (oLatest === undefined) {
		console.log("Nothing to copy yet: calculate something first.");
		return;
	}
	const strHex = ToHex(oLatest.biValue, oOptions);
	try {
		await CopyToClipboard(strHex);
		console.log(`Copied: ${strHex}`);
	} catch (e) {
		console.log(`Could not copy: ${(e as Error).message}`);
		console.log("Why : this OS has no clipboard program, or there is no desktop (SSH, container).");
	}
}

function PrintHistory(): void {
	if (oHistory.nCount === 0) {
		console.log("(history is empty)");
		return;
	}
	let nNumber = 1;
	for (const oEval of oHistory) {
		console.log(`${String(nNumber).padStart(2)}) ${oEval.strExpr} = ${ToHex(oEval.biValue, oOptions)}`);
		nNumber++;
	}
}

// Lesson 13: the variables in the order they were first set (a Map keeps that order)
function PrintVariables(): void {
	if (mapVar.size === 0) {
		console.log('(no variables yet : "mask = 0xFF00")');
		return;
	}
	for (const [strName, biValue] of mapVar) {
		console.log(`${strName} = ${ToHex(biValue, oOptions)}`);
	}
}

// Lesson 13: "help rol" → one function's usage (FunctionHelp's second overload)
function PrintFunctionHelp(strName: string): void {
	console.log(FunctionHelp(strName) ?? `"${strName}" is not a function. Functions: ${FunctionHelp()}`);
}

// One REPL line : a command or an expression. Returns false to stop the loop
async function RunLine(strLine: string): Promise<boolean> {
	const strCommand = strLine.toLowerCase();
	if (strCommand.startsWith("help ")) {
		PrintFunctionHelp(strLine.slice("help ".length).trim());
		return true;
	}
	switch (strCommand) {
		case "":
			return true;
		case "exit":
		case "quit":
			return false;
		case "help":
			console.log(`Type an expression ("0xFF & 0x0F", "ans << 8", "1; ans + 1") or: history, vars, copy, help, exit`);
			console.log(`Operators : ${OperatorHelp()}`);
			console.log(`Numbers   : 255  0xFF  0b1010  0o17  1_000  1'000  1Fh  4K  'A'`);
			console.log(`Rows      : ${OutputHelp()} (OCT and CHAR with --all)`);
			console.log(`Functions : ${FunctionHelp()} ("help rol" for one)`);
			console.log(`Variables : mask = 0xFF00, then 0x1234 & mask ("vars" lists them)`);
			return true;
		case "history":
			PrintHistory();
			return true;
		case "vars":
			PrintVariables();
			return true;
		case "copy":
			await CopyLatest();
			return true;
		default:
			Calculate(strLine); // an error is printed and the loop goes on
			return true;
	}
}

async function Main(): Promise<number> {
	if (bRepl) {
		console.log(`DevCalc REPL : type "help" for commands, "exit" to quit${oWord !== undefined ? ` (${oWord.nBits}-bit)` : ""}`);
		await RunRepl(RunLine);
		return 0;
	}
	const nCode = Calculate(strExpr);
	if (nCode === 0 && bCopy) {
		await CopyLatest();
	}
	return nCode;
}

// exitCode instead of process.exit() : Node ends normally after all output is written
process.exitCode = await Main();
