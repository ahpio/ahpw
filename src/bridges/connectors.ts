/**
 * The host's adapters and connectors. A plugin registers an adapter, and a
 * person makes connectors from one.
 *
 * `x-ahpd-adapters://` lists the adapters, keyed by name, and is read-only.
 * `x-ahpd-connectors://` lists the connectors, keyed by their slug id, and is
 * changed by `x-ahpd/connectors/put` and `/remove`. Both take
 * `connector:list`, which reads the caller's own connectors, their teams' and
 * the host's; `connector:all` reads every connector.
 *
 * A field an adapter's schema marks `secret` is a secret, as `isSecret` says:
 * the host keeps it in its vault and lists `{ "$secret": "<name>" }` in its place, and a put
 * that sends it as `""` keeps the one stored.
 *
 * The rows are written here rather than imported: `@ahpd/sdk` 0.13 has no
 * adapter or connector types yet. The channels came after 0.13, so these move
 * to the SDK's once it carries them.
 */

import { RpcTimeoutError } from '@microsoft/agent-host-protocol/client';
import type { PluginView } from './views.js';
import { hostBridge } from './data.js';
import type { Icon } from './icons.js';
import type { Offers } from './offers.js';
import type { HostAlert } from './plugins.js';
import { recordsReducer } from './people.js';
import { operationsReducer } from './operations-state.js';

type Bag = Record<string, unknown>;

export const ADAPTERS = {
  scheme: 'x-ahpd-adapters',
  channel: 'x-ahpd-adapters://',
} as const;

export const CONNECTORS = {
  scheme: 'x-ahpd-connectors',
  channel: 'x-ahpd-connectors://',
  put: 'x-ahpd/connectors/put',
  remove: 'x-ahpd/connectors/remove',
  signin: 'x-ahpd/connectors/signin',
  signinFinish: 'x-ahpd/connectors/signin-finish',
  models: 'x-ahpd/connectors/models',
  enable: 'x-ahpd/connectors/enable',
  disable: 'x-ahpd/connectors/disable',
} as const;

/** `receive` answers calls, `command` adds a `/` command, `action` is offered to run, `view` names a surface its records show a view on. Another is shown by its title. */
export type CapabilityType = 'receive' | 'command' | 'action' | 'view' | (string & {});

/** One thing a connector of an adapter does; declared and shown, never run from here. */
export interface Capability {
  type: CapabilityType;
  name: string;
  title: string;
  description: string;
  input?: Record<string, unknown>;
  /** Where a `receive` capability's connectors receive: a path from the daemon's HTTP root, with `{id}` for the connector id. */
  path?: string;
}

/** Whose connector it is: the host's, a team's or a person's. */
export type ConnectorOwner = 'host' | `team:${string}` | `user:${string}`;

/** How a connector of an adapter signs in to its provider, as the adapter row says. */
export interface SignInRow {
  /** What the button says. */
  title: string;
  /** The secret field of the adapter's schema that the sign-in fills. */
  field: string;
  /**
   * How the person signs in: a code they paste here, or a code the host shows
   * while it waits for their approval on another device. Absent from a host
   * that has only the pasted code.
   */
  flow?: 'code' | 'device';
  /** The plain field a device sign-in writes the account to, when the adapter names one. */
  account?: string;
}

/** One adapter a plugin registers, as `x-ahpd-adapters` lists it under its name. */
export interface AdapterRow {
  name: string;
  title: string;
  description: string;
  /** The JSON Schema the form for a connector of this adapter is drawn from. */
  schema: Record<string, unknown>;
  capabilities: Capability[];
  /** The plugin that registered it. */
  plugin: string;
  /** What is drawn beside its title. */
  icons?: Icon[];
  /** Sent by the host for an adapter whose connectors sign in to their provider. */
  signIn?: SignInRow;
}

/**
 * Where a connector is: `ready` answers, `unauthorized` is open but its
 * provider refused its credential at the last check, `invalid` no longer fits
 * its adapter's schema or its adapter refused to open it, `unavailable` has no
 * plugin registering its adapter, `failed` could not be opened by its adapter,
 * as when a key it reads is missing, and `disabled` is not opened, asked or
 * served.
 */
export type ConnectorState = 'ready' | 'unauthorized' | 'failed' | 'invalid' | 'unavailable' | 'disabled';

export const CONNECTOR_STATES: readonly ConnectorState[] = ['failed', 'unavailable', 'invalid', 'unauthorized', 'disabled', 'ready'];

