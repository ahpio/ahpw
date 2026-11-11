---
title: An agent or connector page lists its alerts, and turns it off
created: 2026-11-11
refs:
  - git://33f004c - the commit of ahpw the facts were checked at
  - git://ea240db71 - the commit of ahpd the host facts were checked at, with the alerts (ahpio/ahpd#289) and the turn-off (ahpio/ahpd#291) merged
  - "[code://src/bridges/agents.ts#L60-L78](../../src/bridges/agents.ts#L60-L78) - `AgentRow`, which reads `health`"
  - "[code://src/bridges/connectors.ts#L118-L145](../../src/bridges/connectors.ts#L118-L145) - `ConnectorHealth` and `ConnectorRow`, which read `health`"
  - "[code://src/resources/agents/Overview.tsx#L19-L49](../../src/resources/agents/Overview.tsx#L19-L49) - `healthLine`, the agent's one health line"
  - "[code://src/resources/agents/Page.tsx#L36-L46](../../src/resources/agents/Page.tsx#L36-L46) - the agent page's health line"
  - "[code://src/resources/connectors/Overview.tsx#L94-L149](../../src/resources/connectors/Overview.tsx#L94-L149) - `healthFacts`, and `PlanPart` reading `health.quotaSnapshots` and `health.account`"
  - "[code://src/resources/connectors/SignInStep.tsx#L57-L97](../../src/resources/connectors/SignInStep.tsx#L57-L97) - the sign-in step's last check, from `health.check`"
  - "[code://src/resources/plugins/Overview.tsx#L17-L75](../../src/resources/plugins/Overview.tsx#L17-L75) - a plugin page's alerts, grouped by level, the pattern to reuse"
  - "[code://src/resources/plugins/rows.ts#L80-L95](../../src/resources/plugins/rows.ts#L80-L95) - a plugin row's dot and line from its first `error` alert"
  - "[code://src/resources/plugins/Explorer.tsx#L55](../../src/resources/plugins/Explorer.tsx#L55) - a plugin row's enable and disable action, the switch to mirror"
  - "[code://src/bridges/plugins.ts#L27-L28](../../src/bridges/plugins.ts#L27-L28) - the plugin methods `enable` and `disable`"
  - https://github.com/ahpio/ahpd/blob/ea240db71/packages/sdk/src/plugins/alerts.ts#L30 - `alertList`, the one list the host keeps for plugins, agents and connectors
  - https://github.com/ahpio/ahpd/blob/ea240db71/packages/sdk/src/types/plugin.ts#L803 - `Alert`, with `level`, `text`, `ref` and `at`
  - https://github.com/ahpio/ahpd/blob/ea240db71/packages/sdk/src/types/agents.ts#L81 - `AgentMode`, `enabled`, `paused` or `disabled`
  - https://github.com/ahpio/ahpd/blob/ea240db71/packages/sdk/src/types/agents.ts#L187 - `AgentState`, with `failed`, `paused` and `disabled`
  - https://github.com/ahpio/ahpd/blob/ea240db71/packages/sdk/src/connectors/channel.ts#L155 - `ConnectorState`, with `failed` and `disabled`
  - https://github.com/ahpio/ahpd/blob/ea240db71/docs/plugins/PLUGINS.md#x-ahpd-connectors - the connector row, its states, its alerts and its methods
  - https://github.com/ahpio/ahpd/blob/ea240db71/docs/plugins/PLUGINS.md#x-ahpd-agents - the agent row, its states, its `mode`, its alerts and its methods
  - https://github.com/ahpio/ahpd/blob/ea240db71/packages/agent-claude/src/views.ts - where a Claude login's quota is drawn: the plugin's own view
---

# An agent or connector page lists its alerts, and turns it off

Softov wants each agent and connector to list every problem it has, one by one, instead of one health line.
He also wants a person to turn an agent or a connector off without removing it, and to pause an agent.
ahpd now sends the alerts and the three modes, both merged on `main`.
ahpw still reads `health`, which ahpd no longer sends, so its agent and connector pages show no problem today.

## What others do

ahpw's own plugin page is the reference: the same host sends the same `Alert` for plugins.

| Case | Plugin page today |
| --- | --- |
| Alerts | Grouped by level, loudest first, each with its text and its `ref` in code |
| Row dot | The first `error` alert makes the dot `failed`, with its text as the row's second line |
| Switch | The row's action enables or disables the plugin, with `x-ahpd/plugins/enable` and `/disable` |

