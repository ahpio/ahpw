---
title: Items are placed and moved between surfaces
created: 2026-11-19
refs:
  - git://602d21c - the commit of ahpw the drag facts were checked at again, after scena 0.8.0
  - git://f6531a866e058413bb6096d071bbfaa9141a1e21 - the commit of this repository the facts were checked at
  - git://3756caaa1ff346d60e3210bed5f5868346dd097b - the commit of scena the facts were checked at
  - "[code://src/shell/tabs.ts#L10-L44](../../src/shell/tabs.ts#L10-L44) - `keepTabs`: the main tabs are kept as scena session mounts and opened again after a reload"
  - "[code://src/App.tsx#L19-L20](../../src/App.tsx#L19-L20) - the layout state is kept in `ahpd-web.layout.v2`"
  - "[code://src/resources/sessions/index.ts#L265-L288](../../src/resources/sessions/index.ts#L265-L288) - `ahp.openSession`: one mount key per session, on `main` or the right sidebar"
  - "[code://src/shell/dock/index.ts#L14-L18](../../src/shell/dock/index.ts#L14-L18) - the dock layer is one mount on `overlay`"
  - "[code://src/shell/dock/docks.ts#L13-L20](../../src/shell/dock/docks.ts#L13-L20) - a dock is a place and a list of item keys"
  - "[code://src/shell/dock/actions.ts#L10-L38](../../src/shell/dock/actions.ts#L10-L38) - `DOCK_ACTIONS`, a closed list of two actions with no `when`"
  - "[code://src/shell/dock/DockLayer.tsx#L203-L213](../../src/shell/dock/DockLayer.tsx#L203-L213) - the dock's bots come from each shown host's bot channel"
  - "[code://src/shell/register-shell.tsx#L276-L290](../../src/shell/register-shell.tsx#L276-L290) - an activity item is a mount with a `when`, the pattern for a fixed registration"
  - "[code://src/resources/folders/drag.ts#L1-L30](../../src/resources/folders/drag.ts#L1-L30) - `HOST_FILE_TYPE`, the one drag type ahpw sets today"
  - "[code://src/resources/sessions/composer-drop.ts#L15-L62](../../src/resources/sessions/composer-drop.ts#L15-L62) - a composer takes a host file or a local file as a drop"
  - "[code://src/resources/sessions/attachments.ts#L27-L35](../../src/resources/sessions/attachments.ts#L27-L35) - `resourceAttachment` and `chatAttachment`: a file and a session as a chat reference"
  - "[code://src/resources/sessions/composer-commands.ts#L140-L150](../../src/resources/sessions/composer-commands.ts#L140-L150) - a session is attached to a chat from the composer menu, not by a drag"
  - https://github.com/softov/scena/blob/3756caaa1ff346d60e3210bed5f5868346dd097b/packages/scena/src/sdk/mount-surface.ts#L97-L107 - `MountDeclaration`: surface, key, `when`, resource, props, policy
  - https://github.com/softov/scena/blob/3756caaa1ff346d60e3210bed5f5868346dd097b/packages/scena/src/sdk/mount-surface.ts#L184 - `surfaces.move`, which nothing calls
  - https://github.com/softov/scena/blob/3756caaa1ff346d60e3210bed5f5868346dd097b/packages/scena/src/sdk/session.ts#L6-L12 - `SessionMount`: key, surface, component node, state, open time
  - https://github.com/softov/scena/blob/3756caaa1ff346d60e3210bed5f5868346dd097b/packages/scena/src/sdk/layout.ts#L91-L158 - `SurfaceLayoutState`: per surface, the tab tree, the order, the hidden keys
  - file:///github/scena/.project/plans/layout/20261121-0906-a-tab-drags-between-surfaces/plan.md - the scena plan for a tab drag that carries the mount key and the source surface
  - file:///github/scena/.project/plans/layout/20261118-0318-panes-and-the-rail-have-menus/plan.md - the menus that tick items to show or hide them
  - https://code.visualstudio.com/docs/configure/custom-layout - views move between the side bars and the panel, checked 2026-11-19
---

# Items are placed and moved between surfaces

Softov wants one kind of thing that a person can place on a surface and move to another surface.
A session is the first example.
A drop on `main` opens it as a page.
A drop on a chat makes it a reference, and a drop on a dock makes it a shortcut.
The surface decides what the item becomes.
An item kind is registered once, with a default place, as an activity item is.
A dock is a surface like the others, so a move to a dock is the same move as to `main`.
The menus from the scena plan show and hide the items, in each place that holds them.
The activity items do not change.

## What others do

