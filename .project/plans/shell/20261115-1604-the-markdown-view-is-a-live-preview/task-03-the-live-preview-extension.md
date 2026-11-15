---
title: The live preview extension
status: todo
depends: [task-01-a-mockup-of-the-live-preview.md]
layer: "editor"
refs:
  - "[code://src/resources/editor/comments.ts](../../../../src/resources/editor/comments.ts) - decorations and widgets over the text"
  - npm://@codemirror/lang-markdown@^6.5.2 - the syntax tree, with GFM
---

## Objective

A CodeMirror extension draws Markdown styled, and hides its markers away from the caret's line.

## Files

- `CREATE: src/resources/editor/livePreview.ts` - the extension: marks, hidden markers and widgets from the syntax tree.
- `CREATE: src/resources/editor/livePreview.css` - the styles of the parts.
- `CREATE: src/resources/editor/livePreview.test.ts` - the decorations for each part, on an `EditorState`.

## Steps

1. Read the syntax tree of the visible lines, and skip the lines that hold a caret or a selection.
2. Size the headings, and style bold, italic, code spans and strikethrough.
3. Hide each part's markers with replace decorations.
4. Draw bullets and task boxes as widgets; a click on a box writes `[x]` or `[ ]` into the text.
5. Show a link as its text, and open it on Mod-click; show an image as a widget under its line.
6. Draw a quote with a bar.
7. Leave tables, fenced code and mermaid as their source.

## Validation

- `src/resources/editor/livePreview.test.ts`: each part has its marks, and its markers are hidden off the caret's line.
- The same file: the caret's line keeps its markers.
- The same file: a task box click changes `[ ]` to `[x]`.

## Resume
