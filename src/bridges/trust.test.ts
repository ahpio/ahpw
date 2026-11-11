import { expect, test } from 'vitest';
import type { RootState } from '@microsoft/agent-host-protocol';
import { answerOf, hostTrustOf, joinedUris, trustAction, trustedOnHost, trustedUris, trustKeyOf, withAnswer, withoutAnswer } from './trust.js';

test('a folder has one spelling, as a path or a URI, with or without its trailing slash', () => {
  expect(trustKeyOf('/work/api')).toBe('file:///work/api');
  expect(trustKeyOf('file:///work/api/')).toBe('file:///work/api');
  expect(trustKeyOf('C:\\work\\api')).toBe('file:///C:/work/api');
  expect(trustKeyOf('file:///')).toBe('file:///');
});

test('a yes and a no are both kept, under the folder\'s one spelling, and only the yes is sent', () => {
  let answers = withAnswer({}, '/work/api/', true);
  answers = withAnswer(answers, 'file:///work/old', false);
  expect(answerOf(answers, 'file:///work/api')).toBe(true);
  expect(answerOf(answers, '/work/old')).toBe(false);
  expect(answerOf(answers, '/work/new')).toBeUndefined();
  expect(trustedUris(answers)).toEqual(['file:///work/api']);
});

test('forgetting an answer drops it, so the folder is asked about again', () => {
  const answers = withoutAnswer(withAnswer(withAnswer({}, '/a', true), '/b', true), '/a/');
  expect(answerOf(answers, '/a')).toBeUndefined();
  expect(trustedUris(answers)).toEqual(['file:///b']);
});

test('the push replaces the host\'s list, and an empty one trusts nothing', () => {
  expect(trustAction(['file:///work/api'])).toEqual({ type: 'root/configChanged', config: { workspaceTrust: { enabled: true, trustedUris: ['file:///work/api'] } } });
  expect(trustAction([])).toEqual({ type: 'root/configChanged', config: { workspaceTrust: { enabled: true, trustedUris: [] } } });
});

const rootWith = (values: Record<string, unknown>): RootState => ({ config: { schema: { type: 'object', properties: {} }, values } }) as unknown as RootState;

test('the host\'s trust is read from its root config, and none held is none', () => {
  expect(hostTrustOf(rootWith({ workspaceTrust: { enabled: true, trustedUris: ['file:///github/ahpd', 3] } }))).toEqual({ enabled: true, trustedUris: ['file:///github/ahpd'] });
  expect(hostTrustOf(rootWith({}))).toBeUndefined();
  expect(hostTrustOf(undefined)).toBeUndefined();
});

test('the host trusts a folder it lists, or one under it, and every folder when trust is off', () => {
  const trust = { enabled: true, trustedUris: ['file:///github/ahpd', 'file:///home/softov/'] };
  expect(trustedOnHost(trust, '/github/ahpd')).toBe(true);
  expect(trustedOnHost(trust, 'file:///github/ahpd/packages/sdk')).toBe(true);
  expect(trustedOnHost(trust, '/home/softov/work')).toBe(true);
  expect(trustedOnHost(trust, '/github/ahpdx')).toBe(false);
  expect(trustedOnHost(trust, '/github')).toBe(false);
  expect(trustedOnHost({ enabled: false, trustedUris: [] }, '/anywhere')).toBe(true);
  expect(trustedOnHost(undefined, '/github/ahpd')).toBe(false);
});

test('a push joins this browser\'s folders to the host\'s list, so none another window trusted is dropped', () => {
  const trust = { enabled: true, trustedUris: ['file:///github/ahpd', 'file:///home/softov'] };
  expect(joinedUris(trust, ['file:///github/ahpc', 'file:///github/ahpd/'])).toEqual(['file:///github/ahpd', 'file:///home/softov', 'file:///github/ahpc']);
  expect(joinedUris(undefined, ['file:///github/ahpc'])).toEqual(['file:///github/ahpc']);
});
