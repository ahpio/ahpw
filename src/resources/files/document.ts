/**
 * A shared resource of kind `text`: one file, open in several clients, edited by all.
 *
 * The host serves `x-ahpd-shared:<resource URI>` and puts every change in order.
 * This client keeps the person's own changes in step with the host's: one
 * change out at a time, what is typed meanwhile held for the next, and each
 * change from someone else moved past the person's own before it is applied.
 *
 * The host takes a change made on an older version and moves it past the
 * changes taken since, with the one it took first going first at a tie. The
 * moves here match: an incoming change goes before the person's own at a tie,
 * and the person's own moves after it. CodeMirror's `ChangeSet.map` does both,
 * and keeps text one side inserted inside a span the other deletes, as the
 * host does.
 */
import { ChangeSet, type ChangeDesc } from '@codemirror/state';
import type { ChannelEnvelope, OpenChannel } from '../../bridges/data.js';

/** The channel of a file's shared resource. */
export const documentChannel = (file: string): string => `x-ahpd-shared:${file}`;

/** How the person's edits reach the others: at once, or when they save. */
export type SaveMode = 'live' | 'manual';

/** One caret or selection. */
export interface Range {
  anchor: number;
  head: number;
}

/** What a person is, as the host says. */
export type PersonKind = 'root' | 'user' | 'guest' | 'agent';

/** One person in the document. */
export interface DocumentPerson {
  client: string;
  name: string;
  kind: PersonKind;
  /** Whether they are editing, not only reading. */
  editing: boolean;
  /** The carets, in the editor's text; empty for the person themself. */
  ranges: Range[];
  me: boolean;
}

/** The change the host carries: a list of replaced spans, on the text before any of them. */
export interface Edit {
  from: number;
  to: number;
  insert: string;
}

/** What the document asks of the editor that shows it. */
export interface DocumentView {
  /** The editor's text now. */
  current(): string;
  /** Replace the whole text, at the start or after the host refused a change. */
  reset(text: string): void;
  /** Apply another person's change; positions are in the editor's text now. */
  apply(changes: ChangeSet): void;
  /** The people, their carets, or the save state changed. */
  changed(): void;
  /** The host refused one of the person's changes, for this reason. */
  refused(reason: string): void;
}

interface Held {
  client: string;
  name: string;
  kind: PersonKind;
  editing: boolean;
  /** Carets on the host's text at `version`. */
  ranges: Range[];
}

interface Snapshot {
  kind?: string;
  text: string;
  version: number;
  saved: number;
  people: Held[];
}

const editsOf = (changes: ChangeSet): Edit[] => {
  const out: Edit[] = [];
  changes.iterChanges((fromA, toA, _fromB, _toB, inserted) => { out.push({ from: fromA, to: toA, insert: inserted.toString() }); });
  return out;
};

const changesOf = (edits: unknown, length: number): ChangeSet =>
  ChangeSet.of((Array.isArray(edits) ? edits : []) as Edit[], length);

const mapRanges = (ranges: readonly Range[], changes: ChangeDesc | undefined, assoc: -1 | 1 = -1): Range[] =>
  (changes === undefined ? [...ranges] : ranges.map((r) => ({ anchor: changes.mapPos(r.anchor, assoc), head: changes.mapPos(r.head, assoc) })));

/** The one change from `before` to `after`: what both share at the start and the end is kept. */
export const differenceOf = (before: string, after: string): Edit[] => {
  if (before === after) return [];
  let start = 0;
  const shorter = Math.min(before.length, after.length);
  while (start < shorter && before.charCodeAt(start) === after.charCodeAt(start)) start += 1;
  let end = 0;
  while (end < shorter - start && before.charCodeAt(before.length - 1 - end) === after.charCodeAt(after.length - 1 - end)) end += 1;
  return [{ from: start, to: before.length - end, insert: after.slice(start, after.length - end) }];
};

const kindOf = (value: unknown): PersonKind => (value === 'root' || value === 'user' || value === 'agent' ? value : 'guest');

const randomId = (): string => Math.random().toString(36).slice(2, 12);

/** How often the person's carets go out, at most. */
export const CARETS_EVERY_MS = 50;

export class SharedDocument {
  /** The host's version that the editor's text is built on. */
  private version = 0;
  /** The version the host last wrote to the file. */
  private saved = 0;
  /** The person's change sent and not yet back, on `version`. */
  private inflight: { id: string; changes: ChangeSet } | undefined;
  /** What the person typed after it, not sent yet. */
  private pending: ChangeSet | undefined;
  private people = new Map<string, Held>();
  private caretTimer: ReturnType<typeof setTimeout> | undefined;
  private lastRanges: Range[] = [];
  /** Envelopes that came while a subscribe was out, read once its snapshot is in. */
  private waiting: ChannelEnvelope[] | undefined = [];
  private fromSeq = 0;
  private closed = false;
  private editing = false;

