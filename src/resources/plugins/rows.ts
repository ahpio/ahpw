import type { PickerAction } from '@softov/scena/types';
import { refKey } from '../../bridges/hosts.js';
import { PLUGIN_STATES, type ListedPlugin, type PluginRow, type PluginState } from '../../bridges/plugins.js';
import type { Dot, Row } from '../../shell/explorer/ExplorerList.js';
import { EMOJIcon } from '../emojis.js';
import { arrange } from '../sessions/grouping.js';

/** How the list groups its plugins. */
export type PluginGrouping = 'state' | 'category';
export const PLUGIN_GROUPINGS: readonly PluginGrouping[] = ['state', 'category'];

/** The categories ahpd names, in the order the list shows them; any other follows, then *Other*. */
export const KNOWN_CATEGORIES = ['agent', 'channel', 'connector', 'storage', 'tool'] as const;

/** The group a plugin with no category is under. */
export const NO_CATEGORY = '';

const DOT: Record<PluginState, Dot> = {
  error: 'failed',
  missing: 'failed',
  incompatible: 'attention',
  unconfigured: 'attention',
  ready: 'ok',
  disabled: 'off',
};

/** One plugin of one host, as the list is given it. */
export interface PluginEntry {
  host: string;
  hostName: string;
  id: string;
  row: PluginRow;
}

/** The words and callbacks the rows are made with. */
export interface RowWords {
  multi: boolean;
  state: (state: PluginState) => string;
  /** What a plugin the host tried and failed to load is said to be, over its configured state. */
  loadFailed: string;
  /** What a running plugin that raised an error is said to be. */
  failing: string;
  category: (category: string) => string;
  menu: (entry: PluginEntry) => PickerAction[];
}

/** A plugin's categories, or the one *Other* stands for. */
const categoriesOf = (row: PluginRow): string[] => {
  const named = row.manifest?.categories ?? [];
  return named.length === 0 ? [NO_CATEGORY] : named;
};

/** A category's place: ahpd's own first in their order, then the rest by name, then *Other*. */
function categoryRank(category: string): number {
  if (category === NO_CATEGORY) return 1_000_000;
  const known = (KNOWN_CATEGORIES as readonly string[]).indexOf(category);
  return known >= 0 ? known : 100;
}

/**
 * The list's rows. By state, problems lead and disabled plugins close it. By
 * category, a plugin is under each category it names, so its row key carries
 * the category to stay one of a kind.
 */
export function pluginRows(entries: readonly PluginEntry[], by: PluginGrouping, words: RowWords): Row[] {
  const sorted = [...entries].sort((a, b) => (a.row.title ?? a.id).localeCompare(b.row.title ?? b.id) || a.host.localeCompare(b.host));
  const placed = by === 'state'
    ? sorted.map((entry) => ({ entry, group: { key: entry.row.state, label: words.state(entry.row.state), rank: PLUGIN_STATES.indexOf(entry.row.state) } }))
    : sorted.flatMap((entry) => categoriesOf(entry.row).map((category) => ({
      entry,
      group: { key: `category:${category}`, label: words.category(category), rank: categoryRank(category) },
    })));
  // Two unknown categories share a rank; arrange keeps them in the order given, so give it them by name.
  const ordered = by === 'category' ? [...placed].sort((a, b) => a.group.rank - b.group.rank || a.group.label.localeCompare(b.group.label)) : placed;

  return arrange(ordered, (one) => one.group).map(({ entry, group }) => {
    const { row } = entry;
    const title = row.title ?? entry.id;
    const categories = (row.manifest?.categories ?? []).map(words.category).join(', ');
    const error = row.alerts?.find((alert) => alert.level === 'error');
    return {
      key: by === 'state' ? refKey(entry.host, entry.id) : `${group.key}|${refKey(entry.host, entry.id)}`,
      // An error is louder than what the configuration says.
      dot: error === undefined ? DOT[row.state] : 'failed',
      dotLabel: error === undefined ? words.state(row.state) : row.loaded === false ? words.loadFailed : words.failing,
      title,
      ...(row.manifest?.icons === undefined ? {} : { icons: row.manifest.icons }),
      emoji: EMOJIcon.hostPlugins,
      lines: [
        [words.multi ? entry.hostName : undefined, title === entry.id ? undefined : entry.id, row.version, categories === '' ? undefined : categories]
          .filter((bit) => bit !== undefined).join(' \u{00B7} '),
        ...(row.problem === undefined ? [] : [row.problem]),
        // ahpd repeats a configured problem as the load's; one line says it.
        ...(error === undefined || error.text === row.problem ? [] : [error.text]),
      ].filter((line) => line !== ''),
      menu: words.menu(entry),
      group: { key: group.key, label: group.label },
    };
  });
}

/** The plugin a row key names, by either grouping. */
export const entryKeyOf = (key: string): string => (key.startsWith('category:') ? key.slice(key.indexOf('|') + 1) : key);

/** One listed plugin of one host, as the list is given it. */
export interface ListedEntry {
  host: string;
  hostName: string;
  plugin: ListedPlugin;
}

/** The words and callbacks the listed rows are made with. */
export interface ListedWords {
  multi: boolean;
  /** What a row that is not installed is said to be, for its mark. */
  notInstalled: string;
  /** The label of an entry's Install, or nothing when its host does not install for this reader. */
  install: (entry: ListedEntry) => string | undefined;
  /** Whether an entry's install runs now. */
  busy: (key: string) => boolean;
  run: (entry: ListedEntry) => void;
  menu: (entry: ListedEntry) => PickerAction[];
}

/** A listed row's key: its host, its list and its id, so two lists with one id are two rows. */
export const listedKey = (entry: ListedEntry): string => `listed|${entry.host}|${entry.plugin.marketplace}|${entry.plugin.id}`;

/** A list's name for a person: the host of its URL. */
export function listName(marketplace: string): string {
  try {
    return new URL(marketplace).host;
  } catch {
    return marketplace;
  }
}

/**
 * Whether an entry is the plugin an installed row already shows: the host
 * matched it, from this list or from no list. An installed plugin from another
 * list leaves this entry a row of its own.
 */
export const installedHere = (plugin: ListedPlugin): boolean =>
  plugin.installed !== undefined && (plugin.installed.marketplace === undefined || plugin.installed.marketplace === plugin.marketplace);

/** The rows of the plugins a host's lists hold and it has not installed, each with Install; shown only while a search is typed. */
export function listedRows(entries: readonly ListedEntry[], words: ListedWords): Row[] {
  return entries.filter((entry) => !installedHere(entry.plugin)).map((entry) => {
    const { plugin } = entry;
    const key = listedKey(entry);
    const newest = plugin.versions[0]?.version;
    const install = words.install(entry);
    return {
      key,
      dot: 'quiet',
      dotLabel: words.notInstalled,
      bare: true,
      title: plugin.name ?? plugin.id,
      ...(plugin.icons === undefined || plugin.icons.length === 0 ? {} : { icons: plugin.icons }),
      emoji: EMOJIcon.hostPlugins,
      lines: [
        ...(plugin.description === undefined ? [] : [plugin.description]),
        [words.multi ? entry.hostName : undefined, listName(plugin.marketplace), newest].filter((bit) => bit !== undefined).join(' \u{00B7} '),
      ],
      menu: words.menu(entry),
      ...(install === undefined ? {} : { button: { label: install, run: () => words.run(entry), busy: words.busy(key) } }),
    };
  });
}
