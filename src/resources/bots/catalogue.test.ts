import { beforeEach, describe, expect, it, vi } from 'vitest';

const readText = vi.fn();
const request = vi.fn();
const writeResource = vi.fn();
const writeText = vi.fn();
const deleteResource = vi.fn();
vi.mock('../../bridges/data.js', () => ({ hostBridge: () => ({ readText, request, writeResource, writeText, deleteResource }) }));

const { botsIn, botsReducer, deleteBot, editBot, makeBot, mayChangeBots, openBotChat, readBotChat, sendsTalks, servesBotChats } = await import('./catalogue.js');
import type { BotRecord, BotsState } from './catalogue.js';
import { draftOf, freshLook, parseLabels, recordBody } from './draft.js';
import { NO_OFFERS } from '../../bridges/offers.js';

const bot = (id: string, extra: Partial<BotRecord> = {}): BotRecord => ({
  id, name: id, labels: [], body: 'robot', color: 'blue', workspace: `/bots/${id}`, owner: 'user:me',
  createdAt: '2026-10-16T10:00:00Z', updatedAt: '2026-10-16T10:00:00Z', ...extra,
});

describe('botsReducer', () => {
  it('adds and changes a bot in slug order, and removes one by id', () => {
    let state: BotsState = { bots: [bot('b')] };
    state = botsReducer(state, { type: 'x-ahpd-bots/added', bot: bot('a') });
    state = botsReducer(state, { type: 'x-ahpd-bots/changed', bot: bot('b', { name: 'Bee' }) });
    expect(botsIn(state).map((one) => one.name)).toEqual(['a', 'Bee']);
    state = botsReducer(state, { type: 'x-ahpd-bots/removed', id: 'a' });
    expect(botsIn(state).map((one) => one.id)).toEqual(['b']);
    expect(botsReducer(state, { type: 'other' } as never)).toBe(state);
    expect(sendsTalks(state)).toBe(false);
  });

  it('reads the records shape a host sends, and keeps that it carries each reader\'s talk', () => {
    const { id: _id, ...rest } = bot('b');
    let state: BotsState = { records: [{ id: 'b', record: { ...rest, session: 'ahp-session:/mine' } }] };
    expect(botsIn(state)).toEqual([{ ...bot('b'), session: 'ahp-session:/mine' }]);
    expect(sendsTalks(state)).toBe(true);
    state = botsReducer(state, { type: 'x-ahpd-bots/added', id: 'a', record: rest });
    state = botsReducer(state, { type: 'x-ahpd-bots/changed', id: 'b', record: { ...rest, name: 'Bee' } });
    expect(botsIn(state).map((one) => `${one.id} ${one.name}`)).toEqual(['a b', 'b Bee']);
    expect(sendsTalks(state)).toBe(true);
    expect(botsIn(undefined)).toEqual([]);
  });
});

describe('writes', () => {
  const served = { methods: ['x-ahpd/bots/put', 'x-ahpd/bots/remove'], described: {}, channels: [], channelWords: {}, providers: {} };
  const bare = { ...served, methods: [] };
  beforeEach(() => {
    for (const one of [request, writeResource, writeText, deleteResource]) one.mockReset().mockResolvedValue({});
  });

  it('makes, edits and deletes a bot by command where the host lists them', async () => {
    expect(await makeBot('h', served, ['ana'], { name: 'Ana' })).toBe('ana');
    await editBot('h', served, bot('ana'), { name: 'Ana 2' });
    await deleteBot('h', served, 'ana');
    expect(request.mock.calls).toEqual([
      ['x-ahpd/bots/put', { id: 'ana', record: { name: 'Ana' }, createOnly: true }],
      ['x-ahpd/bots/put', { id: 'ana', record: { name: 'Ana 2' }, ifMatch: '2026-10-16T10:00:00Z' }],
      ['x-ahpd/bots/remove', { id: 'ana' }],
    ]);
    expect(writeResource).not.toHaveBeenCalled();
  });

  it('writes a bot as a resource on a host without the commands', async () => {
    await makeBot('h', bare, ['ana'], { name: 'Ana' });
    await editBot('h', bare, bot('ana'), { name: 'Ana 2' });
    await deleteBot('h', bare, 'ana');
    expect(writeResource).toHaveBeenCalledWith('bot://ana', JSON.stringify({ name: 'Ana' }), 'utf-8', true);
    expect(writeText).toHaveBeenCalledWith('bot://ana', JSON.stringify({ name: 'Ana 2' }), '2026-10-16T10:00:00Z');
    expect(deleteResource).toHaveBeenCalledWith('bot://ana', false);
    expect(request).not.toHaveBeenCalled();
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

    it('opens the talk the catalogue carries, with no read', async () => {
      expect(await openBotChat('h', offers, bot('telly', { session: 'ahp-session:/mine' }), true, true)).toBe('ahp-session:/mine');
      expect(readText).not.toHaveBeenCalled();
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

describe('mayChangeBots', () => {
  const commands = { ...NO_OFFERS, methods: ['x-ahpd/bots/put', 'x-ahpd/bots/remove'] };
  const writes = { ...NO_OFFERS, providers: { bot: { title: '', root: 'bot://', operations: ['list', 'read', 'write'] } } };

  it('asks for a host that takes the change and for its grant', () => {
    expect(mayChangeBots(commands, ['bot:put'], 'put')).toBe(true);
    expect(mayChangeBots(commands, ['bot:put'], 'delete')).toBe(false);
    expect(mayChangeBots(commands, ['bot:read'], 'put')).toBe(false);
    expect(mayChangeBots(commands, null, 'delete')).toBe(true);
    // A host without the commands takes what its provider writes.
    expect(mayChangeBots(writes, null, 'put')).toBe(true);
    expect(mayChangeBots(writes, null, 'delete')).toBe(false);
    expect(mayChangeBots(NO_OFFERS, null, 'put')).toBe(false);
  });
});
