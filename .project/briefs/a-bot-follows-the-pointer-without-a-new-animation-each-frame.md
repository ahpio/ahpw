---
title: A bot follows the pointer without a new animation each frame
created: 2026-11-21
refs:
  - git://79c6f333489de6349206903145b1c3b2a1e6d08c - the commit of this repository the facts were checked at
  - git://f90a61674151ad2a55aeb185f4ec60285ce75ded - the commit of cofold the bood facts were checked at, bood 0.3.0
  - npm://@cofold/bood@^0.2.1 - the range ahpw asks for; 0.2.1 is installed
  - "[code://src/resources/bots/Bood.tsx#L179-L183](../../src/resources/bots/Bood.tsx#L179-L183) - `face`, which plays a new `pose` under the key `pose`"
  - "[code://src/resources/bots/Bood.tsx#L188-L204](../../src/resources/bots/Bood.tsx#L188-L204) - `follow`, which calls `face` once per animation frame while the pointer moves"
  - "[code://src/resources/bots/Bood.tsx#L216-L221](../../src/resources/bots/Bood.tsx#L216-L221) - the one pointer listener every moving bot shares"
  - "[code://src/shell/dock/DockLayer.tsx#L503](../../src/shell/dock/DockLayer.tsx#L503) - each docked bot is a moving `Bood`"
  - "[code://src/resources/bots/Page.tsx#L54](../../src/resources/bots/Page.tsx#L54) - a bot's page draws a moving `Bood`"
  - "[code://src/resources/bots/chat/BotChat.tsx#L122](../../src/resources/bots/chat/BotChat.tsx#L122) - a bot's chat draws a moving `Bood`"
  - https://github.com/softov/cofold/blob/f90a61674151ad2a55aeb185f4ec60285ce75ded/packages/bood/src/dom.ts#L194-L240 - `play`, which calls `element.animate` once per moved layer
  - https://github.com/softov/cofold/blob/f90a61674151ad2a55aeb185f4ec60285ce75ded/packages/bood/src/motion/pose.ts#L220-L236 - the layers a pose moves
  - https://github.com/softov/cofold/blob/f90a61674151ad2a55aeb185f4ec60285ce75ded/packages/bood/src/motion/pose.ts#L254-L260 - `pose`, a move from one pose to another over `ms`
  - file:///home/softov/tmp/Trace-20261121T141944.json - Softov's Chrome trace of 2026-11-21, development build
  - https://developer.mozilla.org/en-US/docs/Web/API/KeyframeEffect/setKeyframes - changes the keyframes of an animation that already plays
  - https://developer.mozilla.org/en-US/docs/Web/API/Element/animate - each call makes a new `Animation`
---

# A bot follows the pointer without a new animation each frame

Softov wants a bot's head to follow the pointer at less cost to the page.
Today each frame of pointer motion starts a new set of Web Animations for each moving bot.
The goal is that following the pointer makes no new `Animation` per frame, and that no React render takes part in it.
The bot keeps the look it has now: the same turn, lift, ease and reach.

## What others do

- The Web Animations API changes a running animation in place with [`KeyframeEffect.setKeyframes`](https://developer.mozilla.org/en-US/docs/Web/API/KeyframeEffect/setKeyframes), so a follow can keep one `Animation` per layer.
- An element that follows a pointer is often moved by a direct write of `style.transform` in a `requestAnimationFrame`, with the ease done in script.
- ahpapp, which ahpw follows for the bot's life, is not checked for how it turns the head.

## What ahpw has today

- The figure is drawn and moved outside React already. `Bood` mounts it once in a layout effect, and every move goes through the `BoodView` handle, as [`code://src/resources/bots/Bood.tsx#L86-L99`](../../src/resources/bots/Bood.tsx#L86-L99) shows.
- One shared `pointermove` listener feeds every moving bot, as [`code://src/resources/bots/Bood.tsx#L39-L50`](../../src/resources/bots/Bood.tsx#L39-L50) shows.
- On each animation frame with a new pointer point, `follow` calls `face(gazeAt(...), 200)`.
- `face` plays `pose(kind, mood, next, from, 200)` under the key `pose`, so bood cancels the last pose and starts a new one.
- A pose moves up to nine layers: `face`, `pupils`, `glints`, `pupilL`, `pupilR`, `mouth`, `antenna`, `body` and `look`.
- bood's `play` makes one `Animation` per moved layer with `element.animate`, with `composite: "add"`.
- So one bot makes up to nine new `Animation` objects per frame while the pointer moves, about 540 a second at 60 frames a second.
- Each moving bot on the page does the same: the docked bots, a bot's page and a bot's chat.

## What the trace shows

The trace is a development build with DevTools open, so React's share is larger than in a production build.

| Measure | Value |
|---|---|
| Repeating tasks of about 65 ms while the pointer moved | 16 |
| Their time in `face` | 352 ms of the 16 tasks, about 22 ms per task |
| Of that, in the browser's `animate` | 346 ms |
| Their time in React's development tasks | about 77% |

The React part of those tasks is mostly `SessionView` drawn again, which is not the bot.
The bot part is the `animate` calls, not a React render.

## Who writes

- `src/resources/bots/Bood.tsx` has no open branch in ahpw at the checked commit.
- cofold has an uncommitted change by another session, a deleted `.project/pending/mcp-client-first-publish.md`, which does not touch bood.
- ahpw installs bood 0.2.1, and cofold's `main` is at 0.3.0. A change to bood's `dom.ts` ships in a bood release after 0.3.0, so ahpw moves up two versions.

## The change

- A moving bot keeps one set of animations for its head while it follows the pointer, or writes the head's transform with no animation.
- A new pointer point changes where the head goes; it does not cancel and start animations.
- The ease toward the pointer stays at about 200 ms, as `face` gives it today.
- A glance, a wander, a tilt and an act still play as bood moves, as today.
- A bot with `still`, or with reduced motion asked for, is not changed.
- No React state changes while the pointer moves.

## Open points

- Where the follow lives: a bood API such as `view.aim(pose)` that keeps the animations, or ahpw code that writes the transforms. A bood API helps every bood user, and cofold is then built first.
- Whether `composite: "add"` with a glance and a breath under way holds with `setKeyframes`, or a held transform with no animation is simpler. This is not checked in a browser.
- Whether a cheaper rate is enough: a new pose only when the gaze moves by more than a threshold. This keeps today's code and cuts the count, but does not remove it.
- The cost in a production build is not measured.
