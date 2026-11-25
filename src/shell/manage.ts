import { combineDisposables, translate } from '@softov/scena';
import type { Disposable, Scena } from '@softov/scena/types';
import { ahpPaths, windowHost } from '../bridges/data.js';
import { everyHost, HOST_LIST, hostNameOf } from '../bridges/hosts.js';
import { profileOf } from '../bridges/me.js';
import { NO_OFFERS, type Offers } from '../bridges/offers.js';
import { english } from '../i18n/locales.js';
import { EMOJIcon } from '../resources/emojis.js';
import { CLIENTS_SERVED } from '../resources/clients/state.js';
import { TUNNELS_SERVED } from '../resources/tunnels/state.js';
import { USERS_SERVED } from '../resources/users/state.js';
import { TEAMS_SERVED } from '../resources/teams/state.js';
import { openPalette } from './CommandPalette.js';
import { localeList, themeList } from './commands.js';
import { listThemes, THEME_ID_PATH } from '@softov/scena/styles';
import { serveAsTool } from '../resources/agent-tools/registry.js';
import { AREAS, applyLayout, layoutMenu, MODE_IDS, VIEWS, type LayoutArgs } from './layout-menu.js';
import { disablePush, pushOn } from './notify/push.js';

/** The commands the activity bar's Manage gear lists, in its menu's order. */
export const MANAGE_SLOT = 'ahp:manage';

serveAsTool({
  id: 'ahp.manage.layout',
  order: 7,
  text: 'Set the main view or the layout mode, or show or hide an area.',
  input: () => ({
    type: 'object',
    properties: {
      view: { type: 'string', enum: VIEWS },
      mode: { type: 'string', enum: MODE_IDS },
      area: { type: 'string', description: 'Toggled', enum: AREAS },
    },
  }),
});
serveAsTool({
  id: 'ahp.manage.theme',
  order: 8,
  text: 'Set the theme.',
  input: () => ({ type: 'object', properties: { theme: { type: 'string', enum: listThemes().map((one) => one.id) } } }),
});

/** The menu's groups, which a line parts: the host's pages, then this app's choices, then the account. */
const HOST_GROUP = 'host';
const APP_GROUP = 'app';
const ACCOUNT_GROUP = 'account';

/**
 * The Manage menu, as VS Code's gear, in three groups: the host, and its
 * tunnels, clients, users and teams while a host lists them; language, layout
 * and theme, which open their lists in the palette, and settings; then the
 * account.
 */
export function registerManage(scena: Scena, embedded: boolean): Disposable {
  return combineDisposables(
    scena.commands.register({
      id: 'ahp.manage.host',
      title: () => translate('shell/nav/host'),
      keywords: [english('shell/nav/host')],
      icon: EMOJIcon.host,
      category: HOST_GROUP,
      slots: [MANAGE_SLOT],
      run: (ctx) => {
        ctx.host?.closeMenu();
        void ctx.scena.commands.execute('ahp.openHostInfo');
      },
    }),
    scena.commands.register({
      id: 'ahp.manage.tunnels',
      title: () => translate('tunnels/explorer/title'),
      keywords: [english('tunnels/explorer/title')],
      icon: EMOJIcon.tunnels,
      category: HOST_GROUP,
      slots: [MANAGE_SLOT],
      when: () => scena.store.get<boolean>(TUNNELS_SERVED) === true,
      run: (ctx) => {
        ctx.host?.closeMenu();
        void ctx.scena.commands.execute('ahp.showTunnels');
      },
    }),
    scena.commands.register({
      id: 'ahp.manage.clients',
      title: () => translate('clients/explorer/title'),
      keywords: [english('clients/explorer/title')],
      icon: EMOJIcon.clients,
      category: HOST_GROUP,
      slots: [MANAGE_SLOT],
      when: () => scena.store.get<boolean>(CLIENTS_SERVED) === true,
      run: (ctx) => {
        ctx.host?.closeMenu();
        void ctx.scena.commands.execute('ahp.showClients');
      },
    }),
    scena.commands.register({
      id: 'ahp.manage.users',
      title: () => translate('users/explorer/title'),
      keywords: [english('users/explorer/title')],
      icon: EMOJIcon.users,
      category: HOST_GROUP,
      slots: [MANAGE_SLOT],
      when: () => scena.store.get<boolean>(USERS_SERVED) === true,
      run: (ctx) => {
        ctx.host?.closeMenu();
        void ctx.scena.commands.execute('ahp.showUsers');
      },
    }),
    scena.commands.register({
      id: 'ahp.manage.teams',
      title: () => translate('teams/explorer/title'),
      keywords: [english('teams/explorer/title')],
      icon: EMOJIcon.teams,
      category: HOST_GROUP,
      slots: [MANAGE_SLOT],
      when: () => scena.store.get<boolean>(TEAMS_SERVED) === true,
      run: (ctx) => {
        ctx.host?.closeMenu();
        void ctx.scena.commands.execute('ahp.showTeams');
      },
    }),
    scena.commands.register({
      id: 'ahp.manage.language',
      title: () => translate('shell/manage/language'),
      keywords: [english('shell/manage/language')],
      icon: EMOJIcon.language,
      category: APP_GROUP,
      slots: [MANAGE_SLOT],
      run: (ctx) => {
        ctx.host?.closeMenu();
        openPalette(ctx.scena, localeList());
      },
    }),
    scena.commands.register({
      id: 'ahp.manage.layout',
      title: () => translate('shell/manage/layout'),
      keywords: [english('shell/manage/layout')],
      icon: EMOJIcon.layoutGroups,
      category: APP_GROUP,
      slots: [MANAGE_SLOT],
      run: async (ctx, args) => {
        ctx.host?.closeMenu();
        if (await applyLayout(ctx.scena, args as LayoutArgs | undefined)) return;
        openPalette(ctx.scena, layoutMenu(ctx.scena));
      },
    }),
    scena.commands.register({
      id: 'ahp.manage.theme',
      title: () => translate('shell/manage/theme'),
      keywords: [english('shell/manage/theme')],
      icon: EMOJIcon.theme,
      category: APP_GROUP,
      slots: [MANAGE_SLOT],
      run: (ctx, args) => {
        ctx.host?.closeMenu();
        const theme = (args as { theme?: string } | undefined)?.theme;
        if (theme !== undefined && listThemes().some((one) => one.id === theme)) {
          ctx.scena.store.set(THEME_ID_PATH, theme);
          return;
        }
        openPalette(ctx.scena, themeList(ctx.scena));
      },
    }),
    scena.commands.register({
      id: 'ahp.manage.settings',
      title: () => translate('shell/manage/settings'),
      keywords: [english('shell/manage/settings')],
      icon: EMOJIcon.settings,
      category: APP_GROUP,
      slots: [MANAGE_SLOT],
      run: (ctx) => {
        ctx.host?.closeMenu();
        void ctx.scena.commands.execute('ahp.openSettings');
      },
    }),
    accountGroup(scena, embedded),
  );
}

