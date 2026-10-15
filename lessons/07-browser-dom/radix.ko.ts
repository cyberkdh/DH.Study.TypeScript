//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 07-browser-dom / radix (직접 만들기: 진법 변환기)
//	History			: 2026-10-15 CYBERKDH Initial (최초 작성)
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// 직접 만들기 : 입력하는 동안 바로 바뀌는 진법 변환기.
// 브라우저에서 실행 : npm run web → http://127.0.0.1:5173/lessons/07-browser-dom/?ko
function Log(...arrPart: unknown[]): void {
	const strLine = arrPart.map(String).join(" ");
	console.log(strLine);
	const elLog = document.getElementById("radix-log");
	if (elLog !== null) {
		elLog.textContent += strLine + "\n";
	}
}

// 1) [TS] 변환기에 필요한 모든 요소를 한 번에 찾음. 없는 것이 있으면 그 id 와 함께 여기서 멈춤
interface IRadixView {
	readonly elInput: HTMLInputElement;
	readonly elHex: HTMLElement;
	readonly elDec: HTMLElement;
	readonly elBin: HTMLElement;
	readonly elError: HTMLElement;
}

function ById<T extends HTMLElement>(strId: string, cType: { new (): T; prototype: T }): T {
	const elFound = document.getElementById(strId);
	if (!(elFound instanceof cType)) {
		throw new Error(`#${strId} is missing or is not a ${cType.name}`);
	}
	return elFound;
}

// 2) [JS + TS] 순수 함수 : 안에 DOM 이 없으므로 테스트하기 쉬움 (09강)
type TParsed = { readonly bOk: true; readonly biValue: bigint } | { readonly bOk: false; readonly strError: string };

function ParseNumber(strText: string): TParsed {
	const strTrim = strText.trim().replaceAll("_", "");
	if (strTrim === "") {
		return { bOk: false, strError: "type a number" };
	}
	const bNegative = strTrim.startsWith("-");
	try {
		const biValue = BigInt(bNegative ? strTrim.slice(1) : strTrim);
		return { bOk: true, biValue: bNegative ? -biValue : biValue };
	} catch {
		return { bOk: false, strError: `"${strText.trim()}" is not an integer (255, 0xFF, 0b1010, 0o17)` };
	}
}

function Radix(biValue: bigint, nBase: number, strPrefix: string): string {
	const strSign = biValue < 0n ? "-" : "";
	const biAbs = biValue < 0n ? -biValue : biValue;
	return strSign + strPrefix + biAbs.toString(nBase).toUpperCase();
}

// 3) [JS] 현재 입력으로 페이지를 갱신 : 화면에 쓰는 유일한 곳
function Render(oView: IRadixView): void {
	const oParsed = ParseNumber(oView.elInput.value);
	if (!oParsed.bOk) {
		oView.elHex.textContent = oView.elDec.textContent = oView.elBin.textContent = "";
		oView.elError.textContent = oParsed.strError;
		oView.elInput.classList.add("invalid");
		return;
	}
	oView.elHex.textContent = Radix(oParsed.biValue, 16, "0x");
	oView.elDec.textContent = Radix(oParsed.biValue, 10, "");
	oView.elBin.textContent = Radix(oParsed.biValue, 2, "0b");
	oView.elError.textContent = "";
	oView.elInput.classList.remove("invalid");
}

function RunRadix(): void {
	const oView: IRadixView = {
		elInput: ById("radix-input", HTMLInputElement),
		elHex: ById("radix-hex", HTMLTableCellElement),
		elDec: ById("radix-dec", HTMLTableCellElement),
		elBin: ById("radix-bin", HTMLTableCellElement),
		elError: ById("radix-error", HTMLParagraphElement),
	};

	// 4) [JS] "input" 은 바뀔 때마다 (입력, 붙여넣기, 삭제) 발생. "change" 는 상자가 포커스를 잃을 때만
	oView.elInput.addEventListener("input", () => Render(oView));
	Render(oView);

	// 5) [JS] 사용자와 같은 방식으로 코드에서 몇 가지 값을 입력
	for (const strTyped of ["0xFF", "0b1010_1010", "-0x10", "12a", "4096"]) {
		oView.elInput.value = strTyped;
		oView.elInput.dispatchEvent(new Event("input"));
		const strShown = oView.elError.textContent === "" ? `${oView.elHex.textContent} / ${oView.elDec.textContent} / ${oView.elBin.textContent}` : `error : ${oView.elError.textContent}`;
		Log(`5) ${strTyped.padEnd(12)} → ${strShown}`);
	}
	Log("   your turn : type in the box above");
}

// 6) [JS] Node 에는 document 가 없음 : 에러로 멈추는 대신 안내 메시지 출력
if (typeof document === "undefined") {
	console.log("This example runs in the browser (it uses document).");
	console.log("  npm run web  →  http://127.0.0.1:5173/lessons/07-browser-dom/");
} else {
	RunRadix();
}
