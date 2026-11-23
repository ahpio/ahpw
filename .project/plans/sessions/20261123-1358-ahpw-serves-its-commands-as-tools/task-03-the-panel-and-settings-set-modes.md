---
title: The Tools panel and the settings set the modes
status: todo
depends:
  - task-01-the-mark-the-modes-and-the-tools.md
layer: "resources"
refs:
  - "[code://src/resources/sessions/ToolsView.tsx#L49-L51](../../../../src/resources/sessions/ToolsView.tsx#L49-L51) - `Group`, read only today"
  - "[code://src/resources/host/sections.ts#L38-L48](../../../../src/resources/host/sections.ts#L38-L48) - the Interface tab's sections"
---

## Objective

A person sets each command's mode in the Tools panel or on the Interface tab of the settings.
Both write the same `ui.agentTools.` setting.

## Files

- `UPDATE: src/resources/sessions/ToolsView.tsx` - a group for this browser that lists every marked command with its mode.
- `UPDATE: src/resources/sessions/tooling.css` - the mode control in a row.
- `UPDATE: src/resources/host/sections.ts:38-48` - an `agentTools` section with the generated keys.
- `UPDATE: src/i18n/en.json` - the group, the section and the three modes.
- `UPDATE: src/i18n/es.json` - the same keys.
- `UPDATE: src/i18n/pt.json` - the same keys.

## Steps

1. Make a mockup of the Tools panel group, and get Softov's approval before you build it.
2. Add the group for this browser at the top of the Tools panel, with a mode control on each row.
3. Add the `agentTools` section to the Interface tab.
4. Add the i18n keys in the three files.
5. Compare the panel with the mockup at two widths.

## Validation

- A mode set in the panel shows on the Interface tab, and the opposite.
- Every row starts at off.
- The i18n test passes with the same keys in the three files.
- `pnpm typecheck` and `pnpm test` pass.

## Resume
