//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: devcalc / cli / Repl (Read-eval-print loop)
//	History			: 2026-10-15 CYBERKDH Initial - Lesson 06 DevCalc step
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

import { createInterface } from "node:readline/promises";

export const PROMPT = "devcalc> ";

// Reads lines until the input ends or fnLine returns false (exit).
// In a terminal the user sees the prompt and their own typing. When the input is piped
// (a file, a test), each line is echoed after the prompt so the output still reads like a session.
export async function RunRepl(fnLine: (strLine: string) => Promise<boolean>): Promise<void> {
	const bTerminal = process.stdin.isTTY === true;
	const oReader = createInterface({ input: process.stdin, output: process.stdout, terminal: bTerminal });
	oReader.setPrompt(PROMPT);
	if (bTerminal) {
		oReader.prompt();
	}
	try {
		for await (const strLine of oReader) {
			if (!bTerminal) {
				console.log(PROMPT + strLine);
			}
			if (!(await fnLine(strLine.trim()))) {
				break;
			}
			if (bTerminal) {
				oReader.prompt();
			}
		}
	} finally {
		oReader.close();
	}
}
