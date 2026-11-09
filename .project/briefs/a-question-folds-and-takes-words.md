---
title: A question folds and takes words
created: 2026-11-09
refs:
  - git://6a56371 - the commit of this repository the facts were checked at
  - "[code://src/resources/sessions/Question.tsx#L41-L111](../../src/resources/sessions/Question.tsx#L41-L111) - `QuestionForm`: the option rows, and the *Other* box only when `allowsOther` says so"
  - "[code://src/resources/sessions/Question.tsx#L118-L234](../../src/resources/sessions/Question.tsx#L118-L234) - `InputRequest`: the question card, its head, its pages and its buttons, with no fold"
  - "[code://src/resources/sessions/answer.ts#L29-L31](../../src/resources/sessions/answer.ts#L29-L31) - `allowsOther`: free text only when `allowFreeformInput` is `true`"
  - "[code://src/resources/sessions/Parts.tsx#L230](../../src/resources/sessions/Parts.tsx#L230) - the card drawn as a part of its turn"
  - "[code://src/resources/sessions/Page.tsx#L172](../../src/resources/sessions/Page.tsx#L172) - the card of a question the session waits on, drawn at the end of the running turn"
  - "[code://src/style/app.css#L2186](../../src/style/app.css#L2186) - `.web-ask`, the card's styles"
  - npm://@microsoft/agent-host-protocol@1.0.0 - `ChatInputSingleSelectQuestion.allowFreeformInput` and `ChatInputMultiSelectQuestion.allowFreeformInput`, both optional
  - https://github.com/microsoft/vscode/blob/e646868227c/src/vs/workbench/contrib/chat/browser/agentSessions/agentHost/stateToProgressAdapter.ts#L259-L287 - VS Code reads an absent `allowFreeformInput` as `true` on a select question, and offers no free text on a boolean one
  - https://github.com/softov/ahpapp/blob/fe15bff/src/components/PendingBlock.tsx#L183-L230 - ahpapp's card head: its words and a chevron that fold the card, and a button to the composer
  - https://github.com/softov/ahpapp/blob/fe15bff/src/components/PendingBlock.tsx#L552-L581 - ahpapp offers *or say it in words* on every select question, whatever the flag says
  - https://github.com/softov/ahpapp/blob/fe15bff/app/session.tsx#L2149-L2198 - ahpapp docks the card where the composer is, and *Waiting on you · Answer* brings it back
  - https://github.com/softov/ahpapp/blob/fe15bff/src/i18n/en.ts#L974-L987 - ahpapp's words: *Waiting on you · A question*, *Fold*, *Open*, *Write a message instead*, *Waiting on you · Answer*
---

# A question folds and takes words

Softov wants ahpw's question card to work like ahpapp's.
A person can fold the card to one line and open it again.
A select question offers a box to answer in words, as ahpapp's *or say it in words* does.
He asked for this on 2026-11-09, with screenshots of the same question in ahpw and in ahpapp.

## What others do

**ahpapp** draws the question as a card in the dock, where the composer is, at [`session.tsx`](https://github.com/softov/ahpapp/blob/fe15bff/app/session.tsx#L2149-L2198).

- The card's head reads *Waiting on you · A question*, with a chevron. A click on the head folds the card to that line, and a second click opens it.
- A button on the head, *Write a message instead*, shows the composer in place of the card.
- While the composer shows, a line over it reads *Waiting on you · Answer ›*, and a click brings the card back.
- Every select question has a box under its options. It reads *or say it in words*, or *or add an answer of your own* on a multi-select question.
  ahpapp offers the box whatever `allowFreeformInput` says, at [`PendingBlock.tsx`](https://github.com/softov/ahpapp/blob/fe15bff/src/components/PendingBlock.tsx#L552-L581).

**VS Code** reads an absent `allowFreeformInput` as `true` on a select question, at [`stateToProgressAdapter.ts`](https://github.com/microsoft/vscode/blob/e646868227c/src/vs/workbench/contrib/chat/browser/agentSessions/agentHost/stateToProgressAdapter.ts#L259-L287).
Only a flag set to `false` takes the free text away. A boolean question has no free text.

## What ahpw has today

- The card is a part of its turn, in the chat, at [`Parts.tsx`](../../src/resources/sessions/Parts.tsx#L230).
  A question the session waits on that no part holds shows at the end of the running turn, at [`Page.tsx`](../../src/resources/sessions/Page.tsx#L172).
- The card's head reads *The agent asks*, with the pages of a request that asks more than one question. It has no fold, at [`Question.tsx`](../../src/resources/sessions/Question.tsx#L118-L234).
- The composer stays under the chat while the card waits. Its prompt reads *Queue a message for later, or steer the current turn*.
- The *Other* box shows only when `allowFreeformInput` is `true`, at [`answer.ts`](../../src/resources/sessions/answer.ts#L29-L31).
  A host that leaves the flag out gets no *Other* box, so its question has no way to answer in words.
- On 2026-11-09, a Claude question through ahpd showed no *Other* box in ahpw, and showed *or say it in words* in ahpapp.

## Who writes

- No pull request of ahpw is open.
- No branch that is not merged changes `Question.tsx`, `answer.ts` or `Parts.tsx`.
- `sessions/header-summary` and `sessions/chat-filter` change `Page.tsx`, but not the line that draws the card.

## The change

Softov chose on 2026-11-09: the card stays in the chat and folds, and the box shows unless the host says `false`.

- The card stays in the chat, where it is today.
- The card's head folds the card to one line, and a second click opens it.
- The folded line says what waits: *Waiting on you · A question*, or the count of questions when there are more than one.
- A select question offers a box to answer in words unless `allowFreeformInput` is `false`, as VS Code does.
  A boolean question has no box, as in VS Code.
- The box's prompt reads *or say it in words*, and *or add an answer of your own* on a multi-select question.
- The words come from ahpw's catalog in en, es and pt.
