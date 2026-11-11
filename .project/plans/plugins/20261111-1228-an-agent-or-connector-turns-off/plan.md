---
title: An agent or connector turns off
domain: plugins
status: planned
priority: medium
created: 2026-11-11
revalidated: 2026-11-11
requires:
  - plans/plugins/20261111-1228-agents-and-connectors-list-their-alerts/plan.md
refs:
  - git://0f9d12a - the last commit that holds the brief `an-agent-or-connector-lists-its-alerts-and-turns-off.md`, which this plan and its sibling cover
  - git://57b7f33 - the commit of ahpw this plan was checked at
  - "[code://src/resources/plugins/PluginPage.tsx#L57-L70](../../../../src/resources/plugins/PluginPage.tsx#L57-L70) - a plugin page's enable and disable button in its head, the pattern to mirror"
  - "[code://src/resources/plugins/Explorer.tsx#L49-L67](../../../../src/resources/plugins/Explorer.tsx#L49-L67) - a plugin row's enable and disable menu item"
  - "[code://src/resources/plugins/actions.ts#L8-L34](../../../../src/resources/plugins/actions.ts#L8-L34) - `mayToggle`, `toggleMethod` and `togglePlugin`: the method is offered, and a refusal is the host's"
  - "[code://src/bridges/agents.ts#L32-L38](../../../../src/bridges/agents.ts#L32-L38) - `AGENTS`, the agent methods"
  - "[code://src/bridges/connectors.ts#L35-L42](../../../../src/bridges/connectors.ts#L35-L42) - `CONNECTORS`, the connector methods"
  - "[code://src/resources/agents/Page.tsx#L33-L125](../../../../src/resources/agents/Page.tsx#L33-L125) - the agent page head, its check button and its standby alert"
  - "[code://src/resources/agents/Explorer.tsx#L87-L93](../../../../src/resources/agents/Explorer.tsx#L87-L93) - an agent row's menu"
  - "[code://src/resources/connectors/Explorer.tsx#L44-L54](../../../../src/resources/connectors/Explorer.tsx#L44-L54) - a connector row's menu"
  - "[code://src/resources/sessions/Page.tsx#L533-L545](../../../../src/resources/sessions/Page.tsx#L533-L545) - where a session draws its composer"
  - https://github.com/ahpio/ahpd/blob/ea240db71/docs/plugins/PLUGINS.md#x-ahpd-agents - `x-ahpd/agents/enable`, `/pause` and `/disable`, and what each mode serves
  - https://github.com/ahpio/ahpd/blob/ea240db71/docs/plugins/PLUGINS.md#x-ahpd-connectors - `x-ahpd/connectors/enable` and `/disable`
---

## Goal

A person enables, pauses or disables an agent, and enables or disables a connector, without removing it.
The buttons sit in the page head and in the row's menu, as a plugin's do.
A session on a paused or disabled agent says why it takes no message.

## Reconnaissance

The files read and the patterns to reuse are the `refs` above, each with its note.

### Searches performed

- `rg -n "togglePlugin|mayToggle" src` - the plugin page and the plugin row offer the switch when the host offers its method.
- `rg -n "standby" src/resources/agents` - a record missing from the root shows the standby alert. ahpd leaves a paused or disabled agent out of the root.
- `rg -n "<Composer" src/resources/sessions` - one session page draws the composer.

### Runtime path

```
Pause on the agent page or row menu -> x-ahpd/agents/pause { id } -> row { state: paused } -> page badge, alert, buttons
session page -> its provider's row is paused or disabled -> note above the composer, send disabled
Disable on the connector page or row menu -> x-ahpd/connectors/disable { id } -> row { state: disabled }
```

### Gaps

- `AGENTS` and `CONNECTORS` have no `enable`, `pause` or `disable`.
- A session does not read its agent's row.

## Answers

| What | Source | Task |
| --- | --- | --- |
| The buttons go in the page head and the row's menu, as a plugin's. | Softov, 2026-11-11: "A: head buttons + menu" ([mockup A](#mockups)) | 02 |
| A session on a paused or disabled agent shows a note above its composer, and send is disabled. | Softov, 2026-11-11: "Yes, a note in the session" | 03 |
| The words are the plugin's: *Enable*, *Disable*, and *Pause* for an agent. | (defaulted: the plugin page's words, as in the mockups) | 02 |
| Pause and disable ask no confirmation. | (defaulted: a plugin's disable asks none, and both undo with *Enable*) | 02 |
| A button shows only when the host offers its method. | (defaulted: `mayToggle`'s rule) | 02 |
| *Check now* and *New session* are not offered while the agent is off. | Brief, *The change*; ahpd refuses both | 02 |
| A refusal shows the host's words. | (defaulted: `togglePlugin`'s rule) | 01 |

## Mockups

- `mock-alerts/a.png` - the chosen layout: the agent page head with *Pause* and *Disable*, the row menu, and a paused agent.
- `mock-alerts/c.png` - the connector page head with *Disable*, and its alerts.

The mockups are in the session's scratchpad; the build compares each screen to them.

## Proposed architecture

- **Data flow** - The methods answer the row; the channel sends the change too.
- **Event flow** - A button calls the method; a refusal goes to `failed` with the host's words.
- **State flow** - None in ahpw; the row's `state` is the mode.
- **Layer responsibilities** - `src/bridges/`: the methods. `src/resources/agents/actions.ts` and `src/resources/connectors/actions.ts`: offer and call. The pages, rows and session page: where they show.
- **Source-of-truth files** - ahpd's `PLUGINS.md` for the methods and what each mode serves.

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - The bridges turn a record off](task-01-the-bridges-turn-a-record-off.md) | todo | - |
| [02 - The pages and rows offer the switch](task-02-the-pages-and-rows-offer-the-switch.md) | todo | 01 |
| [03 - A session says its agent is off](task-03-a-session-says-its-agent-is-off.md) | todo | 01 |

## Risks and tradeoffs

- ahpd leaves a paused or disabled agent out of the root list, so its page draws from the record alone. The standby path must say paused or disabled.
- The session note reads the agents channel, and a person without `agent:read` cannot read it. Then only the host's refusal shows.

## Resume state

- **Done so far:** nothing.
- **Next action:** finish the sibling plan, then [task-01-the-bridges-turn-a-record-off.md](task-01-the-bridges-turn-a-record-off.md).
- **Open questions:** none.
- **Watch out for:** a disabled agent shows no alerts; its page must not read that as healthy.

## Final verification checklist

- [ ] On a test daemon, *Pause* on an agent page makes it paused; *Enable* brings it back.
- [ ] *Disable* from an agent row's menu makes it disabled, and its sessions stay listed.
- [ ] A connector disabled from its page lists no model, and *Enable* brings it back.
- [ ] A session on a paused agent shows the note, and send is disabled.
- [ ] A person whose grants lack `agent:put` sees no button.
- [ ] The pages match mockups A and C at 1400 and 390 px.
