import { describe, expect, it } from 'vitest';
import type { AutomationEntry } from '@microsoft/agent-host-protocol';
import { cronWords, definitionOf, draftOf, draftProblem, runFacts, stateOf } from './words.js';

const entry = (fields: Record<string, unknown> = {}, definition: Record<string, unknown> = {}): AutomationEntry => ({
  resource: 'ahp-automation:/a',
  definition: {
    title: 'Nightly',
    message: { text: 'Run the tests', origin: { kind: 'automation' } },
    session: { provider: 'claude', model: { id: 'opus' }, workingDirectories: ['file:///src/app'] },
    enabled: true,
    triggers: [
      { id: 'schedule', kind: 'schedule', schedule: { expression: '0 9 * * *', timeZone: 'America/Campo_Grande' } },
      { id: 'pr', kind: 'event', type: 'github', title: 'On a pull request', events: [] },
    ],
    disableConditions: [{ kind: 'afterRuns', max: 3 }],
    ...definition,
  },
  runs: [],
  operations: ['update', 'remove', 'run'],
  createdAt: '2026-10-01T00:00:00.000Z',
  modifiedAt: '2026-10-01T00:00:00.000Z',
  ...fields,
}) as unknown as AutomationEntry;

const run = (status: string, at: string, extra: Record<string, unknown> = {}) => ({
  resource: `run:${at}`,
  automation: 'ahp-automation:/a',
  origin: { kind: 'manual' },
  lifecycle: { status, createdAt: at, startedAt: at, ...extra },
  sessionCount: 1,
});

describe('cronWords', () => {
  it('says the common shapes in words', () => {
    expect(cronWords('*/10 * * * *')).toBe('Every 10 minutes');
    expect(cronWords('0 */6 * * *')).toBe('Every 6 hours');
    expect(cronWords('0 9 * * *')).toBe('Every day at 09:00');
    expect(cronWords('30 5 * * 1')).toBe('Every Monday at 05:30');
    expect(cronWords('0 9 * * 1-5')).toBe('Weekdays at 09:00');
  });

  it('leaves anything else as written', () => {
    expect(cronWords('0 9 1 * *')).toBe('0 9 1 * *');
  });
});

describe('runFacts and stateOf', () => {
  it('reads how long a finished run took and why it failed', () => {
    const facts = runFacts(run('failed', '2026-10-06T10:00:00.000Z', { completedAt: '2026-10-06T10:00:05.000Z', error: { message: 'boom' } }) as never);
    expect(facts).toMatchObject({ status: 'failed', took: 5000, error: 'boom' });
  });

  it('puts a running run first, then off, then a failed last run', () => {
    expect(stateOf(entry({ runs: [run('running', '2026-10-06T10:00:00.000Z')] }))).toBe('running');
    expect(stateOf(entry({}, { enabled: false }))).toBe('off');
    expect(stateOf(entry({ runs: [run('completed', '2026-10-05T10:00:00.000Z'), run('failed', '2026-10-06T10:00:00.000Z')] }))).toBe('failed');
    expect(stateOf(entry())).toBe('on');
  });
});

describe('draftOf and definitionOf', () => {
  it('round-trips an automation through the form, keeping the event trigger it does not edit', () => {
    const kept = entry();
    const definition = definitionOf(draftOf(kept), kept.definition);
    expect(definition.triggers).toEqual(kept.definition.triggers.map((trigger) => ('schedule' in trigger ? { ...trigger, misfirePolicy: 'skip' } : trigger)));
    expect(definition.session).toEqual(kept.definition.session);
    expect(definition.disableConditions).toEqual([{ kind: 'afterRuns', max: 3 }]);
  });

  it('clears what the form clears', () => {
    const kept = entry();
    const draft = { ...draftOf(kept), model: '', folder: '', expression: '', afterRuns: '' };
    const definition = definitionOf(draft, kept.definition);
    expect(definition.session).toEqual({ provider: 'claude' });
    expect(definition.triggers.map((trigger) => trigger.id)).toEqual(['pr']);
    expect(definition.disableConditions).toBeUndefined();
  });

  it('edits the settings and the custom agent each run starts with, and clears them when emptied', () => {
    const kept = entry({}, { session: { provider: 'claude', agent: { uri: 'agent://reviewer' }, config: { permissionMode: 'default', isolation: 'folder' } } });
    const draft = draftOf(kept);
    expect(draft.agent).toBe('agent://reviewer');
    expect(draft.config).toEqual({ permissionMode: 'default', isolation: 'folder' });
    expect(definitionOf({ ...draft, config: { ...draft.config, isolation: 'worktree' } }, kept.definition).session).toEqual({
      provider: 'claude',
      agent: { uri: 'agent://reviewer' },
      config: { permissionMode: 'default', isolation: 'worktree' },
    });
    expect(definitionOf({ ...draft, agent: '', config: {} }, kept.definition).session).toEqual({ provider: 'claude' });
  });

  it('writes a one-time trigger in place of the schedule, with no end conditions, and reads it back', () => {
    const kept = entry();
    const draft = { ...draftOf(kept), once: true, runAt: '2030-01-02T09:00', misfire: 'runOnce' as const };
    const definition = definitionOf(draft, kept.definition);
    expect(definition.triggers).toEqual([{ id: 'once', kind: 'oneTime', runAt: new Date('2030-01-02T09:00').toISOString(), misfirePolicy: 'runOnce' }]);
    expect(definition.disableConditions).toBeUndefined();
    const back = draftOf({ ...kept, definition });
    expect(back.once).toBe(true);
    expect(back.runAt).toBe('2030-01-02T09:00');
    expect(back.misfire).toBe('runOnce');
  });

  it('writes where each run goes, and over the older pinned mode says a new session in so many words', () => {
    const kept = entry();
    const base = draftOf(kept);
    expect(base.target).toBe('newSession');
    expect(definitionOf(base, kept.definition)).not.toHaveProperty('target');
    expect((definitionOf({ ...base, target: 'previousSession' }, kept.definition) as { target?: unknown }).target).toEqual({ kind: 'previousSession' });
    expect((definitionOf({ ...base, target: 'chat', chat: 'ahp-chat:/c', chatSession: 'ahp-session:/s' }, kept.definition) as { target?: unknown }).target)
      .toEqual({ kind: 'chat', chat: 'ahp-chat:/c', session: 'ahp-session:/s' });
    const pinned = entry({}, { _meta: { ahpd: { session: 'pinned' } } } as never);
    expect(draftOf(pinned).target).toBe('previousSession');
    expect((definitionOf({ ...draftOf(pinned), target: 'newSession' }, pinned.definition) as { target?: unknown }).target).toEqual({ kind: 'newSession' });
  });

  it('names a missing time or chat', () => {
    const ready = { ...draftOf(undefined), title: 't', message: 'm' };
    expect(draftProblem({ ...ready, once: true, runAt: '' })).toBe('Pick when it runs.');
    expect(draftProblem({ ...ready, target: 'chat', chat: '' })).toBe('Pick the chat each run goes to.');
  });

  it('names what is missing', () => {
    const empty = draftOf(undefined);
    expect(draftProblem(empty)).toBe('Add a title.');
    expect(draftProblem({ ...empty, title: 't', message: 'm', expression: '0 9 *' })).toMatch(/five fields/);
    expect(draftProblem({ ...empty, title: 't', message: 'm' })).toBeUndefined();
  });
});
