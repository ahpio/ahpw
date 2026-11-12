---
title: A record shows only the operations it offers
created: 2026-11-12
refs:
  - git://99d8431 - the commit of this repository the facts were checked at
  - git://9e648f384 - the commit of ahpd the host facts were checked at, the head of ahpio/ahpd#302
  - "[code://src/bridges/operations.ts#L78](../../src/bridges/operations.ts#L78) - `rowOperations`, which picks a row's operations by its `kind` only"
  - "[code://src/resources/operations/Buttons.tsx](../../src/resources/operations/Buttons.tsx) - `OperationButtons` draws each plain operation as a head button, and `DangerOperations` each one that asks first"
  - "[code://src/resources/tunnels/Page.tsx#L62](../../src/resources/tunnels/Page.tsx#L62) - the tunnel page head, drawn from `rowOperations`"
  - "[code://src/resources/agents/Page.tsx#L117](../../src/resources/agents/Page.tsx#L117) - the agent page head, drawn from `agentModes`, ahpw's own rule"
  - "[code://src/resources/agents/actions.ts](../../src/resources/agents/actions.ts) - `agentModes`, `mayCheck` and `mayRemove`, which pick an agent's buttons from its state"
  - https://github.com/ahpio/ahpd/blob/9e648f384/packages/sdk/src/tunnels/channel.ts#L186-L210 - each tunnel row's `operations`, the ids it offers now
  - https://github.com/ahpio/ahpd/blob/9e648f384/packages/sdk/src/kinds/operations.ts#L54-L60 - `offers`, and the refusal of an id the target does not list
  - https://github.com/ahpio/ahpd/blob/9e648f384/docs/plugins/PLUGINS.md - the four channels that serve an operations list
  - https://github.com/microsoft/vscode/blob/1564f100807a/src/vs/workbench/contrib/extensions/browser/extensionsActions.ts#L1706-L1850 - VS Code's Enable and Disable actions each apply only in the state they change, so an extension never offers both
---

# A record shows only the operations it offers

Softov wants a tunnel, client, agent or connector page to show only what the record can do now.
On 2026-11-11 a running devtunnel page showed Enable, Disable, Start, Stop and Restart together.
ahpd now sends each record's `operations`, the ids it offers now, in ahpio/ahpd#302.
ahpw should draw from that list, and stop deciding an agent's buttons with its own rule.

## What others do

- VS Code's extensions view shows Enable or Disable on an extension, by its state, and never both.
- AHP puts `enabled` on a customization, and the client draws one toggle from it.
- ahpd, from #302, sends the ids on each record. The client draws those, and the host refuses any other id.

## What ahpw has today

- [`rowOperations`](../../src/bridges/operations.ts#L78) keeps the operations of the record's `kind`, and every one of them.
- [`OperationButtons`](../../src/resources/operations/Buttons.tsx) draws each plain operation as a head button, and `DangerOperations` puts each one that asks first in the danger zone.
- The tunnel and client pages and rows draw from `rowOperations`, so every record of a kind gets every button.
- The agent page head and row menu draw from [`agentModes`](../../src/resources/agents/actions.ts), which works out Enable, Pause and Disable from the row's state in ahpw.
- The connector page and row call the fixed `x-ahpd/connectors/enable` and `disable`.
- An operation with an input, such as Anonymous access, opens a dialog with a form. Its button does not say the current value.

## Who writes

- PR #63, *An agent or connector turns off*, changes `src/bridges/agents.ts`, `src/bridges/connectors.ts`, and the agent and connector pages and rows. This change builds on it.
- No worktree of ahpw touches `src/resources/operations`, `src/resources/tunnels` or `src/resources/clients`.
- The plan [plugins/20261112-0221-a-record-draws-the-operations-it-offers](../plans/plugins/20261112-0221-a-record-draws-the-operations-it-offers/plan.md) covers the filter and the move of agents and connectors. This brief is the UI change around it.

## The change

- A page head and a row menu show only the operations the record's `operations` names.
- An operation the record does not offer is not drawn. Softov: "we don't render enable/disable start/stop at the same time".
- Agents and connectors draw their buttons from the host's list through `OperationButtons` and the row menu, as tunnels do. Their labels are the host's.
- A record with no `operations`, from a host before #302, shows what it shows today.

## Open points

- A mockup of the tunnel, agent and connector page heads, before a plan builds the UI.
- Whether a pair, such as Enable and Disable, shows as one button that names the next state, or as a switch.
- Whether an operation with an input shows its value, such as Anonymous access as a switch that reads on or off.
- The order of the head buttons: the host's order, or the state change first and the record's own operations after.
