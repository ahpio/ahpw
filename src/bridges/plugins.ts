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
  available: 'x-ahpd/plugins/available',
  details: 'x-ahpd/plugins/details',
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
 * `marketplace` is the plugin list to take the version from, one the host
 * reads; without it the host takes the first list that has the source.
 */
export const installPlugin = (host: string, source: string, marketplace?: string): Promise<PluginChanged> =>
  change(host, PLUGINS.install, marketplace === undefined ? { source } : { source, marketplace });

/** One version of a listed plugin, as a plugin list holds it. */
export interface ListedVersion {
  version: string;
  /** The `@ahpd/sdk` range it declares; absent loads on every host. */
  sdk?: string;
  published?: string;
  /** Why the list's publisher says not to use it; the host never installs it. */
  deprecated?: string;
}

/** The installed plugin a listed entry is: its row's id, its version, and the list it came from. */
export interface ListedInstall {
  id: string;
  version?: string;
  marketplace?: string;
  deprecated?: string;
}

/** One plugin a host's plugin list holds, with the list it came from. */
export interface ListedPlugin {
  /** The id the list names it by, which need not be the id of its installed row. */
  id: string;
  name?: string;
  description?: string;
  /** What an install sends: an npm name or `github:<owner>/<repo>`. */
  source: string;
  /** The URL of the list it is in. */
  marketplace: string;
  categories?: string[];
  author?: string;
  license?: string;
  repository?: string;
  /** Drawn beside its name; the host sends each as a `data:` URI. */
  icons?: Icon[];
  /** Every listed version, newest first. */
  versions: ListedVersion[];
  /** Present when the host has it installed. */
  installed?: ListedInstall;
}

/** One list a host reads: `on` once fetched, `missing` until then. */
export interface ListState {
  url: string;
  state: 'on' | 'missing';
  checkedAt?: string;
}

/** What `x-ahpd/plugins/available` answers. */
export interface AvailablePlugins {
  marketplaces: ListState[];
  plugins: ListedPlugin[];
}

/** One part of a details page the host could not fetch, and why. */
export interface DetailsProblem {
  part: string;
  problem: string;
}

/** What `x-ahpd/plugins/details` answers for one listed version. */
export interface PluginDetails {
  id: string;
  marketplace: string;
  version: string;
  versions: string[];
  readme?: string;
  changelog?: string;
  license?: string;
  contracts?: PluginContracts;
  links?: PluginLink[];
  optionsSchema?: Record<string, unknown>;
  homepage?: unknown;
  bugs?: unknown;
  repository?: unknown;
  icons?: Icon[];
  problems?: DetailsProblem[];
}

/** Every plugin the host's lists hold, each with its list, its icons and the installed row it is. */
export async function availablePlugins(host: string): Promise<AvailablePlugins> {
  const answer = await hostBridge(host).request(PLUGINS.available as never, {} as never) as Partial<AvailablePlugins> | null;
  return {
    marketplaces: Array.isArray(answer?.marketplaces) ? answer.marketplaces : [],
    plugins: Array.isArray(answer?.plugins) ? answer.plugins : [],
  };
}

/** The files an installed plugin's own package holds for a person to read. */
export interface InstalledFiles {
  id: string;
  readme?: string;
  changelog?: string;
  license?: string;
}

/**
 * An installed plugin's README, changelog and license, read by the host from
 * the package it loads, whether it came from a list, a folder or a file.
 */
export async function installedFiles(host: string, id: string): Promise<InstalledFiles> {
  const answer = await hostBridge(host).request(PLUGINS.details as never, { id, installed: true } as never) as Partial<InstalledFiles> | null;
  if (typeof answer !== 'object' || answer === null || typeof answer.id !== 'string') throw new Error(`${PLUGINS.details} answered no plugin`);
  return answer as InstalledFiles;
}

/** What a listed plugin's page shows: one version's README, changelog, license and manifest. */
export async function pluginDetails(host: string, id: string, marketplace?: string, version?: string): Promise<PluginDetails> {
  const params = { id, ...(marketplace === undefined ? {} : { marketplace }), ...(version === undefined ? {} : { version }) };
  const answer = await hostBridge(host).request(PLUGINS.details as never, params as never) as Partial<PluginDetails> | null;
  if (typeof answer !== 'object' || answer === null || typeof answer.id !== 'string' || typeof answer.version !== 'string') {
    throw new Error(`${PLUGINS.details} answered no plugin`);
  }
  return { ...answer, versions: Array.isArray(answer.versions) ? answer.versions : [] } as PluginDetails;
}

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
