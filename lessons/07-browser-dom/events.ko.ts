//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 07-browser-dom / events (이벤트 처리)
//	History			: 2026-10-15 CYBERKDH Initial (최초 작성)
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// 브라우저에서 실행 : npm run web → http://127.0.0.1:5173/lessons/07-browser-dom/?ko
// 아래 코드가 직접 "클릭" 과 "입력" 을 한 번씩 발생시키므로, 회색 상자에 결과가 바로 보임.
function Log(...arrPart: unknown[]): void {
	const strLine = arrPart.map(String).join(" ");
	console.log(strLine);
	const elLog = document.getElementById("events-log");
	if (elLog !== null) {
		elLog.textContent += strLine + "\n";
	}
}

function RunEvents(): void {
	const elButton = document.querySelector<HTMLButtonElement>("#count-btn");
	const elCount = document.querySelector<HTMLSpanElement>("#count");
	const elKey = document.querySelector<HTMLInputElement>("#key-input");
	const elOps = document.querySelector<HTMLParagraphElement>("#ops");
	const elLink = document.querySelector<HTMLAnchorElement>("#docs-link");
	if (elButton === null || elCount === null || elKey === null || elOps === null || elLink === null) {
		Log("Expected elements are missing : open this file through index.html");
		return;
	}

	// 1) [JS + TS] addEventListener : 이벤트 이름이 이벤트 타입을 정함 ("click" → PointerEvent, 포인터 정보가 더해진 MouseEvent)
	let nCount = 0;
	elButton.addEventListener("click", (oEvent) => {
		nCount++;
		elCount.textContent = String(nCount);
		Log(`1) click #${nCount} : button = ${oEvent.button}, isTrusted = ${oEvent.isTrusted}`);
		// Log(oEvent.key); // ← 주석을 풀면 빨간 줄 TS2339 (PointerEvent 타입에는 key 프로퍼티가 없음)
	});
	elButton.click(); // 코드로 발생시킨 클릭 : isTrusted = false (실제 클릭은 true)
	elButton.click();

	// 2) [JS + TS] 키보드 : "keydown" → KeyboardEvent, key 와 보조키 플래그
	elKey.addEventListener("keydown", (oEvent) => {
		if (oEvent.key === "Enter") {
			Log(`2) Enter pressed : value = "${elKey.value}", ctrl = ${oEvent.ctrlKey}`);
		}
	});
	elKey.value = "0xFF";
	elKey.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));

	// 3) [JS + TS] 이벤트 위임 (event delegation) : 부모의 리스너 하나가 안의 모든 버튼을 처리.
	//    target 은 EventTarget | null 이므로 쓰기 전에 좁힘
	elOps.addEventListener("click", (oEvent) => {
		const elTarget = oEvent.target;
		if (!(elTarget instanceof HTMLButtonElement)) {
			return; // 버튼이 아닌 빈 곳을 클릭
		}
		Log(`3) operator button : data-op = "${elTarget.dataset["op"]}"`);
	});
	for (const elOpButton of elOps.querySelectorAll("button")) {
		elOpButton.click();
	}

	// 4) [JS] preventDefault : 브라우저의 기본 동작 (링크 이동, 폼 제출) 을 막음
	elLink.addEventListener("click", (oEvent) => {
		oEvent.preventDefault();
		Log(`4) link click : defaultPrevented = ${oEvent.defaultPrevented} (the page stays here)`);
	});
	elLink.click();

	// 5) [JS] 리스너 해제 : { once: true }, 또는 여러 리스너를 한 번에 끄는 AbortController
	const elTest = document.createElement("button"); // 페이지에 없어도 click() 은 동작
	const oController = new AbortController();
	let nHeard = 0;
	elTest.addEventListener("click", () => nHeard++, { signal: oController.signal });
	elTest.addEventListener("click", () => Log("5) once : runs on the first click only"), { once: true });
	elTest.click();
	oController.abort(); // 이 signal 로 추가한 리스너를 제거
	elTest.click();
	Log(`   with signal : heard ${nHeard} of 2 clicks (aborted after the first)`);

	// 6) [JS + TS] 사용자 정의 이벤트는 detail 에 데이터를 담음. TS 는 직접 만든 이름을 모름 : 캐스트 한 번
	document.addEventListener("devcalc:result", (oEvent) => {
		const biValue = (oEvent as CustomEvent<bigint>).detail;
		Log(`6) custom event : detail = ${biValue} (0x${biValue.toString(16).toUpperCase()})`);
	});
	document.dispatchEvent(new CustomEvent<bigint>("devcalc:result", { detail: 255n }));
	Log("   now click the buttons yourself : the lines above get added again");
}

// 7) [JS] Node 에는 document 가 없음 : 에러로 멈추는 대신 안내 메시지 출력
if (typeof document === "undefined") {
	console.log("This example runs in the browser (it uses document).");
	console.log("  npm run web  →  http://127.0.0.1:5173/lessons/07-browser-dom/");
} else {
	RunEvents();
}
