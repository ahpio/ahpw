---
title: The Markdown view is a live preview
domain: shell
status: active
priority: medium
created: 2026-11-15
revalidated: 2026-11-15
requires:
  - plans/shell/20261115-0832-people-edit-a-file-together/plan.md
changes: []
creates: []
refs:
  - git://7b0cae0 - the commit of ahpw this plan was checked at
  - "file:///github/ahp-review/briefs/collaborative-documents/stages.md - stage 3, plan E: Markdown live preview"
  - "file:///github/ahp-review/briefs/collaborative-documents/documents-served-by-the-host.md - the editors section: a live preview is still the text, so its positions are the offsets"
  - "[code://src/resources/files/MarkdownPage.tsx](../../../../src/resources/files/MarkdownPage.tsx) - the Markdown view today: the file rendered, read-only"
  - "[code://src/resources/files/SharedFilePage.tsx](../../../../src/resources/files/SharedFilePage.tsx) - the shared editor, its people, its lock and its comments"
  - "[code://src/resources/editor/comments.ts](../../../../src/resources/editor/comments.ts) - decorations, widgets and a hover tooltip over the text, the pattern for the preview's"
  - "[code://src/resources/editor/languages.ts#L59](../../../../src/resources/editor/languages.ts#L59) - `@codemirror/lang-markdown`, whose syntax tree the preview reads"
  - npm://@codemirror/lang-markdown@^6.5.2 - the Markdown parser, with GFM task lists and strikethrough
  - npm://@codemirror/view@^6.43.14 - mark, replace and widget decorations
  - https://help.obsidian.md/edit-and-read#Live+Preview - Obsidian's live preview, the reference: markers hidden except where the caret is
---

## Goal

"Show as Markdown" opens the file as a page that people edit live together.
The text stays the text: the same shared editor as "Show as text", drawn styled, with each part's markers hidden away from the caret's line.
Where editing is not available, the view is the rendered page of today.

## Reconnaissance

The files read and the patterns to reuse are the `refs` in the frontmatter, each with its note.

### Searches performed

- `git grep -i preview origin/main -- src` - ahpw has no live preview; the hits are attachment previews.
- `rg "MARKDOWN_VIEWER" src` - the Markdown view is a viewer beside Text, picked by "Show as Markdown".

### Runtime path

`MarkdownPage` reads the text with `useFileText` and renders it with the Markdown wrapper.
`FilePage` opens `SharedFilePage` for a file the host shares, and the plain page otherwise.

## Answers

| What | Source | Task |
| --- | --- | --- |
| The first version draws headings, emphasis, code spans, strikethrough, lists, task boxes, links, images and quotes | Softov, 2026-11-15, chose "Headings and emphasis, Lists and task boxes, Links and images, Blocks" | 03 |
| Tables, fenced code and mermaid are drawn away from the caret, and are text with the caret in them; editing a table cell by cell waits in a brief | Softov, 2026-11-15, chose "Now, in plan E", after "save brief for pending ones" | 06 |
| Markers are hidden away from the caret's line, and shown on it | Softov, 2026-11-15, chose "Hidden, shown on caret line" | 03 |
| "Show as Markdown" opens the live preview; the switch is the one that exists | Softov, 2026-11-15: "it already exists", then "Markdown view becomes it" | 04 |
| The read-only renderer stays as `SimpleMarkdown`, shown when editing is not available | Softov, 2026-11-15: "Save the file as reference simplemarkdown ... like editor not avail because file is readonly" | 02 |
| A mockup comes before the build | the stages brief, "Before plan E: a mockup of the preview" | 01 |
| A click on a task box writes `[x]` or `[ ]` into the text; Mod-click opens a link | `(defaulted: as Obsidian does)` | 03 |
| The preview is locked until ✎, as Text is | `(defaulted: the shared editor's lock)` | 04 |
| 💬 with a count, after ✎, shows or hides the comments margin; hidden, a click opens one thread as a card beside its line, closed with `›`, Escape or a click in the text; a UI setting picks the default | Softov, 2026-11-15, chose "💬 toggle + floating card" | 05 |
| The comments that fold away are part of this plan | Softov, 2026-11-15, chose "Add it to plan E" | 05 |

## Proposed architecture

A CodeMirror extension, `livePreview`, reads `@codemirror/lang-markdown`'s syntax tree and draws decorations over the visible lines.
Away from any caret's line, it hides each part's markers with replace decorations and styles the part with marks.
Task boxes, bullets and images are widgets.
`MarkdownPage` opens `SharedFilePage` with `livePreview` and the Markdown language.
Where the host serves no shared file, or the file is read-only, it opens `SimpleMarkdown`.

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - A mockup of the live preview](task-01-a-mockup-of-the-live-preview.md) | done | - |
| [02 - The simple Markdown page](task-02-the-simple-markdown-page.md) | implemented | - |
| [03 - The live preview extension](task-03-the-live-preview-extension.md) | implemented | 01 |
| [04 - The Markdown view edits live](task-04-the-markdown-view-edits-live.md) | implemented | 02, 03 |
| [05 - Comments fold away](task-05-comments-fold-away.md) | implemented | 01 |
| [06 - Blocks drawn in the preview](task-06-blocks-drawn-in-the-preview.md) | implemented | 03 |

## Risks and tradeoffs

- A hidden marker moves the text when the caret enters its line - Obsidian accepts this, and the answer chose it.
- A drawn block changes height after its line is measured - the line is measured again when it does.

## Resume state

- **Done so far:** Softov approved the mockup on 2026-11-15, at `.scratch/mockups/live-preview.html` in `/github/ahpw`.
- **Done so far:** tasks 02 to 06 built on 2026-11-15.
- **Next action:** the PR text for Softov; then Softov tests.
- **Open questions:** none.
- **Watch out for:** the comments margin works on the shared editor; the live preview must keep it working.

## Final verification checklist

- [x] Softov approved the mockup, and each screen matches it.
- [ ] Two browsers edit one Markdown file in the preview, and each sees the other's edits and caret.
- [x] A task box click writes `[x]` into the file.
- [ ] A read-only file shows `SimpleMarkdown`.
- [x] `pnpm typecheck`, `pnpm test` and `pnpm build` pass.
