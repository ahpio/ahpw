---
title: Tunnels and clients in explorers
domain: hosts
status: active
priority: medium
created: 2026-11-03
revalidated: 2026-11-03
refs:
  - git://a926d56 - the commit of `main` the facts were checked at
  - git://c97d8459 - the ahpd `main` that serves both channels and `x-ahpd/invokeOperation`
  - https://github.com/softov/ahpd/blob/c97d8459/packages/sdk/src/tunnels/channel.ts - `x-ahpd-tunnels://`, its rows and the operations each kind offers
  - https://github.com/softov/ahpd/blob/c97d8459/packages/sdk/src/clients/channel.ts - `x-ahpd-clients://`, its rows, the traffic counters and `drop`
  - https://github.com/softov/ahpd/blob/c97d8459/packages/sdk/src/kinds/operations.ts - `x-ahpd/invokeOperation` and the target and input it checks
  - https://github.com/softov/ahpd/blob/c97d8459/packages/sdk/src/types/kinds.ts - `Operation`, the shape both channels list
  - "[code://src/shell/manage.ts#L21-L80](../../../../src/shell/manage.ts#L21-L80) - the Manage menu, where the two entries go"
  - "[code://src/resources/computers/index.ts](../../../../src/resources/computers/index.ts) - a sidebar section, its explorer, its page and its commands: the pattern to copy"
  - "[code://src/resources/computers/Explorer.tsx](../../../../src/resources/computers/Explorer.tsx) - an `ExplorerList` over `useChannelOnEach`, with a row menu and a row button"
  - "[code://src/resources/computers/machines.ts#L24-L44](../../../../src/resources/computers/machines.ts#L24-L44) - a reducer for a records channel's `added`, `changed` and `removed`"
  - "[code://src/resources/changes/changeset.ts#L85-L104](../../../../src/resources/changes/changeset.ts#L85-L104) - how an operation is invoked and its refusal said"
  - "[code://src/resources/changes/Forms.tsx#L17-L33](../../../../src/resources/changes/Forms.tsx#L17-L33) - an operation's form in a `Modal`"
  - "[code://src/resources/plugins/Options.tsx](../../../../src/resources/plugins/Options.tsx) - `SchemaForm` drawn from a host's JSON Schema, with secrets"
  - "[code://src/bridges/served.ts](../../../../src/bridges/served.ts) - `trackServed` and `useServingHosts`, the flag and the hosts that serve a channel"
---

## Goal

A person sees the tunnels and the clients of a host, and acts on them, from the Manage menu.
ahpd now lists both as channels, and ahpw shows neither.
After this plan, Manage has a Tunnels entry and a Clients entry.
Each opens an explorer in the left sidebar, with header actions and a context menu on each row.
A row opens a page with its details and its operations.
An operation that takes input opens its form in a dialog.

## Reconnaissance

The files read and the patterns to reuse are the `refs` in the frontmatter, each with its note.

### Searches performed

- `rg -n -i "tunnel|x-ahpd-clients" src` - ahpw has no code for either channel.
- `rg -n "invokeOperation" src` - ahpw invokes only `invokeChangesetOperation`.
- `rg -n "channels:" packages/server/src/commands/run.ts` in ahpd - both channels and `x-ahpd/invokeOperation` are in the `initialize` offers.

### Runtime path

```
Manage > Tunnels -> sidebar.activate { section: ahp:tunnels } -> TunnelExplorer
  -> useChannelOnEach(x-ahpd-tunnels://) -> { records, operations } per host
  -> row menu / page button -> confirm (when the operation has one) -> dialog (when it has input)
  -> x-ahpd/invokeOperation { channel, operationId, target?, input? } -> the channel sends the changed row
```

### Gaps

- No reducer folds a records channel together with its `operations`, and the tunnels channel's `x-ahpd-tunnels/operations` action.
- No request for `x-ahpd/invokeOperation`.
- No form draws an operation's `input` schema in a dialog.

## Answers

