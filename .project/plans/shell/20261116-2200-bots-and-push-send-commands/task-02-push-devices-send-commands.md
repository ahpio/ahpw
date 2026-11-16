---
title: Push devices send commands
status: implemented
depends: []
layer: "notify"
refs:
  - "[code://src/shell/notify/push.ts](../../../../src/shell/notify/push.ts) - the device writes"
  - "[code://src/shell/manage.ts](../../../../src/shell/manage.ts) - Sign out"
---

## Objective

The push device is registered and removed with `x-ahpd/push/put` and `/remove` when the host lists them, and Sign out takes it off first.

## Files

- `UPDATE: src/shell/notify/push.ts` - `pushOnHost`, `pushOffHost`, `enablePush`, `disablePush` and `switchAudience` take the host's offers and send the command.
- `UPDATE: src/shell/notify/index.ts` - pass the window host's offers.
- `UPDATE: src/shell/manage.ts` - Sign out calls `disablePush` before `sigillum.signout`.
- `UPDATE: src/shell/notify/push.test.ts` - the command path.

## Steps

1. Send `x-ahpd/push/put` with the install id and the device in `pushOnHost` when the offers list it.
2. Send `x-ahpd/push/remove` in `pushOffHost` when the offers list it.
3. Pass the offers from each caller.
4. Call `disablePush` in Sign out while push is on, then sign out.

## Validation

- `push.test.ts`: on and off by command, with no resource call.
- `pnpm test` passes.

## Resume

Built on 2026-11-16.
