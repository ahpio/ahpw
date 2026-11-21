---
title: A running call moves to the background - implemented
date: 2026-11-21
refs:
  - git://e088232e3 - the merge of PR #113 that holds the button
  - "[code://src/resources/sessions/Parts.tsx](../../../../src/resources/sessions/Parts.tsx) - the Run in background button in `ToolCall`"
  - "[code://src/resources/sessions/tool.ts](../../../../src/resources/sessions/tool.ts) - `movableOf` and `MOVE_CALL`"
  - "[code://src/resources/sessions/workspace.ts](../../../../src/resources/sessions/workspace.ts) - `ChatContext`, the displayed chat a transcript part reads"
  - "[code://src/resources/sessions/Page.tsx](../../../../src/resources/sessions/Page.tsx) - provides the chat to both transcript views"
---

A running call that ahpd marks `ahpd.backgroundToolCall` shows a Run in background button when its row is open.
The button calls `x-ahpd/backgroundToolCall` with the chat the page shows and the call's id.

## What was built

- [`code://src/resources/sessions/tool.ts`](../../../../src/resources/sessions/tool.ts) - `movableOf` reads the flag, and `MOVE_CALL` names the method.
- [`code://src/resources/sessions/Parts.tsx`](../../../../src/resources/sessions/Parts.tsx) - the button, disabled while the request is in flight, and hidden once the host answers.
- [`code://src/resources/sessions/workspace.ts`](../../../../src/resources/sessions/workspace.ts) - `ChatContext` and `useChatUri`.
- [`code://src/resources/sessions/Page.tsx`](../../../../src/resources/sessions/Page.tsx) - provides the displayed chat to both transcript views.
- Labels `sessions/tool/runInBackground` and `sessions/tool/moveFailed` in the English, Spanish and Portuguese locales.

## Verified

- `tool.test.ts` covers the flag reader: `true` only, not the string `"true"` or `false`.
- `pnpm run typecheck` passes.
- `pnpm test` passes (180 files, 1058 tests).
- PR #113 merged.

## Departures from the plan

- The request helper and the method name live in `tool.ts`, not `shell-list.ts`, next to the reader.
- The plan named a `src/i18n` path; the labels went into the existing `en.json`, `es.json` and `pt.json` files.
- The button is not rendered in worker chats other than the one the page shows, because `ChatContext` carries only the displayed chat. A subagent's call is moved from its own page.

## Left for later

- A button on a call whose row is collapsed. It shows once the row is opened.
- Nothing else in this plan.
