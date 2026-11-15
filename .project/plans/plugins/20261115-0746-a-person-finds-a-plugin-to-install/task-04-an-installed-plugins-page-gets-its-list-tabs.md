---
title: An installed plugin's page gets its list tabs
status: todo
depends: [task-03-a-listed-plugins-page.md]
layer: "ahpw plugins screen"
refs:
  - "[code://src/resources/plugins/PluginPage.tsx#L51-L112](../../../../src/resources/plugins/PluginPage.tsx#L51-L112) - the page, which gets three tabs"
  - "[code://src/resources/plugins/state.ts#L26-L34](../../../../src/resources/plugins/state.ts#L26-L34) - the tab keys a page keeps"
---

## Objective

An installed plugin that a list has keeps Overview and Options. It also gets *Details*, *Features*, *Changelog* and the facts column, as a listed plugin's page has.

## Files

- `UPDATE: src/resources/plugins/PluginPage.tsx` - the list entry of the row, and the three tabs.
- `UPDATE: src/resources/plugins/state.ts` - the new tab keys.

## Steps

1. Ask `available` of the host, and take the entry whose `installed.id` is the row's id.
2. Ask `details` of that entry at the installed version.
3. Add *Details*, *Features* and *Changelog* after Overview and Options, from `ListTabs`.
4. Keep the page as it is for a plugin in no list.

## Validation

- `pnpm typecheck` passes.
- On a test ahpd from the ahpd branch, agent-acp's page has the three tabs and its README.

## Resume
