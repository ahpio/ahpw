---
title: An ahpw tool call asks in the chat before it runs - implemented
date: 2026-11-24
refs:
  - "[code://src/resources/agent-tools/asks.ts](../../../../src/resources/agent-tools/asks.ts)"
  - "[code://src/resources/agent-tools/runner.ts](../../../../src/resources/agent-tools/runner.ts)"
---

A command set to Ask waits for Allow or Deny on its call in the chat.

## What was built

- [`code://src/resources/agent-tools/asks.ts`](../../../../src/resources/agent-tools/asks.ts) - the calls that wait in this window.
- [`code://src/resources/agent-tools/runner.ts`](../../../../src/resources/agent-tools/runner.ts) - raises an ask, answers it, and shows the toast.
- [`code://src/resources/sessions/ClientAsk.tsx`](../../../../src/resources/sessions/ClientAsk.tsx) - Allow, Always allow and Deny. Always allow sets the command to Notify, and runs each waiting call of it.
- [`code://src/resources/files/index.ts`](../../../../src/resources/files/index.ts) - the agent reads what `line` and `end` of `ahp.openFile` mean.

## Verified

- `pnpm build`, `pnpm typecheck` and `pnpm test` pass.
- In Chromium with a scripted agent: Allow ran the command once, and Deny gave the agent "The user denied it."
- The session in a tab behind another showed one toast, and Open showed the call.
- With two windows, Allow in the second ran the command once and cleared the first.
- Not checked: a real model, ahpd's 10 minutes, and a toast for a chat of the session that is not the shown one.

## Departures from the plan

- The toast is decided when the call arrives or the session changes. A person who leaves the chat later gets none.
- One window shows the toast, the one that runs the session's calls.
- Allow also shows the "Agent ran" toast, as Notify does.
