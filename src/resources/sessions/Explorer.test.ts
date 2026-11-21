// @vitest-environment jsdom
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, it, vi } from 'vitest';
import type { SessionSummary } from '@microsoft/agent-host-protocol';
import { createScena } from '@softov/scena/core';
import { ScenaProvider } from '@softov/scena/react';
import type { Row } from '../../shell/explorer/ExplorerList.js';

// The rows the explorer hands its list, each time it draws.
const handed: Row[][] = [];
vi.mock('../../shell/explorer/ExplorerList.js', () => ({
  ExplorerList: ({ rows }: { rows: Row[] }) => {
    handed.push(rows);
    return null;
  },
}));

const { ahpPaths, windowHost } = await import('../../bridges/data.js');
const { default: SessionExplorer } = await import('./Explorer.js');
const { SESSIONS_PINS } = await import('./pins.js');
const { refKey } = await import('../../bridges/hosts.js');

const summary = (resource: string, title: string, modifiedAt: string): SessionSummary =>
  ({ resource, title, provider: 'p', status: 1, createdAt: modifiedAt, modifiedAt }) as unknown as SessionSummary;

describe('the session explorer', () => {
  it('builds again only the row of the session that changed', async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const scena = createScena();
    const path = ahpPaths(windowHost()).sessions;
    const a = summary('s:/a', 'A', '2026-11-21T10:00:00Z');
    const b = summary('s:/b', 'B', '2026-11-21T09:00:00Z');
    scena.store.set(path, [a, b]);
    const root = createRoot(document.createElement('div'));
    await act(async () => root.render(createElement(ScenaProvider, { scena, children: createElement(SessionExplorer) })));
    const before = handed.at(-1)!;
    expect(before.map((row) => row.title)).toEqual(['A', 'B']);

    // A new list, as the host publishes when one session changes: B's summary is a new object, A's is the same.
    const bNow = summary('s:/b', 'B now', '2026-11-21T09:00:00Z');
    await act(async () => scena.store.set(path, [a, bNow]));
    const after = handed.at(-1)!;
    expect(after[0]).toBe(before[0]);
    expect(after[1]).not.toBe(before[1]);
    expect(after[1]?.title).toBe('B now');

    // A pin is read by every row: A goes to the top under its heading, as a new row.
    await act(async () => scena.store.set(SESSIONS_PINS, [refKey(windowHost(), 's:/a')]));
    const pinned = handed.at(-1)!;
    expect(pinned[0]).not.toBe(after[0]);
    expect(pinned[0]?.group?.key).toBe('#pinned');

    await act(async () => root.unmount());
  });
});
