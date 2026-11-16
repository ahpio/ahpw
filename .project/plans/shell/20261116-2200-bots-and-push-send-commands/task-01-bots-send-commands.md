---
title: Bots send commands
status: implemented
depends: []
layer: "bots"
refs:
  - "[code://src/resources/bots/catalogue.ts](../../../../src/resources/bots/catalogue.ts) - the reducer, the writes and the talk"
---

## Objective

The bot channel is read as `{ records }` or `{ bots }`, and a bot is made, edited and removed with `x-ahpd/bots/put` and `/remove` when the host lists them.
The talk comes from the record where the host sends records.

## Files

- `UPDATE: src/resources/bots/catalogue.ts` - `botsIn`, `sendsTalks`, the reducer for both shapes, the commands in `makeBot`, `editBot` and `deleteBot`, and `talks` on `readBotChat` and `openBotChat`.
- `UPDATE: src/resources/bots/Page.tsx` - read the bots through `botsIn`.
- `UPDATE: src/resources/bots/Explorer.tsx` - read the bots through `botsIn`.
- `UPDATE: src/resources/bots/Edit.tsx` - read the bots through `botsIn`.
- `UPDATE: src/resources/bots/index.ts` - read the bots through `botsIn`, and pass `sendsTalks` to `openBotChat`.
- `UPDATE: src/resources/bots/layer/BotPopover.tsx` - pass `sendsTalks` to `readBotChat`.
- `UPDATE: src/shell/dock/DockLayer.tsx` - read the bots through `botsIn`.
- `UPDATE: src/resources/bots/catalogue.test.ts` - both shapes, the commands, and a talk with no read.

## Steps

1. Write `botsIn` and `sendsTalks` in `catalogue.ts`.
2. Fold `{ id, record }` and `{ bot }` in `botsReducer`, and keep `talks` when the host sent records.
3. Send `x-ahpd/bots/put` and `/remove` from `makeBot`, `editBot` and `deleteBot` when `offers.methods` lists them.
4. Answer the record's `session` in `readBotChat` when `talks` is true.
5. Read the bots through `botsIn` in every reader of the channel.

## Validation

- `catalogue.test.ts`: both shapes fold; `sendsTalks`; the commands and the resource fallback; a talk with no read.
- `pnpm test` passes.

## Resume

Built on 2026-11-16, after #96 merged.
