import { translate } from '@softov/scena';
import type { ReactiveStore } from '@softov/scena/types';
import { CONNECTORS, removeConnector, setConnectorOn, type ConnectorOwner, type ConnectorRow } from '../../bridges/connectors.js';
import { ahpPaths } from '../../bridges/data.js';
import { NO_OFFERS, type Offers } from '../../bridges/offers.js';
import { mayDo, type OwnGrants } from '../../bridges/own-grants.js';
import { selfId } from '../../bridges/people.js';
import { confirm, failed } from '../../shell/notify/index.js';

/** The reader's own owner on a host, `user:<id>`, or nothing for a root connection. */
export function meOn(offers: Offers): ConnectorOwner | undefined {
  const id = selfId(offers);
  return id === undefined ? undefined : `user:${id}`;
}

/** The reader's own owner on a host, read from the store. */
export const meIn = (store: ReactiveStore, host: string): ConnectorOwner | undefined =>
  meOn(store.get<Offers>(ahpPaths(host).offers) ?? NO_OFFERS);

/** An owner in the reader's words: *Me*, *Team ...*, *The host*, or a person's id. */
export function ownerWord(t: (key: string, values?: Record<string, string>) => string, owner: ConnectorOwner, me: ConnectorOwner | undefined): string {
  if (owner === me) return t('connectors/owners/me');
  if (owner === 'host') return t('connectors/owners/host');
  if (owner.startsWith('team:')) return t('connectors/owners/team', { team: owner.slice('team:'.length) });
  return owner.slice('user:'.length);
}

/** Deletes a connector once a person has said yes; answers whether it went. */
export async function deleteConnector(host: string, row: ConnectorRow): Promise<boolean> {
  const title = row.title || row.id;
  if (!(await confirm({
    title: translate('connectors/actions/deleteTitle', { title }),
    body: translate('connectors/actions/deleteBody'),
    confirmLabel: translate('connectors/actions/delete'),
    tone: 'danger',
  }))) return false;
  try {
    await removeConnector(host, row.id);
    return true;
  } catch (error) {
    failed(translate('connectors/actions/deleteFailed', { title }), error);
    return false;
  }
}

/** Whether a connector is turned off. */
export const connectorOff = (row: ConnectorRow): boolean => row.state === 'disabled';

/** The command that turns this connector the other way. */
export const turnMethod = (row: ConnectorRow): string => (connectorOff(row) ? CONNECTORS.enable : CONNECTORS.disable);

/** Whether the host offers the command that turns this connector the other way, to a reader holding `connector:put`. */
export const mayTurn = (offers: Offers, row: ConnectorRow, grants: OwnGrants): boolean =>
  offers.methods.includes(turnMethod(row)) && mayDo(grants, 'connector:put');

/** Turns a connector the other way; a refusal is the host's, in its words. */
export async function turnConnector(host: string, row: ConnectorRow): Promise<void> {
  const on = connectorOff(row);
  try {
    await setConnectorOn(host, row.id, on);
  } catch (error) {
    failed(translate(on ? 'connectors/actions/enableFailed' : 'connectors/actions/disableFailed', { title: row.title || row.id }), error);
  }
}
