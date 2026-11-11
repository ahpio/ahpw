---
title: The bridges turn a record off
status: todo
depends: []
layer: "ahpw bridges and actions"
refs:
  - "[code://src/resources/plugins/actions.ts#L8-L34](../../../../src/resources/plugins/actions.ts#L8-L34) - the pattern: offered method, toggle, host's refusal"
  - "[code://src/bridges/agents.ts#L32-L38](../../../../src/bridges/agents.ts#L32-L38) - `AGENTS`"
  - "[code://src/bridges/connectors.ts#L35-L42](../../../../src/bridges/connectors.ts#L35-L42) - `CONNECTORS`"
---

## Objective

ahpw calls `x-ahpd/agents/enable`, `/pause` and `/disable`, and `x-ahpd/connectors/enable` and `/disable`.
The actions say which of them the host offers, and show the host's words on a refusal.

## Files

- `UPDATE: src/bridges/agents.ts:32-38` - `enable`, `pause` and `disable` in `AGENTS`, and `setAgentMode(host, id, mode)`.
- `UPDATE: src/bridges/connectors.ts:35-42` - `enable` and `disable` in `CONNECTORS`, and `setConnectorOn(host, id, on)`.
- `UPDATE: src/resources/agents/actions.ts` - `agentModes(offers, row)`, the modes the host offers other than the current one, and `setMode`.
- `UPDATE: src/resources/connectors/actions.ts` - `mayTurn(offers, row)` and `turnConnector`.
- `CREATE: src/resources/agents/actions.test.ts` - `agentModes` for each state and each set of offers.
- `UPDATE: src/i18n/en.json` - the button words and the failure words.
- `UPDATE: src/i18n/es.json` - the same.
- `UPDATE: src/i18n/pt.json` - the same.

## Steps

1. Add the three agent methods and the two connector methods to the bridges.
2. Make each bridge call answer the row, and throw when the answer is not a row.
3. Add `agentModes`, which answers the modes other than the agent's own: `enable`, `pause` and `disable`.
4. Keep only the modes whose method is in `offers.methods`.
5. Add `mayTurn` for a connector by the same rule.
6. On a refusal, call `failed` with the host's words, as `togglePlugin` does.
7. Add the words: *Enable*, *Pause*, *Disable*, and one failure line each.

## Validation

- `src/resources/agents/actions.test.ts`: the modes for each state, and none when the host offers no method.
- `pnpm typecheck` and `pnpm test` pass.

## Resume
