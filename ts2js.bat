@echo off
REM //////////////////////////////////////////////////////////////////////////////////////////////////
REM //	Projects		: DH.Study.TypeScript
REM //	Author			: CYBERKDH
REM //	Module			: ts2js.bat (Show the JS that tsc generates, then run it / tsc 가 만든 JS 를 보여 주고 실행)
REM //	History			: 2026-10-14 CYBERKDH Initial (최초 작성)
REM //	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
REM //////////////////////////////////////////////////////////////////////////////////////////////////
setlocal

REM Usage / 사용법 : ts2js.bat lessons\00-setup\hello.ts
REM Same as "npm run js -- <file.ts>" (tools\show-js.ts) / "npm run js -- 파일.ts" 와 같음
REM   [1] tsc build into dist\ / tsc 로 dist\ 에 빌드
REM   [2] print the generated .js / 만들어진 .js 출력
REM   [3] run that .js / 그 .js 실행

REM Check that node is on PATH / node 가 PATH 에 있는지 확인
where node >nul 2>nul
if errorlevel 1 (
	echo Error: node was not found.
	echo Why  : Node.js is not on PATH. See lesson 00, Appendix A ^(Adding Node.js to PATH^).
	exit /b 1
)

REM No file: show-js.ts uses hello.ts as an example / 파일을 주지 않으면 show-js.ts 가 hello.ts 를 예시로 보여 줌
node "%~dp0tools\show-js.ts" %*
