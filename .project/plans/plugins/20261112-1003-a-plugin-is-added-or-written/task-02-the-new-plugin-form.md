---
title: The New plugin form adds and writes
status: implemented
depends:
  - task-01-the-bridge-installs-writes-removes.md
layer: "ahpw plugins screen"
refs:
  - "[code://src/resources/plugins/index.ts#L64-L76](../../../../src/resources/plugins/index.ts#L64-L76) - the explorer's toolbar"
  - "[code://src/resources/connectors/index.ts#L84-L93](../../../../src/resources/connectors/index.ts#L84-L93) - `ahp.newConnector`, the command to copy"
  - "[code://src/resources/connectors/NewConnectorPage.tsx](../../../../src/resources/connectors/NewConnectorPage.tsx) - the page to copy"
  - "[code://src/resources/agents/EnginePicker.tsx#L28-L40](../../../../src/resources/agents/EnginePicker.tsx#L28-L40) - the radio group *How* reuses"
  - "[code://src/resources/editor/CodeEditor.tsx#L15-L30](../../../../src/resources/editor/CodeEditor.tsx#L15-L30) - the editor for the two files"
  - "[code://src/bridges/said.ts#L11](../../../../src/bridges/said.ts#L11) - `hostSaid`, for the refusal"
  - "[code://src/resources/connectors/form.ts#L56](../../../../src/resources/connectors/form.ts#L56) - `slugOf`"
---

## Objective

A `+` in the Plugins toolbar opens New plugin in a tab.
*How* picks "Add from a source" or "Write one", and a finished add or write opens the plugin's page.

## Files

- `UPDATE: src/resources/plugins/index.ts:64-76` - `ahp.newPlugin` first in the toolbar, in the palette, shown by `PLUGINS_ADD`; the page is registered.
- `UPDATE: src/resources/plugins/state.ts` - `PLUGINS_ADD`, true while a shown host offers `install` or `write`; `newPluginTab(host)`.
- `CREATE: src/resources/plugins/NewPluginPage.tsx` - the heading, *How*, the source field or the three write fields, the alert and the button.
- `CREATE: src/resources/plugins/starter.ts` - the starter `index.ts` and `package.json`, and the package name that follows the id.
- `CREATE: src/resources/plugins/starter.test.ts` - the starter texts and the name that follows the id.
- `CREATE: src/resources/plugins/new-plugin.css` - the form's own layout, beside its component.
- `UPDATE: src/resources/plugins/actions.ts` - `addPlugin` and `writeOne`, which call the bridge, read again and open the page.
- `UPDATE: src/i18n/en.json` - the strings under `plugins/new`.
- `UPDATE: src/i18n/pt.json` - the same keys in Portuguese.
- `UPDATE: src/i18n/es.json` - the same keys in Spanish.

## Steps

1. Add `PLUGINS_ADD` with `trackServed`, true when a host offers `PLUGINS.install` or `PLUGINS.write`.
2. Register `ahp.newPlugin` like `ahp.newConnector`, and open `NewPluginPage` in `newPluginTab(host)`.
3. Put `ahp.newPlugin` first in the explorer's actions, with the `+` icon and `when: PLUGINS_ADD == true`.
4. Write `starter.ts` with the texts of the mockup's sheet 4 and `packageFor(id, text)`.
5. Make `packageFor` change the `name` line only while it still holds the name made from the previous id.
6. Draw *How* with the `web-kind-templates` classes.
7. Show each choice only when the host offers its command.
8. Draw Add as one required Source field with the hint of sheet 1, and the Add button.
9. Draw Write as the ID field, then `index.ts` and `package.json` in `CodeEditor`, and the Create button.
10. While a call waits, disable the form and show "Adding…" or "Creating…", the spinner and the note.
11. On a refusal, show `hostSaid` in a danger `Alert` above the button, and keep every field as typed.
12. On success, run `rereadAfterChange`, close the New plugin tab and run `ahp.openPlugin` with the answered id.
13. Add the catalog strings in `en`, `pt` and `es`.
14. Compare each state with sheets 0 to 4 at 1400 and 390 px, light and dark.

## Validation

- `src/resources/plugins/starter.test.ts` checks the starter texts and the name that follows the id.
- `pnpm typecheck` passes.
- `pnpm vitest run src/resources/plugins` passes.
- By hand on an isolated ahpd: add `@ahpd/push`, write the starter as `weather`, and add a wrong source.

## Resume

The page, the command, the toolbar `+`, the starter and the catalogs are built.
The page calls the bridge itself, because it shows a refusal in the form. `actions.ts` gets no helper for it.
*How* hides when the host offers only one way.
