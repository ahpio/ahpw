---
title: The ten commands are marked
status: todo
depends:
  - task-01-the-mark-the-modes-and-the-tools.md
layer: "resources"
refs:
  - "[code://src/shell/manage.ts#L110-L133](../../../../src/shell/manage.ts#L110-L133) - the layout and theme commands, which open a menu"
  - "[code://src/shell/commands.ts#L37-L50](../../../../src/shell/commands.ts#L37-L50) - `themeList`"
  - "[code://src/shell/layout-menu.ts#L50-L80](../../../../src/shell/layout-menu.ts#L50-L80) - `layoutMenu`"
---

## Objective

The ten commands of the brief are marked as tools, each with a minimal model text and an input schema.
The layout and theme commands apply a choice when they get one.

## Files

- `UPDATE: src/resources/sessions/index.ts` - marks for `ahp.openSession` and `ahp.newSession`.
- `UPDATE: src/resources/files/index.ts` - marks for `ahp.openFile` and `ahp.openDiff`.
- `UPDATE: src/resources/terminals/index.ts` - marks for `ahp.openTerminal` and `ahp.newTerminal`.
- `UPDATE: src/resources/host/index.ts` - marks for `ahp.openSettings` and `ahp.openInterfaceSettings`.
- `UPDATE: src/shell/manage.ts:110-133` - `theme` on `ahp.manage.theme`, and `view`, `mode` or `area` on `ahp.manage.layout`, with their marks.
- `UPDATE: src/resources/agent-tools/agent-tools.test.ts` - a case per command.

## Steps

1. Mark each command beside its registration, with a model text of one short sentence.
2. Write each input schema from the command's argument type, with the fields the model can fill.
3. In `ahp.manage.theme`, apply `theme` when it is a known theme id, else open the menu.
4. In `ahp.manage.layout`, apply `view`, `mode` or `area` as the menu does, else open the menu.
5. Add a test per command: its schema passes the `check` subset, and a sample input runs.

## Validation

- `listCommands` with every mode on returns the ten commands.
- `ahp.manage.theme` with `theme: "default"` sets the theme and opens no menu.
- `ahp.manage.layout` with no argument opens the menu as today.
- `pnpm typecheck` and `pnpm test` pass.

## Resume
