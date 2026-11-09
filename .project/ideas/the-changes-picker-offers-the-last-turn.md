---
title: The changes picker offers the last turn
created: 2026-11-09
refs:
  - "[code://src/resources/changes/words.ts#L16-L26](../../src/resources/changes/words.ts#L16-L26) - `scopesOf` drops every changeset whose URI is a template"
  - file:///github/ahpd/packages/sdk/src/sessions/changes.ts - ahpd offers `turn/{turnId}`, labelled "This Turn", beside "Session Changes"
---

VS Code's Changes view offers "Last Turn" beside "Uncommitted Changes" and "Session Changes", and shows what the last turn changed.
ahpd offers it as the template `turn/{turnId}`, which a client fills from a turn it can see.
ahpw drops every template, so its picker has no turn scope.
The picker can fill the template with the session's last finished turn, and offer it as VS Code does.
Softov noticed the gap on 2026-11-09, during the checks of ahpd plan host/103.
