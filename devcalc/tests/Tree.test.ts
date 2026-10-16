//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: devcalc / tests / Tree
//	History			: 2026-10-16 CYBERKDH Initial - Lesson 17 DevCalc step
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

import { test } from "vitest";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { Parse, type TNode } from "../src/core/Parser.ts";
import { Explain } from "../src/core/Steps.ts";
import { LayoutTree, NodeChildren, NodeLabel, TreeLines, type ITreeLayout } from "../src/core/Tree.ts";

const MAIN_FILE = join(import.meta.dirname, "../src/main.ts");

// Returns the tree of a valid expression, fails the test otherwise
function TreeOf(strExpr: string): TNode {
	const oTree = Parse(strExpr);
	assert.ok(oTree.bOk, oTree.bOk ? "" : oTree.vError.strWhy);
	return oTree.vValue;
}

// "label@x,y" for every box, in the order of arrBox
function Boxes(oLayout: ITreeLayout): string[] {
	return oLayout.arrBox.map((oBox) => `${oBox.strLabel}@${oBox.nX},${oBox.nY}`);
}

test("NodeLabel / NodeChildren: every kind of node", () => {
	const oRoot = TreeOf("y = -x * max(0xF0, 'A') + ans");
	assert.equal(NodeLabel(oRoot), "y =");
	const arrLabel: string[] = [];
	const Visit = (oNode: TNode): void => {
		arrLabel.push(NodeLabel(oNode));
		NodeChildren(oNode).forEach(Visit);
	};
	Visit(oRoot);
	assert.deepEqual(arrLabel, ["y =", "+", "*", "-", "x", "max()", "0xF0", "'A'", "ans"]);
});

test("LayoutTree: leaves take the next slot, a parent sits in the middle of its children", () => {
	const oLayout = LayoutTree(TreeOf("1 + 2 * 3"));
	assert.deepEqual(Boxes(oLayout), ["1@0,1", "2@1,2", "3@2,2", "*@1.5,1", "+@0.75,0"]); // post-order, the root last
	assert.equal(oLayout.nWidth, 3);
	assert.equal(oLayout.nHeight, 3);
	assert.deepEqual(oLayout.arrBox.at(-1)?.arrChild, [0, 3]); // + → 1 and *
});

test("LayoutTree: one child goes straight down, and no two boxes share a place", () => {
	assert.deepEqual(Boxes(LayoutTree(TreeOf("-(~5)"))), ["5@0,2", "~@0,1", "-@0,0"]);
	const oLayout = LayoutTree(TreeOf("10 + 30 * (100 + 2) / 10 + 20"));
	const arrPlace = Boxes(oLayout).map((strBox) => strBox.split("@")[1]);
	assert.equal(new Set(arrPlace).size, arrPlace.length);
	assert.equal(oLayout.nWidth, 6); // 10 30 100 2 10 20
	assert.equal(oLayout.nHeight, 6);
});

test("LayoutTree: the boxes are the tree's own nodes (the steps point at the same objects)", () => {
	const oExplain = Explain("(1 + 2) * 3");
	assert.ok(oExplain.bOk);
	const setNode = new Set(LayoutTree(oExplain.vValue.oRoot).arrBox.map((oBox) => oBox.oNode));
	for (const oStep of oExplain.vValue.arrStep) {
		assert.ok(setNode.has(oStep.oNode), oStep.strWork);
	}
	assert.deepEqual(
		oExplain.vValue.arrStep.map((oStep) => `${NodeLabel(oStep.oNode)}=${oStep.biValue}`),
		["+=3", "*=9"],
	);
});

test("TreeLines: one node per line, with the lines that join them", () => {
	assert.deepEqual(TreeLines(TreeOf("1 + 2 * 3")), ["+", "├─ 1", "└─ *", "   ├─ 2", "   └─ 3"]);
	assert.deepEqual(TreeLines(TreeOf("max(1, 2) - 3")), ["-", "├─ max()", "│  ├─ 1", "│  └─ 2", "└─ 3"]);
	assert.deepEqual(TreeLines(TreeOf("0xFF")), ["0xFF"]);
});

test("--tree: the tree before the result, even when the calculation fails", () => {
	const oRun = spawnSync(process.execPath, [MAIN_FILE, "1 + 2 * 3", "--tree"], { encoding: "utf8" });
	assert.equal(oRun.status, 0);
	assert.match(oRun.stdout, /^Tree :\n {2}\+\n {2}├─ 1\n {2}└─ \*\n {5}├─ 2\n {5}└─ 3\nHEX : 0x7\n/);
	const oFail = spawnSync(process.execPath, [MAIN_FILE, "1 / 0", "--tree"], { encoding: "utf8" });
	assert.equal(oFail.status, 1);
	assert.match(oFail.stdout, /^Tree :\n {2}\/\n[\s\S]*Why : division by zero\n/);
});
