import { useEffect, useMemo, useState, type ReactElement } from 'react';
import { useI18n, useScena, useStore } from '@softov/scena/react';
import { Alert, Badge, Button, DetailList, Text, type DetailItem } from '@softov/scena/ui';
import { automationReducer, type AgentInfo, type AutomationCapabilities, type AutomationState } from '@microsoft/agent-host-protocol';
// import { call } from '../../lib/api.js';
import { AUTOMATIONS, ROOT, ahpPaths, hostBridge, type Connection, type HostFacts } from '../../bridges/data.js';
import { useChannel } from '../../bridges/channel.js';
import { elapsed, folderLabel } from '../../bridges/words.js';
import { when } from '../sessions/turn.js';
import { AGENTS_SECTION } from '../agents/index.js';
import { plural } from '../../i18n/locales.js';
import { TrustedFolders } from './Trusted.js';
import { NO_OFFERS, type Offers } from '../../bridges/offers.js';
import { mayRestart } from '../../bridges/restart.js';
import { RESTART_HOST } from './restart.js';
import { DangerZone } from '../../shell/controls/DangerZone.js';
import { AUTOMATIONS_SECTION } from '../automations/index.js';
import { SESSIONS_SECTION } from '../sessions/index.js';
import { useAgentIcons } from '../agents/icons.js';
import { EMOJIcon } from '../emojis.js';
import { HostIcon, PageTitle } from '../../shell/HostIcon.js';
import { embedMode } from '../../shell/embed/index.js';
import { HOST_LIST, hostNameOf } from '../../bridges/hosts.js';
import type { ServerInfo } from '../../bridges/server-info.js';
import { memoryWords, NO_ABOUT, type HostAbout } from '../../bridges/host-about.js';
import './info.css';
import { Section } from '../../shell/view/Section.js';
import { runFacts, runsByTime } from '../automations/words.js';

/** What `GET /api/status` says about the daemon process. */
interface DaemonStatus {
  pid?: number;
  url?: string;
  paths?: string[];
  startedAt?: string;
  automations?: string;
}

type Tone = 'default' | 'success' | 'warning' | 'danger' | 'info';

/** Each connection state's tone, and its word under `bridges/state`. */
const CONNECTION: Record<string, { tone: Tone; word: string }> = {
  connected: { tone: 'success', word: 'connected' },
  connecting: { tone: 'info', word: 'connecting' },
  reconnecting: { tone: 'warning', word: 'reconnecting' },
  disconnected: { tone: 'default', word: 'disconnected' },
  failed: { tone: 'danger', word: 'failed' },
};

/** The daemon's status, asked again on every new connection. */
function useDaemonStatus(generation: number): { status: DaemonStatus | null; error: string | null } {
  const [status, setStatus] = useState<DaemonStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    // ahpd's GET /api/status; off while ahpw is AHP only.
    setStatus(null);
    setError(null);
    // let alive = true;
    // call({ method: 'GET', path: '/status' })
    //   .then((answer) => { if (alive) { setStatus(answer as DaemonStatus); setError(null); } })
    //   .catch((caught: unknown) => { if (alive) setError(caught instanceof Error ? caught.message : String(caught)); });
    // return () => { alive = false; };
  }, [generation]);
  return { status, error };
}

/** A clock that moves once a second. */
function useNow(): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  return now;
}

/** The host's automations: how many, and when one last ran; with none, a button that creates one. */
function AutomationsFact({ host, caps }: { host: string; caps: AutomationCapabilities | null }): ReactElement {
  const scena = useScena();
  const { t } = useI18n();
  const { state } = useChannel<AutomationState>(host, caps === null ? undefined : AUTOMATIONS, automationReducer);
  if (caps === null) return <>{t('host/info/automationsNotOffered')}</>;
  if (state === undefined) return <>{t('common/loading')}</>;
  const entries = state.entries;
  if (entries.length === 0) {
    return caps.create === undefined
      ? <>{t('host/info/none')}</>
      : <Button label={t('automations/commands/new')} onClick={() => void scena.commands.execute('ahp.newAutomation', { host })} />;
  }
  const last = entries.flatMap((entry) => runsByTime(entry).slice(0, 1).map((run) => runFacts(run).at)).sort().at(-1);
  return (
    <button type="button" className="web-link" onClick={() => void scena.commands.execute('sidebar.activate', { section: AUTOMATIONS_SECTION })}>
      {plural('host/info/automationsCount', entries.length)}
      {' \u{00B7} '}
      {last === undefined ? t('host/info/automationsNeverRan') : t('host/info/automationsLastRan', { when: when(last) })}
    </button>
  );
}