| What | Source | Task |
| --- | --- | --- |
| Manage opens a Tunnels explorer and a Clients explorer, with actions and a context menu | Softov, 2026-11-03: "both accesible from manage menu open a explorer with actions and context menu" | 02, 03 |
| A row click opens a page with the row's details and its operations as buttons | Softov, 2026-11-03: "Opens a page" | 02, 03 |
| An operation's input form opens in a dialog | Softov, 2026-11-03: "I prefer a floating form for the tunnel" | 02 |
| The explorers have no activity bar entry | (defaulted: the Manage menu is the entry Softov named) | 02, 03 |
| A Manage entry shows only while a host offers its channel | (defaulted: a client draws only what the host sends) | 02, 03 |
| Every operation is drawn from the channel's `operations`, with the host's label, description and confirmation | (defaulted: a client draws only what the host sends) | 01, 02, 03 |
| A `list` operation is a header action; with more than one, the header button opens their menu | (defaulted: one `+` for each tunnel kind would crowd the header) | 02 |
| A record operation applies to a row when its `kind` is the row's `kind`, or the row has no `kind` | [`code://src/resources/computers/actions.ts`](../../../../src/resources/computers/actions.ts) has no kinds; ahpd names each tunnel operation `<kind>/<name>` | 01 |
| An operation that runs on a row shows that row as busy, from the row's `operation.status` | (defaulted: the tunnels channel sends it) | 02 |
| A refusal shows the host's words in a notice | (defaulted: as computers and changes do) | 01 |
| An edit form starts from the row's settings, and a secret field starts empty and keeps the stored secret | (defaulted: ahpd keeps a secret that is sent empty) | 02 |
| The shared form, run and buttons live in `src/resources/operations/` | (defaulted: tunnels and clients both use them) | 02, 03 |
| A client row whose `clientId` is this page's own says so, and its Drop asks the host's confirmation as for any other row | (defaulted: ahpd gives no socket number to the client, so two tabs share an id) | 03 |
| Every string the client writes is in the en, es and pt catalogs | (defaulted: as every resource does) | 02, 03 |

## Proposed architecture

- **Data flow** - `src/bridges/operations.ts` holds the reducer for a records channel with `operations`, the rule that matches an operation to a row, and `invokeOperation`.
- **Event flow** - A menu item and a page button call `runOperation`. It asks the confirmation, opens the dialog for an `input`, and invokes.
- **State flow** - The channel state is the only store. The dialog holds its draft until it sends.
- **Layer responsibilities** - bridges: the reducer, the match and the request · resources/tunnels: explorer, page, dialog, commands · resources/clients: explorer, page, commands · shell: the two Manage entries.
- **Source-of-truth files** - [`code://src/shell/manage.ts`](../../../../src/shell/manage.ts)

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - The operations bridge](task-01-the-operations-bridge.md) | implemented | - |
| [02 - A tunnels explorer, page and dialog](task-02-a-tunnels-explorer-page-and-dialog.md) | implemented | 01 |
| [03 - A clients explorer and page](task-03-a-clients-explorer-and-page.md) | implemented | 01 |

## Risks and tradeoffs

- The tunnels channel lists both Enable and Disable on every row. The menu draws both, because the client does not pick operations by name.
- A person without `tunnel:read` or `client:read` sees the channel's refusal in the explorer, because the offers do not say the person's grants.
- A Drop of this page's own connection closes it. The page then connects again, as after any lost socket.

## Resume state

- **Done so far:** tasks 01, 02 and 03 are implemented. See [implemented.md](implemented.md).
- **Next action:** Softov reviews the branch, and does the checks in [tunnels-clients-checks.md](../../../pending/tunnels-clients-checks.md).
- **Open questions:** none.
- **Watch out for:** ahpd sends a tunnel operation's id as `<kind>/<name>`, and the target as `{ id }`, not a changeset's `{ kind, resource }`.

## Final verification checklist

- [ ] Against a test ahpd, Manage lists Tunnels and Clients, and each opens its explorer.
- [ ] A tunnel is created from the header's dialog, starts, and shows its URL on its row and its page.
- [ ] Edit, Disable, Enable and Remove work from the context menu and from the page; Remove asks first.
- [ ] Clients lists this page's own connection, with its traffic, and Drop on another tab's row closes that tab's socket.
- [ ] Against a host without the channels, neither Manage entry shows.
- [ ] `pnpm typecheck` and `pnpm test` pass.
