/**
 * The grants the reader holds on each host, read from their own `user://`
 * record, so a button the host would refuse them is not drawn.
 */

import { useEffect, useState } from 'react';
import { holds } from '../resources/connectors/form.js';
import { NO_OFFERS, type Offers } from './offers.js';
import { readOwnUser, selfId, type Grant } from './people.js';

/** What the reader holds on one host: their grants, or `null` where nothing is held back. */
export type OwnGrants = readonly Grant[] | null;

/** Whether the reader holds a grant; `null` holds every one. */
export const mayDo = (grants: OwnGrants, grant: string): boolean => grants === null || holds(grants, grant);

/**
 * The reader's grants on each host, in the order given. A connection that is
 * no person, as a root one, is `null`, and so is one whose record could not be
 * read: the host still refuses what they may not do. A person's are empty
 * until their record is read.
 */
export function useOwnGrantsOnEach(hosts: readonly string[], offers: readonly (Offers | undefined)[]): OwnGrants[] {
  const people = hosts.map((host, at) => ({ host, offers: offers[at] ?? NO_OFFERS }));
  const key = people.map((one) => `${one.host}=${selfId(one.offers) ?? ''}`).join('\n');
  const [read, setRead] = useState<Readonly<Record<string, OwnGrants>>>({});
  useEffect(() => {
    let live = true;
    for (const { host, offers: held } of people) {
      if (selfId(held) === undefined) continue;
      readOwnUser(host, held).then(
        (user) => { if (live) setRead((was) => ({ ...was, [host]: user.grants ?? [] })); },
        () => { if (live) setRead((was) => ({ ...was, [host]: null })); },
      );
    }
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return people.map(({ host, offers: held }) => (selfId(held) === undefined ? null : read[host] ?? []));
}

/** The reader's grants on one host. */
export const useOwnGrants = (host: string, offers: Offers): OwnGrants => useOwnGrantsOnEach([host], [offers])[0] ?? null;
