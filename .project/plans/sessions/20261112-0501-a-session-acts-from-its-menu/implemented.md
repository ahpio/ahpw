---
title: A session acts from its menu - implemented
date: 2026-11-12
refs:
  - git://9ff65e1
  - "[code://src/resources/sessions/acts.ts](../../../../src/resources/sessions/acts.ts)"
  - "[code://src/resources/sessions/archived.ts](../../../../src/resources/sessions/archived.ts)"
  - "[code://src/resources/sessions/read-marks.ts](../../../../src/resources/sessions/read-marks.ts)"
---

An open session's `...` menu has a *Session* group with the acts the session list's menu has.
A session archived while it is open closes its tab, unless *Archived session* is set to *Stay open*.
*Mark unread* on an open session holds until the session opens again or its turn ends.

## What was built

- [`code://src/resources/sessions/acts.ts`](../../../../src/resources/sessions/acts.ts) - `sessionActs`: pin, rename, mark read, archive, copy link and delete, for both menus.
- [`code://src/resources/sessions/SessionHeader.tsx`](../../../../src/resources/sessions/SessionHeader.tsx) - the *Session* group after *Display*; a delete closes the tab.
- [`code://src/resources/sessions/archived.ts`](../../../../src/resources/sessions/archived.ts) - `closesOnArchive`, true only for a change to archived with *Close*.
- [`code://src/resources/sessions/view-settings.ts`](../../../../src/resources/sessions/view-settings.ts) - `ARCHIVED_SESSION_OPEN`, kept in the browser, *Close* by default.
- [`code://src/resources/sessions/read-marks.ts`](../../../../src/resources/sessions/read-marks.ts) - `marksRead`, true when the session opens or stops working.

## Verified

- `acts.test.ts`, `archived.test.ts` and `read-marks.test.ts`, 10 tests. `pnpm typecheck` and `pnpm test` pass, 856 tests.
- On a test daemon at ahpd cc4002706, the header's menu showed *Session* after *Display*, with the six acts.
- Opening a session marked it read. *Mark as unread* held for four seconds. The next turn's end marked it read.
- *Archive* from the header closed the tab. A session opened from the archived list stayed open.
- With *Stay open*, an archive kept the tab. *Delete* asked first, then closed the tab.
- The setting showed under *Interface › Session*. No command was added to the palette.

## Departures from the plan

- The read mark follows the session's summary, not the count of ended turns. The host marks a session unread in the summary update that ends its turn. The turn count can change before that update, so a mark on it went out before the unread and was lost.
