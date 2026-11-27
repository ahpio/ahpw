import { useEffect, useState, type ReactElement } from 'react';
import { useI18n, useScena, useStore } from '@softov/scena/react';
import { Button, ContextMenu, Page, PageActions, PageHead } from '../../ui/index.js';
import type { PickerAction } from '@softov/scena/types';
import { useChannel } from '../../bridges/channel.js';
import { ahpPaths } from '../../bridges/data.js';
import { NO_OFFERS, type Offers } from '../../bridges/offers.js';
import type { PeopleState } from '../../bridges/people.js';
import { availablePlugins, pluginDetails, PLUGINS, pluginsReducer, type ListedPlugin, type PluginDetails, type PluginRow } from '../../bridges/plugins.js';
import { PageTitle } from '../../shell/HostIcon.js';
import { KeptTabs } from '../../ui/navigation/KeptTabs.js';
import { PageAlert } from '../../ui/display/PageAlert.js';
import { EMOJIcon } from '../emojis.js';
import { installListed, mayInstall, saidOf, versionsInstall } from './actions.js';
import { listTabs } from './ListTabs.js';
import PluginPage from './PluginPage.js';
import { installedHere, listName } from './rows.js';
import { ACTIVE_LISTED, INSTALLING, installKey, LISTED_AS, listedTab, pluginTab } from './state.js';
import { PageSpinner } from '../../ui/display/PageSpinner.js';

/** A button's tooltip, when the host says what its command does. */
const said = (text: string | undefined): { title?: string } => (text === undefined ? {} : { title: text });

/** What the page read of the host: the list entry and one version's files, or why it could not. */
type Read = { entry: ListedPlugin; details: PluginDetails } | { error: string } | { gone: true };

/**
 * A plugin a host's list holds: its head with Install and the versions to
 * install, over Overview, Features and Changelog, beside its facts. Once the
 * host has it installed, from here or from the sidebar, the same page turns
 * into the installed plugin's page, as VS Code's extension page does. What it
 * shows is read from the host, which fetched it from the list; the page never
 * reaches the list's host.
 */
export default function ListedPluginPage({ host, plugin: id, marketplace }: { host: string; plugin: string; marketplace: string }): ReactElement {
  const scena = useScena();
  const { t } = useI18n();
  const offers = useStore<Offers>(ahpPaths(host).offers) ?? NO_OFFERS;
  const installing = (useStore<string[]>(INSTALLING) ?? []).includes(installKey(host, marketplace, id));
  // The host's plugin rows: an install adds one, and the entry is read again to learn it is installed.
  const rows = useChannel<PeopleState<PluginRow>>(host, PLUGINS.channel, pluginsReducer);
  const rowsSeen = (rows.state?.records ?? []).map((one) => one.id).join(',');
  const [read, setRead] = useState<Read | undefined>(undefined);
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    let live = true;
    void (async () => {
      try {
        const answer = await availablePlugins(host);
        const entry = answer.plugins.find((one) => one.id === id && one.marketplace === marketplace);
        if (entry === undefined) {
          if (live) setRead({ gone: true });
          return;
        }
        // The files are read once: a new read of the entry keeps the details already drawn.
        const held = read !== undefined && 'details' in read ? read.details : await pluginDetails(host, id, marketplace);
        if (live) setRead({ entry, details: held });
      } catch (error) {
        if (live) setRead({ error: error instanceof Error ? error.message : String(error) });
      }
    })();
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [host, id, marketplace, rowsSeen]);

  // Installed: the plugin's own tab, when one is open, takes over and this one closes; else this tab is the plugin's page from now on.
  const rowId = read !== undefined && 'entry' in read && installedHere(read.entry) ? read.entry.installed?.id : undefined;
  useEffect(() => {
    if (rowId === undefined) return;
    const own = listedTab(host, marketplace, id);
    const theirs = pluginTab(host, rowId);
    if (scena.surfaces.listAt('main').some((one) => one.key === theirs)) {
      const active = scena.store.get<{ host: string; id: string; marketplace: string }>(ACTIVE_LISTED);
      const focused = active?.host === host && active.id === id && active.marketplace === marketplace;
      scena.surfaces.close(own);
      if (focused) scena.surfaces.focus(theirs);
      return;
    }
    scena.store.set(LISTED_AS, { ...(scena.store.get<Record<string, string>>(LISTED_AS) ?? {}), [theirs]: own });
  }, [scena, host, id, marketplace, rowId]);

  if (read === undefined) return <PageSpinner label={t('plugins/listed/reading')} />;
  if ('error' in read) return <PageAlert tone="danger" title={t('plugins/listed/unread')} message={read.error} />;
  if ('gone' in read) return <PageAlert tone="warning" message={t('plugins/listed/gone')} />;
  const { entry, details } = read;
  // Installed from this list or from none: this is now that plugin's page.
  if (installedHere(entry) && entry.installed !== undefined) return <PluginPage host={host} plugin={entry.installed.id} />;
  const title = entry.name ?? entry.id;

  const install = (version?: string): void => { void installListed(scena.store, host, entry, version); };
  // The versions a person may name, newest first: none the list marks deprecated, which the host would not choose either.
  const versions = entry.versions.filter((one) => one.deprecated === undefined).map((one) => one.version);
  const items: PickerAction[] = versions.map((version) => ({
    title: t('plugins/listed/installVersion', { version }),
    onSelect: (picker) => { picker.closeMenu(); install(version); },
  }));

  return (
    <Page>
      <PageHead>
        <PageTitle
          icons={entry.icons}
          emoji={EMOJIcon.hostPlugins}
          title={title}
          uri={`${listName(marketplace)} \u{00B7} ${details.version}`}
        />
        {entry.description === undefined ? null : <p className="web-listed__description">{entry.description}</p>}
        {mayInstall(offers) ? (
          <PageActions>
            <Button
              size="sm"
              variant="primary"
              label={t(installing ? 'plugins/listed/installing' : 'plugins/listed/install')}
              disabled={installing}
              {...said(saidOf(offers, PLUGINS.install))}
              onClick={() => install()}
            />
            {versionsInstall(entry) && versions.length > 0 ? (
              <Button variant="tool" title={t('plugins/listed/versions')} ariaLabel={t('plugins/listed/versions')} disabled={installing} onClick={(event) => {
                  const box = event.currentTarget.getBoundingClientRect();
                  setMenu({ x: box.left, y: box.bottom });
                }}>
                {EMOJIcon.settings}
              </Button>
            ) : null}
          </PageActions>
        ) : null}
      </PageHead>
      <KeptTabs tabs={listTabs(host, entry, details, t)} />
      {menu === null ? null : <ContextMenu spec={{ items }} x={menu.x} y={menu.y} onClose={() => setMenu(null)} />}
    </Page>
  );
}
