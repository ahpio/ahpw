import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AgentInfo } from '@microsoft/agent-host-protocol';
import { menuAgents, readAgentChoice, setAgentChoice } from './agent-choice.js';
import { SESSIONS_AGENT } from './state.js';

const agent = (provider: string, displayName: string): AgentInfo => ({ provider, displayName, description: '', models: [] }) as unknown as AgentInfo;

/** A store that only holds what is set on it. */
const store = () => {
  const held = new Map<string, unknown>();
  return { held, set: (path: string, value: unknown) => { held.set(path, value); } };
};

/** A `localStorage` over a map, fresh for each case. */
beforeEach(() => {
  const held = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => held.get(key) ?? null,
    setItem: (key: string, value: string) => { held.set(key, value); },
    removeItem: (key: string) => { held.delete(key); },
  });
});

describe('menuAgents', () => {
  it('lists each provider once over two hosts, by name, named as the first host names it', () => {
    const one = [agent('claude', 'Claude Code'), agent('cofold', 'Cofold')];
    const two = [agent('claude', 'Claude (other)'), agent('amp', 'Amp')];
    expect(menuAgents([one, two], null)).toEqual([
      { provider: 'amp', title: 'Amp' },
      { provider: 'claude', title: 'Claude Code' },
      { provider: 'cofold', title: 'Cofold' },
    ]);
  });

  it('keeps a chosen provider no host lists, named by its id', () => {
    expect(menuAgents([[agent('amp', 'Amp')], undefined], 'gone')).toEqual([
      { provider: 'amp', title: 'Amp' },
      { provider: 'gone', title: 'gone' },
    ]);
  });
});

describe('the kept choice', () => {
  it('comes back after it is set, and clears to every agent', () => {
    const one = store();
    setAgentChoice(one as never, 'cofold');
    expect(one.held.get(SESSIONS_AGENT)).toBe('cofold');
    expect(readAgentChoice()).toBe('cofold');
    setAgentChoice(one as never, null);
    expect(one.held.get(SESSIONS_AGENT)).toBeNull();
    expect(readAgentChoice()).toBeNull();
  });
});
