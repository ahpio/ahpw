/**
 * The dock's UI settings: how a group draws, and for each action whether it
 * shows, where it rests, what it is grouped with, its order and its lock.
 * Place, group and order read the docks as laid out, so a drag and the form
 * are the same change.
 */

import type { ReactiveStore, Scena } from '@softov/scena/types';
import { translate } from '@softov/scena';
import type { UiKey, UiSetting } from '../ui-settings/settings.js';
import { ACTION_GROUPS, DOCK_ACTIONS, DOCKS_PATH, isAction, laidOut, setDocks, type DockAction } from './actions.js';
import { isFloating, joinDock, moveDock, takeOut, type Dock, type DockPlace } from './docks.js';
import { isShownItem, newDockId, nextTo } from './moves.js';

const PLACES = ['top', 'right', 'bottom', 'left', 'floating'] as const;

const label = (name: string, value: string): string => translate(`host/settings/ui/${name}/${value}`);

/** Where a place value rests a dock moved there. */
function placeOf(value: string): DockPlace {
  if (value === 'floating') return { float: { x: 0.5, y: 0.3 } };
  const edge = PLACES.includes(value as (typeof PLACES)[number]) && value !== 'floating' ? (value as 'top' | 'right' | 'bottom' | 'left') : 'top';
  return { edge, at: edge === 'left' || edge === 'right' ? 0.3 : 0.5 };
}

const dockHolding = (docks: readonly Dock[], key: string): Dock | undefined => docks.find((dock) => dock.items.includes(key));
const watchDocks = (scena: Scena, changed: () => void) => scena.store.subscribe(DOCKS_PATH, changed);

/** The items of a dock that show, for an order a person can see. */
const shownIn = (store: ReactiveStore, dock: Dock): string[] => dock.items.filter((item) => isShownItem(store, item));

/** What an action can be grouped with: alone, another action, or the bots. */
function groupValues(scena: Scena, one: DockAction): string[] {
  const docks = laidOut(scena.store);
  const others = DOCK_ACTIONS.filter((other) => other !== one && isShownItem(scena.store, other.key)).map((other) => other.key);
  const bots = docks.some((dock) => dock.items.some((item) => !isAction(item)));
  return ['alone', ...others, ...(bots ? ['bots'] : [])];
}

function groupNow(store: ReactiveStore, one: DockAction): string {
  const dock = dockHolding(laidOut(store), one.key);
  if (dock === undefined) return 'alone';
  const rest = shownIn(store, dock).filter((item) => item !== one.key);
  return rest.find(isAction) ?? (rest.length > 0 ? 'bots' : 'alone');
}

function actionSettings(one: DockAction): UiSetting[] {
  const { id } = one;
  return [
    {
      key: `ui.${id}Button` as UiKey,
      values: () => one.shown.values,
      usual: () => one.shown.usual,
      label: (value) => label('dockButton', value),
      read: (scena) => one.shown.read(scena.store),
      apply: (scena, value) => one.shown.set(scena.store, value),
      watch: (scena, changed) => scena.store.subscribe(one.shown.path, changed),
    },
    {
      key: `ui.${id}Place` as UiKey,
      values: () => PLACES,
      usual: () => 'top',
      label: (value) => label('dockPlace', value),
      read: (scena) => {
        const place = dockHolding(laidOut(scena.store), one.key)?.place;
        return place === undefined ? 'top' : isFloating(place) ? 'floating' : place.edge;
      },
      apply: (scena, value) => {
        const docks = laidOut(scena.store);
        const dock = dockHolding(docks, one.key);
        if (dock !== undefined) setDocks(scena.store, moveDock(docks, dock.id, placeOf(value)));
      },
      watch: watchDocks,
    },
    {
      key: `ui.${id}Group` as UiKey,
      values: (scena) => groupValues(scena, one),
      usual: () => (one.id === 'newSession' ? 'action:palette' : 'action:newSession'),
      label: (value) => (value === 'alone' || value === 'bots' ? label('dockGroup', value) : translate('host/settings/ui/dockGroup/with', { name: translate(`shell/dock/${value.slice('action:'.length)}`) })),
      read: (scena) => groupNow(scena.store, one),
      apply: (scena, value) => {
        const docks = laidOut(scena.store);
        const dock = dockHolding(docks, one.key);
        if (dock === undefined) return;
        if (value === 'alone') {
          setDocks(scena.store, takeOut(docks, [one.key], newDockId(), nextTo(dock.place)));
          return;
        }
        const target = value === 'bots'
          ? docks.find((other) => other.items.some((item) => !isAction(item)))
          : dockHolding(docks, value);
        if (target !== undefined && target.id !== dock.id) setDocks(scena.store, joinDock(docks, [one.key], target.id));
      },
      watch: (scena, changed) => {
        const docks = watchDocks(scena, changed);
        const shown = DOCK_ACTIONS.map((other) => scena.store.subscribe(other.shown.path, changed));
        return { dispose: () => { docks.dispose(); shown.forEach((one) => one.dispose()); } };
      },
    },
    {
      key: `ui.${id}Order` as UiKey,
      values: (scena) => {
        const dock = dockHolding(laidOut(scena.store), one.key);
        const count = dock === undefined ? 1 : Math.max(1, shownIn(scena.store, dock).length);
        return Array.from({ length: count }, (_, at) => String(at + 1));
      },
      usual: () => (one.id === 'newSession' ? '1' : '2'),
      label: (value) => value,
      read: (scena) => {
        const dock = dockHolding(laidOut(scena.store), one.key);
        return String(dock === undefined ? 1 : Math.max(1, shownIn(scena.store, dock).indexOf(one.key) + 1));
      },
      apply: (scena, value) => {
        const docks = laidOut(scena.store);
        const dock = dockHolding(docks, one.key);
        if (dock === undefined) return;
        // The order counts the items that show; a hidden one keeps its place among them.
        const shown = shownIn(scena.store, dock).filter((item) => item !== one.key);
        const before = shown[Number(value) - 1];
        const rest = dock.items.filter((item) => item !== one.key);
        setDocks(scena.store, joinDock(docks, [one.key], dock.id, before === undefined ? rest.length : rest.indexOf(before)));
      },
      watch: watchDocks,
    },
    {
      key: `ui.${id}Position` as UiKey,
      values: () => one.position.values,
      usual: () => one.position.usual,
      label: (value) => label('dockPosition', value),
      read: (scena) => one.position.read(scena.store),
      apply: (scena, value) => one.position.set(scena.store, value),
      watch: (scena, changed) => scena.store.subscribe(one.position.path, changed),
    },
  ];
}

export const DOCK_SETTINGS: readonly UiSetting[] = [
  {
    key: 'ui.actionGroups',
    values: () => ACTION_GROUPS.values,
    usual: () => ACTION_GROUPS.usual,
    label: (value) => label('actionGroups', value),
    read: (scena) => ACTION_GROUPS.read(scena.store),
    apply: (scena, value) => ACTION_GROUPS.set(scena.store, value),
    watch: (scena, changed) => scena.store.subscribe(ACTION_GROUPS.path, changed),
  },
  ...DOCK_ACTIONS.flatMap(actionSettings),
];

/** The keys in the Interface tab's Actions section, in the order the form lists them. */
export const DOCK_KEYS: readonly string[] = DOCK_SETTINGS.map((one) => one.key);
