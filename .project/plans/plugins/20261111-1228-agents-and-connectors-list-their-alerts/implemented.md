---
title: Agents and connectors list their alerts - implemented
date: 2026-11-11
refs:
  - git://plugins/20261111-1228-alerts - the branch of the build
  - "[code://src/shell/view/AlertList.tsx](../../../../src/shell/view/AlertList.tsx)"
  - "[code://src/resources/agents/Overview.tsx](../../../../src/resources/agents/Overview.tsx)"
  - "[code://src/resources/connectors/Overview.tsx](../../../../src/resources/connectors/Overview.tsx)"
  - "[code://src/resources/connectors/rows.ts](../../../../src/resources/connectors/rows.ts)"
---

An agent page and a connector page list the problems the host found, grouped by level, with each alert's ref and time. A row in the agents or connectors list turns red with its first error, and its second line says the error. The connector sign-in step shows the `check` alert. The pages and rows know the `failed`, `paused` and `disabled` states, and no `health` is read.

## What was built

- [`code://src/shell/view/AlertList.tsx`](../../../../src/shell/view/AlertList.tsx) - the list, moved from the plugin page, with the time of each alert.
- [`code://src/shell/view/alert-list.css`](../../../../src/shell/view/alert-list.css) - its styles, moved from `app.css`; a long ref wraps.
- [`code://src/bridges/plugins.ts`](../../../../src/bridges/plugins.ts) - `HostAlert` with `at`; `PluginAlert` is its name for plugins.
- [`code://src/bridges/agents.ts`](../../../../src/bridges/agents.ts) and [`code://src/bridges/connectors.ts`](../../../../src/bridges/connectors.ts) - `alerts` and the new states on the rows; the health types are gone.
- [`code://src/resources/agents/Overview.tsx`](../../../../src/resources/agents/Overview.tsx) and [`code://src/resources/connectors/Overview.tsx`](../../../../src/resources/connectors/Overview.tsx) - `AlertList` over the facts; `healthLine`, `healthFacts` and the `PlanPart` read are gone.
- [`code://src/resources/agents/Explorer.tsx`](../../../../src/resources/agents/Explorer.tsx) and [`code://src/resources/connectors/rows.ts`](../../../../src/resources/connectors/rows.ts) - the dot and the line from the first `error` alert, and a dot for each new state.
- [`code://src/resources/connectors/SignInStep.tsx`](../../../../src/resources/connectors/SignInStep.tsx) - the `check` alert at its level, at the top of the step.
- `src/i18n/en.json`, `es.json` and `pt.json` - the alert words under `shell/alerts`, the new state words and notes; the health words are gone.

## Verified

- `pnpm typecheck` passed, and `pnpm test` passed 834 tests.
- `src/shell/view/AlertList.test.ts` covers the order of the levels, an empty level, and the ref and time. `src/resources/connectors/rows.test.ts` covers the red row and the new dots.
- On a test daemon at ahpd `cc4002706`, an agent whose key is not in the vault showed its `secret:` alert on its page. Its badge and state said *Failed*, and its row was red with the alert's text.
- A connector whose token is not in the vault showed the same. A connector whose check answered 401 showed the `check` alert on its page and in its sign-in step, and its row was red with `HTTP 401`.
- The pages showed at 1400 and 390 px.

## Departures from the plan

- The new state words, tones and dots went in task 01 with the states, since the pages switch on every state.
- A standby agent's badge names its state, such as *Failed*, as mockup A shows it.
- A failed agent or connector shows no note under its head, since its alerts say why, as mockup A shows. A paused or disabled one shows the mockups' notes.
- The time of an alert uses `when`: the time alone for today, as the mockups show it.
- The sign-in step shows the `check` alert at its top, in both of its branches. A record with a token and no account never reaches the signed-in branch, where the plan put it.
- The check button's class is `web-agent__check`, so no `health` name is left in the code.

## Left for later

- The plugin page drew no alert on the test daemon, because no plugin had one. Its list is the shared one, which the unit tests cover.
