/**
 * The grants the reader holds on each host, as `x-ahpd/me` answered, so a
 * button the host would refuse them is not drawn.
 */

import { useMemo } from 'react';
import { holds } from '../resources/connectors/form.js';
import { ahpPaths } from './data.js';
import { useEach } from './hosts.js';
import { grantsHeld, type HeldMe } from './me.js';
import type { Offers } from './offers.js';
import type { Operation } from './operations.js';

/** What the reader holds on one host: their grants, or `null` where nothing is held back. */
export type OwnGrants = readonly string[] | null;

/** Whether the reader holds a grant; `null` holds every one. */
export const mayDo = (grants: OwnGrants, grant: string): boolean => grants === null || holds(grants, grant);

/** The reader's grants on each host, in the order given, as `grantsHeld` says. */
export function useOwnGrantsOnEach(hosts: readonly string[], offers: readonly (Offers | undefined)[]): OwnGrants[] {
  const held = useEach<HeldMe>(hosts.map((host) => ahpPaths(host).me));
  return useMemo(() => hosts.map((_, at) => grantsHeld(offers[at], held[at])), [hosts, offers, held]);
}

/** The reader's grants on one host. */
export function useOwnGrants(host: string, offers: Offers): OwnGrants {
  const [me] = useEach<HeldMe>([ahpPaths(host).me]);
  return useMemo(() => grantsHeld(offers, me), [offers, me]);
}

/**
 * The operations a reader may run: the host admits a caller holding
 * `operation:invoke`, or the grant the operation names. `null` grants hold
 * every one.
 */
export function runnableBy(operations: readonly Operation[], grants: OwnGrants): Operation[] {
  if (mayDo(grants, 'operation:invoke')) return [...operations];
  return operations.filter((one) => mayDo(grants, one.grant));
}
