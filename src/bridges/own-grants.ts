/**
 * The grants the reader holds on each host, as `x-ahpd/me` answered, so a
 * button the host would refuse them is not drawn.
 */

import { useMemo } from 'react';
import type { BindingPath, Disposable, Scena } from '@softov/scena/types';
import { holds } from '../resources/connectors/form.js';
import { ahpPaths } from './data.js';
import { useEach } from './hosts.js';
import { grantsHeld, type HeldMe } from './me.js';
import type { Offers } from './offers.js';
import type { Operation } from './operations.js';
import { PEOPLE, writesPeople, type PeopleDomain } from './people.js';
import { POLICIES, writesPolicies } from './policies.js';
import { trackHosts } from './served.js';

/** What the reader holds on one host: their grants, or `null` where nothing is held back. */
export type OwnGrants = readonly string[] | null;

/** Whether the reader holds a grant; `null` holds every one. */
export const mayDo = (grants: OwnGrants, grant: string): boolean => grants === null || holds(grants, grant);

/** A kind of record the host keeps and a person edits. */
export type EditedDomain = PeopleDomain | 'policies';

const takesWrites = (offers: Offers, domain: EditedDomain): boolean => (domain === 'policies' ? writesPolicies(offers) : writesPeople(offers, domain));
const schemeOf = (domain: EditedDomain): string => (domain === 'policies' ? POLICIES : PEOPLE[domain]).scheme;

/** Whether the host takes writes to these records and the reader may make and edit them. */
export const mayPut = (offers: Offers, grants: OwnGrants, domain: EditedDomain): boolean => takesWrites(offers, domain) && mayDo(grants, `${schemeOf(domain)}:put`);

/** Whether the host takes writes to these records and the reader may delete them. */
export const mayDelete = (offers: Offers, grants: OwnGrants, domain: EditedDomain): boolean => takesWrites(offers, domain) && mayDo(grants, `${schemeOf(domain)}:delete`);

/** The reader's grants on one host, read from the store. */
export const ownGrantsOf = (scena: Scena, host: string): OwnGrants =>
  grantsHeld(scena.store.get<Offers>(ahpPaths(host).offers), scena.store.get<HeldMe>(ahpPaths(host).me));

/** Keeps `path` true while the reader may make these records on any host this page connects to. */
export function trackMayPut(scena: Scena, domain: EditedDomain, path: BindingPath): Disposable {
  return trackHosts(scena, path, (offers, me) => offers !== undefined && mayPut(offers, grantsHeld(offers, me), domain));
}

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
