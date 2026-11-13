---
title: The computer form follows the forms pattern
created: 2026-11-12
refs:
  - git://83ec677 - the commit of ahpw the facts were checked at
  - "[code://src/resources/computers/New.tsx#L27-L34](../../src/resources/computers/New.tsx#L27-L34) - the computer form's schema: host, name, then the manifest's fields"
  - "[code://src/resources/computers/New.tsx#L72-L78](../../src/resources/computers/New.tsx#L72-L78) - the `SchemaForm` with no `views` and no `jsonEditor`"
  - "[code://src/resources/editor/yamlView.tsx#L58-L61](../../src/resources/editor/yamlView.tsx#L58-L61) - `SETTINGS_VIEWS`: fields, json and yaml"
  - "[code://src/resources/connectors/ConnectorForm.tsx#L165](../../src/resources/connectors/ConnectorForm.tsx#L165) - the connector form, which follows the pattern"
  - "[code://src/resources/agents/AgentForm.tsx#L182](../../src/resources/agents/AgentForm.tsx#L182) - the agent form, which follows the pattern"
  - npm://@softov/scena@0.6.2 - `SchemaForm` offers fields and json when it is given no views
---

# The computer form follows the forms pattern

Softov wants the New computer form to follow the pattern of the other forms, Fields, JSON and YAML, for 0.16.

## What ahpw has today

- The connector form and the agent form give `SchemaForm` the views `SETTINGS_VIEWS`, `jsonEditor={JsonCodeEditor}`, a `baseline` and `fieldActions`. See [`code://src/resources/connectors/ConnectorForm.tsx`](../../src/resources/connectors/ConnectorForm.tsx#L165) and [`code://src/resources/agents/AgentForm.tsx`](../../src/resources/agents/AgentForm.tsx#L182).
- `SETTINGS_VIEWS` is fields, json and yaml. See [`code://src/resources/editor/yamlView.tsx`](../../src/resources/editor/yamlView.tsx#L58-L61).
- The computer form gives `SchemaForm` none of them, so scena offers fields and json only, with a plain text box for JSON. See [`code://src/resources/computers/New.tsx`](../../src/resources/computers/New.tsx#L72-L78).
- The computer form puts the host and the name in the schema of the manifest's fields.
  It takes them out before it sends the body. See [`code://src/resources/computers/New.tsx`](../../src/resources/computers/New.tsx#L26-L34). The JSON and YAML views would show the host and the name with the manifest's answers.
- The connector and agent forms draw their head fields in one `SchemaForm`, and the settings in a second one with the three views.
- The computer page has no edit form. It draws `DetailList`s only.

## Who writes

No open PR or unmerged branch of ahpw touches `src/resources/computers/` at 83ec677.

## The change

- The New computer form offers Fields, JSON and YAML, with the code editor, as the connector and agent forms do.
- The host and the name are drawn apart from the manifest's fields, so JSON and YAML show only what is sent.

## Open points

- Whether the computer page gets an edit form with the same views, or the change stays on New computer.
- Whether a shared form component for a head plus settings is worth writing, since connectors, agents and computers draw the same shape.
