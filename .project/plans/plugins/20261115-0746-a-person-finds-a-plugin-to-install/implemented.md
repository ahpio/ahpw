---
title: A person finds a plugin to install - implemented
date: 2026-11-22
refs:
  - git://108a3e7 - the merge of ahpw #86
  - "[code://src/bridges/plugins.ts](../../../../src/bridges/plugins.ts) - `availablePlugins`, `pluginDetails` and `installPlugin`"
  - "[code://src/resources/plugins/ListedPluginPage.tsx](../../../../src/resources/plugins/ListedPluginPage.tsx) - a listed plugin's page"
  - "[code://src/resources/plugins/ListTabs.tsx](../../../../src/resources/plugins/ListTabs.tsx) - the tabs and facts column of both pages"
---

A search in the plugins sidebar also lists the plugins a host offers to install, each with Install.
A listed plugin opens a page with its overview, features, changelog and facts. An installed plugin's page reads its own package the same way.

## What was built

- [`code://src/bridges/plugins.ts`](../../../../src/bridges/plugins.ts) - the two list commands, and `installPlugin` with a `marketplace`.
- [`code://src/shell/explorer/ExplorerList.tsx`](../../../../src/shell/explorer/ExplorerList.tsx) - `searchRows`, shown while a search is typed, and a row's `button`.
- [`code://src/resources/plugins/ListedPluginPage.tsx`](../../../../src/resources/plugins/ListedPluginPage.tsx) and [`code://src/resources/plugins/ListTabs.tsx`](../../../../src/resources/plugins/ListTabs.tsx) - the listed page, and the tabs and facts both pages share.
- [`code://src/resources/plugins/PluginPage.tsx`](../../../../src/resources/plugins/PluginPage.tsx) - the installed page with the same tabs.

## Verified

- `plugins.test.ts` passes 13 cases, and `ExplorerList.test.ts` covers the search rule.
- On the test ahpd, Bot showed Installation and Marketplace, and a plugin pushed from a folder showed only Installation and Resources.
- Webhook, installed from its listed page, kept one tab.

## Departures from the plan

- Task 04 replaced the list tabs of the first build, after Softov's test found a second tab after an install and two overlapping tabs.
- A README line of badges, and any other image, is not drawn, so the page fetches nothing from the list's host. A `file:` URL is not shown.

## Left for later

- None.
