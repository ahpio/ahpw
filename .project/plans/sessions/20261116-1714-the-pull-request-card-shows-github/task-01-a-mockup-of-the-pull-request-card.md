---
title: A mockup of the pull request card
status: done
depends: []
layer: "sessions"
refs:
  - "[code://src/resources/sessions/PullRequests.tsx#L24-L43](../../../../src/resources/sessions/PullRequests.tsx#L24-L43) - the card today"
  - https://github.com/microsoft/vscode/blob/6e68549edb69380c9316e49df5d3795d5064a2b0/src/vs/workbench/contrib/sessions/browser/github/pullRequestHover.ts - VS Code's card
---

## Objective

Softov approves a mockup of the pull request card before the card code.

## Files

- `CREATE: .scratch/mockups/pull-request-card.html` - the states, at two widths, in both themes.

## Steps

1. Start from VS Code's card in Softov's screenshot of 2026-11-16.
2. Draw the card's header: the repository, the date, the title and number, and the state badge.
3. Draw the card's body: the description, `base ← head`, and the author with an avatar.
4. Draw an open, a draft, a merged and a closed pull request.
5. Draw a long description that ahpd cut, with its link to GitHub.
6. Draw a pull request with no details yet, as it shows today.
7. Draw `/session.pr` with two pull requests, each row with GitHub's title and its state.
8. Draw the pill's hover with one pull request.
9. Show each state at 1280 and 760 wide, in light and dark, and send the screenshots to Softov.
10. Record his approval as a row in the plan's *Answers*.

## Validation

- Softov approves the mockup.

## Resume

Done on 2026-11-16. The mockup is `.scratch/mockups/pull-request-card.html`, with `pull-request-card.mjs` for the screenshots, in the worktree `/github/ahpw.worktrees/pr-card`. Softov approved it as drawn, with plain text, no avatar and no extra link.

