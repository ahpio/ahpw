---
title: A plugin shows what it made
created: 2026-11-02
refs:
  - git://9245b4023f59b5735d0ac737de559c2e58fd9d1c - the commit of this repository the facts were checked at
  - git://f419294d - the commit of ahpd the host facts were checked at
  - git://4437fe4a9c4f7e685f7fbb614013fa58399913a5 - the commit of doop the reference was checked at
  - "[code://src/resources/plugins/Overview.tsx#L82-L99](../../src/resources/plugins/Overview.tsx#L82-L99) - the *Provides* list: a label and the names of each kind"
  - "[code://src/resources/plugins/provides.ts#L16](../../src/resources/plugins/provides.ts#L16) - `PROVIDE_ORDER`, the kinds that have a label"
  - "[code://src/resources/plugins/provides.ts#L40-L48](../../src/resources/plugins/provides.ts#L40-L48) - `linkOf`, where ahpw maps a kind to the section that opens"
  - "[code://src/bridges/connectors.ts#L125-L133](../../src/bridges/connectors.ts#L125-L133) - `ConnectorRow`, with its `adapter` and its `state`"
  - "[code://src/resources/connectors/rows.ts#L11-L16](../../src/resources/connectors/rows.ts#L11-L16) - the dot of each connector state"
  - "[code://src/resources/connectors/index.ts#L28-L33](../../src/resources/connectors/index.ts#L28-L33) - `ConnectorArgs`, with no adapter"
  - "[code://src/resources/connectors/index.ts#L84-L93](../../src/resources/connectors/index.ts#L84-L93) - `ahp.newConnector`, which opens the form with no adapter chosen"
  - "[code://src/bridges/agents.ts#L57-L74](../../src/bridges/agents.ts#L57-L74) - `AgentRow`, with its `engine` and its `state`"
  - "[code://src/i18n/en.json#L2508-L2516](../../src/i18n/en.json#L2508-L2516) - the labels of the kinds"
  - https://github.com/softov/doop/blob/4437fe4a9c4f7e685f7fbb614013fa58399913a5/packages/web/src/components/panels/PluginDetailPanel.tsx#L414-L497 - doop's `renderFactoryInstanceRow`, the reference
  - https://github.com/ahpio/ahpd/blob/f419294d/packages/sdk/src/tunnels/channel.ts#L1-L10 - `x-ahpd-tunnels`, one row per tunnel with its `kind` and `status`
  - https://github.com/ahpio/ahpd/blob/f419294d/packages/sdk/src/types/plugin.ts#L1486-L1495 - `PluginContracts`, the kinds a manifest names
---

# A plugin shows what it made

Softov wants a plugin's page to show what each type it registers made.
Each type shows its count of records, a button that adds one, and a status dot for each record.
doop's plugin page did this, and Softov asked for the same in ahpw on 2026-11-02.

## What others do

doop draws one row for each registered type, in `renderFactoryInstanceRow`:

- A chip with the type and its count, as `devtunnel ×2`.
- A `+` button that opens the add form of that type: *Add connector*, *Add channel* or *Add model*.
- One button for each record, with an icon tinted by `dotStatusColor` of its status. Its title is `<name> · <status>`, and a click opens the record.
- doop shows the section for connector types, channel types, model types and tools.

## What ahpw has today

- *Provides* lists each kind of the manifest's `contracts`, with the names it registers, at [`code://src/resources/plugins/Overview.tsx`](../../src/resources/plugins/Overview.tsx#L82-L99).
- A kind in [`PROVIDE_ORDER`](../../src/resources/plugins/provides.ts#L16) gets a label. Any other kind shows its raw key.
- The `tunnel-devtunnel` plugin names `adapters`, `closers` and `tunnelKinds`, each with `devtunnel` or a note. So its page shows *Adapters*, `closers` and `tunnelKinds`.
- `adapters: devtunnel` is a connector adapter: one connector is one GitHub account signed in to Dev Tunnels.
- `tunnelKinds: devtunnel` is a tunnel kind: one tunnel is one relay, and it names its connector.
- `closers` is a shutdown hook. It has no records and nothing to add.
- [`linkOf`](../../src/resources/plugins/provides.ts#L40-L48) opens the connectors section for an adapter, an agent's page for an agent, and a section for some channel schemes. The map is in ahpw, by kind name.
- ahpw reads connectors. Each [`ConnectorRow`](../../src/bridges/connectors.ts#L125-L133) has its `adapter` and a `state`, and the connectors list draws a [dot for each state](../../src/resources/connectors/rows.ts#L11-L16).
- [`ahp.newConnector`](../../src/resources/connectors/index.ts#L84-L93) opens the new connector form. Its [arguments](../../src/resources/connectors/index.ts#L28-L33) have no adapter, so the form starts with no adapter chosen.
- ahpw reads agents. Each [`AgentRow`](../../src/bridges/agents.ts#L57-L74) has its `engine` and a `state`.
- The host keeps tunnels on `x-ahpd-tunnels://`. Each row has its `kind` and the `status` the kind reported.
- ahpw has no tunnels page and does not read that channel.

## Who writes

- No pull request of ahpw is open.
- The branch `shell/friendlier-strings` has no change against `main`.
- The worktree `connectors/device-sign-in` is merged as #35.
- The brief [an-agent-signs-in-from-its-form](an-agent-signs-in-from-its-form.md) changes the agent form, not the plugin page.

## The change

The mockup Softov saw on 2026-11-02 shows the `tunnel-devtunnel` page:

| Label | Row |
|---|---|
| Connector adapters | `devtunnel ×2`, `+`, a green dot on `softov-gh`, an amber dot on `work-gh` |
| Tunnel kinds | `devtunnel ×1`, `+`, a green dot on `home-relay` |
| Internal | `closers` |

- A kind whose records a host channel lists shows, for each name, the count of its records, a `+` button and one chip per record.
- A chip has the dot of the record's state, the record's name, and `<name> · <state>` as its title. A click opens the record.
- The `+` button opens the add form of that kind, with the name already chosen.
- `ahp.newConnector` takes an adapter, so the form starts on it.
- `adapters` is labelled *Connector adapters* and `tunnelKinds` *Tunnel kinds*.
- A kind with no records, such as `closers` or `methods`, keeps today's list.

## Open points

- Where the map from a kind to its channel lives. ahpw keeps it by kind name today, in `linkOf`. Under "clients draw only what the host sends", the host would send it with the plugin's contracts instead.
- Whether `closers` shows as *Internal*, or the page hides it.
- The tunnel row and its `+` need a tunnels page in ahpw first. That page is a change of its own.
- Whether an agent's `engine` is the name that `agents` lists in the contracts. This is not checked yet.
