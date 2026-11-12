---
title: An MCP server row opens in place
status: todo
depends: []
layer: "ahpw agents"
refs:
  - "[code://src/resources/agents/Customizations.tsx#L73-L147](../../../../src/resources/agents/Customizations.tsx#L73-L147) - `ItemRow` and `KindPanel`; a prompt row expands in place"
  - "[code://src/resources/agents/words.ts#L161-L175](../../../../src/resources/agents/words.ts#L161-L175) - `stateOf`, the MCP state word"
  - "[code://src/resources/agents/words.ts#L232-L249](../../../../src/resources/agents/words.ts#L232-L249) - `childRow`, which builds a child's row"
  - "[code://src/resources/agents/kinds.ts#L77-L84](../../../../src/resources/agents/kinds.ts#L77-L84) - where a bare MCP server becomes a `KindItem`"
---

## Objective

An MCP server row says its state in one word, and a click opens it in place, as mockup A shows.
An open row shows the state with its whole message and `errorType`, and where the server is declared.
It also shows the session default, and the ID with a copy button.

## Files

- `CREATE: src/resources/agents/mcp.ts` - `mcpFacts(server)`: the short state word, the message, the `errorType`, where it is declared, and whether a session starts with it on.
- `CREATE: src/resources/agents/mcp.test.ts` - each state kind, a `claude-internal:` uri, a file uri, and an `enablement` on and off.
- `UPDATE: src/resources/agents/words.ts:161-175` - `stateOf` gives an MCP server its short word; the message moves to `mcpFacts`.
- `UPDATE: src/resources/agents/kinds.ts:8-27` - `KindItem` carries the server's facts.
- `UPDATE: src/resources/agents/kinds.ts:77-84` - a bare server and a server inside a group carry their facts.
- `UPDATE: src/resources/agents/Customizations.tsx:73-147` - an MCP row expands in place and draws its facts.
- `UPDATE: src/resources/agents/customizations.css` - the open row's grid of facts.
- `UPDATE: src/i18n/en.json` - *Needs sign-in*, *Error*, *Claude account*, and the facts' labels.
- `UPDATE: src/i18n/es.json` - the same.
- `UPDATE: src/i18n/pt.json` - the same.

## Steps

1. Write `mcpFacts` from a server's `state`, `uri`, `id` and `enablement`.
2. Map `ready`, `starting` and `stopped` to their own words.
3. Map `authRequired` and an `mcpAuthRequired` error to *Needs sign-in*, and any other error to *Error*.
4. Name a `claude-internal:` server's source *Claude account*, and a file server's source by the file's short path.
5. Read the session default from `enablement[0].enabled`, and treat no entry as on.
6. Make `stateOf` answer the short word for an MCP server.
7. Carry the facts on each MCP `KindItem`, for a bare server and for one inside a group.
8. Make the MCP servers tab expand rows in place, as the prompts tab does.
9. Draw an open row's facts as label and value pairs.
10. Label them *State*, *Declared in*, *In a session* and *ID*, with a `CopyButton` on the ID.
11. Show the message and the `errorType` of a server in `error` or `authRequired` under *State*.
12. Compare the tab to mockup A at 1400 and 390 px; stop and ask on any difference.

## Validation

- `src/resources/agents/mcp.test.ts` passes.
- `pnpm typecheck` and `pnpm test` pass.
- By hand, on a host with a server that needs signing in: the row says *Needs sign-in*.
- By hand: the open row shows the message and `mcpAuthRequired`.

## Resume
