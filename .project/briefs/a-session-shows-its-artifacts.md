---
title: A session shows its artifacts
created: 2026-11-06
refs:
  - git://6051cfb068055959eb2362166b55fb36fd1268c9 - the commit of this repository the facts were checked at
  - git://f48055f070657d1f05a465aeb3d73d36504e6e2a - the commit of ahpd the host facts were checked at
  - git://e2be4bf6c1991595b18f236b41778acec837afbd - the commit of VS Code the reference was checked at
  - "[code://src/resources/sessions/Composer.tsx#L384-L390](../../src/resources/sessions/Composer.tsx#L384-L390) - the row above the box: the folder pill, the agent pill and the shells pill, and the shells list it opens"
  - "[code://src/resources/sessions/Shells.tsx#L20-L23](../../src/resources/sessions/Shells.tsx#L20-L23) - `ShellsPill`, a pill with a count that opens a list"
  - "[code://src/resources/sessions/Shells.tsx#L102](../../src/resources/sessions/Shells.tsx#L102) - `ShellsList`, the list above the box, which calls a `vscode/` method for each row"
  - "[code://src/resources/sessions/shells.ts#L4](../../src/resources/sessions/shells.ts#L4) - `STOP_WORK`, a `vscode.` flag that ahpw reads off a row's `_meta`"
  - "[code://src/resources/sessions/SessionHeader.tsx#L86-L89](../../src/resources/sessions/SessionHeader.tsx#L86-L89) - the canvases button in the header, the other place a session's extra things show"
  - "[code://src/resources/sessions/Page.tsx#L418](../../src/resources/sessions/Page.tsx#L418) - the composer gets the session's summary, which carries its `_meta`"
  - "[code://src/resources/bots/chat/mark.ts#L29-L30](../../src/resources/bots/chat/mark.ts#L29-L30) - `botMarkOf`, a reader of one key of a session's `_meta`"
  - "[code://src/bridges/offers.ts#L20-L30](../../src/bridges/offers.ts#L20-L30) - `Offers`, all that ahpw keeps of a host's `initialize` answer `_meta`"
  - "[code://src/bridges/data.ts#L660-L663](../../src/bridges/data.ts#L660-L663) - where the `initialize` answer's `_meta` becomes `Offers`, and the rest is dropped"
  - "[code://src/resources/files/index.ts#L97](../../src/resources/files/index.ts#L97) - `ahp.openFile`, which opens a host file by its URI"
  - https://github.com/ahpio/ahpd/blob/f48055f070657d1f05a465aeb3d73d36504e6e2a/packages/sdk/src/tools/artifacts.ts#L19-L41 - `ARTIFACTS_META` and `Artifact`, one entry as ahpd keeps and sends it
  - https://github.com/ahpio/ahpd/blob/f48055f070657d1f05a465aeb3d73d36504e6e2a/packages/sdk/src/tools/artifacts.ts#L133-L148 - `recordArtifact`, which adds, promotes or keeps an entry
  - https://github.com/ahpio/ahpd/blob/f48055f070657d1f05a465aeb3d73d36504e6e2a/packages/sdk/src/host/facts.ts#L191-L196 - `setArtifacts`, which sends `session/metaChanged` and moves the summary
  - https://github.com/ahpio/ahpd/blob/f48055f070657d1f05a465aeb3d73d36504e6e2a/packages/sdk/src/host/catalogue.ts#L646 - the summary carries the session state's `_meta`
  - https://github.com/ahpio/ahpd/blob/f48055f070657d1f05a465aeb3d73d36504e6e2a/packages/sdk/src/host/vscodemethods.ts#L373-L381 - `vscode/removeSessionArtifact`, which takes `session` and `artifactId`
  - https://github.com/ahpio/ahpd/blob/f48055f070657d1f05a465aeb3d73d36504e6e2a/packages/sdk/src/host/handshake.ts#L450-L458 - the `initialize` answer's `_meta` says `vscode.removeSessionArtifact: true`
  - https://github.com/ahpio/ahpd/blob/f48055f070657d1f05a465aeb3d73d36504e6e2a/packages/sdk/src/tools/index.ts#L29-L31 - the three artifact tools go to every session
  - https://github.com/ahpio/ahpd/blob/f48055f070657d1f05a465aeb3d73d36504e6e2a/packages/sdk/src/vscoderootconfig.ts#L207-L212 - the root config key `artifactTools`, which nothing in ahpd reads
  - https://github.com/microsoft/vscode/blob/e2be4bf6c1991595b18f236b41778acec837afbd/src/vs/platform/agentHost/common/sessionArtifacts.ts#L33-L60 - `ISessionArtifact`, with the `chat` and `origin` fields that ahpd does not send
  - https://github.com/microsoft/vscode/blob/e2be4bf6c1991595b18f236b41778acec837afbd/src/vs/platform/agentHost/common/sessionArtifacts.ts#L136 - `readSessionArtifactsNewestFirst`: every surface lists the newest entry first
  - https://github.com/microsoft/vscode/blob/e2be4bf6c1991595b18f236b41778acec837afbd/src/vs/workbench/contrib/chat/common/sessionChatPills.ts#L14-L55 - the pill kinds above a chat input, with *Artifacts* and *References*
  - https://github.com/microsoft/vscode/blob/e2be4bf6c1991595b18f236b41778acec837afbd/src/vs/workbench/contrib/chat/browser/agentSessions/agentHost/agentHostSessionInputPills.ts#L89-L104 - the icon of each type, and the sections of a pill's list in order
  - https://github.com/microsoft/vscode/blob/e2be4bf6c1991595b18f236b41778acec837afbd/src/vs/workbench/contrib/chat/browser/agentSessions/agentHost/agentHostSessionInputPills.ts#L150-L178 - how the entries split into the pull request, issue, artifact and reference pills
  - https://github.com/microsoft/vscode/blob/e2be4bf6c1991595b18f236b41778acec837afbd/src/vs/workbench/contrib/chat/browser/agentSessions/agentHost/agentHostSessionInputPills.ts#L1235-L1405 - one entry: what opens, what copies, and the remove action
  - https://github.com/microsoft/vscode/blob/e2be4bf6c1991595b18f236b41778acec837afbd/src/vs/sessions/SESSIONS.md#L173-L179 - the contract: one list told apart by `isArtifact`, and removal through the provider
