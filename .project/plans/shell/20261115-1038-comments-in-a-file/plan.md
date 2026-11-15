---
title: Comments in a file
domain: shell
status: active
priority: medium
created: 2026-11-15
revalidated: 2026-11-15
requires:
  - plans/shell/20261115-0832-people-edit-a-file-together/plan.md
changes: []
creates: []
refs:
  - git://108a3e7 - the commit of ahpw this plan was checked at
  - git://ce8c410 - the shared file branch this plan builds on
  - "file:///github/ahpd/.project/plans/host/20261115-1038-comments-on-a-resource/plan.md - the host side: `x-ahpd-annotations:<resource URI>`, its grants, the author stamp, ranges that move"
  - "[code://src/resources/files/FilePage.tsx](../../../../src/resources/files/FilePage.tsx) - the file page, which the shared page wraps on the branch"
  - "[code://src/bridges/data.ts](../../../../src/bridges/data.ts) - `follow`, a channel folded into the store, and `dispatchAndWait`"
  - "[code://src/shell/NameMark.tsx](../../../../src/shell/NameMark.tsx) - a person's colour and initials"
  - npm://@microsoft/agent-host-protocol@1.0.0 - `annotationsReducer` and the `Annotation` type
  - npm://@codemirror/view@^6.43.14 - marks for a comment's range, and a gutter for its line
  - https://github.com/microsoft/vscode/blob/171e90619c723a84a3e1c7bcd58d226698f55c72/src/vs/platform/agentHost/common/meta/vscode/agentFeedbackAnnotations.ts - the `vscode.agentFeedback` meta a comment carries
---

## Goal

A person selects text in a file and comments on it.
Others in the file, and an agent in a session on it, see the comment, reply, and resolve it.
Each comment stays on its words while the file is edited live.

## Reconnaissance

The files read and the patterns to reuse are the `refs` in the frontmatter, each with its note.

### Searches performed

- `rg "annotation" src` - ahpw draws no annotations; the hits are CodeMirror's own `Annotation`.
- `rg "follow\(" src/bridges` - a channel's state, folded by a reducer, lives in the store; `annotationsReducer` folds this one.

### Runtime path

```
FilePage -> follow x-ahpd-annotations:<file URI> with annotationsReducer -> comments in the store
-> marks on their ranges, threads in the margin
select text -> add -> annotations/set with the first entry and the vscode.agentFeedback meta
```

### Gaps

- Nothing draws a comment, a thread, or a commented range.
- Nothing writes `annotations/*`.

## Answers

| What | Source | Task |
| --- | --- | --- |
| The file page shows the file's own channel, `x-ahpd-annotations:<file URI>`, only; a session's review comments stay in its views | Softov, 2026-11-15, chose "The file's channel only" | 02 |
| A screenshot mockup comes first, and Softov approves it before the page code | Softov, 2026-11-15, chose "Mockup first" | 01 |
| Buttons are icons with a title | Softov, 2026-11-15, for the shared file page | 01, 04 |
| What a client adds carries VS Code's `vscode.agentFeedback` meta, `kind: user`, `state: submitted`, and each entry its `author: user`, so the agent's tools list it: they hide a comment still `created` | [`code://packages/sdk/src/tools/comments.ts`](https://github.com/ahpio/ahpd/blob/main/packages/sdk/src/tools/comments.ts) `listableComments` | 02 |
| An entry shows the person and the time from `_meta.ahpd`, which the host sets | the host plan's *Answers* | 04 |
| A resolved thread folds to one line; an outdated one says so | `(defaulted: the brief's drawing)` | 04 |
| A host that does not serve the channel shows no comments, and the file page works as before | `(defaulted: an older host)` | 02 |

## Proposed architecture

- **Data flow** - the page follows the comments channel; the store holds its state, folded by `annotationsReducer`.
- **Event flow** - add, reply, resolve and delete dispatch the spec's actions; each comes back through the channel to every page.
- **State flow** - a comment's range comes from the host, which moves it with each edit.
- **Layer responsibilities** - `src/resources/files/comments.ts`: the channel and the actions. `src/resources/editor/comments.ts`: marks and a gutter. `src/resources/files/Comments.tsx`: the margin.
- **Source-of-truth files** - [`code://src/resources/files/comments.ts`](../../../../src/resources/files/comments.ts) for what a comment carries.

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - A mockup of comments in a file](task-01-a-mockup-of-comments.md) | doing | - |
| [02 - The comments channel](task-02-the-comments-channel.md) | implemented | - |
| [03 - Commented ranges in the editor](task-03-commented-ranges.md) | implemented | 02 |
| [04 - Threads in the margin](task-04-threads-in-the-margin.md) | todo | 01, 03 |

## Risks and tradeoffs

- A narrow page has no room for a margin - the mockup shows where the threads go at 760 wide.
- A range is a line and a character - the editor turns it into offsets of its own text.

## Resume state

- **Done so far:** the mockup was sent on 2026-11-15; tasks 02 and 03 built on branch `shell/20261115-1038-comments-in-a-file`, stacked on the shared file branch.
- **Next action:** Softov approves the mockup; then [task-04-threads-in-the-margin.md](task-04-threads-in-the-margin.md).
- **Open questions:** none.
- **Watch out for:** the shared file page is on its branch, not on main; build on it.

## Final verification checklist

- [ ] Softov approved the mockup, and each screen matches it.
- [ ] Two browsers: a comment, a reply and a resolve in one show in the other.
- [ ] A comment stays on its words while the other browser types above it.
- [ ] An agent's reply shows with the agent as its author.
- [ ] `pnpm typecheck`, `pnpm test` and `pnpm build` pass.
