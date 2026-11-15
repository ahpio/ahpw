---
title: People edit a file together
domain: shell
status: active
priority: medium
created: 2026-11-15
revalidated: 2026-11-15
requires: []
changes: []
creates: []
refs:
  - git://e0cedea - the commit of ahpw this plan was checked at
  - "file:///github/ahpd/.project/plans/host/20261115-0829-a-file-is-a-shared-document/plan.md - the host side: the `x-ahpd-document:` channel, its state, its actions and its rules"
  - "[code://src/resources/files/FilePage.tsx](../../../../src/resources/files/FilePage.tsx) - the file page: Mod-S and Save, the etag check, the unsaved guard"
  - "[code://src/resources/files/text.tsx#L27-L38](../../../../src/resources/files/text.tsx#L27-L38) - `FileHead`, where the people and the save state go"
  - "[code://src/resources/files/save.ts#L5](../../../../src/resources/files/save.ts#L5) - `MAX_CHARS`, the limit the host uses too"
  - "[code://src/resources/editor/CodeEditor.tsx](../../../../src/resources/editor/CodeEditor.tsx) - CodeMirror 6; takes the whole text as `value` today"
  - "[code://src/shell/NameMark.tsx](../../../../src/shell/NameMark.tsx) - `textToColor` and `NameMark`, a person's colour and initials from their name"
  - "[code://src/bridges/data.ts#L353-L372](../../../../src/bridges/data.ts#L353-L372) - `follow`, a channel folded into the store"
  - "[code://src/bridges/data.ts#L637-L673](../../../../src/bridges/data.ts#L637-L673) - `watchChannels`, every action envelope in order, with its origin"
  - "[code://src/bridges/data.ts#L444-L455](../../../../src/bridges/data.ts#L444-L455) - `dispatch` and `dispatchAndWait`"
  - "[code://src/resources/agents/custom-files.ts#L13](../../../../src/resources/agents/custom-files.ts#L13) - a UI setting with a choice, the pattern the save mode copies"
  - "[code://src/shell/ui-settings/settings.ts#L133](../../../../src/shell/ui-settings/settings.ts#L133) - where a UI setting is listed"
  - npm://@codemirror/state@^6.7.6 - `ChangeSet.of` and `ChangeSet.map`, to apply and move changes
  - npm://@codemirror/view@^6.43.14 - decorations for the other people's carets
  - npm://@softov/scena - `Avatar`, `Button`, `ChoicePicker`, `Chip`
---

## Goal

A person opens a file and sees who else is in it, and where.
Each edit by another person, or by an agent, shows at once.
The file opens locked; a click on Edit unlocks it.
The person edits live, or saves by hand, and picks which per file.

## Reconnaissance

The files read and the patterns to reuse are the `refs` in the frontmatter, each with its note.

### Searches performed

- `rg "CodeEditor" src` - the file page is the only place that edits a file's text.
- `rg "follow\(" src/bridges` - a channel is followed with a reducer into the store. The reducer gets no `origin`, so the document needs the envelopes from `watchChannels`.
- `rg "textToColor" src` - the colour from a name, used by `NameMark` and the role pills.
- `rg "chatChoice" src` - a UI setting with a fixed set of values.

### Runtime path

```
FilePage opens locked -> subscribe x-ahpd-document:<file URI> -> text, people, carets drawn
Edit -> CodeEditor shared mode -> a keystroke -> changed (live) or held (manual, until Mod-S)
an envelope from the host -> own origin: confirmed; another's: moved past the change in flight, applied
```

### Gaps

- `CodeEditor` replaces its whole text from `value`, so a remote edit would move the caret and lose the undo history.
- Nothing draws another person's caret.
- The file page has no locked state and no save mode.
- No bridge hands a page one channel's envelopes in order with their `origin` and `rejectionReason`.

## Answers

