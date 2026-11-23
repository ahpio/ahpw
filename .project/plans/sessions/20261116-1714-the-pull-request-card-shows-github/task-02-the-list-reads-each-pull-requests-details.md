---
title: The list reads each pull request's details
status: done
depends: []
layer: "sessions"
refs:
  - "[code://src/resources/sessions/pull-requests.ts#L1-L187](../../../../src/resources/sessions/pull-requests.ts#L1-L187) - `PullRequest`, `githubPullRequests`, `recordedPullRequests` and `pullRequestsOf`"
  - "[code://src/resources/sessions/pull-requests.test.ts](../../../../src/resources/sessions/pull-requests.test.ts) - the list's cases"
---

## Objective

`pullRequestsOf` fills each pull request from `_meta['ahpd.pullRequests']`, so every view has GitHub's state, title, branches, author, description and dates.

## Files

- `UPDATE: src/resources/sessions/pull-requests.ts` - `PullRequest` gains the details, and `pullRequestsOf` reads the new key.
- `UPDATE: src/resources/sessions/pull-requests.test.ts` - the cases of the new key.

## Steps

1. Add a constant `PULL_REQUESTS_META = 'ahpd.pullRequests'`.
2. Add to `PullRequest`: `body`, `bodyTruncated`, `isDraft`, `author`, `createdAt`, `updatedAt`, `mergedAt` and `closedAt`, each optional.
3. Change the doc comments of `title`, `base` and `head`: GitHub's words when the host sent them.
4. Write `detailsOf(meta, url)` that reads the entry by `urlKey` and keeps only the fields of the right type.
5. In `pullRequestsOf`, merge each pull request with its entry; the entry wins for state, title and branches.
6. Keep the artifact's id on a recorded pull request.
7. Leave a pull request with no entry as it is today.
8. Keep `allMerged` and `chipState`; they now see each pull request's state.

## Validation

- `src/resources/sessions/pull-requests.test.ts`: "takes the state, title and branches GitHub sent over the agent's label".
- `src/resources/sessions/pull-requests.test.ts`: "shows a recorded pull request of another branch merged".
- `src/resources/sessions/pull-requests.test.ts`: "keeps a pull request with no details as it was".
- `src/resources/sessions/pull-requests.test.ts`: "drops a field of the wrong type".
- `pnpm typecheck` and `pnpm test` pass.

## Resume

Built on 2026-11-16, awaiting review.

- `detailsOf` is exported, and `pullRequestsOf` merges it into each pull request after the artifacts.
- A pull request the host sent details for but that `_meta.github` and the artifacts do not list is not added.

