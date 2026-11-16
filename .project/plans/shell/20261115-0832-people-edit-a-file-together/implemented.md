---
title: People edit a file together - implemented
date: 2026-11-16
refs:
  - git://7496ed4b4 - the merge of ahpio/ahpw#87
  - "[code://src/resources/files/document.ts](../../../../src/resources/files/document.ts) - the client of a shared resource"
  - "[code://src/resources/files/SharedFilePage.tsx](../../../../src/resources/files/SharedFilePage.tsx) - the shared file page"
---

A file opens as a shared resource, with the people in it and their carets live.
It opens locked; after ✎ each edit reaches the others at once, or on 💾, as the person chooses.

## What was built

- [`code://src/resources/files/document.ts`](../../../../src/resources/files/document.ts) - the client of `x-ahpd-shared`: one change in flight, and remote changes moved past the person's own.
- [`code://src/resources/editor/shared.ts`](../../../../src/resources/editor/shared.ts) - carets and remote edits in CodeMirror, each caret with its person's name.
- [`code://src/resources/files/SharedFilePage.tsx`](../../../../src/resources/files/SharedFilePage.tsx) - the page: the people, ✎ and 🔒, "Saved" or "Saving", and Live save or Manual save.
- [`code://src/resources/files/save-mode.ts`](../../../../src/resources/files/save-mode.ts) - the save mode, and the *When I edit a file* setting that picks its default.
- [`code://src/bridges/data.ts`](../../../../src/bridges/data.ts) - `follow` and `dispatchAndWait` for the channel.

## Verified

- `src/resources/editor/shared.test.ts` and `src/resources/files/document.test.ts`.
- The suite at the PR: 958 pass.
- A test daemon with ahpio/ahpd#341, in two browsers.

## Departures from the plan

- Softov's notes after his test on 2026-11-15 were built on the same branch. A file opens locked until ✎, the save is Live or Manual with a setting, and each person is a circle marked with what they are.

## Left for later

- None.
