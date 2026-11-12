---
title: Connectors draw the host's operations
status: implemented
depends: [task-01-a-row-keeps-its-offered-operations.md]
layer: "bridges, resources/connectors"
refs:
  - "[code://src/bridges/connectors.ts](../../../../src/bridges/connectors.ts) - the connectors channel and its reducer"
  - "[code://src/resources/connectors/ConnectorPage.tsx](../../../../src/resources/connectors/ConnectorPage.tsx) - the page head buttons"
  - "[code://src/resources/connectors/Explorer.tsx](../../../../src/resources/connectors/Explorer.tsx) - the row menu"
  - "[code://src/resources/tunnels/Page.tsx#L53](../../../../src/resources/tunnels/Page.tsx#L53) - the pattern to copy"
---

## Objective

The connector page head and row menu draw the operations the host lists for each connector. A host with no connectors operations list keeps today's buttons.

## Files

- `UPDATE: src/bridges/connectors.ts` - the channel folds `x-ahpd-connectors/operations` with `operationsReducer`.
- `UPDATE: src/resources/connectors/ConnectorPage.tsx` - the head draws `Buttons` from `rowOperations` when the host lists operations.
- `UPDATE: src/resources/connectors/Explorer.tsx` - the row menu draws `operationItems` from `rowOperations` when the host lists operations.

## Steps

1. Fold `x-ahpd-connectors/operations` into the connectors state, as the tunnels bridge does.
2. In the page head, draw `Buttons` from `rowOperations` when the state has `operations`.
3. In the row menu, draw `operationItems` from `rowOperations` when the state has `operations`.
4. Keep today's enable, disable and sign-in buttons for a state with no `operations`.

## Validation

- Test that an enabled connector row with `operations` of Disable and Remove draws those two.
- Test that a state with no `operations` draws today's buttons.
- The test suite passes.

## Resume

