---
title: ahpw serves its commands as tools for the agent
domain: sessions
status: built
priority: medium
created: 2026-11-23
revalidated: 2026-11-23
refs:
  - git://fc0c72a - the last commit that holds the brief `briefs/ahpw-serves-its-commands-as-tools.md`, which this plan and its sibling replace
  - npm://@microsoft/agent-host-protocol@^1.0.0 - `SessionActiveClient.tools`, `SessionToolClientExecutionRequest` in `inputNeeded`, and `chat/toolCallComplete`
  - npm://@softov/scena@^0.9.2 - `Command` and `CommandRegistry.execute` in `sdk/command.d.ts`
  - https://github.com/microsoft/vscode/blob/6b68d3fe7dd7db9a3aaa052efc1f3a1fd4432eb2/src/vs/platform/agentHost/node/agentSideEffects.ts#L555-L566 - the reference host gives each chat the tools a client announced
  - "[code://src/bridges/client-ids.ts#L22-L38](../../../../src/bridges/client-ids.ts#L22-L38) - one client id per host in `localStorage`, so every window of a browser is one client"
  - "[code://src/shell/dock/settings.ts#L137-L151](../../../../src/shell/dock/settings.ts#L137-L151) - `DOCK_SETTINGS` and `DOCK_KEYS`, a generated list of `ui.` settings that the tool settings copy"
  - "[code://src/shell/ui-settings/settings.ts#L73](../../../../src/shell/ui-settings/settings.ts#L73) - `UI_SETTINGS`, which takes the generated list as it takes the dock's at line 141"
  - "[code://src/resources/host/sections.ts#L38-L48](../../../../src/resources/host/sections.ts#L38-L48) - `UI`, the Interface tab's sections, where a section of tool keys goes"
  - "[code://src/resources/sessions/ToolsView.tsx#L49-L51](../../../../src/resources/sessions/ToolsView.tsx#L49-L51) - the Tools panel's `Group`, read only today"
  - "[code://src/resources/sessions/Page.tsx#L243](../../../../src/resources/sessions/Page.tsx#L243) - `useOpenQuestions`, which reads `inputNeeded`; the call runner reads the same list"
  - "[code://src/shell/notify/say.ts#L27](../../../../src/shell/notify/say.ts#L27) - `done`, the toast that notify shows"
  - "[code://src/shell/manage.ts#L110-L133](../../../../src/shell/manage.ts#L110-L133) - `ahp.manage.layout` and `ahp.manage.theme`, which open a menu"
  - "[code://src/shell/commands.ts#L37-L50](../../../../src/shell/commands.ts#L37-L50) - `themeList`, the themes and how one is set"
  - "[code://src/shell/layout-menu.ts#L50-L80](../../../../src/shell/layout-menu.ts#L50-L80) - `layoutMenu`: the main view, the mode and the areas"
---

## Goal

An agent acts on ahpw.
It opens a session, a file, a diff or a terminal, and starts a session or a terminal.
It changes the layout or the theme, and opens the settings.
ahpw does this as a client of the session, with two tools, `listCommands` and `runCommand`.
A command is served only when ahpw marks it and a person turns it on.
Nothing is on by default.

## Reconnaissance

The files read and the patterns to reuse are the `refs` in the frontmatter, each with its note.

### Searches performed

- `rg "activeClientSet" src` - ahpw sends none, so it announces no tools.
- `rg "ajv|zod|valibot" package.json` - ahpw has no JSON Schema validator.
- `rg "navigator.locks|BroadcastChannel" src` - ahpw coordinates no windows today.
- `rg "args:" src` on the ten commands - none declares scena `args`. Their arguments are TypeScript types only, such as `OpenFileArgs`.

### Runtime path

```
switch in Tools panel or settings -> ui.agentTools.<id> in the store -> announce (session/activeClientSet) in each session open in a tab
agent calls runCommand -> ahpd: inputNeeded toolClientExecution for our client id -> the window holding the session's lock
  -> check the input against the mark's schema -> scena execute -> toast (notify) -> chat/toolCallComplete
```

### Gaps

- No place marks a command as a tool.
- No setting holds a mode per command.
- ahpw announces nothing and runs no call.
- Two windows of one browser share one client id, and both see each call.
- The layout and theme commands take no choice.

## Answers

