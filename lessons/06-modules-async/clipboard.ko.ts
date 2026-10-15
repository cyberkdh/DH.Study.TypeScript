//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 06-modules-async / clipboard (외부 프로그램으로 클립보드 복사)
//	History			: 2026-10-15 CYBERKDH Initial (최초 작성)
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// 사용법 : node lessons/06-modules-async/clipboard.ko.ts [text]   (text 가 없으면 "0xFF" 를 복사)
import { spawn } from "node:child_process";

// 1) [TS] 명령과 그 인자
interface ICommand {
	readonly strFile: string;
	readonly arrArg: readonly string[];
}

// 2) [JS + TS] OS 별로 클립보드에 복사하는 프로그램 (Linux 는 여러 개라 순서대로 시도)
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

// 3) [JS + TS] 콜백 / 이벤트 API 를 Promise 로 감싸기 : 성공하면 resolve, 실패하면 reject
function RunWithInput(oCommand: ICommand, strInput: string): Promise<void> {
	return new Promise((fnResolve, fnReject) => {
		const oChild = spawn(oCommand.strFile, oCommand.arrArg, { stdio: ["pipe", "ignore", "ignore"] });
		oChild.on("error", fnReject); // 프로그램을 시작할 수 없음 (예: 설치 안 됨)
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

// 4) [JS + TS] 하나가 성공할 때까지 명령을 차례로 시도. 성공한 명령의 이름을 돌려줌
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

// 5) [JS] 사용 예
const strText = process.argv[2] ?? "0xFF";
try {
	const strUsed = await CopyToClipboard(strText);
	console.log(`5) copied "${strText}" with ${strUsed} : paste it somewhere (Ctrl+V / Cmd+V)`);
} catch (e) {
	console.log("5) Could not copy:", (e as Error).message);
	console.log("   Why : this OS has no clipboard program, or there is no desktop (SSH, container).");
	console.log("   Fix : on Linux install wl-clipboard or xclip. Without a desktop there is no clipboard.");
}

// 6) [JS] 존재하지 않는 프로그램 : spawn 이 "error" 이벤트로 알림 → 직접 만든 Promise 가 reject
try {
	await RunWithInput({ strFile: "no-such-clipboard-tool", arrArg: [] }, strText);
} catch (e) {
	console.log("6) Expected error:", (e as NodeJS.ErrnoException).code);
	console.log("   Why : the program is not installed, so it could not be started.");
	console.log("   Fix : CopyToClipboard tries the next command, and reports all of them if none works.");
}
