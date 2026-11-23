---
title: An ahpw tool call asks in the chat before it runs
domain: sessions
status: planned
priority: medium
created: 2026-11-23
revalidated: 2026-11-23
requires:
  - plans/sessions/20261123-1358-ahpw-serves-its-commands-as-tools/plan.md
refs:
  - git://fc0c72a - the last commit that holds the brief `briefs/ahpw-serves-its-commands-as-tools.md`
  - npm://@microsoft/agent-host-protocol@^1.0.0 - `SessionToolClientExecutionRequest`: the call is `running` when it reaches the client
  - "[code://src/resources/sessions/Confirm.tsx#L22-L48](../../../../src/resources/sessions/Confirm.tsx#L22-L48) - `Confirm`, the Allow and Deny of a host confirmation, which the ask copies"
  - "[code://src/resources/sessions/Parts.tsx#L201](../../../../src/resources/sessions/Parts.tsx#L201) - where a tool call row shows `Confirm`"
  - "[code://src/shell/notify/say.ts#L7-L15](../../../../src/shell/notify/say.ts#L7-L15) - `Said`: `actions` and `dismissAuto` for a toast that waits"
  - https://github.com/ahpio/ahpd/blob/3c0d3503f/packages/sdk/src/tools/clientcalls.ts#L118 - ahpd ends a client call after 10 minutes
---

## Goal

A person can set an ahpw command to ask.
When the agent calls it, the call in the chat shows Allow and Deny, and nothing runs until the person answers.
When that chat is not in view, a toast says so and opens it.

## Reconnaissance

The files read and the patterns to reuse are the `refs` in the frontmatter, each with its note.

### Searches performed

- `rg "PENDING_CONFIRMATION" src/resources/sessions` - `Confirm` shows only on a host confirmation; an ahpw call reaches ahpw already `running`.
- `rg "dismissAuto" src/shell/notify` - a toast can stay until a person dismisses it, and can carry actions.

### Runtime path

```
runner (plan 1358) -> mode ask -> pending ask for the call -> Allow and Deny on the call row, toast when the chat is not in view
  Allow -> runTool -> chat/toolCallComplete
  Deny -> chat/toolCallComplete with a failed result
```

### Gaps

- The mode setting has no ask value.
- A running call owned by this client has no Allow and Deny.

## Answers

| What | Source | Task |
| --- | --- | --- |
| ask is a fourth mode beside off, run and notify | Softov, 2026-11-23, brief | 01 |
| The chat shows Allow and Deny at the call, as a host confirmation does | Softov, 2026-11-23, "In the chat, at the call" | 01 |
| A toast says so when the chat is not in view, and opens the chat | Softov, 2026-11-23, "In the chat, at the call" | 01 |
| ahpw keeps no timer; ahpd ends the call after 10 minutes, and ahpw removes the prompt | Softov, 2026-11-23, brief | 01 |
| Deny answers with a failed result that says the person denied it | (defaulted: the agent learns why the call did not run) | 01 |
| The window where the person answers runs the call: the click gives it focus, and focus takes the lock | (defaulted: the lock rule of plan 1358) | 01 |

## Proposed architecture

- **Data flow** - The runner keeps a pending ask per call. Allow runs it; Deny answers it with a failed result.
- **Event flow** - A pending ask shows on the call row in every window with the chat open. The entry leaving `inputNeeded` removes it.
- **State flow** - Pending asks are window state, read from `inputNeeded`; nothing is kept.
- **Layer responsibilities** - `src/resources/agent-tools/`: the ask in the runner. `src/resources/sessions/`: the row's Allow and Deny.
- **Source-of-truth files** - `src/resources/agent-tools/runner.ts`, which plan 1358 creates.

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - The call asks before it runs](task-01-the-call-asks-before-it-runs.md) | todo | - |

## Risks and tradeoffs

- A person away for 10 minutes loses the call; the agent gets ahpd's timeout.

## Resume state

- **Done so far:** nothing.
- **Next action:** build `plans/sessions/20261123-1358-ahpw-serves-its-commands-as-tools` first, then [task-01-the-call-asks-before-it-runs.md](task-01-the-call-asks-before-it-runs.md).
- **Open questions:** none.
- **Watch out for:** the call is `running` on the host while it waits; do not show `Confirm`, which sends `chat/toolCallConfirmed`.

## Final verification checklist

- [ ] A command set to ask runs only after Allow.
- [ ] Deny gives the agent a failed result that says the person denied it.
- [ ] With the chat out of view, a toast opens it.
- [ ] `pnpm typecheck` and `pnpm test` pass.
