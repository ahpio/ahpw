import { useEffect, useRef, useSyncExternalStore } from 'react';
import type { SessionState } from '@microsoft/agent-host-protocol';
import { useScena, useStore } from '@softov/scena/react';
import { ahpPaths, hostBridge } from '../../bridges/data.js';
import { announcement } from './announce.js';
import { agentLocks, sessionLock, WITHOUT_HTTPS, type SessionLock } from './lock.js';
import { makeRunner, type Runner } from './runner.js';
import { marksOn, modesNow, watchModes } from './registry.js';

/** The session page, as a waiting call needs it. */
export interface AskView {
  /** The chat it shows. */
  chat: string | undefined;
  /** Whether the page is drawn, and not in a tab behind another. */
  drawn(): boolean;
  show(chat: string): void;
}

/** Gives an open session this browser's tools, and runs the calls it gets. */
export function useAgentTools(host: string, resource: string | undefined, session: SessionState | undefined, title: string, view: AskView): void {
  const scena = useScena();
  const modes = useSyncExternalStore((changed) => {
    const watch = watchModes(scena, changed);
    return () => watch.dispose();
  }, () => modesNow(scena));
  const withoutHttps = useSyncExternalStore((changed) => {
    const watch = scena.store.subscribe(WITHOUT_HTTPS.path, changed);
    return () => watch.dispose();
  }, () => WITHOUT_HTTPS.read(scena.store));
  const connection = useStore<{ status?: string; generation?: number }>(ahpPaths(host).connection);
  const own = connection?.status === 'connected' ? hostBridge(host).clientId() : undefined;
  const loaded = session !== undefined;
  const latest = useRef({ session, own, title, view });
  latest.current = { session, own, title, view };

  // On each connection too: a host that restarted knows no client.
  useEffect(() => {
    const now = latest.current.session;
    if (resource === undefined || own === undefined || now === undefined) return;
    // Where the browser has no locks, two windows would both run a call, so nothing is offered unless a person
    // turned on the windows' own; turned off again, the tools are taken back.
    const action = announcement(own, marksOn(scena).length > 0 && agentLocks(scena) !== undefined, now);
    if (action !== undefined) hostBridge(host).dispatch(resource, action);
  }, [scena, host, resource, own, connection?.generation, modes, loaded, withoutHttps]);

  const lock = useRef<SessionLock | undefined>(undefined);
  const runner = useRef<Runner | undefined>(undefined);
  useEffect(() => {
    const locks = agentLocks(scena);
    if (resource === undefined || locks === undefined) return undefined;
    const made = makeRunner(scena, locks, host, {
      resource,
      title: () => latest.current.title,
      inView: (chat) => latest.current.view.chat === chat && latest.current.view.drawn() && document.visibilityState === 'visible' && document.hasFocus(),
      show: (chat) => latest.current.view.show(chat),
    });
    const step = (): void => made.update(latest.current.session?.inputNeeded, latest.current.own, mine.holds());
    const mine = sessionLock(locks, `ahpw.agentTools:${host}:${resource}`, () => step());
    const focus = (): void => mine.take();
    if (document.hasFocus()) mine.take();
    window.addEventListener('focus', focus);
    lock.current = mine;
    runner.current = made;
    return () => {
      window.removeEventListener('focus', focus);
      mine.release();
      made.release();
      lock.current = undefined;
      runner.current = undefined;
    };
  }, [scena, host, resource, withoutHttps]);

  const needed = session?.inputNeeded;
  useEffect(() => {
    if (lock.current !== undefined) runner.current?.update(needed, own, lock.current.holds());
  }, [needed, own, host, resource]);
}
