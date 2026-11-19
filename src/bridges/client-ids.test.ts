import { afterEach, describe, expect, it, vi } from 'vitest';
import { localClientIds } from './client-ids.js';

/** `ahpw-` and a UUID. */
const AHPW_ID = /^ahpw-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

/** A `localStorage` over `held`. */
const storage = (held: Map<string, string>): void => {
  vi.stubGlobal('localStorage', { getItem: (key: string) => held.get(key) ?? null, setItem: (key: string, value: string) => { held.set(key, value); } });
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('the client id a host keeps', () => {
  it('is a new ahpw- id where none is kept, and the kept one after it is stored, per host', async () => {
    const held = new Map<string, string>();
    storage(held);
    const made = await localClientIds.load('daemon');
    expect(made).toMatch(AHPW_ID);
    await localClientIds.store('daemon', made as string);
    expect(await localClientIds.load('daemon')).toBe(made);
    expect(held.get('ahpw.clientId.daemon')).toBe(made);
    expect(await localClientIds.load('other')).not.toBe(made);
  });

  it('replaces a kept id of another form, as a bare UUID, with a new ahpw- id', async () => {
    const held = new Map([['ahpw.clientId.daemon', '46dd81c5-fba5-4e65-a1a2-9db658fac153']]);
    storage(held);
    expect(await localClientIds.load('daemon')).toMatch(AHPW_ID);
  });

  it('is a new ahpw- id, and no error, where storage throws', async () => {
    const refuse = (): never => { throw new Error('blocked'); };
    vi.stubGlobal('localStorage', { getItem: refuse, setItem: refuse });
    await expect(localClientIds.store('daemon', 'c1')).resolves.toBeUndefined();
    expect(await localClientIds.load('daemon')).toMatch(AHPW_ID);
  });
});
