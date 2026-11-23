---
title: The pull request card shows what GitHub says - implemented
date: 2026-11-22
refs:
  - git://7ec5aed - the merge of ahpw #98
  - "[code://src/resources/sessions/pull-requests.ts](../../../../src/resources/sessions/pull-requests.ts) - `detailsOf` and `pullRequestsOf`"
  - "[code://src/resources/sessions/PullRequests.tsx](../../../../src/resources/sessions/PullRequests.tsx) - the card"
  - "[code://src/resources/sessions/pull-request-icons.tsx](../../../../src/resources/sessions/pull-request-icons.tsx) - the four state icons"
---

A session's pull request card shows what GitHub says of each pull request, as the approved mockup draws it.
The details come from the host.

## What was built

- [`code://src/resources/sessions/pull-requests.ts`](../../../../src/resources/sessions/pull-requests.ts) - `detailsOf`, merged into each pull request after the artifacts.
- [`code://src/resources/sessions/PullRequests.tsx`](../../../../src/resources/sessions/PullRequests.tsx) - the card, with its styles in `pull-requests.css`.
- [`code://src/resources/sessions/pull-request-icons.tsx`](../../../../src/resources/sessions/pull-request-icons.tsx) - the four state icons, as inline SVG in the theme's colour.

## Verified

- `pull-requests.test.ts` covers the new key, and `PullRequests.test.tsx` the card's cases.
- The ahpd plan this one required, `host/20261116-1714-each-pull-request-carries-githubs-details`, is built.

## Departures from the plan

- A pull request the host sent details for, but that `_meta.github` and the artifacts do not list, is not added.
- A `/session.pr` row takes each icon as a `data:` URI, since a picker row takes an image.

## Left for later

- None.
