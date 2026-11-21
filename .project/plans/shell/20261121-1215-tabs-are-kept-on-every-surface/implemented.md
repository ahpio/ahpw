---
title: Tabs are kept on every surface, and a window works - implemented
date: 2026-11-21
refs:
  - git://602d21c - the last code commit before this record
  - "[code://src/shell/tabs.ts](../../../../src/shell/tabs.ts) - `keepTabs` on every kept surface"
  - "[code://src/shell/view/keys.ts](../../../../src/shell/view/keys.ts) - keys on each window"
  - "[code://src/resources/sessions/beside.ts](../../../../src/resources/sessions/beside.ts) - `beside` from the tab's surface"
---

With scena 0.8.0, the tabs of `main`, the right sidebar and each window come back after a reload, each where it was.
Keys work in a window.
A session page is beside the focused session while its tab is on the right sidebar, and a drag of the tab changes that.

## What was built

- [`code://src/shell/tabs.ts`](../../../../src/shell/tabs.ts) - keeps and reopens the three kinds of surface; leaves out a view `mountRight` holds on the sidebar; saves the title only.
- [`code://src/shell/right-sidebar.ts`](../../../../src/shell/right-sidebar.ts) - `isView`.
- [`code://src/shell/view/keys.ts`](../../../../src/shell/view/keys.ts) - listens on each window from `scena:window:opened` to `scena:window:closed`.
- [`code://src/resources/sessions/beside.ts`](../../../../src/resources/sessions/beside.ts) - `surfaceOf`, `useMountSurface`, `isBeside`; `SessionPage` reads them, and `ahp.openSession` no longer sets `beside`.
- The bot chat's deferred drag is closed, and the `items` brief names what scena 0.8.0 and this plan built.

## Verified

- `tsc -b` and the tests (1066) pass. New: cases in `src/shell/tabs.test.ts`, and `src/shell/view/keys.test.ts`, `src/resources/sessions/beside.test.ts`.
- Not checked by hand against a host yet.

## Departures from the plan

- The saved props hold the title only, as the old `KeptMount.title` did, so a reopened tab shows the component's current icon.
- `beside.test.ts` checks `surfaceOf` and `isBeside`, not the hook: ahpw has no React test library.

## Left for later

- The check by hand against a host: a session dragged to the sidebar and to a window, a reload, a key in a window.
