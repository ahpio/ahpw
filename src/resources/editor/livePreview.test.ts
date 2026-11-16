import { describe, expect, it } from 'vitest';
import { ensureSyntaxTree } from '@codemirror/language';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { EditorSelection, EditorState } from '@codemirror/state';
import type { Decoration } from '@codemirror/view';
import { blockDecorations, htmlImages, previewDecorations, sourceLines } from './livePreview.js';

/*
 * The live preview's decorations, on an `EditorState`: what each part is
 * drawn as, and what stays as text on the caret's line.
 */

const options = { openLink: () => {}, image: () => () => {}, block: () => () => {} };

const stateOf = (doc: string, caret: number | null, readOnly = false): EditorState => {
  const state = EditorState.create({
    doc,
    ...(caret === null ? {} : { selection: EditorSelection.single(caret) }),
    extensions: [markdown({ base: markdownLanguage }), EditorState.readOnly.of(readOnly)],
  });
  ensureSyntaxTree(state, state.doc.length, 5000);
  // A state keeps the tree of its own first parse; the next state takes the one parsed to the end.
  return state.update({}).state;
};

interface Drawn { from: number; to: number; text: string; kind: string }

/** Each decoration as the text it covers and what it does there. */
const drawn = (state: EditorState): Drawn[] => {
  const out: Drawn[] = [];
  previewDecorations(state, options).between(0, state.doc.length, (from, to, value: Decoration) => {
    const spec = value.spec as { class?: string; widget?: { constructor: { name: string } }; attributes?: Record<string, string> };
    const kind = spec.widget !== undefined ? `widget:${spec.widget.constructor.name}`
      : spec.class !== undefined ? spec.class
        : from === to ? 'line' : 'hidden';
    out.push({ from, to, text: state.doc.sliceString(from, to), kind });
  });
  return out;
};

describe('the preview', () => {
  it('sizes a heading and hides its marker away from the caret', () => {
    const state = stateOf('# Title\n\ntext', null, true);
    const parts = drawn(state);
    expect(parts).toContainEqual({ from: 0, to: 2, text: '# ', kind: 'hidden' });
    expect(previewDecorations(state, options).size).toBeGreaterThan(1);
  });

  it('styles bold and hides its markers, and keeps them on the caret\'s line', () => {
    const away = drawn(stateOf('a **b** c\nnext', 12));
    expect(away).toContainEqual({ from: 2, to: 7, text: '**b**', kind: 'web-lp-strong' });
    expect(away.filter((one) => one.kind === 'hidden').map((one) => one.text)).toEqual(['**', '**']);
    const on = drawn(stateOf('a **b** c\nnext', 1));
    expect(on.filter((one) => one.kind === 'hidden')).toEqual([]);
    expect(on.filter((one) => one.kind === 'web-lp-marker').map((one) => one.text)).toEqual(['**', '**']);
  });

  it('draws a task box in place of its marker, and strikes a done task', () => {
    const parts = drawn(stateOf('- [x] done\n- [ ] open\n', null, true));
    expect(parts.filter((one) => one.kind === 'widget:TaskBox').map((one) => one.text)).toEqual(['- [x] ', '- [ ] ']);
    expect(parts).toContainEqual({ from: 6, to: 10, text: 'done', kind: 'web-lp-done' });
  });

  it('draws a bullet as a dot', () => {
    const parts = drawn(stateOf('- one\n- two\n', null, true));
    expect(parts.filter((one) => one.kind === 'widget:Bullet').map((one) => one.text)).toEqual(['-', '-']);
  });

  it('shows a link as its text, with its URL hidden', () => {
    const parts = drawn(stateOf('See [the brief](brief.md) now', null, true));
    expect(parts).toContainEqual({ from: 5, to: 14, text: 'the brief', kind: 'web-lp-link' });
    expect(parts.filter((one) => one.kind === 'hidden').map((one) => one.text)).toEqual(['[', '](brief.md)']);
  });

  it('draws a `---` line as a rule, and keeps its text on the caret\'s line', () => {
    const parts = drawn(stateOf('a\n\n---\n\nb', null, true));
    expect(parts).toContainEqual({ from: 3, to: 3, text: '', kind: 'web-lp-rule' });
    expect(parts).toContainEqual({ from: 3, to: 6, text: '---', kind: 'hidden' });
    expect(drawn(stateOf('a\n\n---\n\nb', 4)).filter((one) => one.text === '---')).toEqual([]);
  });

  it('draws an image alone in its line, as a badge is', () => {
    const parts = drawn(stateOf('![logo](logo.png)\n', null, true));
    expect(parts).toEqual([{ from: 0, to: 17, text: '![logo](logo.png)', kind: 'widget:Picture' }]);
  });

  it('leaves a fenced block to the block drawings, with nothing styled inside it', () => {
    const parts = drawn(stateOf('```js\nconst a = **1**;\n```\n', null, true));
    expect(parts).toEqual([]);
  });
});

