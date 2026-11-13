import type { Disposable, Scena } from '@softov/scena/types';
import { combineDisposables, translate } from '@softov/scena';
import { english } from '../../i18n/locales.js';
import { PALETTE_SLOT } from '../CommandPalette.js';
import { DOCK_ACTIONS, DOCKS_PATH } from './actions.js';
import { readDocks } from './docks.js';
import { resetActions } from './moves.js';

/**
 * The dock layer over every page, with the bots of the shown hosts and the
 * dock's actions, and the palette's commands to show a hidden action and to
 * put the actions back.
 */
export function registerDock(scena: Scena): Disposable {
  scena.store.set(DOCKS_PATH, readDocks());
  return combineDisposables(
    scena.components.register({ component: 'DockLayer', category: 'chrome', renderer: { kind: 'react', load: () => import('./DockLayer.js') } }),
    scena.surfaces.mount({ surface: 'overlay', key: 'dock:layer', resource: { component: 'DockLayer' } }),
    scena.commands.register({
      id: 'dock.showAction',
      title: () => translate('shell/dock/showAction'),
      run: (ctx, args) => {
        const one = DOCK_ACTIONS.find((held) => held.id === (args as { id?: string } | undefined)?.id);
        one?.shown.set(ctx.store, 'shown');
      },
    }),
    ...DOCK_ACTIONS.map((one) => scena.commands.register({
      id: `dock.show.${one.id}`,
      title: () => translate('shell/dock/show', { name: translate(`shell/dock/${one.id}`) }),
      keywords: [english(`shell/dock/${one.id}`), english('shell/dock/showKeyword')],
      category: 'View',
      slots: [PALETTE_SLOT],
      run: (ctx) => one.shown.set(ctx.store, 'shown'),
    })),
    scena.commands.register({
      id: 'dock.resetActions',
      title: () => translate('shell/dock/reset'),
      keywords: [english('shell/dock/reset')],
      category: 'View',
      slots: [PALETTE_SLOT],
      run: (ctx) => resetActions(ctx.store),
    }),
  );
}
