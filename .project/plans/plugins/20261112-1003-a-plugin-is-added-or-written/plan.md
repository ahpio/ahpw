---
title: A plugin is added or written from ahpw
domain: plugins
status: active
priority: medium
created: 2026-11-12
revalidated: 2026-11-12
requires: []
changes: []
creates: []
refs:
  - git://8314867 - the commit of ahpw this plan was checked at, and the last commit that holds the brief `briefs/a-plugin-is-added-or-written.md`
  - git://02a57e731 - the commit of ahpd the host facts were checked at
  - "[code://src/resources/plugins/index.ts#L64-L76](../../../../src/resources/plugins/index.ts#L64-L76) - the explorer's toolbar, which gets New plugin"
  - "[code://src/resources/plugins/index.ts#L39-L51](../../../../src/resources/plugins/index.ts#L39-L51) - `open`, the command that opens a plugin's page after an add or a write"
  - "[code://src/resources/plugins/actions.ts#L8-L10](../../../../src/resources/plugins/actions.ts#L8-L10) - `mayToggle`, the pattern for an action shown when the host offers its command"
  - "[code://src/resources/plugins/actions.ts#L73-L75](../../../../src/resources/plugins/actions.ts#L73-L75) - `rereadAfterChange`, read after a command changes the configuration"
  - "[code://src/resources/plugins/Options.tsx#L40](../../../../src/resources/plugins/Options.tsx#L40) - the Options tab returns early when a plugin has no options"
  - "[code://src/bridges/plugins.ts#L24-L32](../../../../src/bridges/plugins.ts#L24-L32) - `PLUGINS`, the command names the bridge calls"
  - "[code://src/bridges/plugins.ts#L143-L145](../../../../src/bridges/plugins.ts#L143-L145) - `reloadPlugin`, the shape of a call that sends an id"
  - "[code://src/resources/connectors/index.ts#L84-L93](../../../../src/resources/connectors/index.ts#L84-L93) - `ahp.newConnector`, the sibling command that opens a new form in a tab"
  - "[code://src/resources/connectors/NewConnectorPage.tsx](../../../../src/resources/connectors/NewConnectorPage.tsx) - the sibling new page: a heading and one form"
  - "[code://src/resources/connectors/actions.ts#L29-L43](../../../../src/resources/connectors/actions.ts#L29-L43) - `deleteConnector`, the confirm and the refusal that Remove copies"
  - "[code://src/resources/agents/EnginePicker.tsx#L28-L40](../../../../src/resources/agents/EnginePicker.tsx#L28-L40) - the *Start from* radio group that *How* reuses"
  - "[code://src/resources/editor/CodeEditor.tsx#L15-L30](../../../../src/resources/editor/CodeEditor.tsx#L15-L30) - `CodeEditor`, for `index.ts` and `package.json`"
  - "[code://src/shell/controls/DangerZone.tsx](../../../../src/shell/controls/DangerZone.tsx) - the danger zone, which takes no checkbox today"
  - "[code://src/bridges/said.ts#L11](../../../../src/bridges/said.ts#L11) - `hostSaid`, the host's words in a refusal"
  - "[code://src/resources/connectors/form.ts#L56](../../../../src/resources/connectors/form.ts#L56) - `slugOf`, the id made from a name"
  - https://github.com/ahpio/ahpd/blob/02a57e731/packages/server/src/pluginschannel.ts#L498-L538 - `x-ahpd/plugins/install`
  - https://github.com/ahpio/ahpd/blob/02a57e731/packages/server/src/pluginschannel.ts#L547-L575 - `x-ahpd/plugins/remove`
  - https://github.com/ahpio/ahpd/blob/02a57e731/packages/server/src/pluginschannel.ts#L642-L700 - `x-ahpd/plugins/write`
  - https://github.com/ahpio/ahpd/blob/02a57e731/docs/plugins/PLUGINS.md#L19-L37 - the contract the starter `index.ts` follows
---

## Goal

An admin adds a plugin, or writes one, from ahpw, and removes a plugin from its page.
Today the admin does each from the terminal with `ahpd plugin install` and `ahpd plugin remove`.
ahpd serves the commands since its plan `plugin/64`.
The mockup is `.scratch/mockups/mock-plugins-<theme>-<width>.png`, sheets 0 to 4 and 6.

## Reconnaissance

The files read and the patterns to reuse are the `refs` in the frontmatter, each with its note.

### Searches performed

- `rg -n "plugins/install|plugins/write|plugins/remove" src` - no match. ahpw calls none of them.
- `rg -n "DangerZone" src --glob "*.tsx"` - agents, bots, connectors, users and operations use it. None puts a choice in it.
- `rg -n "web-kind-templates" src --glob "*.tsx"` - only `EnginePicker.tsx` draws the radio group.
- `rg -n "confirm\(" src/resources/connectors` - `deleteConnector` asks before it removes.

### Runtime path

```
+ in the Plugins toolbar -> ahp.newPlugin -> NewPluginPage (How: add | write)
  add   -> installPlugin(host, source)          -> x-ahpd/plugins/install { source }              -> { id, restart? }
  write -> writePlugin(host, id, source, pkg)   -> x-ahpd/plugins/write { id, source, packageJson } -> { id }
        -> rereadAfterChange -> ahp.openPlugin { host, id } -> the plugin's page
Options tab -> DangerZone Remove -> confirm -> removePlugin(host, id, keep) -> x-ahpd/plugins/remove -> close the tab
```

