---
title: The explorers copy a name and paths - implemented
date: 2026-11-22
refs:
  - git://ba4763e - the explorer menus copy a name, a path and a relative path
  - "[code://src/resources/folders/menu.ts](../../../../src/resources/folders/menu.ts) - `copyName` and `copyRelativePath` in the menu"
  - "[code://src/resources/folders/actions.ts](../../../../src/resources/folders/actions.ts) - the copy actions"
---

The Files and Changes menus copy a name, a path and a relative path.
Every copy in ahpw reaches the clipboard, also on a page served over plain http.

## What was built

- [`code://src/resources/folders/actions.ts`](../../../../src/resources/folders/actions.ts) - `copyPath`, `copyName` and `copyRelativePath`, through `copyText`.
- [`code://src/resources/folders/menu.ts`](../../../../src/resources/folders/menu.ts) - the menu entries; a root has no relative path.
- The other copies (automations, log) call `copyText` too.

## Verified

- `clipboard.test.ts` passes, and fails when a direct clipboard call is added back.
- Headless Chrome on a non-secure origin copied each path through the fallback, and checked each item in Files and Changes.

## Departures from the plan

- None.

## Left for later

- None. Softov checked each copy on Softov's own browser on 2026-11-23, and it passed.
