//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 06-modules-async / clipboard
//	History			: 2026-10-15 CYBERKDH Initial
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// Usage : node lessons/06-modules-async/clipboard.ts [text]   (copies "0xFF" when no text is given)
import { spawn } from "node:child_process";

// 1) [TS] A command and its arguments
interface ICommand {
	readonly strFile: string;
	readonly arrArg: readonly string[];
}

// 2) [JS + TS] Which program copies to the clipboard on each OS (Linux has several, try them in order)
function ClipboardCommands(strPlatform: NodeJS.Platform): ICommand[] {
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

// 3) [JS + TS] Wrap a callback / event API in a Promise : resolve on success, reject on failure
function RunWithInput(oCommand: ICommand, strInput: string): Promise<void> {
	return new Promise((fnResolve, fnReject) => {
		const oChild = spawn(oCommand.strFile, oCommand.arrArg, { stdio: ["pipe", "ignore", "ignore"] });
		oChild.on("error", fnReject); // the program could not be started (e.g. not installed)
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

// 4) [JS + TS] Try each command until one works. Returns the name of the one that worked
async function CopyToClipboard(strText: string): Promise<string> {
	const arrError: string[] = [];
	for (const oCommand of ClipboardCommands(process.platform)) {
		try {
			await RunWithInput(oCommand, strText);
			return oCommand.strFile;
		} catch (e) {
			arrError.push(`${oCommand.strFile}: ${(e as NodeJS.ErrnoException).code ?? (e as Error).message}`);
		}
	}
	throw new Error(`no clipboard program worked (${arrError.join(", ")})`);
}

// 5) [JS] Use it
const strText = process.argv[2] ?? "0xFF";
try {
	const strUsed = await CopyToClipboard(strText);
	console.log(`5) copied "${strText}" with ${strUsed} : paste it somewhere (Ctrl+V / Cmd+V)`);
} catch (e) {
	console.log("5) Could not copy:", (e as Error).message);
	console.log("   Why : this OS has no clipboard program, or there is no desktop (SSH, container).");
	console.log("   Fix : on Linux install wl-clipboard or xclip. Without a desktop there is no clipboard.");
}

// 6) [JS] A program that does not exist : spawn reports it with an "error" event → our Promise rejects
try {
	await RunWithInput({ strFile: "no-such-clipboard-tool", arrArg: [] }, strText);
} catch (e) {
	console.log("6) Expected error:", (e as NodeJS.ErrnoException).code);
	console.log("   Why : the program is not installed, so it could not be started.");
	console.log("   Fix : CopyToClipboard tries the next command, and reports all of them if none works.");
}
