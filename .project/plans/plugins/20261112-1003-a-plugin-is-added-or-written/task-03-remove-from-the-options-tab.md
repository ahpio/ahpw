---
title: Remove from the Options tab
status: implemented
depends:
  - task-01-the-bridge-installs-writes-removes.md
layer: "ahpw plugins screen"
refs:
  - "[code://src/resources/plugins/Options.tsx#L40](../../../../src/resources/plugins/Options.tsx#L40) - the early return when a plugin has no options"
  - "[code://src/shell/controls/DangerZone.tsx](../../../../src/shell/controls/DangerZone.tsx) - the shared danger zone"
  - "[code://src/resources/connectors/actions.ts#L29-L43](../../../../src/resources/connectors/actions.ts#L29-L43) - `deleteConnector`, the confirm to copy"
---

## Objective

The Options tab of a plugin ends with a danger zone that removes the plugin.
A checkbox keeps the package installed, and Remove asks before it runs.

## Files

- `UPDATE: src/shell/controls/DangerZone.tsx` - optional `children`, drawn between the note and the button.
- `UPDATE: src/resources/plugins/Options.tsx:40` - the danger zone shows after the options, and after the "no options" note.
- `UPDATE: src/resources/plugins/actions.ts` - `mayRemove` and `removeOne`, with the confirm and the refusal.
- `UPDATE: src/i18n/en.json` - the strings under `plugins/remove`.
- `UPDATE: src/i18n/pt.json` - the same keys in Portuguese.
- `UPDATE: src/i18n/es.json` - the same keys in Spanish.

## Steps

1. Give `DangerZone` an optional `children` prop, and draw it between the note and the button.
2. Write `mayRemove(offers)`, true when the host offers `PLUGINS.remove`.
3. Write `removeOne(host, id, keep)`, which asks with `confirm` as `deleteConnector` does.
4. After the answer, run `rereadAfterChange` and close the plugin's tab.
5. On a refusal, call `failed` with the plugin's id and the host's words.
6. Draw the danger zone at the end of the Options tab, also when the plugin has no options.
7. Put a "Keep the package installed" `CheckBox` in the danger zone, off by default.
8. Add the catalog strings in `en`, `pt` and `es`.
9. Compare the tab with sheet 6 at 1400 and 390 px, light and dark.

## Validation

- `pnpm typecheck` passes.
- `pnpm vitest run src/resources/plugins` passes.
- By hand on an isolated ahpd: remove a plugin with the box on, and one with it off.
- The other pages that use `DangerZone` look as before.

## Resume

`DangerZone` takes children, and `removeOne` asks first. The danger zone is drawn by `PluginPage.tsx` under the Options tab, as `ConnectorPage.tsx` draws Delete under its Settings, so `Options.tsx` is unchanged.
