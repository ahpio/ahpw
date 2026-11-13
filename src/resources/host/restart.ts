import { translate } from '@softov/scena';
import { mayForce, restartHost } from '../../bridges/restart.js';
import { confirm } from '../../shell/notify/index.js';
import { done, failed, warn } from '../../shell/notify/say.js';

/** The command that restarts a host, from the palette, the host page and the restart notes. */
export const RESTART_HOST = 'ahp.restartHost';

/** Arguments of `ahp.restartHost`: the host, and whether to restart it while a turn is running. */
export interface RestartArgs {
  host?: string;
  force?: boolean;
}

/**
 * Asks first, then restarts the host and says so; "Restart anyway" does not
 * ask again. A host that waits for running turns names their sessions, which
 * `nameOf` turns into titles. A refusal is the host's, in its words, with
 * "Restart anyway" when forcing could change it; the bridge connects again on
 * its own once the host is back.
 */
export async function restartWithNotice(host: string, force = false, nameOf: (session: string) => string = (session) => session): Promise<void> {
  if (!force && !(await confirm({ title: translate('host/restart/confirm'), body: translate('host/restart/note'), confirmLabel: translate('host/restart/button'), tone: 'danger' }))) return;
  const anyway = [{ label: translate('host/restart/anyway'), command: RESTART_HOST, args: { host, force: true } satisfies RestartArgs }];
  try {
    const answer = await restartHost(host, force);
    if (answer.restarting) done(translate('host/restart/done'));
    else warn(translate('host/restart/held'), { description: translate('host/restart/heldFor', { sessions: answer.parked.map(nameOf).join(', ') }), actions: anyway, dismissAuto: false });
  } catch (error) {
    const actions = force || !mayForce(error) ? [] : anyway;
    failed(translate('host/restart/failed'), error, actions.length === 0 ? {} : { actions, dismissAuto: false });
  }
}
