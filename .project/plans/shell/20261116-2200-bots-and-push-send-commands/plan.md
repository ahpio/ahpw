---
title: Bots and push devices are sent as commands
domain: shell
status: active
priority: high
created: 2026-11-16
revalidated: 2026-11-16
refs:
  - git://91356e61f - the ahpd commit the host facts were checked at; the host half is ahpd's plan `plugin/20261116-1940-bots-and-push-take-commands`
  - git://37ac7d0 - the ahpw main this builds on, with #96's talk opened from the bot
  - "[code://src/bridges/policies.ts](../../../../src/bridges/policies.ts) - `putPolicy`: a command when the host lists it, the resource method when not"
  - "[code://src/resources/bots/catalogue.ts](../../../../src/resources/bots/catalogue.ts) - the bot channel reducer, the writes and the talk"
  - "[code://src/shell/notify/push.ts](../../../../src/shell/notify/push.ts) - the push device writes"
  - "[code://src/shell/manage.ts](../../../../src/shell/manage.ts) - Sign out"
---

## Goal

ahpw makes, edits and removes a bot, and registers and removes its push device, with the `x-ahpd/bots/*` and `x-ahpd/push/*` commands when a host lists them.
It reads the bot channel in the shape a new host sends, and in the old one.
A person's talk with a bot comes from the channel record where the host sends it there.
Signing out takes the push device off the host first.

## Runtime path

```
bot form -> makeBot / editBot / deleteBot -> x-ahpd/bots/* (or resource write) -> host -> x-ahpd-bots/changed { id, record } -> botsReducer -> botsIn
open a bot's chat -> readBotChat -> the record's session where sendsTalks, else a read of the bot
push command -> pushOnHost / pushOffHost -> x-ahpd/push/* (or resource write)
Sign out -> disablePush -> sigillum.signout
```

## Answers

| What | Source | Task |
| --- | --- | --- |
| The resource methods stay as the fallback for a host without the commands | Softov, 2026-11-16: "We could keep the support the resource Read/Write while implementing the support that lacks. Then on 0.16 we can drop those if necessary." | 01, 02 |
| ahpw reads both bot channel shapes | Softov, 2026-11-16, "Read both shapes" | 01 |
| A push device registered by another person is refused, so Sign out takes it off first and push is off for the next person | Softov, 2026-11-16, "Refuse it" | 02 |
| This plan waits for #96, which changed the same file | Softov, 2026-11-16, "wait. its on PR now." | 01 |

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - bots-send-commands](task-01-bots-send-commands.md) | implemented | - |
| [02 - push-devices-send-commands](task-02-push-devices-send-commands.md) | implemented | - |

## Risks and tradeoffs

- A host built before ahpd's plan sends `{ bots }` - `botsIn` reads both, and `sendsTalks` keeps the read of the bot for its talk.
- Sign out turns push off - the next person on the browser turns it on as their own.

## Resume state

- **Done so far:** tasks 01 and 02 built on branch `shell/20261116-2200-bots-and-push-send-commands` on 2026-11-16, awaiting review. `pnpm typecheck` passes, and `pnpm test` passes 1007 tests.
- **Next action:** Softov's review against a host with ahpd's plan, then the pull request.

## Final verification checklist

- [ ] `pnpm typecheck` passes.
- [ ] `pnpm test` passes.
- [ ] By hand: a bot made, edited and deleted on a new host; its chat opens with no read of the bot.
