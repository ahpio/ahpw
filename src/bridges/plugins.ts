/**
 * The host's plugins, through ahpd's `x-ahpd-plugins://` records channel and
 * its `x-ahpd/plugins/enable`, `/disable`, `/options`, `/reload`, `/apply`,
 * `/install`, `/write` and `/remove` commands. Reading takes `plugin:list`, and
 * each command its own grant: `plugin:enable`, `plugin:disable`,
 * `plugin:options`, `plugin:reload`, `plugin:apply`, and `plugin:install` for
 * the last three. A host refuses the rest in its own words. It applies a
 * change at once, and sets `ahpd.restartNeeded` in its root config only when a
 * plugin that holds a port or a URI scheme is in the way.
 *
 * The row is written here rather than imported: ahpd serves it from the
 * server, and `@ahpd/sdk` 0.13 has no `PluginManifest` yet. The channel came
 * after 0.13, so these types move to the SDK's once it carries them.
 */

import type { RootState } from '@microsoft/agent-host-protocol';
import type { Icon } from './icons.js';
import { hostBridge } from './data.js';
import type { Offers } from './offers.js';
import { recordsReducer } from './people.js';
import type { PluginView } from './views.js';

export type { PluginView, PluginViewComponent } from './views.js';

export const PLUGINS = {
  scheme: 'x-ahpd-plugins',
  channel: 'x-ahpd-plugins://',
  enable: 'x-ahpd/plugins/enable',
  disable: 'x-ahpd/plugins/disable',
  options: 'x-ahpd/plugins/options',
  reload: 'x-ahpd/plugins/reload',
  apply: 'x-ahpd/plugins/apply',
  install: 'x-ahpd/plugins/install',
  write: 'x-ahpd/plugins/write',
  remove: 'x-ahpd/plugins/remove',
} as const;

/**
 * What ahpd says of a configured plugin, read from the configuration and its
 * package rather than from what loaded: `ready` resolves and is configured,
 * `unconfigured` lacks an option it needs, `incompatible` wants another SDK,
 * `missing` is not installed, `error` could not be read.
 */
export type PluginState = 'ready' | 'incompatible' | 'unconfigured' | 'disabled' | 'missing' | 'error';

export const PLUGIN_STATES: readonly PluginState[] = ['error', 'missing', 'incompatible', 'unconfigured', 'ready', 'disabled'];

/** A link a plugin names, such as its docs. */
export interface PluginLink {
  title: string;
  url: string;
}

/** What a plugin says it registers, by register method: `agents`, `channels`, `methods`, `connectors`, ... An entry may end in `*`. */
export type PluginContracts = Record<string, string[]>;

/** A plugin's manifest, as `ahpd` in its package.json writes it. */
export interface PluginManifest {
  description?: string;
  /** Free words; ahpd's own are `agent`, `channel`, `connector`, `storage` and `tool`. */
  categories?: string[];
  links?: PluginLink[];
  contracts?: PluginContracts;
  /** What is drawn beside its name; the host sends a file it read as a `data:` URI. */
  icons?: Icon[];
}

/** How the configuration names a plugin: the module alone, or with its options and whether it is on. */
export type PluginSpec = string | { name: string; options?: Record<string, unknown>; enabled?: boolean; grants?: string[] };

/** One thing a plugin's, an agent's or a connector's row says about it; a later alert with the same `ref` replaced the one before. */
export interface HostAlert {
  level: 'notice' | 'info' | 'warning' | 'error';
  text: string;
  /** What it is about, as `<kind>:<id>`. */
  ref?: string;
  /** When it was raised, as an ISO time. */
  at?: string;
}

/** An alert on a plugin's row. */
export type PluginAlert = HostAlert;

/** One configured plugin, as the channel lists it; a secret option reads `<set>`. */
export interface PluginRow {
  spec: PluginSpec;
  name: string;
  state: PluginState;
  module?: string;
  url?: string;
  path?: string;
  title?: string;
  problem?: string;
  /** Present once the plugin loaded with one. */
  manifest?: PluginManifest;
  /** Loaded, but its manifest names no contracts. */
  undeclared?: boolean;
  /** The installed package's version. */
  version?: string;
  /** Whether the running host loaded it; a configured plugin may not be running. */
  loaded?: boolean;
  /** What the plugin or its load raised; a load that failed is an `error`. */
  alerts?: PluginAlert[];
  /** The JSON Schema of its options; absent for a plugin switched off, which is never imported. */
  optionsSchema?: Record<string, unknown>;
  /** What a loaded plugin draws, by surface; `main` is its page. Its literal words come in the reader's locale. */
  views?: Record<string, PluginView>;
}

