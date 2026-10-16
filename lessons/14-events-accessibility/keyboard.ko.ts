//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 14-events-accessibility / keyboard (키보드)
//	History			: 2026-10-15 CYBERKDH Initial (최초 작성)
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// 키 : key 와 code, 타입이 있는 단축키 표, 보조키 (modifier), preventDefault, IME (한글 입력).
// 브라우저에서 실행 : npm run web → http://127.0.0.1:5173/lessons/14-events-accessibility/?ko
function Log(...arrPart: unknown[]): void {
	const strLine = arrPart.map(String).join(" ");
	console.log(strLine);
	const elLog = document.getElementById("keyboard-log");
	if (elLog !== null) {
		elLog.textContent += strLine + "\n";
	}
}

// 1) [TS] 이 입력 상자가 처리하는 키를 유니온 (union) 으로. 키마다 표 하나에서 처리 함수를 받음
type EShortcut = "Enter" | "Escape" | "ArrowUp" | "ArrowDown";
// const eTypo: EShortcut = "Esc"; // ← 주석 해제 → TS2322 (Type '"Esc"' is not assignable to type 'EShortcut')

// "Ctrl+Shift+K" : 보조키 먼저, 그다음 key
function KeyName(oEvent: KeyboardEvent): string {
	const arrPart: string[] = [];
	if (oEvent.ctrlKey) {
		arrPart.push("Ctrl");
	}
	if (oEvent.altKey) {
		arrPart.push("Alt");
	}
	if (oEvent.shiftKey) {
		arrPart.push("Shift");
	}
	if (oEvent.metaKey) {
		arrPart.push("Meta");
	}
	arrPart.push(oEvent.key);
	return arrPart.join("+");
}

function RunKeyboard(): void {
	const elInput = document.getElementById("kb-input");
	if (!(elInput instanceof HTMLInputElement)) {
		Log("#kb-input is missing : open this file through index.html");
		return;
	}

	// 2) [JS] 셸 (shell) 같은 작은 이력 : ArrowUp 은 이전으로, ArrowDown 은 다음으로
	const arrRecall = ["0xFF", "mask = 0xFF00", "popcount(mask)"];
	let nRecall = arrRecall.length; // length = "가장 최근 것의 다음" : 빈 상자

	const SHORTCUTS = {
		Enter: () => `run "${elInput.value}"`,
		Escape: () => {
			elInput.value = "";
			return "cleared the box";
		},
		ArrowUp: () => {
			nRecall = Math.max(0, nRecall - 1);
			elInput.value = arrRecall[nRecall] ?? "";
			return `recall [${nRecall}] "${elInput.value}"`;
		},
		ArrowDown: () => {
			nRecall = Math.min(arrRecall.length, nRecall + 1);
			elInput.value = arrRecall[nRecall] ?? ""; // 가장 최근 것의 다음 → ""
			return `recall [${nRecall}] "${elInput.value}"`;
		},
	} satisfies Record<EShortcut, () => string>;

	function IsShortcut(strKey: string): strKey is EShortcut {
		return Object.hasOwn(SHORTCUTS, strKey);
	}

	// 3) [JS + TS] keydown 리스너 하나가 키마다 할 일을 정함. 검사 순서가 중요함.
	//    함수 선언이 아니라 const 화살표 함수 : 선언은 instanceof 검사 위로 끌어올려지므로 (hoisting)
	//    그 안에서는 elInput 이 HTMLInputElement 라는 것을 TS 가 잊음 (TS18047)
	const Handle = (oEvent: KeyboardEvent): string => {
		if (oEvent.isComposing) {
			return "ignored : the IME is still composing (this Enter only finishes the syllable)"; // 한글, 일본어, 중국어 입력
		}
		if ((oEvent.ctrlKey || oEvent.metaKey) && oEvent.code === "KeyK") {
			oEvent.preventDefault(); // 브라우저 자체의 Ctrl+K (검색창) 가 실행되지 않음
			elInput.value = "";
			return `cleared · defaultPrevented = ${oEvent.defaultPrevented}`;
		}
		if (IsShortcut(oEvent.key)) {
			oEvent.preventDefault(); // 막지 않으면 ArrowUp 이 커서를 상자 맨 앞으로 옮김
			return SHORTCUTS[oEvent.key]();
		}
		return "not a shortcut : the browser types it";
	};

	elInput.addEventListener("keydown", (oEvent) => {
		Log(`   ${KeyName(oEvent).padEnd(10)} code = ${oEvent.code.padEnd(10)} → ${Handle(oEvent)}`);
	});

	// 코드로 만든 키 이벤트는 글자를 입력하지 않음 (isTrusted = false). 실제 키만 입력됨
	const Press = (oInit: KeyboardEventInit): void => {
		elInput.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, cancelable: true, ...oInit }));
	};

	// 4) [JS] key 는 문자 (자판 배열과 Shift 에 따라 다름). code 는 키보드 위의 위치
	Log("4) key vs code : the same physical key");
	Press({ key: "a", code: "KeyA" });
	Press({ key: "A", code: "KeyA", shiftKey: true });
	Press({ key: "ㅁ", code: "KeyA" }); // 같은 키, 한글 자판

	Log("5) the shortcut table");
	Press({ key: "ArrowUp", code: "ArrowUp" });
	Press({ key: "ArrowUp", code: "ArrowUp" });
	Press({ key: "ArrowDown", code: "ArrowDown" });
	Press({ key: "Enter", code: "Enter" });
	Press({ key: "Escape", code: "Escape" });

	// 6) [JS] 보조키가 있는 단축키 : code 를 검사해야 어떤 자판 배열에서도 동작함
	Log("6) Ctrl+K, and Enter while the IME is composing");
	Press({ key: "k", code: "KeyK", ctrlKey: true });
	Press({ key: "Enter", code: "Enter", isComposing: true });

	// 7) preventDefault 는 취소 가능한 (cancelable) 이벤트에서만 동작. 실제 키 이벤트는 가능, new KeyboardEvent() 는 기본값이 불가능
	Log("7) the same Ctrl+K, made with new KeyboardEvent() only");
	const oPlain = new KeyboardEvent("keydown", { key: "k", code: "KeyK", ctrlKey: true });
	elInput.dispatchEvent(oPlain);
	Log(`   Expected problem: preventDefault() was called, but defaultPrevented = ${oPlain.defaultPrevented}`);
	Log("   Why : this KeyboardEvent was made without cancelable: true, so preventDefault() did nothing.");
	Log("   Fix : pass { cancelable: true } when you make events in tests. Events from real keys are cancelable.");
	Log("   now click the box and press the keys yourself");
}

// 8) [JS] Node 에는 document 가 없음 : 에러로 멈추는 대신 안내 메시지 출력
if (typeof document === "undefined") {
	console.log("This example runs in the browser (it uses document).");
	console.log("  npm run web  →  http://127.0.0.1:5173/lessons/14-events-accessibility/");
} else {
	RunKeyboard();
}
