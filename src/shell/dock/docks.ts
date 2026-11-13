/**
 * Where the floating items rest: bots and the dock's actions, in docks on the
 * window's edges or floating over it, as ahpapp lays out its bots. A dock on
 * an edge sits at a share along it, and a floating one at a share of the
 * window, so each keeps its place when the window is resized.
 */

import { hostKey } from '../../lib/storage-keys.js';

export type Edge = 'left' | 'right' | 'top' | 'bottom';

/** On an edge at a share along it, from 0 (top or left) to 1; or floating at a share of the window's width and height. */
export type DockPlace = { edge: Edge; at: number } | { float: { x: number; y: number } };

export interface Dock {
  id: string;
  place: DockPlace;
  /** The items it holds, front first: a bot as `refKey(host, slug)`, an action as `action:<id>`. */
  items: string[];
}

/** An item that is not in a dock yet, and the dock it goes to. */
export interface Loose {
  key: string;
  /** The dock it joins by id, made at `place` when there is none. */
  home: { id: string; place: DockPlace };
}

/** How many bots a dock draws before it counts the rest. */
export const CLUSTER_MAX = 4;

/** Where a new bot rests when no dock holds it: the first dock on the right edge, or this one. */
export const BOT_HOME = { id: 'home', place: { edge: 'right', at: 0.5 } } as const satisfies Loose['home'];

/** How near an edge a drop docks there instead of floating. */
export const SNAP_PX = 72;

export const isFloating = (place: DockPlace): place is { float: { x: number; y: number } } => 'float' in place;

/** Whether a dock lays its items in a row: on the top or bottom edge, or floating. */
export const isRow = (place: DockPlace): boolean => isFloating(place) || place.edge === 'top' || place.edge === 'bottom';

/**
 * The docks for the items there are: each keeps the items it holds that still
 * exist, an empty one goes, and an item no dock holds joins its home. A bot's
 * home is the first dock on the right edge, as before actions shared the docks.
 */
export function fillDocks(items: readonly string[], loose: (key: string) => Loose['home'], docks: readonly Dock[]): Dock[] {
  const there = new Set(items);
  let kept = docks.map((dock) => ({ ...dock, items: dock.items.filter((item) => there.has(item)) })).filter((dock) => dock.items.length > 0);
  const held = new Set(kept.flatMap((dock) => dock.items));
  for (const key of items) {
    if (held.has(key)) continue;
    const home = loose(key);
    const at = home.id === BOT_HOME.id
      ? kept.findIndex((dock) => !isFloating(dock.place) && dock.place.edge === 'right')
      : kept.findIndex((dock) => dock.id === home.id);
    kept = at < 0 ? [...kept, { id: home.id, place: home.place, items: [key] }] : kept.map((dock, index) => (index === at ? { ...dock, items: [...dock.items, key] } : dock));
    held.add(key);
  }
  return kept;
}

/** The bots a dock draws, and how many more it holds. Every action is drawn. */
export function splitCluster(items: readonly string[], isBot: (key: string) => boolean, max = CLUSTER_MAX): { shown: string[]; more: string[] } {
  const shown: string[] = [];
  const more: string[] = [];
  let bots = 0;
  for (const item of items) {
    if (!isBot(item)) shown.push(item);
    else if (bots++ < max) shown.push(item);
    else more.push(item);
  }
  return { shown, more };
}

/** The docks without `items`, an emptied one gone. */
export function without(docks: readonly Dock[], items: readonly string[]): Dock[] {
  const moving = new Set(items);
  return docks.map((dock) => ({ ...dock, items: dock.items.filter((item) => !moving.has(item)) })).filter((dock) => dock.items.length > 0);
}

/** `items` dropped on the dock `target`, at `index` among the items it keeps, or at its back. */
export function joinDock(docks: readonly Dock[], items: readonly string[], target: string, index?: number): Dock[] {
  return without(docks, items).map((dock) => {
    if (dock.id !== target) return dock;
    const next = [...dock.items];
    next.splice(index === undefined ? next.length : Math.max(0, Math.min(index, next.length)), 0, ...items);
    return { ...dock, items: next };
  });
}

