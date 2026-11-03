---
title: The menus copy a name and paths
status: implemented
depends: [task-01-every-copy-reaches-the-clipboard.md]
layer: "ahpw resources"
refs:
  - "[code://src/resources/folders/menu.ts#L26-L60](../../../../src/resources/folders/menu.ts#L26-L60) - the Files actions"
  - "[code://src/resources/changes/Explorer.tsx#L82-L101](../../../../src/resources/changes/Explorer.tsx#L82-L101) - the Changes file menu"
---

## Objective

The Files and Changes menus show Copy name, Copy path and Copy relative path, as the plan's *Answers* say.

## Files

- `UPDATE: src/resources/folders/menu.ts:14-60` - `MenuEntry` gets `rootUri`; `copyName` and `copyRelativePath` join the actions; a root has no `copyRelativePath`.
- `UPDATE: src/resources/folders/actions.ts:83-86` - `copyName` and `copyRelativePath` beside `copyPath`.
- `UPDATE: src/resources/folders/Explorer.tsx:277-287` - the row's `MenuEntry` names the root it is under.
- `UPDATE: src/resources/folders/menu.test.ts` - the action lists with the two new items, and the relative path.
- `UPDATE: src/resources/changes/Explorer.tsx:82-101` - the file menu and a new folder menu show the three copy items.
- `UPDATE: src/resources/changes/Explorer.tsx:337-345` - `openMenu` opens a menu on a folder row too.
- `UPDATE: src/resources/changes/words.ts` - a function gives a change's or a folder's name, path and relative path.
- `UPDATE: src/resources/changes/words.test.ts` - the three texts for a file, a folder and a joined folder.
- `UPDATE: src/i18n/en.json` - the item titles and the toasts.
- `UPDATE: src/i18n/pt.json` - the same strings in Portuguese.
- `UPDATE: src/i18n/es.json` - the same strings in Spanish.

## Steps

1. Add `rootUri` to `MenuEntry`, and set it in the Files explorer to the root the row is under.
2. Add `copyName` and `copyRelativePath` to `ENTRY_ACTIONS` around `copyPath`, with their icons, and hide `copyRelativePath` on a root.
3. Add the two actions to `RUN`, each through `copyText`, with a toast for each.
4. Add a function in `changes/words.ts` that gives the three texts of a change or a folder.
5. Add the three items to the Changes file menu after the open items.
6. Map each Changes folder row to its folder, and give it a menu with the three items.
7. Hide Copy relative path in Changes when the session has no folder.
8. Add the strings to the three catalogs.
9. Update the tests.

## Validation

- `pnpm typecheck` passes.
- `menu.test.ts`, `words.test.ts` and `locales.test.ts` pass.
- In Files, each item copies the expected text for a file, a folder and a root.
- In Changes, each item copies the expected text for a file and a folder.
- Check Changes in the list view and in the tree view.

## Resume

- `pnpm typecheck` and the vitest suite pass.
- Headless Chrome against a scratch host checked each item. In Files: a root, a folder and nested files. A root has no Copy relative path. In Changes: files in the list view, and folders, a joined folder (`packages/sdk/src`) and files in the tree view.
