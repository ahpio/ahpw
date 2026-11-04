import { expect, test } from 'vitest';
import { bytesWords, factsOf, lineOf, titleOf, trafficWords } from './rows.js';

test('a row is titled by its name, else its client id', () => {
  expect(titleOf(factsOf({ id: '3', clientId: 'abc', name: 'ahpw' }))).toBe('ahpw');
  expect(titleOf(factsOf({ id: '3', clientId: 'abc' }))).toBe('abc');
});

test('a row\'s line is the person and the address, each when known', () => {
  expect(lineOf(factsOf({ clientId: 'a', principal: 'user:ana', address: '10.0.0.2' }))).toBe('user:ana \u{00B7} 10.0.0.2');
  expect(lineOf(factsOf({ clientId: 'a', address: '10.0.0.2' }))).toBe('10.0.0.2');
  expect(lineOf(factsOf({ clientId: 'a' }))).toBe('');
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
