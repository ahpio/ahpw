import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Scena } from '@softov/scena/types';

const dispatched: unknown[] = [];
vi.mock('../../bridges/data.js', () => ({ hostBridge: () => ({ dispatch: (_channel: string, action: unknown) => dispatched.push(action), readText: async () => ({ text: '{"id":"test.run"}' }) }) }));
const done = vi.fn();
const published = vi.fn();
const dismissed = vi.fn();
vi.mock('../../shell/notify/index.js', () => ({ done, tryNotify: (fn: (n: unknown) => void) => fn({ publish: published, dismiss: dismissed }) }));
vi.stubGlobal('localStorage', { getItem: () => null, setItem: () => undefined });

const { createScena } = await import('@softov/scena');
const { serveAsTool, modeOf, setMode } = await import('./registry.js');
const { makeRunner } = await import('./runner.js');
const { askAt, askKey } = await import('./asks.js');
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
const view = { chat: 'ahp-chat:/1' };
const place = { resource: 'ahp-session:/1', title: () => 'S', inView: (chat: string) => chat === view.chat, show: vi.fn() };
const askOf = (id: string) => askAt(askKey('a', 'ahp-chat:/1', id));

beforeEach(() => {
  dispatched.length = 0;
  done.mockReset();
  published.mockReset();
  dismissed.mockReset();
  view.chat = 'ahp-chat:/1';
  ran.mockReset();
  scena = createScena();
  locks = new Locks() as unknown as LockManager;
  serveAsTool({ id: 'test.run', order: 0, text: 'Run it.', input: () => ({ type: 'object', properties: {} }) });
  scena.commands.register({ id: 'test.run', title: 'Run it', run: ran });
  setMode(scena, 'test.run', 'run');
});

describe('the runner', () => {
  it('answers a call once, however often the session changes', async () => {
    const runner = makeRunner(scena, locks, 'a', place);
    runner.update([entry('1')], 'me', true);
    runner.update([entry('1')], 'me', true);
    await settle();
    runner.update([entry('1')], 'me', true);
    await settle();
    expect(ran).toHaveBeenCalledTimes(1);
    expect(dispatched).toMatchObject([{ type: 'chat/toolCallComplete', toolCallId: '1', turnId: 't', result: { success: true } }]);
  });

  it('leaves a call to the holder, and another client\'s call to it', async () => {
    const runner = makeRunner(scena, locks, 'a', place);
    runner.update([entry('1')], 'me', false);
    runner.update([entry('2', 'vscode')], 'me', true);
    await settle();
    expect(dispatched).toEqual([]);
  });

  it('does not run a call again in a window that takes over while it runs', async () => {
    let finish = (): void => {};
    ran.mockImplementation(() => new Promise<void>((resolve) => { finish = resolve; }));
    const first = makeRunner(scena, locks, 'a', place);
    const second = makeRunner(scena, locks, 'a', place);
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
    const runner = makeRunner(scena, locks, 'a', place);
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
    const runner = makeRunner(scena, locks, 'a', place);
    runner.update([entry('1', 'me', { uri: 'x:/1' }), entry('2', 'me', 'not json')], 'me', true);
    await settle();
    expect(dispatched).toHaveLength(2);
    expect(dispatched).toEqual(expect.arrayContaining([expect.objectContaining({ toolCallId: '1', result: expect.objectContaining({ success: true }) }), expect.objectContaining({ toolCallId: '2', result: expect.objectContaining({ success: false }) })]));
  });
});

describe('a command set to ask', () => {
  beforeEach(() => setMode(scena, 'test.run', 'ask'));

  it('runs nothing until Allow, then runs once and says so', async () => {
    const runner = makeRunner(scena, locks, 'a', place);
    runner.update([entry('1')], 'me', true);
    await settle();
    expect([ran.mock.calls.length, dispatched.length, published.mock.calls.length]).toEqual([0, 0, 0]);
    askOf('1')!.answer(true);
    expect(askOf('1')).toBeUndefined();
    runner.update([entry('1')], 'me', true);
    await settle();
    expect(ran).toHaveBeenCalledTimes(1);
    expect(dispatched).toMatchObject([{ type: 'chat/toolCallComplete', toolCallId: '1', result: { success: true } }]);
    expect(done).toHaveBeenCalledTimes(1);
    runner.release();
  });

  it('answers Deny with one failure that says so, and runs nothing', async () => {
    const runner = makeRunner(scena, locks, 'a', place);
    runner.update([entry('1')], 'me', true);
    askOf('1')!.answer(false);
    await settle();
    expect(ran).not.toHaveBeenCalled();
    expect(dispatched).toMatchObject([{ result: { success: false, error: { message: 'The user denied it.' } } }]);
    runner.release();
  });

  it('runs every waiting call of the command on Always allow, and asks no more', async () => {
    const runner = makeRunner(scena, locks, 'a', place);
    runner.update([entry('1'), entry('2')], 'me', true);
    askOf('1')!.always();
    expect([modeOf(scena, 'test.run'), askOf('1'), askOf('2')]).toEqual(['notify', undefined, undefined]);
    runner.update([entry('1'), entry('2'), entry('3')], 'me', true);
    await settle();
    expect(askOf('3')).toBeUndefined();
    expect(ran).toHaveBeenCalledTimes(3);
    runner.release();
  });

  it('is taken away when the host drops the call, or the page goes', async () => {
    const runner = makeRunner(scena, locks, 'a', place);
    runner.update([entry('1'), entry('2')], 'me', true);
    expect([askOf('1'), askOf('2')].every((one) => one !== undefined)).toBe(true);
    runner.update([entry('2')], 'me', true);
    expect(askOf('1')).toBeUndefined();
    runner.release();
    expect(askOf('2')).toBeUndefined();
    expect(dispatched).toEqual([]);
  });

  it('asks in a window that does not run the calls, and runs there once', async () => {
    const first = makeRunner(scena, locks, 'a', place);
    first.update([entry('1')], 'me', true);
    const one = askOf('1')!;
    const second = makeRunner(scena, locks, 'a', place);
    second.update([entry('1')], 'me', false);
    const other = askOf('1')!;
    expect(other).not.toBe(one);
    other.answer(true);
    one.answer(true);
    await settle();
    expect(ran).toHaveBeenCalledTimes(1);
    expect(dispatched).toHaveLength(1);
    first.release();
    second.release();
  });

  it('shows one toast out of view, from the window that runs the calls, and takes it away', async () => {
    view.chat = 'ahp-chat:/other';
    const runner = makeRunner(scena, locks, 'a', place);
    runner.update([entry('1')], 'me', false);
    expect(published).not.toHaveBeenCalled();
    runner.update([entry('1')], 'me', true);
    runner.update([entry('1')], 'me', true);
    expect(published).toHaveBeenCalledTimes(1);
    expect(published.mock.calls[0]![0]).toMatchObject({ dismissAuto: false, description: 'S' });
    runner.update([], 'me', true);
    expect(dismissed).toHaveBeenCalledWith(published.mock.calls[0]![0].id);
  });

  it('asks for an input held by reference', async () => {
    const runner = makeRunner(scena, locks, 'a', place);
    runner.update([entry('1', 'me', { uri: 'x:/1' })], 'me', true);
    await settle();
    expect(askOf('1')).toBeDefined();
    expect(ran).not.toHaveBeenCalled();
    runner.release();
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
