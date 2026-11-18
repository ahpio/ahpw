---
title: The sidebar and activity bar menus hold the layout rows
domain: shell
status: planned
priority: medium
created: 2026-11-18
revalidated: 2026-11-18
requires:
  - file:///github/scena/.project/plans/layout/20261118-0318-panes-and-the-rail-have-menus/plan.md
changes: []
creates: []
refs:
  - git://db2e322 - the commit of this repository the plan was checked at
  - "[code://src/shell/commands.ts#L7-L10](../../../../src/shell/commands.ts#L7-L10) - `toggle`, which shows or hides a surface"
  - "[code://src/shell/commands.ts#L87-L112](../../../../src/shell/commands.ts#L87-L112) - `sidebar.toggleLeft` and `view.toggleActivityBar`, the sibling commands"
  - "[code://src/shell/register-shell.tsx#L245-L325](../../../../src/shell/register-shell.tsx#L245-L325) - the activity item mounts, with `manage:nav` last"
  - "[code://src/i18n/en.json#L33-L42](../../../../src/i18n/en.json#L33-L42) - the `shell/commands` strings"
  - "[code://src/shell/layout-menu.ts#L30-L36](../../../../src/shell/layout-menu.ts#L30-L36) - the layout menu, which keeps every zone toggle"
---

## Goal

The menus that scena adds to the stack background and the activity bar get ahpw's layout rows.
A person hides the left sidebar or the activity bar from the menu of the place they right-clicked.
The Manage gear stays in the activity bar, so the layout menu and the settings are always reachable.

## Reconnaissance

The files read and the patterns to reuse are the `refs` in the frontmatter, each with its note.

### Searches performed

- `rg -n "slots:" src/shell/commands.ts` - every shell command is in the palette slot only.
- `rg -n "surface:context|rail:context|pane:context" src` - no ahpw command fills a context slot of a surface.

### Runtime path

```
right-click -> scena menu with ticks -> slot query -> ahpw hide command (when) -> layout.setSurface visible false
```

### Gaps

- `Not found: a command that only hides a surface - searched hide in src/shell/commands.ts.`

## Answers

| What | Source | Task |
| --- | --- | --- |
| No entry moves a sidebar or the activity bar | Softov, 2026-11-18: chose "Leave them out" | 01 |
| `sidebar.hideLeft` and `view.hideActivityBar` are new commands; the menus show "Hide", not "Toggle" | (defaulted: a menu opened from a shown surface only hides it; VS Code says "Hide Primary Side Bar") | 01 |
| The stack background menu holds "Hide left sidebar" | (defaulted: `surface:context` with `$/surface/name == "sidebar:left"`) | 01 |
| The activity bar menu holds "Hide left sidebar" while it shows, and "Hide activity bar" | (defaulted: the rows of VS Code's activity bar menu that ahpw can do) | 01 |
| `manage:nav` mounts with `hideable: false` | (defaulted: it holds the layout menu, the way back to a hidden zone) | 01 |
| The strings are in English, Spanish and Portuguese | [code://src/i18n/locales.ts](../../../../src/i18n/locales.ts) | 01 |

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - The menus hold the hide rows](task-01-the-menus-hold-the-hide-rows.md) | todo | - |

## Risks and tradeoffs

- A hidden activity bar takes its menu with it. The layout menu in the title bar and `Ctrl+Shift+P` bring it back.
- This plan waits for a scena release with the slots. Until then, it builds against a local scena checkout with `AHPW_SCENA`.

## Resume state

- **Done so far:** nothing.
- **Next action:** wait for the scena plan, then [task-01-the-menus-hold-the-hide-rows.md](task-01-the-menus-hold-the-hide-rows.md).
- **Open questions:** none.
- **Watch out for:** a hidden activity item stays hidden after a reload, by design; a test of the rail must clear `rail.hidden` first.

## Final verification checklist

- [ ] `pnpm typecheck` and `pnpm test` pass.
- [ ] In the Explorer, a background right-click shows the pane ticks, "Close all" and "Hide left sidebar".
- [ ] An activity bar right-click lists every item but Manage, then the two hide rows.
- [ ] At 1400 px and on an xsmall viewport, the menus open and a hidden item stays out of the activity bar.
