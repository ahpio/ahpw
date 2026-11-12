---
title: A session shows its summary and acts from its menu
created: 2026-11-06
refs:
  - git://65cc977 - the commit of this repository the facts were checked at
  - git://60b212a - the commit that built the Summary in the session header, the first half of this brief
  - git://623fc9a44af641eaab9cf6f5d402159b2baadadb - the commit of ahpapp the reference was checked at
  - "[code://src/resources/sessions/Summary.tsx#L41](../../src/resources/sessions/Summary.tsx#L41) - `Summary`, which the header opens: KPI cards, per turn, tools, MCP servers and skills"
  - "[code://src/resources/sessions/SessionHeader.tsx#L119](../../src/resources/sessions/SessionHeader.tsx#L119) - `viewMenu`, the `...` menu: *Views* and *Display*"
  - "[code://src/resources/sessions/Explorer.tsx#L38](../../src/resources/sessions/Explorer.tsx#L38) - `menuOf`, the session list's menu, with pin, mark read and archive"
  - "[code://src/resources/sessions/pins.ts#L33](../../src/resources/sessions/pins.ts#L33) - `togglePin`: a pin is kept in the browser, not on the host"
  - "[code://src/resources/sessions/Page.tsx#L410-L414](../../src/resources/sessions/Page.tsx#L410-L414) - the open session marks itself read each time it is unread or a turn changes"
  - https://github.com/softov/ahpapp/blob/623fc9a44af641eaab9cf6f5d402159b2baadadb/src/components/SessionSummary.tsx#L69-L285 - ahpapp's Summary, with its timeline
  - https://github.com/softov/ahpapp/blob/623fc9a44af641eaab9cf6f5d402159b2baadadb/src/components/SessionPanel.tsx#L700-L745 - ahpapp's session acts: pin, mark read, archive, Summary and Raw
  - https://github.com/softov/ahpapp/blob/623fc9a44af641eaab9cf6f5d402159b2baadadb/src/useSession.ts#L386-L409 - ahpapp marks a session read once per visit, so *Mark unread* holds
---

# A session shows its summary and acts from its menu

Softov wants an open session in ahpw to show its summary and to act from its menu, after ahpapp.
The Summary is built: the session header opens it, as [`git://60b212a`](https://github.com/ahpio/ahpw/commit/60b212a) made it.
What waits is the Summary's timeline, and the session's acts in its `...` menu: pin or unpin, mark read or unread, and archive.
He sent screenshots of ahpw's Session view and ahpapp's Summary on 2026-11-06.

## What others do

- ahpapp's Summary has a *Timeline*: one lane each for input, tools and model, one mark per step. A tap opens Raw at that step.
- ahpapp's Context tab starts with the acts: *Pin*, *Mark read* or *Mark unread*, *Archive* or *Unarchive*, *Summary* and *Raw*.
- ahpapp marks a session read once per visit. A person who taps *Mark unread* while the session is open keeps it unread.

## What ahpw has today

- The header opens [`Summary`](../../src/resources/sessions/Summary.tsx#L41), with KPI cards, the newest turns, the tools, the MCP servers and the skills. It has no timeline.
- The `...` menu is [`viewMenu`](../../src/resources/sessions/SessionHeader.tsx#L119). Under *Views* it opens the views and a new terminal. Under *Display* it opens Usage, Raw and Hide calls.
- The session list's menu, [`menuOf`](../../src/resources/sessions/Explorer.tsx#L38), has *Pin* or *Unpin*, *Mark read* or *Mark unread*, and *Archive* or *Unarchive*.
- Read and archived go to the host as `session/isReadChanged` and `session/isArchivedChanged`. A pin stays in the browser, through [`togglePin`](../../src/resources/sessions/pins.ts#L33).
- The open session marks itself read again each time it is unread or its turns change, at [`code://src/resources/sessions/Page.tsx`](../../src/resources/sessions/Page.tsx#L410-L414). So *Mark unread* on an open session is undone at once.

## Who writes

- Plan [plugins/20261112-0221-a-record-draws-the-operations-it-offers](../plans/plugins/20261112-0221-a-record-draws-the-operations-it-offers/plan.md) changes agent, connector, tunnel and client pages, not sessions.
- No open branch of ahpw changes `Summary.tsx`, `SessionHeader.tsx`, `Explorer.tsx` or the sessions `Page.tsx`.

## The change

- The Summary gets ahpapp's timeline, and a tap on it opens Raw at that step.
- The `...` menu gets a third group after *Display*, with *Pin* or *Unpin*, *Mark read* or *Mark unread*, and *Archive* or *Unarchive*.
- The list's menu and the header's menu make their acts from one shared function, with the same words.
- The open session marks itself read once when it opens and once each time a turn ends. A *Mark unread* holds until one of those happens.

## Open points

- Whether the menu also gets *Rename*, *Copy link* and *Delete*, which the list's menu has.
- What an archived session does when it is open: stay on the page, or close.
