import { useMemo, type ReactElement } from 'react';
import { useI18n, useScena, useStore } from '@softov/scena/react';
import type { PickerAction } from '@softov/scena/types';
import { Alert, Spinner } from '@softov/scena/ui';
import { useChannelOnEach } from '../../bridges/channel.js';
import { ahpPaths, type HostFacts } from '../../bridges/data.js';
import { refKey, refOf, useEach, useHostNames, useShownHosts } from '../../bridges/hosts.js';
import { rowOperations } from '../../bridges/operations.js';
import { useServingHosts } from '../../bridges/served.js';
import { copyText } from '../../shell/controls/CopyButton.js';
import { embedMode } from '../../shell/embed/index.js';
import { ExplorerList, type Row } from '../../shell/explorer/ExplorerList.js';
import { operationItems } from '../operations/run.js';
import { ACTIVE_CLIENT } from './state.js';
import { CLIENTS, CLIENTS_SCHEME, clientsReducer, factsOf, lineOf, titleOf, type ClientsState } from './rows.js';

/** The sidebar: the connections of the shown hosts that list them, in the order they arrived; this page's own is marked. */
export default function ClientExplorer(): ReactElement {
  const scena = useScena();
  const { t } = useI18n();
  const shown = useShownHosts();
  const hosts = useServingHosts(shown, CLIENTS_SCHEME);
  const hostName = useHostNames();
  const multi = embedMode() === 'multi';
  const { states, errors } = useChannelOnEach<ClientsState>(hosts, CLIENTS, clientsReducer);
  const connections = useEach<HostFacts | null>(hosts.map((host) => ahpPaths(host).host));
  const active = useStore<{ host: string; id: string }>(ACTIVE_CLIENT);
  const open = (key: string): void => {
    const { host, id } = refOf(key);
    const record = states[hosts.indexOf(host)]?.records.find((one) => one.id === id)?.record;
    void scena.commands.execute('ahp.openClient', { host, id, ...(record === undefined ? {} : { title: titleOf(factsOf(record)) }) });
  };

  const rows = useMemo<Row[]>(() => hosts.flatMap((host, at) => {
    const state = states[at];
    const mine = connections[at]?.clientId;
    return (state?.records ?? []).map(({ id, record }): Row => {
      const facts = factsOf(record);
      const own = mine !== undefined && facts.clientId === mine;
      const place = { host, channel: CLIENTS, target: id };
      const item = (title: string, run: () => void, extra: Partial<PickerAction> = {}): PickerAction => ({ title, onSelect: (menu) => { menu.closeMenu(); run(); }, ...extra });
      return {
        key: refKey(host, id),
        dot: own ? 'fresh' : 'ok',
        dotLabel: t(own ? 'clients/explorer/thisApp' : 'clients/explorer/connected'),
        title: titleOf(facts),
        lines: [[multi ? hostName(host) : undefined, own ? t('clients/explorer/thisApp') : undefined, lineOf(facts)].filter((bit) => bit !== undefined && bit !== '').join(' \u{00B7} ')],
        menu: [
          item(t('clients/actions/open'), () => open(refKey(host, id))),
          ...operationItems(scena, place, rowOperations(state, record)),
          item(t('clients/actions/copyClientId'), () => void copyText(facts.clientId), { group: 'more' }),
        ],
      };
    });
  }),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [hosts, states, connections, hostName, multi, t]);

  const error = multi ? null : errors[0] ?? null;
  const state = multi ? states.find((one) => one !== undefined) : states[0];
  const notice = hosts.length === 0
    ? <p className="web-note web-explorer__empty">{t('clients/explorer/notServed')}</p>
    : error !== null
      ? <Alert tone="danger" title={t('clients/notices/none')} message={error} />
      : state === undefined
        ? <Spinner label={t('clients/notices/reading')} />
        : rows.length === 0 ? <p className="web-note web-explorer__empty">{t('clients/explorer/empty')}</p> : null;

  return (
    <ExplorerList
      label={t('clients/explorer/title')}
      rows={rows}
      selected={active === undefined ? null : refKey(active.host, active.id)}
      onOpen={open}
      notice={notice}
      filterLabel={t('clients/explorer/filter')}
      hostLines={multi}
    />
  );
}
