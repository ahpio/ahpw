---
title: A session row drags to a surface or a composer
domain: sessions
status: built
priority: medium
created: 2026-11-21
revalidated: 2026-11-21
requires: []
changes: []
creates: []
refs:
  - git://4da31ba - the commit of ahpw this plan was checked at, before the move to scena 0.8.0
  - https://github.com/ahpio/ahpw/pull/114 - the move to `@softov/scena` 0.8.0, which this plan needs
  - "[code://src/shell/explorer/ExplorerList.tsx#L69-L84](../../../../src/shell/explorer/ExplorerList.tsx#L69-L84) - `ExplorerList`, whose rows take no drag"
  - "[code://src/shell/explorer/ExplorerList.tsx#L149-L150](../../../../src/shell/explorer/ExplorerList.tsx#L149-L150) - the row element"
  - "[code://src/resources/sessions/Explorer.tsx#L68-L71](../../../../src/resources/sessions/Explorer.tsx#L68-L71) - a row's click runs `ahp.openSession`"
  - "[code://src/resources/sessions/focus.ts#L5](../../../../src/resources/sessions/focus.ts#L5) - `sessionKey`, the key a row's drag carries"
  - "[code://src/resources/sessions/composer-drop.ts#L15-L70](../../../../src/resources/sessions/composer-drop.ts#L15-L70) - `useComposerDrop`: host files attach, and Shift also writes `@path`"
  - "[code://src/resources/sessions/attachments.ts#L27-L35](../../../../src/resources/sessions/attachments.ts#L27-L35) - `resourceAttachment` and `chatAttachment`"
  - "[code://src/resources/files/index.ts#L100-L112](../../../../src/resources/files/index.ts#L100-L112) - a file tab's resource: a viewer component with `host` and `uri`"
  - "[code://src/resources/sessions/Composer.tsx#L228](../../../../src/resources/sessions/Composer.tsx#L228) - where the composer takes its drop handlers"
  - "[code://.project/plans/sessions/20261028-0951-drag-a-session-into-a-tab-group/plan.md](../20261028-0951-drag-a-session-into-a-tab-group/plan.md) - the plan this one replaces: it caught the drop in ahpw, before scena had one"
  - npm://@softov/scena@^0.8.0 - `startOpenDrag` and `useDropArea`
---

## Goal

A person drags a session from the session list.
Dropped on a surface, it opens where it fell, or its tab moves there when it is open.
Dropped on a chat composer, it becomes a reference in the message, and so does a file tab.
A click on the row still opens the session where `ui.sessionOpens` says.

## Reconnaissance

The files read and the patterns to reuse are the `refs` in the frontmatter, each with its note.

### Searches performed

- `rg -n "draggable|onDragStart" src/shell/explorer` - the explorer rows take no drag.
- `rg -n "chatAttachment" src` - a session becomes a chat reference with it; the `@` menu uses it.
- `rg -n "component, host, uri" src/resources/files` - a file tab's resource names its host and its uri.

### Runtime path

```
row dragstart -> startOpenDrag({ key: session:<host>:<resource>, resource: SessionPage, title })
drop on a surface -> scena opens it there, or moves its tab
drop on a composer -> useDropArea -> a session: chatAttachment; a file tab: resourceAttachment (Shift: and @path)
```

### Gaps

- `ExplorerList` takes no drag handler.
- The composer takes no scena drag.

## Answers

| What | Source | Task |
| --- | --- | --- |
| A session row dropped on a surface opens where it fell, or moves its tab there | "Open where dropped (Recommended)", Softov, 2026-11-21 | 01 |
| The composer takes a session and a file tab; other tabs pass to the surface | "Sessions and file tabs (Recommended)", Softov, 2026-11-21 | 02 |
| A session becomes a chat reference with `chatAttachment` | (defaulted: the `@` menu attaches a session this way) | 02 |
| A file tab attaches as a host file does, and with Shift also writes `@path` | (defaulted: the same as a file from the folder explorer) | 02 |
| The composer takes only what is on its own host, and not its own session | (defaulted: a host file from another host is refused today) | 02 |
| This plan replaces `sessions/20261028-0951-drag-a-session-into-a-tab-group`, which is dropped | (defaulted: scena 0.8.0 takes the drop it caught by hand) | - |

## Proposed architecture

- **Data flow** - A row writes scena's open drag. A composer reads a `DroppedThing` and makes an attachment from its resource.
- **Event flow** - scena's drop path for a surface; `useDropArea` for a composer, which stops the event.
- **State flow** - The composer's attachments, as a host file drop adds them.
- **Layer responsibilities** - shell: `ExplorerList` takes `onRowDragStart` · sessions: the explorer starts the drag; `composer-drop.ts` takes it.
- **Source-of-truth files** - [`code://src/resources/sessions/composer-drop.ts`](../../../../src/resources/sessions/composer-drop.ts).

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - a session row drags](task-01-a-session-row-drags.md) | done | - |
| [02 - the composer takes a session or a file tab](task-02-the-composer-takes-a-tab.md) | done | 01 |

## Risks and tradeoffs

- A list of every host mixes hosts - the composer refuses a session or a file of another host, as it refuses a host file.
- The composer already takes host files and this computer's files.
  It reads the scena drag first, and a drop the drag does not hold falls to the existing code.

## Resume state

- **Done so far:** every task done 2026-11-21. [implemented.md](implemented.md) says what exists, and that the check by hand is left.
- **Next action:** the check by hand against a host.
- **Open questions:** none.
- **Watch out for:** a session's summary is needed for `chatAttachment`; read it from the host's session list in the store.

## Final verification checklist

- [x] `tsc -b`, the tests and the build pass.
- [ ] A session row opens where it is dropped on `main`, a group edge, the right sidebar and a window.
- [ ] A session row and a session tab on a composer add a chat reference; a file tab adds a file.
- [ ] A click on a row still follows `ui.sessionOpens`.
