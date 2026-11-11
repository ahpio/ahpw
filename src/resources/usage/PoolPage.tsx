import { useEffect, useState, type ReactElement } from 'react';
import { useI18n, useScena, useStore } from '@softov/scena/react';
import { Button, DetailList, Spinner, Text } from '@softov/scena/ui';
import { ahpPaths } from '../../bridges/data.js';
import { NO_OFFERS, type Offers } from '../../bridges/offers.js';
import { personUri } from '../../bridges/people.js';
import { poolOwner, usagePeriods, usageRange, usageRecords, type DayRange, type PoolOwner, type UsageEntry, type UsagePeriods, type UsageTotal } from '../../bridges/usage.js';
import { embedMode } from '../../shell/embed/index.js';
import { HostTag } from '../../shell/explorer/HostLines.js';
import { PageAlert } from '../../shell/view/PageAlert.js';
import { EMOJIcon } from '../emojis.js';
import { monthSoFar, USAGE_ASKED } from './state.js';
import { UsageRecords } from './Records.js';
import { totalLine } from './words.js';
import { PageTitle } from '../../shell/HostIcon.js';
import './pool-page.css';

/** What a pool's range reads: its total and the records behind it, for the range and reload they were read for. */
interface Ranged {
  total: UsageTotal;
  records: UsageEntry[];
  range: Required<DayRange>;
  asked: number;
}

/** A pool's periods, for the reload they were read for. */
interface Periods {
  held: UsagePeriods;
  asked: number;
}

/** The command that opens an owner's page, and the icon its list shows it with. */
const OWNERS: Record<PoolOwner['domain'], { open: string; icon: string }> = {
  users: { open: 'ahp.openUser', icon: EMOJIcon.users },
  teams: { open: 'ahp.openTeam', icon: EMOJIcon.teams },
  projects: { open: 'ahp.openProject', icon: EMOJIcon.teams },
};

/**
 * One pool: what it was charged today, this week and this month, over a range
 * of days, and the records behind that range, newest first, each opening the
 * session it was charged in.
 */
export default function UsagePoolPage({ host, pool }: { host: string; pool: string }): ReactElement {
  const scena = useScena();
  const { t } = useI18n();
  const offers = useStore<Offers>(ahpPaths(host).offers) ?? NO_OFFERS;
  const asked = useStore<number>(USAGE_ASKED) ?? 0;
  const [range, setRange] = useState<Required<DayRange>>(() => monthSoFar(new Date()));
  const [read, setRead] = useState<Periods | null>(null);
  const [ranged, setRanged] = useState<Ranged | null>(null);
  const [error, setError] = useState<string | null>(null);
  const said = (caught: unknown): string => (caught instanceof Error ? caught.message : String(caught));

  useEffect(() => {
    let live = true;
    usagePeriods(host, offers, pool).then((held) => { if (live) setRead({ held, asked }); }, (caught: unknown) => { if (live) setError(said(caught)); });
    return () => { live = false; };
  }, [host, offers, pool, asked]);

  useEffect(() => {
    let live = true;
    // A reload keeps what the range showed until the new read lands; another range starts over.
    setRanged((held) => (held?.range === range ? held : null));
    Promise.all([usageRange(host, offers, pool, range), usageRecords(host, offers, pool, range)]).then(
      ([total, records]) => { if (live) setRanged({ total, records, range, asked }); },
      (caught: unknown) => { if (live) setError(said(caught)); },
    );
    return () => { live = false; };
  }, [host, offers, pool, range, asked]);

  if (error !== null) return <PageAlert tone="danger" title={t('usage/notices/none')} message={error} />;
  if (read === null) return <Spinner label={t('usage/notices/reading')} />;
  const periods = read.held;
  const reading = read.asked !== asked || ranged === null || ranged.asked !== asked;
  const reload = t(reading ? 'usage/notices/reading' : 'common/reload');
  const nothing = t('usage/explorer/nothing');
  const owner = poolOwner(pool);
  const name = periods.name || pool;

  return (
    <div className="web-page">
      {/* A person's, team's or project's pool names it as its own page does, and opens that page. */}
      {owner === undefined ? <PageTitle emoji={EMOJIcon.usage} title={name} /> : (
        <PageTitle
          emoji={OWNERS[owner.domain].icon}
          title={name}
          onTitle={() => void scena.commands.execute(OWNERS[owner.domain].open, { host, id: owner.id })}
          titleHint={t('usage/pool/openOwner', { name })}
          uri={personUri(offers, owner.domain, owner.id)}
          uriHint={pool}
        />
      )}
      {owner === undefined ? <p className="web-note">{pool}</p> : null}
      <DetailList
        items={[
          ...(embedMode() === 'multi' ? [{ label: t('common/host'), value: <HostTag host={host} />, span: true }] : []),
          ...(['day', 'week', 'month'] as const).map((period) => ({ label: t(`usage/period/${period}`), value: totalLine(periods[period]) || nothing })),
        ]}
      />

      <Text variant="h3" text={`${EMOJIcon.filter} ${t('usage/pool/range')}`} />
      <div className="web-spend__range">
        <input className="web-field" type="date" value={range.from} max={range.until} aria-label={t('usage/range/from')} onChange={(event) => { if (event.target.value !== '') setRange({ ...range, from: event.target.value }); }} />
        <span aria-hidden="true">{'\u{2013}'}</span>
        <input className="web-field" type="date" value={range.until} min={range.from} aria-label={t('usage/range/until')} onChange={(event) => { if (event.target.value !== '') setRange({ ...range, until: event.target.value }); }} />
        <Button variant="ghost" title={reload} onClick={() => void scena.commands.execute('usage.reload')}>
          <span className="web-spend__reload" data-busy={reading ? 'true' : 'false'} aria-hidden="true">{EMOJIcon.reload}</span>
        </Button>
      </div>
      {ranged === null ? <Spinner label={t('usage/notices/reading')} /> : (
        <>
          <p>{totalLine(ranged.total) || nothing}</p>
          <Text variant="h3" text={`${EMOJIcon.records} ${t('usage/pool/records')}`} />
          {ranged.records.length === 0 ? <p className="web-note">{t('usage/pool/noRecords')}</p> : (
            <UsageRecords host={host} records={ranged.records} />
          )}
        </>
      )}
    </div>
  );
}
