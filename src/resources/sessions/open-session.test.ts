import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createScena } from '@softov/scena/core';
import { registerSessions, type OpenSessionArgs } from './index.js';
import { RIGHT_SIDEBAR } from '../../shell/right-sidebar.js';
import { SESSION_OPENS } from './view-settings.js';
import { sessionKey } from './focus.js';

const held = new Map<string, string>();
beforeEach(() => {
  held.clear();
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: { getItem: (k: string) => held.get(k) ?? null, setItem: (k: string, v: string) => void held.set(k, v), removeItem: (k: string) => void held.delete(k) },
  });
});
afterEach(() => {
  Reflect.deleteProperty(globalThis, 'localStorage');
});

describe('ahp.openSession', () => {
  const setup = () => {
    const scena = createScena();
    const sub = registerSessions(scena);
    const open = (args: OpenSessionArgs) => scena.commands.execute('ahp.openSession', args);
    const key = sessionKey('h', 'ahp-session://a');
    const where = () => scena.surfaces.listSurfaces().find((s) => scena.surfaces.listAt(s).some((m) => m.key === key));
    return { scena, open, where, key, dispose: () => sub.dispose() };
  };

  it('opens on main with nothing set', async () => {
    const { open, where, dispose } = setup();
    await open({ host: 'h', resource: 'ahp-session://a' });
    expect(where()).toBe('main');
    dispose();
  });

  it('opens in the right sidebar when ui.sessionOpens says right, and shows it', async () => {
    const { scena, open, where, dispose } = setup();
    SESSION_OPENS.set(scena.store, 'right');
    scena.layout.setSurface(RIGHT_SIDEBAR, { visible: false });
    await open({ host: 'h', resource: 'ahp-session://a' });
    expect(where()).toBe(RIGHT_SIDEBAR);
    expect(scena.layout.get().surfaces[RIGHT_SIDEBAR]?.visible).toBe(true);
    dispose();
  });

  it('opens where the caller says, over the setting', async () => {
    const { scena, open, where, dispose } = setup();
    SESSION_OPENS.set(scena.store, 'right');
    await open({ host: 'h', resource: 'ahp-session://a', place: 'main' });
    expect(where()).toBe('main');
    dispose();
  });

  it('focuses an open session where a person moved it', async () => {
    const { scena, open, where, key, dispose } = setup();
    await open({ host: 'h', resource: 'ahp-session://a' });
    scena.surfaces.move({ key, toSurface: RIGHT_SIDEBAR });
    scena.layout.setSurface(RIGHT_SIDEBAR, { visible: false });
    await open({ host: 'h', resource: 'ahp-session://a' });
    await open({ host: 'h', resource: 'ahp-session://a', place: 'main' });
    expect(where()).toBe(RIGHT_SIDEBAR);
    expect(scena.layout.get().surfaces[RIGHT_SIDEBAR]?.visible).toBe(true);
    dispose();
  });

  it('opens a closed session at the place again', async () => {
    const { scena, open, where, key, dispose } = setup();
    await open({ host: 'h', resource: 'ahp-session://a' });
    scena.surfaces.move({ key, toSurface: RIGHT_SIDEBAR });
    scena.surfaces.close(key);
    await open({ host: 'h', resource: 'ahp-session://a' });
    expect(where()).toBe('main');
    dispose();
  });
});
