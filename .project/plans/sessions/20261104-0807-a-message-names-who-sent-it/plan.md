---
title: A message names who sent it
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
  - "[code://src/resources/sessions/origin.ts#L10-L62](../../../../src/resources/sessions/origin.ts#L10-L62) - `Source`, `sourceOf` and `askOf`, which give a delegated message its chip"
  - "[code://src/resources/sessions/Page.tsx#L89-L98](../../../../src/resources/sessions/Page.tsx#L89-L98) - `FromChip`, the chip over a delegated message, which this plan extends"
  - "[code://src/resources/sessions/Page.tsx#L123-L150](../../../../src/resources/sessions/Page.tsx#L123-L150) - `TurnView`, which draws the chip from `askOf`"
  - "[code://src/resources/sessions/Page.tsx#L261-L269](../../../../src/resources/sessions/Page.tsx#L261-L269) - `openSource`, which opens the chat or session a chip names"
  - "[code://src/resources/sessions/header.ts#L14-L17](../../../../src/resources/sessions/header.ts#L14-L17) - `subagentChats`, the pattern for reading a chat's `tool` origin"
  - "[code://src/resources/automations/index.ts#L117](../../../../src/resources/automations/index.ts#L117) - `ahp.openAutomation`, which opens an automation by its URI"
  - npm://@microsoft/agent-host-protocol@^1.0.0 - `MessageOrigin` holds only `kind`; `ChatOrigin` of kind `tool` names the parent chat; `SessionSummary.origin` names the automation and its run
---

## Goal

A message that an automation or a parent agent sent shows who sent it.
Today it looks like a message the person typed.
It keeps its bubble and its full text, and a chip over it names the sender and opens it.

## Reconnaissance

The files read and the patterns to reuse are the `refs` in the frontmatter, each with its note.

### Searches performed

- `rg -n "kind: 'automation'|kind: 'tool'" packages/*/src` in ahpd - an automation run starts a turn with origin `automation`, and a subagent chat's first message has origin `tool`.
- `rg -n "automation: URI|run: URI" types/` in the protocol - `AutomationSessionOrigin` on the session summary names the automation and the run.
- `rg -n "openAutomation" src` - `ahp.openAutomation` takes `{ host, resource }`.

### Runtime path

```
turn.message.origin.kind -> askOf(message, context) -> Ask bubble with from
  -> FromChip label and click -> openSource: the parent chat, or ahp.openAutomation
```

### Gaps

- `askOf` reads only `vscode.chat.delegation` for a chip, so an `automation` or `tool` message gets none.

## Answers

| What | Source | Task |
| --- | --- | --- |
| An `automation` or `tool` message keeps its bubble, with a source chip over it | Softov, 2026-11-04, "Bubble with a source chip" | 01 |
| The `tool` chip finds the parent chat from the chat summary's `origin.chat` | (defaulted: `MessageOrigin` carries only `kind`) | 01 |
| The `automation` chip finds the automation from the session summary's `origin.automation` | (defaulted: `MessageOrigin` carries only `kind`) | 01 |
| The `automation` chip says "From an automation", without the automation's name | Softov, 2026-11-04, "Say \"From an automation\"" | 01 |
| A chip whose source the host did not name is drawn without a click | (defaulted: a chip that opens nothing would be a dead button) | 01 |
| A delegated message keeps the delegation chip, which comes first | (defaulted: it names a chat, which is the more exact source) | 01 |

## Proposed architecture

- **Data flow** - `askOf` takes the chat's origin and the session's origin with the session URI.
  `Source` gains `scope` values `automation` and `agent`, and an `automation` URI.
- **Event flow** - a click on the chip calls `openSource`.
  An `agent` source picks the parent chat, and an `automation` source runs `ahp.openAutomation`.
- **Layer responsibilities** - `origin.ts`: what the chip names · `Page.tsx`: the chip and the click · i18n: the words.
- **Source-of-truth files** - [`code://src/resources/sessions/origin.ts`](../../../../src/resources/sessions/origin.ts)

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - an automation or agent message names its sender](task-01-a-message-names-its-sender.md) | done | - |

## Risks and tradeoffs

- A bot chat draws turns through its own view, so it gets no chip from this plan.

## Resume state

- **Done so far:** task 01 is done, checked by Softov on 2026-11-04. See [implemented.md](implemented.md).
- **Next action:** none.
- **Watch out for:** the chat summary is the picked chat's entry in `session.state.chats`, not the default chat's.

## Final verification checklist

- [x] An `automation` message shows "From an automation", and a click opens the automation.
- [x] A `tool` message in a subagent chat shows "From the parent agent", and a click opens the parent chat.
- [x] `pnpm typecheck` (tsc -b), `pnpm test` and `pnpm build` pass.
