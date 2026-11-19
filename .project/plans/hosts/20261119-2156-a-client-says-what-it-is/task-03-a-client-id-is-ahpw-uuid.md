---
title: A client id is ahpw-uuid
status: todo
depends: []
layer: "bridges"
refs:
  - "[code://src/bridges/client-ids.ts](../../../../src/bridges/client-ids.ts) - `localClientIds`, which returns the stored id or none"
  - "[code://src/bridges/words.ts#L8](../../../../src/bridges/words.ts#L8) - `newId`, a UUID outside a secure context too"
---

## Objective

ahpw's client id is `ahpw-<uuid>`.
A browser with no id, or with a stored id in another form, gets a new `ahpw-<uuid>` once and keeps it.

## Files

- `UPDATE: src/bridges/client-ids.ts` - `load` returns the stored `ahpw-<uuid>`, else makes one, stores it and returns it.
- `UPDATE: src/bridges/client-ids.test.ts` - a new id, a kept id, a bare UUID replaced, and storage that throws.
- `UPDATE: CHANGELOG.md` - a line under *Unreleased*, *Changed*.

## Steps

1. Add `ahpwId()`, which returns `ahpw-` and `newId()`.
2. In `load`, return the stored id when it starts with `ahpw-`.
3. Otherwise make an `ahpwId()`, store it under the same key, and return it.
4. Where storage throws, return a new `ahpwId()` without storing it.
5. Add the cases and the changelog line, which says a browser reconnects once as a new client.

## Validation

- Check these cases in `client-ids.test.ts`:
  - An empty store gives `ahpw-<uuid>` and keeps it.
  - A second load gives the same id.
  - A stored bare UUID gets a new `ahpw-<uuid>`.
  - A store that throws still gives `ahpw-<uuid>`.
- `pnpm typecheck` and `pnpm test` pass.
- On the test daemon, a reload keeps the same `ahpw-` id in the Clients list.

## Resume

