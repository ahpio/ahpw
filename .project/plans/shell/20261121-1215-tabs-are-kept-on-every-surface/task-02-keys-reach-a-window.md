---
title: Keys reach a window
status: done
depends: []
layer: "shell"
refs:
  - "[code://src/shell/view/keys.ts#L20-L37](../../../../src/shell/view/keys.ts#L20-L37) - the key listener"
---

## Objective

A key binding works in a window of its own, as it does in the page.

## Files

- `UPDATE: src/shell/view/keys.ts:20-37` - listen on each window that opens.
- `CREATE: src/shell/view/keys.test.ts` - a key in a window runs its command.

## Steps

1. On `scena:window:opened`, add the key listener to the event's window.
2. On `scena:window:closed`, remove it.
3. On dispose, remove it from every window that has it.

## Validation

- `src/shell/view/keys.test.ts`: a keydown in a second window runs the bound command; after the close, it does not.
- `npx vitest run` passes.

## Resume

- Done 2026-11-21: steps 1 to 3. The test uses a same-origin iframe as the window.
- `tsc -b` and the tests pass.
