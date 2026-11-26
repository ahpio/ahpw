import { useRef, type ReactElement } from 'react';
import { translate } from '@softov/scena';
import { useI18n, useScena, useStore } from '@softov/scena/react';
import { Badge, DetailList, Text, type DetailItem } from '@softov/scena/ui';
import { useChannel } from '../../bridges/channel.js';
import type { ChatSummary } from '@microsoft/agent-host-protocol';
import { ahpPaths, channelPath, titlePath, type HostFacts } from '../../bridges/data.js';
import { useEach } from '../../bridges/hosts.js';
import { NO_OFFERS, type Offers } from '../../bridges/offers.js';
import { rowOperations } from '../../bridges/operations.js';
import { runnableBy, useOwnGrants } from '../../bridges/own-grants.js';
import { elapsed } from '../../bridges/words.js';
import { embedMode } from '../../shell/embed/index.js';
import { HostTag } from '../../shell/explorer/HostLines.js';
import { PageTitle } from '../../shell/HostIcon.js';
import { PageAlert } from '../../shell/view/PageAlert.js';
import { EMOJIcon } from '../emojis.js';
import { DangerOperations, OperationButtons } from '../operations/Buttons.js';
import { useNow } from '../sessions/clock.js';
import { dateFormat } from '../../i18n/locales.js';
import {
  bytesWords, CLIENTS, clientsReducer, clientWords, factsOf, isIdle, rateOf, titleOf, whoOf,
  type ClientFacts, type ClientsState, type Reading,
} from './rows.js';
import { describeChannels } from './channels.js';
import './channels.css';
import { PageSpinner } from '../../shell/view/PageSpinner.js';

const when = dateFormat({ dateStyle: 'medium', timeStyle: 'medium' });

/** A label marked as the client's claim, which nothing in the host trusts. */
const claimed = (key: string): string => `${translate(`clients/facts/${key}`)} (${translate('clients/facts/claim')})`;

/** What the connection said, and what the socket reported. */
function factsList(host: string, facts: ClientFacts): DetailItem[] {
  const items: DetailItem[] = embedMode() === 'multi' ? [{ label: translate('common/host'), value: <HostTag host={host} /> }] : [];
  const add = (label: string, value: string | undefined): void => {
    if (value !== undefined && value !== '') items.push({ label, value });
  };
  const fact = (key: string, value: string | undefined): void => add(translate(`clients/facts/${key}`), value);
  fact('client', clientWords(facts));
  fact('clientId', facts.clientId);
  fact('principal', whoOf(facts, translate('clients/facts/hostToken')));
  fact('roles', facts.roles.length === 0 ? undefined : facts.roles.join(', '));
  fact('team', facts.team);
  fact('principalUntil', facts.principalUntil === undefined ? undefined : when.format(new Date(facts.principalUntil)));
  fact('address', facts.address);
  fact('path', facts.path);
  fact('node', facts.node);
  add(claimed('forwardedFor'), facts.forwardedFor);
  add(claimed('userAgent'), facts.userAgent);
  add(claimed('origin'), facts.origin);
  fact('protocolVersion', facts.protocolVersion);
  fact('locale', facts.locale);
  if (facts.connectedAt !== undefined) {
    const at = when.format(new Date(facts.connectedAt));
    fact('connectedAt', facts.arrival === undefined ? at : `${at} \u{00B7} ${translate(`clients/facts/arrival/${facts.arrival}`)}`);
  }
  fact('capabilities', facts.capabilities.length === 0 ? undefined : facts.capabilities.join(', '));
  fact('watching', facts.watching.length === 0 ? undefined : String(facts.watching.length));
  return items;
}

/** How long ago a wall-clock millisecond was, as `4s ago`. */
const ago = (at: number, now: number): string => translate('clients/traffic/ago', { time: elapsed(now - at) });

