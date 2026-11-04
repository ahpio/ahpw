---
title: The subagents button reads background rows
status: done
depends: []
layer: "sessions"
refs:
  - "[code://src/resources/sessions/header.ts#L54-L74](../../../../src/resources/sessions/header.ts#L54-L74) - `subagentsOf`"
  - "[code://src/resources/sessions/SessionHeader.tsx#L76](../../../../src/resources/sessions/SessionHeader.tsx#L76) - its caller"
---

## Objective

`subagentsOf` adds each `backgroundWork` row of kind `subagent` as a running subagent.
The header's subagents button then counts and lists it.

## Files

- `UPDATE: src/resources/sessions/header.ts:54-74` - `subagentsOf` takes `work`, and merges the subagent rows.
- `UPDATE: src/resources/sessions/SessionHeader.tsx:76` - pass `chat?.backgroundWork`.
- `UPDATE: src/resources/sessions/raw.test.ts:50-66` - cases for a row alone, a row beside its call, and a row of another kind.

## Steps

1. Add a fourth argument `work: readonly BackgroundWork[] | undefined` to `subagentsOf`.
2. After the chats pass, read each row of kind `subagent` that has a `chat`.
3. Set that chat's entry to running, and keep the title it already has.
4. Use the row's label as the title only when the entry has no title.
5. Skip every row of another kind, and every row without a `chat`.
6. Pass `chat?.backgroundWork` from `SessionHeader`.
7. Add the three test cases.

## Validation

- `src/resources/sessions/raw.test.ts` holds the three cases, and every case passes.
- `pnpm typecheck` (tsc -b), `pnpm test` and `pnpm build` pass.

## Resume

