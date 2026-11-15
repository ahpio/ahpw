---
title: Carets and remote edits in the editor
status: todo
depends: [task-02-the-document-client.md]
layer: "editor"
refs:
  - "[code://src/resources/editor/CodeEditor.tsx](../../../../src/resources/editor/CodeEditor.tsx) - the editor, which takes the whole text as `value` today"
  - "[code://src/shell/NameMark.tsx](../../../../src/shell/NameMark.tsx) - `textToColor`"
---

## Objective

`CodeEditor` applies another person's change in place and draws each person's carets.
The person's caret and undo history stay as they were.

## Files

- `CREATE: src/resources/editor/shared.ts` - a CodeMirror extension: apply a remote change, draw remote carets and selections.
- `CREATE: src/resources/editor/shared.css` - the caret, the selection and the name tag, on the theme's variables.
- `UPDATE: src/resources/editor/CodeEditor.tsx` - a shared mode that takes the document client in place of `value` and `onChange`.
- `CREATE: src/resources/editor/shared.test.ts` - the extension in a headless `EditorView`.

## Steps

1. Apply a remote change with an annotation, so the client does not send it back.
2. Keep remote changes out of the undo history with `Transaction.addToHistory.of(false)`.
3. Draw each person's carets as widgets and their selections as marks, in `textToColor` of their name.
4. Show the name on a tag above the caret while the person moves, and hide it after 2 s.
5. In shared mode, hand each local transaction's changes and selection to the document client.
6. Keep `value` and `onChange` for every other use of `CodeEditor`.

## Validation

- `src/resources/editor/shared.test.ts`: a remote change lands, the local caret moves with it, and undo does not take it back.
- The same file: two people with three carets draw three widgets in two colours.
- `pnpm test src/resources/editor/shared.test.ts` passes.

## Resume
