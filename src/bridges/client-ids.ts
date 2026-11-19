import type { ClientIdStore } from '@microsoft/agent-host-protocol/hosts';
import { newId } from './words.js';

/** The localStorage key a host's client id is kept under; one per host per browser. */
const keyOf = (hostId: string): string => `ahpw.clientId.${hostId}`;

/** What every ahpw client id starts with, so a host's client list tells ahpw apart. */
const PREFIX = 'ahpw-';

/** A new client id: `ahpw-` and a UUID. */
export const ahpwId = (): string => `${PREFIX}${newId()}`;

/**
 * Each host's client id, kept in `localStorage`, so a host sees this browser as
 * the same client after a reload.
 *
 * `load` answers the kept id when it is an ahpw one, and a new `ahpwId()`
 * otherwise, which the protocol then stores: a browser that kept an id of
 * another form gets a new one once. Storage that refuses keeps nothing, and
 * each load is a new id.
 */
export const localClientIds: ClientIdStore = {
  async load(hostId) {
    try {
      const kept = localStorage.getItem(keyOf(hostId));
      if (kept !== null && kept.startsWith(PREFIX)) return kept;
    } catch {
      // Storage blocked: a new id, as below.
    }
    return ahpwId();
  },
  async store(hostId, clientId) {
    try {
      localStorage.setItem(keyOf(hostId), clientId);
    } catch {
      // A browser that keeps nothing gets a new id on the next load.
    }
  },
};
