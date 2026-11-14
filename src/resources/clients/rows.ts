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
  /** The version and the title the client declared, its own claims. */
  clientVersion?: string;
  clientTitle?: string;
  /** The names of the capabilities it declared. */
  capabilities: string[];
  /** The person's id, when the connection signed in as one. */
  principal?: string;
  roles: string[];
  team?: string;
  /** When the sign-in runs out, as a wall-clock millisecond. */
  principalUntil?: number;
  /** Whether the socket came in on the deployment's own token. */
  root: boolean;
  address?: string;
  /** The path the socket opened on, and the node that admitted it. */
  path?: string;
  node?: string;
  /** Claims the request carried, kept as sent. */
  forwardedFor?: string;
  userAgent?: string;
  origin?: string;
  protocolVersion?: string;
  locale?: string;
  /** When the socket was accepted, as a wall-clock millisecond. */
  connectedAt?: number;
  /** How the client last came in on the socket. */
  arrival?: 'initialize' | 'reconnect';
  /** The channels it follows, sent as `subscriptions`. */
  watching: string[];
  /** The resources it pushed a token for. */
  authenticated: string[];
  /** The sessions it is in, by URI. */
  sessions: string[];
  traffic?: { framesIn: number; framesOut: number; bytesIn: number; bytesOut: number };
  /** When a frame last crossed each way, and when it last pinged, as wall-clock milliseconds. */
  lastIn?: number;
  lastOut?: number;
  lastPing?: number;
  /** The bytes the wire holds for it, and the most it may hold. */
  queuedBytes?: number;
  queueLimit?: number;
  /** How many of its requests the host refused. */
  refused?: number;
}

const text = (value: unknown): string | undefined => (typeof value === 'string' && value !== '' ? value : undefined);
const count = (value: unknown): number | undefined => (typeof value === 'number' && Number.isFinite(value) ? value : undefined);

const texts = (value: unknown): string[] => (Array.isArray(value) ? value.filter((one): one is string => typeof one === 'string' && one !== '') : []);

export function factsOf(record: Bag): ClientFacts {
  const out: ClientFacts = {
    clientId: text(record.clientId) ?? '',
    capabilities: texts(record.capabilities),
    roles: texts(record.roles),
    root: record.root === true,
    watching: texts(record.subscriptions),
    authenticated: texts(record.authenticated),
    sessions: texts(record.sessions),
  };
  for (const field of ['name', 'clientVersion', 'clientTitle', 'principal', 'team', 'address', 'path', 'node', 'forwardedFor', 'userAgent', 'origin', 'protocolVersion', 'locale'] as const) {
    const value = text(record[field]);
    if (value !== undefined) out[field] = value;
  }
  for (const field of ['connectedAt', 'principalUntil', 'lastIn', 'lastOut', 'lastPing', 'queuedBytes', 'queueLimit', 'refused'] as const) {
    const value = count(record[field]);
    if (value !== undefined) out[field] = value;
  }
  if (record.arrival === 'initialize' || record.arrival === 'reconnect') out.arrival = record.arrival;
  const framesIn = count(record.framesIn);
  const framesOut = count(record.framesOut);
  const bytesIn = count(record.bytesIn);
  const bytesOut = count(record.bytesOut);
  if (framesIn !== undefined && framesOut !== undefined && bytesIn !== undefined && bytesOut !== undefined) {
    out.traffic = { framesIn, framesOut, bytesIn, bytesOut };
  }
  return out;
}

/** The row's title: the title the client declared, else its name, else its id. */
export const titleOf = (facts: ClientFacts): string => facts.clientTitle ?? facts.name ?? facts.clientId;

/** The client and its version, as `ahpc 0.9.0`; the name before the title, and nothing when neither came. */
export function clientWords(facts: ClientFacts): string | undefined {
  const who = facts.name ?? facts.clientTitle;
  if (who === undefined) return facts.clientVersion;
  return facts.clientVersion === undefined ? who : `${who} ${facts.clientVersion}`;
}

/** How long with no frame either way before a connection reads as idle. */
export const IDLE_AFTER_MS = 60_000;

/** Whether no frame has crossed either way for `IDLE_AFTER_MS`; a row that says no time is never idle. */
export function isIdle(facts: ClientFacts, now: number): boolean {
  const last = Math.max(facts.lastIn ?? -Infinity, facts.lastOut ?? -Infinity);
  return Number.isFinite(last) && now - last > IDLE_AFTER_MS;
}

/** One reading of the counters, and when it was taken. */
export interface Reading {
  bytesIn: number;
  bytesOut: number;
  at: number;
}

/**
 * Bytes a second each way between two readings, or nothing when they are not
 * apart in time or the counters went back, as they do on a new socket.
 */
export function rateOf(before: Reading, after: Reading): { bytesIn: number; bytesOut: number } | undefined {
  const seconds = (after.at - before.at) / 1000;
  if (seconds <= 0 || after.bytesIn < before.bytesIn || after.bytesOut < before.bytesOut) return undefined;
  return { bytesIn: (after.bytesIn - before.bytesIn) / seconds, bytesOut: (after.bytesOut - before.bytesOut) / seconds };
}

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

/** Who the connection is: the person, else `hostToken` for one on the deployment's own token. */
export const whoOf = (facts: ClientFacts, hostToken: string): string | undefined =>
  facts.principal ?? (facts.root ? hostToken : undefined);

/** The row's line: the client and its version, who it is, then the address. */
export function lineOf(facts: ClientFacts, hostToken: string): string {
  return [clientWords(facts), whoOf(facts, hostToken), facts.address].filter((bit) => bit !== undefined && bit !== '').join(' \u{00B7} ');
}
