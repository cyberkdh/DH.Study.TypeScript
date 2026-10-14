//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: 00-setup / enum-sample
//	History			: 2026-10-14 CYBERKDH Initial
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

// An enum generates new JavaScript code, so ① Node directly can't run it.
// This repo turns on "erasableSyntaxOnly" in tsconfig.json → writing an enum shows a red squiggle at once.
//
//   enum Color { Red = "RED", Green = "GREEN" }   ← not used in this repo
//
// Instead: a plain object + "as const" + a union type. Only types are added, so it runs everywhere.

const COLOR = {
	Red: "RED",
	Green: "GREEN",
} as const;

// "RED" | "GREEN" : the union of the object's values
type EColor = (typeof COLOR)[keyof typeof COLOR];

function Describe(eColor: EColor): string {
	return `color = ${eColor}`;
}

console.log(COLOR.Red, COLOR.Green); // RED GREEN
console.log(Describe(COLOR.Green)); // color = GREEN
console.log(Describe("RED")); // color = RED  (a plain string literal works too)
// Describe("BLUE"); // ← Uncomment: red squiggle, "BLUE" is not an EColor
