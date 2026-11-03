---
title: The settings heading says Settings
domain: plugins
status: active
priority: medium
created: 2026-11-03
revalidated: 2026-11-03
requires: []
changes: []
creates: []
refs:
  - git://9245b40 - the commit of ahpw this plan was checked at
  - "[code://src/resources/connectors/ConnectorForm.tsx#L162-L166](../../../../src/resources/connectors/ConnectorForm.tsx#L162-L166) - the connector settings: the adapter icon, `{adapter} settings` and the description"
  - "[code://src/resources/agents/AgentForm.tsx#L180-L183](../../../../src/resources/agents/AgentForm.tsx#L180-L183) - the agent settings, drawn the same way with the engine"
  - "[code://src/resources/connectors/AdapterPicker.tsx#L11-L18](../../../../src/resources/connectors/AdapterPicker.tsx#L11-L18) - the Adapter card, which shows the icon, the title and the description"
  - "[code://src/resources/emojis.ts#L47](../../../../src/resources/emojis.ts#L47) - `EMOJIcon.settings`"
---

## Goal

The settings section of the connector and agent forms says "⚙ Settings".
The adapter or engine card above it already shows the icon, the title and the description, so the section does not show them again.

## Reconnaissance

The files read and the patterns to reuse are the `refs` in the frontmatter, each with its note.

### Searches performed

- `rg -n "settingsOf" src` - used only by `ConnectorForm.tsx` and `AgentForm.tsx`.
- `rg -n "schema.description" ../scena/packages/scena/src/ui/forms/SchemaForm.tsx` - SchemaForm draws a schema's top `description` above its fields.

### Runtime path

```
form -> Adapter card (icon, title, description) -> settings section (heading, description again, fields)
```

### Gaps

- The description shows twice: as a note when the schema has none, or as the schema's own `description` through SchemaForm.

## Answers

| What | Source | Task |
| --- | --- | --- |
| The heading is the settings icon and "Settings" | Softov, 2026-11-03: "it repeats the name and icon for settings.. do just [iconSettings] Settings" | 01 |
| The description under the heading goes, in the note and as the schema's top `description` | Softov, 2026-11-03, chose "Remove it under the heading (Recommended)" | 01 |
| The agent form changes the same way | (defaulted: the two forms share their classes and shape) | 01 |

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - The heading says Settings](task-01-the-heading-says-settings.md) | implemented | - |

## Risks and tradeoffs

- An adapter whose schema `description` says more than its card loses that text - none does today, and the card keeps the adapter's own description.

## Resume state

- **Done so far:** task 01 is implemented and waits for review.
- **Next action:** Softov reviews the diff.
- **Open questions:** none.
- **Watch out for:** the section's `aria-label` uses the same string as the heading.

## Final verification checklist

- [x] `pnpm typecheck` passes.
- [x] The vitest suite passes.
- [x] A connector's and an agent's Settings tab show "⚙ Settings" and no second description.