/** What the socket carried each way, and whether it is moving now: in is what the client sent. */
function trafficList(facts: ClientFacts, rate: { bytesIn: number; bytesOut: number } | undefined, now: number): DetailItem[] {
  const items: DetailItem[] = [];
  const add = (key: string, value: ReactElement | string | undefined): void => {
    if (value !== undefined) items.push({ label: translate(`clients/traffic/${key}`), value });
  };
  if (rate !== undefined) {
    add('rateIn', translate('clients/traffic/perSecond', { bytes: bytesWords(Math.round(rate.bytesIn)) }));
    add('rateOut', translate('clients/traffic/perSecond', { bytes: bytesWords(Math.round(rate.bytesOut)) }));
  }
  add('lastIn', facts.lastIn === undefined ? undefined : ago(facts.lastIn, now));
  add('lastOut', facts.lastOut === undefined ? undefined : ago(facts.lastOut, now));
  add('lastPing', facts.lastPing === undefined ? undefined : ago(facts.lastPing, now));
  if (facts.traffic !== undefined) {
    add('framesIn', String(facts.traffic.framesIn));
    add('framesOut', String(facts.traffic.framesOut));
    add('bytesIn', bytesWords(facts.traffic.bytesIn));
    add('bytesOut', bytesWords(facts.traffic.bytesOut));
  }
  if (facts.queuedBytes !== undefined) {
    const words = facts.queueLimit === undefined
      ? bytesWords(facts.queuedBytes)
      : translate('clients/traffic/queueOf', { used: bytesWords(facts.queuedBytes), limit: bytesWords(facts.queueLimit) });
    // Past half the limit the wire is backing up, and the client may be dropped at the limit.
    const full = facts.queueLimit !== undefined && facts.queuedBytes > facts.queueLimit / 2;
    add('queue', full ? <Badge tone="warning" text={words} /> : words);
  }
  add('refused', facts.refused === undefined ? undefined : String(facts.refused));
  return items;
}

/** How long counters may stand still before the rate reads zero: one host tick, and a second of slack. */
const STILL_MS = 6_000;

/**
 * The rate since the last counter reading this page saw.
 *
 * Counters arrive on the host's 5-second tick, so a rate needs two of them: it
 * is absent until the second, and stays the last one worked out while the
 * counters do not move between renders. The host sends no new row while they
 * stand still, so counters older than one tick read as zero each way.
 */
function useRate(traffic: ClientFacts['traffic'], now: number): { bytesIn: number; bytesOut: number } | undefined {
  const last = useRef<{ reading: Reading; rate?: { bytesIn: number; bytesOut: number } } | undefined>(undefined);
  if (traffic === undefined) return undefined;
  const held = last.current;
  if (held === undefined) {
    last.current = { reading: { bytesIn: traffic.bytesIn, bytesOut: traffic.bytesOut, at: Date.now() } };
    return undefined;
  }
  if (held.reading.bytesIn === traffic.bytesIn && held.reading.bytesOut === traffic.bytesOut) {
    return now - held.reading.at > STILL_MS ? { bytesIn: 0, bytesOut: 0 } : held.rate;
  }
  const reading = { bytesIn: traffic.bytesIn, bytesOut: traffic.bytesOut, at: Date.now() };
  const rate = rateOf(held.reading, reading);
  last.current = { reading, ...(rate === undefined ? {} : { rate }) };
  return rate;
}

/** One list, folded under its heading with its count, drawn only when it holds any. */
function Folded({ title, count, children }: { title: string; count: number; children: ReactElement }): ReactElement | null {
  if (count === 0) return null;
  return (
    <details className="web-record">
      <summary>{`${title} (${String(count)})`}</summary>
      {children}
    </details>
  );
}

/** A session by the title the host gives it, opened when clicked. */
function SessionLink({ host, resource }: { host: string; resource: string }): ReactElement {
  const scena = useScena();
  const title = useStore<string>(titlePath(host, resource));
  return (
    <li>
      <button type="button" className="web-link" onClick={() => void scena.commands.execute('ahp.openSession', { host, resource })}>
        {title ?? resource}
      </button>
    </li>
  );
}

