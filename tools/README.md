**English** · [한국어](README.ko.md)

# tools

Helper scripts for studying. Not part of the lessons or DevCalc.

## show-js.ts — see how a .ts file becomes JavaScript

`node file.ts` converts TS to JS **in memory only**, so you never see the JS. `show-js.ts` shows it in three steps:

1. **[1]** build with `tsc` → the `.js` is written to `dist/`
2. **[2]** print the generated `.js`
3. **[3]** run that `.js` with node

### Run it from the terminal

| Where you are | Command |
|---|---|
| `projectroot` | `npm run js -- lessons/00-setup/hello.ts` |
| A lesson folder (e.g. `lessons/00-setup`) | `npm run js -- hello.ts` |
| Without npm | `node tools/show-js.ts lessons/00-setup/hello.ts` |
| Windows bat | `ts2js.bat lessons\00-setup\hello.ts` (in PowerShell: `.\ts2js.bat ...`) |

> `--` tells npm that what follows is passed to the script. Don't leave it out.
> With no file, it shows `lessons/00-setup/hello.ts` as an example.

### Run it with F5 (VS Code)

1. Open the `.ts` file you want to see
2. `Ctrl+Shift+D` → choose **⑤ Current TS file (show generated JS, then run)**
3. `F5` → the result appears in the terminal

### Output

```
> npm run js -- lessons/00-setup/enum-sample.ts
[1] tsc : lessons/00-setup/enum-sample.ts  →  dist/lessons/00-setup/enum-sample.js

[2] Generated JavaScript (dist/lessons/00-setup/enum-sample.js)
----------------------------------------------------------------------
const COLOR = {
    Red: "RED",
    Green: "GREEN",
};
function Describe(eColor) {
    return `color = ${eColor}`;
}
...
----------------------------------------------------------------------

[3] node dist/lessons/00-setup/enum-sample.js
RED GREEN
color = GREEN
color = RED
```

### Compare side by side in the editor

1. Run it once (above)
2. `Ctrl+P` → type `enum-sample.js` → open the one under `dist/`
3. `Ctrl+\` to split the editor → `.ts` on one side, `.js` on the other

Only the types are gone (`as const`, `type EColor = ...`, `: EColor`); the rest is the same code.

> Old `.js` files stay in `dist/` even after you delete a `.ts` → `npm run clean`.
