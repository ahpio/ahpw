---
title: Agents and connectors list their alerts
domain: plugins
status: built
priority: medium
created: 2026-11-11
revalidated: 2026-11-11
refs:
  - git://0f9d12a - the last commit that holds the brief `an-agent-or-connector-lists-its-alerts-and-turns-off.md`, which this plan and its sibling cover
  - git://57b7f33 - the commit of ahpw this plan was checked at
  - "[code://src/bridges/agents.ts#L48-L78](../../../../src/bridges/agents.ts#L48-L78) - `AgentState`, `AgentHealth` and `AgentRow`, which reads `health`"
  - "[code://src/bridges/connectors.ts#L100-L145](../../../../src/bridges/connectors.ts#L100-L145) - `ConnectorState`, `ConnectorHealth` and `ConnectorRow`, which reads `health`"
  - "[code://src/bridges/plugins.ts#L68-L73](../../../../src/bridges/plugins.ts#L68-L73) - `PluginAlert`, the same alert the host sends for plugins"
  - "[code://src/resources/plugins/Overview.tsx#L61-L83](../../../../src/resources/plugins/Overview.tsx#L61-L83) - a plugin page's alerts, grouped by level, the pattern to share"
  - "[code://src/resources/plugins/rows.ts#L80-L95](../../../../src/resources/plugins/rows.ts#L80-L95) - a plugin row's dot and line from its first `error` alert"
  - "[code://src/resources/agents/Overview.tsx#L18-L50](../../../../src/resources/agents/Overview.tsx#L18-L50) - `healthLine` and the agent's state fact"
  - "[code://src/resources/agents/Page.tsx#L33-L50](../../../../src/resources/agents/Page.tsx#L33-L50) - `Health`, the last check and the check button"
  - "[code://src/resources/agents/Explorer.tsx#L21-L26](../../../../src/resources/agents/Explorer.tsx#L21-L26) - `dotOf`, an agent row's dot"
  - "[code://src/resources/connectors/Overview.tsx#L94-L149](../../../../src/resources/connectors/Overview.tsx#L94-L149) - `healthFacts`, and `PlanPart` reading `health`"
  - "[code://src/resources/connectors/SignInStep.tsx#L57-L97](../../../../src/resources/connectors/SignInStep.tsx#L57-L97) - the sign-in step's last check, from `health.check`"
  - "[code://src/resources/connectors/rows.ts#L11-L84](../../../../src/resources/connectors/rows.ts#L11-L84) - a connector row's dot by state"
  - https://github.com/ahpio/ahpd/blob/ea240db71/packages/sdk/src/types/plugin.ts#L803 - `Alert`, with `level`, `text`, `ref` and `at`
  - https://github.com/ahpio/ahpd/blob/ea240db71/docs/plugins/PLUGINS.md#x-ahpd-agents - the agent row, its states and its alerts
  - https://github.com/ahpio/ahpd/blob/ea240db71/docs/plugins/PLUGINS.md#x-ahpd-connectors - the connector row, its states and its alerts
---

## Goal

An agent page and a connector page list every problem the host found, one by one, as a plugin page does.
A row in the agents or connectors list turns red with its first error, as a plugin row does.
ahpd sends `alerts` and no `health` since ahpio/ahpd#289, so today these pages show no problem at all.

## Reconnaissance

The files read and the patterns to reuse are the `refs` above, each with its note.

### Searches performed

- `rg -n "health" src` - every read of `health`: the agent page, the agent overview, the connector overview, `PlanPart` and the sign-in step.
- `rg -n "alerts" src/resources/plugins` - the plugin page and the plugin row read `alerts`.
- `git diff --stat ea240db71 origin/main` in ahpd, over the alert, agent and connector files - no change since the brief.

### Runtime path

```
x-ahpd-agents:// row { state, alerts? } -> AgentRow -> agents Explorer dot + line, agent page AlertList, state fact
x-ahpd-connectors:// row { state, alerts? } -> ConnectorRow -> connectors rows dot + line, connector page AlertList, sign-in step's check alert
```

### Gaps

- `AgentRow` and `ConnectorRow` know no `alerts`, and their states lack `failed`, `paused` and `disabled`.
- The alert list is drawn inside the plugin page, and no other page can use it.
- `PluginAlert` has no `at`.

## Answers

| What | Source | Task |
| --- | --- | --- |
| Alerts and turning off are two plans, as ahpd built them. | (defaulted: ahpd's plans `agents-and-connectors-list-their-alerts` and `an-agent-or-connector-turns-off`) | - |
| The alerts are drawn as the plugin page draws them: grouped by level, loudest first, with `ref` and time. | Brief, *The change* | 01 |
| A row's dot and line come from its first `error` alert, as a plugin row's do. | Brief, *The change* | 02 |
| Nothing is drawn by a hardcoded `ref`; an alert the host adds later shows with no change. | Brief, *The change* | 01 |
| `healthLine`, `healthFacts`, the `health` types and their strings go. | Brief, *The change* | 02 |
| `PlanPart` reads no quota from the row; the plugin's own view draws it. | Brief, *What ahpd sends* | 02 |
| The sign-in step shows the `check` alert in place of the last check. | Brief, *The change* | 02 |

## Proposed architecture

- **Data flow** - The rows carry `alerts`. One `AlertList` draws a list for a plugin, an agent or a connector.
- **Event flow** - None new; a row change redraws the page.
- **State flow** - None new; the alerts live on the channel rows.
- **Layer responsibilities** - `src/bridges/`: the row types. `src/shell/view/AlertList.tsx`: the list. The agent, connector and plugin pages: where it goes.
- **Source-of-truth files** - ahpd's `PLUGINS.md` for the rows and their states.

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - One alert list for every row](task-01-one-alert-list-for-every-row.md) | done | - |
| [02 - Agent and connector pages draw alerts](task-02-agent-and-connector-pages-draw-alerts.md) | done | 01 |

## Risks and tradeoffs

- A host from before ahpio/ahpd#289 sends `health` and no `alerts` - its pages show no problem, as they do today on a new host.
- The host keeps alerts in memory only. A restart clears them until the checks run again, and the page shows what the host sends.

## Resume state

- **Done so far:** both tasks are done, merged in ahpio/ahpw#62; see [implemented.md](implemented.md).
- **Next action:** none.
- **Open questions:** none.
- **Watch out for:** ahpd repeats a plugin's configured problem as an alert. The plugin page filters it out, and keeps that filter before the shared list.

## Final verification checklist

- [ ] An agent with a missing key shows its `env:` alert on its page, and its row is red with the alert's text.
- [ ] A connector with a failed check shows its `check` alert on its page and in the sign-in step.
- [ ] The plugin page shows its alerts as before.
- [ ] No `health` read is left: `rg -n "health" src` finds none outside i18n removals.
- [ ] The pages show at 1400 and 390 px.
