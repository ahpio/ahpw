import { describe, expect, it } from 'vitest';
import type { SessionModelInfo } from '@microsoft/agent-host-protocol';
import { contextReadout, footerSide } from './footer.js';

const setting = (scope?: string) => ({ key: 'k', schema: { type: 'string' as const, title: 'K', ...(scope === undefined ? {} : { scope }) }, value: undefined });
const model = (maxContextWindow?: number): SessionModelInfo => ({ id: 'opus', provider: 'claude', name: 'Opus', ...(maxContextWindow === undefined ? {} : { maxContextWindow }) } as SessionModelInfo);

describe('footerSide', () => {
  it('puts a chat setting right, and a session setting or one with no scope left', () => {
    expect(footerSide(setting('chat'))).toBe('right');
    expect(footerSide(setting('session'))).toBe('left');
    expect(footerSide(setting())).toBe('left');
  });
});

describe('contextReadout', () => {
  it('says nothing without a context window', () => {
    expect(contextReadout(undefined, undefined)).toBeNull();
    expect(contextReadout(model(), { inputTokens: 10 })).toBeNull();
  });

  it('gives the window alone before a turn', () => {
    expect(contextReadout(model(200000), undefined)?.text).toBe('200k');
  });

  it('gives the last turn\'s input and cache over the window, with the exact counts in the title', () => {
    const got = contextReadout(model(200000), { inputTokens: 9000, cacheReadTokens: 3000 });
    expect(got?.text).toBe('12k / 200k');
    expect(got?.title).toBe('12,000 of 200,000 tokens used, as of the last turn');
  });

  it('takes the session\'s own context over the last turn, against the window it compacts at', () => {
    const context = { total: 40000, entries: [], figures: { used: 40000, size: 600000, limit: 1000000 } };
    const got = contextReadout(model(1000000), { inputTokens: 9000 }, context);
    expect(got?.text).toBe('40k / 600k');
    expect(got?.title).toBe('40,000 of 600,000 tokens in the context window now');
  });

  it('falls back to the model\'s window when the context names none', () => {
    expect(contextReadout(model(200000), undefined, { total: 5000, entries: [] })?.text).toBe('200k');
  });
});
