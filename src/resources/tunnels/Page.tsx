import type { ReactElement } from 'react';
import { translate } from '@softov/scena';
import { useI18n, useStore } from '@softov/scena/react';
import { Alert, Badge, type DetailItem, DetailList, Link, Page, PageHead, Text } from '../../ui/index.js';
import { useChannel } from '../../bridges/channel.js';
import { isSecretRef } from '../../bridges/connectors.js';
import { ahpPaths } from '../../bridges/data.js';
import { NO_OFFERS, type Offers } from '../../bridges/offers.js';
import { rowOperations } from '../../bridges/operations.js';
import { runnableBy, useOwnGrants } from '../../bridges/own-grants.js';
import { embedMode } from '../../shell/embed/index.js';
import { HostTag } from '../../shell/explorer/HostLines.js';
import { PageTitle } from '../../shell/HostIcon.js';
import { PageAlert } from '../../ui/display/PageAlert.js';
import { CopyButton } from '../../ui/control/CopyButton.js';
import { EMOJIcon } from '../emojis.js';
import { DangerOperations, OperationButtons } from '../operations/Buttons.js';
import { factsOf, kindSchema, settingRows, statusKey, TUNNELS, tunnelsReducer, type TunnelFacts, type TunnelsState } from './tunnels.js';
import { PageSpinner } from '../../ui/display/PageSpinner.js';
import './page.css';

type Tone = 'default' | 'success' | 'warning' | 'danger' | 'info';
const TONE: Record<ReturnType<typeof statusKey>, Tone> = { busy: 'info', running: 'success', error: 'danger', stopped: 'default', disabled: 'default' };

/** What the tunnel is, as the host keeps it. */
function factsList(host: string, facts: TunnelFacts): DetailItem[] {
  const items: DetailItem[] = embedMode() === 'multi' ? [{ label: translate('common/host'), value: <HostTag host={host} /> }] : [];
  const add = (key: string, value: string | undefined): void => {
    if (value !== undefined && value !== '') items.push({ label: translate(`tunnels/facts/${key}`), value });
  };
  add('kind', facts.kind);
  add('plugin', facts.plugin);
  add('purpose', facts.purpose === undefined ? undefined : translate(facts.purpose === 'system' ? 'tunnels/purpose/system' : 'tunnels/purpose/person'));
  add('enabled', translate(facts.enabled ? 'tunnels/facts/yes' : 'tunnels/facts/no'));
  return items;
}

/** A setting's value in words: a kept secret as a word and never its value, a switch as yes or no. */
function settingWords(value: unknown): string {
  if (isSecretRef(value)) return translate('operations/kept');
  if (typeof value === 'boolean') return translate(value ? 'tunnels/facts/yes' : 'tunnels/facts/no');
  if (value === undefined || value === null || value === '') return translate('tunnels/facts/unset');
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  return JSON.stringify(value);
}

/** The kind's settings, as its schema names them. */
function settingsList(schema: Record<string, unknown> | undefined, facts: TunnelFacts): DetailItem[] {
  return settingRows(schema, facts.settings).map((row) => ({ label: row.label, value: settingWords(row.value) }));
}

/** One tunnel: its state, its address, its settings, and the operations the host offers on it. */
export default function TunnelPage({ host, tunnel: id }: { host: string; tunnel?: string }): ReactElement {
  const { t } = useI18n();
  const { state, error } = useChannel<TunnelsState>(host, TUNNELS, tunnelsReducer);
  const entry = state?.records.find((one) => one.id === id);
  const grants = useOwnGrants(host, useStore<Offers>(ahpPaths(host).offers) ?? NO_OFFERS);

  if (error !== null) return <PageAlert tone="danger" title={t('tunnels/notices/none')} message={error} />;
  if (state === undefined) return <PageSpinner label={t('tunnels/notices/reading')} />;
  if (entry === undefined || id === undefined) return <PageAlert tone="warning" message={t('tunnels/notices/gone')} />;

  const facts = factsOf(entry.record);
  const key = statusKey(facts);
  const operations = runnableBy(rowOperations(state, entry.record), grants);
  const place = { host, channel: TUNNELS, target: id, held: facts.settings };
  const settings = settingsList(kindSchema(state, facts.kind), facts);
  const failedOperation = facts.operation?.status === 'error' ? facts.operation : undefined;

  return (
    <Page>
      <PageHead>
        <PageTitle emoji={EMOJIcon.tunnels} title={id} uri={`${TUNNELS}${id}`} state={<Badge tone={TONE[key]} text={t(`tunnels/status/${key}`)} />} />
        <OperationButtons place={place} operations={operations} />
      </PageHead>

      {facts.error === undefined ? null : <Alert tone="danger" title={t('tunnels/notices/error')} message={facts.error} />}
      {failedOperation === undefined ? null : <Alert tone="danger" title={t('operations/failed', { label: failedOperation.id })} message={failedOperation.error ?? ''} />}

      {facts.url === undefined ? null : (
        <div className="web-tunnel__url">
          <Link href={facts.url} external>{facts.url}</Link>
          <CopyButton text={facts.url} />
        </div>
      )}

      <DetailList items={factsList(host, facts)} columns={2} />

      {settings.length === 0 ? null : (
        <>
          <Text variant="h3" text={`${EMOJIcon.settings} ${t('tunnels/page/settings')}`} />
          <DetailList items={settings} columns={2} />
        </>
      )}

      <DangerOperations place={place} operations={operations} />
    </Page>
  );
}
