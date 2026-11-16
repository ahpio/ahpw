---
title: Comments in a file - implemented
date: 2026-11-16
refs:
  - git://7b0cae0d0 - the merge of ahpio/ahpw#89
  - "[code://src/resources/files/Threads.tsx](../../../../src/resources/files/Threads.tsx) - the threads in the margin"
  - "[code://src/resources/editor/comments.ts](../../../../src/resources/editor/comments.ts) - the commented ranges in the editor"
---

People comment on a range of a file, reply, resolve and delete, in a margin beside the text.
Comments made in VS Code sessions and by agents show beside the file's own.

## What was built

- [`code://src/resources/files/comments.ts`](../../../../src/resources/files/comments.ts) - the client of the file's comments channel.
- [`code://src/resources/editor/comments.ts`](../../../../src/resources/editor/comments.ts) - each comment's words marked, a pill on hover, and a click that opens its thread.
- [`code://src/resources/files/Threads.tsx`](../../../../src/resources/files/Threads.tsx) - the threads in the margin, or under their line at narrow widths. ✓ resolves, ↺ reopens and ✕ deletes after a confirm.
- [`code://src/shell/notify/ContainedModal.tsx`](../../../../src/shell/notify/ContainedModal.tsx) - `ContainedModal` and `ContainedConfirm`, a modal held inside one component.

## Verified

- `src/resources/editor/comments.test.ts` and `src/resources/files/comments.test.ts`.
- The suite at the PR: 976 pass.
- Two browsers at 1280 and 760 wide in both themes, 600 wide for a thread under its line, and VS Code on a real host.

## Departures from the plan

- Softov's notes of 2026-11-15 were built on the same branch. A click on the words highlights the card, and a click on the card highlights the words.
A pill on hover opens or deletes a comment, and ✕ asks inside the card.
- `ContainedModal` is a new shared component, made for the confirm before a delete.

## Left for later

- None.
