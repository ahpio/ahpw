import { useEffect, useState, type ReactElement } from 'react';
import { rootReducer, type RootState } from '@microsoft/agent-host-protocol';
import { useI18n, useScena, useStore } from '@softov/scena/react';
import { Alert, Badge, Button, CheckBox, Text, type BadgeTone } from '@softov/scena/ui';
import { KeptTabs } from '../../shell/view/KeptTabs.js';
import { useChannel } from '../../bridges/channel.js';
import { ahpPaths, ROOT } from '../../bridges/data.js';
import { NO_OFFERS, type Offers } from '../../bridges/offers.js';
import type { PeopleState } from '../../bridges/people.js';
import { availablePlugins, installedFiles, PLUGINS, pluginsReducer, restartNeeded, specEnabled, type InstalledFiles, type ListedPlugin, type PluginRow, type PluginState } from '../../bridges/plugins.js';
import { PageAlert } from '../../shell/view/PageAlert.js';
import { EMOJIcon } from '../emojis.js';
import { mayList, mayReload, mayRemove, mayToggle, reloadOne, removeOne, saidOf, toggleMethod, togglePlugin } from './actions.js';
import { FactsColumn, marketplaceFacts, PageBody, ReadText, urlOf } from './ListTabs.js';
import { DangerZone } from '../../shell/controls/DangerZone.js';
import { Options } from './Options.js';
import { Features, installationFacts, Overview } from './Overview.js';
import { keepPluginTabKey, pluginTab, pluginTabKey } from './state.js';
import { mayRestart } from '../../bridges/restart.js';
import { RESTART_HOST } from '../host/restart.js';
import { PageTitle } from '../../shell/HostIcon.js';
import { PageSpinner } from '../../shell/view/PageSpinner.js';

const TONE: Record<PluginState, BadgeTone> = {
  error: 'danger',
  missing: 'danger',
  incompatible: 'warning',
  unconfigured: 'warning',
  ready: 'success',
  disabled: 'default',
};

/** A button's tooltip, when the host says what its command does. */
const said = (text: string | undefined): { title?: string } => (text === undefined ? {} : { title: text });

/** The end of the Settings tab: Remove, with a choice to keep the package installed. */
function RemoveZone({ host, id, title }: { host: string; id: string; title: string }): ReactElement {
  const scena = useScena();
  const { t } = useI18n();
  const [keep, setKeep] = useState(false);
  return (
    <DangerZone
      label={t('plugins/remove/button')}
      note={t('plugins/remove/note')}
      onClick={() => void removeOne(host, id, title, keep).then((gone) => { if (gone) scena.surfaces.close(pluginTab(host, id)); })}
    >
      <CheckBox label={t('plugins/remove/keep')} value={keep} onChange={setKeep} />
    </DangerZone>
  );
}

/**
 * One of the host's plugins, as VS Code draws an installed extension: its
 * head with its id, version and module, its state and Enable or Disable,
 * over *Overview*, *Features*, *Changelog* when its package has one, and
 * *Settings* with Remove at the end. What the page says comes from the
 * installed package; a list it came from adds only its *Marketplace* facts.
 */
