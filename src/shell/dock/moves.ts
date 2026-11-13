/**
 * The changes a person makes to the docks from a menu, the settings or the
 * palette: each reads the docks as laid out, changes them and keeps them.
 */

import type { ReactiveStore } from '@softov/scena/types';
import { actionOf, DOCK_ACTIONS, laidOut, setDocks } from './actions.js';
import { isFloating, joinDock, moveDock, takeOut, type DockPlace } from './docks.js';

/** Whether an item shows: every bot does, and an action that is not hidden. */
export function isShownItem(store: ReactiveStore, key: string): boolean {
  const one = actionOf(key);
  return one === undefined || one.shown.read(store) === 'shown';
}

/** Whether an item drags: a bot always, and an action that is not locked. */
export function isMovable(store: ReactiveStore, key: string): boolean {
  const one = actionOf(key);
  return one === undefined || one.position.read(store) === 'movable';
}

export const newDockId = (): string => `d${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

/** A place just beside `place`, for an item taken out of its group. */
export function nextTo(place: DockPlace): DockPlace {
  if (isFloating(place)) return { float: { x: Math.min(0.95, place.float.x + 0.08), y: place.float.y } };
  return { edge: place.edge, at: place.at <= 0.8 ? place.at + 0.12 : place.at - 0.12 };
}

/** Moves the dock that holds `key`, with what it holds. */
export function moveGroupOf(store: ReactiveStore, key: string, place: DockPlace): void {
  const docks = laidOut(store);
  const dock = docks.find((one) => one.items.includes(key));
  if (dock !== undefined) setDocks(store, moveDock(docks, dock.id, place));
}

/** Puts `key` at the back of the dock `target`. */
export function joinGroup(store: ReactiveStore, key: string, target: string): void {
  setDocks(store, joinDock(laidOut(store), [key], target));
}

/** Takes `key` out of its group, to rest beside it. */
export function leaveGroup(store: ReactiveStore, key: string): void {
  const docks = laidOut(store);
  const dock = docks.find((one) => one.items.includes(key));
  if (dock !== undefined && dock.items.length > 1) setDocks(store, takeOut(docks, [key], newDockId(), nextTo(dock.place)));
}

/** Shows every action again, unlocked, together at its first place. Bots keep theirs. */
export function resetActions(store: ReactiveStore): void {
  for (const one of DOCK_ACTIONS) {
    one.shown.set(store, 'shown');
    one.position.set(store, 'movable');
  }
  const keys: readonly string[] = DOCK_ACTIONS.map((one) => one.key);
  setDocks(store, laidOut(store).map((dock) => ({ ...dock, items: dock.items.filter((item) => !keys.includes(item)) })).filter((dock) => dock.items.length > 0));
}
