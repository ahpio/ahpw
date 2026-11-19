---
title: Docks rest in the activity bar and the title bar
created: 2026-11-15
refs:
  - git://113d3feaa0ddb2769a1eb70add241f639bf9fe8a - the commit of this repository the facts were checked at
  - git://d1452e9cd6d19b775932db85a4d1700b490af6cd - the commit of scena the layouts were checked at, release 0.6.2, which ahpw uses
  - git://fe15bff0c6d98e2ee9c0d1b82f7c93868ea2d03f - the commit of ahpapp the reference was checked at
  - "[code://src/shell/dock/index.ts#L14-L18](../../src/shell/dock/index.ts#L14-L18) - `registerDock`, the dock layer as one `overlay` mount"
  - "[code://src/shell/dock/docks.ts#L13-L20](../../src/shell/dock/docks.ts#L13-L20) - `DockPlace` and `Dock`: an edge or a floating point, and the item keys"
  - "[code://src/shell/dock/docks.ts#L48-L62](../../src/shell/dock/docks.ts#L48-L62) - `fillDocks`, which drops a key that no longer exists and sends a new one home"
  - "[code://src/shell/dock/docks.ts#L108-L114](../../src/shell/dock/docks.ts#L108-L114) - `snapDock`, where a drop rests"
  - "[code://src/shell/dock/actions.ts#L10-L38](../../src/shell/dock/actions.ts#L10-L38) - `DockActionId` and `DOCK_ACTIONS`, the closed list of two actions"
  - "[code://src/shell/dock/settings.ts#L15-L24](../../src/shell/dock/settings.ts#L15-L24) - the places the settings offer"
  - "[code://src/shell/dock/DockLayer.tsx#L271-L291](../../src/shell/dock/DockLayer.tsx#L271-L291) - the layer calls `snapDock` while a drag moves and when it ends"
  - "[code://src/shell/register-shell.tsx#L167-L200](../../src/shell/register-shell.tsx#L167-L200) - the title bar mounts"
  - "[code://src/shell/register-shell.tsx#L245-L340](../../src/shell/register-shell.tsx#L245-L340) - the activity bar mounts, the sibling pattern for a mounted action"
  - "[code://src/shell/presentation.ts#L7](../../src/shell/presentation.ts#L7) - the activity bar draws as a bar on an xsmall viewport"
  - https://github.com/softov/scena/blob/d1452e9cd6d19b775932db85a4d1700b490af6cd/packages/scena/src/ui/layout/RailLayout.tsx#L14-L31 - the rail's `pos` splits the top and bottom groups
  - https://github.com/softov/scena/blob/d1452e9cd6d19b775932db85a4d1700b490af6cd/packages/scena/src/ui/layout/BarLayout.tsx#L5-L32 - the title bar's `slot` splits left, center and right
  - https://github.com/softov/scena/blob/d1452e9cd6d19b775932db85a4d1700b490af6cd/packages/scena/src/sdk/mount-surface.ts#L30-L40 - `SurfaceName` admits any name
  - https://github.com/softov/ahpapp/blob/fe15bff0c6d98e2ee9c0d1b82f7c93868ea2d03f/src/bots.ts#L594-L600 - `snapPuck`, a drop over the sidebar rests there
  - https://github.com/softov/ahpapp/blob/fe15bff0c6d98e2ee9c0d1b82f7c93868ea2d03f/src/components/BotLayer.tsx#L199-L208 - the bot leaves its puck for the sidebar
  - https://code.visualstudio.com/docs/configure/custom-layout - views and panels move between the side bars and the panel, checked 2026-11-15
---

# Docks rest in the activity bar and the title bar

Softov wants to put actions in docks in four places of the window's chrome.
The places are the top and bottom groups of the activity bar, and the center and right of the title bar.
Today a dock rests only on a window edge or floats over the page.
The actions a dock can hold are a fixed list of two in code.
Softov wants a register of actions like the activity items, so more actions can join.
The activity items and the title bar's own buttons stay as they are.
This is a first try to see if docks in the chrome work.

## What others do

