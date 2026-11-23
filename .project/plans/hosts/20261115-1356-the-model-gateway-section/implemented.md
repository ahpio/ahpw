---
title: The model gateway section - implemented
date: 2026-11-22
refs:
  - git://113d3fe - the merge of ahpw #92
  - "[code://src/resources/host/sections.ts](../../../../src/resources/host/sections.ts) - the section `modelGateway`"
  - "[code://src/resources/usage/words.ts](../../../../src/resources/usage/words.ts) - `sourceIcon` and `sourceWord`"
---

The host's settings have a *Model gateway* section, with the key `modelGateway` only, and a usage record from the gateway names it as the gateway.

## What was built

- [`code://src/resources/host/sections.ts`](../../../../src/resources/host/sections.ts) - the section `modelGateway`.
- [`code://src/resources/usage/words.ts`](../../../../src/resources/usage/words.ts) - `sourceIcon` and `sourceWord`, moved from `Records.tsx`, with `words.test.ts`.
- The label in English, Spanish and Portuguese, and the `usage/record/sources` label `gateway`.

## Verified

- Task 01 was built on 2026-11-15 and merged in #92. The audit of 2026-11-22 found the section on main.

## Departures from the plan

- The source icon and word moved to `usage/words.ts`, as the plan's *Resume state* records. In the manifest test, `project` is `Pr` now that no `proxy` shares its start.

## Left for later

- None.
