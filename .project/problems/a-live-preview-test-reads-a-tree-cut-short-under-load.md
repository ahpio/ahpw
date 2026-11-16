---
title: A live preview test reads a tree cut short under load
status: open
date: 2026-11-16
severity: minor
blocks: []
refs:
  - "[code://src/resources/editor/livePreview.test.ts#L15-L23](../../src/resources/editor/livePreview.test.ts#L15-L23) - `stateOf`, which parses with `ensureSyntaxTree` and returns the same state"
  - "[code://src/resources/editor/livePreview.test.ts#L108-L110](../../src/resources/editor/livePreview.test.ts#L108-L110) - the case that failed"
  - "[code://src/resources/editor/livePreview.ts#L277](../../src/resources/editor/livePreview.ts#L277) - the decorations read `syntaxTree(state)`"
  - npm://@codemirror/language - `LanguageState.init` parses for 20 ms, and `syntaxTree` answers the tree of that parse
  - git://1b29449 - main when the problem was read
---

## Symptom

On 2026-11-16 a full `pnpm test` run failed one case: `the blocks drawn whole > draws a table and a fenced block away from the caret`.
The case expected the table and the mermaid fence, and it got the table only.
The next full run passed, and the file passes when it runs alone.

## Cause

`stateOf` makes an `EditorState` and calls `ensureSyntaxTree` on it.
A new state parses for 20 ms only, and its `LanguageState` keeps the tree of that parse.
`ensureSyntaxTree` parses more in the parse context, but it does not change the tree that the state keeps.
`blockDecorations` reads `syntaxTree(state)`, which is the kept tree.
A full suite run loads the machine, and then 20 ms can stop before the fence at the end of the text.
The fence is then not in the tree.

## Impact

The case fails at random in a full run, on this computer and possibly in CI.
The code under test is correct. Only the test reads a tree that is cut short.

## Workaround

None. Do not run the suite again until it passes.

## Fix

- `stateOf` returns `state.update({}).state` after `ensureSyntaxTree`. The new state takes the tree that the parse context holds.
- A case checks that `stateOf` gives a tree to the end of a long text.
