/**
 * A host's connections, as ahpd's `x-ahpd-clients://` lists them: one row for
 * each open socket, keyed by its number, with what the client said at
 * `initialize`, the person it signed in as, the address the socket reported,
 * the `X-Forwarded-For` claim kept as sent, and the frames and bytes it has
 * carried each way.
 */

import { operationsReducer, type OperationsState } from '../../bridges/operations.js';

type Bag = Record<string, unknown>;

export const CLIENTS_SCHEME = 'x-ahpd-clients';
export const CLIENTS = `${CLIENTS_SCHEME}://`;

export type ClientsState = OperationsState;

/** Folds the channel's records and its operations. */
export const clientsReducer = operationsReducer(CLIENTS_SCHEME);

/** What a row says, as the host sent it. */
export interface ClientFacts {
  clientId: string;
  name?: string;
  /** The person's id, when the connection signed in as one. */
  principal?: string;
  address?: string;
  forwardedFor?: string;
  protocolVersion?: string;
  locale?: string;
  /** When the socket was accepted, as a wall-clock millisecond. */
  connectedAt?: number;
  /** The channels it follows. */
  watching: string[];
  traffic?: { framesIn: number; framesOut: number; bytesIn: number; bytesOut: number };
}

const text = (value: unknown): string | undefined => (typeof value === 'string' && value !== '' ? value : undefined);
const count = (value: unknown): number | undefined => (typeof value === 'number' && Number.isFinite(value) ? value : undefined);

export function factsOf(record: Bag): ClientFacts {
  const out: ClientFacts = {
    clientId: text(record.clientId) ?? '',
    watching: Array.isArray(record.watching) ? record.watching.filter((one): one is string => typeof one === 'string') : [],
  };
  for (const field of ['name', 'principal', 'address', 'forwardedFor', 'protocolVersion', 'locale'] as const) {
    const value = text(record[field]);
    if (value !== undefined) out[field] = value;
  }
  const at = count(record.connectedAt);
  if (at !== undefined) out.connectedAt = at;
  const framesIn = count(record.framesIn);
  const framesOut = count(record.framesOut);
  const bytesIn = count(record.bytesIn);
  const bytesOut = count(record.bytesOut);
  if (framesIn !== undefined && framesOut !== undefined && bytesIn !== undefined && bytesOut !== undefined) {
    out.traffic = { framesIn, framesOut, bytesIn, bytesOut };
  }
  return out;
}

/** The row's title: the name the client gave, else its id. */
export const titleOf = (facts: ClientFacts): string => facts.name ?? facts.clientId;

/** A byte count as a person reads it: B, kB or MB, in steps of 1000. */
export function bytesWords(bytes: number): string {
  if (bytes < 1000) return `${bytes} B`;
  if (bytes < 1_000_000) return `${(bytes / 1000).toFixed(1)} kB`;
  return `${(bytes / 1_000_000).toFixed(1)} MB`;
}

/** The traffic in each direction, as `↓ in · ↑ out`; in is what the client sent. */
export function trafficWords(traffic: NonNullable<ClientFacts['traffic']>): string {
  return `\u{2193} ${bytesWords(traffic.bytesIn)} \u{00B7} \u{2191} ${bytesWords(traffic.bytesOut)}`;
}

/** The row's line: the person, then the address. */
export function lineOf(facts: ClientFacts): string {
  return [facts.principal, facts.address].filter((bit) => bit !== undefined).join(' \u{00B7} ');
}
