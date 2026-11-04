import type { ReactElement } from 'react';
import { translate } from '@softov/scena';
import { useI18n, useStore } from '@softov/scena/react';
import { Badge, DetailList, Spinner, Text, type DetailItem } from '@softov/scena/ui';
import { useChannel } from '../../bridges/channel.js';
import { ahpPaths, type HostFacts } from '../../bridges/data.js';
import { rowOperations } from '../../bridges/operations.js';
import { embedMode } from '../../shell/embed/index.js';
import { HostTag } from '../../shell/explorer/HostLines.js';
import { PageTitle } from '../../shell/HostIcon.js';
import { PageAlert } from '../../shell/view/PageAlert.js';
import { EMOJIcon } from '../emojis.js';
import { DangerOperations, OperationButtons } from '../operations/Buttons.js';
import { dateFormat } from '../../i18n/locales.js';
import { bytesWords, CLIENTS, clientsReducer, factsOf, titleOf, type ClientFacts, type ClientsState } from './rows.js';

const when = dateFormat({ dateStyle: 'medium', timeStyle: 'medium' });

/** What the connection said, and what the socket reported. */
function factsList(host: string, facts: ClientFacts): DetailItem[] {
  const items: DetailItem[] = embedMode() === 'multi' ? [{ label: translate('common/host'), value: <HostTag host={host} /> }] : [];
  const add = (key: string, value: string | undefined): void => {
    if (value !== undefined && value !== '') items.push({ label: translate(`clients/facts/${key}`), value });
  };
  add('clientId', facts.clientId);
  add('name', facts.name);
  add('principal', facts.principal);
  add('address', facts.address);
  add('forwardedFor', facts.forwardedFor);
  add('protocolVersion', facts.protocolVersion);
  add('locale', facts.locale);
  add('connectedAt', facts.connectedAt === undefined ? undefined : when.format(new Date(facts.connectedAt)));
  add('watching', facts.watching.length === 0 ? undefined : String(facts.watching.length));
  return items;
}

/** What the socket carried each way: in is what the client sent. */
function trafficList(traffic: NonNullable<ClientFacts['traffic']>): DetailItem[] {
  return [
    { label: translate('clients/traffic/framesIn'), value: String(traffic.framesIn) },
    { label: translate('clients/traffic/framesOut'), value: String(traffic.framesOut) },
    { label: translate('clients/traffic/bytesIn'), value: bytesWords(traffic.bytesIn) },
    { label: translate('clients/traffic/bytesOut'), value: bytesWords(traffic.bytesOut) },
  ];
}

/** One connection: who it is, where it comes from, what it has carried, and the operations the host offers on it. */
export default function ClientPage({ host, client: id }: { host: string; client?: string }): ReactElement {
  const { t } = useI18n();
  const { state, error } = useChannel<ClientsState>(host, CLIENTS, clientsReducer);
  const mine = useStore<HostFacts | null>(ahpPaths(host).host)?.clientId;
  const entry = state?.records.find((one) => one.id === id);

  if (error !== null) return <PageAlert tone="danger" title={t('clients/notices/none')} message={error} />;
  if (state === undefined) return <Spinner label={t('clients/notices/reading')} />;
  if (entry === undefined || id === undefined) return <PageAlert tone="warning" message={t('clients/notices/gone')} />;

  const facts = factsOf(entry.record);
  const own = mine !== undefined && facts.clientId === mine;
  const operations = rowOperations(state, entry.record);
  const place = { host, channel: CLIENTS, target: id };

  return (
    <div className="web-page">
      <div className="web-page__head">
        <PageTitle
          emoji={EMOJIcon.clients}
          title={titleOf(facts)}
          uri={`${CLIENTS}${id}`}
          state={<Badge tone={own ? 'info' : 'success'} text={t(own ? 'clients/explorer/thisApp' : 'clients/explorer/connected')} />}
        />
        <OperationButtons place={place} operations={operations} />
      </div>

      <DetailList items={factsList(host, facts)} columns={2} />

      {facts.traffic === undefined ? null : (
        <>
          <Text variant="h3" text={t('clients/page/traffic')} />
          <DetailList items={trafficList(facts.traffic)} columns={2} />
        </>
      )}

      {facts.watching.length === 0 ? null : (
        <details className="web-record">
          <summary>{t('clients/page/watching')}</summary>
          <pre>{facts.watching.join('\n')}</pre>
        </details>
      )}

      <DangerOperations place={place} operations={operations} />
    </div>
  );
}
