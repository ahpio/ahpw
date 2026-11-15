---
title: The comments channel
status: implemented
depends: []
layer: "files"
refs:
  - "[code://src/bridges/data.ts](../../../../src/bridges/data.ts) - `follow` and `dispatchAndWait`"
---

## Objective

A file page holds the file's comments, and adds, replies, resolves and deletes them with the spec's actions.

## Files

- `CREATE: src/resources/files/comments.ts` - follow the channel; build each action with its meta.
- `CREATE: src/resources/files/comments.test.ts` - the actions built, and a state folded.

## Steps

1. Follow `x-ahpd-annotations:<file URI>` with the protocol's `annotationsReducer`.
2. Build `annotations/set` for a new comment: the range, the first entry, and the `vscode.agentFeedback` meta with `kind: user` and `state: submitted`.
3. Set `origin.session` to the channel's URI, since a file page is in no session.
4. Build `annotations/entrySet` for a reply, with `author: user` in the entry's meta.
5. Build `annotations/updated` with `resolved` for resolve and reopen, and `annotations/removed` for delete.
6. Send each with `dispatchAndWait`, and show the host's reason when it refuses one.
7. When the host refuses the subscribe, hold no comments and change nothing else.

## Validation

- `src/resources/files/comments.test.ts`: each action has the shape the spec and the agent's tools read.
- The same file: the reducer folds a set, an entry, a resolve and a remove.
- `pnpm test src/resources/files/comments.test.ts` passes.

## Resume

Built on 2026-11-15.
- A person's comment is `state: submitted`, not `created`: the agent's comment tools hide a `created` one, which VS Code keeps for a comment not sent yet.
- A page reads the channel with `useChannel(host, commentsChannel(file), annotationsReducer)`; `comments.ts` builds the actions only.
