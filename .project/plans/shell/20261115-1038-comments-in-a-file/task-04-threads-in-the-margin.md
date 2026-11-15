---
title: Threads in the margin
status: implemented
depends: [task-01-a-mockup-of-comments.md, task-03-commented-ranges.md]
layer: "files"
refs:
  - "[code://src/shell/NameMark.tsx](../../../../src/shell/NameMark.tsx) - a person's circle"
---

## Objective

The file page shows each thread beside its range, and the person adds, replies, resolves and deletes from there.

## Files

- `CREATE: src/resources/files/Threads.tsx` - the margin: threads, the reply box, the add box.
- `CREATE: src/resources/files/comments.css` - the margin's look, beside the component.
- `UPDATE: src/resources/files/SharedFilePage.tsx` - the margin beside the editor, and the add-comment button on a selection.
- `UPDATE: src/i18n/en.json` - the margin's words, and the same keys in each other catalog.

## Steps

1. Draw each thread at the height of its range's first line, in the order of the text.
2. Draw each entry with the person's circle, name and time from `_meta.ahpd`, and its text as Markdown.
3. Draw the reply box, and icon buttons with titles for resolve, reopen and delete.
4. Fold a resolved thread to one line, and mark an outdated one.
5. Show an add-comment icon button when the person selects text, and a box for the first entry.
6. At narrow widths, place the threads where the approved mockup puts them.
7. Compare each screen with the approved mockup, and stop and ask on any difference.

## Validation

- Two browsers on one file: a comment, a reply and a resolve in one show in the other.
- One browser types above a comment, and the thread and its mark stay on their words in both.
- Each screen matches the approved mockup at 1280 and 760 wide, in both themes.
- `pnpm typecheck`, `pnpm test` and `pnpm build` pass.

## Resume

Built on 2026-11-15.
- The component file is `Threads.tsx`: `src/source-names.test.ts` refuses `Comments.tsx` beside `comments.ts`.
- At narrow widths the open thread is a block widget under its range's last line, as the mockup shows.
- The outdated badge says "Outdated", and the new comment box says "Comment on the selection", as the mockup does.
- A two-browser run found a comment moved two lines when the other browser typed above it. The host sent the moved range before the edit; plan C's host now sends the edit first.
- The two-browser run passed at 1280 and 760 wide, light and dark, and at 600 wide for the thread under its line.
- Softov's test found the threads far from their lines, and some not shown. Each thread had a reply box, so each one pushed the next one down. Now only the open thread has the reply box, and it sits at its line.
- The margin clips with `overflow: clip`: with `overflow: hidden`, a thread that took focus scrolled the margin and moved every thread.
- The editor gets room below its last line for threads pushed past the end of the text.
- Softov's test on 2026-11-15 showed an agent's comment with `agent` as its author, and the comments made in VS Code beside ahpw's.
- A resolved thread reopens with ↺, apart from ✓ for resolve.
