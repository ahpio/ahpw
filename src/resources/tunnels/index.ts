import type { BindingPath, Disposable, Scena } from '@softov/scena/types';
import { combineDisposables, translate, type ModusClass } from '@softov/scena';
import { PALETTE_SLOT, openPalette } from '../../shell/CommandPalette.js';
import { hideOverlaidSidebar } from '../sessions/index.js';
import { ahpPaths, channelPath, hostBridge } from '../../bridges/data.js';
import { HOST_FILTER_ACTION, hostNameOf, shownHosts } from '../../bridges/hosts.js';
import { listOperations } from '../../bridges/operations.js';
import type { Offers } from '../../bridges/offers.js';
import { trackServed } from '../../bridges/served.js';
import { embedMode } from '../../shell/embed/index.js';
import { EMOJIcon } from '../emojis.js';
import { english } from '../../i18n/locales.js';
import { listChoices, runOperation } from '../operations/run.js';
import { ACTIVE_TUNNEL, TUNNELS_SERVED } from './state.js';
import { TUNNELS, TUNNELS_SCHEME, type TunnelsState } from './tunnels.js';

/** The display size class the modus backend publishes. */
const MODUS_CLASS = '$/modus/class' as BindingPath;

/** The sidebar section the tunnels list shows in; Manage opens it, and it has no activity bar entry. */
export const TUNNELS_SECTION = 'ahp:tunnels';

/** Arguments of the command that opens a tunnel. */
export interface TunnelArgs {
  host: string;
  id: string;
}

const serving = (offers: Offers | undefined): boolean => offers?.channels.includes(TUNNELS_SCHEME) ?? false;

/** The shown hosts that list their tunnels. */
const servingHosts = (scena: Scena): string[] => shownHosts(scena.store).filter((host) => serving(scena.store.get<Offers>(ahpPaths(host).offers)));

/** The tunnels list, a tunnel's page, and the New button that runs a kind's create. */
export function registerTunnels(scena: Scena): Disposable {
  return combineDisposables(
    trackServed(scena, TUNNELS_SCHEME, TUNNELS_SERVED),
    scena.components.register({
      component: 'TunnelExplorer',
      category: 'page',
      renderer: { kind: 'react', load: () => import('./Explorer.js') },
      props: {
        title: { t: 'tunnels/explorer/title' },
        actions: [
          { command: 'tunnels.new', icon: '+', label: { t: 'tunnels/commands/new' } },
          { command: 'tunnels.reload', icon: EMOJIcon.reload, label: { t: 'common/reload' } },
          HOST_FILTER_ACTION,
        ],
      },
    }),
    scena.components.register({
      component: 'TunnelPage',
      category: 'page',
      props: { icon: EMOJIcon.tunnels },
      renderer: { kind: 'react', load: () => import('./Page.js') },
    }),
    scena.commands.register({
      id: 'tunnels.reload',
      title: () => translate('common/reload'),
      run: (ctx) => Promise.all(servingHosts(ctx.scena).map((host) => hostBridge(host).refresh(TUNNELS))),
    }),
    scena.commands.register({
      id: 'tunnels.new',
      title: () => translate('tunnels/commands/new'),
      keywords: [english('tunnels/commands/new')],
      category: 'Tunnels',
      slots: [PALETTE_SLOT],
      when: () => scena.store.get<boolean>(TUNNELS_SERVED) === true,
      run: (ctx) => {
        const multi = embedMode() === 'multi';
        // Every kind's create, on every shown host that lists its tunnels.
        const choices = servingHosts(ctx.scena).flatMap((host) =>
          listOperations(ctx.store.get<TunnelsState>(channelPath(host, TUNNELS))).map((operation) => ({
            place: { host, channel: TUNNELS, opens: 'ahp.openTunnel' },
            operation,
            ...(multi ? { hostName: hostNameOf(ctx.store, host) } : {}),
          })));
        const [only] = choices;
        if (only === undefined) return;
        if (choices.length === 1) {
          void runOperation(ctx.scena, only.place, only.operation);
          return;
        }
        openPalette(ctx.scena, listChoices(ctx.scena, translate('tunnels/commands/pickKind'), choices));
      },
    }),
    scena.commands.register({
      id: 'ahp.showTunnels',
      title: () => translate('tunnels/commands/show'),
      keywords: [english('tunnels/commands/show')],
      category: 'Tunnels',
      slots: [PALETTE_SLOT],
      when: () => scena.store.get<boolean>(TUNNELS_SERVED) === true,
      run: (ctx) => ctx.commands.execute('sidebar.activate', { section: TUNNELS_SECTION }),
    }),
    scena.commands.register({
      id: 'ahp.openTunnel',
      title: () => translate('tunnels/commands/open'),
      run: (ctx, args) => {
        const target = args as TunnelArgs | undefined;
        if (target?.id === undefined) return;
        ctx.store.set(ACTIVE_TUNNEL, { host: target.host, id: target.id });
        ctx.surfaces.open({
          surface: 'main',
          key: `tunnel:${target.host}:${target.id}`,
          // `tunnel`, not `id`: scena keeps `id` for itself.
          resource: { component: 'TunnelPage', host: target.host, tunnel: target.id },
          props: { title: target.id },
        });
        hideOverlaidSidebar(ctx.scena, ctx.store.get<ModusClass>(MODUS_CLASS) ?? 'large');
      },
    }),
    scena.surfaces.mount({
      surface: 'sidebar:left',
      key: 'tunnels:explorer',
      when: `$/layout/surfaces/sidebar:left/section == "${TUNNELS_SECTION}"`,
      resource: { component: 'TunnelExplorer' },
    }),
  );
}
