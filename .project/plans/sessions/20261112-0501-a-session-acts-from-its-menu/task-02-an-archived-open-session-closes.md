---
title: An archived open session closes
status: done
depends: [task-01-the-header-menu-has-the-acts.md]
layer: "ahpw sessions and UI settings"
refs:
  - "[code://src/resources/sessions/view-settings.ts#L16-L43](../../../../src/resources/sessions/view-settings.ts#L16-L43) - `chatChoice`, the kept choice to mirror"
  - "[code://src/shell/ui-settings/settings.ts#L56-L131](../../../../src/shell/ui-settings/settings.ts#L56-L131) - `chatSetting` and `UI_SETTINGS`"
  - "[code://src/resources/sessions/focus.ts#L5](../../../../src/resources/sessions/focus.ts#L5) - `sessionKey`, the tab to close"
---

## Objective

A session that becomes archived while its tab is open closes that tab.
The UI setting `ui.archivedSessionOpen` keeps it open instead when set to *Stay*; it defaults to *Close*.

## Files

- `UPDATE: src/resources/sessions/view-settings.ts` - `ARCHIVED_SESSION_OPEN`, a `chatChoice` with `close` and `stay`, `close` by default.
- `UPDATE: src/shell/ui-settings/settings.ts:69-131` - `chatSetting('ui.archivedSessionOpen', ARCHIVED_SESSION_OPEN)`.
- `UPDATE: src/resources/sessions/Page.tsx` - watch the summary's archived flag and close the tab on a change to archived.
- `CREATE: src/resources/sessions/archived.ts` - `closesOnArchive(was, now, choice)`, true only for a change from not archived to archived with `close`.
- `CREATE: src/resources/sessions/archived.test.ts` - a change to archived, one already archived, one unarchived, and *Stay*.
- `UPDATE: src/i18n/en.json` - the setting's title, description and the words *Close* and *Stay*.
- `UPDATE: src/i18n/es.json` - the same.
- `UPDATE: src/i18n/pt.json` - the same.

## Steps

1. Add `ARCHIVED_SESSION_OPEN` to `view-settings.ts`, kept as `ahpw.archivedSessionOpen`.
2. Add the setting to `UI_SETTINGS`, and register no command for it.
3. Write `closesOnArchive` from the last archived flag, the new one and the choice.
4. Keep the last archived flag in the page with a ref, and check it each time the summary changes.
5. Close the tab with `scena.surfaces.close(sessionKey(host, resource))` when `closesOnArchive` is true.
6. Add the words under `host/settings/ui/archivedSessionOpen`.

## Validation

- `src/resources/sessions/archived.test.ts` passes.
- `pnpm typecheck` and `pnpm test` pass.
- By hand: archive an open session from its menu, from the list and from the merged banner.
- By hand: each of the three closes the tab.
- By hand: with *Stay*, the tab stays; a session opened from the archived list stays open.
- By hand: the setting shows in the settings window and not in the command palette.

## Resume
