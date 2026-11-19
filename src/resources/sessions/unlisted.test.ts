import { describe, expect, it } from 'vitest';
import type { SessionState } from '@microsoft/agent-host-protocol';
import { unlistedSummary } from './unlisted.js';

describe('unlistedSummary', () => {
  it('reads a session the host does not list from its own state, without its chats or times', () => {
    const state = {
      provider: 'bot-chat',
      title: '',
      status: 1,
      lifecycle: 'ready',
      activeClients: [],
      chats: [{ resource: 'ahp-chat:/one', title: '' }],
      defaultChat: 'ahp-chat:/one',
      _meta: { 'ahpd.bot': { id: 'gumbo' } },
    } as unknown as SessionState;
    const summary = unlistedSummary('ahp-session:/one', state);
    expect(summary).toMatchObject({ resource: 'ahp-session:/one', provider: 'bot-chat', title: '', status: 1, defaultChat: 'ahp-chat:/one', createdAt: '', modifiedAt: '' });
    expect(summary._meta).toEqual({ 'ahpd.bot': { id: 'gumbo' } });
    expect(summary).not.toHaveProperty('lifecycle');
    expect(summary).not.toHaveProperty('chats');
    expect(summary).not.toHaveProperty('activeClients');
  });
});
