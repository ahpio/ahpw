---
title: A session shows its summary and acts from its menu
created: 2026-11-06
refs:
  - git://6051cfb068055959eb2362166b55fb36fd1268c9 - the commit of this repository the facts were checked at
  - git://623fc9a44af641eaab9cf6f5d402159b2baadadb - the commit of ahpapp the reference was checked at
  - "[code://src/resources/sessions/Details.tsx#L28-L102](../../src/resources/sessions/Details.tsx#L28-L102) - `SessionDetails`, the Session view: one list of facts"
  - "[code://src/resources/sessions/index.ts#L266](../../src/resources/sessions/index.ts#L266) - where the Session view is mounted, as `session:details`"
  - "[code://src/resources/sessions/turn.ts#L50-L73](../../src/resources/sessions/turn.ts#L50-L73) - `totalsOf`: turns, working time, tokens, tool calls and models"
  - "[code://src/resources/sessions/Page.tsx#L371-L379](../../src/resources/sessions/Page.tsx#L371-L379) - the session header: the title, the activity badge and the header buttons"
  - "[code://src/resources/sessions/SessionHeader.tsx#L117-L124](../../src/resources/sessions/SessionHeader.tsx#L117-L124) - `viewMenu`, the `...` menu: *Views* and *Display*"
  - "[code://src/resources/sessions/Explorer.tsx#L37-L54](../../src/resources/sessions/Explorer.tsx#L37-L54) - `menuOf`, the session list's menu, with pin, mark read and archive"
  - "[code://src/resources/sessions/pins.ts#L33](../../src/resources/sessions/pins.ts#L33) - `togglePin`: a pin is kept in the browser, not on the host"
  - "[code://src/resources/sessions/Page.tsx#L302-L306](../../src/resources/sessions/Page.tsx#L302-L306) - the open session marks itself read each time it is unread or a turn changes"
  - "[code://src/resources/sessions/Usage.tsx#L162](../../src/resources/sessions/Usage.tsx#L162) - `UsageDialog`, the context and plan usage that *Display* opens"
  - https://github.com/softov/ahpapp/blob/623fc9a44af641eaab9cf6f5d402159b2baadadb/src/components/SessionSummary.tsx#L69-L285 - ahpapp's Summary, the reference
  - https://github.com/softov/ahpapp/blob/623fc9a44af641eaab9cf6f5d402159b2baadadb/src/session-analysis.ts#L76-L111 - `SessionSummary`, every figure the Summary shows
  - https://github.com/softov/ahpapp/blob/623fc9a44af641eaab9cf6f5d402159b2baadadb/src/session-analysis.ts#L186 - `summaryOf`, which adds the figures up from the chat and the session state
  - https://github.com/softov/ahpapp/blob/623fc9a44af641eaab9cf6f5d402159b2baadadb/src/components/SessionPanel.tsx#L188-L198 - ahpapp's panel tabs: Context, Changes, Files and Summary
  - https://github.com/softov/ahpapp/blob/623fc9a44af641eaab9cf6f5d402159b2baadadb/src/components/SessionPanel.tsx#L700-L745 - ahpapp's session acts: pin, mark read, archive, Summary and Raw
  - https://github.com/softov/ahpapp/blob/623fc9a44af641eaab9cf6f5d402159b2baadadb/src/useSession.ts#L386-L409 - ahpapp marks a session read once per visit, so *Mark unread* holds
---

# A session shows its summary and acts from its menu

Softov wants two changes to an open session in ahpw, after ahpapp.
First, the Session view becomes a Summary like ahpapp's: what the chat did, added up.
The other place he named for it is the session header, which opens to show it when the title is clicked.
Second, the session's `...` menu gets the acts of a session: pin or unpin, mark read or unread, and archive.
He sent screenshots of ahpw's Session view and ahpapp's Summary on 2026-11-06.

## What others do

**ahpapp** has a Summary tab in its session panel, beside Context, Changes and Files. On a phone, the Summary takes the place of the session info in the same sheet. From top to bottom it shows these parts:

- Four tiles: *Turns*, *Working*, *Tokens* and *Steps*.
  Each has a note: the cancelled turns, the time since it opened, the cached tokens, the tool calls and output rate.
