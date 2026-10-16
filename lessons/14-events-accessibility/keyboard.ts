//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 14-events-accessibility / keyboard
//	History			: 2026-10-15 CYBERKDH Initial
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// Keys : key vs code, a typed table of shortcuts, modifiers, preventDefault, and the IME (Korean input).
// Runs in the browser : npm run web → http://127.0.0.1:5173/lessons/14-events-accessibility/
function Log(...arrPart: unknown[]): void {
	const strLine = arrPart.map(String).join(" ");
	console.log(strLine);
	const elLog = document.getElementById("keyboard-log");
	if (elLog !== null) {
		elLog.textContent += strLine + "\n";
	}
}

// 1) [TS] The keys this box handles, as a union. Each one gets a handler from one table
type EShortcut = "Enter" | "Escape" | "ArrowUp" | "ArrowDown";
// const eTypo: EShortcut = "Esc"; // ← Uncomment → TS2322 (Type '"Esc"' is not assignable to type 'EShortcut')

// "Ctrl+Shift+K" : the modifiers first, then key
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

	// 2) [JS] A small history, like a shell : ArrowUp goes back, ArrowDown comes forward
	const arrRecall = ["0xFF", "mask = 0xFF00", "popcount(mask)"];
	let nRecall = arrRecall.length; // length = "past the newest" : an empty box

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
			elInput.value = arrRecall[nRecall] ?? ""; // past the newest → ""
			return `recall [${nRecall}] "${elInput.value}"`;
		},
	} satisfies Record<EShortcut, () => string>;

	function IsShortcut(strKey: string): strKey is EShortcut {
		return Object.hasOwn(SHORTCUTS, strKey);
	}

	// 3) [JS + TS] One keydown listener decides what each key does. The order of the checks matters.
	//    A const arrow, not a function declaration : a declaration is hoisted above the instanceof check,
	//    so inside it TS forgets that elInput is an HTMLInputElement (TS18047)
	const Handle = (oEvent: KeyboardEvent): string => {
		if (oEvent.isComposing) {
			return "ignored : the IME is still composing (this Enter only finishes the syllable)"; // Korean, Japanese, Chinese input
		}
		if ((oEvent.ctrlKey || oEvent.metaKey) && oEvent.code === "KeyK") {
			oEvent.preventDefault(); // the browser's own Ctrl+K (search bar) does not run
			elInput.value = "";
			return `cleared · defaultPrevented = ${oEvent.defaultPrevented}`;
		}
		if (IsShortcut(oEvent.key)) {
			oEvent.preventDefault(); // ArrowUp would move the cursor to the start of the box
			return SHORTCUTS[oEvent.key]();
		}
		return "not a shortcut : the browser types it";
	};

	elInput.addEventListener("keydown", (oEvent) => {
		Log(`   ${KeyName(oEvent).padEnd(10)} code = ${oEvent.code.padEnd(10)} → ${Handle(oEvent)}`);
	});

	// A key event from code does not type a letter (isTrusted = false). Only real keys type
	const Press = (oInit: KeyboardEventInit): void => {
		elInput.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, cancelable: true, ...oInit }));
	};

	// 4) [JS] key is the character (it depends on the layout and Shift). code is the place on the keyboard
	Log("4) key vs code : the same physical key");
	Press({ key: "a", code: "KeyA" });
	Press({ key: "A", code: "KeyA", shiftKey: true });
	Press({ key: "ㅁ", code: "KeyA" }); // the same key with the Korean layout

	Log("5) the shortcut table");
	Press({ key: "ArrowUp", code: "ArrowUp" });
	Press({ key: "ArrowUp", code: "ArrowUp" });
	Press({ key: "ArrowDown", code: "ArrowDown" });
	Press({ key: "Enter", code: "Enter" });
	Press({ key: "Escape", code: "Escape" });

	// 6) [JS] A shortcut with a modifier : check code, so it works with any layout
	Log("6) Ctrl+K, and Enter while the IME is composing");
	Press({ key: "k", code: "KeyK", ctrlKey: true });
	Press({ key: "Enter", code: "Enter", isComposing: true });

	// 7) preventDefault only works on a cancelable event. Real key events are; new KeyboardEvent() is not by default
	Log("7) the same Ctrl+K, made with new KeyboardEvent() only");
	const oPlain = new KeyboardEvent("keydown", { key: "k", code: "KeyK", ctrlKey: true });
	elInput.dispatchEvent(oPlain);
	Log(`   Expected problem: preventDefault() was called, but defaultPrevented = ${oPlain.defaultPrevented}`);
	Log("   Why : this KeyboardEvent was made without cancelable: true, so preventDefault() did nothing.");
	Log("   Fix : pass { cancelable: true } when you make events in tests. Events from real keys are cancelable.");
	Log("   now click the box and press the keys yourself");
}

// 8) [JS] In Node there is no document : explain instead of crashing
if (typeof document === "undefined") {
	console.log("This example runs in the browser (it uses document).");
	console.log("  npm run web  →  http://127.0.0.1:5173/lessons/14-events-accessibility/");
} else {
	RunKeyboard();
}
