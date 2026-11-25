import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createScena } from '@softov/scena/core';
import type { Scena } from '@softov/scena/types';

const request = vi.hoisted(() => vi.fn());

vi.mock('./data.js', async (original) => ({ ...await original<typeof import('./data.js')>(), hostBridge: () => ({ request }) }));

const { ahpPaths, windowHost } = await import('./data.js');
const { ME, grantsHeld, profileOf, readMe, trackMe } = await import('./me.js');
const { NO_OFFERS } = await import('./offers.js');
const { mayDelete, mayPut, trackMayPut } = await import('./own-grants.js');
const { mayOpen, trackServed } = await import('./served.js');

const as = (principal?: string) => ({ ...NO_OFFERS, methods: [ME], ...(principal === undefined ? {} : { principal }) });
const ANA = { principal: 'user:ana', kind: 'user', id: 'ana', roles: ['ops'], rolesFromSignIn: ['ops'], grants: ['plugin:read'], pools: ['user:ana'] } as const;
const ROOT = { principal: 'root:dev', kind: 'root', roles: [], rolesFromSignIn: [], grants: ['*:*'], pools: ['root:dev'] } as const;
const me = (one: unknown) => one as Awaited<ReturnType<typeof readMe>>;
const settled = (): Promise<void> => new Promise((resolve) => { setTimeout(resolve, 0); });

beforeEach(() => {
  request.mockReset();
});

describe('readMe', () => {
  it('answers a person, and the host itself', async () => {
    request.mockResolvedValueOnce(ANA).mockResolvedValueOnce(ROOT);
    await expect(readMe('h')).resolves.toEqual(ANA);
    await expect(readMe('h')).resolves.toEqual(ROOT);
    expect(request).toHaveBeenCalledWith(ME, {});
  });

  it('throws the refusal, and refuses an answer that is no connection', async () => {
    request.mockRejectedValueOnce(new Error('nobody')).mockResolvedValueOnce({});
    await expect(readMe('h')).rejects.toThrow('nobody');
    await expect(readMe('h')).rejects.toThrow('answered no connection');
  });
});

describe('profileOf', () => {
  it('is a person or the host itself, on a host that answers who it is', () => {
    expect(profileOf(as('user:ana'))).toEqual({ kind: 'user', id: 'ana' });
    expect(profileOf(as('root:dev'))).toEqual({ kind: 'root', id: 'dev' });
    expect(profileOf(as('plugin:x'))).toBeUndefined();
    expect(profileOf(as())).toBeUndefined();
    expect(profileOf({ ...as('user:ana'), methods: [] })).toBeUndefined();
  });
});

describe('grantsHeld', () => {
  const offers = { ...as('user:ana'), catalog: { plugin: { title: 'Plugins', description: '', operations: ['list', 'install'], groups: { read: ['list'], write: ['install'] } } } };

  it('spells out the operations of a group', () => {
    expect(grantsHeld(offers, me(ANA))).toEqual(['plugin:read', 'plugin:list']);
  });

  it('holds nothing back for the host itself or with no answer, and everything while it is asked', () => {
    expect(grantsHeld(as('root:dev'), undefined)).toBeNull();
    expect(grantsHeld(offers, null)).toBeNull();
    expect(grantsHeld(offers, undefined)).toEqual([]);
  });

  it('opens a channel by its grant, its group, or the second grant', () => {
    const gated = { ...offers, channelGrants: { 'x-ahpd-plugins': 'plugin:list', 'x-ahpd-connectors': 'connector:list' } };
    expect(mayOpen(gated, me(ANA), 'x-ahpd-plugins', [])).toBe(true);
    expect(mayOpen(gated, me(ANA), 'x-ahpd-connectors', ['connector:all'])).toBe(false);
    expect(mayOpen(gated, me({ ...ANA, grants: ['connector:all'] }), 'x-ahpd-connectors', ['connector:all'])).toBe(true);
    expect(mayOpen(offers, me(ANA), 'x-ahpd-connectors', [])).toBe(true);
  });
});

