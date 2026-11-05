import { useState, type ReactElement } from 'react';
import { getLocale } from '@softov/scena';
import { useI18n } from '@softov/scena/react';
import { DetailList, Modal, Progress, Text, Tree, type DetailItem, type TreeNode } from '@softov/scena/ui';
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
import './usage.css';

type T = ReturnType<typeof useI18n>['t'];

/** The kinds and figures the catalog names; any other is drawn by its own name. */
const KNOWN_ROWS = new Set(['system', 'toolDefinition', 'tool', 'skill', 'subagent', 'mcpServer', 'plugin', 'messages', 'free', 'buffer', 'deferred']);

/** A row's name: the catalog's for a kind it knows, else the kind as the host sent it. */
const rowLabel = (t: T, key: string): string => (KNOWN_ROWS.has(key) ? t(`sessions/usage/rows/${key}`) : key);

/** A share of the window, as `12.5%`. */
const share = (part: number, whole: number): string =>
  whole <= 0 ? '' : `${(part / whole * 100).toLocaleString(getLocale(), { maximumFractionDigits: 1 })}%`;

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

/** A context row as a tree node: its name, and its tokens and share at the end; its sources open under it. */
function nodeOf(t: T, row: ContextRow, whole: number): TreeNode {
  const figure = (count: number, counts: boolean): string => (counts ? `${tokens(count)} \u{00B7} ${share(count, whole)}` : tokens(count));
  return {
    key: row.key,
    icon: '',
    label: row.entries.length > 1 ? `${rowLabel(t, row.key)} (${row.entries.length})` : rowLabel(t, row.key),
    trailing: figure(row.tokens, row.counts),
    ...(row.entries.length === 0 ? {} : {
      children: row.entries.map((entry) => ({ key: entry.id, icon: '', label: entry.label, trailing: figure(entry.tokens, true) })),
    }),
  };
}

/** What fills the context window: a bar against the compaction window, and a row for each kind of source. */
export function ContextPart({ context }: { context: ContextUsage }): ReactElement {
  const { t } = useI18n();
  const whole = windowOf(context);
  const rows = contextRows(context);
  const limit = context.figures?.limit;
  const over = context.total > whole;
  const counted = rows.filter((row) => row.counts).map((row) => nodeOf(t, row, whole));
  const apart = rows.filter((row) => !row.counts).map((row) => nodeOf(t, row, whole));
  return (
    <section className="web-usage__part">
      <Text variant="h3" text={t('sessions/usage/context')} />
      <Text text={[
        t('sessions/usage/used', { used: tokens(context.total), window: tokens(whole), share: share(context.total, whole) }),
        ...(limit === undefined || limit === whole ? [] : [t('sessions/usage/limit', { limit: tokens(limit) })]),
      ].join(' \u{00B7} ')} />
      <Progress value={Math.min(context.total, whole)} max={whole} color={over ? 'red' : 'blue'} height={6} />
      {over ? <p className="web-note">{t('sessions/usage/over')}</p> : null}
      <Tree nodes={counted} />
      {apart.length === 0 ? null : (
        <>
          <Tree nodes={apart} />
          <p className="web-note">{t('sessions/usage/deferredNote')}</p>
        </>
      )}
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

/** One window of the plan: how much is used, its bar, when it resets and whether it lasts. */
function quotaItem(t: T, name: string, snapshot: QuotaSnapshot, now: number): DetailItem {
  const used = usedPercent(snapshot);
  const reset = snapshot.resetDate === undefined ? NaN : Date.parse(snapshot.resetDate);
  const pace = paceOf(name, snapshot, now);
  const notes = [
    ...(Number.isFinite(reset) ? [t('sessions/usage/resets', { in: untilWords(reset - now), at: when(reset) })] : []),
    ...(pace === undefined ? [] : [pace.lasts ? t('sessions/usage/lasts') : t('sessions/usage/runsOut', { in: untilWords(pace.runsOut - now) })]),
  ];
  return {
    label: quotaLabel(t, name),
    span: true,
    value: (
      <>
        <Text text={snapshot.isUnlimitedEntitlement === true ? t('sessions/usage/unlimited') : used === undefined ? '' : t('sessions/usage/percentUsed', { percent: Math.round(used) })} />
        {used === undefined ? null : <Progress value={used} max={100} color={used >= 100 ? 'red' : used >= 80 ? 'orange' : 'blue'} height={6} />}
        {notes.length === 0 ? null : <p className="web-note">{notes.join(' \u{00B7} ')}</p>}
      </>
    ),
  };
}

/** The credits beyond the plan, as one more item. */
function creditsItem(t: T, credits: { used?: number; limit?: number }): DetailItem {
  const number = (value: number): string => value.toLocaleString(getLocale());
  const words = credits.used === undefined ? '' : credits.limit === undefined
    ? t('sessions/usage/creditsUsed', { used: number(credits.used) })
    : t('sessions/usage/creditsOf', { used: number(credits.used), limit: number(credits.limit) });
  return {
    label: t('sessions/usage/credits'),
    span: true,
    value: (
      <>
        <Text text={words} />
        {credits.used === undefined || credits.limit === undefined || credits.limit <= 0 ? null : (
          <Progress value={Math.min(credits.used, credits.limit)} max={credits.limit} color="blue" height={6} />
        )}
      </>
    ),
  };
}

/** The plan's windows and credits, or why there are none. */
export function PlanPart({ quotas, account, now = Date.now() }: { quotas: Record<string, QuotaSnapshot> | undefined; account?: PlanAccount | undefined; now?: number }): ReactElement | null {
  const { t } = useI18n();
  if (quotas === undefined && account === undefined) return null;
  const credits = quotas === undefined ? undefined : creditsOf(quotas);
  const items = [
    ...(quotas === undefined ? [] : quotaOrder(quotas).map(([name, snapshot]) => quotaItem(t, name, snapshot, now))),
    ...(credits === undefined ? [] : [creditsItem(t, credits)]),
  ];
  return (
    <section className="web-usage__part">
      <Text variant="h3" text={t('sessions/usage/plan')} />
      {account?.subscriptionType === undefined ? null : <Text text={account.subscriptionType} />}
      {quotas === undefined ? <p className="web-note">{t('sessions/usage/planUnknown')}</p> : null}
      {quotas !== undefined && items.length === 0 ? <p className="web-note">{t('sessions/usage/noPlan')}</p> : null}
      {items.length === 0 ? null : <DetailList items={items} columns={1} />}
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
