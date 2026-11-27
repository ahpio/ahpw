import { useMemo, type ReactElement } from 'react';
import { useI18n, useScena, useStore } from '@softov/scena/react';
import type { PickerAction } from '@softov/scena/types';
import { Alert, Note, Spinner } from '../../ui/index.js';
import { useChannelOnEach } from '../../bridges/channel.js';
import { ahpPaths } from '../../bridges/data.js';
import { refKey, refOf, useEach, useHostNames, useShownHosts } from '../../bridges/hosts.js';
import type { Offers } from '../../bridges/offers.js';
import { runnableBy, useOwnGrantsOnEach } from '../../bridges/own-grants.js';
import { rowOperations } from '../../bridges/operations.js';
import { useServingHosts } from '../../bridges/served.js';
import { copyText } from '../../ui/control/CopyButton.js';
import { embedMode } from '../../shell/embed/index.js';
import { ExplorerList, type Row } from '../../shell/explorer/ExplorerList.js';
import { operationItems } from '../operations/run.js';
import { ACTIVE_TUNNEL } from './state.js';
import { detailOf, dotOf, factsOf, statusKey, TUNNELS, TUNNELS_SCHEME, tunnelsReducer, type TunnelsState } from './tunnels.js';

/** The sidebar: the tunnels of the shown hosts that list them, by id, with their kind and address. */
export default function TunnelExplorer(): ReactElement {
  const scena = useScena();
  const { t } = useI18n();
  const shown = useShownHosts();
  const hosts = useServingHosts(shown, TUNNELS_SCHEME);
  const hostName = useHostNames();
  const multi = embedMode() === 'multi';
  const { states, errors } = useChannelOnEach<TunnelsState>(hosts, TUNNELS, tunnelsReducer);
  const offers = useEach<Offers>(hosts.map((host) => ahpPaths(host).offers));
  const grants = useOwnGrantsOnEach(hosts, offers);
  const active = useStore<{ host: string; id: string }>(ACTIVE_TUNNEL);
  const open = (key: string): void => {
    const { host, id } = refOf(key);
    void scena.commands.execute('ahp.openTunnel', { host, id });
  };

  const rows = useMemo<Row[]>(() => hosts
    .flatMap((host, at) => (states[at]?.records ?? []).map(({ id, record }) => ({ host, id, record, state: states[at], mine: grants[at] ?? null })))
    .sort((a, b) => a.id.localeCompare(b.id))
    .map(({ host, id, record, state, mine }) => {
      const facts = factsOf(record);
      const word = t(`tunnels/status/${statusKey(facts)}`);
      const place = { host, channel: TUNNELS, target: id, held: facts.settings };
      const item = (title: string, run: () => void, extra: Partial<PickerAction> = {}): PickerAction => ({ title, onSelect: (menu) => { menu.closeMenu(); run(); }, ...extra });
      const menu: PickerAction[] = [
        item(t('tunnels/actions/open'), () => open(refKey(host, id))),
        ...(facts.url === undefined ? [] : [item(t('tunnels/actions/copyUrl'), () => void copyText(facts.url!))]),
        ...operationItems(scena, place, runnableBy(rowOperations(state, record), mine)),
        item(t('tunnels/actions/copyId'), () => void copyText(id), { group: 'more' }),
      ];
      return {
        key: refKey(host, id),
        dot: dotOf(facts),
        dotLabel: word,
        title: id,
        lines: [[multi ? hostName(host) : undefined, facts.kind, detailOf(facts, word)].filter((bit) => bit !== undefined && bit !== '').join(' \u{00B7} ')],
        menu,
      };
    }),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [hosts, states, grants, hostName, multi, t]);

  const error = multi ? null : errors[0] ?? null;
  const state = multi ? states.find((one) => one !== undefined) : states[0];
  const notice = hosts.length === 0
    ? <Note inset>{t('tunnels/explorer/notServed')}</Note>
    : error !== null
      ? <Alert tone="danger" title={t('tunnels/notices/none')} message={error} />
      : state === undefined
        ? <Spinner label={t('tunnels/notices/reading')} />
        : rows.length === 0 ? <Note inset>{t('tunnels/explorer/empty')}</Note> : null;

  return (
    <ExplorerList
      label={t('tunnels/explorer/title')}
      rows={rows}
      selected={active === undefined ? null : refKey(active.host, active.id)}
      onOpen={open}
      notice={notice}
      filterLabel={t('tunnels/explorer/filter')}
      hostLines={multi}
    />
  );
}