  constructor(
    private readonly channel: OpenChannel,
    private readonly me: () => string | undefined,
    private readonly view: DocumentView,
    private mode: SaveMode,
  ) {}

  /** Subscribe and hand the editor the text. */
  async start(): Promise<void> {
    await this.resubscribe('reset');
  }

  /** Read one envelope from the channel, in order. */
  read(envelope: ChannelEnvelope): void {
    if (this.closed) return;
    if (this.waiting !== undefined) {
      this.waiting.push(envelope);
      return;
    }
    const action = envelope.action;
    const type = String(action.type ?? '');
    if (envelope.rejectionReason !== undefined) {
      if (type === 'x-ahpd-shared/changed' && this.inflight !== undefined && action.id === this.inflight.id) this.onRefused(envelope.rejectionReason);
      return;
    }
    if (type === 'x-ahpd-shared/changed') this.onChanged(envelope);
    else if (type === 'x-ahpd-shared/selected') this.onSelected(envelope);
    else if (type === 'x-ahpd-shared/joined') {
      const client = String(action.client);
      this.people.set(client, { client, name: String(action.name ?? client), kind: kindOf(action.kind), editing: action.editing === true, ranges: [] });
      this.view.changed();
    } else if (type === 'x-ahpd-shared/editing') {
      const person = envelope.origin === undefined ? undefined : this.people.get(envelope.origin.clientId);
      if (person !== undefined) person.editing = action.editing === true;
      this.view.changed();
    } else if (type === 'x-ahpd-shared/left') {
      this.people.delete(String(action.client));
      this.view.changed();
    } else if (type === 'x-ahpd-shared/saved') {
      const saved = Number(action.version);
      if (Number.isInteger(saved)) this.saved = saved;
      this.view.changed();
    }
  }

  /** A change the person made in the editor, and their carets after it. */
  local(changes: ChangeSet, ranges: readonly Range[]): void {
    if (changes.empty) return;
    this.pending = this.pending === undefined ? changes : this.pending.compose(changes);
    this.lastRanges = [...ranges];
    if (this.mode === 'live') this.send();
    this.view.changed();
  }

  /** The person's carets moved without an edit. */
  select(ranges: readonly Range[]): void {
    this.lastRanges = [...ranges];
    if (this.caretTimer !== undefined) return;
    this.caretTimer = setTimeout(() => {
      this.caretTimer = undefined;
      this.sendCarets();
    }, CARETS_EVERY_MS);
  }

  /** In Manual save, send what the person typed. */
  save(): void {
    this.send();
  }

  setMode(mode: SaveMode): void {
    this.mode = mode;
    if (mode === 'live') this.send();
    this.view.changed();
  }

  get saveMode(): SaveMode {
    return this.mode;
  }

  /** Whether the person has edits the host does not have yet. */
  get unsent(): boolean {
    return this.pending !== undefined || this.inflight !== undefined;
  }

  /** Whether the host holds edits it has not written to the file. */
  get saving(): boolean {
    return this.inflight !== undefined || (this.mode === 'live' && this.pending !== undefined) || this.saved < this.version;
  }

  /** Everyone in the document, the others' carets in the editor's text. */
  everyone(): DocumentPerson[] {
    const me = this.me();
    const own = this.own();
    return [...this.people.values()].map((one) => ({
      client: one.client,
      name: one.name,
      kind: one.kind,
      editing: one.editing,
      me: one.client === me,
      ranges: one.client === me ? [] : mapRanges(one.ranges, own),
    }));
  }

  close(): void {
    this.closed = true;
    if (this.caretTimer !== undefined) clearTimeout(this.caretTimer);
    this.channel.close();
  }

