import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { RootState } from '@microsoft/agent-host-protocol';
import { NO_OFFERS } from './offers.js';
import { disablePlugin, enablePlugin, installPlugin, PLUGINS, pluginsReducer, removePlugin, restartNeeded, servesPlugins, specEnabled, writePlugin, type PluginRow } from './plugins.js';

const request = vi.hoisted(() => vi.fn());

vi.mock('./data.js', () => ({ hostBridge: () => ({ request }) }));

const BOT: PluginRow = { spec: '@ahpd/bot', name: 'bot', state: 'ready', manifest: { categories: ['channel'] } };

beforeEach(() => {
  request.mockReset();
});

describe('the plugins channel', () => {
  it('folds added, changed and removed rows', () => {
    let state = pluginsReducer({ records: [] }, { type: 'x-ahpd-plugins/added', id: 'bot', record: BOT });
    state = pluginsReducer(state, { type: 'x-ahpd-plugins/changed', id: 'bot', record: { ...BOT, state: 'disabled' } });
    expect(state.records).toEqual([{ id: 'bot', record: { ...BOT, state: 'disabled' } }]);
    state = pluginsReducer(state, { type: 'x-ahpd-plugins/removed', id: 'bot' });
    expect(state.records).toEqual([]);
  });

  it('is served while the host offers it', () => {
    expect(servesPlugins({ ...NO_OFFERS, channels: [PLUGINS.scheme] })).toBe(true);
    expect(servesPlugins(NO_OFFERS)).toBe(false);
  });
});

describe('enable and disable', () => {
  it('send the id and read what the host answers', async () => {
    request.mockResolvedValue({ id: 'bot', enabled: true, restart: true });
    await expect(enablePlugin('h', 'bot')).resolves.toEqual({ id: 'bot', enabled: true, restart: true });
    expect(request).toHaveBeenLastCalledWith(PLUGINS.enable, { id: 'bot' });
    request.mockResolvedValue({ id: 'bot', enabled: false, restart: true });
    await disablePlugin('h', 'bot');
    expect(request).toHaveBeenLastCalledWith(PLUGINS.disable, { id: 'bot' });
  });

  it('refuse an answer that names no plugin', async () => {
    request.mockResolvedValue({});
    await expect(enablePlugin('h', 'bot')).rejects.toThrow('answered no plugin');
  });
});

describe('install, write and remove', () => {
  it('install sends the source and reads the id and the restart', async () => {
    request.mockResolvedValue({ id: 'weather', restart: true });
    await expect(installPlugin('h', 'github:example/weather')).resolves.toEqual({ id: 'weather', restart: true });
    expect(request).toHaveBeenLastCalledWith(PLUGINS.install, { source: 'github:example/weather' });
  });

  it('write sends the id and both files as given', async () => {
    request.mockResolvedValue({ id: 'weather' });
    await expect(writePlugin('h', 'weather', 'export function apply() {}', '{"name":"weather"}')).resolves.toEqual({ id: 'weather', restart: false });
    expect(request).toHaveBeenLastCalledWith(PLUGINS.write, { id: 'weather', source: 'export function apply() {}', packageJson: '{"name":"weather"}' });
  });

  it('remove sends keep only when it is asked for', async () => {
    request.mockResolvedValue({ id: 'bot', restart: false });
    await removePlugin('h', 'bot', false);
    expect(request).toHaveBeenLastCalledWith(PLUGINS.remove, { id: 'bot' });
    await removePlugin('h', 'bot', true);
    expect(request).toHaveBeenLastCalledWith(PLUGINS.remove, { id: 'bot', keep: true });
  });

  it('refuse an answer that names no plugin', async () => {
    request.mockResolvedValue({ restart: true });
    await expect(installPlugin('h', 'x')).rejects.toThrow('answered no plugin');
    request.mockResolvedValue(null);
    await expect(removePlugin('h', 'bot', false)).rejects.toThrow('answered no plugin');
  });
});

describe('restartNeeded', () => {
  it('reads the mark in the root config the host changes', () => {
    const schema = { type: 'object', properties: {} };
    expect(restartNeeded({ config: { schema, values: { 'ahpd.restartNeeded': true } } } as unknown as RootState)).toBe(true);
    expect(restartNeeded({ config: { schema, values: {} } } as unknown as RootState)).toBe(false);
    expect(restartNeeded({ _meta: { 'ahpd.restartNeeded': true } } as unknown as RootState)).toBe(false);
    expect(restartNeeded(undefined)).toBe(false);
  });
});

describe('specEnabled', () => {
  it('is on for a bare module and for a spec not turned off', () => {
    expect(specEnabled('@ahpd/bot')).toBe(true);
    expect(specEnabled({ name: '@ahpd/bot' })).toBe(true);
    expect(specEnabled({ name: '@ahpd/bot', enabled: false })).toBe(false);
  });
});
