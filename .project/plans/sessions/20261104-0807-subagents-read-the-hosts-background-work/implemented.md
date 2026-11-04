---
title: The subagents button reads the host's background work - implemented
date: 2026-11-04
refs:
  - git://16b2185
  - "[code://src/resources/sessions/header.ts](../../../../src/resources/sessions/header.ts)"
---

The subagents button counts a subagent as running while the host lists it in `backgroundWork`.

## What was built

- [`code://src/resources/sessions/header.ts`](../../../../src/resources/sessions/header.ts) - `subagentsOf` takes the chat's `backgroundWork`, and adds each `subagent` row with a `chat` as a running subagent.
- [`code://src/resources/sessions/SessionHeader.tsx`](../../../../src/resources/sessions/SessionHeader.tsx) - passes `chat.backgroundWork`.

## Verified

- `src/resources/sessions/raw.test.ts`: a row alone, a row beside its call, and rows that are skipped. All 7 cases pass.
- `pnpm typecheck` (tsc -b), `pnpm test` (735 passed) and `pnpm build` pass.
- Softov checked it on 2026-11-04: a running background subagent showed as running, and stopped counting once it ended.

## Departures from the plan

- none.

## Left for later

- none.