/** The host's agents, one row each: the name opens the agent, and the chat button starts a session with it. */
function AgentRows({ host, agents }: { host: string; agents: readonly AgentInfo[] }): ReactElement {
  const scena = useScena();
  const { t } = useI18n();
  const hosts = useMemo(() => [host], [host]);
  const iconsOf = useAgentIcons(hosts);
  if (agents.length === 0) return <p className="web-note">{t('host/info/none')}</p>;
  return (
    <ul className="web-host-agents">
      {agents.map((agent) => {
        const open = (): void => void scena.commands.execute('ahp.openAgent', { host, provider: agent.provider, title: agent.displayName });
        const line = [agent.description, agent.models.length === 0 ? '' : plural('host/info/models', agent.models.length)].filter((one) => one !== '').join(' \u{00B7} ');
        return (
          <li key={agent.provider} className="web-host-agents__row">
            <span className="web-host-agents__icon">
              <HostIcon icons={iconsOf(host, agent.provider)} size={24} fallback={<span aria-hidden="true">{EMOJIcon.agents}</span>} />
            </span>
            <span className="web-host-agents__text">
              <span>
                <button type="button" className="web-link web-host-agents__name" onClick={open}>{agent.displayName}</button>
                {' '}
                <span className="web-method">{agent.provider}</span>
              </span>
              {line === '' ? null : <span className="web-host-agents__line">{line}</span>}
            </span>
            <button
              type="button"
              className="web-host-agents__chat"
              title={t('host/info/agentChatWith', { agent: agent.displayName })}
              aria-label={t('host/info/agentChatWith', { agent: agent.displayName })}
              onClick={() => void scena.commands.execute('ahp.newSession', { host, provider: agent.provider })}
            >
              <span aria-hidden="true">{EMOJIcon.sessions}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/** The host: the connection to it, the software and machine behind it, its agents, and what it keeps. */
export default function HostInfoPage({ host }: { host: string }): ReactElement {
  const scena = useScena();
  const { t } = useI18n();
  const connection = useStore<Connection>(ahpPaths(host).connection);
  const facts = useStore<HostFacts | null>(ahpPaths(host).host);
  const agents = useStore<AgentInfo[]>(ahpPaths(host).agents) ?? [];
  const home = useStore<string | null>(ahpPaths(host).defaultDirectory);
  const caps = useStore<AutomationCapabilities | null>(ahpPaths(host).automationCaps);
  const hostOffers = useStore<Offers>(ahpPaths(host).offers) ?? NO_OFFERS;
  const server = useStore<ServerInfo>(ahpPaths(host).server);
  const about = useStore<HostAbout>(ahpPaths(host).about) ?? NO_ABOUT;
  const sessions = useStore<readonly unknown[]>(ahpPaths(host).sessions) ?? [];
  // Read so the title follows a rename the embedder sends.
  useStore<unknown>(HOST_LIST);
  const { status, error } = useDaemonStatus(connection?.generation ?? 0);
  const now = useNow();
  const shown = CONNECTION[connection?.status ?? 'disconnected'] ?? CONNECTION['disconnected']!;
  const shownText = t(`bridges/state/${shown.word}`);
  const started = status?.startedAt === undefined ? NaN : Date.parse(status.startedAt);
  const principal = hostOffers.principal;
  const title = embedMode() === 'multi'
    ? hostNameOf(scena.store, host)
    : principal?.startsWith('root:') === true ? principal.slice('root:'.length) : facts?.label ?? t('host/title');

  const link: DetailItem[] = [];
  if (facts !== null && facts !== undefined) {
    link.push({ label: t('host/info/address'), value: facts.label });
    if (facts.protocolVersion !== null) link.push({ label: t('host/info/protocol'), value: facts.protocolVersion });
    if (facts.connectedAt !== null) link.push({ label: t('host/info/connected'), value: t('host/info/connectedValue', { when: when(facts.connectedAt), elapsed: elapsed(now - facts.connectedAt) }) });
    link.push({ label: t('host/info/client'), value: <code>{facts.clientId}</code> });
    if (principal !== undefined) link.push({ label: t('host/info/signedInAs'), value: principal });
    link.push({ label: t('host/info/following'), value: t('host/info/followingValue', { channels: plural('host/info/channels', facts.subscriptions), seq: facts.serverSeq }) });
  }
  if (connection?.error !== null && connection?.error !== undefined) link.push({ label: t('host/info/lastError'), value: connection.error });

  const software: DetailItem[] = [];
  if (server !== undefined) {
    software.push({ label: t('host/info/software'), value: server.name });
    if (server.version !== null) software.push({ label: t('host/info/version'), value: server.version });
  }
  if (about.build !== undefined) software.push({ label: t('host/info/build'), value: about.build });
  software.push({ label: t('host/info/defaultFolder'), value: home === null || home === undefined ? t('host/info/none') : <code>{folderLabel(home)}</code> });
  if (facts?.activeSessions !== null && facts?.activeSessions !== undefined) {
    software.push({
      label: t('host/info/activeSessions'),
      value: (
        <button type="button" className="web-link" onClick={() => void scena.commands.execute('sidebar.activate', { section: SESSIONS_SECTION })}>
          {`${String(facts.activeSessions)} / ${String(sessions.length)}`}
        </button>
      ),
    });
  }

  const machine: DetailItem[] = [];
  const box = about.machine;
  if (box !== undefined) {
    const platform = [box.platform, box.architecture].filter((one) => one !== undefined).join(' \u{00B7} ');
    if (platform !== '') machine.push({ label: t('host/info/platform'), value: platform });
    if (box.cpus !== undefined) machine.push({ label: t('host/info/cpus'), value: String(box.cpus) });
    if (box.memoryBytes !== undefined) machine.push({ label: t('host/info/memory'), value: memoryWords(box.memoryBytes) });
  }

  const daemon: DetailItem[] = [];
  if (status !== null) {
    if (!Number.isNaN(started)) daemon.push({ label: t('host/info/started'), value: t('host/info/startedValue', { when: when(started), elapsed: elapsed(now - started) }) });
    if (status.pid !== undefined) daemon.push({ label: t('host/info/process'), value: String(status.pid) });
    if (status.url !== undefined) daemon.push({ label: t('host/info/address'), value: <code>{status.url}</code> });
    if (status.automations !== undefined) daemon.push({ label: t('host/info/automationsKeptIn'), value: status.automations });
    if ((status.paths ?? []).length > 0) daemon.push({ label: t('host/info/sessionsKeptIn'), value: <span className="web-lines">{status.paths!.map((one) => <code key={one}>{one}</code>)}</span> });
  }

  const terminals = facts?.terminals ?? [];
  return (
    <div className="web-page">
      <div className="web-page__head">
        <PageTitle emoji={EMOJIcon.host} title={title} uri={ROOT} state={<Badge tone={shown.tone} text={shownText} />} />
        <div className="web-page__actions">
          {connection?.status === 'connected' ? null : <Button label={t('bridges/reconnectNow')} variant="primary" onClick={() => void hostBridge(host).reconnect()} />}
          <Button label={t('host/info/settings')} onClick={() => void scena.commands.execute('ahp.openSettings', { host })} />
        </div>
      </div>

      <Section icon={EMOJIcon.link} title={t('host/info/connection')} />
      <DetailList items={link} columns={2} />

      <Section icon={EMOJIcon.archive} title={t('host/info/server')} />
      <DetailList items={software} columns={2} />

      {machine.length === 0 ? null : (
        <>
          <Section icon={EMOJIcon.computers} title={t('host/info/machine')} />
          <DetailList items={machine} columns={2} />
        </>
      )}

      {status === null && error === null ? null : <Section icon={EMOJIcon.settings} title={t('host/info/daemon')} />}
      {error === null ? null : <Alert tone="warning" message={t('host/info/statusUnreadable', { error })} />}
      {daemon.length === 0 ? null : <DetailList items={daemon} columns={2} />}

      <Section icon={EMOJIcon.automations} title={t('host/info/automations')} />
      <div className="web-host-automations"><AutomationsFact host={host} caps={caps ?? null} /></div>

      <Section icon={EMOJIcon.agents} title={t('host/info/agents')} count={agents.length} />
      <AgentRows host={host} agents={agents} />

      {about.settings.length === 0 ? null : (
        <>
          <Section icon={EMOJIcon.settings} title={t('host/info/agentSettings')} />
          <ul className="web-host-settings">
            {about.settings.map((page) => (
              <li key={page.provider} className="web-host-settings__row">
                <span><strong>{page.title}</strong> <span className="web-method">{page.provider}</span></span>
                {page.description === undefined ? null : <span className="web-host-settings__description">{page.description}</span>}
                {page.keys.length === 0 ? null : <span className="web-host-settings__keys">{page.keys.map((key) => <code key={key}>{key}</code>)}</span>}
              </li>
            ))}
          </ul>
        </>
      )}

      <TrustedFolders host={host} heading={<Section icon={EMOJIcon.folder} title={t('trust/host/title')} />} />

      <Section icon={EMOJIcon.terminal} title={t('host/info/terminals')} />
      {terminals.length === 0 ? <p className="web-note">{t('host/info/noTerminals')}</p> : (
        <table className="web-runs web-table">
          <thead>
            <tr><th>{t('host/info/terminalTitle')}</th><th>{t('host/info/terminalState')}</th></tr>
          </thead>
          <tbody>
            {terminals.map((one) => {
              const life = one.lifecycle as { status?: string; exitCode?: number };
              return (
                <tr key={one.resource}>
                  <td>{one.title}</td>
                  <td>{life.status !== 'exited' ? t('host/info/running') : life.exitCode === undefined ? t('host/info/exited') : t('host/info/exitedCode', { code: life.exitCode })}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {mayRestart(hostOffers) ? <DangerZone label={t('host/restart/button')} note={t('host/restart/note')} onClick={() => void scena.commands.execute(RESTART_HOST, { host })} /> : null}
    </div>
  );
}
