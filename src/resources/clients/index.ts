import type { BindingPath, Disposable, Scena } from '@softov/scena/types';
import { combineDisposables, translate, type ModusClass } from '@softov/scena';
import { PALETTE_SLOT } from '../../shell/CommandPalette.js';
import { hideOverlaidSidebar } from '../sessions/index.js';
import { ahpPaths, hostBridge } from '../../bridges/data.js';
import { HOST_FILTER_ACTION, shownHosts } from '../../bridges/hosts.js';
import type { Offers } from '../../bridges/offers.js';
import { trackServed } from '../../bridges/served.js';
import { EMOJIcon } from '../emojis.js';
import { english } from '../../i18n/locales.js';
import { ACTIVE_CLIENT, CLIENTS_SERVED } from './state.js';
import { CLIENTS, CLIENTS_SCHEME } from './rows.js';

/** The display size class the modus backend publishes. */
const MODUS_CLASS = '$/modus/class' as BindingPath;

/** The sidebar section the clients list shows in; Manage opens it, and it has no activity bar entry. */
export const CLIENTS_SECTION = 'ahp:clients';

/** Arguments of the command that opens a client. */
export interface ClientArgs {
  host: string;
  id: string;
  /** The tab's title: the client's name or id, since the row's id is only its socket number. */
  title?: string;
}

const serving = (offers: Offers | undefined): boolean => offers?.channels.includes(CLIENTS_SCHEME) ?? false;

/** The clients list and a client's page. */
export function registerClients(scena: Scena): Disposable {
  return combineDisposables(
    trackServed(scena, CLIENTS_SCHEME, CLIENTS_SERVED),
    scena.components.register({
      component: 'ClientExplorer',
      category: 'page',
      renderer: { kind: 'react', load: () => import('./Explorer.js') },
      props: {
        title: { t: 'clients/explorer/title' },
        actions: [
          { command: 'clients.reload', icon: EMOJIcon.reload, label: { t: 'common/reload' } },
          HOST_FILTER_ACTION,
        ],
      },
    }),
    scena.components.register({
      component: 'ClientPage',
      category: 'page',
      props: { icon: EMOJIcon.clients },
      renderer: { kind: 'react', load: () => import('./Page.js') },
    }),
    scena.commands.register({
      id: 'clients.reload',
      title: () => translate('common/reload'),
      run: (ctx) => Promise.all(shownHosts(ctx.store)
        .filter((host) => serving(ctx.store.get<Offers>(ahpPaths(host).offers)))
        .map((host) => hostBridge(host).refresh(CLIENTS))),
    }),
    scena.commands.register({
      id: 'ahp.showClients',
      title: () => translate('clients/commands/show'),
      keywords: [english('clients/commands/show')],
      category: 'Clients',
      slots: [PALETTE_SLOT],
      when: () => scena.store.get<boolean>(CLIENTS_SERVED) === true,
      run: (ctx) => ctx.commands.execute('sidebar.activate', { section: CLIENTS_SECTION }),
    }),
    scena.commands.register({
      id: 'ahp.openClient',
      title: () => translate('clients/commands/open'),
      run: (ctx, args) => {
        const target = args as ClientArgs | undefined;
        if (target?.id === undefined) return;
        ctx.store.set(ACTIVE_CLIENT, { host: target.host, id: target.id });
        ctx.surfaces.open({
          surface: 'main',
          key: `client:${target.host}:${target.id}`,
          // `client`, not `id`: scena keeps `id` for itself.
          resource: { component: 'ClientPage', host: target.host, client: target.id },
          props: { title: target.title ?? target.id },
        });
        hideOverlaidSidebar(ctx.scena, ctx.store.get<ModusClass>(MODUS_CLASS) ?? 'large');
      },
    }),
    scena.surfaces.mount({
      surface: 'sidebar:left',
      key: 'clients:explorer',
      when: `$/layout/surfaces/sidebar:left/section == "${CLIENTS_SECTION}"`,
      resource: { component: 'ClientExplorer' },
    }),
  );
}
