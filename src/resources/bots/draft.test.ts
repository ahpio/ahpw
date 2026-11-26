import { expect, test } from 'vitest';
import type { BotRecord } from './catalogue.js';
import { connectorsValid, draftOf, freeAlias, recordBody, renamedFor, withAgent } from './draft.js';
import { bodyName } from './look.js';

test('a body offers bood\'s name for it, through an old tag too, and nothing for a body bood does not draw', () => {
  expect(bodyName('robot')).toBe('Boppo');
  expect(bodyName(' Semicircle ')).toBe('Jello');
  expect(bodyName('rectangle')).toBe('Brik');
  expect(bodyName('teapot')).toBe('');
});

test('a new bot starts with its body\'s name', () => {
  const draft = draftOf(undefined, []);
  expect(draft.name).toBe(bodyName(draft.body));
});

test('a changed body takes the name along while it is empty or the old body\'s, and keeps one somebody typed', () => {
  expect(renamedFor('Boppo', 'robot', 'cloud')).toBe('Nimbo');
  expect(renamedFor('  ', 'robot', 'cloud')).toBe('Nimbo');
  expect(renamedFor('Boppo', 'robot', 'teapot')).toBe('');
  expect(renamedFor('Ana', 'robot', 'cloud')).toBe('Ana');
});

const BOT: BotRecord = {
  id: 'goo', name: 'Goo', labels: [], body: 'robot', color: 'blue', owner: 'user:ana', workspace: '/bots/goo',
  createdAt: '2026-11-25T00:00:00Z', updatedAt: '2026-11-25T00:00:00Z',
  provider: 'claude', model: 'sonnet', computer: 'box', template: 'plain', connectors: { mail: 'connectors://resend/team-mail' },
};

test('a bot\'s agent, model, computer, connectors, template and folder read back into the form', () => {
  const draft = draftOf(BOT, []);
  expect(draft).toMatchObject({ agent: 'claude', preset: false, model: 'sonnet', computer: 'box', template: 'plain', workspace: '/bots/goo' });
  expect(draft.connectors).toEqual([{ alias: 'mail', target: 'connectors://resend/team-mail' }]);
  expect(draftOf({ ...BOT, preset: 'claude-review' }, [])).toMatchObject({ agent: 'claude-review', preset: true });
});

test('a new bot sends each field it sets and leaves out the ones left at the default', () => {
  const fresh = draftOf(undefined, []);
  expect(recordBody(fresh, true)).not.toHaveProperty('provider');
  const set = { ...fresh, agent: 'claude', model: 'sonnet', computer: 'box', template: 'plain', workspace: '/bots/goo', connectors: [{ alias: 'mail', target: 'connectors://resend/team-mail' }] };
  expect(recordBody(set, true)).toMatchObject({
    provider: 'claude', model: 'sonnet', computer: 'box', template: 'plain', workspace: '/bots/goo', connectors: { mail: 'connectors://resend/team-mail' },
  });
});

test('an edit sends only the fields that changed, and a blank one clears it', () => {
  const start = draftOf(BOT, []);
  const untouched = recordBody({ ...start, name: 'Goo 2' }, false, start);
  for (const key of ['provider', 'preset', 'model', 'computer', 'connectors', 'template', 'workspace', 'owner']) expect(untouched).not.toHaveProperty(key);
  expect(recordBody({ ...start, agent: '', model: '', computer: '', connectors: [] }, false, start)).toMatchObject({ provider: '', model: '', computer: '', connectors: {} });
});

test('a change of agent starts the model again, and clears a preset the bot had', () => {
  const start = draftOf({ ...BOT, preset: 'claude-review' }, []);
  const moved = withAgent(start, 'codex');
  expect(moved).toMatchObject({ agent: 'codex', model: '' });
  expect(recordBody(moved, false, start)).toMatchObject({ provider: 'codex', preset: '', model: '' });
  expect(withAgent(start, start.agent)).toBe(start);
});

test('a connector gets a free alias from its adapter, and an alias the host refuses or that repeats holds the form', () => {
  expect(freeAlias('connectors://resend/team-mail', [])).toBe('resend');
  expect(freeAlias('connectors://resend/other', ['resend'])).toBe('resend-2');
  expect(connectorsValid([{ alias: 'mail', target: 'connectors://resend/a' }])).toBe(true);
  expect(connectorsValid([{ alias: 'Mail!', target: 'connectors://resend/a' }])).toBe(false);
  expect(connectorsValid([{ alias: 'mail', target: 'connectors://resend/a' }, { alias: 'mail', target: 'connectors://resend/b' }])).toBe(false);
});
