/**
 * A file's comments in the editor: each open comment's range marked, an
 * outdated one's point, and a mark in the gutter on each comment's first line.
 *
 * The comments come from the host; this only draws them, and says which one
 * the person clicked in the gutter.
 */
import { RangeSet, StateEffect, StateField, type EditorState, type Extension, type Range as Ranged, type Text } from '@codemirror/state';
import { Decoration, EditorView, GutterMarker, WidgetType, gutter, hoverTooltip, type DecorationSet } from '@codemirror/view';
import type { TextRange } from '@microsoft/agent-host-protocol';
import './comments.css';

/** One comment as the editor draws it. */
export interface DrawnComment {
  id: string;
  range: TextRange;
  outdated: boolean;
  /** The comment whose thread is open. */
  focused: boolean;
  /** The start of its first entry, for the pill shown over its words. */
  label: string;
}

/** What the editor tells the page, and the words it shows. */
export interface CommentsEditorOptions {
  /** The person clicked a comment's words, its pill or its gutter mark. */
  open(id: string): void;
  /** The person clicked the cross on a comment's pill. */
  remove(id: string): void;
  /** The cross's title. */
  removeTitle: string;
}

/** A pill's text: the first 30 characters of a comment, on one line. */
export const pillLabel = (text: string): string => {
  const line = text.replace(/\s+/g, ' ').trim();
  return line.length > 30 ? `${line.slice(0, 30)}…` : line;
};

/** The comments to draw now. */
export const setComments = StateEffect.define<DrawnComment[]>();

/**
 * A thread opened under its line, where the page has no room for a margin:
 * the page renders the thread into `dom`, and the editor makes room for it.
 */
export const setThreadAt = StateEffect.define<{ id: string; line: number; dom: HTMLElement } | null>();

/** Room below the last line, in pixels, so a thread pushed past the end of the text can be scrolled to. */
export const setRoomBelow = StateEffect.define<number>();

const roomField = StateField.define<number>({
  create: () => 0,
  update(room, tr) {
    for (const effect of tr.effects) if (effect.is(setRoomBelow)) room = effect.value;
    return room;
  },
  provide: (field) => EditorView.contentAttributes.from(field, (room) => (room > 0 ? { style: `padding-bottom: ${room}px` } : {})),
});

/** The room below the last line now. */
export const roomBelow = (state: EditorState): number => state.field(roomField, false) ?? 0;

/** The element a thread is rendered into, held by the page and placed by the editor. */
class ThreadSlot extends WidgetType {
  constructor(readonly id: string, readonly dom: HTMLElement) { super(); }
  override eq(other: ThreadSlot): boolean { return other.id === this.id && other.dom === this.dom; }
  toDOM(): HTMLElement { return this.dom; }
  override ignoreEvent(): boolean { return true; }
}

const threadField = StateField.define<DecorationSet>({
  create: () => Decoration.none,
  update(slot, tr) {
    let next = slot.map(tr.changes);
    for (const effect of tr.effects) {
      if (!effect.is(setThreadAt)) continue;
      if (effect.value === null) {
        next = Decoration.none;
        continue;
      }
      const { id, line, dom } = effect.value;
      const at = tr.state.doc.line(Math.min(Math.max(line, 0), tr.state.doc.lines - 1) + 1).to;
      next = Decoration.set([Decoration.widget({ widget: new ThreadSlot(id, dom), block: true, side: 1 }).range(at)]);
    }
    return next;
  },
  provide: (field) => EditorView.decorations.from(field),
});

/** An offset in the text for a line and a character, kept inside the text. */
export const offsetIn = (doc: Text, line: number, character: number): number => {
  if (line >= doc.lines) return doc.length;
  const at = doc.line(Math.max(0, line) + 1);
  return Math.min(at.from + Math.max(0, character), at.to);
};

const markOf = (comment: DrawnComment): Decoration => Decoration.mark({
  class: comment.focused ? 'web-comment web-comment--focused' : 'web-comment',
  attributes: { 'data-comment': comment.id },
});

/** Where an outdated comment's words were: a dashed bar. */
class OutdatedPoint extends WidgetType {
  constructor(readonly id: string) { super(); }
  override eq(other: OutdatedPoint): boolean { return other.id === this.id; }
  toDOM(): HTMLElement {
    const bar = document.createElement('span');
    bar.className = 'web-comment-outdated';
    bar.dataset.comment = this.id;
    return bar;
  }
}

/** The marks for the comments, inside a text. */
export const commentDecorations = (comments: readonly DrawnComment[], doc: Text): DecorationSet => {
  const ranges: Ranged<Decoration>[] = [];
  for (const comment of comments) {
    const from = offsetIn(doc, comment.range.start.line, comment.range.start.character);
    const to = Math.max(from, offsetIn(doc, comment.range.end.line, comment.range.end.character));
    if (comment.outdated) ranges.push(Decoration.widget({ widget: new OutdatedPoint(comment.id), side: 1 }).range(from));
    else if (from < to) ranges.push(markOf(comment).range(from, to));
  }
  return Decoration.set(ranges, true);
};

