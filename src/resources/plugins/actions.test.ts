import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { BindingPath } from '@softov/scena/types';
import type { ListedPlugin, PluginRow } from '../../bridges/plugins.js';
import { installListed, reloadOne, togglePlugin } from './actions.js';
import { INSTALLING } from './state.js';

const { confirm, failed, enablePlugin, disablePlugin, reloadPlugin, installPlugin, refresh } = vi.hoisted(() => ({
  confirm: vi.fn(),
  failed: vi.fn(),
  enablePlugin: vi.fn(),
  disablePlugin: vi.fn(),
  reloadPlugin: vi.fn(),
  installPlugin: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock('../../shell/notify/index.js', () => ({ confirm, failed }));
vi.mock('../../bridges/data.js', () => ({ hostBridge: () => ({ refresh }), ROOT: 'ahp-root://' }));
vi.mock('../../bridges/plugins.js', async (actual) => ({ ...(await actual<object>()), enablePlugin, disablePlugin, reloadPlugin, installPlugin }));

const row = (enabled: boolean): PluginRow => ({ spec: { source: './bot', enabled }, state: 'ready' }) as unknown as PluginRow;
const listed: ListedPlugin = { id: 'bot', name: 'Bot', source: '@ahpd/bot', marketplace: 'https://example.com/plugins.json' } as ListedPlugin;

/** A store for the install marks, as the page's scena store holds them. */
const marks = () => {
  const held = new Map<BindingPath, unknown>();
  const seen: unknown[] = [];
  return {
    seen,
    get: <T>(path: BindingPath) => held.get(path) as T | undefined,
    set: (path: BindingPath, value: unknown) => { held.set(path, value); if (path === INSTALLING) seen.push(value); },
  };
};

beforeEach(() => {
  for (const mock of [confirm, failed, enablePlugin, disablePlugin, reloadPlugin, installPlugin, refresh]) mock.mockReset();
  refresh.mockResolvedValue(undefined);
  installPlugin.mockResolvedValue({ id: 'bot' });
});

describe('togglePlugin', () => {
  it('sends nothing on a no', async () => {
    confirm.mockResolvedValue(false);
    await togglePlugin('h', 'bot', row(true));
    await togglePlugin('h', 'bot', row(false));
    expect(disablePlugin).not.toHaveBeenCalled();
    expect(enablePlugin).not.toHaveBeenCalled();
  });

  it('asks to disable in the danger tone, and disables on a yes', async () => {
    confirm.mockResolvedValue(true);
    await togglePlugin('h', 'bot', row(true));
    expect(confirm).toHaveBeenCalledWith(expect.objectContaining({ tone: 'danger' }));
    expect(disablePlugin).toHaveBeenCalledWith('h', 'bot');
  });

  it('asks to enable in the default tone, and enables on a yes', async () => {
    confirm.mockResolvedValue(true);
    await togglePlugin('h', 'bot', row(false));
    expect(confirm).toHaveBeenCalledWith(expect.objectContaining({ tone: 'default' }));
    expect(enablePlugin).toHaveBeenCalledWith('h', 'bot');
  });
});

describe('reloadOne', () => {
  it('sends nothing on a no, and reimports on a yes', async () => {
    confirm.mockResolvedValue(false);
    await reloadOne('h', 'bot');
    expect(reloadPlugin).not.toHaveBeenCalled();
    confirm.mockResolvedValue(true);
    await reloadOne('h', 'bot');
    expect(reloadPlugin).toHaveBeenCalledWith('h', 'bot');
  });
});

describe('installListed', () => {
  it('sends nothing and marks nothing on a no', async () => {
    confirm.mockResolvedValue(false);
    const store = marks();
    expect(await installListed(store, 'h', listed)).toBeUndefined();
    expect(installPlugin).not.toHaveBeenCalled();
    expect(store.seen).toEqual([]);
  });

  it('installs the version it names on a yes, and answers the new id', async () => {
    confirm.mockResolvedValue(true);
    const store = marks();
    expect(await installListed(store, 'h', listed, '1.2.0')).toBe('bot');
    expect(installPlugin).toHaveBeenCalledWith('h', '@ahpd/bot@1.2.0', listed.marketplace);
    expect(store.seen).toHaveLength(2);
  });
});