/** The channels a client follows, in the order of their URIs: what each is, and a link to its view where this app has one. */
function ChannelList({ host, facts }: { host: string; facts: ClientFacts }): ReactElement {
  const scena = useScena();
  const offers = useStore<Offers>(ahpPaths(host).offers);
  // Any followed URI may be a session, or hold one before its changeset.
  const candidates = [...new Set([...facts.sessions, ...facts.watching.map((uri) => uri.split('/changeset/')[0] ?? uri)])];
  const titles = useEach<string>(candidates.map((uri) => titlePath(host, uri)));
  const states = useEach<{ chats?: readonly ChatSummary[] }>(candidates.map((uri) => channelPath(host, uri)));
  const entries = describeChannels(facts.watching, {
    host,
    offers,
    sessions: facts.sessions,
    titleOf: (session) => titles[candidates.indexOf(session)],
    sessionOf: (chat) => candidates.find((_, at) => states[at]?.chats?.some((one) => one.resource === chat) === true),
  });
  return (
    <ul className="web-channels">
      {entries.map(({ uri, title, description, open }) => (
        <li key={uri} className="web-channels__row">
          {open === undefined
            ? <span className="web-channels__title">{title}</span>
            : (
              <button type="button" className="web-link web-channels__title" onClick={() => void scena.commands.execute(open.command, open.args)}>
                {title}
              </button>
            )}
          <span className="web-channels__uri">{uri}</span>
          {description === undefined ? null : <span className="web-channels__description">{description}</span>}
        </li>
      ))}
    </ul>
  );
}

/** One connection: who it is, where it comes from, what it carries now, and the operations the host offers on it. */
export default function ClientPage({ host, client: id }: { host: string; client?: string }): ReactElement {
  const { t } = useI18n();
  const { state, error } = useChannel<ClientsState>(host, CLIENTS, clientsReducer);
  const mine = useStore<HostFacts | null>(ahpPaths(host).host)?.clientId;
  const grants = useOwnGrants(host, useStore<Offers>(ahpPaths(host).offers) ?? NO_OFFERS);
  const entry = state?.records.find((one) => one.id === id);
  const facts = entry === undefined ? undefined : factsOf(entry.record);
  const now = useNow(facts !== undefined);
  const rate = useRate(facts?.traffic, now);

  if (error !== null) return <PageAlert tone="danger" title={t('clients/notices/none')} message={error} />;
  if (state === undefined) return <PageSpinner label={t('clients/notices/reading')} />;
  if (entry === undefined || facts === undefined || id === undefined) return <PageAlert tone="warning" message={t('clients/notices/gone')} />;

  const own = mine !== undefined && facts.clientId === mine;
  const operations = runnableBy(rowOperations(state, entry.record), grants);
  const place = { host, channel: CLIENTS, target: id };
  const traffic = trafficList(facts, rate, now);
  // Its own connection is never idle while this page draws it, so the two badges never meet.
  const badge = own
    ? <Badge tone="info" text={t('clients/explorer/thisApp')} />
    : isIdle(facts, now)
      ? <Badge tone="warning" text={t('clients/explorer/idle')} />
      : <Badge tone="success" text={t('clients/explorer/connected')} />;

  return (
    <div className="web-page">
      <div className="web-page__head">
        <PageTitle emoji={EMOJIcon.clients} title={titleOf(facts)} uri={`${CLIENTS}${id}`} state={badge} />
        <OperationButtons place={place} operations={operations} />
      </div>

      <DetailList items={factsList(host, facts)} columns={2} />

      {traffic.length === 0 ? null : (
        <>
          <Text variant="h3" text={t('clients/page/traffic')} />
          <DetailList items={traffic} columns={2} />
        </>
      )}

      <Folded title={t('clients/page/watching')} count={facts.watching.length}>
        <ChannelList host={host} facts={facts} />
      </Folded>
      <Folded title={t('clients/page/authenticated')} count={facts.authenticated.length}>
        <pre>{facts.authenticated.join('\n')}</pre>
      </Folded>
      <Folded title={t('clients/page/sessions')} count={facts.sessions.length}>
        <ul>
          {facts.sessions.map((resource) => <SessionLink key={resource} host={host} resource={resource} />)}
        </ul>
      </Folded>

      <DangerOperations place={place} operations={operations} />
    </div>
  );
}
