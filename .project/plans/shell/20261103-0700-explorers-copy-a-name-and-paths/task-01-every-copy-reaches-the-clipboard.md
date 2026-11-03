---
title: Every copy reaches the clipboard
status: implemented
depends: []
layer: "ahpw resources"
refs:
  - "[code://src/shell/controls/CopyButton.tsx#L26-L30](../../../../src/shell/controls/CopyButton.tsx#L26-L30) - `copyText`, the one way to copy"
---

## Objective

Every copy in ahpw calls `copyText`, so it works on plain http, and a test keeps it that way.

## Files

- `UPDATE: src/resources/folders/actions.ts:83-86` - `copyPath` calls `copyText`, and fails when it answers false.
- `UPDATE: src/resources/automations/actions.ts:41` - Copy link calls `copyText`.
- `UPDATE: src/resources/log/LogPage.tsx:42` - `copy` calls `copyText`.
- `UPDATE: src/resources/computers/actions.ts:36` - Copy name calls `copyText`.
- `UPDATE: src/resources/sessions/Explorer.tsx:54` - Copy link calls `copyText`.
- `CREATE: src/shell/controls/clipboard.test.ts` - fails on a `navigator.clipboard` call outside `CopyButton.tsx`.

## Steps

1. Replace each direct `navigator.clipboard` call in the five files with `copyText`.
2. In `copyPath`, throw an error when `copyText` answers false, so the action's `failed` toast shows.
3. Write the test: read every `.ts` and `.tsx` file under `src`, and expect `navigator.clipboard` only in `CopyButton.tsx`.

## Validation

- `pnpm typecheck` passes.
- `src/shell/controls/clipboard.test.ts` passes.
- Add a direct call back, and check that the test fails.
- On `http://200.11.121.81:5180`, Copy path in Files copies the path and says "Path copied".

## Resume

- The five callers use `copyText`. `clipboard.test.ts` passes, and it fails when a direct call is added back.
- Headless Chrome on a non-secure origin (`http://e2e.test:5191`, where `navigator.clipboard` is undefined) copied each path through the fallback and showed the toast.
- The check on Softov's own browser is in [explorers-copy-checks.md](../../../pending/explorers-copy-checks.md).