---

# A session shows its artifacts

Softov wants ahpw to show the artifacts of a session.
An artifact is what an agent records as worth coming back to.
It is a pull request, an issue, a commit, a website, a file or another resource.
ahpd already keeps them and sends them, under VS Code's names, and VS Code draws them above its chat input.
ahpw draws nothing of them today.

## What others do

**VS Code** keeps one list per session and splits it by `isArtifact`, as its `SESSIONS.md` says:

- An artifact is something the session made. A reference is something the session only points the person at.
- The input shows an *Artifacts* pill and a *References* pill, beside *Changes*, *Canvases*, *Subagents* and *Background Shells*.
- A pill opens a list in sections, in this order: Pull Requests, Issues, Commits, Websites, Files, Resources.
- Each section lists the newest entry first.
- Each type has an icon: a pull request, an issue, a commit, a globe for a website, a link for a resource. A file shows its file icon and its base name.
- A click on an entry opens it. A link opens outside, a file opens in the editor, and a commit with only a hash copies the hash.
- Each entry has a copy action: the URL, the file path, or the commit hash.
- Each entry has a remove action when the host's `initialize` answer says `vscode.removeSessionArtifact`. The action calls `vscode/removeSessionArtifact` with the session and the entry's `id`. It reads *Remove Artifact* or *Remove Reference*.
- A GitHub pull request or issue that is an artifact goes to its own *Pull Requests* or *Issues* pill, with its live state from GitHub. A reference stays in *References*.
- Each entry can name the `chat` that recorded it. A chat's input shows its own entries and the entries with no chat.

## What ahpw has today

