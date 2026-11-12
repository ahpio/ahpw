---
title: A plugin is added or written from ahpw - implemented
date: 2026-11-12
refs:
  - git://bb9b6ae - the commit of main the branch starts from
  - "[code://src/resources/plugins/NewPluginPage.tsx](../../../../src/resources/plugins/NewPluginPage.tsx)"
  - "[code://src/bridges/plugins.ts](../../../../src/bridges/plugins.ts)"
---

An admin adds a plugin from a source, or writes one, from a New plugin tab.
An admin removes a plugin from the end of its Options tab.

## What was built

- [`code://src/bridges/plugins.ts`](../../../../src/bridges/plugins.ts) - `installPlugin`, `writePlugin` and `removePlugin`, which answer `PluginChanged`.
- [`code://src/resources/plugins/NewPluginPage.tsx`](../../../../src/resources/plugins/NewPluginPage.tsx) - *How*, the source field, the ID and the two editors, the wait, the refusal and the end.
- [`code://src/resources/plugins/starter.ts`](../../../../src/resources/plugins/starter.ts) - the starter `index.ts` and `package.json`, whose title and name lines follow the id.
- [`code://src/resources/plugins/new-plugin.css`](../../../../src/resources/plugins/new-plugin.css) - the editors' frame and the row of the button and the wait.
- [`code://src/resources/plugins/index.ts`](../../../../src/resources/plugins/index.ts) - `ahp.newPlugin`, in the palette and first in the toolbar while `PLUGINS_ADD` is true.
- [`code://src/resources/plugins/PluginPage.tsx`](../../../../src/resources/plugins/PluginPage.tsx) - `RemoveZone` under the Options tab.
- [`code://src/resources/plugins/actions.ts`](../../../../src/resources/plugins/actions.ts) - `mayRemove` and `removeOne`, with the confirm.
- [`code://src/shell/controls/DangerZone.tsx`](../../../../src/shell/controls/DangerZone.tsx) - optional `children`, drawn between the note and the button.
- The `plugins/new`, `plugins/remove` and `plugins/commands/new` strings in `en`, `pt` and `es`.

## Verified

- `pnpm typecheck` passes.
- The vitest suite passes: 154 files, 878 tests, with new cases in `src/bridges/plugins.test.ts` and `src/resources/plugins/starter.test.ts`.
- On an isolated ahpd, a written `weather` loaded in about one second, and its page opened. Its `package.json` name followed the ID.
- `@ahpd/webhook` from npm showed "Adding…" with the note, then its page opened.
- `github:example-nobody/ahpd-no-such-plugin` showed npm's refusal in the form, with the source kept.
- Remove of `weather` deleted its folder. Remove of `ahpd-webhook` with "Keep the package installed" left `node_modules/@ahpd/webhook` in place.
- The screens match the mockup at 1400 and 390 px, light and dark.

## Departures from the plan

- The answer type is `PluginChanged`, not `PluginAdded`, because remove answers the same shape.
- The page calls the bridge itself, because it shows a refusal inside the form. `actions.ts` has no `addPlugin` or `writeOne`.
- `PluginPage.tsx` draws the danger zone under the Options tab, as `ConnectorPage.tsx` draws Delete. `Options.tsx` is unchanged.
- *How* hides when the host offers only one way, and that way's fields show alone.
- The title line of the starter `index.ts` follows the id, as the name line does, so the mockup's `'Weather'` comes from `weather`.
- A bad ID gives no error text. Create stays disabled, as the connector form does.

## Left for later

- The Source tab, Update, and "Keep its folder" on a written plugin - see [deferred.md](deferred.md).
- An ahpd run from source with `--conditions development` cannot import a plugin npm installed. Node does not strip the types of `@ahpd/sdk` under `node_modules`. This is on the host, not in ahpw.
