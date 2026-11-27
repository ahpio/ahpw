import { describe, expect, it, vi } from 'vitest';
import type { Scena } from '@softov/scena/types';

const held = new Map<string, string>();
vi.stubGlobal('localStorage', { getItem: (key: string) => held.get(key) ?? null, setItem: (key: string, value: string) => { held.set(key, value); } });

const { windowLocks } = await import('./window-locks.js');
const { sessionLock } = await import('./lock.js');
type Bus = import('./window-locks.js').Bus;
type Said = import('./window-locks.js').Said;

/** One browser's channel: what one window posts, every other hears a moment later, as a `BroadcastChannel` delivers. */
function channel(): () => Bus {
  const ears = new Set<{ heard: (said: Said) => void }>();
  return () => {
    const ear = { heard: (_said: Said): void => undefined };
    return {
      post: (said) => { for (const one of ears) if (one !== ear) setTimeout(() => one.heard(said), 0); },
      listen: (heard) => {
        ear.heard = heard;
        ears.add(ear);
        return () => ears.delete(ear);
      },
    };
  };
}

const settle = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 10));
const asLocks = (locks: unknown): LockManager => locks as LockManager;

describe('the windows\' own locks', () => {
  it('give a session to one window, hand it to the one focused, and back when that one closes', async () => {
    const bus = channel();
    const one = windowLocks(bus(), 'one');
    await settle();
    const two = windowLocks(bus(), 'two');
    await settle();
    const a = sessionLock(asLocks(one), 's', () => undefined);
    await settle();
    const b = sessionLock(asLocks(two), 's', () => undefined);
    await settle();
    expect([a.holds(), b.holds()]).toEqual([true, false]);
    b.take();
    await settle();
    expect([a.holds(), b.holds()]).toEqual([false, true]);
    b.release();
    await settle();
    expect([a.holds(), b.holds()]).toEqual([true, false]);
  });

  it('answer a call\'s lock held in another window with nothing', async () => {
    const bus = channel();
    const one = windowLocks(bus(), 'one');
    const two = windowLocks(bus(), 'two');
    await settle();
    let release = (): void => undefined;
    void one.request('call', { ifAvailable: true }, () => new Promise<void>((resolve) => { release = resolve; }));
    await settle();
    const got = vi.fn();
    await two.request('call', { ifAvailable: true }, async (lock) => { got(lock); });
    expect(got).toHaveBeenCalledWith(null);
    release();
    await settle();
    await two.request('call', { ifAvailable: true }, async (lock) => { got(lock); });
    expect(got).toHaveBeenLastCalledWith(expect.objectContaining({ name: 'call' }));
  });

  it('tell a window that opens later what is held', async () => {
    const bus = channel();
    const one = windowLocks(bus(), 'one');
    void one.request('s', () => new Promise<void>(() => undefined));
    await settle();
    const two = windowLocks(bus(), 'two');
    await settle();
    const got = vi.fn();
    await two.request('s', { ifAvailable: true }, async (lock) => { got(lock); });
    expect(got).toHaveBeenCalledWith(null);
  });

  it('let a waiting window have the lock when the holder\'s page goes', async () => {
    const bus = channel();
    const one = windowLocks(bus(), 'one');
    const two = windowLocks(bus(), 'two');
    await settle();
    // Lost once the other window takes it, as a stolen Web Lock is.
    const lost = one.request('s', () => new Promise<void>(() => undefined)).catch((error: Error) => error.name);
    await settle();
    const got = vi.fn();
    void two.request('s', async () => { got(); });
    await settle();
    expect(got).not.toHaveBeenCalled();
    one.hide();
    await settle();
    expect(got).toHaveBeenCalled();
    await expect(lost).resolves.toBe('AbortError');
  });

  it('reject a request whose signal aborts while it waits, and grant the next', async () => {
    const locks = windowLocks(channel()(), 'one');
    let release = (): void => undefined;
    void locks.request('s', () => new Promise<void>((resolve) => { release = resolve; }));
    const asked = new AbortController();
    const waiting = locks.request('s', { signal: asked.signal }, async () => 'first');
    const after = locks.request('s', async () => 'second');
    asked.abort();
    await expect(waiting).rejects.toThrow('aborted');
    release();
    await expect(after).resolves.toBe('second');
  });
});

describe('agentLocks', () => {
  it('is nothing on a page with no Web Locks until the setting is on', async () => {
    vi.stubGlobal('navigator', {});
    vi.stubGlobal('window', { isSecureContext: false, addEventListener: () => undefined });
    vi.stubGlobal('BroadcastChannel', class { postMessage(): void {} addEventListener(): void {} removeEventListener(): void {} close(): void {} });
    const { createScena } = await import('@softov/scena');
    const { agentLocks, insecurePage, WITHOUT_HTTPS } = await import('./lock.js');
    const { toolSettings } = await import('./registry.js');
    const scena: Scena = createScena();
    expect(insecurePage()).toBe(true);
    expect(toolSettings()[0]?.key).toBe('ui.agentToolsWithoutHttps');
    expect(agentLocks(scena)).toBeUndefined();
    WITHOUT_HTTPS.set(scena.store, 'on');
    expect(agentLocks(scena)).toBeDefined();
    expect(held.get('ahpw.agentToolsWithoutHttps')).toBe('on');
    vi.unstubAllGlobals();
  });
});
