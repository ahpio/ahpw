---
title: A session row drags to a surface or a composer - implemented
date: 2026-11-21
refs:
  - git://61a4687 - the row drag
  - "[code://src/resources/sessions/composer-drop.ts](../../../../src/resources/sessions/composer-drop.ts) - `asAttachment` and the composer's drop area"
  - "[code://src/shell/explorer/ExplorerList.tsx](../../../../src/shell/explorer/ExplorerList.tsx) - `onRowDragStart`"
---

A row of the session list drags.
On a surface, the session opens where it falls, or its tab moves there.
On a composer, a session (row or tab) becomes a chat reference, and a file tab becomes a file attachment.
The tab stays where it was.

## What was built

- [`code://src/shell/explorer/ExplorerList.tsx`](../../../../src/shell/explorer/ExplorerList.tsx) - `onRowDragStart`; a row drags when it is given.
- [`code://src/resources/sessions/Explorer.tsx`](../../../../src/resources/sessions/Explorer.tsx) - a row starts scena's open drag: the session key, its `SessionPage` node, its title path.
- [`code://src/resources/sessions/composer-drop.ts`](../../../../src/resources/sessions/composer-drop.ts) - `asAttachment`, and a scena drop area read before the host file and the computer's files; Shift on a file tab also writes `@path`.
- [`code://src/resources/sessions/Composer.tsx`](../../../../src/resources/sessions/Composer.tsx) - passes its own session, which it does not take.

## Verified

- `tsc -b`, the tests (1071) and the build pass. New: two cases in `src/shell/explorer/ExplorerList.test.ts`, and `asAttachment` in `src/resources/sessions/composer-drop.test.ts`.
- Not checked by hand against a host yet.

## Departures from the plan

- `ExplorerList.test.ts` existed; the row cases joined its `shownRows` cases.
- `onRowDragStart` takes the row, not its key.
- A session dropped on the new session box (`New.tsx`) is taken too: that composer has no session of its own to refuse.

## Left for later

- The check by hand against a host.
- A file row of the folder explorer still uses `application/x-ahpw-host-file`, as the `items` brief notes.
