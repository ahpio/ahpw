// @vitest-environment jsdom
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, it, vi } from 'vitest';
import { createScena } from '@softov/scena/core';
import { ScenaProvider } from '@softov/scena/react';
import type { Row } from './ExplorerList.js';

// Each row draws its initials through NameMark; counting its draws counts the rows drawn.
const drawn: string[] = [];
vi.mock('../NameMark.js', () => ({
  NameMark: ({ name }: { name: string }) => {
    drawn.push(name);
    return createElement('span', null, name);
  },
}));

const { ExplorerList } = await import('./ExplorerList.js');

const row = (key: string): Row => ({ key, title: key, initials: key, dot: 'ok', dotLabel: 'ok', lines: [], menu: [] });

describe('ExplorerList redraws', () => {
  it('redraws only the rows a selection changes, and calls the latest open', async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const scena = createScena();
    const rows = ['a', 'b', 'c', 'd'].map(row);
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);
    const draw = async (selected: string | null, onOpen: (key: string) => void): Promise<void> => {
      await act(async () => {
        root.render(createElement(ScenaProvider, { scena, children: createElement(ExplorerList, { label: 'List', rows, selected, onOpen }) }));
      });
    };

    await draw(null, () => {});
    expect(drawn.sort()).toEqual(['a', 'b', 'c', 'd']);

    drawn.length = 0;
    await draw('b', () => {});
    expect(drawn).toEqual(['b']);

    drawn.length = 0;
    const open = vi.fn();
    await draw('c', open);
    expect(drawn.sort()).toEqual(['b', 'c']);

    // A row kept from an earlier draw still calls the open of the last one.
    (host.querySelectorAll('li[role="option"]')[3] as HTMLElement).click();
    expect(open).toHaveBeenCalledWith('d');

    await act(async () => root.unmount());
    host.remove();
  });
});

describe('ExplorerList row drags', () => {
  it('hands a row\'s drag end to onRowDragEnd, with the row', async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const ended = vi.fn();
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);
    await act(async () => {
      root.render(createElement(ScenaProvider, { scena: createScena(), children: createElement(ExplorerList, { label: 'List', rows: [row('a')], selected: null, onOpen: () => {}, onRowDragStart: () => {}, onRowDragEnd: ended }) }));
    });
    const li = host.querySelector('li[role="option"]') as HTMLElement;
    await act(async () => {
      li.dispatchEvent(new Event('dragend', { bubbles: true }));
    });
    expect(ended).toHaveBeenCalledTimes(1);
    expect(ended.mock.calls[0]?.[1]).toMatchObject({ key: 'a' });
    await act(async () => root.unmount());
    host.remove();
  });
});
