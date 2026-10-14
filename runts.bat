@echo off
REM //////////////////////////////////////////////////////////////////////////////////////////////////
REM //	Projects		: DH.Study.TypeScript
REM //	Author			: CYBERKDH
REM //	Module			: runts.bat (Run a .ts file directly with node)
REM //	History			: 2026-10-14 CYBERKDH Initial
REM //	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
REM //////////////////////////////////////////////////////////////////////////////////////////////////
setlocal

REM Usage : runts.bat lessons\00-setup\hello.ts
REM Type stripping: node runs the .ts as is, no build

REM Check that node is on PATH
where node >nul 2>nul
if errorlevel 1 (
	echo Error: node was not found.
	echo Why  : Node.js is not on PATH. See lesson 00, Appendix A ^(Adding Node.js to PATH^).
	exit /b 1
)

REM No file: run hello.ts as an example
set "TS_FILE=%~1"
if "%TS_FILE%"=="" (
	echo Usage: runts.bat ^<file.ts^>   e.g. runts.bat lessons\00-setup\hello.ts
	echo ^(no file given, so running lessons\00-setup\hello.ts^)
	echo.
	set "TS_FILE=%~dp0lessons\00-setup\hello.ts"
)
if not exist "%TS_FILE%" (
	echo Invalid input: "%TS_FILE%"
	echo Why : the file does not exist.
	exit /b 1
)

echo ^> node %TS_FILE%
node "%TS_FILE%"
