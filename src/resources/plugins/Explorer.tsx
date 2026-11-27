import { useEffect, useMemo, useState, type ReactElement } from 'react';
import { useI18n, useScena, useStore } from '@softov/scena/react';
import { Alert, Button, Note, Spinner } from '../../ui/index.js';
import type { PickerAction } from '@softov/scena/types';
import { ahpPaths, ROOT } from '../../bridges/data.js';
import { rootReducer, type RootState } from '@microsoft/agent-host-protocol';
import { useChannelOnEach } from '../../bridges/channel.js';
import { refKey, refOf, useEach, useHostNames, useShownHosts } from '../../bridges/hosts.js';
import { NO_OFFERS, type Offers } from '../../bridges/offers.js';
import type { PeopleState } from '../../bridges/people.js';
import { availablePlugins, PLUGINS, pluginsReducer, restartNeeded, specEnabled, type ListedPlugin, type PluginRow } from '../../bridges/plugins.js';
import { useServingHosts } from '../../bridges/served.js';
import { mayRestart } from '../../bridges/restart.js';
import { RESTART_HOST } from '../host/restart.js';
import { embedMode } from '../../shell/embed/index.js';
import { ExplorerList } from '../../shell/explorer/ExplorerList.js';
import { installListed, mayInstall, mayList, mayReload, mayToggle, reloadOne, saidOf, toggleMethod, togglePlugin } from './actions.js';
import { entryKeyOf, KNOWN_CATEGORIES, listedKey, listedRows, NO_CATEGORY, pluginRows, type ListedEntry, type PluginEntry, type PluginGrouping } from './rows.js';
import { ACTIVE_LISTED, ACTIVE_PLUGIN, INSTALLING, installKey, PLUGINS_GROUP } from './state.js';

/** A menu entry's tooltip, when the host says what its command does. */
const tooltip = (said: string | undefined): { tooltip?: string } => (said === undefined ? {} : { tooltip: said });

/** A category in the reader's words: ahpd's own are translated, any other is shown as the plugin wrote it. */
export function categoryWord(t: (key: string) => string, category: string): string {
  if (category === NO_CATEGORY) return t('plugins/categories/other');
  return (KNOWN_CATEGORIES as readonly string[]).includes(category) ? t(`plugins/categories/${category}`) : category;
}

