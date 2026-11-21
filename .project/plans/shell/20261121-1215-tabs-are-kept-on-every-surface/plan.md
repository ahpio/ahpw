---
title: Tabs are kept on every surface, and a window works
domain: shell
status: active
priority: medium
created: 2026-11-21
revalidated: 2026-11-21
requires: []
changes: []
creates: []
refs:
  - git://4da31ba - the commit of ahpw this plan was checked at, before the move to scena 0.8.0
  - https://github.com/ahpio/ahpw/pull/114 - the move to `@softov/scena` 0.8.0, which this plan needs
  - "[code://src/shell/tabs.ts#L10-L42](../../../../src/shell/tabs.ts#L10-L42) - `keepTabs` keeps and reopens the tabs of `main` only, and keeps a title by hand"
  - "[code://src/shell/view/keys.ts#L20-L37](../../../../src/shell/view/keys.ts#L20-L37) - keys are listened for on the main `window` only"
  - "[code://src/resources/sessions/Page.tsx#L260-L285](../../../../src/resources/sessions/Page.tsx#L260-L285) - `SessionPage` takes `beside` as a prop, set once when it opens"
  - "[code://src/resources/sessions/index.ts#L280-L290](../../../../src/resources/sessions/index.ts#L280-L290) - `ahp.openSession` opens a session in the right sidebar with `beside: true`"
  - "[code://src/App.tsx#L104](../../../../src/App.tsx#L104) - `DefaultShell`, which renders `SurfaceWindows` in scena 0.8.0"
  - "[code://.project/briefs/items-are-placed-and-moved-between-surfaces.md](../../../briefs/items-are-placed-and-moved-between-surfaces.md) - Softov chose on 2026-11-19 that the sessions on the right sidebar are kept, as the tabs of `main` are"
  - "[code://.project/plans/sessions/20261029-2256-a-bot-chat-beside-the-session/deferred.md](../../sessions/20261029-2256-a-bot-chat-beside-the-session/deferred.md) - waited on the scena drag, which 0.8.0 has"
  - npm://@softov/scena@^0.8.0 - window surfaces, `isWindowSurface`, `scena:window:opened`, and a snapshot that keeps props
---

## Goal

With scena 0.8.0, a person drags a tab to the right sidebar or out into a window of its own.
After a reload, those tabs come back where they were, as the tabs of `main` do.
Keys work in a window as in the page.
A session page knows whether it is beside the focused session from where its tab is, not from how it opened.

## Reconnaissance

The files read and the patterns to reuse are the `refs` in the frontmatter, each with its note.

### Searches performed

- `rg -n "surface === 'main'|listAt\('main'\)" src/shell/tabs.ts` - `keepTabs` keeps and reopens `main` only.
- `rg -n "addEventListener\('keydown'" src/shell/view/keys.ts` - one listener, on the main `window`.
- `rg -n "beside" src/resources/sessions` - `beside` comes from the resource, set by `ahp.openSession`.

### Runtime path

```
reload -> layout loads window:<n> -> SurfaceWindows opens the window -> keepTabs reopens main, sidebar:right and window:<n> tabs
scena:window:opened -> keys.ts listens on that window
a session tab moves -> SessionPage reads its surface -> beside = surface is sidebar:right
```

### Gaps

- `keepTabs` drops the tabs of the right sidebar and of a window.
- A window gets no keys.
- A session tab dragged to the right sidebar keeps `beside: false`, and one dragged out of it keeps `beside: true`.

## Answers

| What | Source | Task |
| --- | --- | --- |
| The tabs of `main`, the right sidebar and each window are kept and reopened | Softov, 2026-11-19, in the `items` brief: "The sessions opened on the right sidebar are kept, as the tabs of main are"; windows as Softov asked for them, 2026-11-21 | 01 |
| A kept tab's title comes from scena's snapshot, and `KeptMount.title` goes | (defaulted: scena 0.8.0 keeps props in the snapshot) | 01 |
| The right sidebar's fixed panes are not kept | Softov, 2026-11-19, in the `items` brief | 01 |
| Keys are listened for in each window, from `scena:window:opened` to `scena:window:closed` | (defaulted: scena's docs say an app adds its listener there) | 02 |
| `beside` is true while the session's tab is on the right sidebar, and false on `main` or in a window | (defaulted: `beside` means drawn beside the focused session, which only the right sidebar does) | 03 |
| The bot chat deferral closes, and the `items` brief drops what scena built | (defaulted: the deferral waited on the scena drag) | 04 |

## Proposed architecture

- **Data flow** - `keepTabs` saves the mounts of `main`, `sidebar:right` and each window surface, and reopens each on its surface.
- **Event flow** - `keys.ts` adds and removes its listener on `scena:window:opened` and `scena:window:closed`.
- **State flow** - `SessionPage` reads the surface its mount is on, and derives `beside` from it.
- **Layer responsibilities** - shell: `tabs.ts`, `keys.ts` · sessions: `Page.tsx`.
- **Source-of-truth files** - [`code://src/shell/tabs.ts`](../../../../src/shell/tabs.ts).

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - tabs are kept on every surface](task-01-tabs-are-kept-on-every-surface.md) | done | - |
| [02 - keys reach a window](task-02-keys-reach-a-window.md) | doing | - |
| [03 - beside follows the tab](task-03-beside-follows-the-tab.md) | todo | - |
| [04 - the records follow the drag](task-04-the-records-follow-the-drag.md) | todo | 01, 03 |

## Risks and tradeoffs

- The right sidebar holds fixed panes that the shell mounts - `keepTabs` keeps only the mounts it did not mount itself, by their component.
- A window that the browser blocks after a reload waits in scena's notice - its tabs are reopened all the same, on the window surface.

## Resume state

- **Done so far:** task 01 done 2026-11-21. Task 02 started 2026-11-21.
- **Next action:** [task-02-keys-reach-a-window.md](task-02-keys-reach-a-window.md).
- **Open questions:** none.
- **Watch out for:** the right sidebar's fixed panes are mounts too; keeping them would mount them twice.

## Final verification checklist

- [ ] `tsc -b`, the tests and the build pass.
- [ ] A session dragged to the right sidebar, and one dragged out into a window, come back there after a reload.
- [ ] A key binding works in a window.
- [ ] A session dragged to the right sidebar draws beside the focused session; dragged back to `main`, it is the focused session again.
