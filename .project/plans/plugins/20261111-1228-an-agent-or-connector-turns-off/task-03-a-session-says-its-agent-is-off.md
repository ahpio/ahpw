---
title: A session says its agent is off
status: done
depends: [task-01-the-bridges-turn-a-record-off.md]
layer: "ahpw sessions"
refs:
  - "[code://src/resources/sessions/Page.tsx#L533-L545](../../../../src/resources/sessions/Page.tsx#L533-L545) - where the composer is drawn"
  - "[code://src/bridges/agents.ts#L32-L78](../../../../src/bridges/agents.ts#L32-L78) - the agents channel and its rows"
---

## Objective

A session whose agent is paused or disabled shows a note above its composer, and its send is disabled.
The note names the agent and its state, and opens the agent's page.

## Files

- `UPDATE: src/resources/sessions/Page.tsx:533-545` - read the provider's row, and draw the note above the composer.
- `UPDATE: src/resources/sessions/Composer.tsx` - a `blocked` prop that disables send.
- `CREATE: src/resources/sessions/agent-off.ts` - `agentOff(rows, provider)`, the row's state when it is paused or disabled.
- `CREATE: src/resources/sessions/agent-off.test.ts` - each state, and no row.
- `UPDATE: src/i18n/en.json` - the note's words.
- `UPDATE: src/i18n/es.json` - the same.
- `UPDATE: src/i18n/pt.json` - the same.

## Steps

1. Read the agents channel on the session page while the host serves it, with `useChannel`.
2. Add `agentOff`, which answers `paused` or `disabled` for the session's provider, else nothing.
3. Draw a note above the composer: the agent's name, its state, and a link that opens its page.
4. Pass `blocked` to the composer, which turns off send while it holds.
5. Draw nothing when the host does not serve the channel or the reader cannot read it.

## Validation

- `src/resources/sessions/agent-off.test.ts`: paused, disabled, ready, and a provider with no row.
- `pnpm typecheck` and `pnpm test` pass.
- By hand, on a test daemon: pause an agent, and check the note and send in its open session. Enable it, and check the note goes.

## Resume
