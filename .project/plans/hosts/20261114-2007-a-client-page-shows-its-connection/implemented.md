---
title: A client page shows its connection - implemented
date: 2026-11-14
refs:
  - git://52cbef1 - the last code commit of the build
  - "[code://src/resources/clients/rows.ts](../../../../src/resources/clients/rows.ts) - every field read, and the helpers"
  - "[code://src/resources/clients/Page.tsx](../../../../src/resources/clients/Page.tsx) - the page"
---

The client page draws every field ahpd sends on a client row.
It says the client and its version, who signed in, where the socket came from and its claims.
It shows whether the connection is alive, with the rate each way and the time since the last frames and ping.
It lists the channels, the resources and the sessions, and the explorer row says the client and *idle*.

## What was built

- [`code://src/resources/clients/rows.ts`](../../../../src/resources/clients/rows.ts) - `factsOf` reads every field, `subscriptions` included; `clientWords`, `whoOf`, `lineOf`, `isIdle` and `rateOf`.
- [`code://src/resources/clients/Page.tsx`](../../../../src/resources/clients/Page.tsx) - the facts, *Traffic* with the rate and the times, the three lists, and the *idle* badge.
- [`code://src/resources/clients/Explorer.tsx`](../../../../src/resources/clients/Explorer.tsx) - the line with the client and version, and a quiet dot when idle.
- `src/i18n/en.json`, `pt.json` and `es.json` - the new `clients` keys.

## Verified

- `pnpm typecheck` passes, and the ahpw suite passes: 927 cases, 7 of them new in `rows.test.ts`.
- By hand on a daemon from the ahpd branch `host/20261114-1602-a-client-row-says-when-it-last-moved`, with a probe client: every fact it sent showed at 1280 and 800 pixels wide.
- The badge turned *idle* and the explorer dot went quiet after 60 seconds with no frame; the rate read 0 B/s.
- ahpw's own connection listed the 3 channels it follows.
- Softov validated the page on 2026-11-14.

## Departures from the plan

- A still rate reads zero after one host tick, which the plan did not say.

## Left for later

- The lists of resources and sessions were not seen by hand: the probe signed in to nothing and joined no session.
