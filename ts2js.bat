@echo off
REM //////////////////////////////////////////////////////////////////////////////////////////////////
REM //	Projects		: DH.Study.TypeScript
REM //	Author			: CYBERKDH
REM //	Module			: ts2js.bat (Show the JS that tsc generates, then run it)
REM //	History			: 2026-10-14 CYBERKDH Initial
REM //	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
REM //////////////////////////////////////////////////////////////////////////////////////////////////
setlocal

REM Usage : ts2js.bat lessons\00-setup\hello.ts
REM Same as "npm run js -- <file.ts>" (tools\show-js.ts)
REM   [1] tsc build into dist\
REM   [2] print the generated .js
REM   [3] run that .js

REM Check that node is on PATH
where node >nul 2>nul
if errorlevel 1 (
	echo Error: node was not found.
	echo Why  : Node.js is not on PATH. See lesson 00, Appendix A ^(Adding Node.js to PATH^).
	exit /b 1
)

REM No file: show-js.ts uses hello.ts as an example
node "%~dp0tools\show-js.ts" %*