describe('the lines that show their Markdown', () => {
  it('are the caret\'s lines while the text is editable, and none while it is locked', () => {
    expect([...sourceLines(stateOf('a\nb\nc', 2))]).toEqual([2]);
    expect([...sourceLines(stateOf('a\nb\nc', 2, true))]).toEqual([]);
  });
});

describe('the blocks drawn whole', () => {
  /** Each block drawing as the text it replaces. */
  const blocks = (state: EditorState): string[] => {
    const out: string[] = [];
    blockDecorations(state, options).between(0, state.doc.length, (from, to) => { out.push(state.doc.sliceString(from, to)); });
    return out;
  };
  const doc = 'Intro\n\n| a | b |\n| - | - |\n| 1 | 2 |\n\n```mermaid\nflowchart LR\n  A --> B\n```\n\nEnd';

  it('draws a table and a fenced block away from the caret', () => {
    expect(blocks(stateOf(doc, 0))).toEqual(['| a | b |\n| - | - |\n| 1 | 2 |', '```mermaid\nflowchart LR\n  A --> B\n```']);
  });

  it('draws a block past what a new state parses at once', () => {
    const fence = '```mermaid\nflowchart LR\n  A --> B\n```';
    expect(blocks(stateOf(`${'A line of text.\n\n'.repeat(400)}${fence}\n`, 0))).toEqual([fence]);
  });

  it('leaves a block as text while a caret is in it', () => {
    const inTable = doc.indexOf('| 1 |');
    expect(blocks(stateOf(doc, inTable))).toEqual(['```mermaid\nflowchart LR\n  A --> B\n```']);
  });

  it('draws every block while the text is locked', () => {
    expect(blocks(stateOf(doc, doc.indexOf('A -->'), true))).toHaveLength(2);
  });
});

describe('a paragraph\'s lines', () => {
  /** The text each joined line break covers. */
  const breaks = (state: EditorState): string[] => {
    const out: string[] = [];
    blockDecorations(state, options).between(0, state.doc.length, (from, to, value: Decoration) => {
      if ((value.spec as { widget?: { constructor: { name: string } } }).widget?.constructor.name === 'SoftBreak') out.push(state.doc.sliceString(from, to));
    });
    return out;
  };

  it('join into one line, as badges do in a page', () => {
    expect(breaks(stateOf('![a](a.svg)\n![b](b.svg)\n![c](c.svg)\n\nnext', null, true))).toEqual(['\n', '\n']);
  });

  it('take the next line\'s indent and quote marks with the break', () => {
    expect(breaks(stateOf('- one\n  two\n', null, true))).toEqual(['\n  ']);
    expect(breaks(stateOf('> one\n> two\n', null, true))).toEqual(['\n> ']);
  });

  it('keep a hard break, and keep their lines while a caret is in the paragraph', () => {
    expect(breaks(stateOf('one  \ntwo\\\nthree', null, true))).toEqual([]);
    expect(breaks(stateOf('one\ntwo\n\nthree\nfour', 1))).toEqual(['\n']);
  });
});

describe('images written as HTML', () => {
  it('reads an img tag\'s source, text and size', () => {
    expect(htmlImages('<p align="center"><img src="logo.svg" alt="" height="32"><img src=\'b.png\' width=20></p>'))
      .toEqual([{ src: 'logo.svg', alt: '', height: '32' }, { src: 'b.png', alt: '', width: '20' }]);
  });

  it('draws an img tag in a heading as an inline image, and its marker hidden', () => {
    const parts = drawn(stateOf('# <img src="logo.svg" alt="" height="32"> ahpd\n\ntext', null, true));
    expect(parts).toContainEqual({ from: 2, to: 41, text: '<img src="logo.svg" alt="" height="32">', kind: 'widget:Picture' });
  });

  it('draws the image inside a link, as a badge', () => {
    const parts = drawn(stateOf('[![CI](ci.svg)](https://example.com/ci)\n', null, true));
    expect(parts).toContainEqual({ from: 1, to: 14, text: '![CI](ci.svg)', kind: 'widget:Picture' });
    expect(parts.filter((one) => one.kind === 'web-lp-link')).toHaveLength(1);
  });

  it('draws an HTML block with images as a block, and leaves other HTML as text', () => {
    const doc = 'a\n\n<p align="center"><img src="a.png" width="200"></p>\n\n<div>no image</div>\n';
    const out: string[] = [];
    blockDecorations(stateOf(doc, 0), options).between(0, doc.length, (from, to) => { out.push(doc.slice(from, to)); });
    expect(out).toEqual(['<p align="center"><img src="a.png" width="200"></p>']);
  });
});
