---
title: ahpw serves its commands as tools for the agent
created: 2026-11-23
refs:
  - git://5a62583 - the commit of ahpw the facts were checked at
  - npm://@microsoft/agent-host-protocol@^1.0.0 - `SessionActiveClient.tools`, `ToolDefinition`, and `chat/toolCallStart`, which says the client that owns a tool runs it
  - npm://@softov/scena@^0.9.2 - `Command` in `sdk/command.d.ts`: `title`, `description`, `args` as an `ArgsSchema` of simple types, `disabled`, `when`
  - https://github.com/microsoft/vscode/blob/6b68d3fe7dd7db9a3aaa052efc1f3a1fd4432eb2/src/vs/platform/agentHost/node/agentSideEffects.ts#L555-L566 - the reference host gives a chat the tools a client announced, `handle.tools = activeClient.tools`
  - "[code://src/bridges/client-ids.ts#L5-L38](../../src/bridges/client-ids.ts#L5-L38) - one client id per host, kept in `localStorage`, so every window of a browser is one client"
  - "[code://src/bridges/data.ts#L690-L710](../../src/bridges/data.ts#L690-L710) - `hostRequests`, which answers `ping` and the trust request and refuses the rest"
  - "[code://src/resources/sessions/ToolsView.tsx#L48-L51](../../src/resources/sessions/ToolsView.tsx#L48-L51) - the Tools panel, which lists each client's tools read only"
  - "[code://src/resources/host/index.ts#L127-L140](../../src/resources/host/index.ts#L127-L140) - `ahp.openInterfaceSettings`, the Interface tab of the settings"
  - https://github.com/ahpio/ahpd/blob/3c0d3503f/packages/sdk/src/tools/clientcalls.ts#L220-L236 - ahpd, checked at `3c0d3503f`, raises a `toolClientExecution` entry on the session for the client that owns a call
  - https://github.com/ahpio/ahpd/blob/3c0d3503f/packages/sdk/src/host.ts#L152 - ahpd keeps a gone client's tools for 30 s, then fails its calls
---

# ahpw serves its commands as tools for the agent

Softov wants an agent to act on ahpw: open a session, a file or a terminal, start a session, change the layout.
ahpw does this as a client of the session, with tools it announces.
A scena command says that it can be a tool, and a person turns each one on in the UI.
Nothing is on by default.
Later, ahp-desk adds tools that are not ahpw commands, and a UI setup proposes settings such as where a session opens.

## What others do

- VS Code announces 21 tools as a client of a session, seen on the dev ahpd on 2026-11-23.
- They are in four groups: sessions (`readSessionsList`), automations (`runAutomation`), other hosts (`create_remote_session`) and the browser (`openBrowserPage`, `clickElement`).
- The reference host gives each chat of the session the tools the client announced, at `agentSideEffects.ts#L564`.
- AHP 1.0 says the client named in a call's `contributor` runs the call and sends `chat/toolCallComplete`.

## What ahpw has today

- ahpw sends no `session/activeClientSet`, so it announces no tools.
- `hostRequests` answers `ping` and `vscode/requestWorkspaceTrust`, and refuses every other request from the host.
- `localClientIds` keeps one client id per host in `localStorage`. Two windows of one browser are one client to ahpd.
- The Tools panel lists each client's tools with the label "From this client", and has no switch.
- ahpw registers about 86 scena commands with ids `ahp.*`. Most take `host` in their arguments, and read the page's host when it is absent.
- scena's `Command` has a `title`, a `description` and `args`. `args` holds simple types only: `string`, `number`, `boolean`, a list of choices, each optional or not.
- scena's `Command` has no field that says it can be a tool.

## What ahpd does with a client's tools

- ahpd raises a `toolClientExecution` entry on the session for the client that owns a call, and waits for that client's answer.
- ahpd keeps a client that left for 30 s, then fails the calls it owes.

## Who writes

- `/github/ahpw` is on `main` at `git://5a62583`.
- `/github/ahpw.worktrees/client-info` holds uncommitted changes to `facts.tsx`, `facts.css`, `tooling.ts` and the i18n files. It does not change `ToolsView.tsx` or `data.ts`. A plan from this brief starts after it merges.
- `/github/ahpw.worktrees/computer-mockup` and `/github/ahpw.worktrees/tags-plan` hold only untracked files that this change does not touch.
- `origin/shell/20261121-1215-tabs-are-kept-on-every-surface` is an open branch on the tabs. Check it before a task changes where a command opens.

## The change

The answers are Softov's, from 2026-11-23.

| What | Answer |
| --- | --- |
| How a command becomes a tool | A command is marked as a tool in an ahpw registry, beside its registration, through one helper. |
| Where the mark lives later | A field on scena's `Command`, after ahpw shows what the field needs. Moving it is a change to the helper. |
| The tools ahpw announces | `listCommands` returns the marked commands that are on, with what the model reads and their arguments. `runCommand` runs one by id. |
| Tools that are not ahpw commands | Specific tools, for ahp-desk and others, later. |
| The default | Every marked command is off. |
| Where a person turns one on | In the Tools panel, in a group for this browser, and in the settings. Both write one setting. |
| How far one switch reaches | Every host and every session, in this browser. |
| Which window runs a call | The window used last. Windows keep one client id, and the window that has focus holds a browser lock. |
| What happens on each call | A setting per command: run, notify or ask. The default is notify: the call runs and a toast names it. |
| The first commands to mark | Open: `ahp.openSession`, `ahp.openFile`, `ahp.openDiff`, `ahp.openTerminal`. Create: `ahp.newSession`, `ahp.newTerminal`. Layout: `ahp.manage.layout`, `ahp.manage.theme`. Settings: `ahp.openSettings`, `ahp.openInterfaceSettings`. |

## Open points

- What the model reads for each command: scena's `title` and `description`, or a text written for the model in the mark.
- How `runCommand` gets the arguments a command needs, such as `host`, when scena's `args` has no JSON Schema.
- Whether ahpw announces `listCommands` and `runCommand` in each session it opens, or only while one command is on.
- What `ask` shows while a call waits, and what ahpw answers when the person does not respond before ahpd gives up.