describe('trackMe', () => {
  let scena: Scena;
  const path = ahpPaths(windowHost());
  const SERVED = '$/test/served' as Parameters<typeof trackServed>[2];
  beforeEach(() => { scena = createScena(); });

  it('asks at each handshake, keeps the last answer for the same person, and drops it for another', async () => {
    request.mockResolvedValue(ANA);
    const tracking = trackMe(scena);
    scena.store.set(path.offers, as('user:ana'));
    await settled();
    expect(scena.store.get(path.me)).toEqual(ANA);
    request.mockReturnValue(new Promise(() => undefined));
    scena.store.set(path.offers, as('user:ana'));
    await settled();
    expect(scena.store.get(path.me)).toEqual(ANA);
    scena.store.set(path.offers, as('user:bo'));
    await settled();
    expect(scena.store.get(path.me)).toBeUndefined();
    expect(request).toHaveBeenCalledTimes(3);
    tracking.dispose();
  });

  it('is null for a refusal and for a host that does not serve it', async () => {
    request.mockRejectedValue(new Error('no'));
    trackMe(scena);
    scena.store.set(path.offers, as('user:ana'));
    await settled();
    expect(scena.store.get(path.me)).toBeNull();
    scena.store.set(path.offers, { ...as('user:ana'), methods: [] });
    await settled();
    expect(scena.store.get(path.me)).toBeNull();
  });

  it('shows an entry once the reader is known to hold its grant', async () => {
    request.mockResolvedValue({ ...ANA, grants: ['plugin:list'] });
    trackMe(scena);
    trackServed(scena, 'x-ahpd-plugins', SERVED, []);
    scena.store.set(path.offers, { ...as('user:ana'), channels: ['x-ahpd-plugins'], channelGrants: { 'x-ahpd-plugins': 'plugin:list' } });
    expect(scena.store.get(SERVED)).toBe(false);
    await settled();
    expect(scena.store.get(SERVED)).toBe(true);
  });
});

describe('mayPut and mayDelete', () => {
  const provider = (root: string, operations = ['list', 'read', 'put', 'delete']) => ({ title: '', root, operations });
  const subject = { title: '', description: '', operations: ['list', 'put', 'delete'], groups: { read: ['list'], write: ['put', 'delete'] } };
  const offers = {
    ...as('user:ana'),
    providers: { role: provider('role://'), team: provider('team://', ['list', 'read']), policy: provider('policy://') },
    catalog: { role: subject, team: subject, policy: subject },
  };

  it('asks for the grant of the record and for a host that takes writes', () => {
    expect(mayPut(offers, ['role:put'], 'roles')).toBe(true);
    expect(mayDelete(offers, ['role:put'], 'roles')).toBe(false);
    expect(mayPut(offers, ['role:read'], 'roles')).toBe(false);
    expect(mayPut(offers, ['policy:put'], 'policies')).toBe(true);
    expect(mayDelete(offers, null, 'policies')).toBe(true);
    // The host takes no writes to its teams, whoever asks.
    expect(mayPut(offers, null, 'teams')).toBe(false);
  });

  it('offers a New control once the reader is known to hold its grant, and takes it back', async () => {
    const MAY = '$/test/may' as Parameters<typeof trackMayPut>[2];
    const scena = createScena();
    const path = ahpPaths(windowHost());
    request.mockResolvedValue({ ...ANA, grants: ['role:write'] });
    trackMe(scena);
    trackMayPut(scena, 'roles', MAY);
    scena.store.set(path.offers, offers);
    expect(scena.store.get(MAY)).toBe(false);
    await settled();
    expect(scena.store.get(MAY)).toBe(true);
    request.mockResolvedValue({ ...ANA, grants: ['role:read'] });
    scena.store.set(path.offers, { ...offers });
    await settled();
    expect(scena.store.get(MAY)).toBe(false);
  });
});
