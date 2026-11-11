---
title: One alert list for every row
status: implemented
depends: []
layer: "ahpw bridges and shell view"
refs:
  - "[code://src/resources/plugins/Overview.tsx#L61-L83](../../../../src/resources/plugins/Overview.tsx#L61-L83) - the list this task moves to the shell"
  - "[code://src/bridges/plugins.ts#L68-L73](../../../../src/bridges/plugins.ts#L68-L73) - `PluginAlert`, which becomes the shared `HostAlert`"
---

## Objective

`AlertList` draws any row's alerts, grouped by level, loudest first, each with its text, its `ref` and its time.
`AgentRow` and `ConnectorRow` carry `alerts` and the states ahpd sends.

## Files

- `CREATE: src/shell/view/AlertList.tsx` - the list, moved from the plugin page.
- `CREATE: src/shell/view/AlertList.test.ts` - grouping, order, `ref` and time.
- `CREATE: src/shell/view/alert-list.css` - the list's styles, moved from `app.css`.
- `UPDATE: src/bridges/plugins.ts:68-73` - `HostAlert` with `at`, and `PluginAlert` as its name for plugins.
- `UPDATE: src/bridges/agents.ts:48-78` - `alerts` on `AgentRow`; `failed`, `paused` and `disabled` in `AgentState`.
- `UPDATE: src/bridges/connectors.ts:100-145` - `alerts` on `ConnectorRow`; `failed` and `disabled` in `ConnectorState`.
- `UPDATE: src/resources/plugins/Overview.tsx:61-83` - use `AlertList`.
- `UPDATE: src/style/app.css` - remove the moved `.web-plugin__alerts` rules.

## Steps

1. Rename `PluginAlert` to `HostAlert`, add `at?: string`, and keep `PluginAlert` as an alias.
2. Move the plugin page's alert block to `AlertList({ alerts })`, with `ALERT_LEVELS` and the plural titles.
3. Show the time of an alert with `at`, as the usage records show a time.
4. Keep the plugin page's filter of its own problem before it calls `AlertList`.
5. Add `alerts?: HostAlert[]` to `AgentRow` and `ConnectorRow`.
6. Add `failed`, `paused` and `disabled` to `AgentState` and `AGENT_STATES`, and `failed` and `disabled` to `ConnectorState` and `CONNECTOR_STATES`.
7. Add the state words to `en.json`, `es.json` and `pt.json`.

## Validation

- `src/shell/view/AlertList.test.ts`: levels in order, an empty level not drawn, `ref` and time shown when present.
- `pnpm typecheck` and `pnpm test` pass.
- By hand, the plugin page shows its alerts as before.

## Resume
