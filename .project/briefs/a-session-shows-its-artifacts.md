---
title: A session shows its artifacts
created: 2026-11-06
refs:
  - git://625acdc - the commit of this repository the facts were checked at
  - https://github.com/ahpio/ahpw/pull/78 - the Artifacts and References pills, built
  - "[code://src/resources/sessions/artifact-list.ts](../../src/resources/sessions/artifact-list.ts) - `artifactPills`, which splits the entries between the pills"
  - https://github.com/microsoft/vscode/blob/e2be4bf6c1991595b18f236b41778acec837afbd/src/vs/workbench/contrib/chat/browser/agentSessions/agentHost/agentHostSessionInputPills.ts#L150-L178 - how VS Code splits the entries into the pull request, issue, artifact and reference pills
  - https://github.com/microsoft/vscode/blob/e2be4bf6c1991595b18f236b41778acec837afbd/src/vs/sessions/SESSIONS.md#L173-L179 - the contract: one list told apart by `isArtifact`
---

# A session shows its artifacts

Softov wants ahpw to show the artifacts of a session.
The Artifacts and References pills are built in [#78](https://github.com/ahpio/ahpw/pull/78).
They open `/session.artifacts` and `/session.references` in the composer's picker.
What this brief still holds is what VS Code does and ahpw does not.

## What others do

- VS Code gives a GitHub issue that is an artifact its own *Issues* pill, with its live state from GitHub.
- VS Code shows only the *Artifacts* pill in a subagent's chat. A chat's input shows its own entries and the entries with no chat.

## What ahpw has today

- A GitHub issue stays in the *Artifacts* list, under *Issues*. See [`artifactPills`](../../src/resources/sessions/artifact-list.ts).
- Each chat of a session shows the whole session's list. ahpd sends no `chat` on an entry.

## The change

- A GitHub issue that is an artifact gets its own pill, as a pull request has one.
- A subagent's chat shows only the *Artifacts* pill.

## Open points

- The issue pill needs the issue's state. ahpd sends no state for an issue.
- A chat's own entries need the `chat` of each entry. ahpd does not send it.
