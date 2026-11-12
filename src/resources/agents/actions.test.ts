import { describe, expect, it } from 'vitest';
import { AGENTS, type AgentRow, type AgentState } from '../../bridges/agents.js';
import { NO_OFFERS, type Offers } from '../../bridges/offers.js';
import { agentModes, mayCheck, mayRemove } from './actions.js';

const row = (state: AgentState): AgentRow => ({ id: 'claude', engine: 'claude', owner: 'host', name: 'Claude', config: {}, state });
const offering = (...methods: string[]): Offers => ({ ...NO_OFFERS, methods });
const all = offering(AGENTS.enable, AGENTS.pause, AGENTS.disable, AGENTS.check, AGENTS.remove);

describe('agentModes', () => {
  it('offers the two modes other than the record\'s own', () => {
    expect(agentModes(all, row('ready'), null)).toEqual(['pause', 'disable']);
    expect(agentModes(all, row('paused'), null)).toEqual(['enable', 'disable']);
    expect(agentModes(all, row('disabled'), null)).toEqual(['enable', 'pause']);
  });

  it('counts a record the host could not open as enabled', () => {
    for (const state of ['failed', 'invalid', 'unavailable'] as const) {
      expect(agentModes(all, row(state), null)).toEqual(['pause', 'disable']);
    }
  });

  it('keeps only the modes whose method the host offers', () => {
    expect(agentModes(offering(AGENTS.disable), row('ready'), null)).toEqual(['disable']);
    expect(agentModes(offering(AGENTS.enable), row('ready'), null)).toEqual([]);
  });

  it('offers none when the host offers no method', () => {
    expect(agentModes(NO_OFFERS, row('ready'), null)).toEqual([]);
    expect(agentModes(NO_OFFERS, row('paused'), null)).toEqual([]);
  });

  it('offers none to a person without agent:put', () => {
    expect(agentModes(all, row('ready'), [])).toEqual([]);
    expect(agentModes(all, row('ready'), ['agent:read', 'agent:remove'])).toEqual([]);
  });

  it('offers them to a person holding agent:put or a wildcard over it', () => {
    expect(agentModes(all, row('ready'), ['agent:put'])).toEqual(['pause', 'disable']);
    expect(agentModes(all, row('ready'), ['agent:*'])).toEqual(['pause', 'disable']);
    expect(agentModes(all, row('ready'), ['*:*'])).toEqual(['pause', 'disable']);
  });
});

describe('mayCheck', () => {
  it('lets a reader with agent:put check a record that is on', () => {
    expect(mayCheck(all, row('ready'), ['agent:put'])).toBe(true);
    expect(mayCheck(all, row('failed'), null)).toBe(true);
  });

  it('holds back a record that is off, a host without the check, and a reader without agent:put', () => {
    expect(mayCheck(all, row('paused'), null)).toBe(false);
    expect(mayCheck(all, row('disabled'), null)).toBe(false);
    expect(mayCheck(offering(AGENTS.pause), row('ready'), null)).toBe(false);
    expect(mayCheck(all, row('ready'), ['agent:read'])).toBe(false);
  });
});

describe('mayRemove', () => {
  it('takes the method and agent:remove', () => {
    expect(mayRemove(all, ['agent:remove'])).toBe(true);
    expect(mayRemove(all, null)).toBe(true);
    expect(mayRemove(all, ['agent:put'])).toBe(false);
    expect(mayRemove(offering(AGENTS.check), null)).toBe(false);
  });
});
