import { expect, test } from 'vitest';
import { bytesWords, clientWords, factsOf, IDLE_AFTER_MS, isIdle, lineOf, rateOf, titleOf, trafficWords } from './rows.js';

test('a row is titled by the title it declared, else its name, else its client id', () => {
  expect(titleOf(factsOf({ id: '3', clientId: 'abc', name: 'ahpc', clientTitle: 'AHP Console' }))).toBe('AHP Console');
  expect(titleOf(factsOf({ id: '3', clientId: 'abc', name: 'ahpw' }))).toBe('ahpw');
  expect(titleOf(factsOf({ id: '3', clientId: 'abc' }))).toBe('abc');
});

test('a row\'s line is the client and its version, who it is, and the address, each when known', () => {
  expect(lineOf(factsOf({ clientId: 'a', name: 'ahpc', clientVersion: '0.9.0', principal: 'ana', address: '10.0.0.2' }), 'Host token'))
    .toBe('ahpc 0.9.0 \u{00B7} ana \u{00B7} 10.0.0.2');
  // A socket on the deployment's own token has no person, and says so.
  expect(lineOf(factsOf({ clientId: 'a', root: true, address: '10.0.0.2' }), 'Host token')).toBe('Host token \u{00B7} 10.0.0.2');
  expect(lineOf(factsOf({ clientId: 'a', address: '10.0.0.2' }), 'Host token')).toBe('10.0.0.2');
  expect(lineOf(factsOf({ clientId: 'a' }), 'Host token')).toBe('');
});

test('the client reads as its name and version, the title standing in for a missing name', () => {
  expect(clientWords(factsOf({ clientId: 'a', name: 'ahpc', clientVersion: '0.9.0' }))).toBe('ahpc 0.9.0');
  expect(clientWords(factsOf({ clientId: 'a', clientTitle: 'Console' }))).toBe('Console');
  expect(clientWords(factsOf({ clientId: 'a', clientVersion: '1.0.0' }))).toBe('1.0.0');
  expect(clientWords(factsOf({ clientId: 'a' }))).toBeUndefined();
});

test('the channels it follows are read from subscriptions, as ahpd sends them', () => {
  expect(factsOf({ clientId: 'a', subscriptions: ['ahp-root://', 'x-ahpd-clients://', 3] }).watching).toEqual(['ahp-root://', 'x-ahpd-clients://']);
  expect(factsOf({ clientId: 'a', watching: ['ahp-root://'] }).watching).toEqual([]);
});

test('every field ahpd sends on a row is read, and a field of the wrong type is left out', () => {
  const facts = factsOf({
    clientId: 'a', clientVersion: '0.9.0', clientTitle: 'Console', capabilities: ['mcpApps'],
    principal: 'ana', roles: ['admin'], team: 'core', principalUntil: 5000, root: false,
    path: '/', node: 'node-a', userAgent: 'ahpc/0.9.0', origin: 'https://example.test',
    arrival: 'reconnect', authenticated: ['https://api.example.test'], sessions: ['ahp-session:/s1'],
    lastIn: 100, lastOut: 200, lastPing: 150, queuedBytes: 10, queueLimit: 1000, refused: 2,
  });
  expect(facts).toMatchObject({
    clientVersion: '0.9.0', clientTitle: 'Console', capabilities: ['mcpApps'],
    principal: 'ana', roles: ['admin'], team: 'core', principalUntil: 5000, root: false,
    path: '/', node: 'node-a', userAgent: 'ahpc/0.9.0', origin: 'https://example.test',
    arrival: 'reconnect', authenticated: ['https://api.example.test'], sessions: ['ahp-session:/s1'],
    lastIn: 100, lastOut: 200, lastPing: 150, queuedBytes: 10, queueLimit: 1000, refused: 2,
  });
  const odd = factsOf({ clientId: 'a', arrival: 'later', refused: '2', roles: 'admin' });
  expect(odd.arrival).toBeUndefined();
  expect(odd.refused).toBeUndefined();
  expect(odd.roles).toEqual([]);
});

test('a connection is idle once no frame has crossed either way for a minute, and never when it says no time', () => {
  const facts = factsOf({ clientId: 'a', lastIn: 1000, lastOut: 5000 });
  expect(isIdle(facts, 5000 + IDLE_AFTER_MS)).toBe(false);
  expect(isIdle(facts, 5001 + IDLE_AFTER_MS)).toBe(true);
  expect(isIdle(factsOf({ clientId: 'a' }), 10 * IDLE_AFTER_MS)).toBe(false);
});

test('the rate is the bytes each way a second between two readings, and none when they cannot be compared', () => {
  expect(rateOf({ bytesIn: 1000, bytesOut: 0, at: 0 }, { bytesIn: 6000, bytesOut: 500, at: 5000 })).toEqual({ bytesIn: 1000, bytesOut: 100 });
  expect(rateOf({ bytesIn: 0, bytesOut: 0, at: 5000 }, { bytesIn: 10, bytesOut: 10, at: 5000 })).toBeUndefined();
  // A counter that went back is a new socket under the same row, not a negative rate.
  expect(rateOf({ bytesIn: 500, bytesOut: 0, at: 0 }, { bytesIn: 10, bytesOut: 0, at: 5000 })).toBeUndefined();
});

test('the traffic is read only when all four counters came', () => {
  expect(factsOf({ clientId: 'a', framesIn: 1, framesOut: 2, bytesIn: 3 }).traffic).toBeUndefined();
  expect(factsOf({ clientId: 'a', framesIn: 1, framesOut: 2, bytesIn: 1500, bytesOut: 2_500_000 }).traffic)
    .toEqual({ framesIn: 1, framesOut: 2, bytesIn: 1500, bytesOut: 2_500_000 });
});

test('bytes read as B, kB and MB', () => {
  expect(bytesWords(999)).toBe('999 B');
  expect(bytesWords(1500)).toBe('1.5 kB');
  expect(bytesWords(2_500_000)).toBe('2.5 MB');
  expect(trafficWords({ framesIn: 0, framesOut: 0, bytesIn: 10, bytesOut: 2000 })).toBe('\u{2193} 10 B \u{00B7} \u{2191} 2.0 kB');
});
