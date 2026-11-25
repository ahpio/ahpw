---
title: ahpw serves its commands as tools for the agent - implemented
date: 2026-11-24
refs:
  - "[code://src/resources/agent-tools/registry.ts](../../../../src/resources/agent-tools/registry.ts)"
  - "[code://src/resources/agent-tools/runner.ts](../../../../src/resources/agent-tools/runner.ts)"
---

An agent can list and run the ahpw commands that a person turned on in this browser.

## What was built

- [`code://src/resources/agent-tools/registry.ts`](../../../../src/resources/agent-tools/registry.ts) - the marks and their modes.
- [`code://src/resources/agent-tools/tools.ts`](../../../../src/resources/agent-tools/tools.ts) - `listCommands` and `runCommand`.
- [`code://src/resources/agent-tools/check.ts`](../../../../src/resources/agent-tools/check.ts) - the input check, which also refuses a field the schema does not name.
- [`code://src/resources/agent-tools/use-agent-tools.ts`](../../../../src/resources/agent-tools/use-agent-tools.ts) - the announcement, the lock and the runner of an open session.
- [`code://src/resources/agent-tools/ModesGroup.tsx`](../../../../src/resources/agent-tools/ModesGroup.tsx) - the Tools panel group. The Interface tab has an Agent tools section.

## Verified

- `pnpm build`, `pnpm typecheck` and `pnpm test` pass.
- Two windows on an isolated ahpd with a scripted agent: the focused window alone ran each call, with one toast.
- The same run: a wrong argument and an off command got a failed result, and a switch-off in one window removed the client.
- A real Claude session listed the commands and opened a file, with one toast. A denied call ran nothing. A script gave the answers, not ahpw's buttons.

## Departures from the plan

- Each call has a lock of its own. A window that takes the session over while a call runs does not run it again.
- A mode changed in one window reaches the others through the `storage` event.
- ahpw announces no tools where the browser has no Web Locks, which is any page not on https or localhost.
- The marks register when their modules load, so the settings and an embedder's profile see every one. Each has an order.
- The Interface tab draws the modes with its own form control, wider than the mockup's.

## Left for later

- The ask mode, in `sessions/20261123-1359-a-tool-call-asks-in-the-chat`.
