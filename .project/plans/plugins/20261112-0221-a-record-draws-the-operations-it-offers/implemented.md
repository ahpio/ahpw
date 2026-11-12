---
title: A record draws the operations it offers - implemented
date: 2026-11-12
refs:
  - git://080b07e
  - git://9e648f384 - the head of ahpio/ahpd#302 the build was checked against, not merged yet
  - "[code://src/bridges/operations.ts](../../../../src/bridges/operations.ts)"
  - "[code://src/bridges/operations-state.ts](../../../../src/bridges/operations-state.ts)"
  - "[code://src/bridges/own-grants.ts](../../../../src/bridges/own-grants.ts)"
---

A tunnel, client, agent or connector row shows only the operations its record offers now.
An agent and a connector draw their head buttons and row menu from the host's operations, when the host lists them.
The buttons take the host's words and order.
A host that lists none keeps ahpw's own buttons from plan plugins/20261111-1228.

## What was built

- [`code://src/bridges/operations.ts`](../../../../src/bridges/operations.ts) - `rowOperations` keeps only the ids a record's `operations` names.
- [`code://src/bridges/operations-state.ts`](../../../../src/bridges/operations-state.ts) - `operationsReducer` and the state types, apart from the command, so the agents and connectors bridges load without the host connection.
- [`code://src/bridges/own-grants.ts`](../../../../src/bridges/own-grants.ts) - `runnableBy`: the operations a reader may run, by `operation:invoke` or the operation's own grant.
- [`code://src/bridges/agents.ts`](../../../../src/bridges/agents.ts) and [`code://src/bridges/connectors.ts`](../../../../src/bridges/connectors.ts) - both channels fold their operations list.
- [`code://src/resources/agents/Page.tsx`](../../../../src/resources/agents/Page.tsx) and [`code://src/resources/connectors/ConnectorPage.tsx`](../../../../src/resources/connectors/ConnectorPage.tsx) - the head draws `OperationButtons`, and Settings draws Remove with `DangerOperations`.
- [`code://src/resources/operations/Buttons.tsx`](../../../../src/resources/operations/Buttons.tsx) - `OperationButtons` takes the page's own buttons, such as *New session*, after the host's.

## Verified

- `operations.test.ts` holds the filter and the grant cases. `pnpm typecheck` and `pnpm test` pass, 856 tests.
- On a test daemon at ahpd#302 `9e648f384`, the agent and connector pages drew ahpw's own buttons, because the host sent no list.
- With #302's five agent operations put in the page's state, the head showed *Pause*, *Disable*, *Check* and *New session*.
- *Pause* ran through `x-ahpd/invokeOperation`. The record turned paused, and the head showed *Enable*, *Disable* and a disabled *New session*, as mockup A shows.
- A connector disabled and enabled through its operations, and Remove showed in Settings.
- A user holding only `agent:list` and `connector:list` saw no operation.

## Departures from the plan

- #302's agents and connectors channels send no operations list in their snapshot, though its tunnels and clients channels do.
- So ahpw draws its own buttons for agents and connectors until ahpd sends the list.
- A reader sees only the operations their grants run, to keep the answer of plan plugins/20261111-1228.
- A removed agent or connector shows its gone note, as a removed tunnel does; the old Remove closed the tab.
- The menu puts the host's operations under *More*, as plan plugins/20261111-1228 put the switch.

## Left for later

- The devtunnel checks wait for a signed-in Dev Tunnels account, in [operations-tunnel-checks.md](../../../pending/operations-tunnel-checks.md).
