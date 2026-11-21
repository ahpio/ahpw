---
title: The button moves a running call
status: done
---

## Goal

A running call with `ahpd.backgroundToolCall: true` gets a "Run in background" button that moves it.

## Files

- `UPDATE: src/resources/sessions/tool.ts` - a `movableOf(call)` reader for `_meta['ahpd.backgroundToolCall']`, beside `durationOf` and `startedOf`.
- `UPDATE: src/resources/sessions/Parts.tsx` - in `ToolCall`, when `live` and the call is movable and running, a `Button` in the expanded body's `web-tool__actions`.
- `UPDATE: src/resources/sessions/shell-list.ts` - the method name and the request, beside `STOP_WORK`.
- `UPDATE: src/i18n` (or the existing locale file for `sessions/tool/*`) - the label `sessions/tool/runInBackground`.
- `CREATE: src/resources/sessions/tool-move.test.ts` - the reader and the request.

## Steps

1. Add the reader: true only when the value is exactly `true`.
2. Add the request helper: `hostBridge(host).request('x-ahpd/backgroundToolCall' as never, { chat, toolCallId } as never)`, answering `{ backgrounded?: unknown }`.
3. In `ToolCall`, show the button when `live`, the outcome is running, and `movableOf(call)` is true.
4. On click, disable the button, send the request, and hide the button on `backgrounded: true` or on `false` (the call answered in the meantime).
5. A failed request shows the error the way `Shells.tsx` shows `stopFailed`, and turns the button back on.
6. Add the label to every locale file the `sessions/tool/*` keys live in.

## Validation

- `tool-move.test.ts` covers: a `true` flag shows the reader as true; `"true"` as a string and a missing key read false; the request carries the chat and the call's `toolCallId`; `false` hides the button.
- `pnpm test` in the worktree passes; the typecheck passes.

## Resume

Not started.
