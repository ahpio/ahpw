/**
 * Markdown drawn as a page while it stays the text: the live preview.
 *
 * Each part of the syntax tree gets its style, and its markers (`#`, `**`,
 * `[ ]`, `](url)`) are hidden, except on a line that holds a caret or a
 * selection while the text is editable: that line shows its Markdown as it
 * is, so it is edited as text. Positions are the text's own offsets, so the
 * shared editing, the carets and the comments work as in the source view.
 *
 * Tables and fenced blocks, diagrams among them, are drawn whole in place of
 * their lines, by a state field: CodeMirror takes block decorations only from one.
 */
import { syntaxTree } from '@codemirror/language';
import { RangeSetBuilder, StateEffect, StateField, type EditorState, type Extension, type Range } from '@codemirror/state';
import { Decoration, EditorView, ViewPlugin, WidgetType, type DecorationSet, type ViewUpdate } from '@codemirror/view';
import './livePreview.css';

/** What the preview asks of the page around it. */
export interface LivePreviewOptions {
  /** Open a link the person Mod-clicked, as the file's folder reads it. */
  openLink(href: string): void;
  /** Draw an image into `dom`; the answer undraws it. */
  image(dom: HTMLElement, src: string, alt: string): () => void;
  /** Draw a block's Markdown, a table or a fenced block, into `dom`; the answer undraws it. */
  block(dom: HTMLElement, markdown: string): () => void;
}

/** The lines that show their Markdown: those holding a caret or a selection, while the text is editable. */
export const sourceLines = (state: EditorState): Set<number> => {
  const lines = new Set<number>();
  if (state.readOnly) return lines;
  for (const range of state.selection.ranges) {
    const first = state.doc.lineAt(range.from).number;
    const last = state.doc.lineAt(range.to).number;
    for (let line = first; line <= last; line += 1) lines.add(line);
  }
  return lines;
};

const HEADINGS: Record<string, string> = {
  ATXHeading1: 'web-lp-h1', ATXHeading2: 'web-lp-h2', ATXHeading3: 'web-lp-h3',
  ATXHeading4: 'web-lp-h4', ATXHeading5: 'web-lp-h5', ATXHeading6: 'web-lp-h6',
};

const INLINE: Record<string, { style: string; marker: string }> = {
  Emphasis: { style: 'web-lp-em', marker: 'EmphasisMark' },
  StrongEmphasis: { style: 'web-lp-strong', marker: 'EmphasisMark' },
  Strikethrough: { style: 'web-lp-strike', marker: 'StrikethroughMark' },
  InlineCode: { style: 'web-lp-code', marker: 'CodeMark' },
};

/** A list item's bullet, drawn as a dot. */
class Bullet extends WidgetType {
  override eq(): boolean { return true; }
  toDOM(): HTMLElement {
    const dot = document.createElement('span');
    dot.className = 'web-lp-bullet';
    dot.textContent = '•';
    return dot;
  }
}

/** A task box; a click ticks it by writing into the text, where the text is editable. */
class TaskBox extends WidgetType {
  constructor(readonly checked: boolean, readonly at: number, readonly locked: boolean) { super(); }
  override eq(other: TaskBox): boolean { return other.checked === this.checked && other.at === this.at && other.locked === this.locked; }
  toDOM(view: EditorView): HTMLElement {
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.className = 'web-lp-task';
    box.checked = this.checked;
    box.disabled = this.locked;
    box.addEventListener('mousedown', (event) => { event.preventDefault(); });
    box.addEventListener('click', (event) => {
      event.preventDefault();
      if (view.state.readOnly) return;
      view.dispatch({ changes: { from: this.at, to: this.at + 3, insert: this.checked ? '[ ]' : '[x]' } });
    });
    return box;
  }
  override ignoreEvent(): boolean { return false; }
}

