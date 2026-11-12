import { describe, expect, it } from 'vitest';
import type { SessionSummary } from '@microsoft/agent-host-protocol';
import { sessionActs } from './acts.js';

type Item = { title: string; group?: string };

const session = (status: number): SessionSummary => ({ resource: 'session:1', title: 'One', status } as unknown as SessionSummary);
const titles = (status: number, pinned = false): string[] => sessionActs('host', session(status), { pinned, pin: () => undefined }).map((act) => (act as Item).title);

describe('sessionActs', () => {
  it('offers pin, rename, mark read, archive, copy link and delete', () => {
    expect(titles(1)).toHaveLength(6);
  });

  it('names the act that turns each flag the other way', () => {
    const unread = titles(1);
    const read = titles(1 | 32);
    expect(unread[2]).not.toBe(read[2]);
    const archived = titles(1 | 64);
    expect(unread[3]).not.toBe(archived[3]);
    expect(titles(1, true)[0]).not.toBe(unread[0]);
  });

  it('puts copy link and delete under More', () => {
    const groups = sessionActs('host', session(1), { pinned: false, pin: () => undefined }).map((act) => (act as Item).group);
    expect(groups).toEqual([undefined, undefined, undefined, undefined, 'more', 'more']);
  });
});
