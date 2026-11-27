import type { BindingPath, Scena } from '@softov/scena/types';
import { chatChoice } from '../sessions/view-settings.js';
import { broadcastBus, windowLocks, type WindowLocks } from './window-locks.js';

/** The browser's locks, or undefined where it has none: they need https or localhost. */
export const browserLocks = (): LockManager | undefined => (typeof navigator === 'undefined' ? undefined : navigator.locks);

/** Whether this page is one the browser holds Web Locks back from: plain http, away from `localhost`. */
export const insecurePage = (): boolean => typeof window !== 'undefined' && window.isSecureContext === false;

/**
 * Whether the agent gets this browser's commands on a page with no Web Locks,
 * as `ui.agentToolsWithoutHttps` sets it. Off unless a person turns it on: the
 * windows' own locks can let two windows run one call.
 */
export const WITHOUT_HTTPS = chatChoice('$/agentTools/withoutHttps' as BindingPath, 'ahpw.agentToolsWithoutHttps', ['off', 'on'], 'off');

let shared: WindowLocks | undefined;

/** The windows' own locks, made once for the page and let go as it goes. */
function ownLocks(): WindowLocks {
  if (shared !== undefined) return shared;
  const made = windowLocks(broadcastBus('ahpw.agentTools.locks'));
  window.addEventListener('pagehide', () => made.hide());
  window.addEventListener('pageshow', (event) => { if (event.persisted) made.show(); });
  shared = made;
  return made;
}

/**
 * The locks the agent tools run on: the browser's, or, where it has none and
 * a person turned `ui.agentToolsWithoutHttps` on, the windows' own. Undefined
 * otherwise, and then the page offers the agent nothing.
 */
export function agentLocks(scena: Scena): LockManager | undefined {
  const own = browserLocks();
  if (own !== undefined) return own;
  if (WITHOUT_HTTPS.read(scena.store) !== 'on' || typeof BroadcastChannel === 'undefined') return undefined;
  return ownLocks() as unknown as LockManager;
}

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
