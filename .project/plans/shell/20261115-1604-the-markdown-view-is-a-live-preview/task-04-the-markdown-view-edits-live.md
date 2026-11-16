---
title: The Markdown view edits live
status: implemented
depends: [task-02-the-simple-markdown-page.md, task-03-the-live-preview-extension.md]
layer: "files"
refs:
  - "[code://src/resources/files/SharedFilePage.tsx](../../../../src/resources/files/SharedFilePage.tsx) - the shared editor, its people and its comments"
---

## Objective

"Show as Markdown" opens the shared editor with the live preview, locked until ✎.

## Files

- `UPDATE: src/resources/files/MarkdownPage.tsx` - open `SharedFilePage` with the live preview, or `SimpleMarkdown`.
- `UPDATE: src/resources/files/SharedFilePage.tsx` - take extra editor extensions, such as the live preview.
- `UPDATE: src/i18n/en.json` - the read-only note, and the same keys in each other catalog.

## Steps

1. Give `SharedFilePage` a prop for extra extensions, and pass `livePreview` from `MarkdownPage`.
2. Open `SimpleMarkdown` for a read-only file, or on a host with no shared files.
3. Keep the comments margin, the people and the lock as in Text.
4. Compare each screen with the approved mockup, and stop and ask on any difference.

## Validation

- Two browsers on one Markdown file in the preview: edits and carets show in both.
- A comment on the preview's words shows in the margin.
- Each screen matches the approved mockup at 1280 and 760 wide, in both themes.
- `pnpm typecheck`, `pnpm test` and `pnpm build` pass.

## Resume

Built on 2026-11-15.
- The page renders the images and the drawn blocks into the editor's elements through portals, so they have its context.
- Checked in a browser at 1280 and 760 wide, light and dark: the page, the caret's line, a task box written to disk.
