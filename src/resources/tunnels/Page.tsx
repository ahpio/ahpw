import type { ReactElement } from 'react';
import { translate } from '@softov/scena';
import { useI18n } from '@softov/scena/react';
import { Alert, Badge, DetailList, Spinner, Text, type DetailItem } from '@softov/scena/ui';
import { useChannel } from '../../bridges/channel.js';
import { isSecretRef } from '../../bridges/connectors.js';
import { rowOperations } from '../../bridges/operations.js';
import { embedMode } from '../../shell/embed/index.js';
import { HostTag } from '../../shell/explorer/HostLines.js';
import { PageTitle } from '../../shell/HostIcon.js';
import { PageAlert } from '../../shell/view/PageAlert.js';
import { CopyButton } from '../../shell/controls/CopyButton.js';
import { EMOJIcon } from '../emojis.js';
import { DangerOperations, OperationButtons } from '../operations/Buttons.js';
import { factsOf, statusKey, TUNNELS, tunnelsReducer, type TunnelFacts, type TunnelsState } from './tunnels.js';

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

/** The kind's settings, a kept secret as a word and never its value. */
function settingsList(facts: TunnelFacts): DetailItem[] {
  return Object.entries(facts.settings).map(([field, value]) => ({
    label: field,
    value: isSecretRef(value) ? translate('operations/kept') : typeof value === 'string' ? value : JSON.stringify(value),
  }));
}

/** One tunnel: its state, its address, its settings, and the operations the host offers on it. */
export default function TunnelPage({ host, tunnel: id }: { host: string; tunnel?: string }): ReactElement {
  const { t } = useI18n();
  const { state, error } = useChannel<TunnelsState>(host, TUNNELS, tunnelsReducer);
  const entry = state?.records.find((one) => one.id === id);

  if (error !== null) return <PageAlert tone="danger" title={t('tunnels/notices/none')} message={error} />;
  if (state === undefined) return <Spinner label={t('tunnels/notices/reading')} />;
  if (entry === undefined || id === undefined) return <PageAlert tone="warning" message={t('tunnels/notices/gone')} />;

  const facts = factsOf(entry.record);
  const key = statusKey(facts);
  const operations = rowOperations(state, entry.record);
  const place = { host, channel: TUNNELS, target: id, held: facts.settings };
  const settings = settingsList(facts);
  const failedOperation = facts.operation?.status === 'error' ? facts.operation : undefined;

  return (
    <div className="web-page">
      <div className="web-page__head">
        <PageTitle emoji={EMOJIcon.tunnels} title={id} uri={`${TUNNELS}${id}`} state={<Badge tone={TONE[key]} text={t(`tunnels/status/${key}`)} />} />
        <OperationButtons place={place} operations={operations} />
      </div>

      {facts.error === undefined ? null : <Alert tone="danger" title={t('tunnels/notices/error')} message={facts.error} />}
      {failedOperation === undefined ? null : <Alert tone="danger" title={t('operations/failed', { label: failedOperation.id })} message={failedOperation.error ?? ''} />}

      {facts.url === undefined ? null : (
        <div className="web-tunnel__url">
          <a href={facts.url} target="_blank" rel="noopener noreferrer">{facts.url}</a>
          <CopyButton text={facts.url} />
        </div>
      )}

      <DetailList items={factsList(host, facts)} columns={2} />

      {settings.length === 0 ? null : (
        <>
          <Text variant="h3" text={t('tunnels/page/settings')} />
          <DetailList items={settings} columns={2} />
        </>
      )}

      <DangerOperations place={place} operations={operations} />
    </div>
  );
}
