import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { createScena } from '@softov/scena/core';
import { ScenaProvider } from '@softov/scena/react';
import { ExplorerList, shownRows, type Row } from './ExplorerList.js';

const row = (key: string, title: string, group?: string): Row => ({
  key, title, dot: 'ok', dotLabel: 'ok', lines: [`${title} line`], menu: [],
  ...(group === undefined ? {} : { group: { key: group, label: group } }),
});

describe('shownRows', () => {
  const installed = [row('a', 'Agent ACP', 'ready'), row('c', 'Computer', 'ready')];
  const listed = [row('l1', 'Agent Claude'), row('l2', 'Bot')];

  it('shows the rows with no search, and never the search rows', () => {
    expect(shownRows(installed, listed, '').map((one) => one.key)).toEqual(['a', 'c']);
  });

  it('shows the matching rows, then the matching search rows, with no groups', () => {
    const shown = shownRows(installed, listed, 'agent');
    expect(shown.map((one) => one.key)).toEqual(['a', 'l1']);
    expect(shown.every((one) => one.group === undefined)).toBe(true);
  });

  it('keeps the groups of a filter with no search rows', () => {
    expect(shownRows(installed, undefined, 'agent')).toEqual([installed[0]]);
  });
});

describe('ExplorerList rows', () => {
  const markup = (drags: boolean): string =>
    renderToStaticMarkup(createElement(ScenaProvider, {
      scena: createScena(),
      children: createElement(ExplorerList, {
        label: 'Sessions',
        rows: [row('h|s1', 'A session')],
        selected: null,
        onOpen: () => {},
        ...(drags ? { onRowDragStart: () => {} } : {}),
      }),
    }));

  it('drag with a drag handler', () => {
    expect(markup(true)).toContain('draggable="true"');
  });

  it('stay still with none', () => {
    expect(markup(false)).not.toContain('draggable');
  });
});
