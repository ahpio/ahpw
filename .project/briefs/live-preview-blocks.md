---
title: Live preview draws tables, code blocks and diagrams
created: 2026-11-15
refs:
  - git://7b0cae0 - the commit of ahpw the facts were checked at
  - "[code://src/shell/markdown/Markdown.tsx](../../src/shell/markdown/Markdown.tsx) - the Markdown wrapper, which draws mermaid in the rendered page"
  - "[code://src/shell/markdown/Mermaid.tsx](../../src/shell/markdown/Mermaid.tsx) - `MermaidDiagram`, a diagram from its source"
  - https://help.obsidian.md/edit-and-read#Live+Preview - Obsidian draws tables, code blocks and diagrams in live preview
---

# Live preview draws tables, code blocks and diagrams

Softov wants the Markdown live preview to draw the blocks its first version leaves as source: tables, fenced code and mermaid diagrams. Plan `shell/20261115-1604-the-markdown-view-is-a-live-preview` draws the inline parts, lists, links, images and quotes.

## What others do

Obsidian's live preview draws each of the three in place of its source:

- a table as a grid, edited cell by cell;
- a code block with its language's colours;
- a diagram, with its source shown while the caret is in the block.

## What ahpw has today

- The rendered page draws all three: tables through scena's `Markdown`, mermaid through `MermaidDiagram` ([`code://src/shell/markdown/Mermaid.tsx`](../../src/shell/markdown/Mermaid.tsx)).
- The live preview of the plan leaves the three as their source.

## The change

- A fenced code block gets a background and its language's colours.
- A mermaid block shows its diagram away from the caret, and its source while the caret is in it.
- A table shows as a grid away from the caret, and as its source while the caret is in it.

## Open points

- Whether a table is edited cell by cell, as in Obsidian, or as its source.
