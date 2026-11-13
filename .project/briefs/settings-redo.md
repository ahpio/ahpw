---
title: The settings fields are grouped again
created: 2026-11-12
refs:
  - git://83ec677 - the commit of ahpw the facts were checked at
  - "[code://src/resources/host/sections.ts#L7-L44](../../src/resources/host/sections.ts#L7-L44) - the sections and their keys, by hand"
  - "[code://src/resources/host/sections.ts#L58-L75](../../src/resources/host/sections.ts#L58-L75) - the groups the sections view draws"
  - "[code://src/resources/host/Settings.tsx#L48](../../src/resources/host/Settings.tsx#L48) - the views of the host tab: fields, json and sections"
  - "[code://src/resources/host/Settings.tsx#L156-L162](../../src/resources/host/Settings.tsx#L156-L162) - the two tabs, Host and Interface"
---

# The settings fields are grouped again

Softov wants the settings page reviewed for 0.16, to group its fields again. This brief lists the groups and sections today, for the plan to work from.

## What ahpw has today

The settings page has two tabs: Host, from the schema the host sends, and Interface, the browser's own settings. See [`code://src/resources/host/Settings.tsx`](../../src/resources/host/Settings.tsx#L156-L162).

Each tab draws a `SchemaForm` with three views: fields, json and sections. Sections is the default. See [`code://src/resources/host/Settings.tsx`](../../src/resources/host/Settings.tsx#L48).

`sections.ts` names the sections and their keys by hand. A plugin's key gets a section of its own. A key that no section names goes to *Other*. See [`code://src/resources/host/sections.ts`](../../src/resources/host/sections.ts#L46-L69).

| Group | Sections |
|---|---|
| Host | general, changeWords, trust, limits |
| Daemon | listener, modelProxy, sessions, tools, mcp |
| Plugins | one per `plugins.<name>` key |
| VS Code | network, telemetry, approval, agents, vscodeMcp, vscodeSessions, pullRequests, features |
| Interface (its own tab) | appearance, language, layout, dialogs, session, bot, canvas, agents |

- The groups follow who declares a key: the host, the daemon, a plugin or a VS Code window. They do not follow what a person wants to set.
- Agents, sessions and MCP each have a section in two groups: Daemon and VS Code, or Interface.
- The Daemon sections keep the names from before ahpd 0.13 (`http`, `proxy`) for an older host.

## Who writes

No open PR or unmerged branch of ahpw touches `src/resources/host/` at 83ec677.

## The change

The settings fields are grouped again. The plan says which groups and which sections.

## Open points

- Whether the groups follow the subject (sessions, agents, network) or the declaring side, as today.
- Whether the VS Code keys stay in a group of their own, because only a VS Code window pushes them.
- Whether the section list stays in ahpw, or the host sends the grouping in its schema as an `x-` keyword.
  ahpw draws only what the host sends.
- Whether a plugin's settings stay here, or only on the plugin's page.
- How VS Code groups its own settings was not looked at yet.
- A mockup comes before the plan.
