/**
 * What the root state's `_meta` says about the host, as its `initialize`
 * answer carries it: the build, the machine, and each agent's settings page.
 * ahpd writes these keys as VS Code reads them.
 * https://github.com/microsoft/vscode/blob/6b68d3fe7dd7db9a3aaa052efc1f3a1fd4432eb2/src/vs/platform/agentHost/common/agentCustomizationSettings.ts#L8
 */

/** The machine the host runs on, as `vscode.agentHost.resources` names it; a key the host left out is absent. */
export interface HostMachine {
  platform?: string;
  architecture?: string;
  cpus?: number;
  memoryBytes?: number;
}

/** One agent's settings page, as an entry of `vscode.agentCustomizationSettings` names it. */
export interface SettingsPage {
  provider: string;
  title: string;
  description?: string;
  /** The keys of the settings on the page. */
  keys: string[];
}

export interface HostAbout {
  /** The host's build, from `hostBuild`. */
  build?: string;
  machine?: HostMachine;
  settings: SettingsPage[];
}

export const NO_ABOUT: HostAbout = { settings: [] };

/** A machine's memory in GiB, as `15.6 GiB`. */
export const memoryWords = (bytes: number): string => `${(bytes / 2 ** 30).toFixed(1)} GiB`;

function bag(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

const text = (value: unknown): string | undefined => (typeof value === 'string' && value !== '' ? value : undefined);
const count = (value: unknown): number | undefined => (typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : undefined);

function machineOf(value: unknown): HostMachine | undefined {
  const held = bag(value);
  if (held === null) return undefined;
  const platform = text(held.platform);
  const architecture = text(held.architecture);
  const cpus = count(held.cpuCount);
  const memoryBytes = count(held.memoryBytes);
  const machine: HostMachine = {
    ...(platform === undefined ? {} : { platform }),
    ...(architecture === undefined ? {} : { architecture }),
    ...(cpus === undefined ? {} : { cpus }),
    ...(memoryBytes === undefined ? {} : { memoryBytes }),
  };
  return Object.keys(machine).length === 0 ? undefined : machine;
}

function pagesOf(value: unknown): SettingsPage[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((one): SettingsPage[] => {
    const entry = bag(one);
    const provider = text(entry?.provider);
    if (entry === null || provider === undefined) return [];
    const keys = Array.isArray(entry.settings) ? entry.settings.map((setting) => text(bag(setting)?.key)).filter((key): key is string => key !== undefined) : [];
    const description = text(entry.description);
    return [{ provider, title: text(entry.title) ?? provider, ...(description === undefined ? {} : { description }), keys }];
  });
}

/** What a root `_meta` says about the host. */
export function aboutOf(meta: unknown): HostAbout {
  const held = bag(meta);
  if (held === null) return NO_ABOUT;
  const build = text(bag(held.hostBuild)?.version);
  const machine = machineOf(held['vscode.agentHost.resources']);
  return {
    ...(build === undefined ? {} : { build }),
    ...(machine === undefined ? {} : { machine }),
    settings: pagesOf(held['vscode.agentCustomizationSettings']),
  };
}

/** The `_meta` of the root state an `initialize` answer's snapshots carry, or undefined. */
export function rootMetaOf(result: unknown, root: string): unknown {
  const snapshots = bag(result)?.snapshots;
  if (!Array.isArray(snapshots)) return undefined;
  const snapshot = snapshots.map(bag).find((one) => one?.resource === root);
  return bag(snapshot?.state)?._meta;
}
