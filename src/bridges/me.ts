/**
 * Who this page's connection is on a host, through ahpd's `x-ahpd/me`: a
 * person, a plugin or the host itself, with their roles and grants.
 */

import { useStore } from '@softov/scena/react';
import type { Disposable, Scena } from '@softov/scena/types';
import type { Me } from '@ahpd/sdk';
import { ahpPaths, hostBridge } from './data.js';
import { expandGrants } from './grants.js';
import { onEachHost } from './hosts.js';
import { NO_OFFERS, type Offers } from './offers.js';
import { selfId } from './people.js';

export type { Me };

export const ME = 'x-ahpd/me';

/** What `x-ahpd/me` answered: `null` when the host refused or does not serve it, undefined while it is asked. */
export type HeldMe = Me | null | undefined;

/** Whether a host says who a connection is. */
export const servesMe = (offers: Offers): boolean => offers.methods.includes(ME);

/** Who this connection is. */
export async function readMe(host: string): Promise<Me> {
  const answer = await hostBridge(host).request(ME as never, {} as never) as Partial<Me> | null;
  if (typeof answer !== 'object' || answer === null || typeof answer.principal !== 'string' || typeof answer.kind !== 'string'
    || !Array.isArray(answer.roles) || !Array.isArray(answer.grants) || !Array.isArray(answer.pools)) throw new Error(`${ME} answered no connection`);
  return answer as Me;
}

/** The host's own id, `<host>` of `root:<host>`, when the connection is the host itself. */
export function rootId(offers: Offers): string | undefined {
  const principal = offers.principal ?? '';
  return principal.startsWith('root:') && principal.length > 'root:'.length ? principal.slice('root:'.length) : undefined;
}

/** Whose profile a connection has: a person's, or the host's own where the host answers `x-ahpd/me`. */
export function profileOf(offers: Offers): { kind: 'user' | 'root'; id: string } | undefined {
  if (!servesMe(offers)) return undefined;
  const user = selfId(offers);
  if (user !== undefined) return { kind: 'user', id: user };
  const root = rootId(offers);
  return root === undefined ? undefined : { kind: 'root', id: root };
}

/** Keeps each host's `me` in the store, asked at each handshake. */
export function trackMe(scena: Scena): Disposable {
  return onEachHost(scena, (host) => {
    const { offers: offersPath, me: path } = ahpPaths(host);
    let asked = 0;
    let principal: string | undefined;
    const ask = (): void => {
      const offers = scena.store.get<Offers>(offersPath);
      const mine = asked += 1;
      const keep = (me: HeldMe): void => { if (mine === asked) scena.store.set(path, me); };
      // The last answer stays while a reconnect of the same person asks again.
      if (offers?.principal !== principal) keep(undefined);
      principal = offers?.principal;
      if (offers === undefined) return;
      if (!servesMe(offers)) keep(null);
      else readMe(host).then(keep, () => keep(null));
    };
    ask();
    const watch = scena.store.subscribe(offersPath, ask);
    return {
      dispose: () => {
        asked += 1;
        watch.dispose();
      },
    };
  });
}

/** Who this connection is on a host, kept current. */
export const useMe = (host: string): HeldMe => useStore<HeldMe>(ahpPaths(host).me);

/**
 * The grants a connection holds, as single operations: `null` where nothing is
 * held back here - a connection that is no person, or one the host did not
 * answer about - and empty while it is asked.
 */
export function grantsHeld(offers: Offers = NO_OFFERS, me: HeldMe): readonly string[] | null {
  if (selfId(offers) === undefined || me === null) return null;
  return me === undefined ? [] : expandGrants(me.grants, offers.catalog ?? {});
}