/** A profile entry's id and icon, for a person and for the host itself. */
const PROFILE_KINDS = [
  { kind: 'user', id: 'ahp.manage.profile', icon: EMOJIcon.users },
  { kind: 'root', id: 'ahp.manage.hostProfile', icon: EMOJIcon.host },
] as const;

/** How a host's profile entry reads: the person's id or the host's, and the host's name beside it when there are several. */
export function profileEntryTitle(id: string, hostName: string, hosts: number): string {
  return hosts > 1 ? `${id} \u{00B7} ${hostName}` : id;
}

/**
 * The account group, parted from the rest with a line: the person, or
 * the host itself, on each host with a profile, then Sign out. The menu lists in
 * registration order, so the group is registered again whenever the hosts
 * change, and a host added later still lands above Sign out.
 */
function accountGroup(scena: Scena, embedded: boolean): Disposable {
  const offersOf = (host: string): Offers => scena.store.get<Offers>(ahpPaths(host).offers) ?? NO_OFFERS;
  const register = (): Disposable => combineDisposables(
    // One entry per kind, as an entry's icon is fixed when it registers, before the host has said who this is.
    ...everyHost(scena.store).flatMap((host) => PROFILE_KINDS.map(({ kind, id, icon }) => scena.commands.register({
      id: `${id}.${host}`,
      title: () => profileEntryTitle(profileOf(offersOf(host))?.id ?? '', hostNameOf(scena.store, host), everyHost(scena.store).length),
      keywords: [english('profile/title')],
      icon,
      category: ACCOUNT_GROUP,
      slots: [MANAGE_SLOT],
      // Read when the menu lists, so it follows the host's handshake.
      when: () => profileOf(offersOf(host))?.kind === kind,
      run: (ctx) => {
        ctx.host?.closeMenu();
        void ctx.scena.commands.execute('ahp.openProfile', { host });
      },
    }))),
    // Left out in an embedder, which holds the token.
    ...(embedded ? [] : [scena.commands.register({
      id: 'ahp.manage.signOut',
      title: () => translate('shell/manage/signOut'),
      keywords: [english('shell/manage/signOut')],
      icon: EMOJIcon.signOut,
      category: ACCOUNT_GROUP,
      slots: [MANAGE_SLOT],
      run: (ctx) => {
        ctx.host?.closeMenu();
        /*
         * The device leaves the window's host first, while this person can
         * still take it off: the host refuses the next person a device that
         * another person registered.
         */
        const off = pushOn() ? disablePush(offersOf(windowHost())).catch(() => undefined) : Promise.resolve();
        void off.then(() => ctx.scena.commands.execute('sigillum.signout'));
      },
    })]),
  );
  let held = register();
  const watching = scena.store.subscribe(HOST_LIST, () => {
    held.dispose();
    held = register();
  });
  return {
    dispose: () => {
      watching.dispose();
      held.dispose();
    },
  };
}
