import type { BindingPath, Disposable, Scena } from '@softov/scena/types';
import { combineDisposables, translate, type ModusClass } from '@softov/scena';
import { PALETTE_SLOT } from '../../shell/CommandPalette.js';
import { hideOverlaidSidebar } from '../sessions/index.js';
import { ahpPaths, hostBridge } from '../../bridges/data.js';
import { HOST_FILTER_ACTION, shownHosts } from '../../bridges/hosts.js';
import { NO_OFFERS, type Offers } from '../../bridges/offers.js';
import { PLUGINS, servesPlugins } from '../../bridges/plugins.js';
import { trackServed } from '../../bridges/served.js';
import { registerChoice } from '../../shell/explorer/choice.js';
import { readLastHost, startHost } from '../sessions/last-host.js';
import { EMOJIcon } from '../emojis.js';
import { bound, english } from '../../i18n/locales.js';
import { PLUGIN_GROUPINGS } from './rows.js';
import { applyAll } from './actions.js';
import { ACTIVE_PLUGIN, GROUP_KEY, newPluginTab, pluginTab, PLUGINS_ADD, PLUGINS_APPLY, PLUGINS_GROUP, PLUGINS_SERVED } from './state.js';

/** The display size class the modus backend publishes. */
const MODUS_CLASS = '$/modus/class' as BindingPath;

/** The sidebar section the plugins list shows in. */
export const PLUGINS_SECTION = 'ahp:plugins';

/** The menu of the list's Group button. */
const GROUP_SLOT = 'plugins:group';

/** Arguments of the commands about one plugin. */
export interface PluginArgs {
  host?: string;
  id?: string;
}

/** The host's plugins: a list grouped by state or by category, and a page that shows, enables and configures each. */
export function registerPlugins(scena: Scena): Disposable {
  const offersOf = (host: string): Offers => scena.store.get<Offers>(ahpPaths(host).offers) ?? NO_OFFERS;
  const servingHosts = (): string[] => shownHosts(scena.store).filter((host) => servesPlugins(offersOf(host)));
  const served = (): boolean => scena.store.get<boolean>(PLUGINS_SERVED) === true;
  const adds = (offers: Offers): boolean => offers.methods.includes(PLUGINS.install) || offers.methods.includes(PLUGINS.write);

  const open = (_ctx: unknown, args: unknown): void => {
    const target = (args ?? {}) as PluginArgs;
    const host = target.host ?? startHost(servingHosts(), readLastHost());
    if (host === undefined || target.id === undefined) return;
    scena.store.set(ACTIVE_PLUGIN, { host, id: target.id });
    // `plugin`, not `id`: the page's plugin id, which scena's own `id` would shadow.
    scena.surfaces.open({
      surface: 'main',
      key: pluginTab(host, target.id),
      resource: { component: 'PluginPage', host, plugin: target.id },
      props: { title: target.id },
    });
    hideOverlaidSidebar(scena, scena.store.get<ModusClass>(MODUS_CLASS) ?? 'large');
  };

  return combineDisposables(
    // The view kinds scena's catalog does not register: a bar with its header
    // and footer, a time in the reader's zone, and a label with its value. A
    // plugin's view and a record's view draw all three.
    scena.components.register({ component: 'Progress', category: 'inline', renderer: { kind: 'react', load: () => import('./ViewProgress.js') } }),
    scena.components.register({ component: 'DateTime', category: 'inline', renderer: { kind: 'react', load: () => import('./DateTime.js') } }),
    scena.components.register({ component: 'KeyValue', category: 'inline', renderer: { kind: 'react', load: () => import('./KeyValue.js') } }),
    trackServed(scena, PLUGINS.scheme, PLUGINS_SERVED),
    trackServed(scena, (offers) => offers.methods.includes(PLUGINS.apply), PLUGINS_APPLY),
    trackServed(scena, adds, PLUGINS_ADD),
    registerChoice(scena, { resource: 'plugins', name: 'group', slot: GROUP_SLOT, path: PLUGINS_GROUP, values: PLUGIN_GROUPINGS, usual: 'state', key: GROUP_KEY }),
    scena.components.register({
      component: 'PluginsExplorer',
      category: 'page',
      renderer: { kind: 'react', load: () => import('./Explorer.js') },
      props: {
        title: { t: 'plugins/explorer/title' },
        actions: [
          { command: 'ahp.newPlugin', icon: '+', label: { t: 'plugins/commands/new' }, when: `${PLUGINS_ADD} == true` },
          { command: 'plugins.reload', icon: EMOJIcon.reload, label: { t: 'common/reload' } },
          { command: 'plugins.apply', icon: EMOJIcon.apply, label: { t: 'plugins/actions/apply' }, when: `${PLUGINS_APPLY} == true` },
          { command: 'plugins.group', menu: GROUP_SLOT, icon: EMOJIcon.group, label: { t: 'plugins/explorer/group' }, active: `${PLUGINS_GROUP} != null` },
          HOST_FILTER_ACTION,
        ],
      },
    }),
    scena.components.register({ component: 'NewPluginPage', category: 'page', props: { icon: EMOJIcon.hostPlugins }, renderer: { kind: 'react', load: () => import('./NewPluginPage.js') } }),
    scena.components.register({ component: 'PluginPage', category: 'page', props: { icon: EMOJIcon.hostPlugins }, renderer: { kind: 'react', load: () => import('./PluginPage.js') } }),
    scena.commands.register({
      id: 'plugins.reload',
      title: () => translate('common/reload'),
      run: () => Promise.all(servingHosts().map((host) => hostBridge(host).refresh(PLUGINS.channel))),
    }),
    scena.commands.register({
      id: 'plugins.apply',
      title: () => translate('plugins/actions/apply'),
      run: () => applyAll(servingHosts().filter((host) => offersOf(host).methods.includes(PLUGINS.apply))),
    }),
    scena.commands.register({
      id: 'ahp.showPlugins',
      title: () => translate('plugins/commands/show'),
      keywords: [english('plugins/commands/show')],
      category: 'Plugins',
      slots: [PALETTE_SLOT],
      when: served,
      run: (ctx) => ctx.commands.execute('sidebar.activate', { section: PLUGINS_SECTION }),
    }),
    scena.commands.register({
      id: 'ahp.newPlugin',
      title: () => translate('plugins/commands/new'),
      keywords: [english('plugins/commands/new')],
      category: 'Plugins',
      slots: [PALETTE_SLOT],
      when: () => scena.store.get<boolean>(PLUGINS_ADD) === true,
      run: (_ctx, args) => {
        const host = (args as PluginArgs | undefined)?.host ?? startHost(servingHosts().filter((one) => adds(offersOf(one))), readLastHost());
        if (host === undefined) return;
        scena.surfaces.open({ surface: 'main', key: newPluginTab(host), resource: { component: 'NewPluginPage', host }, props: { title: bound('plugins/new/title') } });
        hideOverlaidSidebar(scena, scena.store.get<ModusClass>(MODUS_CLASS) ?? 'large');
      },
    }),
    scena.commands.register({ id: 'ahp.openPlugin', title: () => translate('plugins/commands/open'), run: open }),
    scena.surfaces.mount({
      surface: 'sidebar:left',
      key: 'plugins:explorer',
      when: `$/layout/surfaces/sidebar:left/section == "${PLUGINS_SECTION}"`,
      resource: { component: 'PluginsExplorer' },
    }),
  );
}
