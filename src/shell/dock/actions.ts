/**
 * The actions that rest in the docks beside the bots: each is a button that
 * runs a command on a click, and moves, groups, locks and hides as a bot does.
 */

import type { BindingPath, ReactiveStore } from '@softov/scena/types';
import { chatChoice, type ChatChoice } from '../../resources/sessions/view-settings.js';
import { fillDocks, readDocks, writeDocks, type Dock, type Loose } from './docks.js';

export type DockActionId = 'newSession' | 'palette';

export interface DockAction {
  id: DockActionId;
  /** Its item key in a dock. */
  key: `action:${DockActionId}`;
  /** What a click runs. */
  command: string;
  /** The keys of `command`, as its registration has them, for the button's tooltip. */
  keys: string | readonly string[];
  /** `shown` or `hidden`, as `ui.<id>Button` sets it. A hidden action keeps its place in its dock. */
  shown: ChatChoice;
  /** `movable` or `locked`, as `ui.<id>Position` sets it. A locked action does not drag; its menu and the settings still move it. */
  position: ChatChoice;
}

const action = (id: DockActionId, command: string, keys: string | readonly string[]): DockAction => ({
  id,
  key: `action:${id}`,
  command,
  keys,
  shown: chatChoice(`$/dock/${id}/shown` as BindingPath, `ahpw.dock.${id}.shown`, ['shown', 'hidden'], 'shown'),
  position: chatChoice(`$/dock/${id}/position` as BindingPath, `ahpw.dock.${id}.position`, ['movable', 'locked'], 'movable'),
});

export const DOCK_ACTIONS: readonly DockAction[] = [
  action('newSession', 'ahp.newSession', ['ctrl+n', 'alt+n']),
  action('palette', 'workbench.showCommands', 'ctrl+shift+p'),
];

export const actionOf = (key: string): DockAction | undefined => DOCK_ACTIONS.find((one) => one.key === key);
export const isAction = (key: string): boolean => key.startsWith('action:');

/** Where the actions rest at first: together, in the middle of the top edge. */
export const ACTION_HOME: Loose['home'] = { id: 'actions', place: { edge: 'top', at: 0.5 } };

/** How a dock that holds an action and another item draws: `pill` around them, or `apart`, each on its own. */
export const ACTION_GROUPS = chatChoice('$/dock/groups' as BindingPath, 'ahpw.dock.groups', ['pill', 'apart'], 'pill');

/** The docks as laid out, in the store so the layer and the settings follow one another. */
export const DOCKS_PATH = '$/dock/docks' as BindingPath;

export function docksOf(store: ReactiveStore): Dock[] {
  return store.get<Dock[]>(DOCKS_PATH) ?? readDocks();
}

/** The docks with every action placed, keeping every item they hold, for a change made outside the layer. */
export function laidOut(store: ReactiveStore): Dock[] {
  const docks = docksOf(store);
  const items = [...new Set([...docks.flatMap((dock) => dock.items), ...DOCK_ACTIONS.map((one) => one.key)])];
  return fillDocks(items, () => ACTION_HOME, docks);
}

export function setDocks(store: ReactiveStore, docks: readonly Dock[]): void {
  writeDocks(docks);
  store.set(DOCKS_PATH, [...docks]);
}
