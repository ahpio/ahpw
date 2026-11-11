---
title: A tunnels explorer, page and dialog
status: implemented
depends: [task-01-the-operations-bridge.md]
layer: "resources/tunnels, shell"
refs:
  - "[code://src/resources/computers/index.ts](../../../../src/resources/computers/index.ts) - the section, explorer, page and commands to copy"
  - "[code://src/resources/computers/Explorer.tsx](../../../../src/resources/computers/Explorer.tsx) - the list over every serving host"
  - "[code://src/resources/computers/Page.tsx](../../../../src/resources/computers/Page.tsx) - a record's page"
  - "[code://src/resources/changes/Forms.tsx#L17-L33](../../../../src/resources/changes/Forms.tsx#L17-L33) - an operation's form in a `Modal`"
  - "[code://src/resources/plugins/Options.tsx](../../../../src/resources/plugins/Options.tsx) - `SchemaForm` with secrets"
  - "[code://src/shell/manage.ts#L21-L80](../../../../src/shell/manage.ts#L21-L80) - the Manage entries"
  - https://github.com/ahpio/ahpd/blob/c97d8459/packages/sdk/src/tunnels/channel.ts - the row's fields and the operations of each kind
---

## Objective

Manage > Tunnels opens a sidebar explorer of every serving host's tunnels.
A row has a context menu, a page, and a dialog for each operation that takes input.

## Files

- `CREATE: src/resources/tunnels/index.ts` - the section, the explorer and page components, and the commands `ahp.showTunnels`, `ahp.openTunnel`, `tunnels.reload` and `tunnels.new`.
- `CREATE: src/resources/tunnels/state.ts` - `ACTIVE_TUNNEL`, `TUNNELS_SERVED` and the open dialog.
- `CREATE: src/resources/tunnels/Explorer.tsx` - the list, with the status dot, the URL or the error, and a row menu from `rowOperations`.
- `CREATE: src/resources/tunnels/Page.tsx` - the row's status, URL, kind, error and settings, and its operations as buttons.
- `CREATE: src/resources/tunnels/OperationDialog.tsx` - a `Modal` with a `SchemaForm` drawn from the operation's `input`.
- `CREATE: src/resources/tunnels/actions.ts` - `runOperation`, which asks, opens the dialog when there is input, and invokes.
- `UPDATE: src/shell/manage.ts:61-80` - a Tunnels entry after Host, shown while `TUNNELS_SERVED` is true.
- `UPDATE: src/shell/register-shell.tsx` - call `registerTunnels`.
- `UPDATE: src/resources/emojis.ts` - a tunnel glyph.
- `UPDATE: src/i18n/en.json` - the `tunnels` strings.
- `UPDATE: src/i18n/es.json` - the `tunnels` strings.
- `UPDATE: src/i18n/pt.json` - the `tunnels` strings.

## Steps

1. Register the section `ahp:tunnels` and mount `TunnelExplorer` in `sidebar:left` while it is the section, as computers does.
2. Keep `TUNNELS_SERVED` with `trackServed(scena, 'x-ahpd-tunnels', ...)`.
3. Add the Manage entry `ahp.manage.tunnels`, which runs `sidebar.activate` with the section.
4. Draw each row with the record's id as the title, and its kind, URL or error as the line.
5. Map `running` to `ok`, `error` to `failed`, and `stopped` to `off` for the dot.
6. Draw a row as busy while its `operation.status` is `running`.
7. Build the row menu from `rowOperations`, with Open first, then Copy URL when the row has one.
8. Put the header actions as computers does: `+` for the list operations, Reload, and the host filter.
9. Run the only list operation from `+`, or open a menu of every list operation when there are several.
10. Open `TunnelPage` on a row click, with the same operations as buttons.
11. Open `OperationDialog` for an operation with `input`, and fill an update's form from the row's settings.
12. Start each secret field empty, and send it as `""` to keep it, with `configForPut`.
13. Close the dialog on success, and keep it open with the host's words on a refusal.

## Validation

- An `arrange` or row test, as computers has, for the dot and the line of each status.
- `pnpm typecheck` and `pnpm test` pass.
- By hand, against a test ahpd: create, edit, disable, enable and remove a tunnel from the menu and the page.

## Resume

Implemented on 2026-11-03. The dialog, `runOperation` and the page buttons went to `src/resources/operations/`, because clients use them too. See [implemented.md](implemented.md).