export default function PluginPage({ host, plugin: id }: { host: string; plugin: string }): ReactElement {
  const scena = useScena();
  const { t } = useI18n();
  const offers = useStore<Offers>(ahpPaths(host).offers) ?? NO_OFFERS;
  const plugins = useChannel<PeopleState<PluginRow>>(host, PLUGINS.channel, pluginsReducer);
  // The host marks its root once it holds a change only a restart applies.
  const root = useChannel<RootState>(host, ROOT, rootReducer);
  const version = plugins.state?.records.find((one) => one.id === id)?.record.version;
  const lists = mayList(offers);
  const reads = offers.methods.includes(PLUGINS.details);

  // The README and changelog of the package the host loads, read again when its version changes.
  const [files, setFiles] = useState<InstalledFiles | undefined>(undefined);
  useEffect(() => {
    let live = true;
    if (!reads) return undefined;
    void installedFiles(host, id).then((answer) => { if (live) setFiles(answer); }, () => { if (live) setFiles(undefined); });
    return () => { live = false; };
  }, [host, id, version, reads]);

  // The list entry the host installed this plugin from, when it came from one; a plugin from a folder or a file has none.
  const [listed, setListed] = useState<ListedPlugin | undefined>(undefined);
  useEffect(() => {
    let live = true;
    if (!lists) return undefined;
    void availablePlugins(host).then(
      (answer) => {
        const entry = answer.plugins.find((one) => one.installed?.id === id && one.installed.marketplace === one.marketplace);
        if (live) setListed(entry);
      },
      // A list the host cannot read leaves the page with no Marketplace facts.
      () => { if (live) setListed(undefined); },
    );
    return () => { live = false; };
  }, [host, id, version, lists]);

  if (plugins.error !== null) return <PageAlert tone="danger" title={t('plugins/notices/none')} message={plugins.error} />;
  if (plugins.state === undefined) return <PageSpinner label={t('plugins/notices/reading')} />;
  const row = plugins.state.records.find((one) => one.id === id)?.record;
  if (row === undefined) return <PageAlert tone="warning" message={t('plugins/page/gone')} />;
  const title = row.title ?? id;
  const manifest = row.manifest;
  const uri = [`${PLUGINS.channel}${id}`, row.version, row.module].filter((one) => one !== undefined).join(' \u{00B7} ');

  const column = (
    <FactsColumn
      sections={[
        { title: t('plugins/page/installation'), items: installationFacts(host, row, t) },
        ...(listed === undefined ? [] : [{ title: t('plugins/listed/marketplace'), items: marketplaceFacts(listed, listed.installed?.version ?? row.version ?? listed.versions[0]?.version ?? '', t) }]),
      ]}
      categories={manifest?.categories ?? []}
      resources={(manifest?.links ?? []).map((link) => ({ title: link.title, url: urlOf(link.url) }))}
    />
  );

  return (
    <div className="web-page web-plugin">
      <div className="web-page__head">
        <PageTitle
          icons={manifest?.icons}
          emoji={EMOJIcon.hostPlugins}
          title={title}
          uri={uri}
          state={<Badge tone={TONE[row.state]} text={t(`plugins/states/${row.state}`)} />}
        />
        {manifest?.description === undefined ? null : <p className="web-listed__description">{manifest.description}</p>}
        {mayToggle(offers, row) || mayReload(offers) ? (
          <div className="web-page__actions">
            {mayReload(offers) ? (
              <Button size="sm" label={t('plugins/actions/reimport')} {...said(saidOf(offers, PLUGINS.reload))} onClick={() => void reloadOne(host, id)} />
            ) : null}
            {mayToggle(offers, row) ? (
              <Button
                size="sm"
                label={t(specEnabled(row.spec) ? 'plugins/actions/disable' : 'plugins/actions/enable')}
                {...said(saidOf(offers, toggleMethod(row)))}
                onClick={() => void togglePlugin(host, id, row)}
              />
            ) : null}
          </div>
        ) : null}
      </div>
      {restartNeeded(root.state) ? (
        <Alert tone="warning">
          {t('plugins/restart')}
          {mayRestart(offers) ? <> <Button size="sm" label={t('host/restart/button')} onClick={() => void scena.commands.execute(RESTART_HOST, { host })} /></> : null}
        </Alert>
      ) : null}
      <KeptTabs
        tabs={[
          { key: 'overview', title: t('plugins/page/overview'), child: <PageBody column={column}><Overview host={host} id={id} row={row} readme={files?.readme} /></PageBody> },
          { key: 'features', title: t('plugins/listed/features'), child: <PageBody column={column}><Features host={host} row={row} /></PageBody> },
          ...(files?.changelog === undefined ? [] : [{
            key: 'changelog',
            title: t('plugins/listed/changelog'),
            child: <PageBody column={column}><ReadText text={files.changelog} /></PageBody>,
          }]),
          { key: 'settings', title: t('plugins/page/settings'), child: (
            <>
              <Options host={host} id={id} row={row} />
              {mayRemove(offers) ? <RemoveZone host={host} id={id} title={title} /> : null}
            </>
          ) },
        ]}
        defaultValue={pluginTabKey()}
        onChange={keepPluginTabKey}
      />
    </div>
  );
}
