---
title: The card shows what GitHub says
status: todo
depends: [task-01-a-mockup-of-the-pull-request-card.md, task-02-the-list-reads-each-pull-requests-details.md]
layer: "sessions"
refs:
  - "[code://src/resources/sessions/PullRequests.tsx](../../../../src/resources/sessions/PullRequests.tsx) - `PullRequestPill`, `PullRequestCard` and `MergedBanner`"
  - "[code://src/resources/sessions/composer-commands.ts#L481-L512](../../../../src/resources/sessions/composer-commands.ts#L481-L512) - `/session.pr`, its rows and its header"
  - "[code://src/resources/sessions/pull-requests.css](../../../../src/resources/sessions/pull-requests.css) - the card's styles"
  - npm://@softov/scena@0.6.2 - `Card`, `Badge`, `Avatar`, `Markdown`
---

## Objective

`PullRequestCard` draws the approved mockup, and the pill and `/session.pr` show GitHub's title and state for each pull request.

## Files

- `UPDATE: src/resources/sessions/PullRequests.tsx` - the card as the mockup draws it.
- `UPDATE: src/resources/sessions/pull-requests.css` - the card's styles, beside the component.
- `CREATE: src/resources/sessions/PullRequests.test.tsx` - the card's cases.
- `UPDATE: src/resources/sessions/composer-commands.ts:481-512` - each row of `/session.pr` with GitHub's title and state.
- `UPDATE: src/i18n/en.json` - the new strings: draft, opened on a date, the author's line, and the rest on GitHub.
- `UPDATE: src/i18n/es.json` - the same strings in Spanish.
- `UPDATE: src/i18n/pt.json` - the same strings in Portuguese.

## Steps

1. List scena's exports, and use `Card`, `Badge`, `Avatar` and `Markdown` where the mockup has their shapes.
2. Draw the header line: the repository and the opening date.
3. Draw the title and number as a link to GitHub, and the state badge with draft.
4. Draw the description with `Markdown`, and the link to the rest when `bodyTruncated` is true.
5. Draw `base ← head` and the author with the avatar.
6. Leave out a part whose field the host did not send.
7. Give each row of `/session.pr` GitHub's title and the state's colour.
8. Write each new string in `en`, `es` and `pt`, short and plain.
9. Compare each screen with the approved mockup, at 1280 and 760 wide, light and dark.

## Validation

- `src/resources/sessions/PullRequests.test.tsx`: "draws the card with every part the host sent".
- `src/resources/sessions/PullRequests.test.tsx`: "draws no empty part for a field the host did not send".
- `src/resources/sessions/PullRequests.test.tsx`: "links to the rest of a cut description".
- `pnpm typecheck` and `pnpm test` pass.
- Screenshots of each state match the approved mockup.

## Resume

