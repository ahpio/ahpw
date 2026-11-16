---
title: Long lines wrap, and HTML images draw - implemented
date: 2026-11-16
refs:
  - git://270f4b8ae - the merge of ahpio/ahpw#91
  - "[code://src/resources/editor/wrap.ts](../../../../src/resources/editor/wrap.ts) - the text wrap choice"
  - "[code://src/resources/editor/livePreview.ts](../../../../src/resources/editor/livePreview.ts) - the HTML images in the preview"
---

Every code editor wraps long lines on ↵ or Alt+Z, with a setting for the default.
The Markdown preview draws `<img>` tags.

## What was built

- [`code://src/resources/editor/wrap.ts`](../../../../src/resources/editor/wrap.ts) - `TEXT_WRAP`, the *Long lines* setting, off by default.
- [`code://src/resources/editor/CodeEditor.tsx`](../../../../src/resources/editor/CodeEditor.tsx) - the wrap, Alt+Z, and a read-only editor that takes focus.
- [`code://src/resources/files/text.tsx`](../../../../src/resources/files/text.tsx) - `useWrap` and the ↵ button in a file's header.
- [`code://src/resources/editor/livePreview.ts`](../../../../src/resources/editor/livePreview.ts) - `<img>` in a line, in a heading and in an HTML block, aligned as its tag says.

## Verified

- `src/resources/editor/livePreview.test.ts`.
- The suite at the PR: 990 pass.
- A browser.

## Departures from the plan

- None.

## Left for later

- None.
