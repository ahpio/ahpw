---
title: The page and the row draw them
status: done
depends: [task-01-a-row-reads-every-field.md]
layer: "clients"
refs:
  - "[code://src/resources/clients/Page.tsx](../../../../src/resources/clients/Page.tsx) - the page"
  - "[code://src/resources/clients/Explorer.tsx](../../../../src/resources/clients/Explorer.tsx) - the explorer row"
  - "[code://src/resources/sessions/clock.ts](../../../../src/resources/sessions/clock.ts) - `useNow`"
---

## Objective

The client page draws every section *The page* in the plan lists, and the explorer row draws the client, the version and *idle*.

## Files

- `UPDATE: src/resources/clients/Page.tsx` - the facts, the traffic, the lists, the clock and the idle badge.
- `UPDATE: src/resources/clients/Explorer.tsx` - the row's line and its dot when idle.
- `UPDATE: src/i18n/en.json` - the new `clients` keys.
- `UPDATE: src/i18n/pt.json` - the same keys in Portuguese.
- `UPDATE: src/i18n/es.json` - the same keys in Spanish.

## Steps

1. Add each new fact to `factsList`, only when its field is present.
2. Mark the three claims in their labels.
3. Add the rate, the times since the last frames and the last ping, the queue and the refusals to *Traffic*.
4. Keep the last counter reading in a ref, and work out the rate from it.
5. Move the times once a second with `useNow`.
6. Add the lists of resources and of sessions beside the channels; open a session with `ahp.openSession`.
7. Show *idle* on the badge when `isIdle` holds.
8. Draw the explorer line with `lineOf`, and a quiet dot when the row is idle.
9. Add every new key in the three languages.
10. Check the page by hand on a daemon from the ahpd branch, at 1280 and 800 pixels wide.

## Validation

- The ahpw suite passes, and `pnpm typecheck` passes.
- By hand: every section shows on a running daemon, and the rate and the times move.
- By hand: the badge turns *idle* after 60 seconds with no frame.

## Resume

Built as the steps say. A connection with still counters got no rate at first. The host sends no row while nothing moves, so the rate now reads zero after one tick. The explorer reads the clock in 5-second steps, so the list is not drawn again each second.