- VS Code lets a person drag views between the Primary Side Bar, the Secondary Side Bar and the Panel. A view keeps its identity in each place ([custom layout](https://code.visualstudio.com/docs/configure/custom-layout)).
- VS Code hides a view or an activity item from the context menu of its container. The scena plan for the menus copies this.
- ahpapp lets a bot rest in its sidebar; the [docks brief](docks-rest-in-the-chrome.md) gives its links.

## What ahpw has today

### What is open and how it is kept

- scena keeps two things per browser: the layout state per surface, and the open mounts.
- The layout state is in `ahpd-web.layout.v2` ([`App.tsx`](../../src/App.tsx#L19-L20)). It holds per surface its visibility, the tab tree of `main`, an order and the hidden keys ([`SurfaceLayoutState`](https://github.com/softov/scena/blob/3756caaa1ff346d60e3210bed5f5868346dd097b/packages/scena/src/sdk/layout.ts#L91-L158)).
- A kept mount is a [`SessionMount`](https://github.com/softov/scena/blob/3756caaa1ff346d60e3210bed5f5868346dd097b/packages/scena/src/sdk/session.ts#L6-L12): its key, its surface, its component node with props, and a state.
- [`keepTabs`](../../src/shell/tabs.ts#L10-L44) keeps the mounts of `main` only, and opens them again after a reload. A mount whose component is not registered is skipped.
- A session page is the node `{ component: 'SessionPage', host, resource }`, under one key per session ([`ahp.openSession`](../../src/resources/sessions/index.ts#L265-L288)). So the payload that reopens a session is its host and its resource.
- A session opened on the right sidebar is not kept, because `keepTabs` keeps `main` only.

### How things are registered

| Thing | Exists because | Where it is registered | Shown when |
| --- | --- | --- | --- |
| Activity item | code registers it | a mount on `activitybar` ([`register-shell.tsx`](../../src/shell/register-shell.tsx#L276-L290)) | its `when`, such as a host serving the bot plugin |
| Dock action (`+`, `Ctrl+Shift+P`) | code registers it | [`DOCK_ACTIONS`](../../src/shell/dock/actions.ts#L10-L38), a closed list | its `ui.<id>Button` setting; there is no `when` and no permission check |
| Bot | a host registers it | the host's bot channel, read by [`DockLayer`](../../src/shell/dock/DockLayer.tsx#L203-L213) | while its host is shown |
| Session tab | a person opens it | `surfaces.open` from `ahp.openSession` | while it is open; kept by `keepTabs` |

- No item exists today because a person placed it, other than an open tab.

### The docks

- The dock layer is one mount on `overlay` ([`registerDock`](../../src/shell/dock/index.ts#L14-L18)). A dock is not a surface.
- A [dock](../../src/shell/dock/docks.ts#L13-L20) is an id, a place, and item keys: `action:<id>` or a bot's `refKey(host, slug)`. The docks are kept in `ahpd-web.docks`, apart from scena.
- A dock drag is the layer's own pointer drag. It does not use the browser's drag and drop, so no other surface can take a dock item.

### Drag and drop

- ahpw sets one drag type, `application/x-ahpw-host-file` ([`drag.ts`](../../src/resources/folders/drag.ts#L1-L30)). The explorer sets it on a file row.
- A composer takes a host file or a local file as a drop ([`composer-drop.ts`](../../src/resources/sessions/composer-drop.ts#L15-L62)).
- A chat can hold a session as a reference, [`chatAttachment`](../../src/resources/sessions/attachments.ts#L27-L35). Today a person adds it from the composer menu only ([`composer-commands.ts`](../../src/resources/sessions/composer-commands.ts#L140-L150)).
- scena 0.8.0, which ahpw takes, moves a tab between surfaces by a drag. A surface takes the drop anywhere on it.
- A tab dropped outside the page opens in a window of its own.
- scena 0.8.0 has an open drag for a list row, `startOpenDrag`, with a key, a component node and a title. A drop opens the key, or moves its tab when it is open.
- scena 0.8.0 has drop areas, `useDropArea` and `DropArea`, which take a tab or a row and leave the tab where it was: a link.
- The session list sets no drag yet. The plan [`sessions/20261121-1215-a-row-drags-to-a-surface-or-a-composer`](../plans/sessions/20261121-1215-a-row-drags-to-a-surface-or-a-composer/plan.md) adds the row drag, and makes the composer take a session or a file tab as a reference. It replaces the plan that added `application/x-ahpw-session`.

### Show and hide

- The scena plan [`layout/20261118-0318-panes-and-the-rail-have-menus`](file:///github/scena/.project/plans/layout/20261118-0318-panes-and-the-rail-have-menus/plan.md) ticks the panes of a stack and the items of the activity bar. An unticked key goes in `stack.hidden` or `rail.hidden`, in the layout state.
- A mount with `hideable: false` gets no tick.
- A dock action hides by its own setting, `ui.<id>Button`, not by a menu tick.

## Who writes

- No pull request of `ahpio/ahpw` is open at `f6531a8`.
- The branch `release/0.9.0` changes nothing in `src/shell/`, `src/resources/sessions/` or `src/App.tsx` against `main`.
- The brief [*Docks rest in the activity bar and the title bar*](docks-rest-in-the-chrome.md) changes `src/shell/dock/` and `register-shell.tsx`. It turns the dock actions into mounts on a `dock` surface, which is the first step of this change. The two briefs become one plan, or this change builds on that one.
- The plan `sessions/20261028-0951-drag-a-session-into-a-tab-group` adds a session drag type. This change replaces that type with the item payload, so the plan changes before it is built.
- The scena brief *Drag a tab between surfaces* sets the payload of a tab drag. The item payload and the tab payload are one shape, so the two are written together.
- The scena menus plan is not built. The ticks for a dock wait for it.

## The change

### An item kind

- An item kind is registered once, as an activity item is. It has a name, an icon, a label, and a `when`.
- The kind says how its items are named. A session is named by its host and resource, a bot by its host and slug, an action by its id.
- The kind says what each surface makes of an item. A session opens a `SessionPage` on `main`, attaches as a chat reference on a composer, and draws a shortcut button on a dock.
- A surface that has no form for a kind refuses its drop.
- The kind gives a default place, as `pos` places an activity item.

### Where an item comes from

- **Fixed:** code registers the item, with a `when`. `+` and `Ctrl+Shift+P` are fixed items. The `when` of `+` holds while the person may create a session.
- **Host:** a host registers the item. A bot is a host item while its host is shown.
- **Placed:** a person makes the item by a drop or a menu. A session shortcut on a dock is a placed item. It stays until the person removes it.
- The default place applies to a fixed item and a host item. A placed item is where the person put it.

### Move and link

- A **move** takes the item from one surface to another; it stays one item. A tab from `main` to the right sidebar moves. A shortcut from one dock to another moves.
- A **link** leaves the item where it is and adds a form of it on the target. A session on a chat becomes a reference. A session on a dock becomes a shortcut.
- The target decides between move and link, from the kind and its own form.

### The payload

- scena 0.8.0 has the two payloads. A tab carries its key and its surface; a row carries its key, its component node and its title.
- A drop area reads both as one `DroppedThing`.
- A kind is read from the component node, such as `SessionPage` for a session. Softov chose the key and the node over a kind registry in scena, 2026-11-21.
- `application/x-ahpw-host-file` stays for a file row of the folder explorer, until a kind registry or the open drag takes it.

### Docks are surfaces

- Each dock is a scena surface. Its items are mounts, so `surfaces.move` and `surfaces.open` reach it.
- A dock's place and its order stay in the layout state of its surface.
- A placed item on a dock is kept as a mount, as `keepTabs` keeps the tabs of `main`.

### What is kept, and where

- The placed items, the docks and the tabs are kept in this browser for now. Softov chose this on 2026-11-19.
- They are kept in one shape that ahpd can save later as a person's workspace. A sync to ahpd then adds a store and changes no shape. Softov: "it become easy to sync with ahpd. The thing is we need like a workspace to be saved onto ahpd", 2026-11-19.
- The sessions opened on the right sidebar are kept, as the tabs of `main` are, and so are the tabs of a window. The fixed panes of the right sidebar are not kept. Softov chose this on 2026-11-19; [`shell/20261121-1215-tabs-are-kept-on-every-surface`](../plans/shell/20261121-1215-tabs-are-kept-on-every-surface/plan.md) built it.
- An item from a host that is not shown is hidden and kept, as a bot is today. It shows again when its host comes back. Softov chose this on 2026-11-19.

### The word

- "Item" names the thing a person places and moves. Softov chose this on 2026-11-19.
- The activity items stay apart from the item kinds for now. Softov chose this on 2026-11-19.

### Show, hide and move from a menu

- Each place that holds items has the menu from the scena plan: a tick per item, to show or hide it.
- A dock's menu ticks its items, and the hidden keys go in its layout state, as `rail.hidden` does.
- The dock action settings `ui.<id>Button` go; the tick takes their place.
- An item's own menu has a "Move to" row that lists the places that take its kind. A drag and the row are the same move.

## Open points

- How the `+` item knows the person may create a session.
  ahpd gates `createSession` by the grant `session:create`, in `packages/sdk/src/host/gate.ts` at ahpd `b9f7806fc`.
  ahpw has [`heldBy`](../../src/bridges/grants.ts#L161) to test a grant list.
  Not found: the signed-in person's own grants in ahpw's store; searched `grants`, `can(` and `session:create` in `src`.