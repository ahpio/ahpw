---
title: The document client
status: todo
depends: []
layer: "files"
refs:
  - "[code://src/bridges/data.ts#L637-L673](../../../../src/bridges/data.ts#L637-L673) - every action envelope in order"
  - "[code://src/bridges/data.ts#L444-L455](../../../../src/bridges/data.ts#L444-L455) - `dispatch`"
---

## Objective

One object per open file speaks the `x-ahpd-document:` channel.
It keeps the person's own changes in order with the host's, and says what to apply and where each caret is.

## Files

- `UPDATE: src/bridges/data.ts` - `onEnvelopes(channel, read)`: one channel's envelopes in order, with `origin` and `rejectionReason`.
- `CREATE: src/resources/files/document.ts` - the document client.
- `CREATE: src/resources/files/document.test.ts` - the client against a fake channel.

## Steps

1. Add `onEnvelopes(channel, read)` to the host bridge, fed from `watchChannels` before any reducer.
2. In `document.ts`, subscribe to `x-ahpd-document:<file URI>` and keep the confirmed text, the version and the people.
3. Turn a CodeMirror `ChangeSet` into the host's `{ from, to, insert }` list, and back with `ChangeSet.of`.
4. In Live save, send one `changed` with the person's carets, and hold what follows until its echo arrives.
5. In Manual save, hold every change until `save()`; then send them as one `changed`.
6. On the echo of the person's own change, add it to the confirmed text and send what was held.
7. On another person's change, move it past the person's own changes and move theirs past it.
8. At two inserts in one place, put the host's change first, as the host does.
9. Hand the moved change to the editor, and move every person's carets through it.
10. Send the person's carets with `selected` at most once every 50 ms, and only with no change in flight.
11. On `joined`, `left`, `selected` and `saved`, update the people and the version on disk.
12. On a refusal as too old, or on a reconnect, subscribe again and compare the text with the new snapshot.
13. Send the difference as one change: cut the same start and the same end.

## Validation

- `src/resources/files/document.test.ts`: a change in Live save goes out, and what the person types meanwhile waits for the echo.
- The same file: in Manual save nothing goes out until `save()`, and then one change does.
- The same file: another person's change arrives while one is in flight, and both sides reach one text.
- The same file: two inserts at one place end in the host's order.
- The same file: carets move through each remote change, and `selected` waits 50 ms.
- The same file: a refusal as too old ends in a fresh subscribe and one change with the difference.
- `pnpm test src/resources/files/document.test.ts` passes.

## Resume
