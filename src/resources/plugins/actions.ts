import { translate } from '@softov/scena';
import { hostBridge, ROOT } from '../../bridges/data.js';
import type { Offers } from '../../bridges/offers.js';
import { applyPlugins, callPluginMethod, disablePlugin, enablePlugin, installPlugin, PLUGINS, reloadPlugin, removePlugin, specEnabled, type ListedPlugin, type PluginRow } from '../../bridges/plugins.js';
import { confirm, failed } from '../../shell/notify/index.js';
import type { BindingPath } from '@softov/scena/types';
import { INSTALLING, installKey } from './state.js';

/** Whether the host offers the command that turns this plugin the other way. */
export function mayToggle(offers: Offers, row: PluginRow): boolean {
  return offers.methods.includes(specEnabled(row.spec) ? PLUGINS.disable : PLUGINS.enable);
}

/** The command that turns this plugin the other way. */
export const toggleMethod = (row: PluginRow): string => (specEnabled(row.spec) ? PLUGINS.disable : PLUGINS.enable);

/** Whether the host offers to import a plugin's code again. */
export const mayReload = (offers: Offers): boolean => offers.methods.includes(PLUGINS.reload);

/** Whether the host offers to take a plugin out of its configuration. */
export const mayRemove = (offers: Offers): boolean => offers.methods.includes(PLUGINS.remove);

/** Whether a host answers the plugins its lists hold. */
export const mayList = (offers: Offers): boolean => offers.methods.includes(PLUGINS.available) && offers.methods.includes(PLUGINS.details);

/** Whether a host installs a plugin for this reader. */
export const mayInstall = (offers: Offers): boolean => offers.methods.includes(PLUGINS.install);

/** Whether a listed plugin is installed at a version a person names: an npm source takes `<name>@<version>`, and a `github:` one does not. */
export const versionsInstall = (plugin: ListedPlugin): boolean => !plugin.source.startsWith('github:');

/** Where the installs that run now are kept: the scena store, read with `INSTALLING`. */
export interface InstallMarks {
  get<T>(path: BindingPath): T | undefined;
  set(path: BindingPath, value: unknown): void;
}

/**
 * Install a listed plugin from its own list, at `version` when one is named,
 * then read the list again. While it runs, `INSTALLING` names it, so the
 * sidebar's row and the plugin's page both show it installing. Asks first.
 * Answers the id of the new row, or nothing when the person said no or the
 * host refused, which is said.
 */
export async function installListed(marks: InstallMarks, host: string, plugin: ListedPlugin, version?: string): Promise<string | undefined> {
  const title = plugin.name ?? plugin.id;
  if (!(await confirm({
    title: version === undefined ? translate('plugins/listed/installTitle', { title }) : translate('plugins/listed/installVersionTitle', { title, version }),
    body: translate('plugins/listed/installBody'),
    confirmLabel: version === undefined ? translate('plugins/listed/install') : translate('plugins/listed/installVersion', { version }),
  }))) return undefined;
  const key = installKey(host, plugin.marketplace, plugin.id);
  const held = (): string[] => marks.get<string[]>(INSTALLING) ?? [];
  marks.set(INSTALLING, [...held().filter((one) => one !== key), key]);
  try {
    const answer = await installPlugin(host, version === undefined ? plugin.source : `${plugin.source}@${version}`, plugin.marketplace);
    await rereadAfterChange(host);
    return answer.id;
  } catch (error) {
    failed(translate('plugins/listed/installFailed', { title }), error);
    return undefined;
  } finally {
    marks.set(INSTALLING, held().filter((one) => one !== key));
  }
}

/**
 * Takes a plugin out of the configuration once the person says so; `keep`
 * leaves its package installed. Answers whether it went, so the page closes
 * its tab. A refusal is the host's, in its words.
 */
export async function removeOne(host: string, id: string, title: string, keep: boolean): Promise<boolean> {
  if (!(await confirm({
    title: translate('plugins/remove/confirmTitle', { title }),
    body: translate(keep ? 'plugins/remove/confirmKeep' : 'plugins/remove/confirmUninstall'),
    confirmLabel: translate('plugins/remove/button'),
    tone: 'danger',
  }))) return false;
  try {
    await removePlugin(host, id, keep);
    await rereadAfterChange(host);
    return true;
  } catch (error) {
    failed(translate('plugins/remove/failed', { title }), error);
    return false;
  }
}

/** What the host says a command does, as a button's tooltip. */
export const saidOf = (offers: Offers, method: string): string | undefined => offers.described[method];

/**
 * Turns a plugin the other way, then reads the list and the root again, so the
 * row, the page and the restart note show what the host holds now. Asks
 * first; a refusal is the host's, in its words.
 */
export async function togglePlugin(host: string, id: string, row: PluginRow): Promise<void> {
  const on = specEnabled(row.spec);
  const verb = on ? 'disable' : 'enable';
  if (!(await confirm({
    title: translate(`plugins/actions/${verb}Title`, { id }),
    body: translate(`plugins/actions/${verb}Body`),
    confirmLabel: translate(`plugins/actions/${verb}`),
    tone: on ? 'danger' : 'default',
  }))) return;
  try {
    await (on ? disablePlugin(host, id) : enablePlugin(host, id));
    await rereadAfterChange(host);
  } catch (error) {
    failed(translate(on ? 'plugins/actions/disableFailed' : 'plugins/actions/enableFailed', { id }), error);
  }
}

/** Imports a plugin's code again once a person has said yes, then reads the list and the root again. */
export async function reloadOne(host: string, id: string): Promise<void> {
  if (!(await confirm({
    title: translate('plugins/actions/reimportTitle', { id }),
    body: translate('plugins/actions/reimportBody'),
    confirmLabel: translate('plugins/actions/reimport'),
  }))) return;
  try {
    await reloadPlugin(host, id);
    await rereadAfterChange(host);
  } catch (error) {
    failed(translate('plugins/actions/reimportFailed', { id }), error);
  }
}

/** Calls the method a Button of a plugin's view names; the host sends the row again when the view changes. */
export async function callViewMethod(host: string, id: string, method: string, params: Record<string, unknown>): Promise<void> {
  try {
    await callPluginMethod(host, method, params);
  } catch (error) {
    failed(translate('plugins/actions/viewFailed', { id }), error);
  }
}

/** Matches each host's running plugins to its configuration file, then reads each one again. */
export async function applyAll(hosts: readonly string[]): Promise<void> {
  await Promise.all(hosts.map(async (host) => {
    try {
      await applyPlugins(host);
      await rereadAfterChange(host);
    } catch (error) {
      failed(translate('plugins/actions/applyFailed'), error);
    }
  }));
}

/**
 * Reads the list and the root again after a command changed the
 * configuration. ahpd pushes `x-ahpd/restartNeeded` to a client already
 * watching the root, but the protocol client drops a notification it does not
 * know, so the root's `ahpd.restartNeeded` is read back instead.
 */
export async function rereadAfterChange(host: string): Promise<void> {
  await Promise.all([hostBridge(host).refresh(PLUGINS.channel), hostBridge(host).refresh(ROOT)]);
}
