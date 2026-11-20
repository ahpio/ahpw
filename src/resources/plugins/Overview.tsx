import type { ReactElement } from 'react';
import { useI18n } from '@softov/scena/react';
import { Alert, Text, type DetailItem } from '@softov/scena/ui';
import type { PluginRow } from '../../bridges/plugins.js';
import { embedMode } from '../../shell/embed/index.js';
import { HostTag } from '../../shell/explorer/HostLines.js';
import { AlertList } from '../../shell/view/AlertList.js';
import { ReadText } from './ListTabs.js';
import { PluginViewPanel } from './PluginViewPanel.js';
import { providedGroups } from './provides.js';
import { ProvidesList } from './ProvidesList.js';

/** A state that is a problem, and how loud it is. */
const PROBLEM_TONE: Partial<Record<PluginRow['state'], 'danger' | 'warning'>> = { error: 'danger', missing: 'danger', incompatible: 'warning', unconfigured: 'warning' };

/** Where an installed plugin is and whether it runs, as the *Installation* part of its facts names it. */
export function installationFacts(host: string, row: PluginRow, t: (key: string) => string): DetailItem[] {
  return [
    ...(embedMode() === 'multi' ? [{ label: t('common/host'), value: <HostTag host={host} /> }] : []),
    ...(row.loaded === undefined ? [] : [{ label: t('plugins/facts/running'), value: t(row.loaded ? 'plugins/running/yes' : 'plugins/running/no') }]),
    ...(row.path === undefined ? [] : [{ label: t('plugins/facts/path'), value: <code className="web-listed__path">{row.path}</code> }]),
    // A `file:` URL is the path again; only a plugin loaded from elsewhere names one.
    ...(row.url === undefined || row.url.startsWith('file:') ? [] : [{ label: t('plugins/facts/url'), value: <code className="web-listed__path">{row.url}</code> }]),
  ];
}

/**
 * An installed plugin's *Overview*: its problem, the view it draws on its
 * page, its alerts by level, and the README of the package it loads, when
 * the package has one.
 */
export function Overview({ host, id, row, readme }: { host: string; id: string; row: PluginRow; readme: string | undefined }): ReactElement {
  const { t } = useI18n();
  const tone = PROBLEM_TONE[row.state];
  // ahpd repeats a configured problem as the load's error; the problem above says it.
  const alerts = (row.alerts ?? []).filter((alert) => alert.text !== row.problem);
  return (
    <>
      {row.problem === undefined ? null : <Alert tone={tone ?? 'warning'} message={row.problem} />}
      {row.views?.main === undefined ? null : <PluginViewPanel host={host} plugin={id} at={`plugin:${id}`} view={row.views.main} />}
      <AlertList alerts={alerts} />
      {readme === undefined ? <p className="web-note">{t('plugins/page/noReadme')}</p> : <ReadText text={readme} />}
    </>
  );
}

/** An installed plugin's *Features*: what its loaded manifest says it provides, each entry opening where ahpw shows it. */
export function Features({ host, row }: { host: string; row: PluginRow }): ReactElement {
  const { t } = useI18n();
  const manifest = row.manifest;
  const groups = providedGroups(manifest?.contracts, host);
  return (
    <>
      <Text variant="h3" text={t('plugins/page/provides')} />
      {row.undeclared === true ? <p className="web-note">{t('plugins/page/undeclared')}</p>
        : groups.length === 0 ? <p className="web-note">{t(manifest === undefined ? 'plugins/page/notLoaded' : 'plugins/page/providesNothing')}</p>
          : <ProvidesList host={host} contracts={manifest?.contracts} />}
    </>
  );
}
