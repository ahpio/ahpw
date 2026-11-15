import { describe, expect, it } from 'vitest';
import { ChangeSet, EditorState, Text } from '@codemirror/state';
import { SharedDocument, differenceOf, type DocumentView, type SaveMode } from './document.js';
import type { ChannelEnvelope, OpenChannel } from '../../bridges/data.js';

/*
 * The document client against a fake host that orders changes the way ahpd
 * does: a change on the current version is taken as it is, one on an older
 * version is moved past what was taken since, and the change taken first goes
 * first at a tie. Every envelope goes to every client, in order.
 */

interface Sent { client: string; action: Record<string, unknown>; seq: number }

class FakeHost {
  text: string;
  version = 0;
  log: { version: number; changes: ChangeSet }[] = [];
  readers = new Map<string, (envelope: ChannelEnvelope) => void>();
  queue: Sent[] = [];
  seq = 100;

  constructor(text: string) { this.text = text; }

  channel(client: string): OpenChannel {
    let clientSeq = 0;
    return {
      subscribe: async () => ({ state: { text: this.text, version: this.version, saved: 0, people: [...this.readers.keys()].map((one) => ({ client: one, name: one, agent: false, ranges: [] })) }, fromSeq: this.seq }),
      dispatch: (action) => { clientSeq += 1; this.queue.push({ client, action, seq: clientSeq }); return clientSeq; },
      close: () => { this.readers.delete(client); },
    };
  }

  /** Take the next queued action, as the host would. */
  step(): void {
    const next = this.queue.shift();
    if (next === undefined) return;
    const { client, action, seq } = next;
    if (action.type !== 'x-ahpd-document/changed') return;
    const made = Number(action.version);
    const length = this.lengthAt(made);
    let changes = ChangeSet.of(action.changes as never, length);
    for (const one of this.log.filter((entry) => entry.version >= made)) changes = changes.map(one.changes);
    const applied = changes;
    this.text = applied.apply(Text.of(this.text.split('\n'))).toString();
    this.log.push({ version: this.version, changes: applied });
    const edits: { from: number; to: number; insert: string }[] = [];
    applied.iterChanges((fromA, toA, _b, _c, inserted) => edits.push({ from: fromA, to: toA, insert: inserted.toString() }));
    this.seq += 1;
    const envelope: ChannelEnvelope = { channel: 'doc', serverSeq: this.seq, origin: { clientId: client, clientSeq: seq }, action: { type: 'x-ahpd-document/changed', version: this.version, changes: edits, ranges: [], id: action.id } };
    this.version += 1;
    for (const read of this.readers.values()) read(envelope);
  }

  drain(): void { while (this.queue.length > 0) this.step(); }

  private lengthAt(version: number): number {
    let length = this.text.length;
    for (const one of [...this.log].reverse()) {
      if (one.version < version) break;
      length -= one.changes.newLength - one.changes.length;
    }
    return length;
  }
}

/** An editor held as a CodeMirror state, with the document wired to it. */
function editor(host: FakeHost, client: string, mode: SaveMode = 'live') {
  let state = EditorState.create({ doc: '' });
  const view: DocumentView = {
    current: () => state.doc.toString(),
    reset: (text) => { state = EditorState.create({ doc: text }); },
    apply: (changes) => { state = state.update({ changes }).state; },
    changed: () => {},
    refused: () => {},
  };
  const doc = new SharedDocument(host.channel(client), () => client, view, mode);
  host.readers.set(client, (envelope) => doc.read(envelope));
  const type = (at: number, text: string) => {
    const tr = state.update({ changes: { from: at, insert: text } });
    state = tr.state;
    doc.local(tr.changes, [{ anchor: at + text.length, head: at + text.length }]);
  };
  const remove = (from: number, to: number) => {
    const tr = state.update({ changes: { from, to, insert: '' } });
    state = tr.state;
    doc.local(tr.changes, [{ anchor: from, head: from }]);
  };
  return { doc, text: () => state.doc.toString(), type, remove };
}

describe('SharedDocument', () => {
  it('sends one change and holds what is typed until its echo', async () => {
    const host = new FakeHost('hello');
    const ana = editor(host, 'ana');
    await ana.doc.start();
    ana.type(5, ' world');
    ana.type(11, '!');
    expect(host.queue).toHaveLength(1);
    host.step();
    expect(host.queue).toHaveLength(1);
    host.drain();
    expect(host.text).toBe('hello world!');
    expect(ana.text()).toBe('hello world!');
    expect(ana.doc.unsent).toBe(false);
  });

  it('keeps edits on the screen in Manual save until save()', async () => {
    const host = new FakeHost('a');
    const ana = editor(host, 'ana', 'manual');
    await ana.doc.start();
    ana.type(1, 'b');
    ana.type(2, 'c');
    expect(host.queue).toHaveLength(0);
    expect(ana.doc.unsent).toBe(true);
    ana.doc.save();
    expect(host.queue).toHaveLength(1);
    host.drain();
    expect(host.text).toBe('abc');
  });

  it('reaches one text when two people type at once, in any order the host takes them', async () => {
    for (const order of ['ana first', 'rafael first']) {
      const host = new FakeHost('The quick brown fox');
      const ana = editor(host, 'ana');
      const rafael = editor(host, 'rafael');
      await ana.doc.start();
      await rafael.doc.start();
      ana.type(4, 'very ');
      rafael.type(19, ' jumps');
      if (order === 'rafael first') host.queue.reverse();
      // Both type again before anything comes back.
      ana.type(9, 'very ');
      rafael.type(25, ' high');
      host.drain();
      expect(ana.text(), order).toBe(host.text);
      expect(rafael.text(), order).toBe(host.text);
      expect(host.text).toBe('The very very quick brown fox jumps high');
    }
  });

  it('puts two inserts at one place in the order the host took them', async () => {
    const host = new FakeHost('xy');
    const ana = editor(host, 'ana');
    const rafael = editor(host, 'rafael');
    await ana.doc.start();
    await rafael.doc.start();
    ana.type(1, 'A');
    rafael.type(1, 'B');
    host.drain();
    expect(host.text).toBe('xABy');
    expect(ana.text()).toBe('xABy');
    expect(rafael.text()).toBe('xABy');
  });

  it('keeps text another person typed inside a span the person deletes', async () => {
    const host = new FakeHost('abcdef');
    const ana = editor(host, 'ana');
    const rafael = editor(host, 'rafael');
    await ana.doc.start();
    await rafael.doc.start();
    rafael.type(3, 'XY');
    ana.remove(1, 5);
    host.drain();
    expect(host.text).toBe('aXYf');
    expect(ana.text()).toBe('aXYf');
    expect(rafael.text()).toBe('aXYf');
  });
});

describe('differenceOf', () => {
  it('turns the first text into the second', () => {
    for (const [a, b] of [['', 'x'], ['abc', 'abXc'], ['hello', 'help'], ['same', 'same']]) {
      const edits = differenceOf(a!, b!);
      expect(ChangeSet.of(edits, a!.length).apply(Text.of([a!])).toString()).toBe(b);
    }
  });
});
