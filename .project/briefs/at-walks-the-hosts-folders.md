---
title: At walks the host's folders
created: 2026-11-09
refs:
  - git://6a56371 - the commit of this repository the facts were checked at
  - "[code://src/resources/sessions/Composer.tsx#L191-L210](../../src/resources/sessions/Composer.tsx#L191-L210) - `mentions` in a session's composer, which asks the host's `completions` for each `@` word"
  - "[code://src/resources/sessions/New.tsx#L241-L261](../../src/resources/sessions/New.tsx#L241-L261) - `mentions` in the new session box, which walks the host's folders with `folderMentions`"
  - "[code://src/resources/sessions/folder-mentions.ts#L23-L55](../../src/resources/sessions/folder-mentions.ts#L23-L55) - `mentionQuery` and `folderMentions`: one folder at a time through `resourceList`, relative to the session's folder or absolute"
  - "[code://src/resources/sessions/attachments.ts#L27-L30](../../src/resources/sessions/attachments.ts#L27-L30) - `resourceAttachment`, which attaches a file or a folder"
  - "[code://src/resources/sessions/Attached.tsx](../../src/resources/sessions/Attached.tsx) - `AddButton`, whose *Files and folders* types `@`"
  - git://8060ecd9b - the commit of ahpd's main the host's `completions` was checked at
  - https://github.com/softov/ahpd/blob/8060ecd9b/packages/sdk/src/host/sessionmethods.ts#L666-L676 - ahpd answers an `@` word with `fileCompletions`, over the session's working directories
  - https://github.com/softov/ahpd/blob/8060ecd9b/packages/sdk/src/host/filecompletions.ts#L176 - `fileCompletions`, VS Code's file provider: every file listed by ripgrep, ranked by the Quick Open scorer, 50 at most
  - https://github.com/softov/ahpd/blob/8060ecd9b/packages/sdk/src/resources/workspacefiles.ts#L45 - `ripgrepFiles`, which runs `rg` from the path
  - https://github.com/microsoft/vscode/blob/e646868227c/src/vs/platform/agentHost/node/agentHostFileCompletionProvider.ts - VS Code's file provider, which ahpd follows
  - https://github.com/softov/ahpapp/blob/fe15bff/src/components/ContextSheet.tsx#L254-L282 - ahpapp's `@` walks the host's folders with `resourceList`, from the folder the field names
  - https://github.com/softov/ahpapp/blob/fe15bff/src/components/ContextSheet.tsx#L398-L404 - *Go back* and *Use this folder*, and when each shows
  - https://github.com/softov/ahpapp/blob/fe15bff/src/components/ContextSheet.tsx#L584-L630 - the two rows, drawn over the folder's entries
  - https://github.com/softov/ahpapp/blob/fe15bff/src/i18n/en.ts#L1685-L1686 - the rows' words: *Go back* and *Use this folder*
---

# At walks the host's folders

Softov wants `@` in a session's composer to walk the host's folders as ahpapp does, with a row to go back.
Today `@/` in a session shows *No matches*, and `@/home/softov/` lists nothing.
In ahpapp, the same text lists `/home/softov`, with *Go back* and *Use this folder* over its entries.
He asked for this on 2026-11-09, with a screenshot of each.

## What others do

**ahpapp** walks the host's folders itself, at [`ContextSheet.tsx`](https://github.com/softov/ahpapp/blob/fe15bff/src/components/ContextSheet.tsx#L254-L282).

- The `@` word in the field names the folder. The sheet lists that folder with `resourceList` on `ahp-root://`.
- With no path typed, the walk starts in the session's folder. An absolute path starts the walk there.
- A click on a folder writes its path into the field, so the field and the list always agree.
- A click on a file takes it and ends the walk.
- Two rows go over the folder's entries, at [`ContextSheet.tsx`](https://github.com/softov/ahpapp/blob/fe15bff/src/components/ContextSheet.tsx#L584-L630):
  - *Go back*, with the parent folder under it, while the folder has a parent.
  - *Use this folder*, with the folder under it, which attaches the folder. It does not show in the session's own folder.
