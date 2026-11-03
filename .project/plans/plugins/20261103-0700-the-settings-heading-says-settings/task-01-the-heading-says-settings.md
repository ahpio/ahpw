---
title: The heading says Settings
status: implemented
depends: []
layer: "ahpw resources"
refs:
  - "[code://src/resources/connectors/ConnectorForm.tsx#L162-L166](../../../../src/resources/connectors/ConnectorForm.tsx#L162-L166) - the connector settings section"
  - "[code://src/resources/agents/AgentForm.tsx#L180-L183](../../../../src/resources/agents/AgentForm.tsx#L180-L183) - the agent settings section"
---

## Objective

The connector and agent settings sections show "⚙ Settings" and then the fields, with no second description.

## Files

- `UPDATE: src/resources/connectors/ConnectorForm.tsx:117` - the settings schema has no top `description`.
- `UPDATE: src/resources/connectors/ConnectorForm.tsx:162-166` - the heading is `EMOJIcon.settings` and "Settings"; the note goes.
- `UPDATE: src/resources/agents/AgentForm.tsx:144` - the settings schema has no top `description`.
- `UPDATE: src/resources/agents/AgentForm.tsx:180-183` - the heading is `EMOJIcon.settings` and "Settings"; the note goes.
- `UPDATE: src/i18n/en.json` - `settingsOf` gives way to `settings` in `connectors/form` and `agents/form`.
- `UPDATE: src/i18n/pt.json` - the same keys in Portuguese.
- `UPDATE: src/i18n/es.json` - the same keys in Spanish.

## Steps

1. Replace the `HostIcon` and `settingsOf` in both headings with `EMOJIcon.settings` and the `settings` string.
2. Remove the `web-note` description from both sections.
3. Remove the top `description` from the schema that each section gives SchemaForm.
4. Replace `settingsOf` with `settings` in the three catalogs.

## Validation

- `pnpm typecheck` passes.
- `locales.test.ts` passes.
- A Dev Tunnel connector and a Discord connector show "⚙ Settings" and no description under it.
- An agent's settings show "⚙ Settings" and no description under it.

## Resume

- `pnpm typecheck` and the vitest suite pass.
- Headless Chrome against a scratch host showed "⚙ Settings" and no second description. It checked the Dev Tunnel and Anthropic connector forms and the Claude Code agent's Settings tab.
