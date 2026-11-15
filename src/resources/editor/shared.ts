/**
 * A shared document in the editor: the others' carets and selections, and
 * their edits applied in place.
 *
 * A remote edit carries `remoteEdit`, so it is not sent back, and stays out of
 * the undo history, so undo takes back only the person's own edits. CodeMirror
 * maps the person's own selection through every edit it applies.
 */
import { Annotation, StateEffect, StateField, Transaction, type ChangeSet, type EditorState, type Extension, type Range as Ranged } from '@codemirror/state';
import { Decoration, EditorView, WidgetType, type DecorationSet } from '@codemirror/view';
import { textToColor } from '../../shell/NameMark.js';
import type { DocumentPerson, DocumentView, Range, SharedDocument } from '../files/document.js';
import './shared.css';

/** Marks an edit that came from someone else, or the host's text after a reset. */
export const remoteEdit = Annotation.define<boolean>();

/** The people and their carets, as the editor draws them now. */
export const setPeople = StateEffect.define<DocumentPerson[]>();

/** A person's colour, and a light one for their selection. */
const colours = (name: string): { solid: string; light: string } => {
  const solid = textToColor(name);
  return { solid, light: solid.replace(/\)$/, ' / 0.25)') };
};

/** One caret of another person: a bar in their colour, and their name above it for 2 s. */
class CaretWidget extends WidgetType {
  constructor(readonly name: string, readonly colour: string, readonly position: number) { super(); }

  override eq(other: CaretWidget): boolean {
    return other.name === this.name && other.colour === this.colour && other.position === this.position;
  }

  toDOM(): HTMLElement {
    const caret = document.createElement('span');
    caret.className = 'web-caret';
    caret.style.borderLeftColor = this.colour;
    const tag = document.createElement('span');
    tag.className = 'web-caret__tag';
    tag.style.backgroundColor = this.colour;
    tag.textContent = this.name;
    caret.appendChild(tag);
    return caret;
  }

  override ignoreEvent(): boolean {
    return true;
  }
}

/** The decorations for the others' carets and selections, inside a text of `length` characters. */
export const peopleDecorations = (people: readonly DocumentPerson[], length: number): DecorationSet => {
  const marks: Ranged<Decoration>[] = [];
  for (const person of people) {
    if (person.me) continue;
    const { solid, light } = colours(person.name);
    for (const range of person.ranges) {
      const head = Math.min(Math.max(range.head, 0), length);
      const anchor = Math.min(Math.max(range.anchor, 0), length);
      const from = Math.min(head, anchor);
      const to = Math.max(head, anchor);
      if (from < to) marks.push(Decoration.mark({ class: 'web-caret__selection', attributes: { style: `background-color: ${light}` } }).range(from, to));
      marks.push(Decoration.widget({ widget: new CaretWidget(person.name, solid, head), side: 1 }).range(head));
    }
  }
  return Decoration.set(marks, true);
};

/** The others' carets and selections, moved with every edit and redrawn on `setPeople`. */
export const peopleField = StateField.define<DecorationSet>({
  create: () => Decoration.none,
  update(drawn, tr) {
    let next = drawn.map(tr.changes);
    for (const effect of tr.effects) if (effect.is(setPeople)) next = peopleDecorations(effect.value, tr.state.doc.length);
    return next;
  },
  provide: (field) => EditorView.decorations.from(field),
});

const rangesOf = (state: EditorState): Range[] => state.selection.ranges.map((one) => ({ anchor: one.anchor, head: one.head }));

/** The extension a shared editor carries: the people, and the person's edits and carets going to the document. */
export function sharedEditor(doc: () => SharedDocument | undefined): Extension {
  return [
    peopleField,
    EditorView.updateListener.of((update) => {
      const shared = doc();
      if (shared === undefined) return;
      const own = update.transactions.filter((tr) => tr.docChanged && tr.annotation(remoteEdit) !== true);
      for (const tr of own) shared.local(tr.changes, rangesOf(tr.state));
      if (own.length === 0 && update.selectionSet && update.transactions.every((tr) => tr.annotation(remoteEdit) !== true)) shared.select(rangesOf(update.state));
    }),
  ];
}

/** A transaction that applies another person's edit: not sent back, not in the undo history. */
export const remoteChange = (changes: ChangeSet): { changes: ChangeSet; annotations: Annotation<unknown>[] } => ({
  changes,
  annotations: [remoteEdit.of(true), Transaction.addToHistory.of(false)],
});

/**
 * The document's view of an editor: what it reads from it and how it changes it.
 *
 * `changed` redraws the people a tick later, since the document says it from
 * inside the editor's own update, where the editor takes no new transaction.
 */
export class EditorDocumentView implements DocumentView {
  private drawPending = false;

  constructor(
    private readonly view: () => EditorView | null,
    private readonly doc: () => SharedDocument | undefined,
    private readonly onChanged: () => void,
    private readonly onRefused: (reason: string) => void,
  ) {}

  current(): string {
    return this.view()?.state.doc.toString() ?? '';
  }

  reset(text: string): void {
    const view = this.view();
    if (view === null) return;
    view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: text }, annotations: [remoteEdit.of(true), Transaction.addToHistory.of(false)] });
  }

  apply(changes: ChangeSet): void {
    this.view()?.dispatch(remoteChange(changes));
  }

  changed(): void {
    this.onChanged();
    if (this.drawPending) return;
    this.drawPending = true;
    queueMicrotask(() => {
      this.drawPending = false;
      const view = this.view();
      const doc = this.doc();
      if (view !== null && doc !== undefined) view.dispatch({ effects: setPeople.of(doc.everyone()) });
    });
  }

  refused(reason: string): void {
    this.onRefused(reason);
  }
}
