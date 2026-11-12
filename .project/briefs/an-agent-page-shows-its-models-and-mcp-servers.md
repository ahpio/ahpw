---
title: An agent page shows its models and MCP servers
created: 2026-11-12
refs:
  - git://faf9e05 - the commit of this repository the facts were checked at
  - git://45860457d - the commit of ahpd the MCP facts were checked at
  - "[code://src/resources/agents/Page.tsx#L79-L95](../../src/resources/agents/Page.tsx#L79-L95) - the agent page's tabs: Overview, one per customization kind, and Settings"
  - "[code://src/resources/agents/Overview.tsx#L34-L58](../../src/resources/agents/Overview.tsx#L34-L58) - the Overview's facts grid, with the Models fact"
  - "[code://src/resources/agents/Overview.tsx#L62-L130](../../src/resources/agents/Overview.tsx#L62-L130) - `Served`: the models table, the Customizations line and the sign-in table"
  - "[code://src/resources/connectors/Models.tsx#L18](../../src/resources/connectors/Models.tsx#L18) - a connector's Models tab, with a search over its table: the pattern for the agent's"
  - "[code://src/resources/agents/Customizations.tsx#L94-L147](../../src/resources/agents/Customizations.tsx#L94-L147) - `KindPanel`: a click shows an item in place of the list, and a prompt row expands in place instead"
  - "[code://src/resources/agents/words.ts#L161-L175](../../src/resources/agents/words.ts#L161-L175) - `stateOf`: an MCP server in `error` shows the whole error message as its state word"
  - "[code://src/resources/agents/words.ts#L251-L259](../../src/resources/agents/words.ts#L251-L259) - `metaOf`: the on or off tag beside a server's name"
  - https://github.com/ahpio/ahpd/blob/45860457d/packages/agent-claude/src/session/customizations.ts#L435-L527 - how agent-claude makes an MCP server entry: its `uri`, `state` and `enablement`
---

# An agent page shows its models and MCP servers

Softov wants the agent page to show its models and MCP servers in a form a person can use.
The models move from the Overview to their own tab, with a search.
The Overview loses what the tabs already say.
An MCP server row opens in place and shows what the host sent about it, as mockup A shows.
He asked for this on 2026-11-11, with a screenshot of the Overview and one of the MCP servers tab.

## What others do

- A connector page in ahpw has a Models tab with a search over its table, as [`code://src/resources/connectors/Models.tsx`](../../src/resources/connectors/Models.tsx) draws it. The agent's Models tab copies it.
- agent-claude names an MCP server by the file that declares it, as VS Code's Claude discovery does. A server no file declares has the uri `claude-internal:/mcp/<name>`, as the claude.ai connectors do.

## What ahpw has today

- The Overview draws a Models fact, a models table, a Customizations line with a button per kind, and the sign-in table, as [`code://src/resources/agents/Overview.tsx#L62-L130`](../../src/resources/agents/Overview.tsx#L62-L130) shows.
- The Customizations line repeats the counts that the kind tabs show in their titles, such as *Skills 70*.
- The Customizations line ends with the kinds the agent has none of, such as *None: Prompts, Hooks, Plugins*.
- The MCP servers tab lists each server with its name, an *on* or *off* tag and its state word.
- A server in `error` shows its whole message as the state word, such as *This server needs signing in, and it did not say where.*
- A click on a server shows it in place of the list. A prompt row expands in place instead, which is the behaviour the MCP rows take.

## What the host sends about an MCP server

Each server is a `mcpServer` customization on the agent's root entry, with these fields:

| Field | What it holds |
| --- | --- |
| `name` | The server's name, such as `claude.ai Google Drive` |
| `uri` | The file that declares it, or `claude-internal:/mcp/<name>` |
| `id` | The `uri` with `#mcp=<name>` |
| `state` | `ready`, `starting`, `stopped`, `authRequired`, or `error` with `errorType` and `message` |
| `enablement` | One `session` entry: whether a new session starts with it on |

agent-claude opens no `mcp://` channel, so no client can list a server's tools.
AHP switches a server on or off only in a session, with `session/customizationToggled`.

## Who writes

- Plan [plugins/20261112-0221-a-record-draws-the-operations-it-offers](../plans/plugins/20261112-0221-a-record-draws-the-operations-it-offers/plan.md) changes the agent page head and row menu. This change touches the tabs and the Overview body, not the head.
- No other branch of ahpw is open.

## The change

- The agent page has a *Models* tab after *Overview*, titled with its count, such as *Models 13*.
- The Models tab holds the models table and a search over it, as a connector's Models tab does.
- The Overview loses the Models fact, the models table and the Customizations line.
- The Overview grid has a *Customizations* fact only when the agent has none of some kinds. Its value is *None:* and those kinds.
- The sign-in table stays on the Overview.
- An MCP server row shows a short state word: *Ready*, *Starting*, *Stopped*, *Needs sign-in* or *Error*.
- A click on an MCP server row opens it in place, as a prompt row does.
- An open row shows the state with its whole message and `errorType`, and where the server is declared.
- It also shows whether a session starts with it on, and its ID with a copy button.
- A server whose `uri` is `claude-internal:` is declared in the Claude account.
- The agent page has no switch for an MCP server. A session keeps its own switch.

## Mockups

- `mock-mcp/a.png` - the chosen layout: the list as today, with two rows open.
- `mock-mcp/b.png` - grouped by state, not chosen.

The mockups are in the scratchpad of the session that wrote this brief.

## Open points

- The declaring file of a server such as `tasker` was not read from a live host. The mockup's `~/.claude.json` is a guess.
- Where a person signs in to a claude.ai connector is not checked. The open row says nothing about it until it is.
