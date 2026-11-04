---
title: The operations bridge
status: implemented
depends: []
layer: "bridges"
refs:
  - "[code://src/resources/computers/machines.ts#L24-L44](../../../../src/resources/computers/machines.ts#L24-L44) - the records reducer this one extends with `operations`"
  - "[code://src/resources/changes/changeset.ts#L85-L104](../../../../src/resources/changes/changeset.ts#L85-L104) - the request and refusal this one copies for `x-ahpd/invokeOperation`"
  - "[code://src/shell/notify/index.ts](../../../../src/shell/notify/index.ts) - `confirm` and `failed`"
  - https://github.com/softov/ahpd/blob/c97d8459/packages/sdk/src/kinds/operations.ts - the params the command takes
---

## Objective

One module folds any records channel that lists `operations`, says which operations apply to a row, and invokes one through `x-ahpd/invokeOperation`.

## Files

- `CREATE: src/bridges/operations.ts` - the `Operation` and state types, `operationsReducer(scheme)`, `listOperations`, `rowOperations`, `invokeOperation` and `askFirst`.
- `CREATE: src/bridges/operations.test.ts` - the reducer, the match and the params sent.

## Steps

1. Declare `Operation` as ahpd's `types/kinds.ts` lists it, and `OperationsState` as `{ records, operations }`.
2. Write `operationsReducer(scheme)` for `<scheme>/added`, `<scheme>/changed`, `<scheme>/removed` and `<scheme>/operations`.
3. Write `listOperations(state)`, the operations whose `scopes` include `list`.
4. Write `rowOperations(state, record)`: the record operations of the record's `kind`, or all when it has no `kind`.
5. Write `invokeOperation(host, channel, operation, target, input)` over `hostBridge(host).request('x-ahpd/invokeOperation', ...)`.
6. Send `target` as `{ id }` only when given, and `input` only when given.
7. Write `askFirst(operation)`, which shows `confirm` with the host's `confirmation` and resolves true when it has none.
8. Say a refusal through `failed`, with the operation's label as the title.

## Validation

- `src/bridges/operations.test.ts`: added, changed, removed and operations actions fold; an unknown action leaves the state.
- The same file: a tunnel row gets only its kind's operations; a client row with no `kind` gets `drop`.
- The same file: the request carries `{ channel, operationId }`, plus `target: { id }` and `input` only when given.
- `pnpm typecheck` and `pnpm test` pass.

## Resume

Implemented on 2026-11-03. See [implemented.md](implemented.md).

