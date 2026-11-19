---
title: The agent and plugin pages link and ask
domain: plugins
status: planned
priority: medium
created: 2026-11-19
revalidated: 2026-11-19
requires: []
refs:
  - git://deadb7b - the commit of ahpw this plan was checked at; the brief it covers was never committed
  - "[code://src/resources/agents/Overview.tsx#L37-L46](../../../../src/resources/agents/Overview.tsx#L37-L46) - the *Plugin* and *Sessions* facts, both plain text"
  - "[code://src/resources/plugins/index.ts#L147](../../../../src/resources/plugins/index.ts#L147) - `ahp.openPlugin`, the command the *Plugin* link runs"
  - "[code://src/resources/agents/actions.ts#L57-L64](../../../../src/resources/agents/actions.ts#L57-L64) - `setMode`, with no question"
  - "[code://src/resources/agents/actions.ts#L8-L15](../../../../src/resources/agents/actions.ts#L8-L15) - `deleteAgent`, the question the new ones copy"
  - "[code://src/resources/plugins/actions.ts#L44-L110](../../../../src/resources/plugins/actions.ts#L44-L110) - `installListed`, `togglePlugin` and `reloadOne`, with no question"
  - "[code://src/shell/notify/confirm.ts#L36-L43](../../../../src/shell/notify/confirm.ts#L36-L43) - `confirm`, the one question every page uses"
  - "[code://src/resources/operations/Buttons.tsx#L11-L32](../../../../src/resources/operations/Buttons.tsx#L11-L32) - a host operation asks only when the host gives a `confirmation`"
  - "[code://src/resources/sessions/index.ts#L76-L90](../../../../src/resources/sessions/index.ts#L76-L90) - the Sessions explorer's choices and header actions"
  - "[code://src/bridges/hosts.ts#L188-L243](../../../../src/bridges/hosts.ts#L188-L243) - the host filter, a menu whose values come from the hosts; the agent choice copies it"
  - "[code://src/resources/sessions/Explorer.tsx#L64-L75](../../../../src/resources/sessions/Explorer.tsx#L64-L75) - where the explorer keeps the rows its choices show"
  - "[code://src/resources/plugins/ListTabs.tsx#L39-L100](../../../../src/resources/plugins/ListTabs.tsx#L39-L100) - `FactsColumn` and `PageBody`, the column beside each plugin tab"
  - "[code://src/resources/plugins/ListTabs.tsx#L140-L189](../../../../src/resources/plugins/ListTabs.tsx#L140-L189) - `listTabs`, the listed plugin's tabs"
  - "[code://src/resources/plugins/PluginPage.tsx#L102-L165](../../../../src/resources/plugins/PluginPage.tsx#L102-L165) - the installed plugin's facts and tabs"
  - "[code://src/resources/plugins/ListTabs.css](../../../../src/resources/plugins/ListTabs.css) - the two-column grid that goes"
---

## Goal

The agent page opens what it names: its plugin, and the sessions it runs.
Every agent and plugin action that changes state asks before it runs.
A plugin page shows its facts in one section before the README, in place of a column beside every tab.

## Reconnaissance

The files read and the patterns to reuse are the `refs` in the frontmatter, each with its note.

### Searches performed

- `rg "setMode\(|togglePlugin\(|reloadOne\(|installListed\(" src` - each action has two callers: the page and the explorer's menu or row.
- `rg "registerChoice" src` - every choice has a fixed list of values; only the host filter builds its menu from live data.
- `rg -n "operations" packages/server/src packages/sdk/src -g '*agents*'` in ahpd - ahpd sends no agent operations, so ahpw's own mode buttons are the ones drawn.

### Runtime path

```
agent page Plugin link -> ahp.openPlugin { host, id } -> PluginPage
agent page Sessions link -> ahp.showSessionsOf { provider } -> SESSIONS_AGENT -> Sessions explorer rows
mode, toggle, reimport or install -> confirm -> x-ahpd method -> reread
PluginPage / ListedPluginPage -> Overview: facts section, then README; Features and Changelog: full width
```

### Gaps

- `Choice` takes only a fixed list of values, so the agent choice registers its own commands, as the host filter does.