- ahpapp lets a bot rest in its sidebar. [`snapPuck`](https://github.com/softov/ahpapp/blob/fe15bff0c6d98e2ee9c0d1b82f7c93868ea2d03f/src/bots.ts#L594-L600) returns `side-left` for a drop over the sidebar.
- The ahpapp layer then [takes the bot out of its puck](https://github.com/softov/ahpapp/blob/fe15bff0c6d98e2ee9c0d1b82f7c93868ea2d03f/src/components/BotLayer.tsx#L199-L208), and the placement setting calls that place *Sidebar*.
- VS Code lets the user drag views and panels between the Primary Side Bar, the Secondary Side Bar and the Panel.
- VS Code's title bar has layout controls that show and hide the side bars and the panel. Its Activity Bar position is *Default*, *Top*, *Bottom* or *Hidden*.

## What ahpw has today

- The dock layer is one mount on the `overlay` surface, in [`registerDock`](../../src/shell/dock/index.ts#L14-L18). Its docks use `position: fixed` over the page.
- A [dock](../../src/shell/dock/docks.ts#L13-L20) is an id, a place and its item keys. A place is an edge with a share along it, or a floating point.
- An action's item key is `action:<id>`, and a bot's is `refKey(host, slug)`. The stored layout holds these keys.
- [`fillDocks`](../../src/shell/dock/docks.ts#L48-L62) drops a stored key that no longer exists, and sends a new key to its home dock.
- [`snapDock`](../../src/shell/dock/docks.ts#L108-L114) rests a drop on the nearest window edge, or floating. The layer [calls it](../../src/shell/dock/DockLayer.tsx#L271-L291) while a drag moves and when it ends.
- The [settings](../../src/shell/dock/settings.ts#L15-L24) offer the places top, right, bottom, left and floating.
- The actions are a closed list in [`actions.ts`](../../src/shell/dock/actions.ts#L10-L38). `DockActionId` is `newSession` or `palette`, and each has a `shown` and a `position` setting built for its id.
- A bot draws as its `Bood` face, 48 px wide, and a click opens `BotPopover` at the point of the click. A dock draws up to four bots and counts the rest.
- An activity item is a [mount on `activitybar`](../../src/shell/register-shell.tsx#L245-L340). It holds `ActivityBarItem` with an icon, a label, a section or a menu, badges and an optional `when`.
- The rail puts a mount with `pos: 'bottom'` in the bottom group, and any other mount in the top group. Mount order is the order within each group.
- The title bar puts each mount by its `slot`: `left`, `center` or `right`. ahpw mounts nothing in `center`, as [`register-shell.tsx`](../../src/shell/register-shell.tsx#L167-L200) shows.
- The title bar's right holds theme mode, layout, and the left, bottom and right toggles, as `ThemeModeToggle` and `ButtonBar` mounts.
- `ActivityBarItem` and `ButtonBar` are exports of `@softov/scena/ui`, so an ahpw component can draw them.
- scena accepts any surface name, so ahpw can define a surface of its own.
- On an xsmall viewport, the activity bar draws as a bar, as [`presentation.ts`](../../src/shell/presentation.ts#L7) sets.

## Who writes

- No pull request of `ahpio/ahpw` is open at `113d3fe`.
- The local branch `shell/manage-menu-groups` (`8cf412e`) removes `users:nav` and `teams:nav` from `register-shell.tsx`. The holders of this change go in the same file, so the branch that lands second rebases.
- No other branch or worktree changes `src/shell/dock/`, `register-shell.tsx` or `presentation.ts` against `113d3fe`.

## The change

- A `dock` surface holds the actions. Each action is a mount with a key, an icon, a label, a command, its keys and an optional `when`, as an activity item has.
- `newSession` and `palette` become the first two mounts. Their item keys stay `action:<id>`, so a stored layout keeps their places.
- The `shown` and `position` settings, and the palette's show commands, are built for each mounted action, not for a fixed id.
- `DockPlace` gains four chrome places: the activity bar's top, the activity bar's bottom, the title bar's center and the title bar's right.
- ahpw mounts one holder for each chrome place. The holders sit on `activitybar` with `pos` top and bottom, and on `titlebar` with `slot` center and right.
- Each holder draws the docks that rest at its place, in the bar's direction.
- The top holder comes after the last top item. The bottom holder comes before `manage:nav`, so the gear stays last.
- The title bar's right holder comes before `chrome:theme-mode`, so the title bar's own buttons stay together at the end.
- In a chrome place, an action draws as the bar's own button: `ActivityBarItem` in the rail, `ButtonBar` in the title bar. The pill grouping does not apply there. Softov chose this on 2026-11-15.
- A bot can rest in a chrome place too, as in ahpapp's sidebar. Softov chose this on 2026-11-15.
- A bot in a chrome place draws its face at the bar's item size, and a click opens its popover from there. The rule of four bots and a count holds there too.
- A drag that ends over a chrome place docks there, so `snapDock` learns where the four places are on screen. Softov chose this on 2026-11-15.
- The settings' place list gains the four chrome places.
- A chrome place follows its bar: when the activity bar is hidden, its docks are hidden with it. On an xsmall viewport, the rail's docks go into the bar.
- The activity items and the title bar's own buttons do not change.