/** One stored connector, as `x-ahpd-connectors` lists it. */
export interface ConnectorRow {
  id: string;
  /** The name of the adapter it is made from; a record from before the split has none and reads as `unavailable`. */
  adapter?: string;
  owner: ConnectorOwner;
  title?: string;
  /** The values filled in, each secret as a `{ $secret }` reference. */
  config: Record<string, unknown>;
  state: ConnectorState;
  /** The problems the host found on it, kept in its memory only; absent when it has none. */
  alerts?: HostAlert[];
  /** What its adapter's plugin draws for it, by surface; `main` is drawn on its page. */
  views?: Record<string, PluginView>;
  /** The ids of the operations it offers now, from a host that lists them. */
  operations?: string[];
}

export const adaptersReducer = recordsReducer<AdapterRow>(ADAPTERS.scheme);
/** The connectors channel: its records, and the operations a host that lists them offers. */
export const connectorsReducer = operationsReducer<ConnectorRow>(CONNECTORS.scheme);

/** Whether a host lists connectors to this reader: the channel is among its offers. */
export function servesConnectors(offers: Offers): boolean {
  return offers.channels.includes(CONNECTORS.scheme);
}

/** Whether a host lists adapters: the channel is among its offers. */
export function servesAdapters(offers: Offers): boolean {
  return offers.channels.includes(ADAPTERS.scheme);
}

/**
 * Whether a schema node is a secret the host keeps in its vault, by the host's
 * own rule: `secret: true` is one, and so is `writeOnly: true` with nothing
 * said about `secret`, which a plugin older than `secret` marks its vault
 * fields with. `secret: false` beside `writeOnly` keeps the value in the record.
 */
export function isSecret(node: unknown): boolean {
  if (typeof node !== 'object' || node === null) return false;
  const held = node as { secret?: unknown; writeOnly?: unknown };
  if (held.secret === true) return true;
  return held.secret === undefined && held.writeOnly === true;
}

/** Whether a config value is the reference a host lists in place of a secret. */
export function isSecretRef(value: unknown): value is { $secret: string } {
  return typeof value === 'object' && value !== null && typeof (value as { $secret?: unknown }).$secret === 'string';
}

/** What a put sends: the whole connector, every secret as its value or `""` to keep it. */
export interface ConnectorWanted {
  id: string;
  adapter: string;
  owner: ConnectorOwner;
  title?: string;
  config: Record<string, unknown>;
}

const isRow = (value: unknown): value is ConnectorRow => {
  const held = value as Partial<ConnectorRow> | null;
  return typeof held === 'object' && held !== null && typeof held.id === 'string' && typeof held.owner === 'string';
};

/** A put's params: the title only when there is one. */
const putParams = (wanted: ConnectorWanted): Bag => ({
  id: wanted.id,
  adapter: wanted.adapter,
  owner: wanted.owner,
  ...(wanted.title === undefined || wanted.title === '' ? {} : { title: wanted.title }),
  config: wanted.config,
});

/** Makes or changes one connector; the host checks it against its adapter and opens it. Answers the row it now lists. */
export async function putConnector(host: string, wanted: ConnectorWanted): Promise<ConnectorRow> {
  const answer = await hostBridge(host).request(CONNECTORS.put as never, putParams(wanted) as never) as unknown;
  if (!isRow(answer)) throw new Error(`${CONNECTORS.put} answered no connector`);
  return answer;
}

/**
 * A started sign-in: the provider's page, and the state its finish names. A
 * device sign-in also has the code the person types on that page, and how
 * many seconds it lasts.
 */
export type SignInStarted =
  | { flow: 'code'; url: string; state: string }
  | { flow: 'device'; url: string; state: string; code: string; expires: number };

const nonEmpty = (value: unknown): value is string => typeof value === 'string' && value !== '';

/**
 * Starts a sign-in for the connector a put would make, without the field the
 * sign-in fills. Answers the page a person opens and the state to finish with,
 * and the code to type there when the host answers one.
 */