### Gaps

- The bridge has no call for `install`, `write` or `remove`.
- The explorer has no New action, and no page makes a plugin.
- `DangerZone` has no place for a choice such as "Keep the package installed".
- The Options tab draws nothing else when a plugin has no options.

## Answers

| What | Source | Task |
| --- | --- | --- |
| One New plugin form with a *How* choice, not two toolbar actions | Softov, 2026-11-12, chose "One form, How choice (Recommended)" | 02 |
| Remove is a danger zone at the bottom of the Options tab, with "Keep the package installed" | Softov, 2026-11-12, chose "Danger zone in Options (Recommended)" | 03 |
| A written plugin changes on a Source tab, not through an Edit button | Softov, 2026-11-12, chose "Source tab (Recommended)" | deferred |
| Write starts from ahpw's starter text: an import, a title and an empty `apply`, and a `package.json` with `name`, `version`, `type` and `dependencies` | Softov, 2026-11-12, chose "ahpw's starter, as mocked (Recommended)" | 02 |
| The starter `package.json` name follows the id until the admin edits that line | (defaulted: the connector id follows its title the same way) | 02 |
| New plugin shows when the host offers `x-ahpd/plugins/install` or `x-ahpd/plugins/write`, and each choice only when its command is offered | (defaulted: `mayToggle` shows an action by the host's offer) | 02 |
| Remove shows when the host offers `x-ahpd/plugins/remove` | (defaulted: as `mayToggle`) | 03 |
| Add shows "Adding…", a spinner and a note while it waits, and keeps the form disabled | (defaulted: npm can take minutes, and the host answers once the plugin is loaded) | 02 |
| A refusal shows `hostSaid` in an alert inside the form, and the form keeps what was typed | (defaulted: the sign-in step shows a refusal the same way) | 02 |
| A finished add or write reads the list again and opens the plugin's page, and closes the New plugin tab | [code://src/resources/connectors/ConnectorForm.tsx#L136-L139](../../../../src/resources/connectors/ConnectorForm.tsx#L136-L139) | 02 |
| Remove asks first, as Delete on a connector does, then closes the plugin's tab | [code://src/resources/connectors/actions.ts#L29-L43](../../../../src/resources/connectors/actions.ts#L29-L43) | 03 |
| An answer with `restart: true` shows the restart note the explorer and the page already draw | (defaulted: `rereadAfterChange` reads `restartNeeded` again) | 02, 03 |
| `DangerZone` takes optional children, drawn above its button | (defaulted: one shared control, and the other callers pass none) | 03 |
| Every new string is in the `en`, `pt` and `es` catalogs | (defaulted: ahpw's catalogs) | 02, 03 |
| New styles go in a CSS file beside their component | file:///github/ahpw/.project/briefs/styles-live-beside-their-component.md | 02 |

## Proposed architecture

- **Data flow** - the form sends a source, or an id with two texts. The host answers with the row's id, and ahpw opens that row.
- **Event flow** - the host sends the new or removed row on `x-ahpd-plugins://`. `rereadAfterChange` reads the list and the root again, as the other plugin commands do.
- **State flow** - the form keeps its fields, the busy flag and the refusal in its own React state. Nothing goes to the scena store.
- **Layer responsibilities** - bridges: the three calls · plugins screen: the command, the New plugin page, the starter text, Remove · shell controls: `DangerZone` children.
- **Source-of-truth files** - [`code://src/bridges/plugins.ts`](../../../../src/bridges/plugins.ts), [`code://src/resources/plugins/index.ts`](../../../../src/resources/plugins/index.ts)

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - The bridge installs, writes and removes](task-01-the-bridge-installs-writes-removes.md) | implemented | - |
| [02 - The New plugin form adds and writes](task-02-the-new-plugin-form.md) | implemented | 01 |
| [03 - Remove from the Options tab](task-03-remove-from-the-options-tab.md) | implemented | 01 |

## Risks and tradeoffs

- The starter text copies ahpd's plugin contract - a change to the contract changes `starter.ts`. The contract is in ahpd's `docs/plugins/PLUGINS.md`.
- An install can take minutes - the form stays busy and the page does not time out the request on its own.
- The host may offer the commands to a reader without `plugin:install` - the host refuses the call, and the form shows the refusal.

## Resume state

- **Done so far:** tasks 01, 02 and 03 are implemented on the branch `plugins/20261112-1003-a-plugin-is-added-or-written`, and wait for review. See [implemented.md](implemented.md).
- **Next action:** Softov reviews the diff and the screens.
- **Open questions:** none.
- **Watch out for:** compare each screen with the mockup at 1400 and 390 px, light and dark, and stop at any difference.

## Final verification checklist

- [ ] `pnpm typecheck` passes.
- [ ] The vitest suite passes, one suite at a time.
- [ ] On an isolated ahpd, an npm source adds a plugin and its page opens.
- [ ] A written plugin loads, and its page opens.
- [ ] A wrong source shows the host's refusal in the form.
- [ ] Remove, with and without "Keep the package installed", takes the row out of the list.
- [ ] Each screen matches the mockup at 1400 and 390 px, light and dark.
