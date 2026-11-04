import { expect, test } from 'vitest';
import { detailOf, dotOf, factsOf, statusKey } from './tunnels.js';

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
