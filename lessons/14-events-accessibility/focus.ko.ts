//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 14-events-accessibility / focus (포커스와 접근성)
//	History			: 2026-10-15 CYBERKDH Initial (최초 작성)
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// 포커스와 접근성 (accessibility) : focus 와 focusin, tabindex, 화살표 키로 움직이는 도구 모음 (roving tabindex),
// aria-pressed, 바로 읽어 주는 상태 줄 (live region), <details>.
// 브라우저에서 실행 : npm run web → http://127.0.0.1:5173/lessons/14-events-accessibility/?ko
function Log(...arrPart: unknown[]): void {
	const strLine = arrPart.map(String).join(" ");
	console.log(strLine);
	const elLog = document.getElementById("focus-log");
	if (elLog !== null) {
		elLog.textContent += strLine + "\n";
	}
}

// BODY, DIV#plain, BUTTON "upper" : 로그에 쓰는 요소 이름
function Describe(elTarget: Element | null): string {
	if (elTarget === null || elTarget === document.body) {
		return String(elTarget?.tagName ?? null);
	}
	return elTarget.id !== "" ? `${elTarget.tagName}#${elTarget.id}` : `${elTarget.tagName} "${elTarget.textContent.trim()}"`;
}

function ById<T extends HTMLElement>(strId: string, cType: { new (): T; prototype: T }): T {
	const elFound = document.getElementById(strId);
	if (!(elFound instanceof cType)) {
		throw new Error(`#${strId} is missing or is not a ${cType.name}`);
	}
	return elFound;
}

// 키에 따른 다음 인덱스, 움직이지 않는 키면 undefined. 양 끝에서는 반대쪽으로 돌아감
function NextIndex(strKey: string, nAt: number, nCount: number): number | undefined {
	switch (strKey) {
		case "ArrowRight":
		case "ArrowDown":
			return (nAt + 1) % nCount;
		case "ArrowLeft":
		case "ArrowUp":
			return (nAt - 1 + nCount) % nCount;
		case "Home":
			return 0;
		case "End":
			return nCount - 1;
		default:
			return undefined;
	}
}

