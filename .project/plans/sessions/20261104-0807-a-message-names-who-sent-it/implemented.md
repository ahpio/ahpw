---
title: A message names who sent it - implemented
date: 2026-11-04
refs:
  - git://16b2185
  - "[code://src/resources/sessions/origin.ts](../../../../src/resources/sessions/origin.ts)"
  - "[code://src/resources/sessions/Page.tsx](../../../../src/resources/sessions/Page.tsx)"
---

A message with origin `automation` or `tool` keeps its bubble, with a chip over it that names the sender and opens it.

## What was built

- [`code://src/resources/sessions/origin.ts`](../../../../src/resources/sessions/origin.ts) - `Source` has the scopes `agent` and `automation`; `askOf` takes the chat and session origins; `opens` says whether a chip can open its source.
- [`code://src/resources/sessions/Page.tsx`](../../../../src/resources/sessions/Page.tsx) - `FromChip` draws the words of each scope, and a plain chip when nothing can open; `openSource` picks the parent chat or runs `ahp.openAutomation`.
- `src/i18n/en.json`, `es.json`, `pt.json` - `fromAgent`, `fromAutomation`, `openParent` and `openAutomation`.

## Verified

- `src/resources/sessions/origin.test.ts`: 15 cases pass.
- `pnpm typecheck` (tsc -b), `pnpm test` (740 passed) and `pnpm build` pass.
- On the host at port 37537, at 1400 and 420 px, a subagent chat's first message showed "From the parent agent". A click opened the parent chat.
- Softov checked the automation chip on 2026-11-04: it showed, and a click opened the automation.

## Departures from the plan

- none.

## Left for later

- After an ahpd restart the chip is gone, because ahpd keeps the automation origin only in memory. See the ahpd brief `an-automation-session-keeps-its-origin`.
