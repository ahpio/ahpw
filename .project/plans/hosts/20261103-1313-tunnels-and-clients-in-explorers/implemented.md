---
title: Tunnels and clients in explorers - implemented
date: 2026-11-03
refs:
  - "[code://src/bridges/operations.ts](../../../../src/bridges/operations.ts)"
  - "[code://src/resources/operations/run.ts](../../../../src/resources/operations/run.ts)"
  - "[code://src/resources/tunnels/index.ts](../../../../src/resources/tunnels/index.ts)"
  - "[code://src/resources/clients/index.ts](../../../../src/resources/clients/index.ts)"
---

Manage lists Tunnels and Clients while a host serves their channels. Each opens a sidebar explorer with a context menu, a page for each row, and the host's operations. An operation with input opens its form in a dialog.

## What was built

- [`code://src/bridges/operations.ts`](../../../../src/bridges/operations.ts) - `operationsReducer`, `listOperations`, `rowOperations`, `invokeParams`, `invokeOperation`, `askFirst` and `sayRefused`. The reducer reuses `recordsReducer` from `bridges/people.ts`.
- [`code://src/resources/operations/run.ts`](../../../../src/resources/operations/run.ts) - `runOperation`, `operationItems`, `listChoices` and the dialog's overlay mount.
- [`code://src/resources/operations/Dialog.tsx`](../../../../src/resources/operations/Dialog.tsx) - the dialog. It draws `SchemaForm` from the operation's `input`, starts from the row's settings, and reuses `adapterSchema`, `configForForm` and `configForPut` for secrets.
- [`code://src/resources/operations/Buttons.tsx`](../../../../src/resources/operations/Buttons.tsx) - a page's operation buttons, and a danger zone for each operation that asks first.
- [`code://src/resources/tunnels/`](../../../../src/resources/tunnels/index.ts) - the explorer, the page, the facts of a row, and the commands `ahp.showTunnels`, `ahp.openTunnel`, `tunnels.new` and `tunnels.reload`.
- [`code://src/resources/clients/`](../../../../src/resources/clients/index.ts) - the explorer, the page, the facts and traffic of a row, and the commands `ahp.showClients`, `ahp.openClient` and `clients.reload`.
- [`code://src/shell/manage.ts`](../../../../src/shell/manage.ts) - the two Manage entries after Host.
- [`code://src/style/app.css`](../../../../src/style/app.css) - `.web-tunnel__url`. `.web-changeset-form` now fits scena's `Modal` box at 390 px; before, it was 40 px wider, and the commit form had the same fault.
- `en.json`, `es.json` and `pt.json` - `operations/*`, `tunnels/*` and `clients/*`.

## Verified

- `pnpm typecheck` and `pnpm test` passed: 134 files, 732 tests.
- `bridges/operations.test.ts`, `tunnels/tunnels.test.ts`, `clients/rows.test.ts` and `shell/manage.test.ts` cover the reducer, the match, the params, the row words and the Manage entries.
- A test ahpd at `c97d8459` ran with the devtunnel plugin, and ahpw was checked at 1280 and 390 px:
  - Manage lists both entries, and each opens its explorer.
  - A tunnel is made from the dialog, and its row shows the host's error.
  - Edit opens with the row's settings. Disable works, and Remove asks the host's question first.
- Two browser contexts: Clients marks this app's row, and Drop closes the other socket, which then connects again.
- Not verified: a tunnel that runs, with a signed-in `devtunnel` connector. That check waits in [tunnels-clients-checks.md](../../../pending/tunnels-clients-checks.md).

## Departures from the plan

- The shared UI is in `src/resources/operations/`, not in `tunnels/`, because clients use it too.
- The client's tab title is its name or id, not the socket number.
- "this app" is in the row's line, not its title, because a long client id cuts the title.

## Left for later

- scena's `Modal` does not close on Escape. The commit and pull request forms have the same gap.
- Two of ahpd's own words read oddly:
  - A kind's create has the kind's title as its label, so the dialog's button says "Dev Tunnel".
  - The remove question says "Remove this dev tunnel tunnel?".
- Every row lists Enable, Disable, Start and Stop, as the host sends them.
