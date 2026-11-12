import { translate } from '@softov/scena';
import { AGENTS, checkAgent, removeAgent, setAgentMode, type AgentMode, type AgentRow } from '../../bridges/agents.js';
import type { Offers } from '../../bridges/offers.js';
import { mayDo, type OwnGrants } from '../../bridges/own-grants.js';
import { confirm, failed } from '../../shell/notify/index.js';

/** Removes an agent's record once a person has said yes; answers whether it went. */
export async function deleteAgent(host: string, row: AgentRow): Promise<boolean> {
  const name = row.name || row.id;
  if (!(await confirm({
    title: translate('agents/actions/removeTitle', { name }),
    body: translate('agents/actions/removeBody'),
    confirmLabel: translate('agents/actions/remove'),
    tone: 'danger',
  }))) return false;
  try {
    await removeAgent(host, row.id);
    return true;
  } catch (error) {
    failed(translate('agents/actions/removeFailed', { name }), error);
    return false;
  }
}

const MODES: readonly AgentMode[] = ['enable', 'pause', 'disable'];

/** The mode a record is in, by its state: a record that is neither paused nor disabled is enabled. */
const modeOf = (row: AgentRow): AgentMode => (row.state === 'paused' ? 'pause' : row.state === 'disabled' ? 'disable' : 'enable');

/** Whether an agent is paused or disabled, so it takes no new session. */
export const isAgentOff = (row: AgentRow | undefined): boolean => row !== undefined && modeOf(row) !== 'enable';

/** The modes a record can be moved to: each other than its own whose method the host offers, to a reader holding `agent:put`. */
export function agentModes(offers: Offers, row: AgentRow, grants: OwnGrants): AgentMode[] {
  if (!mayDo(grants, 'agent:put')) return [];
  const own = modeOf(row);
  return MODES.filter((mode) => mode !== own && offers.methods.includes(AGENTS[mode]));
}

/** Whether the reader may check a record again: it is on, the host offers the check, and they hold `agent:put`. */
export const mayCheck = (offers: Offers, row: AgentRow, grants: OwnGrants): boolean =>
  !isAgentOff(row) && offers.methods.includes(AGENTS.check) && mayDo(grants, 'agent:put');

/** Whether the reader may remove a record: the host offers it, and they hold `agent:remove`. */
export const mayRemove = (offers: Offers, grants: OwnGrants): boolean =>
  offers.methods.includes(AGENTS.remove) && mayDo(grants, 'agent:remove');

/** Checks a record again; what the check finds shows in its alerts, and a refusal is the host's. */
export async function checkOne(host: string, row: AgentRow): Promise<void> {
  try {
    await checkAgent(host, row.id);
  } catch (error) {
    failed(translate('agents/actions/checkFailed', { name: row.name || row.id }), error);
  }
}

/** Moves an agent to a mode; a refusal is the host's, in its words. */
export async function setMode(host: string, row: AgentRow, mode: AgentMode): Promise<void> {
  try {
    await setAgentMode(host, row.id, mode);
  } catch (error) {
    failed(translate(`agents/actions/${mode}Failed`, { name: row.name || row.id }), error);
  }
}
