---
title: Each open session gets the tools and runs a call
status: done
depends:
  - task-01-the-mark-the-modes-and-the-tools.md
layer: "resources"
refs:
  - "[code://src/bridges/client-ids.ts#L22-L38](../../../../src/bridges/client-ids.ts#L22-L38) - one client id per host for every window"
  - "[code://src/resources/sessions/Page.tsx#L243](../../../../src/resources/sessions/Page.tsx#L243) - `useOpenQuestions`, which reads `inputNeeded`"
  - "[code://src/shell/notify/say.ts#L27](../../../../src/shell/notify/say.ts#L27) - `done`, the toast for notify"
---

## Objective

Each session open in a tab of this browser has ahpw's tools while one command or more is on.
The window used last with that session open runs each call, and answers it.

## Files

- `CREATE: src/resources/agent-tools/announce.ts` - sends `session/activeClientSet` with the two tools for a session, and sends it again when a mode changes.
- `CREATE: src/resources/agent-tools/runner.ts` - reads `inputNeeded`, runs each `toolClientExecution` for this client id, and sends `chat/toolCallComplete`.
- `CREATE: src/resources/agent-tools/lock.ts` - one Web Lock per session, asked for when the session opens in a tab and taken on focus with `steal`.
- `UPDATE: src/resources/sessions/Page.tsx` - starts the announcement, the lock and the runner for the session it shows.
- `CREATE: src/resources/agent-tools/runner.test.ts` - the cases in *Validation*.

## Steps

1. Announce when the session page mounts and one mode or more is not off.
2. Announce again when a mode changes, and send `session/activeClientRemoved` when every mode becomes off.
3. Ask for the session's lock when the page mounts, and take it with `steal` when the window gets focus.
4. In the lock holder, run each `toolClientExecution` entry whose `clientId` is this window's.
5. Answer each entry once, and skip an entry that this window already answered.
6. For notify, show `done` with the command's title and the session's title.
7. Send `chat/toolCallComplete` to the entry's chat, with the result of `runTool`.
8. Write the tests with a fake lock and a fake bridge.

## Validation

- With every mode off, ahpw sends no `session/activeClientSet`.
- A mode change sends `session/activeClientSet` again in each mounted session.
- Only the lock holder sends `chat/toolCallComplete`, and it sends one per call.
- notify shows one toast per call; run shows none.
- `pnpm vitest run src/resources/agent-tools` passes.

## Resume