/** An HTML tag's attributes, by name in lower case; a value with no quotes ends at a space or `>`. */
export const htmlAttributes = (tag: string): Record<string, string> => {
  const found: Record<string, string> = {};
  for (const match of tag.matchAll(/([\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)) {
    found[match[1]!.toLowerCase()] = match[2] ?? match[3] ?? match[4] ?? '';
  }
  return found;
};

/** The `<img>` tags in some HTML, each as its source, its text and its size. */
export const htmlImages = (html: string): { src: string; alt: string; width?: string; height?: string }[] =>
  [...html.matchAll(/<img\b[^>]*>/gi)].flatMap((match) => {
    const attributes = htmlAttributes(match[0]);
    if (attributes.src === undefined || attributes.src === '') return [];
    return [{ src: attributes.src, alt: attributes.alt ?? '', ...(attributes.width === undefined ? {} : { width: attributes.width }), ...(attributes.height === undefined ? {} : { height: attributes.height }) }];
  });

/** A CSS length from an HTML size: a bare number is pixels. */
const cssSize = (size: string | undefined): string | undefined => (size === undefined ? undefined : /^\d+$/.test(size) ? `${size}px` : size);

/** A drawing's height once drawn, by its key: the editor measures its line again when it changes. */
const drawnSized = StateEffect.define<{ key: string; height: number }>();

/** Watch a drawing's element, and say its height when it changes. */
const watchHeight = (view: EditorView, holder: PictureHolder, key: string, known: number): void => {
  if (typeof ResizeObserver === 'undefined') return;
  let told = known;
  holder.watch = new ResizeObserver(() => {
    const height = Math.round(holder.getBoundingClientRect().height);
    if (height === told) return;
    told = height;
    queueMicrotask(() => { view.dispatch({ effects: drawnSized.of({ key, height }) }); });
  });
  holder.watch.observe(holder);
};

/** What an image's element holds, so a later widget that reuses it can stop it. */
interface PictureHolder extends HTMLElement {
  undraw?: () => void;
  watch?: ResizeObserver;
}

/**
 * An image, drawn by the page from the file's folder. It arrives after its
 * line is measured, so its height is part of the widget: a new height makes
 * the line count as changed, and the editor measures it again, with the
 * element kept, so the image is not read twice.
 */
class Picture extends WidgetType {
  constructor(readonly src: string, readonly alt: string, readonly height: number, readonly options: LivePreviewOptions,
    readonly size: { width?: string; height?: string; inline?: boolean } = {}) { super(); }
  override eq(other: Picture): boolean {
    return other.src === this.src && other.alt === this.alt && other.height === this.height
      && other.size.width === this.size.width && other.size.height === this.size.height && other.size.inline === this.size.inline;
  }
  toDOM(view: EditorView): HTMLElement {
    const holder: PictureHolder = document.createElement('span');
    holder.className = this.size.inline === true ? 'web-lp-image web-lp-image--inline' : 'web-lp-image';
    const width = cssSize(this.size.width);
    const height = cssSize(this.size.height);
    if (width !== undefined) holder.style.setProperty('--web-lp-image-width', width);
    if (height !== undefined) holder.style.setProperty('--web-lp-image-height', height);
    holder.dataset.src = this.src;
    holder.undraw = this.options.image(holder, this.src, this.alt);
    watchHeight(view, holder, this.src, this.height);
    return holder;
  }
  override updateDOM(dom: HTMLElement): boolean { return dom.dataset.src === this.src; }
  override destroy(dom: HTMLElement): void {
    const holder = dom as PictureHolder;
    holder.watch?.disconnect();
    holder.undraw?.();
  }
}

/** A table or a fenced block, drawn whole from its Markdown; its height is part of it, as an image's is. */
class BlockDrawing extends WidgetType {
  constructor(readonly markdown: string, readonly height: number, readonly options: LivePreviewOptions) { super(); }
  override eq(other: BlockDrawing): boolean { return other.markdown === this.markdown && other.height === this.height; }
  override get estimatedHeight(): number { return this.height > 0 ? this.height : -1; }
  toDOM(view: EditorView): HTMLElement {
    const holder: PictureHolder = document.createElement('div');
    holder.className = 'web-lp-block';
    holder.dataset.markdown = this.markdown;
    holder.undraw = this.options.block(holder, this.markdown);
    watchHeight(view, holder, this.markdown, this.height);
    return holder;
  }
  override updateDOM(dom: HTMLElement): boolean { return dom.dataset.markdown === this.markdown; }
  override destroy(dom: HTMLElement): void {
    const holder = dom as PictureHolder;
    holder.watch?.disconnect();
    holder.undraw?.();
  }
  override ignoreEvent(): boolean { return false; }
}

/** An HTML block's images, drawn in a row, aligned as the block's own tag says; the rest of its HTML is not drawn. */
class HtmlImages extends WidgetType {
  constructor(readonly html: string, readonly height: number, readonly options: LivePreviewOptions) { super(); }
  override eq(other: HtmlImages): boolean { return other.html === this.html && other.height === this.height; }
  toDOM(view: EditorView): HTMLElement {
    const holder: PictureHolder = document.createElement('div');
    holder.className = 'web-lp-html';
    holder.dataset.html = this.html;
    const align = htmlAttributes(this.html.match(/^<\w+[^>]*>/)?.[0] ?? '').align;
    if (align === 'center' || align === 'right' || align === 'left') holder.style.textAlign = align;
    const undraws: (() => void)[] = [];
    for (const image of htmlImages(this.html)) {
      const one = document.createElement('span');
      one.className = 'web-lp-image web-lp-image--inline';
      const width = cssSize(image.width);
      const height = cssSize(image.height);
      if (width !== undefined) one.style.setProperty('--web-lp-image-width', width);
      if (height !== undefined) one.style.setProperty('--web-lp-image-height', height);
      undraws.push(this.options.image(one, image.src, image.alt));
      holder.append(one);
    }
    holder.undraw = () => { for (const undraw of undraws) undraw(); };
    watchHeight(view, holder, this.html, this.height);
    return holder;
  }
  override updateDOM(dom: HTMLElement): boolean { return dom.dataset.html === this.html; }
  override destroy(dom: HTMLElement): void {
    const holder = dom as PictureHolder;
    holder.watch?.disconnect();
    holder.undraw?.();
  }
  override ignoreEvent(): boolean { return false; }
}

/** The blocks drawn whole: each table and fenced block away from the caret's lines, and an HTML block's images. */
export const blockDecorations = (state: EditorState, options: LivePreviewOptions, heights: ReadonlyMap<string, number> = new Map()): DecorationSet => {
  const shown = sourceLines(state);
  const ranges: Range<Decoration>[] = [];
  syntaxTree(state).iterate({
    enter: (node) => {
      if (node.name !== 'FencedCode' && node.name !== 'Table' && node.name !== 'HTMLBlock') return true;
      const first = state.doc.lineAt(node.from);
      const last = state.doc.lineAt(node.to);
      for (let line = first.number; line <= last.number; line += 1) if (shown.has(line)) return false;
      const markdown = state.doc.sliceString(first.from, last.to);
      if (node.name === 'HTMLBlock') {
        // Only an HTML block with images is drawn; any other stays as its text.
        if (htmlImages(markdown).length > 0) ranges.push(Decoration.replace({ widget: new HtmlImages(markdown, heights.get(markdown) ?? 0, options), block: true }).range(first.from, last.to));
        return false;
      }
      ranges.push(Decoration.replace({ widget: new BlockDrawing(markdown, heights.get(markdown) ?? 0, options), block: true }).range(first.from, last.to));
      return false;
    },
  });
  return Decoration.set(ranges, true);
};

const hidden = Decoration.replace({});
const marker = Decoration.mark({ class: 'web-lp-marker' });
const sourceLine = Decoration.line({ class: 'web-lp-source' });

/** The text of a node's child of a given name, or nothing. */
const childText = (state: EditorState, node: { node: { getChild(name: string): { from: number; to: number } | null } }, name: string): string | undefined => {
  const child = node.node.getChild(name);
  return child === null ? undefined : state.doc.sliceString(child.from, child.to);
};

/** Hide a marker and the one space after it, where there is one. */
const hideWithSpace = (state: EditorState, from: number, to: number): Range<Decoration> =>
  hidden.range(from, state.doc.sliceString(to, to + 1) === ' ' ? to + 1 : to);

/** The preview's decorations over `from` to `to` of the text. */
export const previewDecorations = (state: EditorState, options: LivePreviewOptions, from = 0, to = state.doc.length, heights: ReadonlyMap<string, number> = new Map()): DecorationSet => {
  const shown = sourceLines(state);
  const onSource = (pos: number): boolean => shown.has(state.doc.lineAt(pos).number);
  const ranges: Range<Decoration>[] = [];
  for (const line of shown) {
    if (line <= state.doc.lines) ranges.push(sourceLine.range(state.doc.line(line).from));
  }
  syntaxTree(state).iterate({
    from,
    to,
    enter: (node) => {
      const name = node.name;
      // Blocks are drawn whole by the state field; one with a caret in it is its Markdown, as source, every line of it.
      if (name === 'FencedCode' || name === 'Table') {
        const first = state.doc.lineAt(node.from).number;
        const last = state.doc.lineAt(node.to).number;
        let editing = false;
        for (let line = first; line <= last; line += 1) if (shown.has(line)) editing = true;
        if (editing) for (let line = first; line <= last; line += 1) if (!shown.has(line)) ranges.push(sourceLine.range(state.doc.line(line).from));
        return false;
      }
      if (name === 'HTMLBlock' || name === 'CodeBlock') return false;
      // An `<img>` tag among the text, such as a logo in a heading.
      if (name === 'HTMLTag') {
        const tag = state.doc.sliceString(node.from, node.to);
        if (onSource(node.from) || !/^<img\b/i.test(tag)) return false;
        const image = htmlImages(tag)[0];
        if (image !== undefined) {
          ranges.push(Decoration.replace({ widget: new Picture(image.src, image.alt, heights.get(image.src) ?? 0, options, {
            inline: true, ...(image.width === undefined ? {} : { width: image.width }), ...(image.height === undefined ? {} : { height: image.height }) }) }).range(node.from, node.to));
        }
        return false;
      }
      const heading = HEADINGS[name];
      if (heading !== undefined) {
        if (onSource(node.from)) {
          const mark = node.node.getChild('HeaderMark');
          if (mark !== null) ranges.push(marker.range(mark.from, mark.to));
          return false;
        }
        ranges.push(Decoration.line({ class: heading }).range(state.doc.lineAt(node.from).from));
        const mark = node.node.getChild('HeaderMark');
        if (mark !== null) ranges.push(hideWithSpace(state, mark.from, mark.to));
        return true;
      }
      const inline = INLINE[name];
      if (inline !== undefined) {
        const marks = node.node.getChildren(inline.marker);
        if (onSource(node.from)) {
          for (const one of marks) ranges.push(marker.range(one.from, one.to));
          return true;
        }
        ranges.push(Decoration.mark({ class: inline.style }).range(node.from, node.to));
        for (const one of marks) if (one.to > one.from) ranges.push(hidden.range(one.from, one.to));
        return true;
      }
      if (name === 'Link') {
        const marks = node.node.getChildren('LinkMark');
        const url = childText(state, node, 'URL');
        if (onSource(node.from) || marks.length < 2 || url === undefined) return true;
        const open = marks[0]!;
        const close = marks[1]!;
        ranges.push(hidden.range(open.from, open.to));
        ranges.push(Decoration.mark({ class: 'web-lp-link', attributes: { 'data-href': url, title: url } }).range(open.to, close.from));
        ranges.push(hidden.range(close.from, node.to));
        // The link's text may be an image, as a badge is: it is drawn inside the link.
        return true;
      }
      if (name === 'Image') {
        const url = childText(state, node, 'URL');
        if (onSource(node.from) || url === undefined) return false;
        const marks = node.node.getChildren('LinkMark');
        const alt = marks.length >= 2 ? state.doc.sliceString(marks[0]!.to, marks[1]!.from) : '';
        // An image inside a link, as a badge, stays in the line; an image alone is drawn under its line.
        const inline = node.node.parent?.name === 'Link';
        ranges.push(Decoration.replace({ widget: new Picture(url, alt, heights.get(url) ?? 0, options, { inline }) }).range(node.from, node.to));
        return false;
      }
      if (name === 'Blockquote') {
        for (let pos = node.from; pos <= node.to;) {
          const line = state.doc.lineAt(pos);
          ranges.push(Decoration.line({ class: 'web-lp-quote' }).range(line.from));
          pos = line.to + 1;
        }
        return true;
      }
      if (name === 'QuoteMark') {
        if (!onSource(node.from)) ranges.push(hideWithSpace(state, node.from, node.to));
        else ranges.push(marker.range(node.from, node.to));
        return false;
      }
      if (name === 'ListItem') {
        const mark = node.node.getChild('ListMark');
        if (mark === null || onSource(node.from)) return true;
        const task = node.node.getChild('Task');
        const box = task?.getChild('TaskMarker');
        if (box !== null && box !== undefined) {
          const checked = /x/i.test(state.doc.sliceString(box.from, box.to));
          const after = state.doc.sliceString(box.to, box.to + 1) === ' ' ? box.to + 1 : box.to;
          ranges.push(Decoration.replace({ widget: new TaskBox(checked, box.from, state.readOnly) }).range(mark.from, after));
          if (checked) ranges.push(Decoration.mark({ class: 'web-lp-done' }).range(after, task!.to));
          return true;
        }
        if (node.node.parent?.name === 'BulletList') ranges.push(Decoration.replace({ widget: new Bullet() }).range(mark.from, mark.to));
        return true;
      }
      return true;
    },
  });
  // Several parts may start at one place: the builder wants them in order.
  ranges.sort((a, b) => a.from - b.from || a.value.startSide - b.value.startSide);
  const builder = new RangeSetBuilder<Decoration>();
  for (const one of ranges) builder.add(one.from, one.to, one.value);
  return builder.finish();
};

/** The live preview: its decorations over the visible text, the page's font, and Mod-click on a link. */
export function livePreview(options: LivePreviewOptions): Extension {
  const plugin = ViewPlugin.fromClass(class {
    decorations: DecorationSet;
    /** Each image's height once drawn, by its source. */
    heights = new Map<string, number>();
    constructor(view: EditorView) { this.decorations = this.draw(view); }
    update(update: ViewUpdate): void {
      let sized = false;
      for (const tr of update.transactions) {
        for (const effect of tr.effects) {
          if (!effect.is(drawnSized)) continue;
          this.heights.set(effect.value.key, effect.value.height);
          sized = true;
        }
      }
      if (sized || update.docChanged || update.viewportChanged || update.selectionSet || update.focusChanged
        || syntaxTree(update.state) !== syntaxTree(update.startState) || update.startState.readOnly !== update.state.readOnly) {
        this.decorations = this.draw(update.view);
      }
    }
    draw(view: EditorView): DecorationSet {
      const { from, to } = view.visibleRanges.length === 0 ? { from: 0, to: 0 } : { from: view.visibleRanges[0]!.from, to: view.visibleRanges.at(-1)!.to };
      return previewDecorations(view.state, options, from, to, this.heights);
    }
  }, { decorations: (one) => one.decorations });
  const blocks = StateField.define<{ heights: Map<string, number>; set: DecorationSet }>({
    create: (state) => ({ heights: new Map(), set: blockDecorations(state, options) }),
    update(held, tr) {
      let heights = held.heights;
      for (const effect of tr.effects) {
        if (!effect.is(drawnSized)) continue;
        if (heights === held.heights) heights = new Map(heights);
        heights.set(effect.value.key, effect.value.height);
      }
      if (heights === held.heights && !tr.docChanged && !tr.selection && syntaxTree(tr.state) === syntaxTree(tr.startState)
        && tr.state.readOnly === tr.startState.readOnly) return held;
      return { heights, set: blockDecorations(tr.state, options, heights) };
    },
    provide: (field) => EditorView.decorations.from(field, (held) => held.set),
  });
  return [
    plugin,
    blocks,
    EditorView.editorAttributes.of({ class: 'web-lp' }),
    // A page wraps its lines.
    EditorView.lineWrapping,
    EditorView.domEventHandlers({
      click(event) {
        if (!(event.metaKey || event.ctrlKey)) return false;
        const link = event.target instanceof Element ? event.target.closest<HTMLElement>('.web-lp-link[data-href]') : null;
        if (link?.dataset.href === undefined) return false;
        event.preventDefault();
        options.openLink(link.dataset.href);
        return true;
      },
    }),
  ];
}
