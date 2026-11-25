/**
 * Which hosts serve a plugin channel, from their offers: a list follows a
 * plugin's channel only on those, and its activity bar entry shows while one does.
 */

import { useMemo } from 'react';
import type { BindingPath, Disposable, Scena } from '@softov/scena/types';
import { ahpPaths } from './data.js';
import { onEachHost, useEach } from './hosts.js';
import { grantsHeld, type HeldMe } from './me.js';
import type { Offers } from './offers.js';
import { mayDo } from './own-grants.js';

/** A channel scheme, such as `x-ahpd-computers`, or a test for what has no channel, such as usage. */
export type Served = string | ((offers: Offers) => boolean);

const serves = (offers: Offers | undefined, scheme: Served): boolean =>
  offers !== undefined && (typeof scheme === 'string' ? offers.channels.includes(scheme) : scheme(offers));

/** Those of `hosts` whose plugins serve the channel `scheme`, such as `x-ahpd-computers`, or pass its test. */
export function useServingHosts(hosts: readonly string[], scheme: Served): string[] {
  const offers = useEach<Offers>(hosts.map((host) => ahpPaths(host).offers));
  return useMemo(() => hosts.filter((_, at) => serves(offers[at], scheme)), [hosts, offers, scheme]);
}

/** Whether a connection may open the channel `scheme`: it holds the channel's grant, or one of `also`. */
export function mayOpen(offers: Offers, me: HeldMe, scheme: string, also: readonly string[]): boolean {
  const grant = offers.channelGrants?.[scheme];
  const held = grantsHeld(offers, me);
  return grant === undefined || [grant, ...also].some((one) => mayDo(held, one));
}

/**
 * Keeps `path` true while any host this page connects to serves the channel
 * `scheme`, or passes its test, and false otherwise. Given `also`, the reader
 * must hold the channel's grant or one of these too. That is for a channel the
 * host opens to no one else: a few, as bots, open for a reader's own records.
 */
export function trackServed(scena: Scena, scheme: Served, path: BindingPath, also?: readonly string[]): Disposable {
  return trackHosts(scena, path, (offers, me) => serves(offers, scheme)
    && (also === undefined || typeof scheme !== 'string' || offers === undefined || mayOpen(offers, me, scheme, also)));
}

/** Keeps `path` true while any host this page connects to passes the test, and false otherwise. */
export function trackHosts(scena: Scena, path: BindingPath, test: (offers: Offers | undefined, me: HeldMe) => boolean): Disposable {
  const passing = new Set<string>();
  const publish = (): void => {
    const now = passing.size > 0;
    if (scena.store.get<boolean>(path) !== now) scena.store.set(path, now);
  };
  const watching = onEachHost(scena, (host) => {
    const { offers, me } = ahpPaths(host);
    const check = (): void => {
      if (test(scena.store.get<Offers>(offers), scena.store.get<HeldMe>(me))) passing.add(host);
      else passing.delete(host);
      publish();
    };
    check();
    const stops = [offers, me].map((one) => scena.store.subscribe(one, check));
    return {
      dispose: () => {
        for (const stop of stops) stop.dispose();
        passing.delete(host);
        publish();
      },
    };
  });
  publish();
  return watching;
}
