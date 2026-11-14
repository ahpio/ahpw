import { describe, expect, it } from 'vitest';
import { alertLines, countOf, mergedAlerts, summaryReducer, type AlertGroup, type SummaryState } from './summary.js';

const group = (level: AlertGroup['level'], text: string, ...titles: string[]): AlertGroup => ({
  level,
  text,
  count: titles.length,
  rows: titles.map((title) => ({ id: title, title })),
});

describe('the summary', () => {
  it('is replaced whole by each changed action, and kept by any other', () => {
    const before: SummaryState = { areas: { plugins: { channel: 'x-ahpd-plugins://', total: 1, alerts: [group('error', 'Down', 'a')] } } };
    const after = summaryReducer(before, { type: 'x-ahpd-summary/changed', areas: { connectors: { channel: 'x-ahpd-connectors://', total: 0 } } });
    expect(after).toEqual({ areas: { connectors: { channel: 'x-ahpd-connectors://', total: 0 } } });
    expect(summaryReducer(before, { type: 'x-ahpd-summary/other' })).toBe(before);
    expect(summaryReducer(before, { type: 'x-ahpd-summary/changed' })).toBe(before);
  });

  it('merges one alert said on two hosts into one group, worst level first and then the most rows', () => {
    const merged = mergedAlerts([
      { areas: { plugins: { channel: 'x-ahpd-plugins://', total: 2, alerts: [group('warning', 'Slow', 'a'), group('error', 'Down', 'b')] } } },
      { areas: { plugins: { channel: 'x-ahpd-plugins://', total: 1, alerts: [group('warning', 'Slow', 'c')] }, clients: { channel: 'x-ahpd-clients://', total: 4 } } },
      undefined,
    ]);
    expect(merged.get('plugins')).toEqual([group('error', 'Down', 'b'), group('warning', 'Slow', 'a', 'c')]);
    // An area with no alerts is still an area, with no groups.
    expect(merged.get('clients')).toEqual([]);
    expect(countOf(merged.get('plugins') ?? [], 'warning')).toBe(2);
  });

  it('says each group as one line: its mark, its text, and up to three rows', () => {
    expect(alertLines([group('error', 'Down', 'badge-demo'), group('warning', 'Probe failed', 'a', 'b', 'c', 'd', 'e')])).toEqual([
      '✖ Down: badge-demo',
      '⚠ Probe failed: a, b, c +2',
    ]);
  });
});
