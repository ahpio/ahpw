---
title: The form sets every field
status: todo
depends:
  - task-01-a-mockup-of-the-form.md
layer: "bots"
refs:
  - "[code://src/resources/bots/Edit.tsx](../../../../src/resources/bots/Edit.tsx) - the form"
  - "[code://src/resources/automations/session-settings.ts](../../../../src/resources/automations/session-settings.ts) - the models of an agent"
---

## Objective

The bot form sets each field as the mockup draws it, and the bot page shows the agent.

## Files

- `UPDATE: src/resources/bots/catalogue.ts` - `provider` in place of `harness`, `connectors`, `state`, and the fields a write takes.
- `UPDATE: src/resources/bots/draft.ts` - the new fields in `draftOf` and `recordBody`.
- `UPDATE: src/resources/bots/Edit.tsx` - the fields.
- `UPDATE: src/resources/bots/Page.tsx` - the facts read `preset`, else `provider`.
- `UPDATE: src/resources/bots/catalogue.test.ts` - the cases.
- `UPDATE: src/resources/bots/draft.test.ts` - the cases.
- `UPDATE: src/i18n/en.json` - the words, with `es.json` and `pt.json`.

## Steps

1. Extend the record and the draft with the fields.
2. List the agents of the host without `bot-chat`, and the models with `useSessionSettings`.
3. Clear the model and the preset when the agent changes.
4. Keep and mark an agent or a model that the host does not list.
5. Read the computers and the connectors from their channels, where the host serves them.
6. Add the teams and projects of the person to the owner list of a new bot.
7. Send only the fields that changed on an edit.
8. Compare each screen with the mockup before the report.

## Validation

- `draft.test.ts`: each field is written and read back, an untouched one is absent, and an emptied one is blank.
- `pnpm typecheck` and the ahpw suite pass.
- By hand on a test daemon: the five states, at two sizes.

## Resume
