---
title: The bot form sets every field
domain: plugins
status: draft
priority: high
created: 2026-11-25
revalidated: 2026-11-25
refs:
  - git://9ed35ca - main when the plan was made
  - "[code://src/resources/bots/Edit.tsx](../../../../src/resources/bots/Edit.tsx) - the bot form"
  - "[code://src/resources/bots/draft.ts](../../../../src/resources/bots/draft.ts) - `draftOf` and `recordBody`"
  - "[code://src/resources/bots/catalogue.ts](../../../../src/resources/bots/catalogue.ts) - `BotRecord`, which reads the old name `harness`"
  - "[code://src/resources/bots/Page.tsx](../../../../src/resources/bots/Page.tsx) - the facts of a bot"
  - "[code://src/resources/automations/session-settings.ts](../../../../src/resources/automations/session-settings.ts) - `useSessionSettings`, the models an agent offers"
  - "[code://src/resources/automations/SettingsBox.tsx](../../../../src/resources/automations/SettingsBox.tsx) - a model the agent does not offer stays and is marked"
  - "[code://src/resources/computers/machines.ts](../../../../src/resources/computers/machines.ts) - the list of computers of a host"
  - "[code://src/bridges/connectors.ts](../../../../src/bridges/connectors.ts) - the list of connectors of a host"
  - file:///github/ahpd/.project/plans/host/20261125-2148-a-default-agent-is-chosen/plan.md - the host default agent
  - file:///github/ahpd/.project/plans/bots/20261125-2148-a-bots-agent-changes-and-clears/plan.md - a blank clears a field
---

## Goal

A person can set what a bot runs on and what it can use: agent, model, computer, connectors, template, folder and owner. Today the form sets none of these but the owner, so a new bot always runs on the default of the host.

## Reconnaissance

The files read and the patterns to reuse are the `refs` in the frontmatter, each with its note.

### Gaps

- The form writes no agent, model, computer, connectors, template or folder.
- The owner list has no team or project.
- `BotRecord` reads `harness`, and the host sends `provider`, so the page shows no agent.

## Answers

| What | Source | Task |
| --- | --- | --- |
| One Agent list that writes `provider`, and a Model list. No Preset field. A change of agent clears `preset`, and a bot with a preset shows it as its agent | Softov, 2026-11-25, chose "One Agent list, plus Model" | 02 |
| A mockup before the form | (defaulted: a redesign gets one first) | 01 |
| A field shows only where the host serves its list | (defaulted: a client draws only what the host sends) | 02 |
| Template and folder show on a new bot only. The folder is read-only on an edit | (defaulted: the host keeps both) | 02 |
| An untouched field is left out of a write, and an emptied one is sent blank | (defaulted: a host before the ahpd plan keeps the value of a blank) | 02 |

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - A mockup of the form](task-01-a-mockup-of-the-form.md) | doing | - |
| [02 - The form sets every field](task-02-the-form-sets-every-field.md) | todo | 01 |

## Risks and tradeoffs

- On a host without the ahpd plan for clearing, a set agent cannot go back to the default.

## Resume state

- **Done so far:** the mockup is drawn.
- **Next action:** Softov accepts the mockup or changes it.
- **Open questions:** none but the mockup.
- **Watch out for:** nothing about a plugin or a key is written by name except the fields of a bot record.

## Final verification checklist

- [ ] Each state of the mockup matches the form on a test daemon.
- [ ] A bot that names an agent keeps it after an edit of its name.
- [ ] `pnpm typecheck` and the ahpw suite pass.