/** The sidebar: the plugins each shown host has configured, by state or by category. */
export default function PluginsExplorer(): ReactElement {
  const scena = useScena();
  const { t } = useI18n();
  const shown = useShownHosts();
  const hosts = useServingHosts(shown, PLUGINS.scheme);
  const hostName = useHostNames();
  const multi = embedMode() === 'multi';
  const { states, errors } = useChannelOnEach<PeopleState<PluginRow>>(hosts, PLUGINS.channel, pluginsReducer);
  const offers = useEach<Offers>(hosts.map((host) => ahpPaths(host).offers));
  const roots = useChannelOnEach<RootState>(hosts, ROOT, rootReducer);
  const active = useStore<{ host: string; id: string }>(ACTIVE_PLUGIN);
  const activeListed = useStore<{ host: string; id: string; marketplace: string }>(ACTIVE_LISTED);
  // The plugins each host's lists hold, asked of the hosts that answer them, and
  // asked again when a host's plugin rows change, since an install moves an
  // entry from listed to installed.
  const listing = hosts.filter((host) => mayList(offers[hosts.indexOf(host)] ?? NO_OFFERS));
  const rowsSeen = states.map((one) => (one?.records ?? []).map(({ id, record }) => `${id}@${record.version ?? ''}`).join(',')).join('|');
  const [listed, setListed] = useState<Readonly<Record<string, ListedPlugin[]>>>({});
  const installingNow = (useStore<string[]>(INSTALLING) ?? []).join('\n');
  const installing = new Set(installingNow === '' ? [] : installingNow.split('\n'));
  useEffect(() => {
    let live = true;
    for (const host of listing) {
      availablePlugins(host)
        .then((answer) => { if (live) setListed((held) => ({ ...held, [host]: answer.plugins })); })
        .catch(() => { /* a host that cannot answer lists nothing; its rows still show */ });
    }
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listing.join('\n'), rowsSeen]);
  const grouping = useStore<PluginGrouping | null>(PLUGINS_GROUP) ?? 'state';
  const open = (key: string): void => {
    const { host, id } = refOf(entryKeyOf(key));
    void scena.commands.execute('ahp.openPlugin', { host, id });
  };

  const rows = useMemo(() => {
    const entries: PluginEntry[] = hosts.flatMap((host, at) => (states[at]?.records ?? []).map(({ id, record }) => ({ host, hostName: hostName(host), id, row: record })));
    const menu = ({ host, id, row }: PluginEntry): PickerAction[] => {
      const held = offers[hosts.indexOf(host)] ?? NO_OFFERS;
      return [
        { title: t('plugins/actions/open'), onSelect: (picker) => { picker.closeMenu(); open(refKey(host, id)); } },
        ...(mayToggle(held, row) ? [{
          title: t(specEnabled(row.spec) ? 'plugins/actions/disable' : 'plugins/actions/enable'),
          group: 'more',
          onSelect: (picker: { closeMenu: () => void }) => { picker.closeMenu(); void togglePlugin(host, id, row); },
          ...tooltip(saidOf(held, toggleMethod(row))),
        }] : []),
        ...(mayReload(held) ? [{
          title: t('plugins/actions/reimport'),
          group: 'more',
          onSelect: (picker: { closeMenu: () => void }) => { picker.closeMenu(); void reloadOne(host, id); },
          ...tooltip(saidOf(held, PLUGINS.reload)),
        }] : []),
      ];
    };
    return pluginRows(entries, grouping, {
      multi,
      state: (state) => t(`plugins/states/${state}`),
      loadFailed: t('plugins/page/loadFailed'),
      failing: t('plugins/page/failing'),
      category: (category) => categoryWord(t, category),
      menu,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hosts, states, offers, hostName, grouping, t]);

  const listedEntries: ListedEntry[] = useMemo(
    () => listing.flatMap((host) => (listed[host] ?? []).map((plugin) => ({ host, hostName: hostName(host), plugin }))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [listing.join('\n'), listed, hostName],
  );
  const openListed = ({ host, plugin }: ListedEntry): void => {
    void scena.commands.execute('ahp.openListedPlugin', { host, id: plugin.id, marketplace: plugin.marketplace, title: plugin.name ?? plugin.id });
  };
  // An install from the row opens nothing: the row becomes the installed one, and a page open on it turns into the installed page.
  const install = (entry: ListedEntry): void => { void installListed(scena.store, entry.host, entry.plugin); };
  const busy = (entry: ListedEntry): boolean => installing.has(installKey(entry.host, entry.plugin.marketplace, entry.plugin.id));
  const searchRows = useMemo(() => listedRows(listedEntries, {
    multi,
    notInstalled: t('plugins/listed/notInstalled'),
    install: (entry) => (mayInstall(offers[hosts.indexOf(entry.host)] ?? NO_OFFERS) ? t(busy(entry) ? 'plugins/listed/installing' : 'plugins/listed/install') : undefined),
    busy: (key) => listedEntries.some((entry) => listedKey(entry) === key && busy(entry)),
    run: install,
    menu: (entry) => [{ title: t('plugins/actions/open'), onSelect: (picker) => { picker.closeMenu(); openListed(entry); } }],
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [listedEntries, installingNow, offers, hosts, multi, t]);
  const openRow = (key: string): void => {
    const entry = listedEntries.find((one) => listedKey(one) === key);
    if (entry === undefined) open(key);
    else openListed(entry);
  };

  // One host's notice in mono; in multi a host that is down says so in its own place.
  const error = multi ? null : errors[0] ?? null;
  const state = multi ? states.find((one) => one !== undefined) : states[0];
  // The hosts that hold a change only a restart applies, and offer that restart.
  const restartable = hosts.filter((host, at) => restartNeeded(roots.states[at]) && mayRestart(offers[at] ?? NO_OFFERS));
  const restart = restartable.length === 0 ? null : (
    <Button size="sm" label={t('host/restart/button')} onClick={() => { for (const host of restartable) void scena.commands.execute(RESTART_HOST, { host }); }} />
  );
  const notice = hosts.length === 0
    ? <Note inset>{t('plugins/explorer/notServed')}</Note>
    : error !== null
      ? <Alert tone="danger" title={t('plugins/notices/none')} message={error} />
      : state === undefined
        ? <Spinner label={t('plugins/notices/reading')} />
        : rows.length === 0 ? <Note inset>{t('plugins/explorer/empty')}</Note>
          : roots.states.some(restartNeeded) ? <Note inset>{t('plugins/restartShort')} {restart}</Note> : null;
  const selectedListed = activeListed === undefined ? undefined
    : listedEntries.find((one) => one.host === activeListed.host && one.plugin.id === activeListed.id && one.plugin.marketplace === activeListed.marketplace);
  const selected = selectedListed !== undefined ? listedKey(selectedListed)
    : active === undefined ? null : rows.find((row) => entryKeyOf(row.key) === refKey(active.host, active.id))?.key ?? null;

  return (
    <ExplorerList
      label={t('plugins/explorer/title')}
      rows={rows}
      searchRows={listing.length === 0 ? undefined : searchRows}
      selected={selected}
      onOpen={openRow}
      notice={notice}
      filterLabel={t(listing.length === 0 ? 'plugins/explorer/filter' : 'plugins/explorer/search')}
      hostLines={multi}
    />
  );
}
