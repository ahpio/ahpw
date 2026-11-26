---
title: The bot form sets every field - implemented
date: 2026-11-25
refs:
  - git://e9898ff - main the form was built on
  - "[code://src/resources/bots/BotFields.tsx#L52-L166](../../../../src/resources/bots/BotFields.tsx#L52-L166) - the Runs on and Can use sections"
  - "[code://src/resources/bots/draft.ts#L90-L151](../../../../src/resources/bots/draft.ts#L90-L151) - the agent change, the connectors and the write body"
---

The bot form sets what a bot runs on and what it can use.
A new bot picks its agent, model, computer, folder, connectors and template, and its owner can be a team or a project of the person.
An edit changes the agent, model, computer and connectors, and shows the owner and the folder read-only.
An agent or a model that the host no longer lists stays in the form, marked as not available, until a person picks another.
The bot page names the bot's agent.

## What was built

- [`code://src/resources/bots/BotFields.tsx#L52-L166`](../../../../src/resources/bots/BotFields.tsx#L52-L166) - the Agent and Model lists, Computer, Folder, Connectors and Template. Each list shows only where the host serves it.
- [`code://src/resources/bots/draft.ts#L90-L151`](../../../../src/resources/bots/draft.ts#L90-L151) - `withAgent`, `connectorMap`, `freeAlias`, `connectorsValid` and `recordBody`, which sends only the fields an edit changed.
- [`code://src/resources/bots/Edit.tsx#L33-L56`](../../../../src/resources/bots/Edit.tsx#L33-L56) - the owner choices with teams and projects, the owner label, and the folder a new bot gets.
- [`code://src/resources/bots/catalogue.ts`](../../../../src/resources/bots/catalogue.ts) - `provider` in place of `harness`, `connectors` and `state` on the record, and the fields a write takes.
- [`code://src/resources/bots/Page.tsx`](../../../../src/resources/bots/Page.tsx) - the agent fact reads `preset`, else `provider`, by its display name.
- [`code://src/resources/bots/fields.css`](../../../../src/resources/bots/fields.css) - the connector row.

## Verified

- `draft.test.ts`: 5 new cases, and the bot folder runs 34 of 34.
- `pnpm typecheck` passes, and the ahpw suite runs 1148 of 1148.
- By hand on a test daemon from ahpd main, at 1280 and 760, in light and dark. The states were a new bot, an edit, a missing agent, and a host with no computers.
- The agent list has no `bot-chat`, and its first choice names the host's default agent.
- By hand: an edit from Claude and Sonnet to the host default writes no `provider` or `model`, and keeps the connectors.

## Departures from the plan

- The connectors field also hides when the host lists no connector and the bot names none, as state 5 of the mockup draws it.
- The folder of a new bot shows, as a hint, the folder beside the host's other bots. A host that has no bot shows no hint.

## Left for later

- The agent list shows a native list, so state 2 of the mockup was read from its options, not from a picture.
