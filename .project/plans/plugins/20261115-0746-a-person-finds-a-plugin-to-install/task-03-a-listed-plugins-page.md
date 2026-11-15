---
title: A listed plugin's page
status: implemented
depends: [task-01-the-bridge-reads-the-lists.md]
layer: "ahpw plugins screen"
refs:
  - "[code://src/resources/plugins/PluginPage.tsx#L51-L112](../../../../src/resources/plugins/PluginPage.tsx#L51-L112) - the page head, actions and tabs this page copies"
  - "[code://src/resources/plugins/Overview.tsx#L60-L79](../../../../src/resources/plugins/Overview.tsx#L60-L79) - *Provides*, which Features reuses"
  - "[code://src/resources/plugins/index.ts#L40-L53](../../../../src/resources/plugins/index.ts#L40-L53) - `open`, which `ahp.openListedPlugin` copies"
---

## Objective

`ahp.openListedPlugin { host, id, marketplace }` opens the page of a plugin that is not installed, as the mockups draw it.

## Files

- `CREATE: src/resources/plugins/ListedPluginPage.tsx` - the head, Install, the gear, the tabs and the facts column.
- `CREATE: src/resources/plugins/ListedPluginPage.css` - the two columns, beside their component.
- `CREATE: src/resources/plugins/ListTabs.tsx` - Overview, Features and Changelog, and the facts column, which task 04 reuses.
- `UPDATE: src/resources/plugins/Overview.tsx` - *Provides* as its own component, so Features draws it.
- `UPDATE: src/resources/plugins/index.ts` - the command and the component.
- `UPDATE: src/resources/plugins/state.ts` - the tab key of a listed page.
- `UPDATE: src/i18n/en.json`, `pt.json`, `es.json` - the new strings.

## Steps

1. Register `ListedPluginPage` and `ahp.openListedPlugin`, keyed `plugins:listed:<host>:<marketplace>:<id>`.
2. Read `available` for the entry and `details` for its files. Show a spinner while they come, and the host's refusal when they fail.
3. Draw the head: the icon, the name, the marketplace's host and the version, and the description.
4. Draw *Install* when the host offers `x-ahpd/plugins/install`, and a gear with *Install <version>* for each listed version.
5. An install sends `installPlugin(host, source, marketplace)`, or `<source>@<version>` from the gear. Then it reads the list again, opens the new row's page and closes this tab.
6. Draw the tabs: *Overview* with the README in scena's `Markdown`, and *Features* with *Provides* and the settings. Draw *Changelog* when the version has one.
7. Draw a README image as its alt text.
8. Draw the facts column: *List* with identifier, version, published, list, author and license, *Categories* and *Resources*.
9. Put the column under the tabs when the page is under 600 px wide.
10. Add the strings to the three catalogs.

## Validation

- `pnpm typecheck` passes.
- On a test ahpd from the ahpd branch, Bot's page matches `mock-1280-light-details.png` and `mock-1280-dark-features-filter-webhook.png`, and at 760 px `mock-760-light-details-page.png`.
- Install installs Bot and opens its page.

## Resume

Built on 2026-11-15; awaits review.
`ListedPluginPage.tsx` draws the page, and `ListTabs.tsx` draws the tabs and the facts column for both pages. *Provides* moved to `ProvidesList.tsx`.
The facts column is headed *Marketplace*, as the mockup is, and its *List* row names the list's host.
A README line of badges is taken out, and any other image is not drawn, so the page fetches nothing from the list's host.
The gear offers each listed version that is not deprecated, and only for an npm source.
On the test ahpd, Bot's page matched the mockups at 1280 and 760, light and dark. Install installed Bot from the list, opened its page and wrote `installed.json`.
After Softov's test on 2026-11-15, the page reads the entry again when the host's plugin rows change. Once the entry is installed, the same tab draws the installed plugin's page, so no second tab opens.
A README line of only HTML tags, such as `<picture>`, is taken out too, since scena's `Markdown` draws HTML as text.
