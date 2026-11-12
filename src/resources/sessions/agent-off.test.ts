import { describe, expect, it } from 'vitest';
import type { AgentRow, AgentState } from '../../bridges/agents.js';
import { agentOff } from './agent-off.js';

const row = (id: string, state: AgentState): AgentRow => ({ id, engine: 'claude', owner: 'host', name: id, config: {}, state });

describe('agentOff', () => {
  it('answers the state of a paused or disabled agent', () => {
    expect(agentOff([row('claude', 'paused')], 'claude')).toBe('paused');
    expect(agentOff([row('claude', 'disabled')], 'claude')).toBe('disabled');
  });

  it('answers nothing for an agent that takes messages', () => {
    expect(agentOff([row('claude', 'ready')], 'claude')).toBeUndefined();
    expect(agentOff([row('claude', 'failed')], 'claude')).toBeUndefined();
  });

  it('answers nothing for a provider with no row', () => {
    expect(agentOff([row('codex', 'paused')], 'claude')).toBeUndefined();
    expect(agentOff([], 'claude')).toBeUndefined();
  });
});
