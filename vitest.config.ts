//////////////////////////////////////////////////////////////////////////////////////////////////
//	Projects		: DH.Study.TypeScript
//	Author			: CYBERKDH
//	Module			: vitest.config (Vitest settings for the DevCalc tests)
//	History			: 2026-10-15 CYBERKDH Initial - Lesson 09
//	Copyrights		: Copyright (C)CYBERKDH. All Rights Reserved.
//////////////////////////////////////////////////////////////////////////////////////////////////

import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		// Only DevCalc's tests. The lesson examples are plain node:test files (node file.ts)
		include: ["devcalc/tests/**/*.test.ts"],
	},
});
