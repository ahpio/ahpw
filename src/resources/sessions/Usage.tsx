import { useState, type ReactElement } from 'react';
import { getLocale } from '@softov/scena';
import { useI18n } from '@softov/scena/react';
import { Modal, Progress, Text } from '@softov/scena/ui';
import {
  contextRows,
  creditsOf,
  paceOf,
  quotaOrder,
  usedPercent,
  windowOf,
  type ContextRow,
  type ContextUsage,
  type PlanAccount,
  type QuotaSnapshot,
  type UsageMeta,
} from '../../bridges/usage-meta.js';
import { tokens, when } from './turn.js';

type T = ReturnType<typeof useI18n>['t'];

/** The kinds and figures the catalog names; any other is drawn by its own name. */
const KNOWN_ROWS = new Set(['system', 'toolDefinition', 'tool', 'skill', 'subagent', 'mcpServer', 'plugin', 'messages', 'free', 'buffer', 'deferred']);

/** A row's name: the catalog's for a kind it knows, else the kind as the host sent it. */
const rowLabel = (t: T, key: string): string => (KNOWN_ROWS.has(key) ? t(`sessions/usage/rows/${key}`) : key);

/** A share of the window, as `12.5%`. */
const share = (part: number, whole: number): string =>
  whole <= 0 ? '' : `${(part / whole * 100).toLocaleString(getLocale(), { maximumFractionDigits: 1 })}%`;

/** A count of tokens in full, for a title. */
const full = (count: number): string => count.toLocaleString(getLocale());

/** How long until a time, as `2 hr 10 min` or `3 days`. */
function untilWords(ms: number): string {
  const minutes = Math.max(0, Math.round(ms / 60_000));
  const unit = (value: number, kind: 'day' | 'hour' | 'minute'): string =>
    new Intl.NumberFormat(getLocale(), { style: 'unit', unit: kind, unitDisplay: 'short' }).format(value);
  if (minutes < 60) return unit(minutes, 'minute');
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return minutes % 60 === 0 ? unit(hours, 'hour') : `${unit(hours, 'hour')} ${unit(minutes % 60, 'minute')}`;
  const days = Math.floor(hours / 24);
  return hours % 24 === 0 ? unit(days, 'day') : `${unit(days, 'day')} ${unit(hours % 24, 'hour')}`;
}

/** One row of the context part, which opens to its sources when it has any. */
function ContextLine({ row, whole }: { row: ContextRow; whole: number }): ReactElement {
  const { t } = useI18n();
  const head = (
    <>
      <span className="web-usage__name">{rowLabel(t, row.key)}{row.entries.length > 1 ? <span className="web-usage__count">{` \u{00B7} ${row.entries.length}`}</span> : null}</span>
      <span className="web-usage__figure" title={full(row.tokens)}>{tokens(row.tokens)}</span>
      <span className="web-usage__share">{row.counts ? share(row.tokens, whole) : ''}</span>
    </>
  );
  if (row.entries.length === 0) return <div className={`web-usage__row web-usage__row--${row.key}`}>{head}</div>;
  return (
    <details className="web-usage__group">
      <summary className="web-usage__row">{head}</summary>
      {row.entries.map((entry) => (
        <div key={entry.id} className="web-usage__row web-usage__row--entry">
          <span className="web-usage__name" title={entry.label}>{entry.label}</span>
          <span className="web-usage__figure" title={full(entry.tokens)}>{tokens(entry.tokens)}</span>
          <span className="web-usage__share">{share(entry.tokens, whole)}</span>
        </div>
      ))}
    </details>
  );
}

/** What fills the context window: a bar against the compaction window, and a row for each kind of source. */
export function ContextPart({ context }: { context: ContextUsage }): ReactElement {
  const { t } = useI18n();
  const whole = windowOf(context);
  const rows = contextRows(context);
  const limit = context.figures?.limit;
  const over = context.total > whole;
  return (
    <section className="web-usage__part">
      <Text variant="h3" text={t('sessions/usage/context')} />
      <div className="web-usage__total">
        <span title={t('sessions/usage/usedTitle', { used: full(context.total), window: full(whole) })}>
          {t('sessions/usage/used', { used: tokens(context.total), window: tokens(whole), share: share(context.total, whole) })}
        </span>
        {limit === undefined || limit === whole ? null : <span className="web-note">{t('sessions/usage/limit', { limit: tokens(limit) })}</span>}
      </div>
      <Progress value={Math.min(context.total, whole)} max={whole} color={over ? 'red' : 'blue'} height={6} />
      {over ? <p className="web-note">{t('sessions/usage/over')}</p> : null}
      <div className="web-usage__rows">
        {rows.filter((row) => row.counts).map((row) => <ContextLine key={row.key} row={row} whole={whole} />)}
      </div>
      {rows.some((row) => !row.counts) ? (
        <div className="web-usage__rows web-usage__rows--apart">
          {rows.filter((row) => !row.counts).map((row) => <ContextLine key={row.key} row={row} whole={whole} />)}
          <p className="web-note">{t('sessions/usage/deferredNote')}</p>
        </div>
      ) : null}
    </section>
  );
}

