import { describe, expect, it } from 'vitest';
import { contextRows, creditsOf, paceOf, quotaOrder, sessionUsage, usageMetaOf, windowOf } from './usage-meta.js';

/** A session's `_meta` as ahpd's agent-claude sends it before a turn. */
const meta = {
  'ahpd.model': 'opus',
  contextAttribution: {
    totalTokens: 40000,
    entries: [
      { kind: 'system', id: 'system:prompt:main', label: 'System prompt', tokens: 3000 },
      { kind: 'system', id: 'system:memory:/home/me/CLAUDE.md', label: '/home/me/CLAUDE.md', tokens: 2000 },
      { kind: 'toolDefinition', id: 'toolDefinition:Bash', label: 'Bash', tokens: 10000 },
      { kind: 'skill', id: 'skill:do-spec', label: 'do-spec', tokens: 500 },
      { kind: 'oddKind', id: 'odd:1', label: 'Odd', tokens: 100 },
      { kind: 'skill', tokens: 1 },
    ],
    compactions: { count: 0 },
  },
  'ahpd.context': { used: 40000, size: 600000, limit: 1000000, free: 526000, buffer: 33000, deferred: 47000 },
  quotaSnapshots: {
    'weekly:fable': { remainingPercentage: 100, resetDate: '2026-11-08T00:00:00.000Z' },
    weekly: { remainingPercentage: 3, resetDate: '2026-11-05T08:00:00.000Z', overageAllowedWithExhaustedQuota: true, overage: 12, overageEntitlement: 50 },
    session: { remainingPercentage: 68, resetDate: '2026-11-05T02:20:00.000Z' },
  },
  'ahpd.account': { subscriptionType: 'Claude Max', apiProvider: 'firstParty', email: 'never@example.com' },
};

describe('usageMetaOf', () => {
  it('reads the context, the plan windows and the account, and keeps only the plan type and provider', () => {
    const got = usageMetaOf(meta);
    expect(got.context?.total).toBe(40000);
    expect(got.context?.entries).toHaveLength(5);
    expect(got.context?.figures).toEqual({ used: 40000, size: 600000, limit: 1000000, free: 526000, buffer: 33000, deferred: 47000 });
    expect(Object.keys(got.quotas ?? {})).toEqual(['weekly:fable', 'weekly', 'session']);
    expect(got.account).toEqual({ subscriptionType: 'Claude Max', apiProvider: 'firstParty' });
  });

  it('says nothing for a map with no usage keys, and an empty plan for an account with none', () => {
    expect(usageMetaOf({ 'ahpd.model': 'opus' })).toEqual({});
    expect(usageMetaOf(undefined)).toEqual({});
    expect(usageMetaOf({ quotaSnapshots: {} }).quotas).toEqual({});
  });

  it('takes a total and a window alone, as an agent with no breakdown sends them', () => {
    expect(usageMetaOf({ 'ahpd.context': { used: 12000, size: 200000 } }).context).toEqual({ total: 12000, entries: [], figures: { used: 12000, size: 200000 } });
  });
});

describe('sessionUsage', () => {
  it('takes each part from the session over the turn', () => {
    const got = sessionUsage({ quotaSnapshots: { session: { remainingPercentage: 50 } } }, meta);
    expect(got.quotas).toEqual({ session: { remainingPercentage: 50 } });
    expect(got.context?.total).toBe(40000);
  });
});

describe('contextRows', () => {
  it('groups the entries by kind, counts the rest as messages, and puts deferred tools apart', () => {
    const context = usageMetaOf(meta).context!;
    const rows = contextRows(context);
    expect(rows.map((row) => [row.key, row.tokens, row.counts])).toEqual([
      ['system', 5000, true],
      ['toolDefinition', 10000, true],
      ['skill', 500, true],
      ['oddKind', 100, true],
      ['messages', 24400, true],
      ['free', 526000, true],
      ['buffer', 33000, true],
      ['deferred', 47000, false],
    ]);
    expect(rows[0]?.entries.map((one) => one.tokens)).toEqual([3000, 2000]);
    expect(windowOf(context)).toBe(600000);
  });
});

describe('quotaOrder and creditsOf', () => {
  it('orders the session, the week and the named weeks, and finds the credits', () => {
    const quotas = usageMetaOf(meta).quotas!;
    expect(quotaOrder(quotas).map(([key]) => key)).toEqual(['session', 'weekly', 'weekly:fable']);
    expect(creditsOf(quotas)).toEqual({ used: 12, limit: 50 });
    expect(creditsOf({ session: { remainingPercentage: 10 } })).toBeUndefined();
  });
});

describe('paceOf', () => {
  const hour = 60 * 60 * 1000;
  const reset = Date.parse('2026-11-05T05:00:00.000Z');

  it('lasts when the window is used no faster than its time passes', () => {
    // Two hours into five, 30% used.
    expect(paceOf('session', { remainingPercentage: 70, resetDate: new Date(reset).toISOString() }, reset - 3 * hour)).toEqual({ lasts: true });
  });

  it('says when a window used faster than its time runs out', () => {
    // One hour into five, 50% used: the other half goes in another hour.
    const got = paceOf('session', { remainingPercentage: 50, resetDate: new Date(reset).toISOString() }, reset - 4 * hour);
    expect(got).toEqual({ lasts: false, runsOut: reset - 3 * hour });
  });

  it('says nothing for a window of no known length, or with no reset', () => {
    expect(paceOf('monthly', { remainingPercentage: 50, resetDate: new Date(reset).toISOString() }, reset - hour)).toBeUndefined();
    expect(paceOf('session', { remainingPercentage: 50 }, reset - hour)).toBeUndefined();
  });
});
