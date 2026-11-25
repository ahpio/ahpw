import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Scena } from '@softov/scena/types';

const dispatched: unknown[] = [];
vi.mock('../../bridges/data.js', () => ({ hostBridge: () => ({ dispatch: (_channel: string, action: unknown) => dispatched.push(action), readText: async () => ({ text: '{"id":"test.run"}' }) }) }));
const done = vi.fn();
vi.mock('../../shell/notify/index.js', () => ({ done }));
vi.stubGlobal('localStorage', { getItem: () => null, setItem: () => undefined });

const { createScena } = await import('@softov/scena');
const { serveAsTool, setMode } = await import('./registry.js');
const { makeRunner } = await import('./runner.js');
const { sessionLock } = await import('./lock.js');

/** Web Locks as the browser's windows share them: exclusive, queued, with `steal` and `ifAvailable`. */
class Locks {
  private held = new Map<string, { reject: (error: Error) => void }>();
  private queue = new Map<string, (() => void)[]>();
  request(name: string, options: { steal?: boolean; ifAvailable?: boolean; signal?: AbortSignal }, fn: (lock: unknown) => Promise<void>): Promise<void> {
    return new Promise((resolve, reject) => {
      const grant = (): void => {
        if (options.signal?.aborted === true) { this.next(name); return; }
        const me = { reject };
        this.held.set(name, me);
        void fn({ name }).then(resolve, reject).finally(() => {
          if (this.held.get(name) === me) { this.held.delete(name); this.next(name); }
        });
      };
      options.signal?.addEventListener('abort', () => reject(new Error('AbortError')));
      if (options.steal === true) {
        this.held.get(name)?.reject(new Error('AbortError'));
        grant();
      } else if (!this.held.has(name)) grant();
      else if (options.ifAvailable === true) void fn(null).then(resolve, reject);
      else this.queue.set(name, [...(this.queue.get(name) ?? []), grant]);
    });
  }
  private next(name: string): void {
    const [first, ...rest] = this.queue.get(name) ?? [];
    this.queue.set(name, rest);
    first?.();
  }
}

const settle = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 5));
const entry = (id: string, clientId = 'me', toolInput: unknown = '{"id":"test.run"}') => ({ id, kind: 'toolClientExecution', chat: 'ahp-chat:/1', turnId: 't', clientId, toolCall: { toolCallId: id, toolName: 'runCommand', toolInput } }) as never;

let scena: Scena;
let locks: LockManager;
const ran = vi.fn();

beforeEach(() => {
  dispatched.length = 0;
  done.mockReset();
  ran.mockReset();
  scena = createScena();
  locks = new Locks() as unknown as LockManager;
  serveAsTool({ id: 'test.run', order: 0, text: 'Run it.', input: () => ({ type: 'object', properties: {} }) });
  scena.commands.register({ id: 'test.run', title: 'Run it', run: ran });
  setMode(scena, 'test.run', 'run');
});

describe('the runner', () => {
  it('answers a call once, however often the session changes', async () => {
    const runner = makeRunner(scena, locks, 'a', () => 'S');
    runner.update([entry('1')], 'me', true);
    runner.update([entry('1')], 'me', true);
    await settle();
    runner.update([entry('1')], 'me', true);
    await settle();
    expect(ran).toHaveBeenCalledTimes(1);
    expect(dispatched).toMatchObject([{ type: 'chat/toolCallComplete', toolCallId: '1', turnId: 't', result: { success: true } }]);
  });

  it('leaves a call to the holder, and another client\'s call to it', async () => {
    const runner = makeRunner(scena, locks, 'a', () => 'S');
    runner.update([entry('1')], 'me', false);
    runner.update([entry('2', 'vscode')], 'me', true);
    await settle();
    expect(dispatched).toEqual([]);
  });

  it('does not run a call again in a window that takes over while it runs', async () => {
    let finish = (): void => {};
    ran.mockImplementation(() => new Promise<void>((resolve) => { finish = resolve; }));
    const first = makeRunner(scena, locks, 'a', () => 'S');
    const second = makeRunner(scena, locks, 'a', () => 'S');
    first.update([entry('1')], 'me', true);
    await settle();
    first.update([entry('1')], 'me', false);
    second.update([entry('1')], 'me', true);
    await settle();
    finish();
    await settle();
    expect(ran).toHaveBeenCalledTimes(1);
    expect(dispatched).toHaveLength(1);
  });

  it('shows one toast for notify, and none for run', async () => {
    const runner = makeRunner(scena, locks, 'a', () => 'S');
    runner.update([entry('1')], 'me', true);
    await settle();
    expect(done).not.toHaveBeenCalled();
    setMode(scena, 'test.run', 'notify');
    runner.update([entry('2')], 'me', true);
    await settle();
    expect(done).toHaveBeenCalledTimes(1);
    expect(done.mock.calls[0]![1]).toMatchObject({ description: 'S' });
  });

  it('reads an input held by reference, and fails one it cannot read', async () => {
    const runner = makeRunner(scena, locks, 'a', () => 'S');
    runner.update([entry('1', 'me', { uri: 'x:/1' }), entry('2', 'me', 'not json')], 'me', true);
    await settle();
    expect(dispatched).toHaveLength(2);
    expect(dispatched).toEqual(expect.arrayContaining([expect.objectContaining({ toolCallId: '1', result: expect.objectContaining({ success: true }) }), expect.objectContaining({ toolCallId: '2', result: expect.objectContaining({ success: false }) })]));
  });
});

describe('the session lock', () => {
  it('goes to the window focused last, and back when that one closes', async () => {
    const a = sessionLock(locks, 's', () => undefined);
    const b = sessionLock(locks, 's', () => undefined);
    await settle();
    expect([a.holds(), b.holds()]).toEqual([true, false]);
    b.take();
    await settle();
    expect([a.holds(), b.holds()]).toEqual([false, true]);
    b.release();
    await settle();
    expect([a.holds(), b.holds()]).toEqual([true, false]);
  });

  it('is taken back and forth', async () => {
    const a = sessionLock(locks, 's', () => undefined);
    const b = sessionLock(locks, 's', () => undefined);
    for (const [taker, other] of [[b, a], [a, b], [b, a]] as const) {
      taker.take();
      await settle();
      expect([taker.holds(), other.holds()]).toEqual([true, false]);
    }
  });
});