/** `items` taken out to a dock of their own, `id`, at `place`. */
export function takeOut(docks: readonly Dock[], items: readonly string[], id: string, place: DockPlace): Dock[] {
  return [...without(docks, items), { id, place, items: [...items] }];
}

/** The dock `id` moved to `place`, with what it holds. */
export function moveDock(docks: readonly Dock[], id: string, place: DockPlace): Dock[] {
  return docks.map((dock) => (dock.id === id ? { ...dock, place } : dock));
}

/**
 * Where a drop at a point rests in a window of `width` by `height`: on the
 * nearest edge, kept off the corners, when it is near one or when it may not
 * float; floating at the point otherwise.
 */
export function snapDock(x: number, y: number, width: number, height: number, mayFloat: boolean): DockPlace {
  const away: [Edge, number][] = [['left', x], ['right', width - x], ['top', y], ['bottom', height - y]];
  const [edge, distance] = away.reduce((best, one) => (one[1] < best[1] ? one : best));
  if (mayFloat && distance > SNAP_PX) return { float: { x: clamp(x / width), y: clamp(y / height) } };
  const share = edge === 'left' || edge === 'right' ? y / height : x / width;
  return { edge, at: clamp(share) };
}

const clamp = (share: number): number => Math.min(0.95, Math.max(0.05, share));

/** Where each browser keeps the docks a person laid out; a host never sees them. */
export const DOCKS_KEY = hostKey('ahpd-web.docks');
/** Where the bots' pucks were kept before actions shared them, read once when nothing is kept under `DOCKS_KEY`. */
const PUCKS_KEY = hostKey('ahpd-web.bot-pucks');

const EDGES: readonly Edge[] = ['left', 'right', 'top', 'bottom'];
const isShare = (value: unknown): value is number => typeof value === 'number' && value >= 0 && value <= 1;
const isItems = (value: unknown): value is string[] => Array.isArray(value) && value.every((item) => typeof item === 'string');

function isPlace(value: unknown): value is DockPlace {
  const held = value as { edge?: unknown; at?: unknown; float?: { x?: unknown; y?: unknown } } | null;
  if (typeof held !== 'object' || held === null) return false;
  if (held.float !== undefined) return typeof held.float === 'object' && held.float !== null && isShare(held.float.x) && isShare(held.float.y);
  return EDGES.includes(held.edge as Edge) && isShare(held.at);
}

function isDock(value: unknown): value is Dock {
  const held = value as Partial<Dock> | null;
  return typeof held === 'object' && held !== null && typeof held.id === 'string' && isPlace(held.place) && isItems(held.items);
}

/** A puck as it was kept: `{ id, edge, at, bots }`. */
function fromPuck(value: unknown): Dock | undefined {
  const held = value as { id?: unknown; edge?: unknown; at?: unknown; bots?: unknown } | null;
  if (typeof held !== 'object' || held === null || typeof held.id !== 'string' || !EDGES.includes(held.edge as Edge) || !isShare(held.at) || !isItems(held.bots)) return undefined;
  return { id: held.id, place: { edge: held.edge as Edge, at: held.at }, items: held.bots };
}

export function readDocks(): Dock[] {
  try {
    const kept = localStorage.getItem(DOCKS_KEY);
    if (kept !== null) {
      const held: unknown = JSON.parse(kept);
      return Array.isArray(held) ? held.filter(isDock) : [];
    }
    const pucks: unknown = JSON.parse(localStorage.getItem(PUCKS_KEY) ?? '[]');
    return Array.isArray(pucks) ? pucks.map(fromPuck).filter((dock): dock is Dock => dock !== undefined) : [];
  } catch {
    return [];
  }
}

export function writeDocks(docks: readonly Dock[]): void {
  try {
    localStorage.setItem(DOCKS_KEY, JSON.stringify(docks));
  } catch {
    // Not kept, which only means the next visit rests every item at its home.
  }
}
