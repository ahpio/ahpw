import { describe, expect, it } from 'vitest';
import { createScena } from '@softov/scena/core';
import { ahpPaths, windowHost } from '../bridges/data.js';
import { ME } from '../bridges/me.js';
import { NO_OFFERS } from '../bridges/offers.js';
import { CLIENTS_SERVED } from '../resources/clients/state.js';
import { TUNNELS_SERVED } from '../resources/tunnels/state.js';
import { USERS_SERVED } from '../resources/users/state.js';
import { TEAMS_SERVED } from '../resources/teams/state.js';
import { MANAGE_SLOT, profileEntryTitle, registerManage } from './manage.js';

/** The Manage menu's ids, in its order, as it lists for the principal given. */
function menuAs(principal: string | undefined, embedded = false): string[] {
  const scena = createScena();
  scena.store.set(ahpPaths(windowHost()).offers, { ...NO_OFFERS, methods: [ME], ...(principal === undefined ? {} : { principal }) });
  registerManage(scena, embedded);
  return scena.commands.list({ slot: MANAGE_SLOT, enabled: true }).map((one) => one.id);
}

describe('the Manage menu', () => {
  it('lists the person just before Sign out', () => {
    const ids = menuAs('user:ana');
    expect(ids.slice(-2)).toEqual([`ahp.manage.profile.${windowHost()}`, 'ahp.manage.signOut']);
  });

  it('lists the host itself, under its own icon', () => {
    const ids = menuAs('root:dev');
    expect(ids.slice(-2)).toEqual([`ahp.manage.hostProfile.${windowHost()}`, 'ahp.manage.signOut']);
  });

  it('has no profile entry for nobody', () => {
    expect(menuAs(undefined).some((id) => id.startsWith('ahp.manage.profile.'))).toBe(false);
  });

  it('keeps the profile entry in an embedder, which has no Sign out', () => {
    expect(menuAs('user:ana', true).at(-1)).toBe(`ahp.manage.profile.${windowHost()}`);
  });

  it('lists the host pages, then the app choices, then the account, each group parted by a line', () => {
    const scena = createScena();
    scena.store.set(ahpPaths(windowHost()).offers, { ...NO_OFFERS, methods: [ME], principal: 'user:ana' });
    registerManage(scena, false);
    const rows = (): { id: string; category: string | undefined }[] => scena.commands.list({ slot: MANAGE_SLOT, enabled: true }).map((one) => ({ id: one.id, category: one.category }));
    expect(rows().map((one) => one.id)).not.toContain('ahp.manage.tunnels');
    for (const served of [TUNNELS_SERVED, CLIENTS_SERVED, USERS_SERVED, TEAMS_SERVED]) scena.store.set(served, true);
    expect(rows()).toEqual([
      { id: 'ahp.manage.host', category: 'host' },
      { id: 'ahp.manage.tunnels', category: 'host' },
      { id: 'ahp.manage.clients', category: 'host' },
      { id: 'ahp.manage.users', category: 'host' },
      { id: 'ahp.manage.teams', category: 'host' },
      { id: 'ahp.manage.language', category: 'app' },
      { id: 'ahp.manage.layout', category: 'app' },
      { id: 'ahp.manage.theme', category: 'app' },
      { id: 'ahp.manage.settings', category: 'app' },
      { id: `ahp.manage.profile.${windowHost()}`, category: 'account' },
      { id: 'ahp.manage.signOut', category: 'account' },
    ]);
  });
});

describe('profileEntryTitle', () => {
  it('is the id alone with one host, and names the host with several', () => {
    expect(profileEntryTitle('ana', 'dev', 1)).toBe('ana');
    expect(profileEntryTitle('ana', 'dev', 2)).toBe('ana \u{00B7} dev');
  });
});