## What ahpd sends at `ea240db71`

The alerts:

- An agent row and a connector row carry `alerts`, a list of `{ level, text, ref, at }`, and no `health`.
- A row with no problem carries no `alerts` key.
- An agent's refs are `env:<VARIABLE>` and `secret:<name>` for a missing key, `open` for a failed open, and `probe` for a probe that did not pass.
- A connector's refs are the same, with `check` for a check and `call` for a failed call.
- An alert is kept by its `ref`, so a second problem of one kind replaces the first.
- The list is in memory, so a restart clears it until the opens and checks raise it again.
- A Claude login's quota and account come from agent-claude's view, not from `health`.

The states:

| Row | States |
| --- | --- |
| Agent | `ready`, `failed`, `invalid`, `unavailable`, `paused`, `disabled` |
| Connector | `ready`, `unauthorized`, `failed`, `invalid`, `unavailable`, `disabled` |

- `failed` is a record that fits its schema and did not open. `invalid` is a config that does not fit.
- An agent record stores `mode`: `enabled`, `paused` or `disabled`. A record with no `mode` is enabled.
- A connector record stores `enabled`. A record with no `enabled` is on.

The modes:

- A paused agent stays open: its keys are read, its probe runs and its alerts show.
- The host starts no new session or chat on a paused agent, moves no chat to it and sends it no message.
- A disabled agent is not opened, so no key is read, no probe runs and it shows no alerts.
- A disabled agent's sessions keep their history, and after a restart they come back once it is enabled.
- A disabled connector is closed, answers no call, lists no model and shows no alerts.
- A disabled connector stays in the list that agent records pick connectors from.
- `x-ahpd/agents/check` refuses an agent that is off.

The methods each take `{ id }` and answer the row:

| Method | Grant |
| --- | --- |
| `x-ahpd/agents/enable`, `/pause`, `/disable` | `agent:put`, and the owner's |
| `x-ahpd/connectors/enable`, `/disable` | `connector:put`, and the owner's, or none for the plugin of the connector's adapter |

- A `put` keeps the mode a record had, and refuses a `mode` parameter.

## What ahpw has today

- `AgentRow.health` and `ConnectorRow.health` are typed, and nothing fills them on a host at `ea240db71`.
- The agent page and the agent overview draw one `healthLine` from `health`, or "never checked".
- The connector overview draws `healthFacts` from `health.check` and `health.lastFailure`.
- `PlanPart` reads `health.quotaSnapshots` and `health.account`, which ahpd never sent.
- The sign-in step shows the last check from `health.check`.
- No row type knows `alerts`, `mode`, `enabled`, `paused` or `disabled`.
- The plugin page has the alert list and the row switch that this change can reuse.

## Who writes

- ahpw plans `plugins/04-connectors`, `plugins/09-a-connector-signs-in-from-its-form` and `plugins/20261028-2151-a-connector-page-says-what-it-serves` are `active`, and touch the connector overview and the sign-in step.
- No open PR on `ahpio/ahpw` touches these files at `33f004c`.
- No commit since `050732b` changed them.

## The change

- The agent and connector rows read `alerts`, and no longer `health`.
- Each page lists its alerts with the plugin page's alert list, grouped by level, each with its text, its `ref` and its time.
- A row's dot and second line come from its first `error` alert, as a plugin row's do.
- The pages draw `failed`, `paused` and `disabled` from the row's own state.
- An agent row and page offer enable, pause and disable; a connector row and page offer enable and disable.
- The switch shows only to a person whose grants allow it.
- The agent's check action is not offered while the agent is off.
- `healthLine`, `healthFacts`, the `health` types and their strings go.
- `PlanPart`'s `health` read goes, as the quota comes from the plugin's view.
- The sign-in step shows the `check` alert in place of the last check.
- Nothing is drawn by a hardcoded `ref`: an alert the host adds later shows with no change in ahpw.

## Open points

1. A mockup of the agent page and the connector page, with alerts and the switch, comes before the plan.
2. Whether the switch is a row action, as on the plugin page, or a control on the page itself, or both.
3. Whether pause and disable ask the person to confirm, as removing a record does.
4. Whether a disabled agent's sessions in the session list say why they cannot take a message. ahpd sends nothing for that today.
