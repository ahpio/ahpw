/**
 * What this page tells a host it is, as `clientInfo` on `initialize`: the name
 * and the title a host's client list shows, and ahpw's version.
 *
 * Where the page runs gives the name and the title. In an embedder they are the
 * embedder's `client`, else `ahp-desk`. Elsewhere they are the `client` of the
 * `ahpw.json` the server answered: `ahpw serve` and the ahpd plugin each send
 * their own. A server that sends none, as the dev server, gives `ahpw`.
 */

import { servedClient, type ServedClient } from '../lib/api.js';
import { embedder } from '../shell/embed/index.js';

/** ahpw's version, from `package.json`, which the build defines. */
declare const __AHPW_VERSION__: string;

/** The protocol's `Implementation`, as this page sends it. */
export interface ClientInfo {
  name: string;
  title: string;
  version: string;
}

/** The name and the title in an embedder that gives none. */
export const EMBEDDED_CLIENT = 'ahp-desk';

/** The name and the title anywhere else that is given none. */
export const PAGE_CLIENT = 'ahpw';

/** `given` over the default `fallback`, field by field, with ahpw's version. */
export function clientInfoFrom(given: ServedClient | undefined, fallback: string): ClientInfo {
  return {
    name: given?.name !== undefined && given.name !== '' ? given.name : fallback,
    title: given?.title !== undefined && given.title !== '' ? given.title : fallback,
    version: __AHPW_VERSION__,
  };
}

/** This page's `clientInfo`, from where it runs. */
export function clientInfoOf(): ClientInfo {
  return embedder !== undefined ? clientInfoFrom(embedder.client, EMBEDDED_CLIENT) : clientInfoFrom(servedClient(), PAGE_CLIENT);
}