- *Timeline*: one lane each for input, tools and model, one mark per step. A tap opens Raw at that step.
- *Per turn*: one bar per turn for the input tokens, with the cached part lighter.
- *Tools*: one bar per tool with its calls, failed and denied counts.
- *Chats*: each chat of the session and where it came from, when there is more than one.
- *Session*: the models, the MCP servers with their state, the branch, the errors, and whether every turn is loaded.

`summaryOf` adds every figure up from the chat and the session state, and leaves out a figure the host did not send. It is plain TypeScript over the AHP types. The Summary itself is React Native, which ahpw cannot import.

ahpapp's Context tab starts with the acts: *Pin*, *Mark read* or *Mark unread*, *Archive* or *Unarchive*, *Summary* and *Raw*. Its facts follow.

ahpapp marks a session read once per visit. A person who taps *Mark unread* while the session is open keeps it unread.

## What ahpw has today

- The Session view is [`SessionDetails`](../../src/resources/sessions/Details.tsx#L28-L102), mounted as `session:details` at [`code://src/resources/sessions/index.ts`](../../src/resources/sessions/index.ts#L266).
- It is one list of facts about the session: what it is, where it works, and what it did.
  It lists the title, the ids, the agent, the model, the folder, terminals, the times, the totals, the changes and the watching clients.
- Its figures come from [`totalsOf`](../../src/resources/sessions/turn.ts#L50-L73): turns, working time, tokens, tool calls and models.
  ahpw has no cached tokens, steps, per-turn, per-tool, chat or MCP figures.
- The Raw view draws the steps as a list. ahpw has no timeline lanes.
- The header holds the title, the activity badge and the header buttons, at [`code://src/resources/sessions/Page.tsx`](../../src/resources/sessions/Page.tsx#L371-L379). Nothing in it opens or folds.
- The `...` menu is [`viewMenu`](../../src/resources/sessions/SessionHeader.tsx#L117-L124). Under *Views* it opens Session, Changes, Browser, Files and a new terminal. Under *Display* it opens Usage, Raw and Hide calls.
- [`UsageDialog`](../../src/resources/sessions/Usage.tsx#L162) shows the context and plan usage.
- The session list's menu, [`menuOf`](../../src/resources/sessions/Explorer.tsx#L37-L54), has *Pin* or *Unpin*, *Mark read* or *Mark unread*, and *Archive* or *Unarchive*.
- Read and archived go to the host as `session/isReadChanged` and `session/isArchivedChanged`. A pin stays in the browser, through [`togglePin`](../../src/resources/sessions/pins.ts#L33).
- The open session marks itself read again each time it is unread or its turns change, at [`code://src/resources/sessions/Page.tsx`](../../src/resources/sessions/Page.tsx#L302-L306). So *Mark unread* on an open session is undone at once.

## Who writes

- No pull request of ahpw is open.
- No branch that is not merged changes `Details.tsx`, `SessionHeader.tsx`, `Page.tsx`, `Explorer.tsx` or `sessions/index.ts`.
- No active plan changes these files.
- The brief [a-session-shows-its-artifacts](a-session-shows-its-artifacts.md) adds pills above the composer, not to the header or the Session view.
- The brief [a-session-shows-its-context-and-plan-usage](a-session-shows-its-context-and-plan-usage.md) is about the usage dialog, which *Display* opens.

## The change

- The Session view is named *Summary*, and shows ahpapp's parts: the four tiles, the timeline, per turn, tools, chats and session.
- ahpw adds up the figures as `summaryOf` does, in a module of its own, and leaves out a figure the host did not send.
- A tap on the timeline opens Raw at that step.
- The `...` menu gets a third group after *Display*, with *Pin* or *Unpin*, *Mark read* or *Mark unread*, and *Archive* or *Unarchive*.
- The list's menu and the header's menu make their acts from one shared function, with the same words.
- The open session marks itself read once when it opens and once each time a turn ends. A *Mark unread* holds until one of those happens.

## Open points

- Where the summary goes: the Session view renamed to *Summary*, or the header, which opens when the title is clicked.
- Whether today's facts stay. They can be the Summary's *Session* part, a Context view of their own as in ahpapp, or the opened header.
- Whether the menu also gets *Rename*, *Copy link* and *Delete*, which the list's menu has.
- What an archived session does when it is open: stay on the page, or close.
