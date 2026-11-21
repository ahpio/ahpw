---
title: A running call moves to the background
domain: sessions
status: planned
priority: medium
created: 2026-11-21
revalidated: 2026-11-21
requires:
  - ahpd plans/host/20261121-0824-a-running-call-moves-to-the-background/plan.md - built in ahpd PR #407, merged as `eb832a04f`
refs:
  - git://eb832a04f - the ahpd merge that holds the method and the two keys this plan reads
  - "[code://src/resources/sessions/Parts.tsx#L140-L200](../../../../src/resources/sessions/Parts.tsx#L140-L200) - `ToolCall`, the row and its expanded body, where the button goes"
  - "[code://src/resources/sessions/tool.ts#L8-L12](../../../../src/resources/sessions/tool.ts#L8-L12) - the `_meta` keys ahpd writes on a call, and where the new key is added"
  - "[code://src/resources/sessions/shell-list.ts#L3-L4](../../../../src/resources/sessions/shell-list.ts#L3-L4) - `STOP_WORK`, the one flag a row's stop reads; the new keys sit beside it"
  - "[code://src/resources/sessions/Shells.tsx#L108-L115](../../../../src/resources/sessions/Shells.tsx#L108-L115) - `stop`, the request pattern the move copies: `hostBridge(host).request(...)`, a failure shown, the button off while it runs"
  - "[code://src/resources/sessions/Shells.tsx#L82-L89](../../../../src/resources/sessions/Shells.tsx#L82-L89) - the row's stop button and its `canStop` gate"
---

## Goal

A foreground call that can move to the background gets a "Run in background" button, so a person can stop waiting for it and let the turn go on.
ahpd marks a call that can move with `_meta['ahpd.backgroundToolCall']: true`.
Once the work runs in the background, the completed call carries `_meta['ahpd.backgroundWork']` with the row id, and the row appears in the composer's Shells list, which already has its stop.
The button calls `x-ahpd/backgroundToolCall` with `{ chat, toolCallId }`, and the answer is `{ backgrounded }`.

## Reconnaissance

The files read and the patterns to reuse are the `refs` in the frontmatter, each with its note.

### Searches performed

- `rg "backgroundToolCall|backgroundWork" src` - no hits; the keys are new to ahpw.
- `rg "x-ahpd/" src` - the methods ahpw already calls are `x-ahpd/push/put`, `x-ahpd/policies/put` and `x-ahpd/invokeOperation`; the move is the fourth.
- `rg "vscode/stopBackgroundWork" src` - the only call that acts on a background row, in `Shells.tsx`; the move uses the same pattern.

### Gaps

- ahpw does not read `_meta` on a tool call for anything but timing and kind, so the flag needs a reader in `tool.ts`.
- The method answers `{ backgrounded: false }` when the call already answered. The button must then hide, not show an error.

## Answers

| What | Source | Task |
| --- | --- | --- |
| The button shows only while the call carries `ahpd.backgroundToolCall: true` | "the same permission as steer", 2026-11-21; ahpd PR #407 | 01 |
| The button calls `x-ahpd/backgroundToolCall { chat, toolCallId }` and reads `backgrounded` | ahpd PR #407, `packages/sdk/src/host/vscodemethods.ts` | 01 |
| A `false` answer hides the button and shows no error | `(defaulted: the call answered in the meantime, so there is nothing to move)` | 01 |
| The row the call names is the Shells list's row, with its existing stop | ahpd PR #407; `Shells.tsx` | 01 |

## Proposed architecture

- **Data flow** - the call's `_meta` gives `ahpd.backgroundToolCall`; the button sends the call's `toolCallId` and the chat's URI.
- **Event flow** - the answer `backgrounded: true` takes the button off; the row arrives through the existing Shells list.
- **State flow** - the button's pending state is local, like `stopping` in `Shells.tsx`.
- **Layer responsibilities** - `tool.ts` reads the key; `Parts.tsx` draws the button; a small helper in `shell-list.ts` or `tool.ts` holds the method name.
- **Source-of-truth files** - [`code://src/resources/sessions/Parts.tsx`](../../../../src/resources/sessions/Parts.tsx).

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - The button moves a running call](task-01-the-button-moves-a-running-call.md) | todo | - |

## Risks and tradeoffs

- The button sends the chat's URI; a call in a worker chat must send that chat, which the call's own chat field gives. Check it in the test.
- A move sent after the call answered returns `false`, so a double click is harmless.

## Resume state

- **Done so far:** nothing in ahpw. The ahpd side is merged.
- **Next action:** build task 01.
- **Open questions:** none.
- **Watch out for:** the key is `ahpd.backgroundToolCall`, not `vscode.`-prefixed; the Stop key `vscode.stopBackgroundWork` is a different flag.

## Final verification checklist

- [ ] A running foreground Bash call shows the button.
- [ ] Pressing it sends `x-ahpd/backgroundToolCall`; the turn goes on; the button goes.
- [ ] The row shows in Shells, with its stop.
- [ ] A completed call shows no button.
