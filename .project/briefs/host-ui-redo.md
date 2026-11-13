---
title: The host page is redone
created: 2026-11-12
refs:
  - git://83ec677 - the commit of ahpw the facts were checked at
  - "[code://src/resources/host/Info.tsx#L91-L187](../../src/resources/host/Info.tsx#L91-L187) - the host page today"
  - "[code://src/resources/host/Info.tsx#L124-L136](../../src/resources/host/Info.tsx#L124-L136) - the agents as one link to the Agents sidebar"
  - "[code://src/resources/host/Info.tsx#L40-L55](../../src/resources/host/Info.tsx#L40-L55) - the daemon facts, off while ahpw is AHP only"
  - "[code://src/bridges/data.ts#L83-L92](../../src/bridges/data.ts#L83-L92) - `HostFacts`, what ahpw keeps about a host"
  - "[code://src/resources/sessions/index.ts#L222-L236](../../src/resources/sessions/index.ts#L222-L236) - `ahp.newSession`, which takes a `provider` and a `host`"
---

# The host page is redone

Softov wants the host page redone for 0.16. Each agent can be clicked, the page starts a new session, and it says more about the host. This brief collects what to analyse when the work is planned.

## What ahpw has today

- The page has three lists, *Connection*, *Daemon* and *Offers*, then the trusted folders, the terminals and the restart danger zone. See [`code://src/resources/host/Info.tsx`](../../src/resources/host/Info.tsx#L139-L186).
- The agents are one link: their display names joined by commas. A click opens the Agents sidebar, not one agent. See [`code://src/resources/host/Info.tsx`](../../src/resources/host/Info.tsx#L124-L132).
- The page has no New session action. Its head has Reconnect and Settings only. See [`code://src/resources/host/Info.tsx`](../../src/resources/host/Info.tsx#L146-L149).
- `ahp.newSession` already takes `provider` and `host`, so an agent on the page can start a session with that agent. `ahp.openAgent` opens one agent.
- *Daemon* never shows: its `GET /api/status` call is commented out, so the process, the address and the storage paths are not drawn. See [`code://src/resources/host/Info.tsx`](../../src/resources/host/Info.tsx#L40-L55).
- `HostFacts` holds the label, the client id, the protocol version and the server sequence.
  It also holds the connect time, the active session count, the terminals and the subscription count. See [`code://src/bridges/data.ts`](../../src/bridges/data.ts#L83-L92).
- *Connection* shows the client id, the server sequence and the subscription count, which are facts about the wire, not the host.

## Who writes

No open PR or unmerged branch of ahpw touches `src/resources/host/` at 83ec677.

## The change

- Each agent on the host page opens that agent's page.
- The host page starts a new session on that host, and an agent's row starts one with that agent.
- The host page shows more about the host.

## Open points

- What "more info about the host" holds: the ahpd version, the uptime, the storage, the plugins, the machines, the usage. Each one needs a source the host sends; ahpw draws only what the host sends.
- Whether ahpd sends the daemon facts over AHP, such as in the `initialize` `_meta`, so *Daemon* draws again.
- Whether the wire facts (client id, server sequence, subscriptions) stay, move to a details section, or go.
- Whether an agent's row shows more than its name: its state, its alerts, its models.
- How other clients draw a host or a server page was not looked at yet.
- A mockup comes before the plan.
