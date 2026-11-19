---
title: An unlisted session opens - implemented
date: 2026-11-19
refs:
  - git://0bbaed8
  - "[code://src/resources/sessions/unlisted.ts](../../../../src/resources/sessions/unlisted.ts)"
  - "[code://src/resources/sessions/Page.tsx](../../../../src/resources/sessions/Page.tsx)"
---

A session the host holds and does not list yet opens on its own page. Open chat on a bot shows the empty chat, and the first message continues that session.

## What was built

- [`code://src/resources/sessions/unlisted.ts`](../../../../src/resources/sessions/unlisted.ts) - `unlistedSummary`, a row built from a session's own state, with no times.
- [`code://src/resources/sessions/Page.tsx`](../../../../src/resources/sessions/Page.tsx) - the page takes the list's row, else `unlistedSummary`. It says "Loading" while the session is read, and "gone" only once the read answered with none.
- A line in the CHANGELOG, under *Unreleased*.

## Verified

- `src/resources/sessions/unlisted.test.ts`, the case of a row built from a bot chat's state.
- `pnpm typecheck` and the 1019 tests passed. #103 passed `check`, and merged as `0bbaed8` on 2026-11-19.
- Softov checked on 2026-11-19: Open chat on Gumbo opens the empty chat, and a first message continues it.

## Departures from the plan

- None.
