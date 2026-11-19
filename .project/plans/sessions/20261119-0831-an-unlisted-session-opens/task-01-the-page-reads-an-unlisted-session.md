---
title: The session page reads an unlisted session from its own state
status: done
depends: []
layer: "sessions"
refs:
  - "[code://src/resources/sessions/Page.tsx#L284-L289](../../../../src/resources/sessions/Page.tsx#L284-L289) - where the page finds its row"
---

## Objective

A session the list lacks opens from its own state. The page says "gone" only when the read of the session answered with none.

## Files

- `CREATE: src/resources/sessions/unlisted.ts` - `unlistedSummary`, a row built from a session's state.
- `CREATE: src/resources/sessions/unlisted.test.ts` - the case of a row built from a bot chat's state.
- `UPDATE: src/resources/sessions/Page.tsx:284-289` - the row is the list's, else `unlistedSummary` of the session's state.
- `UPDATE: src/resources/sessions/Page.tsx:434` - "Loading" while the read is pending, "gone" after.
- `UPDATE: CHANGELOG.md` - a line under *Unreleased*.

## Steps

1. Write `unlistedSummary`: the state's metadata, its URI, and empty times.
2. In `SessionView`, take the list's row, else `unlistedSummary` of the session's state.
3. Show "Loading" while the state is unread and the read has no error.
4. Show "gone" when the read answered with no state.
5. Add the case and the changelog line.

## Validation

- `src/resources/sessions/unlisted.test.ts` passes.
- `pnpm typecheck` passes, and the full suite passes.

## Resume
