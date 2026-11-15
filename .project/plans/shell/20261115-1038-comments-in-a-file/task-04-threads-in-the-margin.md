---
title: Threads in the margin
status: todo
depends: [task-01-a-mockup-of-comments.md, task-03-commented-ranges.md]
layer: "files"
refs:
  - "[code://src/shell/NameMark.tsx](../../../../src/shell/NameMark.tsx) - a person's circle"
---

## Objective

The file page shows each thread beside its range, and the person adds, replies, resolves and deletes from there.

## Files

- `CREATE: src/resources/files/Comments.tsx` - the margin: threads, the reply box, the add box.
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
