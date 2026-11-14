---
title: A row reads every field
status: todo
depends: []
layer: "clients"
refs:
  - "[code://src/resources/clients/rows.ts](../../../../src/resources/clients/rows.ts) - `ClientFacts` and `factsOf`"
---

## Objective

`factsOf` reads every field ahpd sends on a client row, and `rows.ts` gives the words the page and the explorer draw.

## Files

- `UPDATE: src/resources/clients/rows.ts` - read every field, and add the helpers for the line, the client, idle and the rate.
- `UPDATE: src/resources/clients/rows.test.ts` - cases for each field and each helper.

## Steps

1. Read `subscriptions` into `watching`.
2. Read `clientVersion`, `clientTitle`, `capabilities`, `root`, `roles`, `team` and `principalUntil`.
3. Read `path`, `node`, `userAgent` and `origin`.
4. Read `authenticated`, `sessions`, `queuedBytes` and `queueLimit`.
5. Read `lastIn`, `lastOut`, `lastPing`, `arrival` and `refused`.
6. Make `titleOf` answer the client's title, else its name, else its id.
7. Add `clientWords`, which answers the name or title and the version.
8. Make `lineOf` answer the client words, the person or *Host token*, and the address.
9. Add `IDLE_AFTER_MS` at 60 seconds, and `isIdle`, which is true when the last frame either way is older.
10. Add `rateOf`, which answers bytes a second each way from two counter readings.
11. Write the test cases.

## Validation

- `src/resources/clients/rows.test.ts`: a row with `subscriptions` gives `watching`, and `factsOf` reads each new field.
- The same file: `lineOf`, `clientWords`, `isIdle` and `rateOf` each have cases.
- `pnpm typecheck` passes.

## Resume
