---
title: A session shows its tasks and plan
created: 2026-11-21
refs:
  - git://92613ea816bb8904542cc3692ec10ce99b4d2794 - the commit of this repository the facts were checked at
  - git://f444e0191 - the commit of ahpd the host facts were checked at
  - "[code://src/resources/sessions/tool.ts#L84-L104](../../src/resources/sessions/tool.ts#L84-L104) - `KINDS` and `kindOf`, which have no kind for a todo call or a task tool"
  - "[code://src/resources/sessions/tool.ts#L132](../../src/resources/sessions/tool.ts#L132) - `outputOf`, which reads a call's text content"
  - "[code://src/resources/sessions/Parts.tsx#L140](../../src/resources/sessions/Parts.tsx#L140) - `ToolCall`, the one way a call is drawn today"
  - "[code://src/resources/sessions/artifact-list.ts#L55](../../src/resources/sessions/artifact-list.ts#L55) - `readArtifacts`, a reader of a session's `_meta` key to copy"
  - "[code://src/resources/sessions/Composer.tsx#L499-L500](../../src/resources/sessions/Composer.tsx#L499-L500) - the artifacts and references pills over the composer, the sibling to copy"
  - "[code://src/bridges/usage-meta.ts#L79](../../src/bridges/usage-meta.ts#L79) - how ahpw reads an `ahpd.*` key of a session's `_meta`"
  - "[code://src/bridges/connectors.ts#L33-L38](../../src/bridges/connectors.ts#L33-L38) - a bridge to an `x-ahpd-*` channel, the pattern for the plan channel"
  - https://github.com/ahpio/ahpd/blob/f444e0191/docs/plugins/TASK-LIST.md#what-a-client-sees - the three surfaces a client reads the list from
  - https://github.com/ahpio/ahpd/blob/f444e0191/packages/sdk/src/host/spawn.ts#L1105 - the host's one `TodoWrite` call per turn, "Update todo list"
  - https://github.com/ahpio/ahpd/blob/f444e0191/packages/tasks/src/plugin.ts#L164 - `ahpd.tasks`, the open count in a session's `_meta`
  - https://github.com/ahpio/ahpd/blob/f444e0191/packages/tasks/src/channel.ts#L23 - `x-ahpd-plans://<plan id>`, the plan channel
  - https://github.com/ahpio/ahpd/blob/f444e0191/packages/tasks/src/tasks.ts#L110 - `task_add` fills `session` with the calling session
  - https://github.com/ahpio/ahpd/blob/f444e0191/packages/tasks/src/plans.ts#L60 - `plan_create` refuses a session scope
  - https://github.com/microsoft/vscode/blob/6b68d3fe7dd7db9a3aaa052efc1f3a1fd4432eb2/src/vs/platform/agentHost/node/claude/claudeToolDisplay.ts#L160 - VS Code names an agent's todo call `TodoWrite`, the reference ahpd follows
---

# A session shows its tasks and plan

Softov wants a session in ahpw to show the tasks and the plan its agent works from.
An agent in ahpd tracks work with the `@ahpd/tasks` tools, such as `task_add` and `task_set`.
It may also use its harness's own list, such as Claude's `TodoWrite`.
Today ahpw draws each of these as a plain tool call with a text answer, so the user cannot see the list as a list.
Softov asked for this on 2026-11-21, from session `ahp-session:/d5f25d91-b4ba-4d25-9e73-3010d89063a1`, where an agent made plan `p1` with seven tasks.

## What others do

- VS Code shows an agent's task list as one todo call, `TodoWrite`, with the line "Update todo list".
- ahpd copies that name and line, as the `claudeToolDisplay.ts` ref says.
- ahpd's own docs name three surfaces for a client, in *What a client sees* of `TASK-LIST.md`. ahpw follows that reference.

## What ahpd has today

The host serves the list on three surfaces, all views of the `tasks` and `plans` records:

