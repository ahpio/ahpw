---
title: Agent and connector pages draw alerts
status: todo
depends: [task-01-one-alert-list-for-every-row.md]
layer: "ahpw agents and connectors"
refs:
  - "[code://src/resources/agents/Overview.tsx#L18-L50](../../../../src/resources/agents/Overview.tsx#L18-L50) - `healthLine`, which goes"
  - "[code://src/resources/agents/Page.tsx#L33-L50](../../../../src/resources/agents/Page.tsx#L33-L50) - `Health`, which keeps its check button"
  - "[code://src/resources/connectors/Overview.tsx#L94-L149](../../../../src/resources/connectors/Overview.tsx#L94-L149) - `healthFacts` and the `PlanPart` read, which go"
  - "[code://src/resources/connectors/SignInStep.tsx#L57-L97](../../../../src/resources/connectors/SignInStep.tsx#L57-L97) - the last check, which becomes the `check` alert"
  - "[code://src/resources/plugins/rows.ts#L80-L95](../../../../src/resources/plugins/rows.ts#L80-L95) - the row dot from the first `error` alert"
---

## Objective

The agent page and the connector page list their alerts with `AlertList`.
A row's dot and line come from its first `error` alert, and no `health` is read.

## Files

- `UPDATE: src/resources/agents/Overview.tsx:18-50` - remove `healthLine`; draw `AlertList` under the description; the state fact is the state word.
- `UPDATE: src/resources/agents/Page.tsx:33-50` - `Health` keeps the check button, with no health line.
- `UPDATE: src/resources/agents/Explorer.tsx:21-90` - the dot and a line from the first `error` alert.
- `UPDATE: src/resources/connectors/Overview.tsx:94-149` - remove `healthFacts` and the `PlanPart` read; draw `AlertList`.
- `UPDATE: src/resources/connectors/SignInStep.tsx:57-97` - show the alert whose `ref` is `check`, in place of the last check.
- `UPDATE: src/resources/connectors/rows.ts:11-90` - the dot and a line from the first `error` alert.
- `UPDATE: src/resources/connectors/rows.test.ts` - the dot and the line from an `error` alert.
- `UPDATE: src/bridges/agents.ts` - remove `AgentHealth` and `health`.
- `UPDATE: src/bridges/connectors.ts` - remove `ConnectorHealth`, `CheckOutcome` and `health`.
- `UPDATE: src/i18n/en.json` - remove the `agents/health` and `connectors/health` words.
- `UPDATE: src/i18n/es.json` - the same.
- `UPDATE: src/i18n/pt.json` - the same.

## Steps

1. Draw `AlertList` on the agent overview, under its description, when the row has alerts.
2. Remove `healthLine`, and make the state fact the state word alone.
3. Keep the check button in `Health`, and remove its line.
4. Make an agent row's dot `failed` and its second line the text of its first `error` alert, as `pluginRows` does.
5. Draw `AlertList` on the connector overview, and remove `healthFacts`.
6. Remove the `health` read from `PlanPart`'s call; draw it only with what it gets elsewhere, or remove the call.
7. In the sign-in step, show the alert with `ref` `check`, at its level, in place of the last check.
8. Make a connector row's dot and line come from its first `error` alert.
9. Remove the `health` types and their words.

## Validation

- `src/resources/connectors/rows.test.ts`: a row with an `error` alert is `failed`, with the alert's text as its line.
- `pnpm typecheck` and `pnpm test` pass, and `rg -n "health" src --glob '!src/i18n/**'` finds nothing.
- By hand, on a test daemon: remove an agent's key. Check its `env:` alert on its page, and its red row.
- By hand: a connector with a failed check shows the `check` alert on its page and in its sign-in step.
- By hand: the pages show at 1400 and 390 px.

## Resume
