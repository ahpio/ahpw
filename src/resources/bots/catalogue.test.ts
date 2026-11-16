import { beforeEach, describe, expect, it, vi } from 'vitest';

const readText = vi.fn();
const request = vi.fn();
vi.mock('../../bridges/data.js', () => ({ hostBridge: () => ({ readText, request }) }));

const { botsReducer, openBotChat, readBotChat, servesBotChats } = await import('./catalogue.js');
import type { BotRecord, BotsState } from './catalogue.js';
import { draftOf, freshLook, parseLabels, recordBody } from './draft.js';

const bot = (id: string, extra: Partial<BotRecord> = {}): BotRecord => ({
  id, name: id, labels: [], body: 'robot', color: 'blue', workspace: `/bots/${id}`, owner: 'user:me',
  createdAt: '2026-10-16T10:00:00Z', updatedAt: '2026-10-16T10:00:00Z', ...extra,
});

describe('botsReducer', () => {
  it('adds and changes a bot in slug order, and removes one by id', () => {
    let state: BotsState = { bots: [bot('b')] };
    state = botsReducer(state, { type: 'x-ahpd-bots/added', bot: bot('a') });
    state = botsReducer(state, { type: 'x-ahpd-bots/changed', bot: bot('b', { name: 'Bee' }) });
    expect(state.bots.map((one) => one.name)).toEqual(['a', 'Bee']);
    state = botsReducer(state, { type: 'x-ahpd-bots/removed', id: 'a' });
    expect(state.bots.map((one) => one.id)).toEqual(['b']);
    expect(botsReducer(state, { type: 'other' } as never)).toBe(state);
  });
});

describe('draft', () => {
  it('splits labels, leaving out blanks and repeats', () => {
    expect(parseLabels(' ops, , ops,docs ')).toEqual(['ops', 'docs']);
  });

  it('gives a new bot the colour the fewest bots have', () => {
    const look = freshLook([bot('a', { color: 'red' }), bot('b', { color: '#d7263d' })], () => 0);
    expect(look).toEqual({ body: 'robot', color: '#f26b0f' });
  });

  it('sends the owner and blank-free fields only on create', () => {
    const fresh = { ...draftOf(undefined, []), name: ' Ana ', labels: 'a, b', owner: 'root:h', color: '#2f6fdf', body: 'ghost' };
    expect(recordBody(fresh, true)).toEqual({ name: 'Ana', labels: ['a', 'b'], body: 'ghost', color: 'blue', owner: 'root:h' });
    const edited = { ...draftOf(bot('a', { description: 'old', instructions: 'Be kind.' }), []), description: '' };
    expect(recordBody(edited, false)).toEqual({ name: 'a', labels: [], body: 'robot', color: 'blue', description: '', instructions: 'Be kind.' });
  });
});

describe('bot chats', () => {
  it('runs them only on a host that lists the bot-chat agent', () => {
    expect(servesBotChats(undefined)).toBe(false);
    expect(servesBotChats([{ provider: 'cofold' }])).toBe(false);
    expect(servesBotChats([{ provider: 'cofold' }, { provider: 'bot-chat' }])).toBe(true);
  });

  it('chats in the bot\'s own session on a host without bot chats, and not at all without one', async () => {
    const offers = { methods: [], described: {}, channels: [], channelWords: {}, providers: {} };
    expect(await readBotChat('h', offers, bot('nimbo', { session: 'cofold:/abc' }), false)).toBe('cofold:/abc');
    expect(await readBotChat('h', offers, bot('nimbo'), false)).toBeNull();
  });

  describe('on a host that runs them', () => {
    const offers = { methods: [], described: {}, channels: [], channelWords: {}, providers: {} };
    beforeEach(() => {
      readText.mockReset();
      request.mockReset().mockResolvedValue({});
    });

    it('opens the talk a read of the bot answers', async () => {
      readText.mockResolvedValue({ text: JSON.stringify({ id: 'telly', session: 'ahp-session:/talk' }) });
      expect(await openBotChat('h', offers, bot('telly'), true)).toBe('ahp-session:/talk');
      expect(readText).toHaveBeenCalledWith('bot://telly');
      expect(request).not.toHaveBeenCalled();
    });

    it('makes a bot-chat session naming the bot for a person with no talk yet', async () => {
      readText.mockResolvedValue({ text: JSON.stringify({ id: 'telly' }) });
      const made = await openBotChat('h', offers, bot('telly'), true);
      expect(made).toMatch(/^ahp-session:\//);
      expect(request).toHaveBeenCalledWith('createSession', { channel: made, provider: 'bot-chat', config: { bot: 'telly' } });
    });
  });
});