| Surface | What it carries | Where a client reads it |
|---|---|---|
| The todo call | One `TodoWrite` call per turn, with one line per task: `- [x] <title>` for `done`, `- [ ] <title>` for any other status | The turn's response parts |
| The open count | `{ "ahpd.tasks": { "open": n } }`, every status but `done` and `dropped` | The session's `_meta`, and `session/metaChanged` |
| The plan channel | The plan record and its tasks, then `x-ahpd-plans/taskAdded`, `taskSet`, `taskRemoved` and `set` | A subscribe to `x-ahpd-plans://<plan id>`, which needs `session:read` |

- A session's tasks are the tasks whose `session` names it, plus the tasks of a plan scoped to the session.
- `task_add` sets `session` to the calling session when the input names none. So the tasks an agent adds count for its session.
- `plan_create` takes only a folder or a bot scope. Only a harness's own list makes a session-scoped plan.
- The todo call carries titles and a checkbox. It has no task id, no plan id and no status other than done.
- No surface tells a client which plan ids a session's tasks name. A client cannot subscribe to the plan channel from a session alone.
- No channel lists the plans. The plan channel serves one plan per URI.
- The host tool calls reach ahpw with their harness names, such as `mcp__host__task_add` in a Claude session. Each answers in one line per item: `id, status, priority, title` for a task, `id, status, title` for a plan.

## What ahpw has today

- [`kindOf`](../../src/resources/sessions/tool.ts#L84-L104) has no kind for `TodoWrite` or for a task tool, so each is `other`.
- [`ToolCall`](../../src/resources/sessions/Parts.tsx#L140) draws every call the same way, with its text output from [`outputOf`](../../src/resources/sessions/tool.ts#L132). The todo call's `- [ ]` lines show as text, not as checkboxes.
- ahpw reads no `ahpd.tasks` key. It reads other `ahpd.*` keys of a session's `_meta`, as [`usage-meta.ts`](../../src/bridges/usage-meta.ts#L79) does.
- ahpw subscribes to no `x-ahpd-plans` channel. It subscribes to other `x-ahpd-*` channels, as the [connectors bridge](../../src/bridges/connectors.ts#L33-L38) does.
- A session's artifacts and references come from its `_meta` through [`readArtifacts`](../../src/resources/sessions/artifact-list.ts#L55), and show as [two pills over the composer](../../src/resources/sessions/Composer.tsx#L499-L500) that open a list. That is the sibling a tasks pill copies.

## Who writes

- The branch `sessions/canvas-reads-uri`, in `ahpw.worktrees/canvas-uri`, changes `SessionHeader.tsx` and the canvases. It touches none of the files in *The change*, except the header if the count goes there.
- The worktree `release-0.9.0` holds the release branch. A change here lands after it.
- The worktree `computer-mockup` is a detached mockup, not meant to merge.
- The session `d5f25d91` writes ahpd, not ahpw. Its host plan adds `_meta` keys to running calls, not to the task surfaces.

## The change

- The todo call draws its lines as a checklist: a checked box for `- [x]`, an empty box for `- [ ]`, and the title.
- A host task or plan tool call, `task_*` or `plan_*` with or without a harness prefix, gets its own kind and icon. Its one-line-per-item answer draws as rows.
- The session reads `ahpd.tasks` from its `_meta`. When `open` is above zero, a tasks pill shows the count beside the artifacts pills.
- The pill opens the session's list: the lines of the latest todo call in the chat.
- When a plan id is known, the list subscribes to `x-ahpd-plans://<plan id>`.
- The subscribed list shows the plan's title and status, and each task with its status and priority.

## Open points

- How ahpw learns a session's plan ids. The options are a new `_meta` key from ahpd, such as `ahpd.tasks: { open, plans: [...] }`, or reading `plan` ids out of the task tool calls' answers. The first needs an ahpd change, which goes in ahpd's own brief or plan.
- Whether the full list belongs in the pill's popup, a side pane or a page of its own.
- Whether ahpw shows plans with no session, such as a folder's plans, in a tasks explorer. That needs a channel that lists plans, which ahpd does not have.
- Whether a task row offers actions, such as approve or set a status. The plan channel takes no action from a client, so each would go through a tool or a new method.
- VS Code's own todo widget in the chat view is not checked at a commit here.
