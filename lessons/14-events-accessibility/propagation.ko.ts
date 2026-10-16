//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 14-events-accessibility / propagation (이벤트 전파)
//	History			: 2026-10-15 CYBERKDH Initial (최초 작성)
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// 이벤트가 지나가는 길 : 캡처 (capture), 타깃 (target), 버블 (bubble). target 과 currentTarget, closest(), stopPropagation.
// 브라우저에서 실행 : npm run web → http://127.0.0.1:5173/lessons/14-events-accessibility/?ko
function Log(...arrPart: unknown[]): void {
	const strLine = arrPart.map(String).join(" ");
	console.log(strLine);
	const elLog = document.getElementById("propagation-log");
	if (elLog !== null) {
		elLog.textContent += strLine + "\n";
	}
}

// "BUTTON#leaf", "SPAN", "null" : 로그에서 요소를 구별하기에 충분함
function Describe(oTarget: EventTarget | null): string {
	if (!(oTarget instanceof Element)) {
		return String(oTarget);
	}
	return oTarget.id === "" ? oTarget.tagName : `${oTarget.tagName}#${oTarget.id}`;
}

function ById<T extends HTMLElement>(strId: string, cType: { new (): T; prototype: T }): T {
	const elFound = document.getElementById(strId);
	if (!(elFound instanceof cType)) {
		throw new Error(`#${strId} is missing or is not a ${cType.name}`);
	}
	return elFound;
}

async function RunPropagation(): Promise<void> {
	const elOuter = ById("outer", HTMLDivElement);
	const elInner = ById("inner", HTMLDivElement);
	const elLeaf = ById("leaf", HTMLButtonElement);
	const elMenu = ById("menu", HTMLUListElement);

	// 1) [JS] 클릭 한 번은 세 단계 (phase) 를 지남 : 캡처 (window → 타깃까지 내려감), 타깃, 버블 (다시 올라감).
	//    { capture: true } 는 내려가는 길에서 들음. eventPhase : 1 캡처, 2 타깃, 3 버블
	const arrPath: string[] = [];
	for (const elBox of [elOuter, elInner]) {
		elBox.addEventListener("click", (oEvent) => arrPath.push(`${elBox.id}(${oEvent.eventPhase})`), { capture: true });
		elBox.addEventListener("click", (oEvent) => arrPath.push(`${elBox.id}(${oEvent.eventPhase})`));
	}
	elLeaf.addEventListener("click", (oEvent) => arrPath.push(`leaf(${oEvent.eventPhase})`));
	document.addEventListener("click", () => {
		if (arrPath.length > 0) {
			Log(`1) ${arrPath.join(" → ")}`); // 올라가는 길의 마지막 리스너가 경로를 출력
			arrPath.length = 0;
		}
	});
	elLeaf.click();
	elInner.click(); // inner 자체를 클릭 : leaf 는 경로에 없음

	// 2) [JS + TS] closest() 를 쓴 위임 (delegation, 07강) : target 은 실제로 클릭된 것 (안쪽 <span> 일 수도 있음),
	//    currentTarget 은 지금 리스너가 실행 중인 요소. closest() 는 target 에서 위로 올라가며 처음 맞는 요소를 찾음
	elMenu.addEventListener("click", (oEvent) => {
		const oTarget = oEvent.target;
		// Log(oEvent.currentTarget.id); // ← 주석 해제 → TS18047 ('oEvent.currentTarget' is possibly 'null')
		const strOld = oTarget instanceof HTMLButtonElement ? oTarget.dataset["cmd"] : undefined; // 07강 방식
		const elButton = oTarget instanceof Element ? oTarget.closest<HTMLButtonElement>("button[data-cmd]") : null;
		const strCmd = elButton !== null && elMenu.contains(elButton) ? elButton.dataset["cmd"] : undefined; // closest 는 메뉴 바깥 (위) 까지 올라갈 수 있음
		Log(`   target = ${Describe(oTarget)} · currentTarget = ${Describe(oEvent.currentTarget)} · instanceof → ${strOld ?? "missed"} · closest → ${strCmd ?? "none"}`);
	});
	Log("2) delegation : one listener on the menu");
	const elCopy = elMenu.querySelector<HTMLButtonElement>("button[data-cmd='copy']");
	elCopy?.click(); // 버튼 위
	elCopy?.querySelector("span")?.click(); // 버튼 안의 아이콘 위 : instanceof 로는 놓침

	// 3) [JS] 메뉴의 리스너 하나가 나중에 추가된 버튼도 처리 : addEventListener 를 새로 부를 필요 없음
	const elItem = document.createElement("li");
	const elPaste = document.createElement("button");
	elPaste.type = "button";
	elPaste.dataset["cmd"] = "paste";
	elPaste.textContent = "paste";
	elItem.append(elPaste);
	elMenu.append(elItem);
	Log("3) a button added after the listener :");
	elPaste.click();

	// 4) [JS] stopPropagation : 부모는 이벤트를 듣지 못함. 위쪽의 위임 리스너 (메뉴 닫기, 로그 기록) 도 놓침
	const elParent = document.createElement("div"); // 페이지에 붙이지 않아도 그 안에서 이벤트는 전파됨
	const elChild = document.createElement("button");
	elParent.append(elChild);
	let nParentHeard = 0;
	elParent.addEventListener("click", () => nParentHeard++);
	elChild.addEventListener("click", (oEvent) => {
		if (oEvent.shiftKey) {
			oEvent.stopPropagation();
		}
	});
	elChild.click();
	elChild.dispatchEvent(new MouseEvent("click", { bubbles: true, shiftKey: true }));
	Log(`4) 2 clicks, the second with stopPropagation : the parent heard ${nParentHeard}`);

	// 5) [JS] currentTarget 은 리스너가 실행되는 동안에만 값이 있음. await 뒤에는 null
	const elLate = document.createElement("button");
	elLate.id = "late";
	const oDone = new Promise<void>((fnResolve) => {
		elLate.addEventListener("click", async (oEvent) => {
			const elBefore = oEvent.currentTarget as HTMLButtonElement; // 첫 await 전에 읽음 : 문제없음
			await Promise.resolve(); // 예 : await navigator.clipboard.writeText(...)
			try {
				const elAfter = oEvent.currentTarget as HTMLButtonElement; // as 가 null 가능성을 TS 에게서 숨김
				Log(elAfter.id);
			} catch (e) {
				Log(`5) before await : ${Describe(elBefore)} · after await : ${Describe(oEvent.currentTarget)}`);
				Log(`   Expected error: ${String(e)}`);
				Log("   Why : the event finished travelling at the await, so the browser cleared currentTarget. as HTMLButtonElement hid the null.");
				Log("   Fix : copy currentTarget (or the values you need) into a const before the first await.");
			}
			fnResolve();
		});
	});
	elLate.click();
	await oDone;
	Log("   now click inside the boxes and the menu yourself");
}

// 6) [JS] Node 에는 document 가 없음 : 에러로 멈추는 대신 안내 메시지 출력
if (typeof document === "undefined") {
	console.log("This example runs in the browser (it uses document).");
	console.log("  npm run web  →  http://127.0.0.1:5173/lessons/14-events-accessibility/");
} else {
	await RunPropagation();
}