| What | Source | Task |
| --- | --- | --- |
| Plan the brief | Softov, 2026-11-23, "plan it" | all |
| A command is marked in an ahpw registry beside its registration, through one helper | Softov, 2026-11-23, brief | 01 |
| The mark moves to a scena field later; then only the helper changes | Softov, 2026-11-23, brief | 01 |
| ahpw announces `listCommands` and `runCommand` | Softov, 2026-11-23, brief | 01, 02 |
| The model reads a minimal English text in the mark | Softov, 2026-11-23, "keep text minimal necessary" | 01, 04 |
| The mark holds a JSON Schema, and `runCommand` checks a call against it | Softov, 2026-11-23, brief | 01 |
| The check covers the JSON Schema subset the marks use, written in ahpw | (defaulted: no new dependency) | 01 |
| A call without `host` takes the host of the session that made it | Softov, 2026-11-23, brief | 01 |
| Each marked command has one mode: off, run or notify; ask comes with `sessions/20261123-1359-a-tool-call-asks-in-the-chat` | Softov, 2026-11-23, brief | 01 |
| Every command is off by default | Softov, 2026-11-23, brief | 01 |
| A mode reaches every host and session in this browser | Softov, 2026-11-23, brief | 01 |
| The modes are `ui.` settings, generated as the dock's are | [`code://src/shell/dock/settings.ts#L137-L151`](../../../../src/shell/dock/settings.ts#L137-L151) | 01, 03 |
| ahpw announces only while one command or more is on | Softov, 2026-11-23, brief | 02 |
| Each session open in a tab gets the tools | Softov, 2026-11-23, brief | 02 |
| The window used last runs a call: a lock per session, taken on focus | Softov, 2026-11-23, brief | 02 |
| notify runs the call and shows a toast with the command and the session | Softov, 2026-11-23, brief | 02 |
| The Tools panel and the Interface tab both set the modes | Softov, 2026-11-23, brief | 03 |
| The ten commands of the brief are marked | Softov, 2026-11-23, brief | 04 |
| `ahp.manage.theme` takes `theme`, and `ahp.manage.layout` takes `view`, `mode` or `area`; without one, each opens its menu | Softov, 2026-11-23, "Optional choice on the command" | 04 |

## Proposed architecture

- **Data flow** - `serveAsTool(id, { text, input })` adds a mark to a registry. `listCommands` returns the marks whose mode is not off. `runCommand` checks the input, fills `host`, and calls scena's `execute`.
- **Event flow** - A mode change sends `session/activeClientSet` again in each open session. A `toolClientExecution` entry for this client id starts a call in the window that holds that session's lock.
- **State flow** - Each mode is a store path that the browser keeps, as other `ui.` settings are kept.
- **Layer responsibilities** - `src/resources/agent-tools/`: the registry, the two tools, the check, the runner. `src/resources/sessions/`: the Tools panel group. Each command's module: its own mark.
- **Source-of-truth files** - `src/resources/agent-tools/registry.ts`, which task 01 creates.

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - The mark, the modes and the two tools](task-01-the-mark-the-modes-and-the-tools.md) | done | - |
| [02 - Each open session gets the tools and runs a call](task-02-open-sessions-get-the-tools.md) | done | 01 |
| [03 - The Tools panel and the settings set the modes](task-03-the-panel-and-settings-set-modes.md) | done | 01 |
| [04 - The ten commands are marked](task-04-the-ten-commands-are-marked.md) | done | 01 |

## Risks and tradeoffs

- The agent acts in the person's UI. Every command is off until the person turns it on, and notify is the usual mode.
- A window that holds a lock and then hides still runs calls. The toast names the session, so the person can find what moved.
- The check covers a subset of JSON Schema. A mark that uses more fails a test in task 01.

## Resume state

- **Done so far:** tasks 01 to 04, 2026-11-24, as [implemented.md](implemented.md) says.
- **Next action:** none.
- **Open questions:** none.
- **Watch out for:** windows share one client id, so every window with the session open sees a call. Only the lock holder runs it.

## Final verification checklist

- [x] With every mode off, a session shows no ahpw client and no ahpw tools.
- [x] A command set to notify is in `listCommands`, runs from `runCommand`, and shows a toast.
- [x] A call with a wrong argument gets an error result that names the field, and runs nothing.
- [x] With two windows on one session, only the focused one runs a call.
- [x] The Tools panel and the Interface tab show the same mode for each command.
- [x] `pnpm typecheck` and `pnpm test` pass.
