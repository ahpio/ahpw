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
  const serving = new Set<string>();
  const publish = (): void => {
    const now = serving.size > 0;
    if (scena.store.get<boolean>(path) !== now) scena.store.set(path, now);
  };
  const watching = onEachHost(scena, (host) => {
    const check = (): void => {
      const offers = scena.store.get<Offers>(ahpPaths(host).offers);
      const open = also === undefined || typeof scheme !== 'string' || offers === undefined || mayOpen(offers, scena.store.get<HeldMe>(ahpPaths(host).me), scheme, also);
      if (serves(offers, scheme) && open) serving.add(host);
      else serving.delete(host);
      publish();
    };
    check();
    const stops = [scena.store.subscribe(ahpPaths(host).offers, check), ...(also === undefined ? [] : [scena.store.subscribe(ahpPaths(host).me, check)])];
    return {
      dispose: () => {
        for (const stop of stops) stop.dispose();
        serving.delete(host);
        publish();
      },
    };
  });
  publish();
  return watching;
}
