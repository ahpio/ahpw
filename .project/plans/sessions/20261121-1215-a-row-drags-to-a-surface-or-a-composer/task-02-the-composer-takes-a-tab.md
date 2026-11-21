---
title: The composer takes a session or a file tab
status: done
depends: [task-01-a-session-row-drags.md]
layer: "sessions"
refs:
  - "[code://src/resources/sessions/composer-drop.ts#L15-L70](../../../../src/resources/sessions/composer-drop.ts#L15-L70) - `useComposerDrop`"
  - "[code://src/resources/sessions/attachments.ts#L27-L35](../../../../src/resources/sessions/attachments.ts#L27-L35) - the attachments"
  - "[code://src/resources/files/index.ts#L100-L112](../../../../src/resources/files/index.ts#L100-L112) - a file tab's resource"
  - "[code://src/resources/sessions/Composer.tsx#L228](../../../../src/resources/sessions/Composer.tsx#L228) - the composer"
---

## Objective

A session (a tab or a row) dropped on a composer becomes a chat reference.
A file tab becomes a file attachment, and with Shift also `@path`.
Anything else passes on to the surface.

## Files

- `UPDATE: src/resources/sessions/composer-drop.ts:15-70` - take a scena drag with `useDropArea`, before the host file and the local files.
- `UPDATE: src/resources/sessions/Composer.tsx:228` - pass the composer's own session, for the refusal.
- `UPDATE: src/resources/sessions/composer-drop.test.ts` - a session, a file tab, another host, its own session, another tab.

## Steps

1. Write `asAttachment(thing, host, own)`, which returns an attachment or `null`.
2. For a `SessionPage` of `host` that is not `own`, return a chat reference.
3. For a file viewer of `host`, return a resource attachment.
4. Read a session's summary from the host's session list for `chatAttachment`.
5. In `useComposerDrop`, call `useDropArea` with `accepts` as `asAttachment` returning one, and `onDrop` as attaching it.
6. With Shift on a file tab, also insert its `@path`, as a host file does.
7. Run the area's handlers first, and the existing ones when the area did not take the drop.
8. Show `dropping` while the area's `over` is true.

## Validation

- `src/resources/sessions/composer-drop.test.ts`: a session row and a session tab attach a chat reference.
- The same test: a file tab attaches a file, and with Shift writes `@path`.
- The same test: a session of another host, the composer's own session and an agent tab pass on.
- `npx vitest run` passes.

## Resume

- Done 2026-11-21: steps 1 to 8. The drop area is scena's `useDropArea`; its handlers run first, and the old ones run when it did not take the drop.
- `tsc -b`, the tests (1071) and the build pass.
