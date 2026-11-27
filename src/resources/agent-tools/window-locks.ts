/**
 * Locks for a page the browser gives no `navigator.locks`: one on plain http
 * away from `localhost`.
 *
 * Each window keeps the locks it holds, and tells the others over a channel
 * when it takes one and when it lets one go. That is enough to say which
 * window runs a session's calls, and to hand that on when a person focuses
 * another. It is not atomic, as Web Locks are: two windows that take one lock
 * at the same moment both think they have it until each hears the other, so a
 * call that arrives right then can run in both. Off unless a person turns it
 * on, for that reason.
 */

/** What windows of one browser tell each other. */
export type Said =
  /** Took the lock, from whoever held it. */
  | { kind: 'take'; name: string; by: string }
  | { kind: 'free'; name: string; by: string }
  /** A window that just opened asks what is held. */
  | { kind: 'who'; by: string }
  | { kind: 'held'; name: string; by: string };

/** How the windows reach each other: a `BroadcastChannel`, or a stand-in in a test. */
export interface Bus {
  post(said: Said): void;
  listen(heard: (said: Said) => void): () => void;
}

/** A bus on a `BroadcastChannel`, which a page on plain http has. */
export function broadcastBus(name: string): Bus {
  const channel = new BroadcastChannel(name);
  return {
    post: (said) => channel.postMessage(said),
    listen: (heard) => {
      const on = (event: MessageEvent): void => heard(event.data as Said);
      channel.addEventListener('message', on);
      return () => {
        channel.removeEventListener('message', on);
        channel.close();
      };
    },
  };
}

/** The part of `LockManager` the agent tools use, and how to let every lock go. */
export interface WindowLocks {
  request: LockManager['request'];
  /** Tells the other windows this one's locks are free, as the page goes away. */
  hide(): void;
  /** Takes them back, as a page the browser kept comes back. */
  show(): void;
  dispose(): void;
}

const aborted = (): Error => new DOMException('The lock request was aborted.', 'AbortError');

/** This window's locks, shared with the other windows on `bus`; `me` names this window. */
export function windowLocks(bus: Bus, me: string = crypto.randomUUID()): WindowLocks {
  /** The locks this window holds, and how to tell each holder it lost it. */
  const mine = new Map<string, { lost: () => void }>();
  /** The locks another window holds, by the window. */
  const theirs = new Map<string, string>();
  const queue = new Map<string, (() => void)[]>();
  const busy = (name: string): boolean => mine.has(name) || theirs.has(name);

  const next = (name: string): void => {
    if (busy(name)) return;
    const [first, ...rest] = queue.get(name) ?? [];
    if (rest.length === 0) queue.delete(name);
    else queue.set(name, rest);
    first?.();
  };

  const request = ((name: string, ...rest: unknown[]): Promise<unknown> => {
    const fn = rest[rest.length - 1] as (lock: Lock | null) => unknown;
    const options = (rest.length > 1 ? rest[0] : {}) as LockOptions;
    return new Promise((resolve, reject) => {
      const grant = (): void => {
        if (options.signal?.aborted === true) {
          next(name);
          return;
        }
        const held = { lost: () => reject(aborted()) };
        mine.set(name, held);
        theirs.delete(name);
        bus.post({ kind: 'take', name, by: me });
        void Promise.resolve().then(() => fn({ name, mode: 'exclusive' } as Lock)).then(resolve, reject).finally(() => {
          if (mine.get(name) !== held) return;
          mine.delete(name);
          bus.post({ kind: 'free', name, by: me });
          next(name);
        });
      };
      options.signal?.addEventListener('abort', () => {
        const waiting = queue.get(name);
        if (waiting !== undefined) queue.set(name, waiting.filter((one) => one !== grant));
        reject(aborted());
      });
      if (options.steal === true) {
        const held = mine.get(name);
        mine.delete(name);
        held?.lost();
        grant();
      } else if (!busy(name)) grant();
      else if (options.ifAvailable === true) void Promise.resolve().then(() => fn(null)).then(resolve, reject);
      else queue.set(name, [...(queue.get(name) ?? []), grant]);
    });
  }) as LockManager['request'];

  const stop = bus.listen((said) => {
    if (said.by === me) return;
    if (said.kind === 'who') {
      for (const name of mine.keys()) bus.post({ kind: 'held', name, by: me });
      return;
    }
    if (said.kind === 'take') {
      const held = mine.get(said.name);
      mine.delete(said.name);
      theirs.set(said.name, said.by);
      held?.lost();
      return;
    }
    if (said.kind === 'held') {
      if (!mine.has(said.name)) theirs.set(said.name, said.by);
      return;
    }
    if (theirs.get(said.name) === said.by) {
      theirs.delete(said.name);
      next(said.name);
    }
  });
  bus.post({ kind: 'who', by: me });

  return {
    request,
    hide: () => { for (const name of mine.keys()) bus.post({ kind: 'free', name, by: me }); },
    show: () => { for (const name of mine.keys()) bus.post({ kind: 'take', name, by: me }); },
    dispose: () => {
      for (const name of mine.keys()) bus.post({ kind: 'free', name, by: me });
      stop();
    },
  };
}
