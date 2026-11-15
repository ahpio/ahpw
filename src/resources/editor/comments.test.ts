import { describe, expect, it } from 'vitest';
import { EditorState } from '@codemirror/state';
import { commentDecorations, drawnIn, commentsEditor, setComments, type DrawnComment } from './comments.js';

/*
 * A file's comments in the editor, on an `EditorState`: ahpw's tests run with
 * no DOM, so the marks are counted, not drawn.
 */

const at = (id: string, line: number, from: number, to: number, outdated = false): DrawnComment =>
  ({ id, range: { start: { line, character: from }, end: { line, character: to } }, outdated, focused: false });

const count = (set: ReturnType<typeof commentDecorations>): number => {
  let n = 0;
  set.between(0, Number.MAX_SAFE_INTEGER, () => { n += 1; });
  return n;
};

const DOC = '## Tasks\n- one\n- two\n- three\n';

describe('commentDecorations', () => {
  it('marks each open comment, and an outdated one as a point', () => {
    const state = EditorState.create({ doc: DOC });
    expect(count(commentDecorations([at('a', 1, 2, 5), at('b', 2, 2, 5), at('c', 3, 2, 2, true)], state.doc))).toBe(3);
  });

  it('keeps a range past the end of the text inside it', () => {
    const state = EditorState.create({ doc: DOC });
    const drawn = commentDecorations([at('a', 1, 2, 99), at('b', 40, 0, 3)], state.doc);
    drawn.between(0, Number.MAX_SAFE_INTEGER, (_from, to) => { expect(to).toBeLessThanOrEqual(DOC.length); });
  });
});

describe('the gutter', () => {
  it('puts one mark on the first line of each comment, and moves the marks with an edit', () => {
    let state = EditorState.create({ doc: DOC, extensions: [commentsEditor(() => {})] });
    state = state.update({ effects: setComments.of([at('a', 1, 2, 5), at('b', 1, 0, 1), at('c', 3, 2, 7)]) }).state;
    const lines: number[] = [];
    drawnIn(state).gutter.between(0, state.doc.length, (from) => { lines.push(state.doc.lineAt(from).number); });
    expect(lines).toEqual([2, 4]);
    state = state.update({ changes: { from: 0, insert: '# Plan\n' } }).state;
    const moved: number[] = [];
    drawnIn(state).gutter.between(0, state.doc.length, (from) => { moved.push(state.doc.lineAt(from).number); });
    expect(moved).toEqual([3, 5]);
  });
});
