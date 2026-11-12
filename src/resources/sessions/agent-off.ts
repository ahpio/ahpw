import type { AgentRow } from '../../bridges/agents.js';

/** Why a session's agent takes no message: its record is paused or disabled. */
export type AgentOff = 'paused' | 'disabled';

/** The session's agent's state when its record is paused or disabled, else nothing. */
export function agentOff(rows: readonly AgentRow[], provider: string): AgentOff | undefined {
  const state = rows.find((row) => row.id === provider)?.state;
  return state === 'paused' || state === 'disabled' ? state : undefined;
}
