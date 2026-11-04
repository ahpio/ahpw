---
title: An automation or agent message names its sender
status: done
depends: []
layer: "sessions"
refs:
  - "[code://src/resources/sessions/origin.ts#L10-L62](../../../../src/resources/sessions/origin.ts#L10-L62) - `Source` and `askOf`"
  - "[code://src/resources/sessions/Page.tsx#L89-L98](../../../../src/resources/sessions/Page.tsx#L89-L98) - `FromChip`"
  - "[code://src/resources/sessions/Page.tsx#L261-L269](../../../../src/resources/sessions/Page.tsx#L261-L269) - `openSource`"
---

## Objective

An `automation` message and a `tool` message keep the bubble, with a chip over it.
The chip says "From an automation" or "From the parent agent", and a click opens that sender.

## Files

- `UPDATE: src/resources/sessions/origin.ts:10-62` - `Source` gains the scopes `automation` and `agent`; `askOf` reads the chat and session origins.
- `UPDATE: src/resources/sessions/origin.test.ts` - cases for both origins, with and without a named source.
- `UPDATE: src/resources/sessions/Page.tsx:89-98` - `FromChip` draws the two new labels, and a plain chip when nothing can open.
- `UPDATE: src/resources/sessions/Page.tsx:261-269` - `openSource` opens the parent chat or the automation.
- `UPDATE: src/i18n/en.json` - `sessions.turn.fromAutomation`, `fromAgent`, `openAutomation` and `openParent`.
- `UPDATE: src/i18n/es.json` - the same keys.
- `UPDATE: src/i18n/pt.json` - the same keys.

## Steps

1. Add the scopes `automation` and `agent` to `Source`, and an optional `automation` URI.
2. Give `askOf` a third argument with the chat's origin and the session's origin.
3. For origin `tool`, return a bubble whose source is the parent chat that the chat's origin names.
4. For origin `automation`, return a bubble whose source is the automation that the session's origin names.
5. Return the scope without a target when the host named no chat or automation.
6. Keep the delegation entry first, so a delegated message keeps its chip.
7. Pass the picked chat's summary origin and the session summary origin from `SessionView` to `TurnView`.
8. Make `FromChip` draw the label for each scope, and a plain chip when the source has no target.
9. Make `openSource` pick the parent chat, or run `ahp.openAutomation` with the automation URI.
10. Add the four strings to the en, es and pt catalogs.

## Validation

- `src/resources/sessions/origin.test.ts` holds a case for each origin, with and without its source.
- `pnpm typecheck` (tsc -b), `pnpm test` and `pnpm build` pass.
- Open a subagent chat on a live host, and check its first message for the "From the parent agent" chip.
- Click the chip, and check that the parent chat opens.

## Resume

