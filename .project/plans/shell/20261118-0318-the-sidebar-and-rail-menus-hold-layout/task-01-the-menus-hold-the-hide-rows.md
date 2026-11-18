---
title: The menus hold the hide rows
status: todo
depends: []
layer: "shell"
refs:
  - "[code://src/shell/commands.ts#L87-L112](../../../../src/shell/commands.ts#L87-L112) - the toggle commands to copy"
  - "[code://src/shell/register-shell.tsx#L320](../../../../src/shell/register-shell.tsx#L320) - the `manage:nav` mount"
---

## Objective

The stack background menu and the activity bar menu show ahpw's hide rows.
The Manage gear has no tick and never hides.

## Files

- `UPDATE: package.json` - `@softov/scena` moves to the release with `pane:context`, `rail:context` and `rail.hidden`.
- `UPDATE: src/shell/commands.ts:87-112` - `sidebar.hideLeft` and `view.hideActivityBar`, in the context slots.
- `UPDATE: src/shell/register-shell.tsx:320` - `manage:nav` gets `hideable: false`.
- `UPDATE: src/i18n/en.json:33-42` - `hideLeft` and `hideActivityBar` strings.
- `UPDATE: src/i18n/es.json` - the same strings in Spanish.
- `UPDATE: src/i18n/pt.json` - the same strings in Portuguese.
- `UPDATE: src/shell/commands.test.ts` - tests for the two commands and their slots.

## Steps

1. Update `@softov/scena` in `package.json` to the release of the scena plan.
2. Register `sidebar.hideLeft` in `surface:context` and `rail:context`, which sets `sidebar:left` to hidden.
3. Gate `sidebar.hideLeft` with `$/layout/surfaces/sidebar:left/visible == true`.
4. Gate it in `surface:context` with `$/surface/name == "sidebar:left"` too.
5. Register `view.hideActivityBar` in `rail:context`, which sets `activitybar` to hidden.
6. Add `hideable: false` to the `manage:nav` resource.
7. Add `shell/commands/hideLeft` as "Hide left sidebar" and `shell/commands/hideActivityBar` as "Hide activity bar" in English.
8. Add the same keys in `es.json` and `pt.json`.

## Validation

- In `src/shell/commands.test.ts`, each command hides its surface and shows in its slots.
- `sidebar.hideLeft` does not show in `surface:context` for `sidebar:right`.
- `pnpm typecheck` and `pnpm test` pass.
- Check by hand the menus of *Final verification checklist* in the plan, at 1400 px and on an xsmall viewport.

## Resume

