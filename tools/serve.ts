//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: tools / serve (Local dev server : serves .ts to the browser as JavaScript)
//	History			: 2026-10-15 CYBERKDH Initial - Lesson 07
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// Usage : npm run web              (= node --disable-warning=ExperimentalWarning tools/serve.ts)
//         PORT=8080 npm run web    (another port)
//
// Browsers can't run TypeScript. When a .ts file is requested, this server erases the types
// with Node's own stripTypeScriptTypes() (the same thing `node file.ts` does) and sends JavaScript.
// Import paths keep ".ts", so the browser asks for .ts files and gets them converted too.
// It listens on 127.0.0.1 only : other computers can't reach it.
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { stripTypeScriptTypes } from "node:module";
import { extname, join, resolve, sep } from "node:path";

const ROOT_DIR = resolve(import.meta.dirname, "..");
const HOST = "127.0.0.1";
const PORT = Number(process.env["PORT"] ?? 5173);

const MAP_CONTENT_TYPE: Readonly<Record<string, string>> = {
	".html": "text/html; charset=utf-8",
	".css": "text/css; charset=utf-8",
	".js": "text/javascript; charset=utf-8",
	".ts": "text/javascript; charset=utf-8", // sent after the types are stripped
	".json": "application/json; charset=utf-8",
	".svg": "image/svg+xml",
	".png": "image/png",
	".ico": "image/x-icon",
};

// URL path → file path inside ROOT_DIR, or undefined if it is outside or hidden (.git, .env, node_modules)
export function ResolvePath(strUrlPath: string): string | undefined {
	let strDecoded: string;
	try {
		strDecoded = decodeURIComponent(strUrlPath);
	} catch {
		return undefined; // a broken %-escape
	}
	const arrPart = strDecoded.split(/[\\/]/).filter((strPart) => strPart !== "");
	if (arrPart.some((strPart) => strPart.startsWith(".") || strPart === "node_modules")) {
		return undefined; // also blocks ".." (path traversal)
	}
	const strFile = resolve(ROOT_DIR, ...arrPart);
	return strFile === ROOT_DIR || strFile.startsWith(ROOT_DIR + sep) ? strFile : undefined;
}

function Send(oResponse: ServerResponse, nStatus: number, strType: string, vBody: string | Buffer): void {
	oResponse.writeHead(nStatus, { "Content-Type": strType, "Cache-Control": "no-store" });
	oResponse.end(vBody);
}

async function Handle(oRequest: IncomingMessage, oResponse: ServerResponse): Promise<void> {
	if (oRequest.method !== "GET" && oRequest.method !== "HEAD") {
		Send(oResponse, 405, "text/plain; charset=utf-8", "Method not allowed");
		return;
	}
	const oUrl = new URL(oRequest.url ?? "/", `http://${HOST}`);
	let strFile = ResolvePath(oUrl.pathname);
	if (strFile === undefined) {
		Send(oResponse, 403, "text/plain; charset=utf-8", "Forbidden");
		return;
	}
	try {
		if ((await stat(strFile)).isDirectory()) {
			if (!oUrl.pathname.endsWith("/")) {
				// "/devcalc/web" → "/devcalc/web/" so relative paths in the page work
				oResponse.writeHead(301, { Location: oUrl.pathname + "/" + oUrl.search });
				oResponse.end();
				return;
			}
			strFile = join(strFile, "index.html");
		}
		const strExt = extname(strFile);
		const strType = MAP_CONTENT_TYPE[strExt] ?? "application/octet-stream";
		if (strExt === ".ts") {
			const strCode = stripTypeScriptTypes(await readFile(strFile, "utf8"));
			Send(oResponse, 200, strType, strCode);
		} else {
			Send(oResponse, 200, strType, await readFile(strFile));
		}
	} catch (e) {
		const strCode = (e as NodeJS.ErrnoException).code;
		if (strCode === "ENOENT" || strCode === "ENOTDIR") {
			Send(oResponse, 404, "text/plain; charset=utf-8", `Not found: ${oUrl.pathname}`);
		} else {
			// e.g. a syntax error in a .ts file : show it in the browser's network tab
			Send(oResponse, 500, "text/plain; charset=utf-8", `Error: ${(e as Error).message}`);
			console.log(`500 ${oUrl.pathname} : ${(e as Error).message}`);
		}
	}
}

if (import.meta.main) {
	const oServer = createServer((oRequest, oResponse) => {
		void Handle(oRequest, oResponse);
	});
	oServer.on("error", (e: NodeJS.ErrnoException) => {
		console.log(`Could not start the server: ${e.code ?? e.message}`);
		if (e.code === "EADDRINUSE") {
			console.log(`Why : port ${PORT} is already in use (is the server already running?).`);
			console.log("Fix : stop the other one, or use another port : PORT=8080 npm run web");
		}
		process.exitCode = 1;
	});
	oServer.listen(PORT, HOST, () => {
		const strBase = `http://${HOST}:${PORT}`;
		console.log("Dev server running. Open in the browser:");
		console.log(`  ${strBase}/lessons/07-browser-dom/      lesson 07 examples (add ?ko for Korean comments)`);
		console.log(`  ${strBase}/devcalc/web/                 DevCalc web`);
		console.log("Stop : Ctrl+C");
	});
}
