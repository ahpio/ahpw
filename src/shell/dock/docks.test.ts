import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BOT_HOME, DOCKS_KEY, fillDocks, joinDock, moveDock, readDocks, snapDock, splitCluster, takeOut, type Dock } from './docks.js';

const ACTIONS = { id: 'actions', place: { edge: 'top', at: 0.5 } } as const;
const homeOf = (key: string) => (key.startsWith('action:') ? ACTIONS : BOT_HOME);

describe('fillDocks', () => {
  it('rests every bot on the right edge when none is laid out', () => {
    expect(fillDocks(['a', 'b'], homeOf, [])).toEqual([{ id: 'home', place: { edge: 'right', at: 0.5 }, items: ['a', 'b'] }]);
  });

  it('keeps what each dock holds, drops a gone item and an empty dock, and adds a new bot to the right edge', () => {
    const docks: Dock[] = [
      { id: 'p1', place: { edge: 'left', at: 0.2 }, items: ['a'] },
      { id: 'p2', place: { edge: 'top', at: 0.5 }, items: ['gone'] },
      { id: 'p3', place: { edge: 'right', at: 0.7 }, items: ['b'] },
    ];
    expect(fillDocks(['a', 'b', 'c'], homeOf, docks)).toEqual([
      { id: 'p1', place: { edge: 'left', at: 0.2 }, items: ['a'] },
      { id: 'p3', place: { edge: 'right', at: 0.7 }, items: ['b', 'c'] },
    ]);
  });

  it('rests the actions together at their home, and finds it again by id', () => {
    expect(fillDocks(['action:newSession', 'action:palette'], homeOf, [])).toEqual([
      { id: 'actions', place: { edge: 'top', at: 0.5 }, items: ['action:newSession', 'action:palette'] },
    ]);
    const moved: Dock[] = [{ id: 'actions', place: { float: { x: 0.4, y: 0.3 } }, items: ['action:palette'] }];
    expect(fillDocks(['action:newSession', 'action:palette'], homeOf, moved)).toEqual([
      { id: 'actions', place: { float: { x: 0.4, y: 0.3 } }, items: ['action:palette', 'action:newSession'] },
    ]);
  });
});

describe('splitCluster', () => {
  const isBot = (key: string): boolean => !key.startsWith('action:');

  it('draws four bots and counts the rest', () => {
    expect(splitCluster(['a', 'b', 'c', 'd', 'e', 'f'], isBot)).toEqual({ shown: ['a', 'b', 'c', 'd'], more: ['e', 'f'] });
    expect(splitCluster(['a'], isBot)).toEqual({ shown: ['a'], more: [] });
  });

  it('draws every action, and counts only bots toward the four', () => {
    expect(splitCluster(['action:x', 'a', 'b', 'c', 'd', 'e'], isBot)).toEqual({ shown: ['action:x', 'a', 'b', 'c', 'd'], more: ['e'] });
  });
});

describe('moving items', () => {
  const docks: Dock[] = [
    { id: 'a', place: { edge: 'right', at: 0.5 }, items: ['x', 'y'] },
    { id: 'b', place: { edge: 'left', at: 0.3 }, items: ['z'] },
  ];

  it('joins a dock at its back, and an emptied dock goes', () => {
    expect(joinDock(docks, ['z'], 'a')).toEqual([{ id: 'a', place: { edge: 'right', at: 0.5 }, items: ['x', 'y', 'z'] }]);
  });

  it('joins a dock where it is dropped among the items it keeps', () => {
    expect(joinDock(docks, ['z'], 'a', 0)[0]!.items).toEqual(['z', 'x', 'y']);
    expect(joinDock(docks, ['z'], 'a', 1)[0]!.items).toEqual(['x', 'z', 'y']);
    // Within its own dock: the index counts the items without it.
    expect(joinDock(docks, ['x'], 'a', 1)[0]!.items).toEqual(['y', 'x']);
  });

  it('takes items out to a dock of their own', () => {
    expect(takeOut(docks, ['y'], 'c', { edge: 'top', at: 0.2 })).toEqual([
      { id: 'a', place: { edge: 'right', at: 0.5 }, items: ['x'] },
      { id: 'b', place: { edge: 'left', at: 0.3 }, items: ['z'] },
      { id: 'c', place: { edge: 'top', at: 0.2 }, items: ['y'] },
    ]);
  });

  it('moves a whole dock with what it holds', () => {
    expect(moveDock(docks, 'a', { float: { x: 0.5, y: 0.3 } })[0]).toEqual({ id: 'a', place: { float: { x: 0.5, y: 0.3 } }, items: ['x', 'y'] });
  });

  it('snaps to the nearest edge, kept off the corners', () => {
    expect(snapDock(10, 300, 1000, 800, true)).toEqual({ edge: 'left', at: 0.375 });
    expect(snapDock(500, 790, 1000, 800, true)).toEqual({ edge: 'bottom', at: 0.5 });
    expect(snapDock(995, 2, 1000, 800, true)).toEqual({ edge: 'top', at: 0.95 });
  });

  it('floats away from the edges, unless it may not', () => {
    expect(snapDock(500, 400, 1000, 800, true)).toEqual({ float: { x: 0.5, y: 0.5 } });
    expect(snapDock(500, 300, 1000, 800, false)).toEqual({ edge: 'top', at: 0.5 });
  });
});

describe('readDocks', () => {
  const held = new Map<string, string>();
  beforeEach(() => {
    held.clear();
    vi.stubGlobal('localStorage', { getItem: (key: string) => held.get(key) ?? null, setItem: (key: string, value: string) => { held.set(key, value); } });
  });
  afterEach(() => vi.unstubAllGlobals());

  it('reads the pucks the bots were kept in before', () => {
    localStorage.setItem('ahpd-web.bot-pucks', JSON.stringify([{ id: 'p1', edge: 'left', at: 0.2, bots: ['h/a'] }, { id: 'bad', edge: 'middle', at: 2, bots: [] }]));
    expect(readDocks()).toEqual([{ id: 'p1', place: { edge: 'left', at: 0.2 }, items: ['h/a'] }]);
  });

  it('reads the docks once they are kept, and leaves out a malformed one', () => {
    localStorage.setItem('ahpd-web.bot-pucks', JSON.stringify([{ id: 'old', edge: 'left', at: 0.2, bots: ['h/a'] }]));
    localStorage.setItem(DOCKS_KEY, JSON.stringify([
      { id: 'd1', place: { float: { x: 0.5, y: 0.3 } }, items: ['action:palette'] },
      { id: 'd2', place: { float: { x: 7, y: 0.3 } }, items: ['x'] },
    ]));
    expect(readDocks()).toEqual([{ id: 'd1', place: { float: { x: 0.5, y: 0.3 } }, items: ['action:palette'] }]);
  });
});
