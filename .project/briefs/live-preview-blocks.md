---
title: A table is edited cell by cell in the live preview
created: 2026-11-15
refs:
  - git://7b0cae0 - the commit of ahpw the facts were checked at
  - "[code://src/shell/markdown/Markdown.tsx](../../src/shell/markdown/Markdown.tsx) - the Markdown wrapper, which draws mermaid in the rendered page"
  - "[code://src/shell/markdown/Mermaid.tsx](../../src/shell/markdown/Mermaid.tsx) - `MermaidDiagram`, a diagram from its source"
  - https://help.obsidian.md/edit-and-read#Live+Preview - Obsidian draws tables, code blocks and diagrams in live preview
---

# A table is edited cell by cell in the live preview

Softov wants a table in the Markdown live preview to be edited as a grid. Plan `shell/20261115-1604-the-markdown-view-is-a-live-preview` draws tables, fenced code and mermaid, and shows a block's Markdown while the caret is in it.

## What others do

Obsidian's live preview draws each of the three in place of its source:

- a table as a grid, edited cell by cell;
- a code block with its language's colours;
- a diagram, with its source shown while the caret is in the block.

## What ahpw has today

- The rendered page draws tables through scena's `Markdown`, and mermaid through `MermaidDiagram` ([`code://src/shell/markdown/Mermaid.tsx`](../../src/shell/markdown/Mermaid.tsx)).
- The live preview of the plan draws a table read-only, and shows its Markdown while the caret is in it.

## The change

- A table shows as a grid whose cells are edited in place.
- An edit in a cell becomes one change in the table's text.

## Open points

- How a new row or column is added from the grid.
