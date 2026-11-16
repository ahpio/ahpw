---
title: Blocks drawn in the preview
status: done
depends: [task-03-the-live-preview-extension.md]
layer: "editor"
refs:
  - "[code://src/shell/markdown/Markdown.tsx](../../../../src/shell/markdown/Markdown.tsx) - the Markdown wrapper, which draws tables, code and mermaid"
  - "[code://src/resources/editor/livePreview.ts](../../../../src/resources/editor/livePreview.ts) - the preview this task adds blocks to"
---

## Objective

The preview draws tables, fenced code and mermaid diagrams, and shows their Markdown where the person edits them.

## Files

- `UPDATE: src/resources/editor/livePreview.ts` - a state field that replaces each block with its drawing, away from the caret.
- `UPDATE: src/resources/files/MarkdownPage.tsx` - draw a block's Markdown with the Markdown wrapper.
- `UPDATE: src/resources/editor/livePreview.test.ts` - a block is drawn away from the caret, and is text with the caret in it.

## Steps

1. Replace each table and fenced block with a block widget, away from the caret's lines.
2. Draw the widget with the Markdown wrapper on the block's own text.
3. Measure the block's line again when its drawing changes height.
4. Keep the block as text while a caret is in it.

## Validation

- `src/resources/editor/livePreview.test.ts`: a table and a fenced block are widgets away from the caret, and text with the caret in them.
- A locked file shows its mermaid diagram, its table and its code drawn.

## Resume

Built on 2026-11-15.
- Each block is drawn with the Markdown wrapper, so mermaid draws as on the simple page.
- Every line of a block with a caret in it shows as source.
