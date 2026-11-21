---
title: Beside follows the tab
status: todo
depends: []
layer: "sessions"
refs:
  - "[code://src/resources/sessions/Page.tsx#L260-L285](../../../../src/resources/sessions/Page.tsx#L260-L285) - `SessionPage` and its `beside` prop"
  - "[code://src/resources/sessions/index.ts#L280-L290](../../../../src/resources/sessions/index.ts#L280-L290) - `ahp.openSession` with `beside: true`"
---

## Objective

A session page is beside the focused session while its tab is on the right sidebar.
On `main` or in a window, it is the focused session.
A drag of its tab changes it.

## Files

- `UPDATE: src/resources/sessions/Page.tsx:260-285` - derive `beside` from the surface of its mount.
- `UPDATE: src/resources/sessions/index.ts:280-290` - stop passing `beside: true`.
- `CREATE: src/resources/sessions/beside.test.ts` - the derivation.

## Steps

1. Write `useMountSurface(key)`, which follows `scena:mount:opened` and `scena:mount:closed` for one key.
2. In `SessionPage`, set `beside` to whether that surface is `sidebar:right`.
3. Read the `beside` prop until the hook finds the surface.
4. Remove `beside: true` from `ahp.openSession`.

## Validation

- `src/resources/sessions/beside.test.ts`: a session mount moved to the right sidebar reads beside; moved to `main` or a window, it does not.
- `npx vitest run` passes.

## Resume
