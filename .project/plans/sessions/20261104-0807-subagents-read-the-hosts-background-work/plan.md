---
title: The subagents button reads the host's background work
domain: sessions
status: built
priority: medium
created: 2026-11-04
revalidated: 2026-11-04
requires: []
changes: []
creates: []
refs:
  - git://16b2185 - the commit of ahpw this plan was checked at
  - "[code://src/resources/sessions/header.ts#L54-L74](../../../../src/resources/sessions/header.ts#L54-L74) - `subagentsOf`, which lists subagents from the tool calls and the spawned chats"
  - "[code://src/resources/sessions/SessionHeader.tsx#L76](../../../../src/resources/sessions/SessionHeader.tsx#L76) - the header builds its subagents button from `subagentsOf`"
  - "[code://src/resources/sessions/raw.test.ts#L50-L66](../../../../src/resources/sessions/raw.test.ts#L50-L66) - the `subagentsOf` cases"
  - "[code://src/resources/sessions/shells.ts](../../../../src/resources/sessions/shells.ts) - `shellsOf`, the pattern for reading rows of one kind from `backgroundWork`"
  - npm://@microsoft/agent-host-protocol@^1.0.0 - `BackgroundSubagentWork`, a row of kind `subagent` with the subagent's `chat`
  - https://github.com/microsoft/vscode/blob/171e90619c723a84a3e1c7bcd58d226698f55c72/src/vs/workbench/contrib/chat/browser/agentSessions/agentHost/agentHostBackgroundShells.ts#L16-L38 - VS Code reads `backgroundWork` by kind, and skips the kinds it does not know
---

## Goal

The subagents button left of the `···` menu counts a subagent as running while the host lists it in `backgroundWork`.
Today a background subagent's call ends at once, so the button shows it as running only while its chat's status says so.

## Reconnaissance

The files read and the patterns to reuse are the `refs` in the frontmatter, each with its note.

### Searches performed

- `rg -n "backgroundWork" src` - only the composer's shells list reads it.
- `rg -n "subagentsOf\(" src` - the header is its one caller.

### Runtime path

```
chat.backgroundWork -> subagentsOf(turns, active, chats, work) -> the subagents button's count and menu
```

### Gaps

- `subagentsOf` does not read the rows of kind `subagent`.

## Answers

| What | Source | Task |
| --- | --- | --- |
| The subagents button also reads the host's `backgroundWork` subagent rows | Softov, 2026-11-04, "Also read backgroundWork rows" | 01 |
| A subagent that a row lists is running | (defaulted: the host lists a row while the work runs) | 01 |
| A row's label is the title only when the call and the chat give none | (defaulted: the existing order of titles stays) | 01 |
| A row of another kind, or with no `chat`, is skipped | (defaulted: as `shellsOf` and VS Code skip a kind they do not draw) | 01 |

## Proposed architecture

- **Data flow** - `subagentsOf` takes the chat's `backgroundWork` as a fourth argument, and adds each subagent row after the calls and the chats.
- **Layer responsibilities** - `header.ts`: the merge · `SessionHeader.tsx`: passes `chat.backgroundWork`.
- **Source-of-truth files** - [`code://src/resources/sessions/header.ts`](../../../../src/resources/sessions/header.ts)

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - the subagents button reads background rows](task-01-the-button-reads-background-rows.md) | done | - |

## Risks and tradeoffs

- None known: a row only adds a subagent or marks one as running.

## Resume state

- **Done so far:** task 01 is done, checked by Softov on 2026-11-04. See [implemented.md](implemented.md).
- **Next action:** none.
- **Watch out for:** the row's `chat` is the same URI the spawning call links, so one subagent stays one entry.

## Final verification checklist

- [x] A subagent that only a `backgroundWork` row names shows in the button as running.
- [x] `pnpm typecheck` (tsc -b), `pnpm test` and `pnpm build` pass.