export const pluginsReducer = recordsReducer<PluginRow>(PLUGINS.scheme);

/** Whether a host lists its plugins to this reader: the channel is among its offers. */
export function servesPlugins(offers: Offers): boolean {
  return offers.channels.includes(PLUGINS.scheme);
}

/** What an enable or a disable answers: the plugin, whether it is now on, and whether only a restart applies it. */
export interface PluginToggled {
  id: string;
  enabled: boolean;
  restart: boolean;
}

async function toggle(host: string, method: string, id: string): Promise<PluginToggled> {
  const answer = await hostBridge(host).request(method as never, { id } as never) as Partial<PluginToggled> | null;
  if (typeof answer !== 'object' || answer === null || typeof answer.id !== 'string' || typeof answer.enabled !== 'boolean') {
    throw new Error(`${method} answered no plugin`);
  }
  return { id: answer.id, enabled: answer.enabled, restart: answer.restart === true };
}

/** Turns a configured plugin on; the host loads it at once. */
export const enablePlugin = (host: string, id: string): Promise<PluginToggled> => toggle(host, PLUGINS.enable, id);

/** Turns a configured plugin off, keeping its entry and options; the host unloads it at once. */
export const disablePlugin = (host: string, id: string): Promise<PluginToggled> => toggle(host, PLUGINS.disable, id);

/**
 * Writes one option, checked against the plugin's own schema; a `value` left
 * out takes the option out. The host applies it at once.
 */
export async function setPluginOption(host: string, id: string, key: string, value: unknown): Promise<void> {
  await hostBridge(host).request(PLUGINS.options as never, { id, key, ...(value === undefined ? {} : { value }) } as never);
}

/** Imports a plugin's code again; its closers run first. */
export async function reloadPlugin(host: string, id: string): Promise<void> {
  await hostBridge(host).request(PLUGINS.reload as never, { id } as never);
}

/** Calls a method a plugin registered, as a Button of its view names it. */
export async function callPluginMethod(host: string, method: string, params: Record<string, unknown>): Promise<void> {
  await hostBridge(host).request(method as never, params as never);
}

/** Loads, unloads or reconfigures the host's plugins to match its configuration file. */
export async function applyPlugins(host: string): Promise<void> {
  await hostBridge(host).request(PLUGINS.apply as never, {} as never);
}

/** What an install, a write or a remove answers: the plugin's id, and whether only a restart applies the change. */
export interface PluginChanged {
  id: string;
  restart: boolean;
}

async function change(host: string, method: string, params: Record<string, unknown>): Promise<PluginChanged> {
  const answer = await hostBridge(host).request(method as never, params as never) as Partial<PluginChanged> | null;
  if (typeof answer !== 'object' || answer === null || typeof answer.id !== 'string') throw new Error(`${method} answered no plugin`);
  return { id: answer.id, restart: answer.restart === true };
}

/**
 * Installs a plugin from `source`: a package name, a path, a tarball URL,
 * `github:<owner>/<repo>` or a `git+ssh:` spec. The host runs npm, names it in
 * its configuration and loads it before it answers, which can take minutes.
 */
export const installPlugin = (host: string, source: string): Promise<PluginChanged> => change(host, PLUGINS.install, { source });

/**
 * Writes a plugin as one TypeScript file and its package.json. The host runs
 * npm in a staging folder and swaps it in only when npm succeeds, so a failed
 * write leaves a running plugin as it was.
 */
export const writePlugin = (host: string, id: string, source: string, packageJson: string): Promise<PluginChanged> =>
  change(host, PLUGINS.write, { id, source, packageJson });

/** Takes a plugin out of the configuration; `keep` leaves its package or written folder in place. */
export const removePlugin = (host: string, id: string, keep: boolean): Promise<PluginChanged> =>
  change(host, PLUGINS.remove, keep ? { id, keep: true } : { id });

/**
 * Whether the host holds a configuration change that only a restart applies.
 * The host says so with `root/configChanged`, so the mark is in the root's
 * config values.
 */
export function restartNeeded(root: RootState | undefined): boolean {
  return root?.config?.values['ahpd.restartNeeded'] === true;
}

/** Whether the configuration turns a plugin on: a spec without `enabled: false`. */
export function specEnabled(spec: PluginSpec): boolean {
  return typeof spec === 'string' || spec.enabled !== false;
}
