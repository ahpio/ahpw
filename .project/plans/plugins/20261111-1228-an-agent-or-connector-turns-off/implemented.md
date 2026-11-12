---
title: An agent or connector turns off - implemented
date: 2026-11-11
refs:
  - git://faef7c6
  - "[code://src/bridges/own-grants.ts](../../../../src/bridges/own-grants.ts)"
  - "[code://src/resources/agents/actions.ts](../../../../src/resources/agents/actions.ts)"
  - "[code://src/resources/sessions/agent-off.ts](../../../../src/resources/sessions/agent-off.ts)"
---

A person enables, pauses or disables an agent, and enables or disables a connector, from its page head or its row's menu.
A session on a paused or disabled agent shows a note over its composer box, and its send is off.

## What was built

- [`code://src/bridges/agents.ts`](../../../../src/bridges/agents.ts) - `enable`, `pause` and `disable` in `AGENTS`, and `setAgentMode`.
- [`code://src/bridges/connectors.ts`](../../../../src/bridges/connectors.ts) - `enable` and `disable` in `CONNECTORS`, and `setConnectorOn`.
- [`code://src/bridges/own-grants.ts`](../../../../src/bridges/own-grants.ts) - `useOwnGrants` and `useOwnGrantsOnEach`, the reader's grants from their own record, and `mayDo`.
- [`code://src/resources/agents/actions.ts`](../../../../src/resources/agents/actions.ts) - `agentModes`, `mayCheck`, `mayRemove`, `setMode` and `checkOne`.
- [`code://src/resources/connectors/actions.ts`](../../../../src/resources/connectors/actions.ts) - `mayTurn`, `turnMethod` and `turnConnector`.
- [`code://src/resources/agents/Explorer.tsx`](../../../../src/resources/agents/Explorer.tsx) - the row menu offers *Check now*, the modes and *Remove*; a paused row is orange and a disabled one is grey.
- [`code://src/resources/sessions/agent-off.ts`](../../../../src/resources/sessions/agent-off.ts) - `agentOff`, the state of a session's agent when it takes no message.
- [`code://src/resources/sessions/Composer.tsx`](../../../../src/resources/sessions/Composer.tsx) - `blocked` turns off send, steer and queue, and `notice` is drawn over the box.

## Verified

- `src/resources/agents/actions.test.ts`, 9 tests, and `src/resources/sessions/agent-off.test.ts`, 3 tests. `pnpm typecheck` and `pnpm test` pass, 846 tests.
- On a test daemon at ahpd cc4002706, at 1400 and 390 px, the agent page and the row menu paused, enabled and disabled the agent.
- The record's `mode` changed each time.
- A connector disabled from its page lost its alerts and showed the disabled note. *Enable* from its row brought it back.
- A session on a paused agent showed the note, kept typed text on Enter, and added no turn. *Enable* removed the note.
- A user holding only `agent:list` and `connector:list` saw no switch, no *Check now* and no *Remove*.

## Departures from the plan

- The session note is drawn inside the composer, over its box, as the merged banner is. Drawn outside, it spanned the page and the composer's fade covered it.
- The grant check is new: ahpd lists every method to every caller, so the method alone did not hide a button.

## Left for later

- The agent page's *Check* and *Remove*, and a connector's *Delete*, still show to a reader without the grant; the host refuses them.
