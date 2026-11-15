import type { BindingPath } from '@softov/scena/types';

/** Whether any host this page connects to lists its plugins to this reader; the 🔣 entry shows while one does. */
export const PLUGINS_SERVED = '$/ahp/plugins/served' as BindingPath;

/** Whether any host this page connects to offers to load what its configuration file names; the list's Apply shows while one does. */
export const PLUGINS_APPLY = '$/ahp/plugins/apply' as BindingPath;

/** Whether any host this page connects to offers to install or write a plugin; New plugin shows while one does. */
export const PLUGINS_ADD = '$/ahp/plugins/add' as BindingPath;

/** The plugin open in `main`, as `{ host, id }`. */
export const ACTIVE_PLUGIN = '$/ahp/plugins/active' as BindingPath;

/** The listed plugin open in `main`, as `{ host, id, marketplace }`. */
export const ACTIVE_LISTED = '$/ahp/plugins/activeListed' as BindingPath;

/** The listed plugins whose install runs now, by `installKey`, so the sidebar's row and the plugin's page both say so. */
export const INSTALLING = '$/ahp/plugins/installing' as BindingPath;

/** The listed tabs that turned into an installed plugin's page, by that plugin's `pluginTab`; opening the plugin focuses its listed tab. */
export const LISTED_AS = '$/ahp/plugins/listedAs' as BindingPath;

/** One listed plugin of one host, as `INSTALLING` names it. */
export const installKey = (host: string, marketplace: string, id: string): string => `${host}|${marketplace}|${id}`;

/** A listed plugin's tab key: one tab for each host, list and id. */
export const listedTab = (host: string, marketplace: string, id: string): string => `plugins:listed:${host}:${marketplace}:${id}`;

/** How the list groups its rows; null while it is the usual one, by state. */
export const PLUGINS_GROUP = '$/ahp/plugins/group' as BindingPath;

export const GROUP_KEY = 'ahpd-web.plugins-group';

/** The New plugin tab of one host. */
export const newPluginTab = (host: string): string => `plugins:new:${host}`;

/** A plugin's tab key: one tab each. */
export const pluginTab = (host: string, id: string): string => `plugins:${host}:${id}`;

/** An installed plugin page's tabs; `changelog` shows when its package has one. */
export type PluginTabKey = 'overview' | 'features' | 'changelog' | 'settings';

const TAB_KEYS: readonly string[] = ['overview', 'features', 'changelog', 'settings'];

/** The tab a plugin's page opens on: the one chosen last, kept while the page lives, as the settings' tab is. */
let chosenTab: PluginTabKey = 'overview';
export const pluginTabKey = (): PluginTabKey => chosenTab;
export function keepPluginTabKey(key: string): void {
  if (TAB_KEYS.includes(key)) chosenTab = key as PluginTabKey;
}
