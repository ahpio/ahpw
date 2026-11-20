---
title: An agent links its plugin and sessions
status: done
depends: []
layer: "resources/agents, resources/sessions"
refs:
  - "[code://src/resources/agents/Overview.tsx#L37-L46](../../../../src/resources/agents/Overview.tsx#L37-L46) - the *Plugin* and *Sessions* facts"
  - "[code://src/resources/plugins/index.ts#L147](../../../../src/resources/plugins/index.ts#L147) - `ahp.openPlugin`"
  - "[code://src/bridges/hosts.ts#L188-L243](../../../../src/bridges/hosts.ts#L188-L243) - the host filter menu, built again when the hosts change; the agent choice copies it"
  - "[code://src/shell/explorer/choice.ts#L24-L40](../../../../src/shell/explorer/choice.ts#L24-L40) - `readChoice` and `writeChoice`, how a choice is kept in the browser"
  - "[code://src/resources/sessions/index.ts#L76-L90](../../../../src/resources/sessions/index.ts#L76-L90) - the *Show* choice and the header actions"
  - "[code://src/resources/sessions/Explorer.tsx#L64-L75](../../../../src/resources/sessions/Explorer.tsx#L64-L75) - the filter that keeps a row"
  - "[code://src/resources/sessions/state.ts#L28](../../../../src/resources/sessions/state.ts#L28) - `SESSIONS_SHOW`, beside which `SESSIONS_AGENT` goes"
---

## Objective

On an agent page, the *Plugin* fact opens the plugin's page, and the *Sessions* count opens the Sessions explorer with only this agent's sessions.
The Sessions explorer has an *Agent* choice beside *Show*, which a person can also set by hand.

## Files

- `UPDATE: src/resources/sessions/state.ts:28` - add `SESSIONS_AGENT`, the chosen provider or null.
- `CREATE: src/resources/sessions/agent-choice.ts` - the *Agent* menu: *All agents*, then one command per provider the hosts list, kept in the browser.
- `CREATE: src/resources/sessions/agent-choice.test.ts` - the menu's values, the kept choice, and a provider no host lists.
- `UPDATE: src/resources/sessions/index.ts:76-90` - register the agent choice and its header action, and the command `ahp.showSessionsOf`.
- `UPDATE: src/resources/sessions/Explorer.tsx:64-75` - keep only the rows whose `provider` is `SESSIONS_AGENT`, when it is set.
- `UPDATE: src/resources/agents/Overview.tsx:37-46` - the *Plugin* fact and the *Sessions* count become links.
- `UPDATE: src/i18n/en.json` - `sessions/explorer/agent`, `sessions/agent/all` and the link titles.
- `UPDATE: src/i18n/es.json` - the same keys in Spanish.
- `UPDATE: src/i18n/pt.json` - the same keys in Portuguese.

## Steps

1. Add `SESSIONS_AGENT` to `state.ts`, as `$/ahp/sessions/agent`.
2. In `agent-choice.ts`, read the kept provider from the key `ahpd-web.session-agent` at start, and set `SESSIONS_AGENT`.
3. Register `sessions.agent.all` in the menu slot, active while `SESSIONS_AGENT` is null, which sets it to null.
4. Register one command per provider in any host's `ahpPaths(host).agents`, titled by its `displayName`.
5. Register the commands again when a host's agent list changes, and dispose the old ones.
6. Keep a chosen provider that no host lists now, so a restart does not clear it.
7. Add the header action `sessions.agent` beside `sessions.show`, active while `SESSIONS_AGENT` is not null.
8. In `Explorer.tsx`, keep only the rows whose `session.provider` equals a non-null `SESSIONS_AGENT`.
9. Show `sessions/explorer/noneShown` when the agent choice hides every row.
10. Register `ahp.showSessionsOf { provider }`, which sets and keeps the choice and runs `sidebar.activate` on `SESSIONS_SECTION`.
11. In `Overview.tsx`, draw the *Plugin* value as a link button that runs `ahp.openPlugin { host, id: engine.plugin }`.
12. Draw the *Plugin* value as plain code when `offers.channels` does not hold the plugins channel.
13. Draw the *Sessions* value as a link button that runs `ahp.showSessionsOf { provider: id }`.

## Validation

- `src/resources/sessions/agent-choice.test.ts`: the menu lists each provider once over two hosts.
- `src/resources/sessions/agent-choice.test.ts`: the kept choice comes back at start, and an unlisted provider stays chosen.
- `pnpm typecheck` and `pnpm test` pass, with the locale test.
- By hand: on the Cofold page, *agent-cofold* opens its plugin page.
- By hand: on the Cofold page, *1* opens Sessions with Cofold chosen and one row.
- By hand: *All agents* shows every session again.

## Resume

Done on 2026-11-19: built in PR #106, and Softov passed the checks by hand.
The agent choice is in `agent-choice.ts`, as planned.
A provider's command is `sessions.agentOf.<provider>`, so an agent named `all` does not take the id of *All agents*.
`sessions/explorer/noneShown` now names *Agent* beside *Show sessions*.
