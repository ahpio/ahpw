---
title: A session acts from its menu
domain: sessions
status: active
priority: medium
created: 2026-11-12
revalidated: 2026-11-12
refs:
  - git://e7bd0e4 - the last commit that holds the whole brief `a-session-shows-its-summary-and-acts-from-its-menu.md`; the brief keeps only the timeline after this plan
  - git://58c7521 - the commit of ahpw this plan was checked at
  - "[code://src/resources/sessions/Explorer.tsx#L38-L69](../../../../src/resources/sessions/Explorer.tsx#L38-L69) - `menuOf`, the session list's acts: pin, rename, mark read, archive, copy link and delete"
  - "[code://src/resources/sessions/SessionHeader.tsx#L119-L126](../../../../src/resources/sessions/SessionHeader.tsx#L119-L126) - `viewMenu`, the header's `...` menu: *Views* and *Display*"
  - "[code://src/resources/sessions/Page.tsx#L410-L414](../../../../src/resources/sessions/Page.tsx#L410-L414) - the open session marks itself read each time it is unread or its turns change"
  - "[code://src/resources/sessions/view-settings.ts#L16-L43](../../../../src/resources/sessions/view-settings.ts#L16-L43) - `chatChoice`, a UI choice kept in the browser: the pattern for the new setting"
  - "[code://src/shell/ui-settings/settings.ts#L56-L131](../../../../src/shell/ui-settings/settings.ts#L56-L131) - `chatSetting` and `UI_SETTINGS`, where a UI setting joins the settings window"
  - "[code://src/resources/sessions/focus.ts#L5](../../../../src/resources/sessions/focus.ts#L5) - `sessionKey`, the key of a session's tab"
  - https://github.com/softov/ahpapp/blob/623fc9a44af641eaab9cf6f5d402159b2baadadb/src/useSession.ts#L386-L409 - ahpapp marks a session read once per visit, so *Mark unread* holds
---

## Goal

An open session's `...` menu has the acts the session list's menu has, from one shared function with the same words.
A session archived while it is open closes its tab, unless the person chose to keep it open.
*Mark unread* on an open session holds until the session opens again or a turn ends.

## Reconnaissance

The files read and the patterns to reuse are the `refs` above, each with its note.

### Searches performed

- `rg -n "isArchivedChanged" src/resources/sessions` - the list's menu and the merged banner archive a session.
- `rg -n "isReadChanged" src/resources/sessions` - the list's menu and the open page mark a session read.
- `rg -n "chatSetting\(" src/shell/ui-settings` - seven UI settings use `chatChoice`, none about sessions closing.

### Runtime path

```
header ... menu -> sessionActs(host, session, ...) -> session/isReadChanged | isArchivedChanged | titleChanged | disposeSession
SessionSummary.status archived (was not) -> ui.archivedSessionOpen = close -> surfaces.close(sessionKey)
page opens | a turn ends -> session/isReadChanged { isRead: true }
```

### Gaps

- The header's menu has no session acts.
- Nothing closes an open session when it is archived.
- The page marks the session read again whenever it is unread, so *Mark unread* is undone at once.

## Answers

| What | Source | Task |
| --- | --- | --- |
| The `...` menu gets a third group after *Display*, with *Pin* or *Unpin*, *Mark read* or *Mark unread*, and *Archive* or *Unarchive* | Softov, 2026-11-12: "plan the ... menu gets a third group" | 01 |
| The group also has *Rename*, *Copy link* and *Delete* | Softov, 2026-11-12: "yes, it gets" | 01 |
| The list's menu and the header's menu make their acts from one shared function, with the same words | Softov, 2026-11-12 | 01 |
| The third group is named *Session* | (defaulted: the `groups/Session` word ahpw already has) | 01 |
| *Delete* from the header closes the session's tab once the host disposes of it | (defaulted: the page would show a gone session) | 01 |
| A session archived while it is open closes its tab | Softov, 2026-11-12: "Close." | 02 |
| A UI setting chooses close or stay, and it defaults to close | Softov, 2026-11-12: "with user ui config. default to close." | 02 |
| The setting is in the settings window only, with no command in the palette | Softov, 2026-11-12: "settings on user config. do not need settings on palette." | 02 |
| A major UI behaviour is a UI setting, with the accessible case as its default | Softov, 2026-11-12: "For major cases on ui behaviour, prefere a ui settings with default to the acesibility case." | 02 |
| A session opened from the archived list does not close | (defaulted: only a change to archived closes it) | 02 |
| The open session marks itself read once when it opens and once each time a turn ends while it is open | Softov, 2026-11-12: "once when it opens and once each time a turn ends (and its open)" | 03 |
| A *Mark unread* holds until one of those happens | Softov, 2026-11-12 | 03 |

## Proposed architecture

- **Data flow** - The acts dispatch the same session actions the list's menu dispatches today.
- **Event flow** - The page watches its summary's status; a change to archived closes its tab when the setting says close.
- **State flow** - `ui.archivedSessionOpen` is a `chatChoice` kept in the browser, with the values `close` and `stay`.
- **Layer responsibilities** - `src/resources/sessions/`: the shared acts, the header group, the close and the read marks. `src/shell/ui-settings/`: the setting's row.
- **Source-of-truth files** - [`code://src/resources/sessions/Explorer.tsx`](../../../../src/resources/sessions/Explorer.tsx), whose `menuOf` becomes the shared function

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - The header's menu has the session's acts](task-01-the-header-menu-has-the-acts.md) | implemented | - |
| [02 - An archived open session closes](task-02-an-archived-open-session-closes.md) | implemented | 01 |
| [03 - Mark unread holds](task-03-mark-unread-holds.md) | implemented | - |

## Risks and tradeoffs

- A session archived from another client also closes its open tab. That follows the answer, since the tab watches the status and not the click.
- The list's menu keeps its own order: *Open* first, *Copy link* and *Delete* under *More*. The header's group has no *Open*.

## Resume state

- **Done so far:** the three tasks are implemented, as [implemented.md](implemented.md) says.
- **Next action:** Softov reviews the PR.
- **Open questions:** none.
- **Watch out for:** a session beside another, in the right sidebar, does not mark itself read today; keep that.

## Final verification checklist

- [x] The header's `...` menu shows *Session* after *Display*, with Pin, Rename, Mark read or unread, Archive, Copy link and Delete.
- [x] The list's menu shows the same words as before.
- [x] Archiving an open session closes its tab; with the setting on *Stay*, it stays open.
- [x] A session opened from the archived list stays open.
- [x] *Mark unread* on an open session holds until a turn ends.
- [x] The setting shows in the settings window and not in the command palette.
