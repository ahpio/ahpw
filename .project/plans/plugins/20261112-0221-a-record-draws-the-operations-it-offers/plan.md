---
title: A record draws the operations it offers
domain: plugins
status: active
priority: medium
created: 2026-11-12
revalidated: 2026-11-12
requires:
  - plans/plugins/20261111-1228-an-agent-or-connector-turns-off/plan.md
refs:
  - git://d833fac - the last commit that holds the brief `a-record-shows-only-the-operations-it-offers.md`, which this plan covers
  - git://3199308 - the commit of ahpw this plan was checked at
  - https://github.com/ahpio/ahpd/blob/4a0eb9705/.project/plans/plugin/20261112-0145-a-record-lists-the-operations-it-offers/plan.md - the ahpd plan that makes each record list its operation ids, and moves agents and connectors to an operations list
  - "[code://src/bridges/operations.ts#L78-L83](../../../../src/bridges/operations.ts#L78-L83) - `rowOperations`, the one place a row's operations are picked, by `kind` only"
  - "[code://src/resources/operations/Buttons.tsx](../../../../src/resources/operations/Buttons.tsx) - the head buttons the tunnels and clients pages draw from a row's operations"
  - "[code://src/resources/tunnels/Page.tsx#L53](../../../../src/resources/tunnels/Page.tsx#L53) - a tunnel page reads `rowOperations`"
  - "[code://src/resources/tunnels/Explorer.tsx#L42](../../../../src/resources/tunnels/Explorer.tsx#L42) - a tunnel row's menu reads `rowOperations`"
  - "[code://src/bridges/agents.ts#L34-L35](../../../../src/bridges/agents.ts#L34-L35) - the agents channel, which the ahpd plan gives an operations list"
  - "[code://src/bridges/connectors.ts#L36-L37](../../../../src/bridges/connectors.ts#L36-L37) - the connectors channel, which the ahpd plan gives an operations list"
---

## Goal

A tunnel, client, agent or connector page and row show only the operations the record offers now.
An enabled tunnel shows Disable and not Enable, and a running one shows Stop and not Start.
Agents and connectors draw their buttons from the host's operations list, as tunnels do, so their labels come from the host.
This builds on the ahpd plan [plugin/20261112-0145-a-record-lists-the-operations-it-offers](https://github.com/ahpio/ahpd/blob/4a0eb9705/.project/plans/plugin/20261112-0145-a-record-lists-the-operations-it-offers/plan.md), and waits for it to merge.

## Reconnaissance

The files read and the patterns to reuse are the `refs` above, each with its note.

### Searches performed

- `rg -n "rowOperations" src` - the tunnels and clients pages and rows use it; agents and connectors do not.
- `rg -n "agentModes|mayCheck|mayRemove" src` - the agent page and row pick their buttons from the row's state, in ahpw's own code.
- Softov saw a devtunnel page on 2026-11-11 with Enable, Disable, Start, Stop and Restart together.

### Runtime path

```
x-ahpd-<scheme>:// state -> record.operations (ids) -> rowOperations keeps those -> Buttons and row menu -> x-ahpd/invokeOperation
```

### Gaps

- `rowOperations` filters by `kind` only, so every record of a kind gets every operation.
- The agents and connectors bridges read no operations list.

## Answers

| What | Source | Task |
| --- | --- | --- |
| A record shows only the operations its `operations` field names | Softov, 2026-11-11: "we don't render enable/disable start/stop at the same time" | 01 |
| An operation a record does not offer is hidden, not greyed | Softov, 2026-11-11: "we don't render" them | 01 |
| A record with no `operations` field, from an older host, shows what it shows today | (defaulted: ahpw keeps working on a host before the ahpd plan) | 01, 02, 03 |
| Agents and connectors draw their buttons from the operations list, through `Buttons` and the row menu | Softov, 2026-11-11, in ahpd: "Move them to the operations list" | 02, 03 |
| The buttons stay where plan plugins/20261111-1228 put them: the page head and the row menu | Softov, 2026-11-11: "A: head buttons + menu" | 02, 03 |
| An operation's label is the host's, as a tunnel operation's is | (defaulted: a client draws only what the host sends) | 02, 03 |
| Each offered operation is one button in the host's words, as mockup A shows; a pair is never one switch | Softov, 2026-11-12: "A now" | 02, 03 |
| The head buttons follow the host's order in `operations` | (defaulted: a client draws only what the host sends) | 01 |
| An operation with an input, such as Anonymous access, opens its form and does not show its value | Softov, 2026-11-12: "A now" | 01 |

## Mockups

- `mock-ops/a.png` - the chosen head: a button per offered operation, for a running devtunnel and a paused agent.
- `mock-ops/b.png` - switches and a mode control, not chosen.

The mockups are in `/home/softov/.local/cache/tmp/claude-1000/-home-softov/b87363c7-8544-4005-8ce4-17e80b7f0cd4/scratchpad/mock-ops/`.

## Proposed architecture

- **Data flow** - `rowOperations` keeps the operations whose id the record's `operations` names, when the record has that field.
- **State flow** - the agents and connectors bridges fold `<scheme>/operations` with `operationsReducer`, as the tunnels bridge does.
- **Layer responsibilities** - bridges: the filter and the two reducers. · resources: the agent and connector pages and rows draw `Buttons` and `operationItems`.
- **Source-of-truth files** - [`code://src/bridges/operations.ts`](../../../../src/bridges/operations.ts)

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - A row keeps the operations its record offers](task-01-a-row-keeps-its-offered-operations.md) | done | - |
| [02 - Agents draw the host's operations](task-02-agents-draw-the-hosts-operations.md) | done | 01 |
| [03 - Connectors draw the host's operations](task-03-connectors-draw-the-hosts-operations.md) | done | 01 |

## Risks and tradeoffs

- The ahpd plan may change the shape of `operations` in review. Read the merged ahpd code before task 01, and follow it.
- Plan plugins/20261111-1228 is in PR #63. Build this plan on its branch, or on main after it merges.

## Resume state

- **Done so far:** the three tasks are done and merged in ahpio/ahpw#67, as [implemented.md](implemented.md) says.
- **Next action:** Softov runs [operations-tunnel-checks.md](../../../pending/operations-tunnel-checks.md); ahpd sends the agents and connectors operations list.
- **Open questions:** none.
- **Watch out for:** a host on an older ahpd must still see the turn-off buttons.

## Final verification checklist

- [ ] Against a daemon with the ahpd plan, a running devtunnel page shows Disable, Stop, Restart and Anonymous access, and not Enable or Start.
- [x] A paused agent's page shows Enable and Disable, and not Pause.
- [x] Against a daemon without the ahpd plan, the agent and connector buttons are as today.
- [ ] The devtunnel form shows a Person field from the schema, with no change in ahpw.
- [ ] The tunnel and agent heads match mockup A at 1400 and 390 px.
- [x] `pnpm typecheck` and the test suite pass.
