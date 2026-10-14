@echo off
REM //////////////////////////////////////////////////////////////////////////////////////////////////
REM //	Projects		: DH.Study.TypeScript
REM //	Author			: CYBERKDH
REM //	Module			: runts.bat (Run a .ts file directly with node / .ts 파일을 node 로 바로 실행)
REM //	History			: 2026-10-14 CYBERKDH Initial (최초 작성)
REM //	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
REM //////////////////////////////////////////////////////////////////////////////////////////////////
setlocal

REM Usage / 사용법 : runts.bat lessons\00-setup\hello.ts
REM Type stripping: node runs the .ts as is, no build / 타입 제거: 빌드 없이 .ts 를 그대로 실행

REM Check that node is on PATH / node 가 PATH 에 있는지 확인
where node >nul 2>nul
if errorlevel 1 (
	echo Error: node was not found.
	echo Why  : Node.js is not on PATH. See lesson 00, Appendix A ^(Adding Node.js to PATH^).
	exit /b 1
)

REM No file: run hello.ts as an example / 파일을 주지 않으면 hello.ts 를 예시로 실행
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
