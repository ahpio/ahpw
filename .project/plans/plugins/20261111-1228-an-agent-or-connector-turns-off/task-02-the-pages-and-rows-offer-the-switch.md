---
title: The pages and rows offer the switch
status: todo
depends: [task-01-the-bridges-turn-a-record-off.md]
layer: "ahpw agents and connectors"
refs:
  - "[code://src/resources/plugins/PluginPage.tsx#L57-L70](../../../../src/resources/plugins/PluginPage.tsx#L57-L70) - the head buttons to mirror"
  - "[code://src/resources/agents/Page.tsx#L33-L125](../../../../src/resources/agents/Page.tsx#L33-L125) - the agent page head, check button and standby alert"
  - "[code://src/resources/agents/Explorer.tsx#L87-L93](../../../../src/resources/agents/Explorer.tsx#L87-L93) - the agent row menu"
  - "[code://src/resources/connectors/Explorer.tsx#L44-L54](../../../../src/resources/connectors/Explorer.tsx#L44-L54) - the connector row menu"
---

## Objective

The agent page head and row menu offer *Enable*, *Pause* and *Disable*; the connector page head and row menu offer *Enable* and *Disable*.
A paused or disabled agent says so on its page and in its row, as mockup A shows.

## Files

- `UPDATE: src/resources/agents/Page.tsx:33-125` - the head buttons, the paused and disabled alert, no check or new session while off.
- `UPDATE: src/resources/agents/Explorer.tsx:21-93` - the menu items, and the dot and line for paused and disabled.
- `UPDATE: src/resources/connectors/ConnectorPage.tsx` - the head button and the disabled alert.
- `UPDATE: src/resources/connectors/Explorer.tsx:44-54` - the menu item.
- `UPDATE: src/resources/connectors/rows.ts` - the dot for disabled.
- `UPDATE: src/i18n/en.json` - the paused and disabled alerts.
- `UPDATE: src/i18n/es.json` - the same.
- `UPDATE: src/i18n/pt.json` - the same.

## Steps

1. Draw a button per mode from `agentModes` in the agent page head, before *New session*.
2. Add the same modes to the agent row's menu, in the `more` group, as the plugin row does.
3. Hide *Check now* and *New session* while the agent is off.
4. Replace the standby alert with the paused or disabled alert for those states, with mockup A's words.
5. Make a paused row's dot `attention` with the line *Paused*, and a disabled row's dot `quiet` with the line *Disabled*.
6. Draw the connector's *Enable* or *Disable* in its page head and in its row's menu.
7. Draw a disabled connector's alert, and make its row's dot `quiet`.
8. Compare each screen to mockups A and C; stop and ask on any difference.

## Validation

- `pnpm typecheck` and `pnpm test` pass.
- By hand, on a test daemon: pause, enable and disable an agent from its page and its row.
- By hand: disable and enable a connector from its page and its row.
- By hand: a person without `agent:put` sees no button.
- By hand: the pages show at 1400 and 390 px, and match the mockups.

## Resume
