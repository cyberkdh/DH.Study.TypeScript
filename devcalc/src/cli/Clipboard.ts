//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: devcalc / cli / Clipboard (Copy text with the OS clipboard program)
//	History			: 2026-10-15 CYBERKDH Initial - Lesson 06 DevCalc step
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// Node only (child_process), so it lives in cli/, not in core/
import { spawn } from "node:child_process";

export interface ICommand {
	readonly strFile: string;
	readonly arrArg: readonly string[];
}

// The clipboard programs to try, in order, for each OS
export function ClipboardCommands(strPlatform: NodeJS.Platform): ICommand[] {
	switch (strPlatform) {
		case "win32":
			return [{ strFile: "clip", arrArg: [] }];
		case "darwin":
			return [{ strFile: "pbcopy", arrArg: [] }];
		default:
			return [
				{ strFile: "wl-copy", arrArg: [] },
				{ strFile: "xclip", arrArg: ["-selection", "clipboard"] },
				{ strFile: "xsel", arrArg: ["--clipboard", "--input"] },
			];
	}
}

// Runs one program with strInput on its stdin. Rejects if it cannot start or exits with an error
function RunWithInput(oCommand: ICommand, strInput: string): Promise<void> {
	return new Promise((fnResolve, fnReject) => {
		const oChild = spawn(oCommand.strFile, oCommand.arrArg, { stdio: ["pipe", "ignore", "ignore"] });
		oChild.on("error", fnReject);
		oChild.on("close", (nCode) => {
			if (nCode === 0) {
				fnResolve();
			} else {
				fnReject(new Error(`${oCommand.strFile} exited with code ${nCode}`));
			}
		});
		oChild.stdin.end(strInput);
	});
}

// Tries each program until one works. Returns its name, or throws with every failure
export async function CopyToClipboard(strText: string, strPlatform: NodeJS.Platform = process.platform): Promise<string> {
	const arrError: string[] = [];
	for (const oCommand of ClipboardCommands(strPlatform)) {
		try {
			await RunWithInput(oCommand, strText);
			return oCommand.strFile;
		} catch (e) {
			arrError.push(`${oCommand.strFile}: ${(e as NodeJS.ErrnoException).code ?? (e as Error).message}`);
		}
	}
	throw new Error(`no clipboard program worked (${arrError.join(", ")})`);
}
