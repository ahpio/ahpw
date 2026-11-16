---
title: The simple Markdown page
status: implemented
depends: []
layer: "files"
refs:
  - "[code://src/resources/files/MarkdownPage.tsx](../../../../src/resources/files/MarkdownPage.tsx) - the renderer this task keeps"
---

## Objective

The rendered, read-only Markdown page stays, as `SimpleMarkdown`, for a file that cannot be edited.

## Files

- `CREATE: src/resources/files/SimpleMarkdown.tsx` - today's `MarkdownPage` body: the text rendered, links and images relative to the file's folder.
- `UPDATE: src/resources/files/MarkdownPage.tsx` - the view picks the live preview or `SimpleMarkdown`.

## Steps

1. Move the rendering of `MarkdownPage` into `SimpleMarkdown`, unchanged.
2. Add a note under the page: this view does not edit the file.

## Validation

- A file the host does not share opens as the page of today, with tables, code blocks and diagrams.
- `pnpm typecheck` and `pnpm test` pass.

## Resume

Built on 2026-11-15.
- `SimpleMarkdown` opens on a host with no shared files, and for a file that the host does not share.
- ahpw cannot tell ahead that a person may not write a file.
- Such a file opens in the preview, locked, and the host refuses an edit after ✎, as in the text view.
