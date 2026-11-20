---
title: The agent and plugin pages link and ask - implemented
date: 2026-11-19
refs:
  - git://3a2f016
  - "[code://src/resources/agents/actions.ts](../../../../src/resources/agents/actions.ts)"
  - "[code://src/resources/plugins/actions.ts](../../../../src/resources/plugins/actions.ts)"
  - "[code://src/resources/operations/run.ts](../../../../src/resources/operations/run.ts)"
  - "[code://src/resources/sessions/agent-choice.ts](../../../../src/resources/sessions/agent-choice.ts)"
  - "[code://src/resources/plugins/ListTabs.tsx](../../../../src/resources/plugins/ListTabs.tsx)"
---

Every agent, connector and plugin action that changes state asks before it runs.
The agent page opens its plugin and its sessions, and the Sessions explorer has an *Agent* choice.
A plugin page shows its facts in one section before the README, on *Overview* only.

## What was built

- [`code://src/resources/agents/actions.ts`](../../../../src/resources/agents/actions.ts) - `setMode` asks before it sends.
- [`code://src/resources/plugins/actions.ts`](../../../../src/resources/plugins/actions.ts) - `installListed`, `togglePlugin` and `reloadOne` ask before they send.
- [`code://src/resources/operations/run.ts`](../../../../src/resources/operations/run.ts) - `runOperation` asks before every host operation with no form, through `askBefore` in [`code://src/bridges/operations.ts`](../../../../src/bridges/operations.ts).
- [`code://src/resources/sessions/agent-choice.ts`](../../../../src/resources/sessions/agent-choice.ts) - the *Agent* choice, its menu built from each host's agents, and `ahp.showSessionsOf`.
- [`code://src/resources/agents/Overview.tsx`](../../../../src/resources/agents/Overview.tsx) - the *Plugin* and *Sessions* facts are links.
- [`code://src/resources/plugins/ListTabs.tsx`](../../../../src/resources/plugins/ListTabs.tsx) - `PluginFacts`, the section before the README, and `TabBody`.

## Verified

- PR #106: 176 test files and 1040 tests passed; CI green.
- PR #108: 178 test files and 1047 tests passed; CI green.
- Softov ran the checks by hand on 2026-11-19 and they passed.

## Departures from the plan

- Host operations - the plan said ahpd sends no agent operations, and it does, for agents and connectors.
  PR #108 makes every host operation ask, as Softov chose.

## Left for later

- None.
