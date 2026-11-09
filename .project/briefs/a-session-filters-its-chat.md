---
title: A session filters its chat
created: 2026-11-08
refs:
  - git://4e957ad - the commit of this repository the facts on main were checked at
  - git://0d0ec96 - the head of `sessions/header-summary`, which adds the header line, the session info and its Summary, not merged yet
  - "[code://src/resources/sessions/raw.ts#L13](../../src/resources/sessions/raw.ts#L13) - `StepKind`, the kinds of step the Raw view draws"
  - "[code://src/resources/sessions/raw.ts#L44-L95](../../src/resources/sessions/raw.ts#L44-L95) - `RawFilter`, `stepOf`, `rawOf` and `shownSteps`: each step's kind and text, and the Raw view's filter"
  - "[code://src/resources/sessions/RawView.tsx#L23](../../src/resources/sessions/RawView.tsx#L23) - the Raw view's filter chips: all, tools, subagents"
  - "[code://src/resources/sessions/Page.tsx#L262](../../src/resources/sessions/Page.tsx#L262) - `rawFilter`, the Raw view's chip, kept in the page's state"
  - "[code://src/style/app.css#L1222-L1232](../../src/style/app.css#L1222-L1232) - `.web-explorer__scroll`, a scrollbar that shows only while the pointer is over the list"
  - "[code://src/style/app.css#L217](../../src/style/app.css#L217) - `.web-chat__turns`, the chat's scroll, with the scrollbar always shown"
  - "[code://src/resources/sessions/Parts.tsx#L205-L233](../../src/resources/sessions/Parts.tsx#L205-L233) - `Part`, which draws each kind of response part in the chat"
  - "[code://src/resources/sessions/Page.tsx#L132](../../src/resources/sessions/Page.tsx#L132) - `TurnView`, one turn of the chat, with its `hideCalls` switch"
  - "[code://src/resources/sessions/SessionHeader.tsx#L123](../../src/resources/sessions/SessionHeader.tsx#L123) - *Hide calls* in the header's menu, the one filter the chat has today"
  - "[code://src/resources/sessions/activity-parts.ts#L83](../../src/resources/sessions/activity-parts.ts#L83) - `groupParts`, which folds a turn's tool calls into activity groups"
  - "[code://src/resources/sessions/origin.ts#L80-L83](../../src/resources/sessions/origin.ts#L80-L83) - `askOf`, which reads a message's origin, `systemNotification` among them"
  - git://0d0ec96 - `HeaderLine` in `src/resources/sessions/HeaderInfo.tsx#L20`, the line under the title that opens the session info
  - git://0d0ec96 - the Tools card in `src/resources/sessions/Summary.tsx#L79-L82`, one row for each tool, with no click
  - git://0d0ec96 - `src/resources/sessions/figures.ts#L77` counts a tool by its `displayName`, else its `toolName`
  - git://0d0ec96 - `infoOpen` and `toggleInfo` in `src/resources/sessions/Page.tsx#L272-L407`: the session info in place of the chat, and the chat's scroll place kept
  - npm://@microsoft/agent-host-protocol@1.0.0 - `MessageKind`: user, agent, tool, automation and systemNotification; `ResponsePartKind`: markdown, contentRef, toolCall, reasoning, systemNotification, inputRequest and error
  - npm://@softov/scena@0.5.18 - `Filter`, a search field and preset chips that write `$/<namespace>/query` for a data provider
  - npm://@softov/scena@0.5.18 - `TextField`, `ChoicePicker` with its `select` variant, and `Chip` with the states `on` and `off`: the parts of the filter
  - npm://@microsoft/agent-host-protocol@1.0.0 - `ChatState.turnsNextCursor`, an opaque cursor for the older turns, with no count of them
  - https://github.com/microsoft/vscode/blob/171e90619c72/src/vs/workbench/contrib/chat/browser/widget/chatFind/chatFindCommandIds.ts#L7-L10 - VS Code's *Find in Chat*, *Find Next* and *Find Previous*
  - https://github.com/microsoft/vscode/blob/171e90619c72/src/vs/workbench/contrib/chat/browser/widget/chatFind/chatFindWidget.ts#L234 - `ChatFindWidget`, a find widget over the transcript
  - https://github.com/softov/ahpapp/blob/fe15bff/src/components/RawView.tsx#L351-L357 - ahpapp's Raw view keeps the steps whose text holds the query
  - https://github.com/softov/ahpapp/blob/fe15bff/src/components/SessionSummary.tsx#L208-L227 - ahpapp's Summary lists each tool, with no click
