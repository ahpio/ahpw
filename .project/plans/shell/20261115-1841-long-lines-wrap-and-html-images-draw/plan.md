---
title: Long lines wrap, and HTML images draw
domain: shell
status: active
priority: medium
created: 2026-11-15
revalidated: 2026-11-15
requires:
  - plans/shell/20261115-1604-the-markdown-view-is-a-live-preview/plan.md
changes: []
creates: []
refs:
  - git://2653557 - the commit of ahpw this plan was checked at
  - "[code://src/resources/editor/CodeEditor.tsx](../../../../src/resources/editor/CodeEditor.tsx) - the code editor every file and form uses"
  - "[code://src/resources/editor/livePreview.ts](../../../../src/resources/editor/livePreview.ts) - the Markdown preview, which drew no HTML"
  - "[code://src/resources/files/HostImage.tsx](../../../../src/resources/files/HostImage.tsx) - an image read through the host, drawn through `<img>`"
  - https://code.visualstudio.com/docs/editing/codebasics#_word-wrap - VS Code's Toggle Word Wrap, Alt+Z, and `editor.wordWrap` off by default
---

## Goal

A person wraps long lines in any code editor, and a README's logo and badges show in the Markdown preview.

## Reconnaissance

The files read and the patterns to reuse are the `refs` in the frontmatter, each with its note.

### Searches performed

- The Markdown parser reads `<img>` inside text as `HTMLTag`, and a line that starts with HTML as `HTMLBlock`.
- The preview stopped at a link, so an image inside a link, as a badge, was never drawn.

## Answers

| What | Source | Task |
| --- | --- | --- |
| A ↵ button in the file header, Alt+Z in the editor, and a UI setting for the default | Softov, 2026-11-15, chose "Button, Alt+Z and setting" | 01 |
| Long lines stay on one line by default | Softov, 2026-11-15, chose "Off" | 01 |
| Every editor built on `CodeEditor` follows it | Softov, 2026-11-15, chose "Every code editor" | 01 |
| The Markdown preview always wraps, and has no ↵ | `(defaulted: a page wraps)` | 01 |
| A read-only editor takes focus, so Alt+Z, copy and search work on a locked file | `(defaulted: as VS Code's read-only editors)` | 01 |
| The preview draws `<img>` tags, alone or in an HTML block, through `HostImage`; other HTML stays text | Softov, 2026-11-15: "html img inside markdown does not render" | 02 |

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - Long lines wrap](task-01-long-lines-wrap.md) | implemented | - |
| [02 - HTML images draw in the preview](task-02-html-images-draw.md) | implemented | - |

## Resume state

- **Done so far:** tasks 01 and 02 built on 2026-11-15, on branch `shell/20261115-1841-long-lines-wrap-and-html-images-draw`.
- **Next action:** the PR text for Softov.
- **Open questions:** none.

## Final verification checklist

- [x] ↵ and Alt+Z wrap a file's long lines, on a locked file too.
- [x] The Markdown view has no ↵ and wraps.
- [x] A heading's `<img>`, a badge and an HTML block's image show in the preview.
- [x] `pnpm typecheck`, `pnpm test` and `pnpm build` pass.