- ahpapp does not ask the host's `completions` for files.

**VS Code** answers an `@` word with a fuzzy search, at [`agentHostFileCompletionProvider.ts`](https://github.com/microsoft/vscode/blob/e646868227c/src/vs/platform/agentHost/node/agentHostFileCompletionProvider.ts).

- It lists every file under the session's working directories with ripgrep, and ranks them with the Quick Open scorer against the word.
- It answers files only: no folder, no walk, and nothing outside the working directories.

**ahpd** follows VS Code since its commit `c4a3b4861` of 2026-11-06, at [`filecompletions.ts`](https://github.com/softov/ahpd/blob/8060ecd9b/packages/sdk/src/host/filecompletions.ts#L176).

- The answer holds files under the session's working directories, ranked as VS Code ranks them, 50 at most.
- The listing runs `rg` from the path, at [`workspacefiles.ts`](https://github.com/softov/ahpd/blob/8060ecd9b/packages/sdk/src/resources/workspacefiles.ts#L45). A host with no `rg` logs the failure and answers nothing.
- An absolute path such as `@/home/softov/` is not a path either host walks.

## What ahpw has today

- A session's composer asks the host's `completions` for each `@` word, at [`Composer.tsx`](../../src/resources/sessions/Composer.tsx#L191-L210).
  It draws each item the host sends, and attaches the item's resource.
- On a test host older than `c4a3b4861`, `@/` in a session listed the session folder's `/.git/`, not the host's root.
- The new session box walks the host's folders itself, at [`New.tsx`](../../src/resources/sessions/New.tsx#L241-L261), with [`folderMentions`](../../src/resources/sessions/folder-mentions.ts#L23-L55):
  - It lists one folder at a time with `resourceList`, folders first, at most 50 entries.
  - The typed path is relative to the session's folder, or absolute.
  - A click on a folder writes `@<path>/` and keeps the list open. A click on a file attaches it and ends the walk.
  - It has no row to go back and no row to use the folder.
- [`resourceAttachment`](../../src/resources/sessions/attachments.ts#L27-L30) attaches a file or a folder, by its `directory` flag.
- *Files and folders* in the `+` menu types `@`, so it opens the same list.

## Who writes

- No pull request of ahpw is open.
- `sessions/header-summary` changes `Composer.tsx`: the composer folds to one line. The change does not touch the fold.
- `sessions/chat-filter`, not pushed, changes `Composer.tsx` and `Attached.tsx`: the folded `+` opens the `+` menu, and `/session.info`. The change does not touch either.
- No other branch that is not merged changes `Composer.tsx`, `New.tsx`, `folder-mentions.ts`, `Attached.tsx` or `composer-commands.ts`.

## The change

Softov chose on 2026-11-09 that a session's `@` shows the walk and the host's list: "walk plus host list".

- `@` in a session's composer walks the host's folders with `folderMentions`, as the new session box does.
- Under the folder's entries, it shows the items the host's `completions` sends for the same `@` word.
  An item whose resource is already an entry of the folder is not shown twice. (defaulted: the same file twice in one list is noise.)
- The walk starts in the session's folder. An absolute path starts it there, so `@/home/softov/` lists `/home/softov`.
- Both boxes show two rows over a folder's entries, as ahpapp does:
  - *Go back*, with the parent folder under it, while the folder has a parent. A click writes the parent's path into the field.
  - *Use this folder*, with the folder under it, which attaches the folder. It does not show in the session's own folder.
- A click on a folder writes its path into the field and keeps the list open. A click on a file attaches it and ends the walk.
- The new session box has no chat to ask, so it shows the walk alone, as today.
- The rows' words come from ahpw's catalog in en, es and pt.
