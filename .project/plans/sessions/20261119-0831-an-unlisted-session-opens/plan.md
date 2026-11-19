---
title: An unlisted session opens
domain: sessions
status: built
priority: high
created: 2026-11-19
revalidated: 2026-11-19
refs:
  - git://9603ada - the commit of ahpw this plan was checked at
  - "[code://src/resources/sessions/Page.tsx#L284-L289](../../../../src/resources/sessions/Page.tsx#L284-L289) - the page finds its session's row in the session list only"
  - "[code://src/resources/sessions/Page.tsx#L434](../../../../src/resources/sessions/Page.tsx#L434) - a session the list lacks is said to no longer exist"
  - "[code://src/resources/bots/catalogue.ts#L163-L175](../../../../src/resources/bots/catalogue.ts#L163-L175) - Open chat makes a bot chat with no message, and opens it"
  - https://github.com/ahpio/ahpd/blob/b7f65ccfa/packages/sdk/src/host/catalogue.ts#L1690-L1708 - ahpd lists no session that has no turn yet, as VS Code's host lists no idle provisional session
---

## Goal

A session the host holds and does not list yet opens on its own page. On 2026-11-19 Softov clicked Open chat on the bot Gumbo. ahpw made a bot chat with no message and opened it. The page said the session no longer existed. The host lists a session from its first turn, so a person never got to send that turn. New session was refused, because the empty session is Softov's talk with Gumbo.

## Reconnaissance

The files read and the patterns to reuse are the `refs` in the frontmatter, each with its note.

- On ahpd's test daemon, a `bot-chat` session made with `createSession` and no message was absent from `listSessions`. A second create was refused naming it.
- The session's own state reads fine: its snapshot has `turns: []`.
- A first message to such a session is its first turn, and the host lists it from then on.

### Gaps

- The page reads a session's row from the session list alone.

## Answers

| What | Source | Task |
| --- | --- | --- |
| ahpw shows the empty session, and the first message continues it | Softov, 2026-11-19: "ahpw shows the empty session" | 01 |
| ahpd's bot plugin keeps the empty session as the person's talk, with no change | Softov, 2026-11-19, the same answer | - |
| A second chat with a bot stays refused with its error, with no redirect | Softov, 2026-11-19: "No, keep the error" | - |
| A row the list lacks is built from the session's metadata, with no times | (defaulted: the state carries no times) | 01 |
| The page says "Loading" while the session is read, and "gone" only once the read answered with none | (defaulted: a slow read is not a gone session) | 01 |

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - the page reads an unlisted session](task-01-the-page-reads-an-unlisted-session.md) | done | - |

## Risks and tradeoffs

- An unlisted session's header shows no times until the host lists it.

## Resume state

- **Done so far:** task 01, merged in #103 as `0bbaed8`, and checked by Softov on 2026-11-19. See [implemented.md](implemented.md).
- **Next action:** none.
- **Open questions:** none.
- **Watch out for:** the session list still lacks the session until its first turn, as ahpd lists it.

## Final verification checklist

- [x] Open chat on Gumbo opens the empty chat, with no "no longer exists".
- [x] A first message there gets Gumbo's answer, and the session joins the session list.
- [x] `pnpm typecheck` and the test suite pass.
