---
title: The explorers filter again
created: 2026-11-12
refs:
  - git://83ec677 - the commit of ahpw the facts were checked at
  - "[code://src/shell/explorer/ExplorerList.tsx#L52-L91](../../src/shell/explorer/ExplorerList.tsx#L52-L91) - the text filter every list shares"
  - "[code://src/shell/explorer/choice.ts#L5-L21](../../src/shell/explorer/choice.ts#L5-L21) - `Choice`, a header button with a menu of values"
  - "[code://src/resources/automations/index.ts#L38-L40](../../src/resources/automations/index.ts#L38-L40) - the explorer with the most choices: group, sort and status"
  - "[code://src/resources/usage/index.ts#L35-L36](../../src/resources/usage/index.ts#L35-L36) - `registerTicks`, the one choice that takes more than one value"
---

# The explorers filter again

Softov wants the filtering of some explorers redone for 0.16. This brief lists how each explorer filters today, for the plan to choose from.

## What ahpw has today

Every explorer uses `ExplorerList`. Its filter is a text box that matches the row's title and its text lines, and it is kept only while the list is open. See [`code://src/shell/explorer/ExplorerList.tsx`](../../src/shell/explorer/ExplorerList.tsx#L64-L91).

A `Choice` is a header button with a menu of values, kept in the browser's storage. See [`code://src/shell/explorer/choice.ts`](../../src/shell/explorer/choice.ts#L5-L60).

| Explorer | Text filter | Choices and their values |
|---|---|---|
| Automations | yes | group: none, host, status, next. sort: name, next, last. status: all, running, on, off, failed |
| Computers | yes | group: none, host, state. status: all, running, stopped, problem |
| Connectors | yes | group: adapter, owner, state |
| Plugins | yes | group: state, category |
| Policies | yes | group |
| Sessions | yes | show: all, unread, read, running |
| Usage | yes | period: day, week, month, range. group (ticks): user, team, project |
| Agents, Bots, Clients, Teams, Tunnels, Users | yes | none |

- The status filter is named `status` in Automations and Computers, and `show` in Sessions.
- Only Automations sorts.
- Only Usage takes more than one value, with `registerTicks`.

## Who writes

No open PR or unmerged branch of ahpw touches `src/shell/explorer/` or an `Explorer.tsx` at 83ec677.

## The change

Some explorers filter in a new way. The plan names which ones and how.

## Open points

- Which explorers change, and what is wrong with their filtering today.
- Whether the filter and the choices become one control, such as chips or a filter menu.
- Whether the text filter matches fields by name, such as `state:running`.
- Whether a filter stays across visits, as a `Choice` does, or only while the list is open, as the text does.
- Whether one name replaces `status` and `show`.
- How other clients filter a side list was not looked at yet.
- A mockup comes before the plan.