- The row above the session composer's box holds the folder pill, the agent pill and the shells pill, at [`code://src/resources/sessions/Composer.tsx`](../../src/resources/sessions/Composer.tsx#L384-L390).
- [`ShellsPill`](../../src/resources/sessions/Shells.tsx#L20-L23) shows a count and opens [`ShellsList`](../../src/resources/sessions/Shells.tsx#L102) above the box. It follows VS Code's *Background Shells* pill.
- The session header shows the chat's canvases as a button with a menu, at [`code://src/resources/sessions/SessionHeader.tsx`](../../src/resources/sessions/SessionHeader.tsx#L86-L89).
- The composer gets the session's summary, at [`code://src/resources/sessions/Page.tsx`](../../src/resources/sessions/Page.tsx#L418). The summary carries the session's `_meta`.
- ahpw already reads one key of a session's `_meta`: [`botMarkOf`](../../src/resources/bots/chat/mark.ts#L29-L30).
- ahpw keeps only [`Offers`](../../src/bridges/offers.ts#L20-L30) from a host's `initialize` answer `_meta`, at [`code://src/bridges/data.ts`](../../src/bridges/data.ts#L660-L663). `vscode.removeSessionArtifact` is not kept.
- [`ahp.openFile`](../../src/resources/files/index.ts#L97) opens a host file by its URI.
- Nothing in ahpw reads `agentHost/sessionArtifacts`.

## What ahpd sends

- A session's entries are on its `_meta` under `agentHost/sessionArtifacts`, in the order recorded, oldest first.
- One entry is `{ id, type, label, isArtifact, link?, uri?, commitHash?, isGitHub? }`. `type` is `pullRequest`, `issue`, `commit`, `website`, `file` or `resource`.
- `pullRequest`, `issue`, `website` and `commit` carry a `link`, which the tool takes only as `http` or `https`. `file` and `resource` carry a `uri`. `commit` carries a `commitHash`.
- A change sends `session/metaChanged` and moves the session's summary, which carries the same `_meta`.
- `vscode/removeSessionArtifact` takes `session` and `artifactId`, and the `initialize` answer says `vscode.removeSessionArtifact: true`.
- The three artifact tools go to every session. The root config key `artifactTools` is in the schema, but nothing in ahpd reads it.
- An entry has no `chat`, so every chat of a session has the same list.
- A pull request that a change operation opens or finds again is recorded as an artifact.

## Who writes

- No pull request of ahpw is open.
- No branch that is not merged changes `Composer.tsx`, `SessionHeader.tsx`, `pills.tsx` or `offers.ts`.
- The active plans `composer/20261028-0951-the-line-above-the-new-session-box` and `composer/20261028-0951-a-custom-agent-picker` have each task `implemented`. They change the new session box, not the row above the session composer.
- No plan, brief or idea of ahpw names artifacts.

## The change

- The row above the session composer's box shows an *Artifacts* pill and a *References* pill, after the shells pill.
- A pill shows only when the session has entries of its kind, with their count.
- A pill opens its list above the box, as the shells pill does.
- The list has VS Code's sections in VS Code's order, and each section lists the newest entry first.
- An entry shows its type's icon and its label. A file shows its base name.
- A click on an entry opens it: a link in a new browser tab, and a file through `ahp.openFile`.
- Each entry has a copy button for its URL, its file path or its commit hash.
- Each entry has a remove button when the host's `initialize` answer says `vscode.removeSessionArtifact`. The button calls `vscode/removeSessionArtifact`, and the list follows the next `session/metaChanged`.
- `Offers` keeps `vscode.removeSessionArtifact`, so the composer can read it.
- ahpw reads the list from the summary's `_meta` as VS Code reads it, and leaves out a malformed entry.
- The labels are VS Code's words, in the i18n catalog.
- Nothing changes in ahpd.

## Open points

- Where the pills go. VS Code and the shells pill use the row above the box. The canvases use a button with a menu in the session header.
- Whether a GitHub issue gets its own pill, as in VS Code. A pull request has one: the pull request pill, which opens `/session.pr`.
- Whether a pull request artifact also shows in the *Artifacts* list. VS Code shows it in its own pill only.
- Whether a subagent's chat shows the list. VS Code shows only the *Artifacts* pill in a subagent's chat. ahpd sends no `chat`, so each chat would show the whole session's list.
- How a `resource` entry opens. Its `uri` can have any scheme, and `ahp.openFile` opens only a host file.
