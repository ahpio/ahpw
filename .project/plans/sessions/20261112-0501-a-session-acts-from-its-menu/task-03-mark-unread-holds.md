---
title: Mark unread holds
status: implemented
depends: []
layer: "ahpw sessions"
refs:
  - "[code://src/resources/sessions/Page.tsx#L410-L414](../../../../src/resources/sessions/Page.tsx#L410-L414) - the effect that marks the session read whenever it is unread"
  - https://github.com/softov/ahpapp/blob/623fc9a44af641eaab9cf6f5d402159b2baadadb/src/useSession.ts#L386-L409 - ahpapp marks a session read once per visit
---

## Objective

The open session marks itself read once when it opens and once each time a turn ends while it is open.
A *Mark unread* holds until one of those happens.

## Files

- `CREATE: src/resources/sessions/read-marks.ts` - `marksRead(was, now)`, true when the session just opened or its count of ended turns grew.
- `CREATE: src/resources/sessions/read-marks.test.ts` - the open, a turn end, a second render with no change, and an unread status alone.
- `UPDATE: src/resources/sessions/Page.tsx:410-414` - mark read from `marksRead`, not from the unread status.

## Steps

1. Write `marksRead` from the resource and the count of ended turns, before and now.
2. Keep the last resource and count in the page with a ref.
3. Dispatch `session/isReadChanged` with `isRead: true` only when `marksRead` is true and the session is unread.
4. Keep a session beside another, in the right sidebar, from marking itself read, as today.

## Validation

- `src/resources/sessions/read-marks.test.ts` passes.
- `pnpm typecheck` and `pnpm test` pass.
- By hand: *Mark unread* from the list on the open session holds; the next turn's end marks it read.

## Resume
