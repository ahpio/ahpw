---
title: The Markdown view is a live preview - implemented
date: 2026-11-16
refs:
  - git://2653557a3 - the merge of ahpio/ahpw#90
  - "[code://src/resources/editor/livePreview.ts](../../../../src/resources/editor/livePreview.ts) - the live preview extension"
  - "[code://src/resources/files/MarkdownPage.tsx](../../../../src/resources/files/MarkdownPage.tsx) - the Markdown page"
---

Show as Markdown opens the shared editor drawn as a page, and people edit it live.
The caret's line shows its Markdown, and tables, code blocks and diagrams are drawn whole.

## What was built

- [`code://src/resources/editor/livePreview.ts`](../../../../src/resources/editor/livePreview.ts) - the decorations for headings, emphasis, lists, task boxes, links, quotes and images, and the blocks drawn whole.
- [`code://src/resources/files/MarkdownPage.tsx`](../../../../src/resources/files/MarkdownPage.tsx) - the page, which draws the images and blocks through React portals.
- [`code://src/resources/files/SimpleMarkdown.tsx`](../../../../src/resources/files/SimpleMarkdown.tsx) - the rendered page, for a host without shared files.
- [`code://src/resources/files/comments-shown.ts`](../../../../src/resources/files/comments-shown.ts) - the *When I open a file* setting, for the comments folded away or shown.
- [`code://src/resources/editor/languages.ts`](../../../../src/resources/editor/languages.ts) - Markdown loads as GitHub's dialect.

## Verified

- `src/resources/editor/livePreview.test.ts`.
- The suite at the PR: 986 pass.
- Two browsers at 1280 and 760 wide in both themes, and Softov's own test.

## Departures from the plan

- Tasks 05 and 06 were added during the build. Comments fold away behind 💬, with a card by the line, and tables, code blocks and mermaid are drawn whole.
- The open margin lies over the editor's right side, as Softov asked on 2026-11-15.
- ahpio/ahpw#91 later added `<img>` tags and line wrap to the preview.
- ahpio/ahpw#93 later joined a paragraph's lines and drew images at full width. It also added heading and `---` rules, and kept each image's height on a scroll.

## Left for later

- Editing a table cell by cell, in the brief `.project/briefs/live-preview-blocks.md`.
