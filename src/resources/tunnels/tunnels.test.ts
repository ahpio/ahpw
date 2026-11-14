import { expect, test } from 'vitest';
import { detailOf, dotOf, factsOf, kindSchema, settingRows, statusKey, type TunnelsState } from './tunnels.js';

test('a row\'s dot and word follow a running operation first, then the status', () => {
  const running = factsOf({ id: 'a', kind: 'devtunnel', status: 'running', url: 'https://x' });
  expect([dotOf(running), statusKey(running)]).toEqual(['ok', 'running']);
  const failed = factsOf({ id: 'a', kind: 'devtunnel', status: 'error', error: 'token expired' });
  expect([dotOf(failed), statusKey(failed)]).toEqual(['failed', 'error']);
  const off = factsOf({ id: 'a', kind: 'devtunnel', enabled: false });
  expect([dotOf(off), statusKey(off)]).toEqual(['off', 'disabled']);
  const stopped = factsOf({ id: 'a', kind: 'devtunnel', enabled: true });
  expect(statusKey(stopped)).toBe('stopped');
  const busy = factsOf({ id: 'a', kind: 'devtunnel', status: 'running', operation: { id: 'devtunnel/disable', status: 'running' } });
  expect([dotOf(busy), statusKey(busy)]).toEqual(['working', 'busy']);
});

test('a row\'s line is its error, else its URL, else the status word', () => {
  expect(detailOf(factsOf({ status: 'error', error: 'no token', url: 'https://x' }), 'error')).toBe('no token');
  expect(detailOf(factsOf({ status: 'running', url: 'https://x' }), 'running')).toBe('https://x');
  expect(detailOf(factsOf({}), 'stopped')).toBe('stopped');
});

test('the settings are every field the host does not keep, a secret as its reference', () => {
  const facts = factsOf({ id: 'a', kind: 'k', plugin: 'p', purpose: 'person', enabled: true, owner: '', status: 'running', url: 'u', port: 37537, token: { $secret: 'tunnel/a/token' } });
  expect(facts.settings).toEqual({ port: 37537, token: { $secret: 'tunnel/a/token' } });
});

test('a row\'s operations are the host\'s, not a setting', () => {
  const facts = factsOf({ id: 'a', kind: 'k', port: 37537, operations: ['k/update', 'k/stop'] });
  expect(facts.settings).toEqual({ port: 37537 });
});

test('the settings follow the kind\'s schema: its titles, its order, and a default or nothing where the record holds none', () => {
  const schema = {
    type: 'object',
    properties: {
      port: { type: 'number', title: 'Port' },
      anonymous: { type: 'boolean', title: 'Anonymous', default: false },
      person: { type: 'string', title: 'Person' },
      requireToken: { type: 'boolean', title: 'Require a token', default: false },
    },
  };
  expect(settingRows(schema, { anonymous: true, port: 37537 })).toEqual([
    { field: 'port', label: 'Port', value: 37537 },
    { field: 'anonymous', label: 'Anonymous', value: true },
    { field: 'person', label: 'Person', value: undefined },
    { field: 'requireToken', label: 'Require a token', value: false },
  ]);
});

test('with no schema the settings are what the record holds, by field name', () => {
  expect(settingRows(undefined, { port: 1 })).toEqual([{ field: 'port', label: 'port', value: 1 }]);
});

test('a kind\'s schema is its create operation\'s input', () => {
  const input = { type: 'object', properties: {} };
  const state = { records: [], operations: [{ id: 'devtunnel/create', kind: 'devtunnel', scopes: ['list'], input, status: 'idle' }, { id: 'devtunnel/update', kind: 'devtunnel', scopes: ['tunnel'], input: {}, status: 'idle' }] } as unknown as TunnelsState;
  expect(kindSchema(state, 'devtunnel')).toBe(input);
  expect(kindSchema(state, 'other')).toBeUndefined();
});