| What | Source | Task |
| --- | --- | --- |
| A file opens locked; the Edit button unlocks it. Locked is on the page, not a setting | Softov, 2026-11-15: "Locked until you click Edit is a option onto the page. not on settings" | 04 |
| After Edit, the save mode is Live or Manual, from a UI setting the person sets | Softov, 2026-11-15: "onto ahpw user define the default" | 04 |
| The setting's default is Live | Softov, 2026-11-15: "by default live" | 04 |
| The person changes the save mode per file, on the page | Softov, 2026-11-15: "I open the file and click edit. it get the defautl from the settings. but user could change" | 04 |
| The two modes are named Manual save and Live save | Softov, 2026-11-15: "Manual save / Auto/Live save" | 01, 04 |
| A locked page still shows the others' edits and carets live | Softov, 2026-11-15 | 02, 04 |
| A person's colour is `textToColor` of their name | Softov, 2026-11-15: "for user we already have something that pick color" | 03, 04 |
| A screenshot mockup comes first, and Softov approves it before the build | Softov, 2026-11-15 | 01 |
| The header's buttons are icons with a title, not words: ✎ Edit, ⚡ Live save, ✍ Manual save, 💾 Save, 🔒 read only, ◌ and ✓ for saving and saved | Softov, 2026-11-15: "replace buttons text for icons buttons with tittle hints" | 01, 04 |
| The mockup is approved with that change | Softov, 2026-11-15: "besides that you can build it" | 04 |
| Manual save holds the person's edits on their screen and sends them as one change on Mod-S or Save | Softov, 2026-11-15 | 02 |
| A setting key `ui.fileSaveMode`, values `live` and `manual` | `(defaulted: the `ui.<name>` form of the other UI settings)` | 04 |
| Carets go out at most once every 50 ms | `(defaulted: fast enough to follow, few enough to keep the socket quiet)` | 02 |
| One change in flight; what the person types meanwhile waits for the next one | `(defaulted: the rule the host's rebase expects)` | 02 |
| At two inserts in one place, the change the host took first goes first | the host plan's *Answers* | 02 |
| After a reconnect or a refusal as too old, the page subscribes again, compares its text with the new one, and sends the difference as one change | `(defaulted: the host lists the channel in `missing`)` | 02 |
| Manual save keeps the unsaved guard; Live save needs none | `(defaulted: in Live save nothing is unsaved for long)` | 04 |

## Proposed architecture

- **Data flow** - a document client per open file holds the confirmed text and version, the change in flight, the changes not sent, and the people. CodeMirror holds what the person sees: confirmed text plus their own changes.
- **Event flow** - the client reads the channel's envelopes in order. Its own `origin` confirms its change in flight. Another's change is moved past the client's own changes, applied in CodeMirror with an annotation so it is not sent back, and moves every caret.
- **State flow** - the save mode lives on the page, starting from `ui.fileSaveMode`. Locked is the page's own state and always starts on.
- **Layer responsibilities** - `src/bridges/data.ts`: one channel's envelopes in order. `src/resources/files/document.ts`: the document client, with no React. `src/resources/editor/shared.ts`: the CodeMirror extension for remote changes and carets. `FilePage.tsx` and `text.tsx`: the page.
- **Source-of-truth files** - [`code://src/resources/files/document.ts`](../../../../src/resources/files/document.ts) for the client's rules.

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - A mockup of the shared file page](task-01-a-mockup-of-the-shared-file-page.md) | implemented | - |
| [02 - The document client](task-02-the-document-client.md) | implemented | - |
| [03 - Carets and remote edits in the editor](task-03-carets-and-remote-edits.md) | implemented | 02 |
| [04 - The shared file page](task-04-the-shared-file-page.md) | implemented | 01, 03 |

## Risks and tradeoffs

- The client and the host must order two inserts at one place the same way - task 02 tests the client against the host's rule.
- A remote edit applied while the person types must not move their caret wrongly - CodeMirror maps the selection through every change it applies.
- Undo must take back only the person's own edits - the remote edits carry an annotation that keeps them out of the history.
- A host without the channel refuses the subscribe - the page falls back to today's editor with Mod-S and Save.

## Resume state

- **Done so far:** tasks 01 to 04 built on 2026-11-15, on branch `shell/20261115-0832-people-edit-a-file-together`; checked in two browsers against a daemon from the host plan's branch.
- **Next action:** Softov tests both branches; then review, `implemented.md`, and a PR for each.
- **Open questions:** none.
- **Watch out for:** `follow` reducers get no `origin`. A remote change is applied to CodeMirror only after it is moved past the person's own changes.

## Final verification checklist

- [ ] Softov approved the mockup, and each screen matches it.
- [ ] Two browsers on one file: each sees the other's caret, name and edits live.
- [ ] Two people type at one place at once, and both pages end with the same text.
- [ ] An agent writes the file, and the page shows the edit without losing the person's caret.
- [ ] Manual save: the edits stay local until Mod-S, then reach the other page.
- [ ] A host without the channel: the page works as today.
- [ ] `pnpm typecheck`, `pnpm test` and `pnpm build` pass.
