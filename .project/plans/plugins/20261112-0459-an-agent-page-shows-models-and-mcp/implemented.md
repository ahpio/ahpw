---
title: An agent page shows its models and MCP servers - implemented
date: 2026-11-12
refs:
  - git://e4078c2
  - "[code://src/resources/agents/Models.tsx](../../../../src/resources/agents/Models.tsx)"
  - "[code://src/resources/agents/mcp.ts](../../../../src/resources/agents/mcp.ts)"
  - "[code://src/resources/agents/Customizations.tsx](../../../../src/resources/agents/Customizations.tsx)"
---

The agent page has a *Models N* tab with a search, after Overview.
The Overview keeps its facts and sign-in, and names the kinds the agent has none of.
An MCP server row says its state in a word and opens in place to show what the host sent about it.

## What was built

- [`code://src/resources/agents/Models.tsx`](../../../../src/resources/agents/Models.tsx) - the Models tab: a search, the count and the models table.
- [`code://src/resources/agents/models.ts`](../../../../src/resources/agents/models.ts) - `matchesModel`, a match on the name or the id.
- [`code://src/resources/agents/Overview.tsx`](../../../../src/resources/agents/Overview.tsx) - the facts with a *Customizations* fact when kinds are missing, the plugin's view, and sign-in.
- [`code://src/resources/agents/mcp.ts`](../../../../src/resources/agents/mcp.ts) - `mcpFacts`: the whole state, the `errorType`, where the server is declared, its session default and its ID.
- [`code://src/resources/agents/words.ts`](../../../../src/resources/agents/words.ts) - `stateOf` says *Needs sign-in* or *Error* for an MCP server in `error`.
- [`code://src/resources/agents/Customizations.tsx`](../../../../src/resources/agents/Customizations.tsx) - the MCP tab expands its rows in place, with an arrow, and draws the facts under the row.

## Verified

- `models.test.ts`, `mcp.test.ts` and `words.test.ts` pass. `pnpm typecheck` and `pnpm test` pass, 854 tests.
- On a test daemon at ahpd cc4002706, the Claude agent showed *Models 4* after Overview, and *son* left one row, *1 of 4 models*.
- The Overview showed no models table, no Models fact and no Customizations line, and showed *Customizations: None: Prompts, Hooks, Plugins*.
- The MCP tab showed *Needs sign-in* on the four claude.ai rows. Open, Google Drive showed its message and `mcpAuthRequired`.
- The tab showed at 1400 and 390 px, and matched mockup A.

## Departures from the plan

- A `claude-internal:` server is declared in *The Claude CLI; no file here declares it*, not in *Claude account*. On the test daemon, `advisor` and `tasker` had that uri too, so *Claude account* would have been wrong for them.
- The rows keep today's style for the name and the *on* tag, which mockup A drew heavier.
- The old words for the Models heading, the Models fact and *No customizations* are removed.
