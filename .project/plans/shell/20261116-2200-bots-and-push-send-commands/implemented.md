---
title: Bots and push devices are sent as commands - implemented
date: 2026-11-16
refs:
  - git://ef1e5161d - the merge of ahpio/ahpw#99
  - "[code://src/resources/bots/catalogue.ts](../../../../src/resources/bots/catalogue.ts)"
  - "[code://src/shell/notify/push.ts](../../../../src/shell/notify/push.ts)"
  - "[code://src/shell/manage.ts](../../../../src/shell/manage.ts)"
---

ahpw makes, edits and removes a bot, and registers and removes its push device, with the `x-ahpd/bots/*` and `x-ahpd/push/*` commands where a host lists them. It reads the bot list in either shape, and takes a person's talk from the record where the host sends it.
Sign out takes the push device off first.

## What was built

- [`code://src/resources/bots/catalogue.ts`](../../../../src/resources/bots/catalogue.ts) - `botsIn`, `sendsTalks`, the reducer for both shapes, and the commands in each write.
- [`code://src/shell/notify/push.ts`](../../../../src/shell/notify/push.ts) - the push commands where the host's offers list them.
- [`code://src/shell/manage.ts`](../../../../src/shell/manage.ts) - Sign out takes the push device off first.

## Verified

- `pnpm typecheck`, `pnpm test` (1017) and `pnpm build` passed after the rebase, and CI on #99 passed.
- The checks by hand are in ahpd's `.project/pending/bots-and-push-commands-checks.md`, not yet run.

## Departures from the plan

- None.
