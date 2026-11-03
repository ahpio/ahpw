---
title: The explorers copy a name and paths
domain: shell
status: active
priority: medium
created: 2026-11-03
revalidated: 2026-11-03
requires: []
changes: []
creates: []
refs:
  - git://9245b40 - the commit of ahpw this plan was checked at
  - "[code://src/shell/controls/CopyButton.tsx#L26-L30](../../../../src/shell/controls/CopyButton.tsx#L26-L30) - `copyText`, which copies through a hidden text box when the page has no `navigator.clipboard`"
  - "[code://src/resources/folders/actions.ts#L83-L86](../../../../src/resources/folders/actions.ts#L83-L86) - `copyPath`, which calls `navigator.clipboard` and fails on plain http"
  - "[code://src/resources/folders/menu.ts#L26-L60](../../../../src/resources/folders/menu.ts#L26-L60) - the Files actions, their icons and `entryActions`"
  - "[code://src/resources/folders/Explorer.tsx#L277-L287](../../../../src/resources/folders/Explorer.tsx#L277-L287) - the `MenuEntry` a Files row gives its menu"
  - "[code://src/resources/changes/Explorer.tsx#L82-L101](../../../../src/resources/changes/Explorer.tsx#L82-L101) - `menuOf`, the Changes menu of a file row"
  - "[code://src/resources/changes/Explorer.tsx#L337-L345](../../../../src/resources/changes/Explorer.tsx#L337-L345) - `openMenu`, which opens a menu only on a file row"
  - "[code://src/resources/changes/words.ts#L71-L76](../../../../src/resources/changes/words.ts#L71-L76) - `relativeDir`, the path from the session's folder that the tree shows"
---

## Goal

The Files and Changes menus copy a row's name, its path and its path relative to its folder.
Every copy in ahpw works on a page served over plain http, where the browser has no `navigator.clipboard`.

## Reconnaissance

The files read and the patterns to reuse are the `refs` in the frontmatter, each with its note.

### Searches performed

- `rg -n "navigator.clipboard" src` - five callers skip `copyText`: `folders/actions.ts`, `automations/actions.ts`, `log/LogPage.tsx`, `computers/actions.ts`, `sessions/Explorer.tsx`.
- `rg -n "copyText" src` - `BrowserView.tsx` and `connectors/Overview.tsx` use it already.

### Runtime path

```
row right-click -> menu item -> copyText -> clipboard or hidden text box -> toast
```

### Gaps

- A Changes folder row has no menu.
- A Files `MenuEntry` does not name the root that the row is under.

## Answers

| What | Source | Task |
| --- | --- | --- |
| The Changes menu gets Copy name, Copy path and Copy relative path, for a file or a folder row | Softov, 2026-11-03: "on changes context menu... add options in menu. Copy name... Copy path, Copy relative path" | 02 |
| The Files menu gets Copy name and Copy relative path beside Copy path | Softov, 2026-11-03, chose "Add Copy name too (Recommended)" | 02 |
| Every copy in ahpw goes through `copyText`, and a test fails on a direct `navigator.clipboard` call | (defaulted: the same failure reaches each direct caller on plain http) | 01 |
| A Files relative path is from the root the row is under; a root row gets no Copy relative path | (defaulted: a root is the explorer's top folder, as a workspace folder in VS Code) | 02 |
| A Changes relative path is from the session's folder, the one the tree shows; with no session folder, the menu has no Copy relative path | [`code://src/resources/changes/words.ts#L71-L76`](../../../../src/resources/changes/words.ts#L71-L76) | 02 |
| The name of a joined Changes folder row, such as `packages/sdk/test/fixtures`, is its last folder | (defaulted: the name of the folder the row ends at) | 02 |
| The three items are in order name, path, relative path; in Changes they follow the open items, in Files they take the place of Copy path | (defaulted: VS Code's order) | 02 |

## Proposed architecture

- **Data flow** - each menu item takes the text from the row, calls `copyText`, and says `done` or `failed`.
- **State flow** - a Files `MenuEntry` gets `rootUri`; a Changes folder row maps to its `ChangeFolder` as a file row maps to its `Change`.
- **Source-of-truth files** - [`code://src/shell/controls/CopyButton.tsx`](../../../../src/shell/controls/CopyButton.tsx) for copying.

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - Every copy reaches the clipboard](task-01-every-copy-reaches-the-clipboard.md) | implemented | - |
| [02 - The menus copy a name and paths](task-02-the-menus-copy-a-name-and-paths.md) | implemented | 01 |

## Risks and tradeoffs

- `document.execCommand('copy')` is deprecated, but it is the only way to copy on plain http - `copyText` uses it only when the clipboard is missing or refuses.

## Resume state

- **Done so far:** tasks 01 and 02 are implemented and wait for review.
- **Next action:** Softov reviews the diff, and does the check in [explorers-copy-checks.md](../../../pending/explorers-copy-checks.md).
- **Open questions:** none.
- **Watch out for:** test the copy on `http://200.11.121.81:5180`, not on localhost, where `navigator.clipboard` exists.

## Final verification checklist

- [x] `pnpm typecheck` passes.
- [x] The vitest suite passes.
- [x] On plain http, Copy path in Files copies and says so.
- [x] Each new item copies the expected text in both explorers.
