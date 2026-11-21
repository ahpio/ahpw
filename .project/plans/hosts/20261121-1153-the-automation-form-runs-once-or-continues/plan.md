---
title: The automation form runs once or continues
domain: hosts
status: built
priority: medium
created: 2026-11-21
revalidated: 2026-11-21
refs:
  - git://7f8d193 - main when the plan was made
  - "[code://src/resources/automations/Edit.tsx](../../../../src/resources/automations/Edit.tsx) - the automation form"
  - "[code://src/resources/automations/words.ts](../../../../src/resources/automations/words.ts) - `draftOf` and `definitionOf`"
  - "[code://src/resources/automations/Page.tsx](../../../../src/resources/automations/Page.tsx) - the automation page, its facts and its Settings tab"
  - git://github.com/ahpio/ahpd@ecb35ae66 - ahpd #404 and #406, which serve the one-time trigger and `target`
  - git://github.com/microsoft/agent-host-protocol@e36b0a20 - `AutomationOneTimeTrigger`, `AutomationTarget` and their capabilities
---

## Goal

A person can make an automation that runs once at a set time. They can choose where each run goes: a new session, the session of the last run, or one chat. The form shows each choice only where the host offers it, and an automation the host no longer lets change is shown read-only.

## Reconnaissance

The files read and the patterns to reuse are the `refs` in the frontmatter, each with its note.

### Gaps

- The form edits schedule triggers only, and writes no `target`.
- The page reads every trigger that is not a schedule as an event trigger, so a one-time automation fails the page with `Cannot read properties of undefined (reading 'length')`.
- The Settings tab hides the form when the host refuses `update`.

## Answers

| What | Source | Task |
| --- | --- | --- |
| Draw a mockup first, then build | Softov, 2026-11-21, chose "Mockup, then plan and build" | 01, 02 |
| Build the form as the mockup draws it | Softov, 2026-11-21, chose "Build it as drawn" | 02 |
| "Once, at a set time" is a choice of Schedule, shown when the host advertises `oneTime` | Softov, 2026-11-21, the mockup | 02 |
| "Where each run goes" is shown when the host advertises `targets`, each choice where it is offered | Softov, 2026-11-21, the mockup | 02 |
| An automation without `update` shows its form read-only, with one line saying why | Softov, 2026-11-21, the mockup | 02 |
| "In a new session" writes no `target`, except over the older pinned mode | (defaulted: absent means a new session in AHP) | 02 |
| The 1.2.0 fields are a local type until ahpw moves to the 1.2.0 package | (defaulted: ahpd does the same) | 02 |

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - A mockup of the form](task-01-a-mockup-of-the-form.md) | done | - |
| [02 - The form runs once or continues](task-02-the-form-runs-once-or-continues.md) | done | 01 |

## Risks and tradeoffs

- A host on AHP 1.1.0 advertises neither field, and the form is as before.

## Resume state

- **Done so far:** both tasks. Task 02 merged in ahpw #112, and Softov closed the plan as built on 2026-11-21.
- **Next action:** none.
- **Open questions:** none.
- **Watch out for:** a one-time trigger has no `events`, so code that reads the triggers checks `oneTimeOf` first.

## Final verification checklist

- [x] The form matches the five states of the mockup, checked against a test daemon.
- [x] A test: a one-time draft writes one `oneTime` trigger and no end conditions, and reads back.
- [x] A test: each target is written, and "new session" over the pinned mode says so.
- [x] The gates pass: typecheck and the ahpw suite.
