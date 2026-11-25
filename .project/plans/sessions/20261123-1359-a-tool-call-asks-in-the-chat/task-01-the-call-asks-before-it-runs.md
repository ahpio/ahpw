---
title: The call asks before it runs
status: done
depends: []
layer: "resources"
refs:
  - "[code://src/resources/sessions/Confirm.tsx#L22-L48](../../../../src/resources/sessions/Confirm.tsx#L22-L48) - the Allow and Deny to copy"
  - "[code://src/resources/sessions/Parts.tsx#L201](../../../../src/resources/sessions/Parts.tsx#L201) - the call row"
---

## Objective

A command set to ask waits for Allow or Deny on its call in the chat before it runs.

## Files

- `UPDATE: src/resources/agent-tools/registry.ts` - ask as a fourth mode.
- `CREATE: src/resources/agent-tools/asks.ts` - the calls of this window that wait for a person.
- `UPDATE: src/resources/agent-tools/use-agent-tools.ts` - what the runner reads from the session page.
- `UPDATE: src/resources/sessions/Page.tsx` - gives the chat shown and whether the page is drawn.
- `UPDATE: src/resources/sessions/Activity.tsx` - a run with a waiting call stays open.
- `UPDATE: src/resources/agent-tools/runner.ts` - a pending ask per call, answered by Allow or Deny.
- `CREATE: src/resources/sessions/ClientAsk.tsx` - Allow and Deny on a running call that this client owns and that waits.
- `UPDATE: src/resources/sessions/Parts.tsx:201` - shows `ClientAsk` on such a call.
- `UPDATE: src/i18n/en.json` - the ask mode, the toast and the denial text.
- `UPDATE: src/i18n/es.json` - the same keys.
- `UPDATE: src/i18n/pt.json` - the same keys.
- `UPDATE: src/resources/agent-tools/runner.test.ts` - the cases in *Validation*.

## Steps

1. Add ask to the modes of each `ui.agentTools.` setting.
2. In the runner, keep a pending ask for a call whose command has the ask mode.
3. Show `ClientAsk` on the call row while its ask is pending.
4. On Allow, run the call as notify does.
5. On Deny, send `chat/toolCallComplete` with a failed result that says the person denied it.
6. When the chat is not in view, show a toast with an action that opens it, kept until dismissed.
7. Remove the ask and the toast when the entry leaves `inputNeeded`.
8. Add the i18n keys and the tests.

## Validation

- A call set to ask runs nothing until Allow.
- Deny sends one failed `chat/toolCallComplete`.
- An entry that leaves `inputNeeded` removes its ask.
- `pnpm typecheck` and `pnpm test` pass.

## Resume
