//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 07-browser-dom / forms (폼과 localStorage)
//	History			: 2026-10-15 CYBERKDH Initial (최초 작성)
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// 브라우저에서 실행 : npm run web → http://127.0.0.1:5173/lessons/07-browser-dom/?ko
function Log(...arrPart: unknown[]): void {
	const strLine = arrPart.map(String).join(" ");
	console.log(strLine);
	const elLog = document.getElementById("forms-log");
	if (elLog !== null) {
		elLog.textContent += strLine + "\n";
	}
}

const STORAGE_KEY = "lesson07.form";

// 1) [TS] localStorage 에 보관하는 것. 저장소는 문자열만 담으므로 bigint 는 텍스트로
interface ISavedForm {
	readonly strA: string;
	readonly strOp: string;
	readonly strB: string;
}

// 2) [JS + TS] localStorage 는 throw 할 수 있고 (개인정보 보호 설정으로 차단되거나 용량이 가득 찬 경우), getItem 은 string | null 을 반환
function LoadSaved(): ISavedForm | undefined {
	try {
		const strJson = localStorage.getItem(STORAGE_KEY);
		return strJson === null ? undefined : (JSON.parse(strJson) as ISavedForm);
	} catch {
		return undefined; // 저장소가 없거나 JSON 이 깨짐 : 빈 상태로 시작
	}
}

function Save(oForm: ISavedForm): void {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(oForm));
	} catch (e) {
		Log("   Could not save:", (e as Error).name);
	}
}

// 3) [JS + TS] FormData.get 은 FormDataEntryValue | null (= string | File | null) 을 반환 : string 으로 좁힘
function FieldText(oData: FormData, strName: string): string {
	const vValue = oData.get(strName);
	return typeof vValue === "string" ? vValue.trim() : "";
}

// 입력 상자는 항상 문자열을 줌. BigInt() 는 255, 0xFF, 0b1010, 0o17 을 읽고, 그 밖에는 SyntaxError 를 던짐
function ToBigInt(strText: string): bigint {
	const bNegative = strText.startsWith("-");
	const biValue = BigInt(strText.slice(bNegative ? 1 : 0).replaceAll("_", ""));
	return bNegative ? -biValue : biValue;
}

function Calculate(biA: bigint, strOp: string, biB: bigint): bigint {
	switch (strOp) {
		case "+":
			return biA + biB;
		case "&":
			return biA & biB;
		case "<<":
			return biA << biB;
		default:
			throw new Error(`unknown operator "${strOp}"`);
	}
}

function RunForms(): void {
	const elForm = document.querySelector<HTMLFormElement>("#calc-form");
	const elOut = document.querySelector<HTMLOutputElement>("#calc-out");
	const elBits = document.querySelector<HTMLInputElement>("#bits");
	if (elForm === null || elOut === null || elBits === null) {
		Log("Expected elements are missing : open this file through index.html");
		return;
	}

	// 4) [JS] 마지막 입력 복원. 첫 방문에는 아직 아무것도 없음
	const oSaved = LoadSaved();
	Log("4) last visit :", oSaved === undefined ? "nothing saved yet" : `${oSaved.strA} ${oSaved.strOp} ${oSaved.strB}`);

	// 5) [JS + TS] submit → SubmitEvent. preventDefault 가 없으면 브라우저가 페이지를 새로 고침
	elForm.addEventListener("submit", (oEvent) => {
		oEvent.preventDefault();
		const oData = new FormData(elForm);
		const oInput: ISavedForm = { strA: FieldText(oData, "a"), strOp: FieldText(oData, "op"), strB: FieldText(oData, "b") };
		// valueAsNumber : type="number" 의 숫자 값 (비어 있으면 NaN), Number() 불필요
		const nBits = elBits.valueAsNumber;
		const elA = elForm.elements.namedItem("a");
		try {
			const biMask = (1n << BigInt(nBits)) - 1n;
			const biResult = Calculate(ToBigInt(oInput.strA), oInput.strOp, ToBigInt(oInput.strB)) & biMask;
			elOut.value = `0x${biResult.toString(16).toUpperCase()}`;
			elOut.className = "ok";
			if (elA instanceof HTMLInputElement) {
				elA.classList.remove("invalid");
			}
			Save(oInput);
			Log(`5) ${oInput.strA} ${oInput.strOp} ${oInput.strB} (${nBits}-bit) = ${elOut.value} / saved`);
		} catch (e) {
			elOut.value = (e as Error).name;
			elOut.className = "error";
			if (elA instanceof HTMLInputElement) {
				elA.classList.add("invalid");
			}
			Log(`   Expected error: ${(e as Error).name} : ${(e as Error).message}`);
			Log("   Why : an input box always holds text, and BigInt() could not read it.");
			Log("   Fix : type 255, 0xFF, 0b1010 or 0o17. The red outline marks the field.");
		}
	});

	// 6) [JS] 코드로 폼을 채우고 사용자처럼 제출 (requestSubmit 은 "submit" 을 발생시킴)
	const elA = elForm.elements.namedItem("a");
	const elOp = elForm.elements.namedItem("op");
	if (elA instanceof HTMLInputElement && elOp instanceof HTMLSelectElement) {
		elOp.value = "&";
		elForm.requestSubmit(); // 0xFF & 1
		elA.value = "0xFF";
		elOp.value = "<<";
		elForm.requestSubmit(); // 8비트에서 0xFF << 1
		elA.value = "0xZZ";
		elForm.requestSubmit(); // 에러
		elA.value = "0xFF";
		elOp.value = "+";
	}

	// 7) [JS] 저장된 값 : 문자열. 페이지를 새로 고치면 4) 가 보여 줌
	try {
		Log("7) localStorage =", localStorage.getItem(STORAGE_KEY));
	} catch (e) {
		Log("7) localStorage is blocked here:", (e as Error).name);
	}
}

// 8) [JS] Node 에는 document 가 없음 : 에러로 멈추는 대신 안내 메시지 출력
if (typeof document === "undefined") {
	console.log("This example runs in the browser (it uses document and localStorage).");
	console.log("  npm run web  →  http://127.0.0.1:5173/lessons/07-browser-dom/");
} else {
	RunForms();
}
