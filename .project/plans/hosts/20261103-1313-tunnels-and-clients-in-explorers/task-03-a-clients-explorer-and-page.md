---
title: A clients explorer and page
status: implemented
depends: [task-01-the-operations-bridge.md]
layer: "resources/clients, shell"
refs:
  - "[code://src/resources/computers/index.ts](../../../../src/resources/computers/index.ts) - the section, explorer, page and commands to copy"
  - "[code://src/bridges/client-ids.ts](../../../../src/bridges/client-ids.ts) - this page's client id for each host"
  - "[code://src/shell/manage.ts#L21-L80](../../../../src/shell/manage.ts#L21-L80) - the Manage entries"
  - https://github.com/ahpio/ahpd/blob/c97d8459/packages/sdk/src/clients/channel.ts - the row's fields, the counters and `drop`
---

## Objective

Manage > Clients opens a sidebar explorer of the connections each serving host holds.
A row has a context menu with the host's operations, and a page with its details and traffic.

## Files

- `CREATE: src/resources/clients/index.ts` - the section, the explorer and page components, and the commands `ahp.showClients`, `ahp.openClient` and `clients.reload`.
- `CREATE: src/resources/clients/state.ts` - `ACTIVE_CLIENT` and `CLIENTS_SERVED`.
- `CREATE: src/resources/clients/Explorer.tsx` - the list, with the client's name, person and address, and a row menu from `rowOperations`.
- `CREATE: src/resources/clients/Page.tsx` - the client id, name, person, address, forwarded-for claim, protocol, locale, connected time and traffic, and the operations as buttons.
- `CREATE: src/resources/clients/rows.ts` - the row's title, line and traffic text.
- `CREATE: src/resources/clients/rows.test.ts` - the title, the line and the traffic text.
- `UPDATE: src/shell/manage.ts:61-80` - a Clients entry after Tunnels, shown while `CLIENTS_SERVED` is true.
- `UPDATE: src/shell/register-shell.tsx` - call `registerClients`.
- `UPDATE: src/resources/emojis.ts` - a client glyph.
- `UPDATE: src/i18n/en.json` - the `clients` strings.
- `UPDATE: src/i18n/es.json` - the `clients` strings.
- `UPDATE: src/i18n/pt.json` - the `clients` strings.

## Steps

1. Register the section `ahp:clients` and mount `ClientExplorer` in `sidebar:left` while it is the section.
2. Keep `CLIENTS_SERVED` with `trackServed(scena, 'x-ahpd-clients', ...)`.
3. Add the Manage entry `ahp.manage.clients`, which runs `sidebar.activate` with the section.
4. Title each row with the client's `name`, or its `clientId` when it has no name.
5. Write the line as the person, the address and the time since `connectedAt`.
6. Mark the rows whose `clientId` is this page's id for that host as this app.
7. Build the row menu from `rowOperations`, with Open first and Copy client id after.
8. Put Reload and the host filter in the header, because the channel has no list operation.
9. Open `ClientPage` on a row click, with the frames and bytes in each direction, and the operations as buttons.

## Validation

- `src/resources/clients/rows.test.ts`: a row with and without a name, a person and an address; bytes as kB and MB.
- `pnpm typecheck` and `pnpm test` pass.
- By hand, with two tabs on a test ahpd: each tab marks its own row, and Drop closes the other.

## Resume

Implemented on 2026-11-03. "this app" went to the row line, and the tab is titled by the client's name. See [implemented.md](implemented.md).

