/**
 * A file's comments in the editor: each open comment's range marked, an
 * outdated one's point, and a mark in the gutter on each comment's first line.
 *
 * The comments come from the host; this only draws them, and says which one
 * the person clicked in the gutter.
 */
import { RangeSet, StateEffect, StateField, type EditorState, type Extension, type Range as Ranged, type Text } from '@codemirror/state';
import { Decoration, EditorView, GutterMarker, WidgetType, gutter, type DecorationSet } from '@codemirror/view';
import type { TextRange } from '@microsoft/agent-host-protocol';
import './comments.css';

/** One comment as the editor draws it. */
export interface DrawnComment {
  id: string;
  range: TextRange;
  outdated: boolean;
  /** The comment whose thread is open. */
  focused: boolean;
}

/** The comments to draw now. */
export const setComments = StateEffect.define<DrawnComment[]>();

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
  create: () => ({ marks: Decoration.none, gutter: RangeSet.empty }),
  update(drawn, tr) {
    let next = { marks: drawn.marks.map(tr.changes), gutter: drawn.gutter.map(tr.changes) };
    for (const effect of tr.effects) {
      if (effect.is(setComments)) next = { marks: commentDecorations(effect.value, tr.state.doc), gutter: gutterMarks(effect.value, tr.state.doc) };
    }
    return next;
  },
  provide: (field) => EditorView.decorations.from(field, (drawn) => drawn.marks),
});

/** The comments' marks and gutter; `open` is told the comment whose gutter mark the person clicked. */
export function commentsEditor(open: (id: string) => void): Extension {
  return [
    drawnField,
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