class CommentMarker extends GutterMarker {
  constructor(readonly id: string) { super(); }
  override eq(other: CommentMarker): boolean { return other.id === this.id; }
  override toDOM(): Node {
    const mark = document.createElement('span');
    mark.className = 'web-comment-gutter';
    mark.textContent = '💬︎';
    return mark;
  }
}

interface Drawn {
  marks: DecorationSet;
  gutter: RangeSet<GutterMarker>;
  /** Each comment's pill text. */
  labels: Map<string, string>;
}

/** The first comment on each line, as a gutter mark. */
const gutterMarks = (comments: readonly DrawnComment[], doc: Text): RangeSet<GutterMarker> => {
  const seen = new Set<number>();
  const marks: Ranged<GutterMarker>[] = [];
  for (const comment of comments) {
    const line = doc.lineAt(offsetIn(doc, comment.range.start.line, comment.range.start.character));
    if (seen.has(line.from)) continue;
    seen.add(line.from);
    marks.push(new CommentMarker(comment.id).range(line.from));
  }
  return RangeSet.of(marks, true);
};

const drawnField = StateField.define<Drawn>({
  create: () => ({ marks: Decoration.none, gutter: RangeSet.empty, labels: new Map() }),
  update(drawn, tr) {
    let next = { marks: drawn.marks.map(tr.changes), gutter: drawn.gutter.map(tr.changes), labels: drawn.labels };
    for (const effect of tr.effects) {
      if (effect.is(setComments)) next = { marks: commentDecorations(effect.value, tr.state.doc), gutter: gutterMarks(effect.value, tr.state.doc), labels: new Map(effect.value.map((one) => [one.id, one.label])) };
    }
    return next;
  },
  provide: (field) => EditorView.decorations.from(field, (drawn) => drawn.marks),
});

/** The comments over a position, from the inner one out. */
const commentsAt = (state: EditorState, pos: number): string[] => {
  const found: { id: string; size: number }[] = [];
  state.field(drawnField).marks.between(pos, pos, (from, to, mark) => {
    const id = (mark.spec.attributes as Record<string, string> | undefined)?.['data-comment'];
    if (id !== undefined && from <= pos && pos <= to && !found.some((one) => one.id === id)) found.push({ id, size: to - from });
  });
  return found.sort((a, b) => a.size - b.size).map((one) => one.id);
};

/** A pill for each comment over the hovered words: a click opens it, its cross asks to remove it. */
const pills = (options: CommentsEditorOptions): Extension => hoverTooltip((view, pos) => {
  const ids = commentsAt(view.state, pos);
  if (ids.length === 0) return null;
  const labels = view.state.field(drawnField).labels;
  return {
    pos,
    above: true,
    create: () => {
      const dom = document.createElement('div');
      dom.className = 'web-comment-pills';
      for (const id of ids) {
        const pill = document.createElement('span');
        pill.className = 'web-comment-pill';
        const open = document.createElement('button');
        open.type = 'button';
        open.className = 'web-comment-pill__open';
        open.textContent = pillLabel(labels.get(id) ?? '');
        open.addEventListener('click', () => { options.open(id); });
        const remove = document.createElement('button');
        remove.type = 'button';
        remove.className = 'web-comment-pill__remove';
        remove.title = options.removeTitle;
        remove.setAttribute('aria-label', options.removeTitle);
        remove.textContent = '✕';
        remove.addEventListener('click', () => { options.remove(id); });
        pill.append(open, remove);
        dom.append(pill);
      }
      return { dom };
    },
  };
}, { hoverTime: 250 });

/** The comments' marks, gutter and pills. */
export function commentsEditor(options: CommentsEditorOptions): Extension {
  const { open } = options;
  return [
    drawnField,
    threadField,
    roomField,
    pills(options),
    // A click on commented words opens their thread; the caret still goes where the click was.
    EditorView.domEventHandlers({
      click(event) {
        const mark = event.target instanceof Element ? event.target.closest<HTMLElement>('.web-comment[data-comment]') : null;
        if (mark?.dataset.comment !== undefined) open(mark.dataset.comment);
        return false;
      },
    }),
    gutter({
      class: 'web-comment-gutters',
      markers: (view) => view.state.field(drawnField).gutter,
      domEventHandlers: {
        mousedown(view, line) {
          let id: string | undefined;
          view.state.field(drawnField).gutter.between(line.from, line.from, (_from, _to, marker) => { id = (marker as CommentMarker).id; });
          if (id === undefined) return false;
          open(id);
          return true;
        },
      },
    }),
  ];
}

/** The comments drawn in a state, for a test. */
export const drawnIn = (state: EditorState): Drawn => state.field(drawnField);
export { drawnField };
