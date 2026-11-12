---
title: The header's menu has the session's acts
status: done
depends: []
layer: "ahpw sessions"
refs:
  - "[code://src/resources/sessions/Explorer.tsx#L38-L69](../../../../src/resources/sessions/Explorer.tsx#L38-L69) - `menuOf`, which becomes the shared function"
  - "[code://src/resources/sessions/SessionHeader.tsx#L119-L126](../../../../src/resources/sessions/SessionHeader.tsx#L119-L126) - `viewMenu`, which gains the *Session* group"
---

## Objective

One function makes a session's acts, and the list's menu and the header's `...` menu both draw them, with the same words.
The header's menu has a *Session* group after *Display*: Pin, Rename, Mark read or unread, Archive, Copy link and Delete.

## Files

- `CREATE: src/resources/sessions/acts.ts` - `sessionActs(host, session, pinned, pin, onDeleted)`, the acts as `PickerAction`s.
- `CREATE: src/resources/sessions/acts.test.ts` - the words for read and unread, archived and not, pinned and not.
- `UPDATE: src/resources/sessions/Explorer.tsx:38-69` - `menuOf` puts *Open* first, then `sessionActs`.
- `UPDATE: src/resources/sessions/SessionHeader.tsx:119-126` - the *Session* group after *Display*, from `sessionActs`.
- `UPDATE: src/resources/sessions/Page.tsx` - pass the pin state and the pin toggle to the header.

## Steps

1. Move the acts of `menuOf` other than *Open* into `sessionActs`, with their words and their `more` group unchanged.
2. Give `sessionActs` an `onDeleted` call, which runs once the host disposes of the session.
3. Make `menuOf` answer *Open* and then `sessionActs`.
4. Read the session's pin in the page with `SESSIONS_PINS`, and pass it and `togglePin` to the header.
5. Add the acts to the header's menu under the *Session* group, after *Display*.
6. Close the session's tab in `onDeleted` from the header, with `sessionKey`.

## Validation

- `src/resources/sessions/acts.test.ts` passes.
- `pnpm typecheck` and `pnpm test` pass.
- By hand: each act from the header's menu does what the same act does from the list.

## Resume
