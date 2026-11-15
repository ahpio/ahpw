---
title: One list in the sidebar
status: todo
depends: [task-01-the-bridge-reads-the-lists.md]
layer: "ahpw plugins screen"
refs:
  - "[code://src/shell/explorer/ExplorerList.tsx#L52-L72](../../../../src/shell/explorer/ExplorerList.tsx#L52-L72) - the list's filter, which gets the search rows"
  - "[code://src/shell/explorer/ExplorerList.tsx#L15-L39](../../../../src/shell/explorer/ExplorerList.tsx#L15-L39) - `Row`, which gets a text button"
  - "[code://src/resources/plugins/Explorer.tsx#L31-L108](../../../../src/resources/plugins/Explorer.tsx#L31-L108) - the Plugins sidebar"
  - "[code://src/resources/plugins/rows.ts#L65-L100](../../../../src/resources/plugins/rows.ts#L65-L100) - `pluginRows`, the row shape"
---

## Objective

With no search, the Plugins sidebar shows the installed plugins, as today.
A search shows one flat list: the installed plugins that match, then the listed plugins that match, each with an *Install* button.

## Files

- `UPDATE: src/shell/explorer/ExplorerList.tsx` - `searchRows`, drawn only while a search is typed, and a row's `button`.
- `CREATE: src/shell/explorer/ExplorerList.css` - the row button, beside its component.
- `UPDATE: src/resources/plugins/rows.ts` - `listedRows`, the rows of the listed plugins.
- `UPDATE: src/resources/plugins/rows.test.ts` - the listed rows.
- `UPDATE: src/resources/plugins/Explorer.tsx` - ask `available` of each host that offers it, and pass the listed rows.
- `UPDATE: src/i18n/en.json`, `pt.json`, `es.json` - the new strings.

## Steps

1. Give `ExplorerList` an optional `searchRows`. While a person types a search, the list draws `rows`, then `searchRows`.
   Both pass the same filter, and the list has no group headings.
2. Give `Row` an optional `button`, `{ label, run, busy? }`, drawn as a small primary button beside the title.
3. Write `listedRows(entries, words)`, one row for each listed plugin of each host. A row has the icon, the name, the description, the marketplace's host and the newest version.
4. Leave out an entry whose `installed` names no marketplace or its own marketplace, since its installed row stands for it.
5. Key each row by host, marketplace and id, so two lists with one id give two rows.
6. In `Explorer`, ask `available` of each shown host that offers it, on mount and when its plugin rows change.
7. A row's *Install* sends `installPlugin(host, source, marketplace)`, reads the list again, and opens the new row's page.
8. A click on a listed row runs `ahp.openListedPlugin { host, id, marketplace }`.
9. Add the strings to the three catalogs.

## Validation

- `pnpm vitest run src/resources/plugins/rows.test.ts` passes, with a case for two lists with one id and one for an installed entry.
- `pnpm typecheck` passes.
- On a test ahpd from the ahpd branch, the search `agent` matches the mockup `mock-1280-light-details-filter-agent.png`.

## Resume
