---
title: An installed plugin's page reads its own package
status: done
depends: [task-03-a-listed-plugins-page.md]
layer: "ahpw plugins screen"
refs:
  - "[code://src/resources/plugins/PluginPage.tsx](../../../../src/resources/plugins/PluginPage.tsx) - the page and its tabs"
  - "[code://src/resources/plugins/Overview.tsx](../../../../src/resources/plugins/Overview.tsx) - the Overview and Features panels and the Installation facts"
  - "[code://src/resources/plugins/state.ts](../../../../src/resources/plugins/state.ts) - the tab keys a page keeps"
---

## Objective

An installed plugin's page has the tabs *Overview*, *Features*, *Changelog* and *Settings*, as VS Code's installed extension. All it says comes from the installed package. A list adds only its *Marketplace* facts, and only when the plugin came from that list.

## Files

- `UPDATE: src/resources/plugins/PluginPage.tsx` - the head, the tabs and the facts column.
- `UPDATE: src/resources/plugins/Overview.tsx` - the Overview and Features panels, and the Installation facts.
- `UPDATE: src/resources/plugins/ListTabs.tsx` - the facts column and the README text, shared by both pages.
- `UPDATE: src/resources/plugins/ListedPluginPage.tsx` - a listed tab that becomes installed is that plugin's tab.
- `UPDATE: src/resources/plugins/index.ts` - `ahp.openPlugin` focuses that listed tab.
- `UPDATE: src/resources/plugins/state.ts` - the tab keys and `LISTED_AS`.
- `UPDATE: src/bridges/plugins.ts` - `installedFiles`, which asks `details` with `installed: true`.

## Steps

1. Put the id, the version and the module in the head, after the title. Put the description under them. Remove the *State* fact; the badge says it.
2. Ask `details` with `{ id, installed: true }` for the README and the changelog of the package the host loads.
3. *Overview*: the problem, the plugin's view, its alerts, and the README.
4. *Features*: *Provides*, from the loaded manifest.
5. *Changelog*: when the package has one.
6. *Settings*: the options, then Remove. Remove the *As configured* block.
7. Draw the facts column beside Overview, Features and Changelog. It has *Installation*, then *Categories* and *Resources* from the manifest. *Marketplace* comes after *Installation* when `installed.marketplace` names the entry's list.
8. When a listed tab sees its plugin installed, and the plugin's own tab is open, close the listed tab. Else record the listed tab in `LISTED_AS`, and let `ahp.openPlugin` focus it.

## Validation

- `pnpm typecheck` passes.
- On a test ahpd from the ahpd branch, Bot (from the list) has Installation and Marketplace. Push (from a folder) has Installation and Resources, and no Marketplace.
- An install from a listed page, then a click on the plugin's row, leaves one tab.

## Resume

Built on 2026-11-15; awaits review.
Softov's test found a second tab after an install, two overlapping tabs (Overview and Details), and list text on a plugin installed from a file. This task replaces the list tabs of the first build.
On the test ahpd, Bot shows Installation and Marketplace, and Push from a folder shows only Installation and Resources. Webhook installed from its listed page, then opened from the sidebar, kept one tab.
A `file:` URL is not shown, because it repeats the path.
