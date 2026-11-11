---
title: A session shows its context and its plan usage
created: 2026-11-04
refs:
  - git://acdcdb1 - the commit of this repository the facts were checked at
  - git://e938d751 - the commit of ahpd the host facts were checked at
  - "[code://src/resources/sessions/footer.ts#L15-L27](../../src/resources/sessions/footer.ts#L15-L27) - `contextReadout`, the one context figure ahpw shows: the last turn's input over the model's window"
  - "[code://src/resources/usage/index.ts#L17](../../src/resources/usage/index.ts#L17) - the Usage section, which shows ahpd's own pools and limits, not a provider's plan"
  - "[code://src/resources/connectors/ConnectorForm.tsx](../../src/resources/connectors/ConnectorForm.tsx) - where a Claude login shows today: a connector of the adapter `claude-login`"
  - npm://@anthropic-ai/claude-agent-sdk@0.3.301 - `Query.getContextUsage()`, `Query.usage_EXPERIMENTAL_MAY_CHANGE_DO_NOT_RELY_ON_THIS_API_YET()` and `SDKRateLimitInfo`, in `sdk.d.ts`
  - npm://@earendil-works/pi-coding-agent@1.3.0 - `AgentSession.getContextUsage()`, which gives a total, a window and a percentage
  - https://github.com/microsoft/vscode/blob/289eaeb2b9d3eaa4b7f2bcb68acb0f4e22a8d5a9/src/vs/platform/agentHost/common/meta/vscode/agentUsageMeta.ts#L106-L160 - `UsageInfoMeta`, VS Code's well-known keys on `UsageInfo._meta`, with `quotaSnapshots` and `contextAttribution`
  - https://github.com/microsoft/vscode/blob/289eaeb2b9d3eaa4b7f2bcb68acb0f4e22a8d5a9/src/vs/platform/agentHost/common/state/sessionState.ts#L279-L297 - `IContextAttributionData`, one entry per source in the context window
  - https://github.com/microsoft/vscode/blob/289eaeb2b9d3eaa4b7f2bcb68acb0f4e22a8d5a9/src/vs/workbench/contrib/chat/browser/agentSessions/agentHost/stateToProgressAdapter.ts#L964-L1050 - VS Code's chat view turns `contextAttribution` into its context widget, for any provider
  - https://github.com/microsoft/vscode/blob/289eaeb2b9d3eaa4b7f2bcb68acb0f4e22a8d5a9/src/vs/platform/agentHost/common/meta/README.md#L14 - "context occupancy is not quota": the two are separate facts
  - https://github.com/microsoft/agent-host-protocol/blob/v1.0.0/types/common/state.ts - `UsageInfo`, with input, output and cache-read tokens, a model and `_meta`
---

# A session shows its context and its plan usage

Softov wants ahpw to show what the Claude app shows in its Usage sheet.
Claude comes first, and the other agents follow where they can say it.
The sheet has two parts: what fills a session's context window, and how much of the account's plan is used.
The context part lists each source with its tokens and share, such as messages, system tools, memory files, skills and free space.
The plan part shows the current session window and the weekly window, each with a percentage and the time it resets, and the usage credits.
He sent screenshots of that sheet on 2026-11-04. ahpw draws only what ahpd sends, so this brief also says what ahpd must send.

## What others do

- **The Claude app** shows the sheet that Softov sent. Its context window has a bar and a row for each category. The deferred tool schemas stand apart, and the MCP tools and custom agents show as counts. Under it are the current session (5 hours), the weekly limit for all models, limit resets, and usage credits with a balance. A last line says if the plan lasts to its renewal.
- **The Claude Agent SDK 0.3.301** gives both parts on a running query:
  - `getContextUsage()` answers the total, the window, a percentage and one row per category. Each row has a `kind` of `used`, `free`, `buffer` or `deferred`. The answer also lists MCP tools, memory files, agents and skills, each with tokens.
  - `usage_EXPERIMENTAL_MAY_CHANGE_DO_NOT_RELY_ON_THIS_API_YET()` answers the plan's windows: `five_hour`, `seven_day`, the per-model weekly windows, and `extra_usage` with the credits. Each window has a `utilization` from 0 to 100 and a `resets_at`. Its name says that it can change in any release. It is `null` for an API key, Bedrock or Vertex.
  - The stream sends `rate_limit_event` frames. Each has the `status`, the `rateLimitType`, a `utilization` and a `resetsAt` for one window, with the overage state.
- **VS Code** puts both facts on `UsageInfo._meta` as well-known keys. `contextAttribution` is a list of entries with a kind, a label and tokens. `quotaSnapshots` is keyed by quota type, such as `session` and `weekly`, with the remaining percentage and a reset date. Both come from the Copilot SDK. Its README says that context occupancy is not quota, so the two stay separate facts.
  VS Code's chat view draws `contextAttribution` for any provider, with the kinds `system`, `toolDefinition`, `tool`, `skill`, `subagent`, `mcpServer` and `plugin`.
  It counts the tokens that no entry covers as "Messages".
  It does not read `quotaSnapshots` in an agent host session today; only its Copilot extension reads them.
