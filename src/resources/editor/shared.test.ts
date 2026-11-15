import { describe, expect, it } from 'vitest';
import { ChangeSet, EditorState } from '@codemirror/state';
import { history, undo } from '@codemirror/commands';
import { peopleDecorations, peopleField, remoteChange, setPeople } from './shared.js';
import type { DocumentPerson } from '../files/document.js';

/*
 * The shared editor at the level of CodeMirror's state: the others' carets
 * drawn and moved, and a remote edit kept out of the person's undo.
 */

const person = (name: string, ranges: { anchor: number; head: number }[], me = false): DocumentPerson =>
  ({ client: name, name, agent: false, me, ranges });

const count = (set: ReturnType<typeof peopleDecorations>): { widgets: number; marks: number } => {
  let widgets = 0;
  let marks = 0;
  set.between(0, Number.MAX_SAFE_INTEGER, (from, to) => { if (from === to) widgets += 1; else marks += 1; });
  return { widgets, marks };
};

describe('peopleDecorations', () => {
  it('draws a caret for each range of each other person, and a mark for each selection', () => {
    const drawn = peopleDecorations([
      person('rafael', [{ anchor: 2, head: 2 }, { anchor: 8, head: 5 }, { anchor: 10, head: 10 }]),
      person('claude', [{ anchor: 1, head: 1 }]),
      person('ana', [{ anchor: 3, head: 3 }], true),
    ], 20);
    expect(count(drawn)).toEqual({ widgets: 4, marks: 1 });
  });

  it('keeps every caret inside the text', () => {
    const drawn = peopleDecorations([person('rafael', [{ anchor: 50, head: 99 }])], 10);
    const at: number[] = [];
    drawn.between(0, 100, (from) => { at.push(from); });
    expect(at).toEqual([10]);
  });
});

describe('peopleField', () => {
  it('moves the carets with each edit and redraws them on setPeople', () => {
    let state = EditorState.create({ doc: 'hello world', extensions: [peopleField] });
    state = state.update({ effects: setPeople.of([person('rafael', [{ anchor: 6, head: 6 }])]) }).state;
    state = state.update({ changes: { from: 0, insert: '>> ' } }).state;
    const at: number[] = [];
    state.field(peopleField).between(0, 100, (from) => { at.push(from); });
    expect(at).toEqual([9]);
  });
});

describe('remoteChange', () => {
  it('stays out of the undo history, so undo takes back only the person own edit', () => {
    let state = EditorState.create({ doc: 'abc', extensions: [history()] });
    state = state.update({ changes: { from: 3, insert: 'D' } }).state;
    state = state.update(remoteChange(ChangeSet.of([{ from: 0, insert: 'X' }], 4))).state;
    expect(state.doc.toString()).toBe('XabcD');
    undo({ state, dispatch: (tr) => { state = tr.state; } });
    expect(state.doc.toString()).toBe('Xabc');
  });
});
