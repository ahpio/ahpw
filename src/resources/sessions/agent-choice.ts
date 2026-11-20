/**
 * The Sessions explorer's *Agent* choice: *All agents*, then one entry per
 * provider the hosts list, as the host filter has one entry per host. The
 * choice is a provider, kept in the browser, and holds on every host.
 */

import type { AgentInfo } from '@microsoft/agent-host-protocol';
import { combineDisposables, translate } from '@softov/scena';
import type { Disposable, ListSpec, ReactiveStore, Scena } from '@softov/scena/types';
import { ahpPaths } from '../../bridges/data.js';
import { everyHost, onEachHost } from '../../bridges/hosts.js';
import { openPalette } from '../../shell/CommandPalette.js';
import { SESSIONS_AGENT } from './state.js';

/** The menu slot of the agent choice. */
export const AGENT_SLOT = 'sessions:agent';

/** Where each browser keeps the chosen provider. */
const KEY = 'ahpd-web.session-agent';

/** One entry of the menu: a provider and the name it shows. */
export interface AgentEntry {
  provider: string;
  title: string;
}

/**
 * The menu's agents: each provider once over every host's list, named as the
 * first host that lists it names it, by name. A chosen provider no host lists
 * now stays, named by its id, so its tick still shows.
 */
export function menuAgents(lists: readonly (readonly AgentInfo[] | undefined)[], chosen: string | null): AgentEntry[] {
  const found = new Map<string, string>();
  for (const list of lists) for (const one of list ?? []) if (!found.has(one.provider)) found.set(one.provider, one.displayName || one.provider);
  if (chosen !== null && !found.has(chosen)) found.set(chosen, chosen);
  return [...found].map(([provider, title]) => ({ provider, title })).sort((one, other) => one.title.localeCompare(other.title));
}

/** The provider kept in this browser, or null for every agent. */
export function readAgentChoice(): string | null {
  try {
    const held = localStorage.getItem(KEY);
    return held === null || held === '' ? null : held;
  } catch {
    return null;
  }
}

/** Show only `provider`'s sessions, or every agent's for null, and keep it in this browser. */
export function setAgentChoice(store: ReactiveStore, provider: string | null): void {
  store.set(SESSIONS_AGENT, provider);
  try {
    if (provider === null) localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, provider);
  } catch {
    // A browser that keeps nothing still filters this page.
  }
}

/** The header button, *All agents*, and one command per agent, registered again when a host's agents change. */
export function registerAgentChoice(scena: Scena): Disposable {
  scena.store.set(SESSIONS_AGENT, readAgentChoice());
  let perAgent: Disposable = { dispose: () => undefined };
  const rebuild = (): void => {
    const lists = everyHost(scena.store).map((host) => scena.store.get<AgentInfo[]>(ahpPaths(host).agents));
    perAgent.dispose();
    perAgent = combineDisposables(
      ...menuAgents(lists, scena.store.get<string | null>(SESSIONS_AGENT) ?? null).map((agent) => scena.commands.register({
        id: `sessions.agentOf.${agent.provider}`,
        title: () => agent.title,
        slots: [AGENT_SLOT],
        active: (ctx) => ctx.store.get<string | null>(SESSIONS_AGENT) === agent.provider,
        run: (ctx) => setAgentChoice(ctx.store, agent.provider),
      })),
    );
  };
  rebuild();
  return combineDisposables(
    onEachHost(scena, (host) => {
      rebuild();
      return scena.store.subscribe(ahpPaths(host).agents, rebuild);
    }),
    { dispose: () => perAgent.dispose() },
    scena.commands.register({
      id: 'sessions.agent',
      title: () => translate('sessions/explorer/agent'),
      run: (ctx) => {
        const list: ListSpec = { title: translate('sessions/explorer/agent'), query: { slot: AGENT_SLOT } };
        if (ctx.host !== undefined) ctx.host.pushList(list);
        else openPalette(ctx.scena, list);
      },
    }),
    scena.commands.register({
      id: 'sessions.agent.all',
      title: () => translate('sessions/agent/all'),
      slots: [AGENT_SLOT],
      active: (ctx) => (ctx.store.get<string | null>(SESSIONS_AGENT) ?? null) === null,
      run: (ctx) => setAgentChoice(ctx.store, null),
    }),
  );
}
