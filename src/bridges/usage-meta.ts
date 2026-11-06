/**
 * What a session's `_meta` says of its usage: the context breakdown and the
 * plan limits, under VS Code's well-known keys `contextAttribution` and
 * `quotaSnapshots`, and ahpd's own `ahpd.context` and `ahpd.account`.
 *
 * ahpd puts them on the session's `_meta` before and between turns, and on
 * each turn's usage `_meta`. A connector's health carries `quotaSnapshots`
 * and `account` for a login's account across its sessions.
 * https://github.com/microsoft/vscode/blob/289eaeb2b9d3eaa4b7f2bcb68acb0f4e22a8d5a9/src/vs/platform/agentHost/common/meta/vscode/agentUsageMeta.ts#L106-L160
 */

type Bag = Record<string, unknown>;

const bagOf = (value: unknown): Bag | undefined =>
  typeof value === 'object' && value !== null && !Array.isArray(value) ? (value as Bag) : undefined;

const numOf = (value: unknown): number | undefined =>
  typeof value === 'number' && Number.isFinite(value) ? value : undefined;

const strOf = (value: unknown): string | undefined => (typeof value === 'string' && value !== '' ? value : undefined);

/** One source in the context window, as `contextAttribution` lists it. */
export interface ContextEntry {
  kind: string;
  id: string;
  label: string;
  tokens: number;
}

/** ahpd's figures beside the entries: the window, the model's limit and what fills nothing. */
export interface ContextFigures {
  used: number;
  /** The window the conversation compacts at. */
  size?: number;
  /** The model's own window. */
  limit?: number;
  free?: number;
  /** What the window keeps free so it can compact. */
  buffer?: number;
  /** Tool schemas that are named but not loaded, which fill nothing. */
  deferred?: number;
}

/** What fills a session's context window. */
export interface ContextUsage {
  total: number;
  entries: ContextEntry[];
  figures?: ContextFigures;
}

/** One window of an account's plan limits, in VS Code's shape. */
export interface QuotaSnapshot {
  remainingPercentage?: number;
  resetDate?: string;
  isUnlimitedEntitlement?: boolean;
  overage?: number;
  overageEntitlement?: number;
  overageAllowedWithExhaustedQuota?: boolean;
}

/** The plan a login's account is on. */
export interface PlanAccount {
  subscriptionType?: string;
  apiProvider?: string;
}

/** What a map says of its usage: each part only when it is there. */
export interface UsageMeta {
  context?: ContextUsage;
  /** An empty map says the account has no plan limits; absent says nobody knows yet. */
  quotas?: Record<string, QuotaSnapshot>;
  account?: PlanAccount;
}

/** The context breakdown of a map, or nothing when it has none. */
export function contextOf(meta: unknown): ContextUsage | undefined {
  const found = bagOf(meta);
  if (found === undefined) return undefined;
  const attribution = bagOf(found.contextAttribution);
  const figures = bagOf(found['ahpd.context']);
  const used = numOf(figures?.used);
  const total = numOf(attribution?.totalTokens) ?? used;
  if (total === undefined) return undefined;
  const entries = (Array.isArray(attribution?.entries) ? attribution.entries : []).flatMap((one): ContextEntry[] => {
    const entry = bagOf(one);
    const tokens = numOf(entry?.tokens);
    const kind = strOf(entry?.kind);
    const id = strOf(entry?.id);
    if (entry === undefined || tokens === undefined || kind === undefined || id === undefined) return [];
    return [{ kind, id, label: strOf(entry.label) ?? id, tokens }];
  });
  const out: ContextUsage = { total, entries };
  if (figures !== undefined && used !== undefined) {
    out.figures = { used };
    for (const key of ['size', 'limit', 'free', 'buffer', 'deferred'] as const) {
      const value = numOf(figures[key]);
      if (value !== undefined) out.figures[key] = value;
    }
  }
  return out;
}

/** The plan windows of a map, or nothing when it names none. */
export function quotasOf(value: unknown): Record<string, QuotaSnapshot> | undefined {
  const found = bagOf(value);
  if (found === undefined) return undefined;
  const out: Record<string, QuotaSnapshot> = {};
  for (const [key, one] of Object.entries(found)) {
    const snapshot = bagOf(one);
    if (snapshot !== undefined) out[key] = snapshot as QuotaSnapshot;
  }
  return out;
}

/** The plan type and provider of a map's account, or nothing. */
export function accountOf(value: unknown): PlanAccount | undefined {
  const found = bagOf(value);
  if (found === undefined) return undefined;
  const subscriptionType = strOf(found.subscriptionType);
  const apiProvider = strOf(found.apiProvider);
  if (subscriptionType === undefined && apiProvider === undefined) return undefined;
  return { ...(subscriptionType === undefined ? {} : { subscriptionType }), ...(apiProvider === undefined ? {} : { apiProvider }) };
}

/** Every usage part of a session's or a turn's `_meta`. */
export function usageMetaOf(meta: unknown): UsageMeta {
  const found = bagOf(meta) ?? {};
  const context = contextOf(found);
  const quotas = quotasOf(found.quotaSnapshots);
  const account = accountOf(found['ahpd.account']);
  return {
    ...(context === undefined ? {} : { context }),
    ...(quotas === undefined ? {} : { quotas }),
    ...(account === undefined ? {} : { account }),
  };
}