/** A window's name: the session, the week, or a named week. */
function quotaLabel(t: T, key: string): string {
  if (key === 'session') return t('sessions/usage/quotas/session');
  if (key === 'weekly') return t('sessions/usage/quotas/weekly');
  if (key.startsWith('weekly:')) {
    const name = key.slice('weekly:'.length).replace(/_/g, ' ');
    return t('sessions/usage/quotas/weeklyOf', { name: name.charAt(0).toUpperCase() + name.slice(1) });
  }
  return key;
}

/** One window of the plan: its bar, how much is used, when it resets and whether it lasts. */
function QuotaLine({ name, snapshot, now }: { name: string; snapshot: QuotaSnapshot; now: number }): ReactElement {
  const { t } = useI18n();
  const used = usedPercent(snapshot);
  const reset = snapshot.resetDate === undefined ? NaN : Date.parse(snapshot.resetDate);
  const pace = paceOf(name, snapshot, now);
  return (
    <div className="web-usage__quota">
      <div className="web-usage__quota-head">
        <span className="web-usage__name">{quotaLabel(t, name)}</span>
        <span className="web-usage__figure">
          {snapshot.isUnlimitedEntitlement === true ? t('sessions/usage/unlimited') : used === undefined ? '' : t('sessions/usage/percentUsed', { percent: Math.round(used) })}
        </span>
      </div>
      {used === undefined ? null : <Progress value={used} max={100} color={used >= 100 ? 'red' : used >= 80 ? 'orange' : 'blue'} height={6} />}
      <div className="web-usage__quota-foot web-note">
        {Number.isFinite(reset) ? <span title={new Date(reset).toLocaleString(getLocale())}>{t('sessions/usage/resets', { in: untilWords(reset - now), at: when(reset) })}</span> : null}
        {pace === undefined ? null : <span>{pace.lasts ? t('sessions/usage/lasts') : t('sessions/usage/runsOut', { in: untilWords(pace.runsOut - now) })}</span>}
      </div>
    </div>
  );
}

/** The plan's windows and credits, or why there are none. */
export function PlanPart({ quotas, account, now = Date.now() }: { quotas: Record<string, QuotaSnapshot> | undefined; account?: PlanAccount | undefined; now?: number }): ReactElement | null {
  const { t } = useI18n();
  if (quotas === undefined && account === undefined) return null;
  const windows = quotas === undefined ? [] : quotaOrder(quotas);
  const credits = quotas === undefined ? undefined : creditsOf(quotas);
  return (
    <section className="web-usage__part">
      <Text variant="h3" text={t('sessions/usage/plan')} />
      {account?.subscriptionType === undefined ? null : <p className="web-usage__plan">{account.subscriptionType}</p>}
      {quotas === undefined ? <p className="web-note">{t('sessions/usage/planUnknown')}</p> : null}
      {quotas !== undefined && windows.length === 0 ? <p className="web-note">{t('sessions/usage/noPlan')}</p> : null}
      {windows.map(([name, snapshot]) => <QuotaLine key={name} name={name} snapshot={snapshot} now={now} />)}
      {credits === undefined ? null : (
        <div className="web-usage__quota">
          <div className="web-usage__quota-head">
            <span className="web-usage__name">{t('sessions/usage/credits')}</span>
            <span className="web-usage__figure">
              {credits.used === undefined ? '' : credits.limit === undefined
                ? t('sessions/usage/creditsUsed', { used: credits.used.toLocaleString(getLocale()) })
                : t('sessions/usage/creditsOf', { used: credits.used.toLocaleString(getLocale()), limit: credits.limit.toLocaleString(getLocale()) })}
            </span>
          </div>
          {credits.used === undefined || credits.limit === undefined || credits.limit <= 0 ? null : (
            <Progress value={Math.min(credits.used, credits.limit)} max={credits.limit} color="blue" height={6} />
          )}
        </div>
      )}
    </section>
  );
}

/** The session's Usage view: the context part, and the plan part when the session has one. */
export function UsageDialog({ usage, onClose }: { usage: UsageMeta; onClose: () => void }): ReactElement {
  const { t } = useI18n();
  const [now] = useState(() => Date.now());
  return (
    <Modal open title={t('sessions/usage/title')} onClose={onClose}>
      <div className="web-usage">
        {usage.context === undefined ? <p className="web-note">{t('sessions/usage/noContext')}</p> : <ContextPart context={usage.context} />}
        <PlanPart quotas={usage.quotas} account={usage.account} now={now} />
      </div>
    </Modal>
  );
}

/** Whether a session's usage has anything to show. */
export const hasUsage = (usage: UsageMeta): boolean => usage.context !== undefined || usage.quotas !== undefined || usage.account !== undefined;
