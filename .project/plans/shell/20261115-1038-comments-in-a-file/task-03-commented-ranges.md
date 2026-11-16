---
title: Commented ranges in the editor
status: done
depends: [task-02-the-comments-channel.md]
layer: "editor"
refs:
  - "git://ce8c410 - `src/resources/editor/shared.ts`, the people's marks, the pattern for comment marks"
---

## Objective

The editor marks each commented range, and puts a mark in the gutter on its first line.

## Files

- `CREATE: src/resources/editor/comments.ts` - a CodeMirror extension: a mark per open comment, a gutter mark, the comment in focus.
- `CREATE: src/resources/editor/comments.css` - the marks, on the theme's variables.
- `CREATE: src/resources/editor/comments.test.ts` - the decorations on an `EditorState`.

## Steps

1. Turn each comment's range, a line and a character, into offsets of the editor's text.
2. Mark each open comment's range, and an outdated comment's point.
3. Leave a resolved comment unmarked.
4. Put a gutter mark on the first line of each open comment.
5. Focus the thread when the person clicks the gutter mark.
6. Redraw the marks when the comments change.

## Validation

- `src/resources/editor/comments.test.ts`: two open comments and a resolved one draw two marks and two gutter marks.
- The same file: a range past the end of the text ends at the end of the text.
- `pnpm test src/resources/editor/comments.test.ts` passes.

## Resume

Built on 2026-11-15.
- An outdated comment draws a dashed bar where its words were, not a mark.
- ahpw's tests run with no DOM, so the marks and the gutter are counted on an `EditorState`.