/**
 * The newest usage of a session: its own `_meta`, which ahpd says before and
 * after each turn, part by part over the last turn's usage `_meta`.
 */
export function sessionUsage(sessionMeta: unknown, turnMeta: unknown): UsageMeta {
  return { ...usageMetaOf(turnMeta), ...usageMetaOf(sessionMeta) };
}

/** One row of the context part: a kind of source and what it fills, or a figure of the window. */
export interface ContextRow {
  /** A kind of `contextAttribution`, or `messages`, `free`, `buffer` or `deferred`. */
  key: string;
  tokens: number;
  /** The sources of a kind, largest first; empty for a figure. */
  entries: ContextEntry[];
  /** Whether it counts toward the window: deferred tools do not. */
  counts: boolean;
}

/**
 * The rows of the context part, in the order the window fills.
 *
 * The entries group by their kind, in the order the kinds first appear. What
 * no entry covers is the messages, as VS Code counts it. Free space and the
 * compaction buffer follow, and deferred tools come last and count for nothing.
 * https://github.com/microsoft/vscode/blob/289eaeb2b9d3eaa4b7f2bcb68acb0f4e22a8d5a9/src/vs/workbench/contrib/chat/browser/agentSessions/agentHost/stateToProgressAdapter.ts#L964-L1050
 */
export function contextRows(context: ContextUsage): ContextRow[] {
  const kinds = new Map<string, ContextEntry[]>();
  for (const entry of context.entries) kinds.set(entry.kind, [...(kinds.get(entry.kind) ?? []), entry]);
  const rows: ContextRow[] = [...kinds].map(([key, entries]) => ({
    key,
    tokens: entries.reduce((sum, one) => sum + one.tokens, 0),
    entries: [...entries].sort((a, b) => b.tokens - a.tokens),
    counts: true,
  }));
  const covered = rows.reduce((sum, row) => sum + row.tokens, 0);
  const messages = context.total - covered;
  if (messages > 0) rows.push({ key: 'messages', tokens: messages, entries: [], counts: true });
  const figures = context.figures;
  for (const key of ['free', 'buffer'] as const) {
    const tokens = figures?.[key];
    if (tokens !== undefined && tokens > 0) rows.push({ key, tokens, entries: [], counts: true });
  }
  if (figures?.deferred !== undefined && figures.deferred > 0) rows.push({ key: 'deferred', tokens: figures.deferred, entries: [], counts: false });
  return rows;
}

/** The window the bar fills against: the compaction window, else the model's, else what is used. */
export const windowOf = (context: ContextUsage): number => context.figures?.size ?? context.figures?.limit ?? context.total;

/** How long a window lasts, by its key, or nothing for a key whose length is not known. */
export function windowLength(key: string): number | undefined {
  if (key === 'session') return 5 * 60 * 60 * 1000;
  if (key === 'weekly' || key.startsWith('weekly:')) return 7 * 24 * 60 * 60 * 1000;
  return undefined;
}

/** How much of a window is used, from 0 to 100, or nothing when the host does not say. */
export const usedPercent = (snapshot: QuotaSnapshot): number | undefined =>
  snapshot.remainingPercentage === undefined ? undefined : Math.min(100, Math.max(0, 100 - snapshot.remainingPercentage));

/**
 * Whether a window lasts until it resets at the pace it has been used.
 *
 * The share used is compared with the share of the window's time that has
 * passed. `runsOut` is when the pace reaches the limit, before the reset; a
 * window used no faster than its time is `lasts`. Nothing when the window's
 * length, its reset or its use is not known, or it has only just begun.
 */
export function paceOf(key: string, snapshot: QuotaSnapshot, now: number): { lasts: true } | { lasts: false; runsOut: number } | undefined {
  const length = windowLength(key);
  const used = usedPercent(snapshot);
  const reset = snapshot.resetDate === undefined ? NaN : Date.parse(snapshot.resetDate);
  if (length === undefined || used === undefined || !Number.isFinite(reset)) return undefined;
  const elapsed = length - Math.max(0, reset - now);
  if (elapsed <= 0 || elapsed > length) return undefined;
  if (used <= 0) return { lasts: true };
  const rate = used / elapsed;
  const runsOut = now + (100 - used) / rate;
  return runsOut >= reset ? { lasts: true } : { lasts: false, runsOut };
}

/** The windows in the order a person reads them: the session, the week, then each named week. */
export function quotaOrder(quotas: Record<string, QuotaSnapshot>): [string, QuotaSnapshot][] {
  const rank = (key: string): number => (key === 'session' ? 0 : key === 'weekly' ? 1 : key.startsWith('weekly:') ? 2 : 3);
  return Object.entries(quotas).sort(([a], [b]) => rank(a) - rank(b) || a.localeCompare(b));
}

/** The credits beyond the plan, from whichever window carries them. */
export function creditsOf(quotas: Record<string, QuotaSnapshot>): { used?: number; limit?: number } | undefined {
  for (const [, snapshot] of quotaOrder(quotas)) {
    if (snapshot.overageAllowedWithExhaustedQuota !== true && snapshot.overage === undefined) continue;
    return {
      ...(snapshot.overage === undefined ? {} : { used: snapshot.overage }),
      ...(snapshot.overageEntitlement === undefined ? {} : { limit: snapshot.overageEntitlement }),
    };
  }
  return undefined;
}
