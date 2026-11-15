import { describe, expect, it } from 'vitest';
import { annotationsReducer } from '@microsoft/agent-host-protocol';
import type { Annotation, AnnotationsState } from '@microsoft/agent-host-protocol';
import { FEEDBACK_META, commentsChannel, commentsOf, isOutdated, newComment, remove, reply, resolve, stampOf, textOf } from './comments.js';

/*
 * The comments of a file: the actions built here, folded by the protocol's own
 * reducer, as the host folds them.
 */

const FILE = 'file:///work/PLAN.md';
const range = { start: { line: 3, character: 6 }, end: { line: 3, character: 24 } };

const fold = (actions: Record<string, unknown>[]): AnnotationsState =>
  actions.reduce<AnnotationsState>((state, action) => annotationsReducer(state, action as never), { annotations: [] });

describe('the actions', () => {
  it('writes a new comment as a person comment already sent, on the file, from no session', () => {
    const action = newComment(FILE, range, 'Which kind?');
    const annotation = action.annotation as Annotation;
    expect(action.type).toBe('annotations/set');
    expect(annotation).toMatchObject({ resource: FILE, range, resolved: false, origin: { session: commentsChannel(FILE) } });
    expect(annotation._meta).toEqual({ [FEEDBACK_META]: { kind: 'user', state: 'submitted', sessionResource: commentsChannel(FILE) } });
    expect(annotation.entries[0]!._meta).toEqual({ [FEEDBACK_META]: { author: 'user' } });
    expect(textOf(annotation.entries[0]!)).toBe('Which kind?');
  });

  it('folds a comment, a reply, a resolve and a remove', () => {
    const add = newComment(FILE, range, 'Which kind?');
    const id = (add.annotation as Annotation).id;
    const replied = fold([add, reply(id, 'The resource kind.')]);
    expect(replied.annotations[0]!.entries.map(textOf)).toEqual(['Which kind?', 'The resource kind.']);
    expect(fold([add, resolve(id, true)]).annotations[0]!.resolved).toBe(true);
    expect(fold([add, remove(id)]).annotations).toEqual([]);
  });
});

describe('reading a comment', () => {
  it('reads the host stamp and the outdated mark', () => {
    const entry = { id: 'e', text: 'x', _meta: { ahpd: { by: 'user:rafael', name: 'rafael', at: '2026-11-15T14:02:11Z' } } };
    expect(stampOf(entry)).toEqual({ by: 'user:rafael', name: 'rafael', at: '2026-11-15T14:02:11Z' });
    expect(stampOf({ id: 'e', text: 'x' })).toBeUndefined();
    const outdated = { id: 'a', origin: { session: 's' }, resource: FILE, resolved: false, entries: [entry], _meta: { ahpd: { outdated: true } } } as Annotation;
    expect(isOutdated(outdated)).toBe(true);
  });

  it('lists comments in the order of the text', () => {
    const at = (id: string, line: number) => ({ id, origin: { session: 's' }, resource: FILE, resolved: false, range: { start: { line, character: 0 }, end: { line, character: 1 } }, entries: [{ id: `${id}-1`, text: id }] }) as Annotation;
    expect(commentsOf({ annotations: [at('b', 9), at('a', 2)] }).map((one) => one.id)).toEqual(['a', 'b']);
  });
});
