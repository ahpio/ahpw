---
title: Long lines wrap
status: done
depends: []
layer: "editor"
refs:
  - "[code://src/resources/editor/CodeEditor.tsx](../../../../src/resources/editor/CodeEditor.tsx) - the editor"
  - "[code://src/resources/files/save-mode.ts](../../../../src/resources/files/save-mode.ts) - `chatChoice`, the pattern of the setting"
---

## Objective

A person turns long-line wrap on and off in any code editor.

## Files

- `CREATE: src/resources/editor/wrap.ts` - the UI setting `ui.textWrap`, off by default.
- `UPDATE: src/resources/editor/CodeEditor.tsx` - wrap in a compartment, held by the owner or by the setting; Alt+Z toggles it; a read-only editor takes focus.
- `UPDATE: src/resources/files/text.tsx` - `useWrap` and the ↵ button.
- `UPDATE: src/resources/files/FilePage.tsx` - the ↵ button and the wrap on the plain file page.
- `UPDATE: src/resources/files/SharedFilePage.tsx` - the ↵ button and the wrap on the shared file page; none where the page always wraps.
- `UPDATE: src/shell/ui-settings/settings.ts` - the setting in the UI settings.
- `UPDATE: src/i18n/en.json` - the button and the setting, and the same keys in each other catalog.

## Steps

1. Hold the wrap in a compartment of the editor, from the owner's `wrap` or the setting.
2. Toggle it with Alt+Z, and give a read-only editor a `tabindex` so the key reaches it.
3. Add ↵ to the file pages' headers, and leave it off the Markdown preview.

## Validation

- In a browser, ↵ wraps a long line and shows pressed, and Alt+Z unwraps it on a locked file.
- The Markdown view has no ↵.

## Resume

Built on 2026-11-15. Checked in a browser at 1280 wide.
