---
title: A message names the chosen custom agent
---

Plan: [a custom agent picker in both composers](../plans/composer/20261028-0951-a-custom-agent-picker/plan.md).

- [x] In a Claude Code session, choose Explore with the Agent pill and send a message.
- [x] Check that the frame of `chat/turnStarted` carries `agent.uri`.
- [x] Check that Explore answers, not the harness default.
- [ ] After the message sent with Explore, check that the Agent pill still shows Explore, as VS Code does. Softov found it showing *Agent* on 2026-11-23; the pill now falls back to the agent of the chat's latest turn.

The check starts an agent run, so it waits for Softov.
