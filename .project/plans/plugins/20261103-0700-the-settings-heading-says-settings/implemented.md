---
title: The settings heading says Settings - implemented
date: 2026-11-12
refs:
  - git://863f907
  - "[code://src/resources/connectors/ConnectorForm.tsx](../../../../src/resources/connectors/ConnectorForm.tsx)"
  - "[code://src/resources/agents/AgentForm.tsx](../../../../src/resources/agents/AgentForm.tsx)"
---

The settings section of the connector form and the agent form shows "⚙ Settings" and then the fields, with no second description.

## What was built

- [`code://src/resources/connectors/ConnectorForm.tsx`](../../../../src/resources/connectors/ConnectorForm.tsx) - the heading is the settings icon and "Settings", and the settings schema has no top `description`.
- [`code://src/resources/agents/AgentForm.tsx`](../../../../src/resources/agents/AgentForm.tsx) - the same heading and schema for the agent settings.
- [`code://src/i18n/en.json`](../../../../src/i18n/en.json) - `settings` replaces `settingsOf` in `connectors/form` and `agents/form`, with `pt` and `es`.

## Verified

- `pnpm typecheck` and the vitest suite passed at the merge in #36.
- Softov reviewed screenshots on 2026-11-12, light and dark, at 1400 and 390 px.
- The screenshots show a new and a made OpenRouter connector, and a new Claude Code agent.

## Departures from the plan

- None.

## Left for later

- None.
