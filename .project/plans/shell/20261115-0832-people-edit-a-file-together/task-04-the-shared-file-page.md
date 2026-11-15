---
title: The shared file page
status: todo
depends: [task-01-a-mockup-of-the-shared-file-page.md, task-03-carets-and-remote-edits.md]
layer: "files"
refs:
  - "[code://src/resources/files/FilePage.tsx](../../../../src/resources/files/FilePage.tsx) - the page"
  - "[code://src/resources/files/text.tsx#L27-L38](../../../../src/resources/files/text.tsx#L27-L38) - `FileHead`"
  - "[code://src/resources/agents/custom-files.ts#L13](../../../../src/resources/agents/custom-files.ts#L13) - a choice setting"
  - "[code://src/shell/ui-settings/settings.ts#L133](../../../../src/shell/ui-settings/settings.ts#L133) - where the setting is listed"
---

## Objective

The file page opens locked and shows the people in the file live.
Edit unlocks it in the person's save mode, which they change per file.

## Files

- `UPDATE: src/resources/files/FilePage.tsx` - locked, Edit, the save mode, the document client, the fallback for a host without the channel.
- `UPDATE: src/resources/files/text.tsx` - `FileHead` draws the people and "Saved" or "Saving".
- `CREATE: src/resources/files/shared.css` - the header's people and save state, beside the component.
- `CREATE: src/resources/files/save-mode.ts` - the `ui.fileSaveMode` setting, `live` or `manual`, default `live`.
- `UPDATE: src/shell/ui-settings/settings.ts` - list the setting.
- `UPDATE: src/i18n/en.json` - the page's words, and the same keys in each other catalog.

## Steps

1. Open the page locked: read-only, subscribed, with the others' edits and carets live.
2. Draw the Edit button in the header; a click unlocks the editor in the save mode of `ui.fileSaveMode`.
3. Draw the save mode picker with scena's `ChoicePicker`: Live save and Manual save.
4. In Manual save, draw Save, send on Mod-S or Save, and keep the unsaved guard.
5. In Live save, draw "Saving" until `saved` names the latest version, then "Saved".
6. Draw each person in the header with `NameMark`, and their name on hover.
7. Add `ui.fileSaveMode` with `chatChoice`, and list it in the settings window.
8. When the host refuses the subscribe, fall back to today's page with Mod-S and Save.
9. Compare each screen with the approved mockup, and stop and ask on any difference.

## Validation

- Two browsers on one file, with the daemon from the host plan: each sees the other's caret, name and edits.
- Manual save in one browser: the other sees the edits only after Mod-S.
- The page against a host without the channel works as today.
- Each screen matches the approved mockup at 1280 and 760 wide, in both themes.
- `pnpm typecheck`, `pnpm test` and `pnpm build` pass.

## Resume
