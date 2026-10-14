**English** · [한국어](README.ko.md)

# DevCalc

The developer calculator that this lesson series builds. Each lesson adds one more part.

## Current stage: Lv1 radix converter (lessons 01–02)

```bash
node devcalc/src/main.ts 255
# HEX : 0xFF
# DEC : 255
# BIN : 0b1111_1111

node devcalc/src/main.ts 255 --lower --no-prefix   # options: --no-group --lower --no-prefix

npm test        # DevCalc tests
```

## History

| Lesson | Added |
|---|---|
| [01](../lessons/01-basic-types/README.md) | `core/Format.ts` (ToHex/ToBin/ToDec), command-line `main.ts` |
| [02](../lessons/02-functions-objects/README.md) | `IFormatOptions` (grouping, case, prefix), `GroupDigits`, function table in `main.ts` |

Each lesson's state is tagged in git: `git checkout lesson-01`
