---
title: A session row drags
status: todo
depends: []
layer: "shell explorer and sessions"
refs:
  - "[code://src/shell/explorer/ExplorerList.tsx#L69-L84](../../../../src/shell/explorer/ExplorerList.tsx#L69-L84) - its props"
  - "[code://src/shell/explorer/ExplorerList.tsx#L149-L150](../../../../src/shell/explorer/ExplorerList.tsx#L149-L150) - the row"
  - "[code://src/resources/sessions/Explorer.tsx#L68-L71](../../../../src/resources/sessions/Explorer.tsx#L68-L71) - the session list"
---

## Objective

A row of the session list drags onto any surface, where the session opens or its tab moves.

## Files

- `UPDATE: src/shell/explorer/ExplorerList.tsx:69-84` - take `onRowDragStart(event, key)`, and make the rows draggable when it is set.
- `UPDATE: src/resources/sessions/Explorer.tsx:68-71` - start scena's open drag for a row.
- `CREATE: src/shell/explorer/ExplorerList.test.tsx` - a row with the handler drags.

## Steps

1. Add `onRowDragStart` to `ExplorerList`.
2. When a caller passes it, give each row `draggable` and `onDragStart`.
3. In the session list, call `startOpenDrag` with `sessionKey(host, id)`, `{ component: 'SessionPage', host, resource: id }` and the session's title.
4. Leave the row's click to `ahp.openSession`.

## Validation

- `src/shell/explorer/ExplorerList.test.tsx`: a row's drag start calls the handler with its key; with no handler, a row is not draggable.
- `npx vitest run` passes.

## Resume
