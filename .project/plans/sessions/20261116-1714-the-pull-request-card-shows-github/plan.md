---
title: The pull request card shows what GitHub says
domain: sessions
status: planned
priority: high
created: 2026-11-16
revalidated: 2026-11-16
requires:
  - file:///github/ahpd/.project/plans/host/20261116-1714-each-pull-request-carries-githubs-details/plan.md
refs:
  - git://28d47ef - the commit of ahpw this plan was checked at
  - git://52a2537 - the build of 2026-11-09 that drew the pill and `/session.pr` with the agent's labels only
  - "[code://src/resources/sessions/pull-requests.ts#L1-L187](../../../../src/resources/sessions/pull-requests.ts#L1-L187) - `PullRequest` and `pullRequestsOf`, which read `_meta.github` and the artifacts"
  - "[code://src/resources/sessions/PullRequests.tsx#L24-L43](../../../../src/resources/sessions/PullRequests.tsx#L24-L43) - `PullRequestCard`, a link and a list of repository, status and branches"
  - "[code://src/resources/sessions/composer-commands.ts#L481-L512](../../../../src/resources/sessions/composer-commands.ts#L481-L512) - `/session.pr`, which shows the card as the header of a pull request's list"
  - "[code://src/i18n/en.json#L1687-L1714](../../../../src/i18n/en.json#L1687-L1714) - the pull request strings, with `es.json` and `pt.json` beside it"
  - npm://@softov/scena@0.6.2 - `Card`, `Badge`, `Avatar`, `Markdown` and `DetailList`, to reuse before any new component
  - https://github.com/microsoft/vscode/blob/6e68549edb69380c9316e49df5d3795d5064a2b0/src/vs/workbench/contrib/sessions/browser/github/pullRequestHover.ts - VS Code's pull request card, the model for the mockup
---

## Goal

Each pull request of a session shows VS Code's card.
The card shows the repository, the date, the title and number, the state, the description, `base ← head` and the author.
Softov asked for it on 2026-11-09, and the build of that day drew only the agent's label and one state.
On 2026-11-16, #349 kept showing no state after its merge, and #344 showed the agent's label in place of its title.
ahpd sends the details under `_meta['ahpd.pullRequests']`, in its plan `host/20261116-1714-each-pull-request-carries-githubs-details`.

## Reconnaissance

The files read and the patterns to reuse are the `refs` in the frontmatter, each with its note.

### Searches performed

- `rg "pullRequestsOf|PullRequestCard|PullRequestPill|MergedBanner" src` - the composer, the artifact list and `/session.pr` read the list; the card shows only in `/session.pr`.
- `ls node_modules/@softov/scena/dist/ui/display` - scena has `Card`, `Badge`, `Avatar`, `Markdown`, `DetailList` and `StatusDot`.

### Runtime path

```
ahpd session/metaChanged -> summary._meta['ahpd.pullRequests'] -> pullRequestsOf(meta)
  -> PullRequestPill (state colour, hover title) and /session.pr (PullRequestCard per pull request)
```

### Gaps

- `pullRequestsOf` takes a state only for `pullRequestStateUrl`, and the branches from the session folder's `_meta.git`.
- `PullRequest` has no author, description, dates or draft.
- `PullRequestCard` has no description, author, date or state badge.

## Answers

| What | Source | Task |
| --- | --- | --- |
| The card shows the repository, the date, the title and number, the state, the description, `base ← head` and the author | Softov, 2026-11-09 and 2026-11-16, with VS Code's card | 01, 03 |
| A mockup comes first, and Softov approves it before the card code | (defaulted: every ahpw UI plan starts from a mockup he approves) | 01 |
| The card is drawn as `.scratch/mockups/pull-request-card.html`, from VS Code's card in his screenshot of 2026-11-16 | Softov, 2026-11-16: "Approve as drawn" | 03 |
| `ahpd.pullRequests` wins over `_meta.github` and the artifact for state, title and branches; the artifact keeps its id | (defaulted: GitHub's words over the agent's label) | 02 |
| With no entry in `ahpd.pullRequests`, a pull request shows what it shows today | (defaulted: a daemon before the ahpd plan sends no details) | 02 |
| The description is plain text: Markdown marks removed, white space joined, cut at 200 characters with `…` | Softov, 2026-11-16: "Plain text, as VS Code" | 03 |
| The author line is `@login opened this pull request`, with no avatar | Softov, 2026-11-16: "No avatar, as VS Code" | 03 |
| A cut description adds no link; the number in the title opens GitHub | Softov, 2026-11-16: "No extra link, as VS Code" | 03 |
| `/session.pr` keeps today's flow: a row opens the list with the card as its header, and the actions as items | Softov, 2026-11-16: "Keep today's flow" | 03 |
| Each state has its own icon, as the mockup and VS Code, on the card, the pill and the rows | Softov, 2026-11-16: "Four icons, as the mockup" | 03 |

## Proposed architecture

- **Data flow** - `pullRequestsOf` reads `ahpd.pullRequests` by URL key and fills each `PullRequest`. Every view reads `PullRequest` only.
- **Event flow** - Unchanged: a `_meta` move renders the composer again.
- **State flow** - None held in ahpw; the host's `_meta` is the source.
- **Layer responsibilities** - `pull-requests.ts`: read and merge · `PullRequests.tsx`: draw · i18n: the strings in `en`, `es` and `pt`.
- **Source-of-truth files** - [`code://src/resources/sessions/pull-requests.ts`](../../../../src/resources/sessions/pull-requests.ts).

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - a mockup of the pull request card](task-01-a-mockup-of-the-pull-request-card.md) | done | - |
| [02 - the list reads each pull request's details](task-02-the-list-reads-each-pull-requests-details.md) | implemented | - |
| [03 - the card shows what GitHub says](task-03-the-card-shows-what-github-says.md) | implemented | 01, 02 |

## Risks and tradeoffs

- A long description fills the header of `/session.pr` - the mockup sets its height, and the rest scrolls or links to GitHub.
- An avatar is an image from GitHub - drawn with scena's `Avatar`, with the login's initials when it does not load.

## Resume state

- **Done so far:** task 01 approved, and tasks 02 and 03 built on 2026-11-16 on branch `sessions/20261116-1714-the-pull-request-card-shows-github`, awaiting review.
- **Next action:** Softov reviews the PR; the check by hand waits for the ahpd plan's merge.
- **Open questions:** none.
- **Watch out for:**
  - Build against the approved mockup, and stop and ask at any difference.
  - Reuse scena's components; styles go beside the component, never in `app.css`.
  - The ahpd plan must be merged before the check by hand; the unit cases use fixtures.

## Final verification checklist

- [ ] `pnpm typecheck` and `pnpm test` pass.
- [ ] Each state of the approved mockup matches the built card, at 1280 and 760 wide, light and dark.
- [ ] On the test daemon with the ahpd plan merged, a session records a merged pull request of another branch.
  The card shows it merged, with GitHub's title, author and description.