export async function startSignIn(host: string, wanted: ConnectorWanted): Promise<SignInStarted> {
  const answer = await hostBridge(host).request(CONNECTORS.signin as never, putParams(wanted) as never) as unknown;
  const held = answer as { url?: unknown; state?: unknown; code?: unknown; expires?: unknown } | null;
  if (typeof held !== 'object' || held === null || !nonEmpty(held.url) || !nonEmpty(held.state)) {
    throw new Error(`${CONNECTORS.signin} answered no sign-in`);
  }
  if (held.code === undefined) return { flow: 'code', url: held.url, state: held.state };
  if (!nonEmpty(held.code) || typeof held.expires !== 'number' || !(held.expires > 0)) {
    throw new Error(`${CONNECTORS.signin} answered no sign-in`);
  }
  return { flow: 'device', url: held.url, state: held.state, code: held.code, expires: held.expires };
}

/**
 * Finishes a sign-in. A pasted sign-in sends the code the provider showed; a
 * device sign-in sends the state alone, and the host answers once the person
 * approved. Answers the row the host now lists.
 */
export async function finishSignIn(host: string, state: string, code?: string): Promise<ConnectorRow> {
  const params = code === undefined ? { state } : { state, code };
  const answer = await hostBridge(host).request(CONNECTORS.signinFinish as never, params as never) as unknown;
  if (!isRow(answer)) throw new Error(`${CONNECTORS.signinFinish} answered no connector`);
  return answer;
}

/**
 * Waits for a device sign-in's approval. The host holds the finish until the
 * person approves, which may outlast the client's request timeout, and answers
 * the same outcome to each finish until the code expires. So a finish that
 * timed out is sent again, until the code's expiry.
 */
export async function awaitSignIn(host: string, state: string, until: number, now: () => number = Date.now): Promise<ConnectorRow> {
  for (;;) {
    try {
      return await finishSignIn(host, state);
    } catch (caught) {
      if (!(caught instanceof RpcTimeoutError) || now() >= until) throw caught;
    }
  }
}

/** One model a provider connector serves, as `x-ahpd/connectors/models` answers it. */
export interface ConnectorModel {
  /** The model's id on its provider. */
  id: string;
  /** The name a caller sends as `model` to the host's proxy. */
  model: string;
  /** What the provider calls it, when it sends a name. */
  name?: string;
  /** The prompt the model reads, in tokens, when the provider says. */
  context_length?: number;
  /** Dollars per token, as strings, when the provider prices it. */
  pricing?: { prompt?: string; completion?: string };
  /** Whether this reader may call it through the proxy now; absent on a host that serves no proxy. */
  callable?: boolean;
}

/** A connector's models, and when the host last read them from the provider. */
export interface ConnectorModels {
  models: ConnectorModel[];
  /** An ISO time; absent before the first read. */
  at?: string;
}

const isModel = (value: unknown): value is ConnectorModel => {
  const held = value as Partial<ConnectorModel> | null;
  return typeof held === 'object' && held !== null && typeof held.id === 'string' && typeof held.model === 'string';
};

/** The models one open provider connector serves, for this reader. */
export async function readConnectorModels(host: string, id: string): Promise<ConnectorModels> {
  const answer = await hostBridge(host).request(CONNECTORS.models as never, { id } as never) as unknown;
  const held = answer as Partial<ConnectorModels> | null;
  if (typeof held !== 'object' || held === null || !Array.isArray(held.models)) throw new Error(`${CONNECTORS.models} answered no models`);
  return { models: held.models.filter(isModel), ...(typeof held.at === 'string' ? { at: held.at } : {}) };
}

/** Turns one connector on, which opens and checks it, or off, which closes it. Answers the row it now lists. */
export async function setConnectorOn(host: string, id: string, on: boolean): Promise<ConnectorRow> {
  const method = on ? CONNECTORS.enable : CONNECTORS.disable;
  const answer = await hostBridge(host).request(method as never, { id } as never) as unknown;
  if (!isRow(answer)) throw new Error(`${method} answered no connector`);
  return answer;
}

/** Closes one connector and takes it, and its secrets, off the host. */
export async function removeConnector(host: string, id: string): Promise<void> {
  await hostBridge(host).request(CONNECTORS.remove as never, { id } as never);
}

/**
 * The URL a connector receives at: the daemon's HTTP root, then the
 * capability's `path` with `{id}` as the connector's id. Nothing when the
 * capability names no path.
 */
export function receiveUrl(httpRoot: string, capability: Capability, id: string): string | undefined {
  if (capability.path === undefined) return undefined;
  const root = httpRoot.endsWith('/') ? httpRoot.slice(0, -1) : httpRoot;
  return `${root}${capability.path.split('{id}').join(encodeURIComponent(id))}`;
}
