---
title: An agent page shows its models and MCP servers
domain: plugins
status: active
priority: medium
created: 2026-11-12
revalidated: 2026-11-12
refs:
  - git://99d8431 - the last commit that holds the brief `an-agent-page-shows-its-models-and-mcp-servers.md`, which this plan covers
  - git://e7bd0e4 - the commit of ahpw this plan was checked at
  - "[code://src/resources/agents/Page.tsx#L79-L95](../../../../src/resources/agents/Page.tsx#L79-L95) - the agent page's tabs: Overview, one per customization kind, and Settings"
  - "[code://src/resources/agents/Overview.tsx#L34-L58](../../../../src/resources/agents/Overview.tsx#L34-L58) - the Overview's facts grid, with the Models fact"
  - "[code://src/resources/agents/Overview.tsx#L62-L130](../../../../src/resources/agents/Overview.tsx#L62-L130) - `Served`: the models table, the Customizations line and the sign-in table"
  - "[code://src/resources/connectors/Models.tsx#L18-L80](../../../../src/resources/connectors/Models.tsx#L18-L80) - a connector's Models tab with its search: the pattern to mirror"
  - "[code://src/resources/agents/Customizations.tsx#L94-L147](../../../../src/resources/agents/Customizations.tsx#L94-L147) - `KindPanel`: a prompt row expands in place, which an MCP server row takes too"
  - "[code://src/resources/agents/words.ts#L161-L175](../../../../src/resources/agents/words.ts#L161-L175) - `stateOf`: an MCP server in `error` shows its whole message as its state word"
  - "[code://src/resources/agents/kinds.ts#L118-L120](../../../../src/resources/agents/kinds.ts#L118-L120) - `emptyKinds`, the kinds an agent has none of"
  - https://github.com/ahpio/ahpd/blob/45860457d/packages/agent-claude/src/session/customizations.ts#L435-L527 - how agent-claude makes an MCP server entry: its `uri`, `state` and `enablement`
---

## Goal

The agent page shows its models in a tab of their own, with a search.
The Overview keeps what no tab says, and drops what the tabs already show.
An MCP server row says its state in a word and opens in place to show what the host sent about it.

## Reconnaissance

The files read and the patterns to reuse are the `refs` above, each with its note.

### Searches performed

- `rg -n "agents/page/models|Customizations" src/resources/agents` - the Overview draws the models table and the Customizations line in `Served`.
- `rg -n "expands" src/resources/agents/Customizations.tsx` - only a prompt row expands in place today.
- `rg -n "mcpServer" src/resources/agents/words.ts` - `stateOf` and `childRow` read a server's state; nothing reads its `errorType` or its `enablement`.

### Runtime path

```
root AgentInfo.models -> Models tab -> search -> table
root AgentInfo.customizations -> customizationKinds -> KindPanel (MCP servers) -> row opens in place
```

### Gaps

- The agent page has no Models tab.
- An MCP server row has no short state word, and nothing shows its `errorType`, where it is declared or its session default.

## Answers

| What | Source | Task |
| --- | --- | --- |
| The models move to a tab of their own, with a search | Softov, 2026-11-11: "Can we move models to the tab? add a search for the models." | 01 |
| The Models tab comes after Overview, titled with its count, such as *Models 13* | (defaulted: as the kind tabs are titled) | 01 |
| The Overview loses the Models fact | Softov, 2026-11-11: "Cut it" | 01 |
| The Overview loses the models table and the Customizations line | Softov, 2026-11-11: "cut the information. since tabs already have it" | 01 |
| The Overview grid has a *Customizations* fact only when the agent has none of some kinds, with the value *None:* and those kinds | Softov, 2026-11-11: "only a item onto the grid case it does not support something" | 01 |
| The sign-in table stays on the Overview | Softov, 2026-11-11: "keep sign for not on overview" | 01 |
| The MCP servers tab follows mockup A: the list as today, a row that opens in place | Softov, 2026-11-11: "A: today's list, opens in place" | 02 |
| A row opens in place; nothing opens another page | Softov, 2026-11-11: "for now it does not need to open another section page. just collapse uncollapse present info." | 02 |
| An open row shows only what the host sends today | Softov, 2026-11-11: "present info" | 02 |
| The agent page has no switch for an MCP server; a session keeps its own | Softov, 2026-11-11: "Per session only" | 02 |
| A row's state word is short: *Ready*, *Starting*, *Stopped*, *Needs sign-in* or *Error* | (defaulted: mockup A) | 02 |
| A server whose `uri` is `claude-internal:` is declared in *The Claude CLI; no file here declares it* | (defaulted: agent-claude gives that uri to any server no file it reads declares, not only to the claude.ai connectors) | 02 |
| An open row says nothing about where a claude.ai connector signs in | (defaulted: where it signs in is not checked) | 02 |

## Mockups

- `mock-mcp/a.png` - the chosen layout, with two rows open.
- `mock-mcp/b.png` - grouped by state, not chosen.

The mockups are in `/home/softov/.local/cache/tmp/claude-1000/-home-softov/b87363c7-8544-4005-8ce4-17e80b7f0cd4/scratchpad/mock-mcp/`.
The `~/.claude.json` path in mockup A is an example; the row shows the real file the host names.

## Proposed architecture

- **Data flow** - The root's `AgentInfo.models` feed the Models tab, and its `customizations` feed the MCP servers tab, as today.
- **State flow** - The search text and the open rows are the panel's own state.
- **Layer responsibilities** - `src/resources/agents/`: the Models tab, the trimmed Overview and the MCP row. No bridge changes.
- **Source-of-truth files** - [`code://src/resources/agents/Overview.tsx`](../../../../src/resources/agents/Overview.tsx) and [`code://src/resources/agents/words.ts`](../../../../src/resources/agents/words.ts)

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - The models have their own tab](task-01-the-models-have-their-own-tab.md) | implemented | - |
| [02 - An MCP server row opens in place](task-02-an-mcp-server-row-opens-in-place.md) | implemented | - |

## Risks and tradeoffs

- Plan [plugins/20261112-0221-a-record-draws-the-operations-it-offers](../20261112-0221-a-record-draws-the-operations-it-offers/plan.md) changes the agent page head. This plan changes the tabs and the Overview body, so the two meet only in `Page.tsx`.
- An MCP server is also listed inside a plugin or folder group. Task 02 changes every MCP row the same way.

## Resume state

- **Done so far:** both tasks are implemented, as [implemented.md](implemented.md) says.
- **Next action:** Softov reviews the PR.
- **Open questions:** none.
- **Watch out for:** `ahp.openAgent` takes a `section`; keep `overview` working for a link that names it.

## Final verification checklist

- [x] An agent with models shows *Models N* after Overview, and the search narrows its table.
- [x] The Overview shows no models table, no Models fact and no Customizations line.
- [x] An agent with no prompts shows *Customizations: None: Prompts* in the grid; one with every kind shows no such fact.
- [x] An MCP server in `error` shows *Error* or *Needs sign-in* on its row, and its whole message when open.
- [x] An open row shows where the server is declared, its session default and its ID with a copy button.
- [x] The page matches mockup A at 1400 and 390 px.