  /**
   * Subscribe again and start from the host's text.
   *
   * `keep` keeps what the person typed and sends what differs from the new
   * text as one change, after a reconnect or a change too old to move.
   * `reset` puts the host's text in the editor, at the start or after a
   * refusal that sending again would not fix.
   */
  async resubscribe(how: 'keep' | 'reset' = 'keep'): Promise<void> {
    this.waiting ??= [];
    const answer = await this.channel.subscribe();
    if (this.closed) return;
    const snapshot = answer?.state as Snapshot | undefined;
    if (answer === undefined || snapshot === undefined) throw new Error('The host sent no document');
    // Only text is edited here; another kind is another editor's.
    if (snapshot.kind !== undefined && snapshot.kind !== 'text') throw new Error(`A shared ${snapshot.kind} is not text`);
    this.fromSeq = answer.fromSeq;
    this.version = snapshot.version;
    this.saved = snapshot.saved;
    this.people = new Map(snapshot.people.map((one) => [one.client, { ...one, kind: kindOf(one.kind), editing: one.editing === true, ranges: one.ranges ?? [] }]));
    this.inflight = undefined;
    const had = how === 'keep' ? this.view.current() : undefined;
    if (had === undefined || had === snapshot.text) {
      this.pending = undefined;
      if (had === undefined) this.view.reset(snapshot.text);
    } else {
      const difference = changesOf(differenceOf(snapshot.text, had), snapshot.text.length);
      this.pending = difference.empty ? undefined : difference;
    }
    // What came while the subscribe was out, after the snapshot was taken.
    const held = this.waiting;
    this.waiting = undefined;
    for (const one of held) if ((one.serverSeq ?? Number.MAX_SAFE_INTEGER) > this.fromSeq) this.read(one);
    if (this.mode === 'live') this.send();
    // A subscribe makes the person new to the host: whether they edit is said again.
    if (this.editing) this.channel.dispatch({ type: 'x-ahpd-shared/editing', editing: true });
    this.view.changed();
  }

  /** Say to everyone whether the person is editing, not only reading. */
  setEditing(editing: boolean): void {
    if (this.editing === editing) return;
    this.editing = editing;
    if (this.waiting === undefined && !this.closed) this.channel.dispatch({ type: 'x-ahpd-shared/editing', editing });
  }

  /** The person's own changes the host does not have yet, as one. */
  private own(): ChangeSet | undefined {
    if (this.inflight === undefined) return this.pending;
    return this.pending === undefined ? this.inflight.changes : this.inflight.changes.compose(this.pending);
  }

  private send(): void {
    if (this.closed || this.inflight !== undefined || this.pending === undefined) return;
    const id = randomId();
    this.inflight = { id, changes: this.pending };
    this.pending = undefined;
    this.channel.dispatch({
      type: 'x-ahpd-shared/changed',
      version: this.version,
      changes: editsOf(this.inflight.changes),
      // The editor's text is the host's with this change on it, so the carets go as they are.
      ranges: this.lastRanges,
      id,
    });
  }

  private sendCarets(): void {
    if (this.closed || this.waiting !== undefined) return;
    // `selected` is on `version`: every change of the person's own goes back out of the carets.
    const ranges = mapRanges(this.lastRanges, this.own()?.invertedDesc);
    this.channel.dispatch({ type: 'x-ahpd-shared/selected', version: this.version, ranges });
  }

  private onChanged(envelope: ChannelEnvelope): void {
    const action = envelope.action;
    if (this.inflight !== undefined && action.id === this.inflight.id) {
      // The host took it, moved past what came first; the editor already has it.
      this.version = Number(action.version) + 1;
      this.inflight = undefined;
      if (this.mode === 'live') this.send();
      this.view.changed();
      return;
    }
    const own = this.own();
    const base = own?.length ?? this.view.current().length;
    let host: ChangeSet;
    try {
      host = changesOf(action.changes, base);
    } catch {
      void this.resubscribe('keep');
      return;
    }
    // Move it past the person's own changes, and theirs past it.
    let incoming = host;
    if (this.inflight !== undefined) {
      const moved = incoming.map(this.inflight.changes, true);
      this.inflight = { ...this.inflight, changes: this.inflight.changes.map(incoming) };
      incoming = moved;
    }
    if (this.pending !== undefined) {
      const moved = incoming.map(this.pending, true);
      this.pending = this.pending.map(incoming);
      incoming = moved;
    }
    this.version = Number(action.version) + 1;
    for (const person of this.people.values()) person.ranges = mapRanges(person.ranges, host);
    const sender = envelope.origin === undefined ? undefined : this.people.get(envelope.origin.clientId);
    if (sender !== undefined && Array.isArray(action.ranges)) sender.ranges = action.ranges as Range[];
    this.view.apply(incoming);
    this.view.changed();
  }

  private onSelected(envelope: ChannelEnvelope): void {
    const client = envelope.origin?.clientId;
    if (client === undefined || client === this.me()) return;
    const person = this.people.get(client);
    if (person === undefined) return;
    person.ranges = Array.isArray(envelope.action.ranges) ? envelope.action.ranges as Range[] : [];
    this.view.changed();
  }

  private onRefused(reason: string): void {
    this.inflight = undefined;
    if (reason.startsWith('stale:')) {
      void this.resubscribe('keep');
      return;
    }
    // Sending it again would be refused again: the host's text goes back in the editor.
    this.view.refused(reason);
    void this.resubscribe('reset');
  }
}