async function RunFocus(): Promise<void> {
	const elToolbar = ById("toolbar", HTMLDivElement);
	const elPlain = ById("plain", HTMLDivElement);
	const elHelp = ById("help", HTMLDetailsElement);
	const elStatus = ById("focus-status", HTMLParagraphElement);
	const arrButton = [...elToolbar.querySelectorAll<HTMLButtonElement>("button[data-flag]")];

	// 1) [JS] "focus" 와 "blur" 는 버블링되지 않고, "focusin" 과 "focusout" 은 됨 : 부모는 focusin 으로 들음
	let nFocus = 0;
	let nFocusIn = 0;
	elToolbar.addEventListener("focus", () => nFocus++);
	elToolbar.addEventListener("focusin", () => nFocusIn++);
	arrButton[0]?.focus();
	Log(`1) focus a button inside : the toolbar heard "focus" ${nFocus}, "focusin" ${nFocusIn} · activeElement = ${Describe(document.activeElement)}`);

	// 2) [JS] 로빙 tabindex (roving tabindex) : 버튼 하나만 tabindex 0 (Tab 이 여기서 멈춤), 나머지는 -1 (코드로만 포커스).
	//    Tab 한 번으로 도구 모음에 들어가고 나옴. 안에서는 화살표 키로 이동
	function SetActive(nIndex: number): void {
		arrButton.forEach((elButton, nAt) => {
			elButton.tabIndex = nAt === nIndex ? 0 : -1;
		});
		arrButton[nIndex]?.focus();
	}
	SetActive(0);

	elToolbar.addEventListener("keydown", (oEvent) => {
		const elFrom = oEvent.target instanceof Element ? oEvent.target.closest<HTMLButtonElement>("button[data-flag]") : null;
		const nAt = elFrom === null ? -1 : arrButton.indexOf(elFrom);
		const nNext = nAt === -1 ? undefined : NextIndex(oEvent.key, nAt, arrButton.length);
		if (nNext === undefined) {
			return; // Tab, Enter, Space ... : 브라우저가 처리
		}
		oEvent.preventDefault(); // 화살표 키로 페이지가 스크롤되지 않게
		SetActive(nNext);
	});

	const TabIndexes = (): string => arrButton.map((elButton) => elButton.tabIndex).join(" ");
	Log(`2) tabindex = [${TabIndexes()}]`);
	for (const strKey of ["ArrowRight", "ArrowRight", "End", "ArrowRight", "ArrowLeft"]) {
		document.activeElement?.dispatchEvent(new KeyboardEvent("keydown", { key: strKey, bubbles: true, cancelable: true }));
		Log(`   ${strKey.padEnd(10)} → tabindex = [${TabIndexes()}] · focus = ${Describe(document.activeElement)}`);
	}

	// 3) [JS + TS] aria-pressed 는 화면 낭독기 (screen reader) 에게 버튼이 토글이라고 알림. CSS 는 [aria-pressed="true"] 를 꾸미므로
	//    상태는 이 속성 한 곳에만 있음. role="status" 는 포커스를 옮기지 않고 새 글을 읽어 줌
	for (const elButton of arrButton) {
		elButton.setAttribute("aria-pressed", "false");
		// elButton.ariaPressed = false; // ← 주석 해제 → TS2322 (Type 'boolean' is not assignable to type 'string')
	}
	elToolbar.addEventListener("click", (oEvent) => {
		const elButton = oEvent.target instanceof Element ? oEvent.target.closest<HTMLButtonElement>("button[data-flag]") : null;
		if (elButton === null) {
			return;
		}
		const bOn = elButton.getAttribute("aria-pressed") !== "true";
		elButton.setAttribute("aria-pressed", String(bOn));
		SetActive(arrButton.indexOf(elButton)); // 클릭하면 Tab 멈춤 위치도 옮김
		elStatus.textContent = `${elButton.dataset["flag"]} ${bOn ? "on" : "off"}`;
	});
	const Pressed = (): string => arrButton.filter((elButton) => elButton.getAttribute("aria-pressed") === "true").map((elButton) => elButton.dataset["flag"]).join(", ");
	for (const nIndex of [0, 2, 0]) {
		arrButton[nIndex]?.click();
		Log(`3) click ${arrButton[nIndex]?.dataset["flag"]} → pressed : [${Pressed()}] · status : "${elStatus.textContent}"`);
	}

	// 4) [JS] <details> 는 코드 없이 마우스와 키보드로 열고 닫힘. "toggle" 이벤트는 조금 뒤에 옴
	let bHeard = false;
	const oToggled = new Promise<void>((fnResolve) => {
		elHelp.addEventListener(
			"toggle",
			() => {
				bHeard = true;
				fnResolve();
			},
			{ once: true },
		);
	});
	elHelp.open = true;
	Log(`4) right after open = true : toggle heard = ${bHeard}`);
	await oToggled;
	Log(`   after await : toggle heard = ${bHeard}, open = ${elHelp.open}`);

	// 5) <div> 는 포커스를 받을 수 없음. focus() 를 불러도 아무 일도 없고 아무 말도 없음
	elPlain.focus();
	Log(`5) Expected problem: after elPlain.focus(), activeElement is still ${Describe(document.activeElement)}`);
	Log("   Why : only controls (button, input, a href ...) and elements with tabindex can take focus. Others ignore focus().");
	Log('   Fix : use a real <button> for things users press. For focus from code only, add tabindex="-1".');
	elPlain.tabIndex = -1;
	elPlain.focus();
	Log(`   with tabindex="-1" → activeElement = ${Describe(document.activeElement)}`);
	Log("   now press Tab into the toolbar, then the arrow keys, Enter and Space");
}

// 6) [JS] Node 에는 document 가 없음 : 에러로 멈추는 대신 안내 메시지 출력
if (typeof document === "undefined") {
	console.log("This example runs in the browser (it uses document).");
	console.log("  npm run web  →  http://127.0.0.1:5173/lessons/14-events-accessibility/");
} else {
	await RunFocus();
}
