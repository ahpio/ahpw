---
title: A client page shows its connection
domain: hosts
status: built
priority: medium
created: 2026-11-14
revalidated: 2026-11-14
requires:
  - plans/hosts/20261103-1313-tunnels-and-clients-in-explorers/plan.md
refs:
  - git://1ef0ac5 - the commit of ahpw main the plan was checked at
  - git://41ef99c - the last commit that holds the brief `a-client-page-shows-its-connection`
  - "[code://src/resources/clients/rows.ts](../../../../src/resources/clients/rows.ts) - `ClientFacts`, `factsOf` and `lineOf`, which read the row"
  - "[code://src/resources/clients/Page.tsx](../../../../src/resources/clients/Page.tsx) - the client page, its facts, its traffic and its list of channels"
  - "[code://src/resources/clients/Explorer.tsx#L40-L50](../../../../src/resources/clients/Explorer.tsx#L40-L50) - the explorer row: its dot and its line"
  - "[code://src/resources/sessions/clock.ts](../../../../src/resources/sessions/clock.ts) - `useNow`, the shared clock that moves once a second"
  - "[code://src/bridges/words.ts#L54-L65](../../../../src/bridges/words.ts#L54-L65) - `elapsed`, a length of time as `5m13s`"
  - "[code://src/resources/usage/Records.tsx#L82](../../../../src/resources/usage/Records.tsx#L82) - a session opened with `ahp.openSession`"
  - https://github.com/ahpio/ahpd/blob/85d3b01ee/docs/plugins/PLUGINS.md - the `x-ahpd-clients` section, which names every field of a row
  - https://github.com/ahpio/ahpd/tree/main/.project/plans/host/20261114-1602-a-client-row-sends-what-the-host-holds - the ahpd plan that sends the held fields, built
  - https://github.com/ahpio/ahpd/tree/main/.project/plans/host/20261114-1602-a-client-row-says-when-it-last-moved - the ahpd plan that sends the times, the refusals and the upgrade headers
---

## Goal

The client page says more about a connection than its id, address, protocol, connect time and counters.
It shows the client and its version, who signed in, where the socket came from, and the claims it made.
It shows whether the connection is alive: the rate each way, when a frame last crossed, the last ping, the queue and the refusals.
It lists the channels it follows, the resources it signed in to and the sessions it is in.
The explorer row says the client and its version, and turns *idle* after 60 seconds with no frame.

## Reconnaissance

The files read and the patterns to reuse are the `refs` in the frontmatter, each with its note.
The brief `a-client-page-shows-its-connection` holds the research, and this plan replaces it.

### Searches performed

- `rg "watching" src/resources/clients` - `factsOf` reads `record.watching`, and ahpd sends `subscriptions`, so the list of channels is never drawn.
- `rg "useNow" src` - `src/resources/sessions/clock.ts` already shares the clock, so nothing moves out of `Status.tsx`.
- `rg "ahp.openSession" src` - a page opens a session with `{ host, resource }`.

### Runtime path

```
ahpd row (x-ahpd-clients) -> clientsReducer -> factsOf -> Page facts, traffic, lists / Explorer dot and line
```

### Gaps

- `factsOf` reads `watching`, not `subscriptions`.
- No field of the two ahpd plans is read.
- The page has no clock, so no time since an event moves.

## Answers

| What | Source | Task |
| --- | --- | --- |
| ahpd sends every field first, and this plan draws them all | Softov, 2026-11-14: "do the ahpd first then ahpw" | 01, 02 |
| *Traffic* shows a rate each way, from two counter updates | Softov, 2026-11-14: "Show rates" | 01, 02 |
| The client and its version show on the page and on the explorer line | Softov, 2026-11-14: "Page and explorer line" | 01, 02 |
| A connection is *idle* after 60 seconds with no frame either way | Softov, 2026-11-14: "60 seconds" | 01, 02 |
| `factsOf` reads `subscriptions`; `watching` stays the name inside ahpw | (defaulted: ahpd names the field so in `PLUGINS.md`) | 01 |
| The title is the client's title, else its name, else its id | (defaulted: the brief's order) | 01 |
| A row with `root` and no person reads *Host token* | (defaulted: the brief's wording) | 01 |
| Each new fact is drawn only when its field is present | [code://src/resources/clients/Page.tsx#L20-L35](../../../../src/resources/clients/Page.tsx#L20-L35) | 02 |
| `userAgent`, `origin` and `forwardedFor` are marked as claims | (defaulted: ahpd's docs call them claims) | 02 |
| The queue reads as bytes of the limit, with a warning tone past half | (defaulted: the brief's wording) | 02 |
| A rate reads zero once the counters stand still past one host tick | (defaulted: the host sends no row while they stand still) | 02 |
| A session in the list opens with `ahp.openSession` | [code://src/resources/usage/Records.tsx#L82](../../../../src/resources/usage/Records.tsx#L82) | 02 |

## Proposed architecture

- **Data flow** - `factsOf` reads every field of a row. Pure helpers in `rows.ts` give the line, the client words, whether the row is idle, and the rate between two counter readings.
- **Event flow** - unchanged: the row arrives on the 5-second tick.
- **State flow** - the page keeps the last counter reading in a ref, to work out the rate. `useNow` moves the times since an event once a second.
- **Layer responsibilities** - `rows.ts`: reading and words, with tests. `Page.tsx` and `Explorer.tsx`: drawing. i18n: the labels in three languages.
- **Source-of-truth files** - [`code://src/resources/clients/rows.ts`](../../../../src/resources/clients/rows.ts)

### The page

| Section | What it holds, each only when present |
| --- | --- |
| Head | The title, and a badge: *this app*, *connected*, or *idle* |
| Facts | Client (`ahpc 0.9.0`), client id, signed in as or *Host token*, roles, team, sign-in until, address, path, node, forwarded for, user agent and origin as claims, protocol, language, connected with *new* or *resumed*, capabilities, channels followed |
| Traffic | Rate in and out, last frame in and out as time since, last ping as time since, frames and bytes each way, queue as bytes of the limit, refused |
| Lists | Channels it follows, resources it signed in to, sessions it is in, each session a link |

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - A row reads every field](task-01-a-row-reads-every-field.md) | done | - |
| [02 - The page and the row draw them](task-02-the-page-and-the-row-draw-them.md) | done | 01 |

## Risks and tradeoffs

- A rate is blank until the second counter update, 5 seconds after the page opens.
- A host without the ahpd plans built sends fewer fields, and the page draws fewer facts.

## Resume state

- **Done so far:** tasks 01 and 02 done on 2026-11-14, as [implemented.md](implemented.md) says. Softov validated the page.
- **Next action:** none.
- **Open questions:** none.
- **Watch out for:** the field is `subscriptions` on the wire and `watching` in ahpw.

## Final verification checklist

- [x] `pnpm typecheck` and the ahpw suite pass.
- [x] On a daemon from the ahpd branch, the page shows every section, and the rate and the times move.
- [x] The badge turns *idle* after 60 seconds with no frame.
- [x] The page is checked at 1280 and at 800 pixels wide.
