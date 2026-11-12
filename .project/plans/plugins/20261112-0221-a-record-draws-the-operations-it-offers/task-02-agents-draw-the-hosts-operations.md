---
title: Agents draw the host's operations
status: done
depends: [task-01-a-row-keeps-its-offered-operations.md]
layer: "bridges, resources/agents"
refs:
  - "[code://src/bridges/agents.ts](../../../../src/bridges/agents.ts) - the agents channel and its reducer"
  - "[code://src/resources/agents/Page.tsx](../../../../src/resources/agents/Page.tsx) - the page head buttons"
  - "[code://src/resources/agents/Explorer.tsx](../../../../src/resources/agents/Explorer.tsx) - the row menu"
  - "[code://src/resources/agents/actions.ts](../../../../src/resources/agents/actions.ts) - `agentModes`, `mayCheck` and `mayRemove`, which pick buttons from the row's state"
  - "[code://src/resources/tunnels/Page.tsx#L53](../../../../src/resources/tunnels/Page.tsx#L53) - the pattern to copy"
---

## Objective

The agent page head and row menu draw the operations the host lists for each agent. A host with no agents operations list keeps today's buttons.

## Files

- `UPDATE: src/bridges/agents.ts` - the channel folds `x-ahpd-agents/operations` with `operationsReducer`.
- `UPDATE: src/resources/agents/Page.tsx` - the head draws `Buttons` from `rowOperations` when the host lists operations.
- `UPDATE: src/resources/agents/Explorer.tsx` - the row menu draws `operationItems` from `rowOperations` when the host lists operations.
- `UPDATE: src/resources/agents/actions.ts` - `agentModes`, `mayCheck` and `mayRemove` stay for a host with no list.

## Steps

1. Fold `x-ahpd-agents/operations` into the agents state, as the tunnels bridge does.
2. In the page head, draw `Buttons` from `rowOperations` when the state has `operations`.
3. In the row menu, draw `operationItems` from `rowOperations` when the state has `operations`.
4. Keep the `agentModes` path for a state with no `operations`.
5. Keep the session note of plan plugins/20261111-1228 on the row's state, not on the operations.

## Validation

- Test a paused agent row whose `operations` are Enable and Disable. Expect those two in the head and the menu.
- Test that a state with no `operations` draws today's buttons.
- The test suite passes.

## Resume

