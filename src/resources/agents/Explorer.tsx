import { useMemo, type ReactElement } from 'react';
import { useI18n, useScena, useStore } from '@softov/scena/react';
import type { AgentInfo, SessionSummary } from '@microsoft/agent-host-protocol';
import { AGENTS, agentsReducer, type AgentMode, type AgentRow } from '../../bridges/agents.js';
import { useChannelOnEach } from '../../bridges/channel.js';
import { ahpPaths } from '../../bridges/data.js';
import { refKey, refOf, useEach, useHostNames, useShownHosts } from '../../bridges/hosts.js';
import { NO_OFFERS, type Offers } from '../../bridges/offers.js';
import type { PeopleState } from '../../bridges/people.js';
import { useServingHosts } from '../../bridges/served.js';
import { embedMode } from '../../shell/embed/index.js';
import { ExplorerList, type Dot, type Row } from '../../shell/explorer/ExplorerList.js';
import { EMOJIcon } from '../emojis.js';
import { meOn, ownerWord } from '../connectors/actions.js';
import { agentModes, checkOne, deleteAgent, isAgentOff, mayCheck, mayRemove, setMode } from './actions.js';
import { useOwnGrantsOnEach } from '../../bridges/own-grants.js';
import { useAgentIcons } from './icons.js';
import { ACTIVE_AGENT, agentTab } from './state.js';
import { agentTitle, mergeAgents, type MergedAgent } from './merge.js';
import { modelsLine, signInOf } from './words.js';
import { plural } from '../../i18n/locales.js';

/** A menu entry's tooltip, when the host says what its command does. */
const tooltip = (said: string | undefined): { tooltip?: string } => (said === undefined ? {} : { tooltip: said });

/** A row's dot by its status; a record with an error alert or one its host cannot open is failed, a paused one asks for attention, and a disabled one is quiet. */
const dotOf = (agent: MergedAgent): Dot => {
  if (agent.record?.alerts?.some((alert) => alert.level === 'error') === true) return 'failed';
  if (agent.status === 'configured') return 'ok';
  if (agent.status === 'standalone') return 'quiet';
  const state = agent.record?.state;
  if (state === 'unavailable' || state === 'failed') return 'failed';
  return state === 'disabled' ? 'quiet' : 'attention';
};

/**
 * The sidebar: the agents the shown hosts offer, merged with the records on
 * their agents channel, each with its status, its models and how many sessions
 * it has. Each host says when its lists change.
 */
