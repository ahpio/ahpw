/** The browser's locks, or undefined where it has none: they need https or localhost. */
export const browserLocks = (): LockManager | undefined => (typeof navigator === 'undefined' ? undefined : navigator.locks);

/** This window's hold on a session's calls. */
export interface SessionLock {
  holds(): boolean;
  /** Takes the lock from whichever window has it. */
  take(): void;
  release(): void;
}

/**
 * The lock that says which window runs a session's calls. A window waits its
 * turn behind the holder, and takes the lock when a person focuses it. One
 * that lost the lock waits again, so closing the holder hands it on.
 */
export function sessionLock(locks: LockManager, name: string, changed: () => void): SessionLock {
  let held = false;
  let over = false;
  let done: (() => void) | undefined;
  let waiting: AbortController | undefined;
  const ask = (steal: boolean): void => {
    waiting?.abort();
    const asked = new AbortController();
    waiting = asked;
    // `steal` takes no signal: it is granted at once.
    locks.request(name, steal ? { steal: true } : { signal: asked.signal }, () => new Promise<void>((resolve) => {
      if (over || (waiting !== asked && !steal)) {
        resolve();
        return;
      }
      done = resolve;
      held = true;
      changed();
    })).catch(() => {
      // Stolen by another window, or given up here for a newer request.
      if (over || waiting !== asked) return;
      held = false;
      changed();
      ask(false);
    });
  };
  ask(false);
  return {
    holds: () => held,
    take: () => { if (!held && !over) ask(true); },
    release: () => {
      over = true;
      held = false;
      waiting?.abort();
      done?.();
    },
  };
}
