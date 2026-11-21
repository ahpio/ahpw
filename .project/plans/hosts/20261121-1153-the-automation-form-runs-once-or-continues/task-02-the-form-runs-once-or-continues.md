---
title: The form runs once or continues
status: implemented
depends: [01]
layer: "automations"
refs:
  - "[code://src/resources/automations/Edit.tsx](../../../../src/resources/automations/Edit.tsx) - the form"
  - "[code://src/resources/automations/words.ts](../../../../src/resources/automations/words.ts) - the draft"
  - "[code://src/resources/automations/Page.tsx](../../../../src/resources/automations/Page.tsx) - the page"
---

## Objective

The form matches the mockup, and the page shows a one-time automation without failing.

## Files

- `CREATE: src/resources/automations/next.ts` - the 1.2.0 types, `oneTimeOf` and `targetOf`.
- `UPDATE: src/resources/automations/words.ts` - the draft's `once`, `runAt`, `target`, `chat` and `chatSession`, and the trigger lines.
- `UPDATE: src/resources/automations/Edit.tsx` - the one-time choice, the target section, and the read-only fieldset.
- `UPDATE: src/resources/automations/Page.tsx` - the facts of a one-time trigger and a target, and the form on every Settings tab.
- `UPDATE: src/style/app.css` - the fieldset lays out as the form did.
- `UPDATE: src/i18n/en.json` - the new strings, with `es.json` and `pt.json`.

## Steps

1. Read and write the one-time trigger and `target` in the draft.
2. Add the one-time choice and the target section, each behind its capability.
3. Lock the fields where the host refuses `update`, with the note.
4. Read a one-time trigger apart from an event trigger on the page.
5. Compare each state with the mockup on a test daemon.

## Validation

- `src/resources/automations/words.test.ts` - the one-time draft, the targets, and the problems.
- The ahpw suite passes.

## Resume

Built on 2026-11-21. The first screenshots on the test daemon at `f96846aca` showed the page failing for a one-time automation, in `scheduleFacts`, which read its `events`. The page now reads one-time triggers on their own. The Settings tab used to hide the form without `update`, where the mockup shows it read-only, so it now shows the form always.