## Answers

| What | Source | Task |
| --- | --- | --- |
| Every action that changes state asks first: Pause, Disable, Resume and Enable on an agent; Enable, Disable, Reimport and Install on a plugin | Softov, 2026-11-19: "Everything that changes state" | 01 |
| The question is in the action function, so the page and the explorer menu both ask | `(defaulted: one broken entry point means fix every entry point)` | 01 |
| Pause and Disable ask in the `danger` tone; Enable, Resume, Reimport and Install in the `default` tone | `(defaulted: only the actions that stop work are red)` | 01 |
| Check and New session do not ask | `(defaulted: they change no state)` | 01 |
| A host operation keeps the host's own `confirmation`; ahpw adds none | `(defaulted: clients draw only what the host sends)` | 01 |
| The *Plugin* fact is a link to `ahp.openPlugin` | Softov, 2026-11-19 | 02 |
| The link shows only when the host offers the plugins channel; else the fact stays plain | `(defaulted: a person who cannot read plugins has no page to open)` | 02 |
| The *Sessions* count is a link that opens the Sessions explorer filtered by this agent | Softov, 2026-11-19 | 02 |
| The filter is an *Agent* choice in the Sessions header, beside *Show*, kept like the other choices, *All agents* as its usual value | Softov, 2026-11-19: "New Agent choice in the header" | 02 |
| The agent choice filters by provider on every host; the host filter stays as it is | `(defaulted: a click does not change the person's host filter)` | 02 |
| The plugin page has no side column; *Installation*, *Marketplace*, *Categories* and *Resources* are one section at the top of *Overview*, before the README | Softov, 2026-11-19: "A: a section before README" | 03 |
| The facts section is on *Overview* only; *Features* and *Changelog* take the full width | Softov, 2026-11-19: "Overview only" | 03 |
| The listed plugin page takes the same layout as the installed one | `(defaulted: one plugin page shape)` | 03 |

## Proposed architecture

- **Data flow** - the agent choice reads `ahpPaths(host).agents` of each host for its menu, and each session's `provider` for its rows.
- **Event flow** - each action function awaits `confirm` before its request; a *No* returns with nothing sent.
- **State flow** - `SESSIONS_AGENT` holds the chosen provider, or null for every agent, and the browser keeps it under one storage key.
- **Layer responsibilities** - `resources/agents` and `resources/plugins`: the questions and links · `resources/sessions`: the agent choice · `resources/plugins/ListTabs.tsx`: the facts section.
- **Source-of-truth files** - [`code://src/resources/agents/actions.ts`](../../../../src/resources/agents/actions.ts), [`code://src/resources/plugins/actions.ts`](../../../../src/resources/plugins/actions.ts), [`code://src/resources/plugins/ListTabs.tsx`](../../../../src/resources/plugins/ListTabs.tsx)

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - A change of state asks first](task-01-a-change-of-state-asks-first.md) | todo | - |
| [02 - An agent links its plugin and sessions](task-02-an-agent-links-its-plugin-and-sessions.md) | todo | - |
| [03 - Plugin facts sit before the README](task-03-plugin-facts-sit-before-the-readme.md) | todo | - |

## Risks and tradeoffs

- The brief [The explorers filter again](../../../briefs/filter-explorer-redo.md) also changes the Sessions filters - the second plan builds on the first.
- An extra click on Enable and Resume - Softov chose one rule for every change of state.

## Resume state

- **Done so far:** nothing.
- **Next action:** [task-01-a-change-of-state-asks-first.md](task-01-a-change-of-state-asks-first.md).
- **Watch out for:** the explorer menus call the same action functions as the pages; a question added in a page only leaves the menus silent.

## Final verification checklist

- [ ] Each of the eight actions asks once from its page and once from its explorer menu or row, and *No* sends nothing.
- [ ] The *Plugin* link opens the plugin page; with no plugins channel the fact is plain.
- [ ] The *Sessions* link opens the Sessions explorer with the agent chosen, and *All agents* clears it.
- [ ] Installed and listed plugin pages match the layout Softov picked, at 1280 px and 760 px, light and dark.
- [ ] `pnpm typecheck` and `pnpm test` pass.