---

# A session filters its chat

Softov wants a filter in the session header, so a person can find a tool call in a long chat.
The filter takes a type of step and a text.
The types he named are notification, tool, agent and user.
The Summary in the session header lists each tool, and a click on a tool opens the chat filtered to that tool.
He asked for this on 2026-11-08, with a screenshot of the Summary's Tools card.

On 2026-11-09 he added two goals:

- The Raw view uses the same filter as the chat. Its filter is wrong today because it has no text search.
- The chat's scrollbar shows only while the pointer is over the chat.

## What others do

**VS Code** has *Find in Chat*, at [`chatFindCommandIds.ts`](https://github.com/microsoft/vscode/blob/171e90619c72/src/vs/workbench/contrib/chat/browser/widget/chatFind/chatFindCommandIds.ts#L7-L10).
It is a find widget over the transcript, with *Find Next* and *Find Previous*.
It highlights each match and scrolls to it, and every step stays in the chat.
It has no filter by the kind of step.

**ahpapp** has a search field on its Raw view, at [`RawView.tsx`](https://github.com/softov/ahpapp/blob/fe15bff/src/components/RawView.tsx#L351-L357).
The view keeps only the steps whose text holds the query, and drops a turn with no step left.
Its Summary lists each tool with its calls, and a tool row has no click.

## What ahpw has today

- The Raw view knows each step's kind and text, from [`stepOf`](../../src/resources/sessions/raw.ts#L44-L95).
  The kinds are [`StepKind`](../../src/resources/sessions/raw.ts#L13): message, text, reasoning, tool, question, error, note and file.
- The Raw view filters its steps with three chips, at [`code://src/resources/sessions/RawView.tsx`](../../src/resources/sessions/RawView.tsx#L23): all, tools and subagents.
  It has no text search.
  *Subagents* keeps the tool calls that started a subagent chat.
  The chip is kept in the page's state, at [`code://src/resources/sessions/Page.tsx`](../../src/resources/sessions/Page.tsx#L262).
- The chat draws each turn with [`TurnView`](../../src/resources/sessions/Page.tsx#L132), and each response part with [`Part`](../../src/resources/sessions/Parts.tsx#L205-L233).
  [`groupParts`](../../src/resources/sessions/activity-parts.ts#L83) folds a turn's tool calls into activity groups.
- *Hide calls* in the header's menu is the one filter the chat has, at [`code://src/resources/sessions/SessionHeader.tsx`](../../src/resources/sessions/SessionHeader.tsx#L123).
- A message carries its origin, and [`askOf`](../../src/resources/sessions/origin.ts#L80-L83) reads it.
- The protocol names five origins of a message: user, agent, tool, automation and systemNotification.
- The protocol names seven kinds of response part: markdown, contentRef, toolCall, reasoning, systemNotification, inputRequest and error.
- The chat holds only the loaded turns. Older turns load on request.
  The protocol gives an opaque cursor for them, `turnsNextCursor`, and no count.
- `stepOf` gives a tool call the text of its line, and keeps the call itself in the step.
- On `sessions/header-summary`, which is not merged:
  - `HeaderLine` is the line under the title, and a click shows the session info in place of the chat.
  - The Summary's Tools card lists each tool by its `displayName`, else its `toolName`, with no click.
  - The page keeps the chat's scroll place while the info shows.
- scena's `Filter` is a search field with preset chips.
  It writes `$/<namespace>/query` for a data provider, as a `Listable` reads it.
  The chat is not a `Listable`, so `Filter` does not fit it.
- scena has the parts of a filter: `TextField`, `ChoicePicker` with a `select` variant, and `Chip` with the states `on` and `off`.
- The explorer's list shows its scrollbar only while the pointer is over it, at [`code://src/style/app.css`](../../src/style/app.css#L1222-L1232).
  It keeps the scrollbar's room, so nothing moves when the scrollbar shows.
- The chat's scroll, [`.web-chat__turns`](../../src/style/app.css#L217), always shows its scrollbar.

## Who writes

- No pull request of ahpw is open.
- `sessions/chat-filter` is the branch for this change, made from `sessions/header-summary`. It has no commits of its own.
- `sessions/header-summary` changes `Page.tsx`, `HeaderInfo.tsx` and `Summary.tsx`. This change builds on it, so that branch merges first.
- No other branch that is not merged changes `Page.tsx`, `SessionHeader.tsx`, `raw.ts`, `RawView.tsx`, `HeaderInfo.tsx`, `Summary.tsx` or `app.css`.

## The change

Softov gave these answers on 2026-11-08, after a mockup of the filter, and on 2026-11-09.

- The session header shows the filter as an icon, with the tooltip *Filter the chat*.
  A click opens the filter under the header line.
- A second click closes the filter and clears it, so the chat shows every step again.
  The icon keeps its colour while the filter is open.
- The filter is one ahpw component in `src/shell/view/`, made of scena's `TextField`, `ChoicePicker` and `Chip`.
  scena has no filter that fits the chat.
- The filter has these parts, in this order:

| Part | scena part | What it does |
|---|---|---|
| Text | `TextField` | Keeps a step whose text holds it, in any case. |
| Type | `ChoicePicker`, `select` variant | Keeps one type of step: *All types*, *User*, *Agent*, *Tool*, *Subagent*, *Question* or *Notification*. The default is *All types*. |
| *Errors* | `Chip` | Off: no filter on errors. On: only the steps that failed. |
| *Highlight* | `Chip` | Off, the default: the chat shows only the matches. On: the chat shows every step and marks the matches. |
| Count | text | Off: "5 of 41 steps". On: "2 of 5", with *Previous match* and *Next match*. |
| Clear | icon | Clears the text, the type and the two chips. |

- Each type keeps these steps:
  - *User*: a turn's message whose origin is user. A message that an automation, a tool or the agent started shows only under *All types*.
  - *Agent*: the agent's text and reasoning.
  - *Tool*: the tool calls.
  - *Subagent*: the tool calls that started a subagent chat, as the Raw view's *Subagents* chip keeps them.
  - *Question*: the input requests.
  - *Notification*: a response part of the kind `systemNotification`, and a message with that origin.
- *Errors* keeps an error part and a tool call that failed. It works with the type, so *Tool* with *Errors* keeps the failed calls.
- The text matches a tool call's line, its `toolName` and its `displayName`. A call whose line shows only its command still matches the name of its tool.
- Each step's kind and text come from the Raw view's `stepOf`, so the Raw view and the filter agree.
- While only the matches show:
  - A turn with a match shows a line with its number and time, then its matching steps under "2 of 7 steps".
  - A turn with no match is not shown.
- While *Highlight* is on, the current match has a bar on its side, and the other matches are marked.
- When older turns are not loaded, the top of the chat shows *Load earlier turns* and the line "Older turns are not searched".
  The protocol gives no count of the older turns, so the line shows no number.
- A click on a tool in the Summary's Tools card closes the session info.
  The chat then opens with the filter on, the type *Tool*, and the tool's name as the text.
- Each session keeps its own filter while the page is open.
- Clearing the filter shows the whole chat again, at the place it was read.

### The Raw view

- The Raw view uses the same filter component, in place of its three chips.
  *Subagents* becomes the type *Subagent*, so no chip of the Raw view is lost.
- The chat and the Raw view share one filter for each session. A filter set in the chat stays when the Raw view opens.
- In the Raw view, *Highlight* off shows only the matching rows. *Highlight* on shows every row and marks the matches.
- The Raw view's `rawFilter` state goes, because the shared filter replaces it.

### The scrollbar

- The chat's scroll shows its scrollbar only while the pointer is over the chat, as the explorer's list does.
- The scrollbar keeps its room while hidden, so the chat does not move when it shows.
- A touch screen has no pointer over the chat, so its scrollbar follows the browser's own rule.
