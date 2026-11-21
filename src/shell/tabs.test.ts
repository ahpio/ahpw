import { describe, expect, it, vi } from 'vitest';
import { createScena } from '@softov/scena/core';

describe('keepTabs', () => {
  it('gives the focus back to the tab that had it, not to the last tab opened', async () => {
    const held = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => held.get(key) ?? null,
      setItem: (key: string, value: string) => { held.set(key, value); },
      removeItem: (key: string) => { held.delete(key); },
    });
    const mount = (key: string) => ({ key, surface: 'main', component: { component: 'Page' }, state: {}, openedAt: 1 });
    held.set('ahpd-web.session.v1', JSON.stringify({ version: 1, capturedAt: 1, mounts: [mount('a'), mount('b')], surfaces: {} }));
    // The store is made on import, so it sees the stubbed storage.
    const { keepTabs } = await import('./tabs.js');
    const scena = createScena();
    scena.components.register({ component: 'Page', category: 'page', renderer: { kind: 'react', load: async () => ({ default: () => null }) } });
    scena.layout.setSurface('main', { visible: true, activeContainerKey: 'a' });

    const kept = await keepTabs(scena, () => true);
    expect(scena.surfaces.listAt('main').map((one) => one.key)).toEqual(['a', 'b']);
    expect(scena.layout.get().surfaces.main?.activeContainerKey).toBe('a');
    kept?.dispose();
    vi.unstubAllGlobals();
  });

  it('keeps the tabs of main, the right sidebar and a window, each with its title, and not a sidebar view', async () => {
    const held = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => held.get(key) ?? null,
      setItem: (key: string, value: string) => { held.set(key, value); },
      removeItem: (key: string) => { held.delete(key); },
    });
    vi.resetModules();
    const { keepTabs } = await import('./tabs.js');
    const { mountRight } = await import('./right-sidebar.js');
    const first = createScena();
    first.components.register({ component: 'Page', category: 'page', renderer: { kind: 'react', load: async () => ({ default: () => null }) } });
    const view = mountRight(first, { key: 'details', resource: { component: 'Page' }, props: { title: 'Details' } }, 'i');
    await keepTabs(first, () => true);
    for (const [surface, key] of [['main', 'a'], ['sidebar:right', 'b'], ['window:1', 'c'], ['panel:bottom', 'd']] as const) {
      first.surfaces.open({ surface, key, resource: { component: 'Page' }, props: { title: `Tab ${key}`, icon: 'x' } } as never);
    }
    await first.session.save();
    const saved = JSON.parse(held.get('ahpd-web.session.v1') ?? '{}') as { mounts: { key: string; surface: string; props?: object }[] };
    expect(saved.mounts.map((one) => `${one.surface}:${one.key}`).sort()).toEqual(['main:a', 'sidebar:right:b', 'window:1:c']);
    expect(saved.mounts.find((one) => one.key === 'b')?.props).toEqual({ title: 'Tab b' });

    const second = createScena();
    second.components.register({ component: 'Page', category: 'page', renderer: { kind: 'react', load: async () => ({ default: () => null }) } });
    const kept = await keepTabs(second, () => true);
    expect(second.surfaces.listAt('sidebar:right').map((one) => [one.key, one.props?.title])).toEqual([['b', 'Tab b']]);
    expect(second.surfaces.listAt('window:1').map((one) => one.key)).toEqual(['c']);
    kept?.dispose();
    view.dispose();
    vi.unstubAllGlobals();
  });
});