- **pi 1.3.0** gives `getContextUsage()`: the tokens, the window and a percentage, with no categories and no plan.
- **ACP** sends `usage_update` with the context window's `used` and `size`, and a cost. It has no categories and no plan windows.

## What ahpw has today

- The session footer shows the last turn's input over the model's window, such as `12k / 200k`. It shows nothing when the model has no `maxContextWindow`.
- No view lists what fills the context window.
- The Usage section shows ahpd's own pools and limits. It shows no provider's plan.
- A Claude login shows as a connector of the adapter `claude-login`. Its page shows no plan usage.
- ahpw reads no `ahpd.context`, `ahpd.cost` or `ahpd.cacheWriteTokens` key from a turn's usage.

## What ahpd has today

- agent-claude does not call `getContextUsage()` or the SDK's usage request.
- agent-claude reads `rate_limit_event` only to know when a login is refused, and when to try it again.
  That is `limited`, at https://github.com/ahpio/ahpd/blob/e938d751/packages/agent-claude/src/session/logins.ts#L146-L149.
  It keeps no utilization and sends none to a client.
- Each result from Claude Code has `modelUsage`, and each model's entry has `contextWindow` and `maxOutputTokens`. ahpd does not read them.
- So no Claude model reports a `maxContextWindow`, and the footer of a Claude session shows nothing. Only pi sets it.
- `/autocompact` sets a smaller window for a model, such as 600k for Opus 5.5 with its limit of 1M. `getContextUsage()` measures against that autocompact window, as `raw_max_tokens`.
- A Claude turn's usage has `ahpd.cost` and `ahpd.cacheWriteTokens` in `_meta`.
- agent-acp puts `ahpd.context`, with `used` and `size`, on a turn's usage `_meta`.
- A Claude login is a connector of the adapter `claude-login`. The rate limits are the account's, so every session on that login shares them.

## What ahpd needs to send

- **The model's window.**
  Each Claude model gets the `maxContextWindow` that `modelUsage.contextWindow` gives, so the footer has the model's limit.
- **The context breakdown.**
  After a turn, agent-claude calls `getContextUsage()` and puts its answer on the turn's usage `_meta`.
  The key is `contextAttribution`, in VS Code's shape, so VS Code draws it too.
  The system prompt and the memory files are `system` entries, and the system tools are `toolDefinition`.
  The skills are `skill`, the custom agents `subagent` and the MCP tools `mcpServer`.
  The messages need no entry, because a reader counts what the entries leave as messages.
  The free space, the autocompact buffer and the deferred tools have no place in that shape, so they go in `ahpd.context` beside `used` and `size`.
  pi and ACP send `ahpd.context` only, with no entries.
- **The plan windows, by login.**
  The windows belong to the account, not to the session.
  ahpd keeps the last utilization and reset of each window for each `claude-login` connector, from `rate_limit_event` frames.
  It sends them as `quotaSnapshots` in VS Code's shape, keyed `session` and `weekly`, with the connector and on each turn's usage.
- **The full plan answer, when asked.**
  The SDK's usage request gives every window and the credits at once.
  ahpd asks for it after a turn ends, at most once a minute for each login, with `skipBehaviors` set.
  It is experimental, so ahpd reads it behind one function, and a change in the SDK touches one place.
- **No plan, said as such.**
  A login with an API key, Bedrock or Vertex has no plan windows.
  ahpd says that, and a client shows no empty bars.

## Who writes

- In ahpw, `footer.ts`, `sessions/Page.tsx` and the connector pages have no open branch. The tunnels work, #44, is merged.
- In ahpd, `agent-claude/src/session/query.ts`, `parts.ts` and `logins.ts` changed in #221 and #224, both merged. No open branch changes them now.

## The change

- A session gets a Usage view, opened from the context figure in its footer.
- The view has a Context part: a bar and one row per category, with tokens and a share.
  The bar fills against the autocompact window, and the model's limit shows as the ceiling. A total past the window shows as over it, as `over_limit` says. Deferred rows stand apart and count for nothing, as the Claude app shows them. The MCP tools, memory files, agents and skills open as lists.
- The view has a Plan part when the session's login has a plan.
  It shows each window with its bar, its percentage and the time it resets.
  It shows the credits when the account has them.
- The page of a `claude-login` connector shows the same Plan part, for the account across its sessions.
- An agent that sends only a total and a window gets the bar and no rows. An agent that sends nothing gets no view.
- ahpw draws the line about lasting to the renewal. It compares each window's percentage with the share of the window's time that has passed.

## Answers

Softov, 2026-11-04, took these answers.

- The two parts stay on `_meta`, with VS Code's keys `contextAttribution` and `quotaSnapshots`. If VS Code renames them, ahpw reads both names and the host sends both. There is no protocol proposal for now.
- The plan windows come from `rate_limit_event` frames all the time. The experimental usage request runs after a turn ends, at most once a minute for each login, with `skipBehaviors` set. No client request asks for it.
- ahpw draws the line about lasting to the renewal. The host sends no forecast.
- The free space, the autocompact buffer and the deferred tools go in `ahpd.context`, for ahpw only.
- The plan limits of Codex and Copilot are left for a later brief. ACP sends none today.