export default function AgentExplorer(): ReactElement {
  const scena = useScena();
  const { t } = useI18n();
  const hosts = useShownHosts();
  const hostName = useHostNames();
  const multi = embedMode() === 'multi';
  const agentLists = useEach<AgentInfo[]>(hosts.map((host) => ahpPaths(host).agents));
  const sessionLists = useEach<SessionSummary[]>(hosts.map((host) => ahpPaths(host).sessions));
  // Records are read only on a host that offers the agents channel; elsewhere every agent is standalone.
  const serving = useServingHosts(hosts, AGENTS.scheme);
  const recordStates = useChannelOnEach<PeopleState<AgentRow>>(serving, AGENTS.channel, agentsReducer).states;
  const iconsOf = useAgentIcons(hosts);
  const offers = useEach<Offers>(hosts.map((host) => ahpPaths(host).offers));
  const grants = useOwnGrantsOnEach(hosts, offers);
  const active = useStore<{ host: string; provider: string }>(ACTIVE_AGENT);
  const open = (key: string): void => {
    const { host, id } = refOf(key);
    void scena.commands.execute('ahp.openAgent', { host, provider: id });
  };
  const start = (host: string, provider: string): void => void scena.commands.execute('ahp.newSession', { host, provider });

  const rows = useMemo<Row[]>(
    () => hosts.flatMap((host, at) => {
      const served = serving.indexOf(host);
      const records = served === -1 ? [] : (recordStates[served]?.records ?? []).map((one) => one.record);
      const me = meOn(offers[at] ?? NO_OFFERS);
      return mergeAgents(agentLists[at] ?? [], records).map((agent) => {
        const { info, record } = agent;
        const count = (sessionLists[at] ?? []).filter((one) => one.provider === agent.id).length;
        const signIn = info !== undefined && signInOf(info).some((one) => one.required);
        const status = t(`agents/explorer/status/${agent.status}`);
        const off = isAgentOff(record);
        // A paused or disabled record says so on its second line, so the first does not say it again.
        const why = agent.status === 'standby' && record !== undefined && !off ? t(`agents/explorer/standby/${record.state}`, { engine: record.engine }) : undefined;
        // A record outside the reader's root list is another owner's: the line names that owner.
        const owner = info === undefined && record !== undefined && agent.status === 'configured' ? ownerWord(t, record.owner, me) : undefined;
        const description = info?.description || record?.description || '';
        const icons = iconsOf(host, agent.id);
        // The first error says what is wrong, in place of the description.
        const error = record?.alerts?.find((alert) => alert.level === 'error');
        const second = error?.text ?? (off && record !== undefined ? t(`connectors/states/${record.state}`) : description);
        const held = offers[at] ?? NO_OFFERS;
        const mine = grants[at] ?? null;
        const modes = record === undefined ? [] : agentModes(held, record, mine);
        return {
          key: refKey(host, agent.id),
          dot: dotOf(agent),
          dotLabel: status,
          ...(icons === undefined ? {} : { icons }),
          emoji: EMOJIcon.agents,
          title: agentTitle(agent),
          lines: [
            [
              multi ? hostName(host) : undefined,
              status,
              owner,
              why,
              info === undefined ? undefined : modelsLine(info),
              info === undefined ? undefined : plural('agents/explorer/sessions', count),
              signIn ? t('agents/explorer/needsSignIn') : undefined,
            ].filter((bit) => bit !== undefined).join(' \u{00B7} '),
            ...(second === '' ? [] : [second]),
          ],
          menu: [
            { title: t('agents/explorer/open'), onSelect: (menu) => { menu.closeMenu(); open(refKey(host, agent.id)); } },
            ...(info === undefined ? [] : [{ title: t('agents/newSession'), onSelect: (menu: { closeMenu: () => void }) => { menu.closeMenu(); start(host, agent.id); } }]),
            ...(record === undefined || !mayCheck(held, record, mine) ? [] : [{
              title: t('agents/actions/checkNow'),
              group: 'more',
              onSelect: (menu: { closeMenu: () => void }) => { menu.closeMenu(); void checkOne(host, record); },
              ...tooltip(held.described[AGENTS.check]),
            }]),
            ...(record === undefined ? [] : modes.map((mode: AgentMode) => ({
              title: t(`agents/actions/${mode}`),
              group: 'more',
              onSelect: (menu: { closeMenu: () => void }) => { menu.closeMenu(); void setMode(host, record, mode); },
              ...tooltip(held.described[AGENTS[mode]]),
            }))),
            ...(record === undefined || !mayRemove(held, mine) ? [] : [{
              title: t('agents/actions/remove'),
              group: 'more',
              onSelect: (menu: { closeMenu: () => void }) => {
                menu.closeMenu();
                void deleteAgent(host, record).then((gone) => { if (gone) scena.surfaces.close(agentTab(host, agent.id)); });
              },
            }]),
          ],
        } satisfies Row;
      });
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [hosts, serving, agentLists, recordStates, iconsOf, sessionLists, offers, grants, hostName, t],
  );

  return (
    <ExplorerList
      label={t('agents/explorer/title')}
      rows={rows}
      selected={active === undefined ? null : refKey(active.host, active.provider)}
      onOpen={open}
      notice={rows.length === 0 ? <p className="web-note web-explorer__empty">{t('agents/explorer/empty')}</p> : null}
      filterLabel={t('agents/explorer/filter')}
      hostLines={multi}
    />
  );
}
