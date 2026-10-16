//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 13-functions-scope / calls
//	History			: 2026-10-15 CYBERKDH Initial
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// Build it : a tiny command runner with a function table (arity checked), variables in a Map, and an overloaded Help

interface IFunctionSpec {
	readonly strUsage: string;
	readonly nMinArgs: number;
	readonly nMaxArgs: number; // Infinity : any number
	readonly fnApply: (...arrArg: bigint[]) => bigint;
}

const FUNCTIONS = {
	popcount: { strUsage: "popcount(x)", nMinArgs: 1, nMaxArgs: 1, fnApply: (biX) => BigInt([...biX.toString(2)].filter((strBit) => strBit === "1").length) },
	rol8: { strUsage: "rol8(x, n)", nMinArgs: 2, nMaxArgs: 2, fnApply: (biX, biN) => BigInt.asUintN(8, (biX << biN) | (biX >> (8n - biN))) },
	max: { strUsage: "max(a, b, ...)", nMinArgs: 2, nMaxArgs: Infinity, fnApply: (...arrArg) => arrArg.reduce((biMax, biValue) => (biValue > biMax ? biValue : biMax)) },
} satisfies Record<string, IFunctionSpec>;

type TFunction = keyof typeof FUNCTIONS;

function IsFunction(strName: string): strName is TFunction {
	return Object.hasOwn(FUNCTIONS, strName); // not "in" : toString is not a function here
}

// Overloads : Help() lists every name, Help(name) gives one usage or undefined
function Help(): string;
function Help(strName: string): string | undefined;
function Help(strName?: string): string | undefined {
	if (strName === undefined) {
		return Object.keys(FUNCTIONS).join(" ");
	}
	return IsFunction(strName) ? FUNCTIONS[strName].strUsage : undefined;
}

const mapVar = new Map<string, bigint>(); // names → values, any name is a safe key

// One value : a number literal or a variable
function ValueOf(strText: string): bigint {
	if (/^(0x[0-9a-f]+|\d+)$/i.test(strText)) {
		return BigInt(strText);
	}
	const biValue = mapVar.get(strText.toLowerCase());
	if (biValue === undefined) {
		throw new Error(`"${strText}" has no value yet (variables: ${[...mapVar.keys()].join(", ") || "none"})`);
	}
	return biValue;
}

// "name = value", "f(a, b)", "help", "help f" or a plain value
function Run(strLine: string): string {
	const arrHelp = /^help(?:\s+(\w+))?$/.exec(strLine);
	if (arrHelp !== null) {
		return arrHelp[1] === undefined ? `functions: ${Help()}` : (Help(arrHelp[1]) ?? `"${arrHelp[1]}" is not a function`);
	}
	const arrAssign = /^(\w+)\s*=\s*(.+)$/.exec(strLine);
	if (arrAssign !== null) {
		const [, strName = "", strRight = ""] = arrAssign;
		const biValue = Evaluate(strRight); // a failure throws, and the variable is not set
		mapVar.set(strName.toLowerCase(), biValue);
		return `${strName.toLowerCase()} = 0x${biValue.toString(16)}`;
	}
	return `0x${Evaluate(strLine).toString(16)}`;
}

function Evaluate(strText: string): bigint {
	const arrCall = /^(\w+)\((.*)\)$/.exec(strText);
	if (arrCall === null) {
		return ValueOf(strText);
	}
	const [, strName = "", strArgs = ""] = arrCall;
	if (!IsFunction(strName)) {
		throw new Error(`"${strName}" is not a function (functions: ${Help()})`);
	}
	const oSpec: IFunctionSpec = FUNCTIONS[strName];
	const arrArg = strArgs.trim() === "" ? [] : strArgs.split(",").map((strArg) => ValueOf(strArg.trim()));
	if (arrArg.length < oSpec.nMinArgs || arrArg.length > oSpec.nMaxArgs) {
		throw new Error(`${oSpec.strUsage} takes ${oSpec.nMaxArgs === Infinity ? `${oSpec.nMinArgs} or more` : oSpec.nMinArgs} arguments, found ${arrArg.length}`);
	}
	return oSpec.fnApply(...arrArg);
}

const arrInput = ["help", "help rol8", "x = 0xF0", "popcount(x)", "rol8(X, 4)", "max(x, 3, 0x100)", "y = rol8(x, 1)", "rol8(1)", "toString(1)", "z"];
for (const strLine of arrInput) {
	try {
		console.log(`${strLine.padEnd(17)} → ${Run(strLine)}`);
	} catch (e) {
		console.log(`${strLine.padEnd(17)} → error : ${(e as Error).message}`);
	}
}
console.log(`variables : ${[...mapVar].map(([strName, biValue]) => `${strName} = 0x${biValue.toString(16)}`).join(", ")}`);
// Help(1); // ← Uncomment → TS2345 (Argument of type 'number' is not assignable to parameter of type 'string')
