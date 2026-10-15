//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 07-browser-dom / elements (요소 찾기·만들기·바꾸기)
//	History			: 2026-10-15 CYBERKDH Initial (최초 작성)
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// 브라우저에서 실행 : npm run web → http://127.0.0.1:5173/lessons/07-browser-dom/?ko
// 하는 일을 1번 구역의 회색 상자 (와 DevTools 콘솔) 에 출력함.
function Log(...arrPart: unknown[]): void {
	const strLine = arrPart.map(String).join(" ");
	console.log(strLine);
	const elLog = document.getElementById("elements-log");
	if (elLog !== null) {
		elLog.textContent += strLine + "\n";
	}
}

// 2) [TS] 헬퍼 함수 : 요소 하나를 찾아 실행 시점에 타입을 확인하고, 아니면 분명한 메시지로 throw
function QueryOne<T extends Element>(strSelector: string, cType: { new (): T; prototype: T }): T {
	const elFound = document.querySelector(strSelector);
	if (!(elFound instanceof cType)) {
		throw new Error(`${strSelector} : expected ${cType.name}, found ${elFound === null ? "nothing" : elFound.tagName}`);
	}
	return elFound; // instanceof 로 T 로 좁혀짐
}

function RunElements(): void {
	// 1) [JS + TS] querySelector 는 Element | null 을 반환 : 요소가 없을 수도 있음
	const elTitle = document.querySelector("#title"); // Element | null
	// elTitle.textContent = "x"; // ← 주석을 풀면 빨간 줄 TS18047 ('elTitle' 이 null 일 수 있음)
	if (elTitle !== null) {
		Log("1) #title text =", elTitle.textContent);
	}
	const elAny = document.querySelector("#expr"); // Element : TS 는 이것이 <input> 인지 모름
	// Log(elAny?.value); // ← 주석을 풀면 빨간 줄 TS2339 (Element 타입에는 value 프로퍼티가 없음)
	Log("   #expr is an", elAny?.tagName, "but TS only knows: Element");

	// 2) [TS] 올바른 타입을 얻는 세 가지 방법
	const elByTag = document.querySelector("input"); // 태그 이름 : HTMLInputElement | null (태그 맵에서)
	const elByGeneric = document.querySelector<HTMLInputElement>("#expr"); // 제네릭 : 타입을 개발자가 보증 (검사 없음)
	const elChecked = QueryOne("#expr", HTMLInputElement); // 실행 시점에 확인 : 가장 안전
	Log("2) value =", elByTag?.value, elByGeneric?.value, elChecked.value);
	try {
		QueryOne("#title", HTMLInputElement);
	} catch (e) {
		Log("   Expected error:", (e as Error).message);
		Log("   Why : #title is a <p>, not an <input>. A cast (as / <T>) would have hidden this.");
		Log("   Fix : check the selector and the HTML. QueryOne finds it at the first run.");
	}

	// 3) [JS] textContent 는 텍스트를 그대로 넣음. innerHTML 은 HTML 로 해석 : 사용자 입력을 절대 넣지 말 것
	const strUserInput = "<img src=x onerror=alert(1)>";
	elChecked.value = strUserInput;
	const elSafe = document.createElement("p");
	elSafe.textContent = elChecked.value; // 텍스트로 보이고, 아무것도 실행되지 않음
	Log("3) textContent keeps it as text :", elSafe.textContent, "/ child elements =", elSafe.children.length);
	elChecked.value = "0xFF";

	// 4) [JS + TS] 요소 만들기. createElement("tr") 는 HTMLTableRowElement 를 반환 (태그 이름으로)
	const elBody = QueryOne("#result tbody", HTMLTableSectionElement);
	const arrRow: [string, string][] = [
		["HEX", "0xFF"],
		["DEC", "255"],
	];
	for (const [strLabel, strValue] of arrRow) {
		const elRow = document.createElement("tr");
		elRow.insertCell().textContent = strLabel;
		elRow.insertCell().textContent = strValue;
		elBody.append(elRow);
	}
	Log("4) rows added =", elBody.rows.length);

	// 5) [JS] 클래스, data-* 속성 (dataset), 속성
	const elTitleP = QueryOne("#title", HTMLParagraphElement);
	elTitleP.classList.add("highlight");
	Log("5) class =", elTitleP.className, "/ has highlight =", elTitleP.classList.contains("highlight"));
	for (const elItem of document.querySelectorAll<HTMLLIElement>("#regs li")) {
		// dataset 값은 string | undefined : 속성이 없을 수도 있음
		const biValue = BigInt(elItem.dataset["value"] ?? "0");
		Log(`   ${elItem.dataset["reg"]} = ${biValue} (data-value="${elItem.getAttribute("data-value")}")`);
	}

	// 6) [JS] 지우기 : 요소가 페이지에서 빠짐
	const elRegs = QueryOne("#regs", HTMLUListElement);
	elRegs.lastElementChild?.remove();
	Log("6) after remove : li count =", elRegs.children.length);
}

// 7) [JS] Node 에는 document 가 없음 : 에러로 멈추는 대신 안내 메시지 출력
if (typeof document === "undefined") {
	console.log("This example runs in the browser (it uses document).");
	console.log("  npm run web  →  http://127.0.0.1:5173/lessons/07-browser-dom/");
} else {
	RunElements();
}
